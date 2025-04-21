// DOM Elements
const productsContainer = document.getElementById('products-container');
const categoryButtons = document.querySelectorAll('.category-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartLinks = document.querySelectorAll('.cart-link');

// State
let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Fetch from DummyJSON & FakeStoreAPI
async function fetchAllProducts() {
    try {
        productsContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Loading products...</div>';

        const [dummyRes, fakeRes] = await Promise.all([
            fetch('https://dummyjson.com/products'),
            fetch('https://fakestoreapi.com/products')
        ]);

        const dummyData = await dummyRes.json(); // .products
        const fakeData = await fakeRes.json();   // array

        const mergedProducts = [
            ...dummyData.products.map(p => ({
                id: `dummy-${p.id}`,
                title: p.title,
                price: p.price,
                image: p.thumbnail || p.images[0],
                category: p.category,
                rating: { rate: p.rating, count: p.stock },
                source: 'dummy'
            })),
            ...fakeData.map(p => ({
                id: `fake-${p.id}`,
                title: p.title,
                price: p.price,
                image: p.image,
                category: p.category,
                rating: p.rating,
                source: 'fakestore'
            }))
        ];

        products = mergedProducts;
        displayProducts(products);
    } catch (error) {
        productsContainer.innerHTML = '<div class="error-message">Failed to load products. Please try again later.</div>';
        console.error('Error fetching products:', error);
    }
}

// Display products
function displayProducts(productsToDisplay) {
    productsContainer.innerHTML = '';

    if (productsToDisplay.length === 0) {
        productsContainer.innerHTML = '<div class="no-products">No products found in this category.</div>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.title}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.title}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <p class="product-rating">
                    ${'★'.repeat(Math.round(product.rating?.rate || 0))}${'☆'.repeat(5 - Math.round(product.rating?.rate || 0))}
                    (${product.rating?.count || 0})
                </p>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        `;
        productsContainer.appendChild(productCard);
    });

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Filter by category
function filterProducts(category) {
    if (category === 'all') {
        displayProducts(products);
    } else {
        const filtered = products.filter(product => product.category.toLowerCase().includes(category.toLowerCase()));
        displayProducts(filtered);
    }
}

// Add to cart
function addToCart(event) {
    const productId = event.target.dataset.id;
    const product = products.find(p => p.id === productId);

    const existing = cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCart();
    showCartNotification(product.title);
}

// Notification
function showCartNotification(productName) {
    const notification = document.createElement('div');
    notification.className = 'cart-notification';
    notification.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${productName} added to cart</span>
    `;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
    }, 3000);
}

// Update cart
function updateCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    cartCount.textContent = cart.reduce((total, item) => total + item.quantity, 0);

    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
        cartTotal.textContent = '$0.00';
        return;
    }

    let totalPrice = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        totalPrice += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-image">
                <img src="${item.image}" alt="${item.title}">
            </div>
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.title}</h4>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                <div class="cart-item-quantity">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                </div>
                <p class="remove-item" data-id="${item.id}">Remove</p>
            </div>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    cartTotal.textContent = `$${totalPrice.toFixed(2)}`;

    document.querySelectorAll('.decrease').forEach(btn => btn.addEventListener('click', decreaseQuantity));
    document.querySelectorAll('.increase').forEach(btn => btn.addEventListener('click', increaseQuantity));
    document.querySelectorAll('.remove-item').forEach(btn => btn.addEventListener('click', removeItem));
}

function decreaseQuantity(e) {
    const id = e.target.dataset.id;
    const item = cart.find(p => p.id === id);
    if (item.quantity > 1) item.quantity--;
    else cart = cart.filter(p => p.id !== id);
    updateCart();
}

function increaseQuantity(e) {
    const id = e.target.dataset.id;
    const item = cart.find(p => p.id === id);
    item.quantity++;
    updateCart();
}

function removeItem(e) {
    const id = e.target.dataset.id;
    cart = cart.filter(p => p.id !== id);
    updateCart();
}

// Toggle cart sidebar
function toggleCart() {
    cartSidebar.classList.toggle('open');
}

// Init app
function init() {
    fetchAllProducts();
    updateCart();

    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            filterProducts(button.dataset.category);
        });
    });

    cartLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            toggleCart();
        });
    });

    document.querySelector('.close-cart').addEventListener('click', toggleCart);
}
init();

// Add cart notification styles
const style = document.createElement('style');
style.textContent = `
    .cart-notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        opacity: 0;
        transition: opacity 0.3s;
        z-index: 1001;
    }
    .cart-notification.show {
        opacity: 1;
    }
    .cart-notification i {
        font-size: 1.2rem;
    }
`;
document.head.appendChild(style);
document.getElementById('backToTop').addEventListener('click', function() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Show/hide button based on scroll position
window.addEventListener('scroll', function() {
    var backToTopButton = document.getElementById('backToTop');
    if (window.pageYOffset > 300) {
        backToTopButton.style.display = 'block';
    } else {
        backToTopButton.style.display = 'none';
    }
});