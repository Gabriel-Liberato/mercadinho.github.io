const loginScreen = document.getElementById('login-screen');
const catalogScreen = document.getElementById('catalog-screen');
const cartScreen = document.getElementById('cart-screen');
const checkoutScreen = document.getElementById('checkout-screen');
const orderConfirmationScreen = document.getElementById('order-confirmation-screen');

const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');
const cartButton = document.getElementById('cart-button');
const cartCount = document.getElementById('cart-count');

const productList = document.getElementById('product-list');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');
const checkoutButton = document.getElementById('checkout-button');
const backToCatalogButton = document.getElementById('back-to-catalog-button');

const checkoutProductList = document.getElementById('checkout-product-list');
const checkoutTotalElement = document.getElementById('checkout-total');
const checkoutForm = document.getElementById('checkout-form');
const newPurchaseButton = document.getElementById('new-purchase-button');

let products = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = localStorage.getItem('currentUser');

// Funções de controle de tela
function showScreen(screenId) {
    const screens = [loginScreen, catalogScreen, cartScreen, checkoutScreen, orderConfirmationScreen];
    screens.forEach(screen => {
        screen.style.display = 'none';
    });
    document.getElementById(screenId).style.display = 'block';
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
}

function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotalElement.textContent = total.toFixed(2);
}

// Lógica de Autenticação
function handleLogin(event) {
    event.preventDefault();
    const username = usernameInput.value;
    const password = passwordInput.value;

    // Simulação de login: qualquer usuário/senha não vazios funciona
    if (username && password) {
        localStorage.setItem('currentUser', username);
        currentUser = username;
        loginError.style.display = 'none';
        initializeApp();
    } else {
        loginError.style.display = 'block';
    }
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('cart'); // Limpa o carrinho ao deslogar
    currentUser = null;
    cart = [];
    updateCartCount();
    welcomeMessage.textContent = '';
    logoutButton.style.display = 'none';
    showScreen('login-screen');
}

// Lógica do Catálogo
async function fetchProducts() {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        productList.innerHTML = '<p>Erro ao carregar produtos. Tente novamente mais tarde.</p>';
    }
}

function displayProducts() {
    productList.innerHTML = '';
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.title}">
            <h3>${product.title}</h3>
            <p>${product.description.substring(0, 100)}...</p>
            <p class="price">R$ ${product.price.toFixed(2)}</p>
            <button data-id="${product.id}">Adicionar ao Carrinho</button>
        `;
        productList.appendChild(productCard);
    });

    productList.querySelectorAll('.product-card button').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = parseInt(event.target.dataset.id);
            addProductToCart(productId);
        });
    });
}

// Lógica do Carrinho
function addProductToCart(productId) {
    const existingItem = cart.find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity++;
    } else {
        const product = products.find(p => p.id === productId);
        if (product) {
            cart.push({ ...product, quantity: 1 });
        }
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart(); // Renderiza o carrinho se estiver na tela do carrinho
}

function removeProductFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCart();
}

function updateItemQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeProductFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            renderCart();
        }
    }
}

function renderCart() {
    cartItemsContainer.innerHTML = '';
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p>Seu carrinho está vazio.</p>';
        checkoutButton.disabled = true;
    } else {
        checkoutButton.disabled = false;
        cart.forEach(item => {
            const cartItemDiv = document.createElement('div');
            cartItemDiv.classList.add('cart-item');
            cartItemDiv.innerHTML = `
                <div class="cart-item-info">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="cart-item-details">
                        <h4>${item.title}</h4>
                        <p>R$ ${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                </div>
                <div class="cart-item-controls">
                    <button class="quantity-btn decrease" data-id="${item.id}">-</button>
                    <span>${item.quantity}</span>
                    <button class="quantity-btn increase" data-id="${item.id}">+</button>
                    <button class="remove-btn" data-id="${item.id}">Remover</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemDiv);
        });

        cartItemsContainer.querySelectorAll('.quantity-btn.decrease').forEach(button => {
            button.addEventListener('click', (event) => updateItemQuantity(parseInt(event.target.dataset.id), -1));
        });
        cartItemsContainer.querySelectorAll('.quantity-btn.increase').forEach(button => {
            button.addEventListener('click', (event) => updateItemQuantity(parseInt(event.target.dataset.id), 1));
        });
        cartItemsContainer.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', (event) => removeProductFromCart(parseInt(event.target.dataset.id)));
        });
    }
    updateCartTotal();
}

// Lógica de Checkout
function renderCheckoutSummary() {
    checkoutProductList.innerHTML = '';
    let total = 0;
    if (cart.length === 0) {
        checkoutProductList.innerHTML = '<p>Seu carrinho está vazio.</p>';
        checkoutForm.style.display = 'none';
    } else {
        checkoutForm.style.display = 'flex';
        cart.forEach(item => {
            const checkoutItemDiv = document.createElement('div');
            checkoutItemDiv.classList.add('checkout-item');
            checkoutItemDiv.innerHTML = `
                <span>${item.title} (x${item.quantity})</span>
                <span>R$ ${(item.price * item.quantity).toFixed(2)}</span>
            `;
            checkoutProductList.appendChild(checkoutItemDiv);
            total += (item.price * item.quantity);
        });
    }
    checkoutTotalElement.textContent = total.toFixed(2);
}

function handleCheckout(event) {
    event.preventDefault();
    const address = document.getElementById('delivery-address').value;
    const city = document.getElementById('delivery-city').value;
    const zip = document.getElementById('delivery-zip').value;
    const paymentMethod = document.getElementById('payment-method').value;

    if (cart.length > 0 && address && city && zip && paymentMethod) {
        // Simula o processamento do pedido
        console.log('Pedido Confirmado!', {
            items: cart,
            address,
            city,
            zip,
            paymentMethod,
            total: checkoutTotalElement.textContent
        });

        cart = []; // Limpa o carrinho
        localStorage.removeItem('cart');
        updateCartCount();
        showScreen('order-confirmation-screen');
    } else {
        alert('Por favor, preencha todas as informações de entrega e escolha um método de pagamento.');
    }
}

// Inicialização da Aplicação
function initializeApp() {
    if (currentUser) {
        welcomeMessage.textContent = `Olá, ${currentUser}!`;
        logoutButton.style.display = 'inline-block';
        showScreen('catalog-screen');
        fetchProducts();
        updateCartCount();
    } else {
        showScreen('login-screen');
        welcomeMessage.textContent = '';
        logoutButton.style.display = 'none';
    }
}

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
logoutButton.addEventListener('click', handleLogout);

cartButton.addEventListener('click', () => {
    showScreen('cart-screen');
    renderCart();
});

checkoutButton.addEventListener('click', () => {
    showScreen('checkout-screen');
    renderCheckoutSummary();
});

backToCatalogButton.addEventListener('click', () => {
    showScreen('catalog-screen');
});

checkoutForm.addEventListener('submit', handleCheckout);

newPurchaseButton.addEventListener('click', () => {
    showScreen('catalog-screen');
    fetchProducts(); // Recarrega os produtos para uma nova compra
});

// Chamar a inicialização quando a página carregar
document.addEventListener('DOMContentLoaded', initializeApp);