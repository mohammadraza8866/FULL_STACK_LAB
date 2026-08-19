// ---- Product catalog ----
const PRODUCTS = [
  { id: 1, name: "Classic Crew Tee", price: 999, image: "images/product-1.jpg" },
  { id: 2, name: "Relaxed Fit Tee", price: 1299, image: "images/product-2.jpg" },
  { id: 3, name: "Everyday Basic Tee", price: 799, image: "images/product-3.jpg" },
  { id: 4, name: "Premium Cotton Tee", price: 1499, image: "images/product-4.jpg" },
  { id: 5, name: "Graphic Print Tee", price: 599, image: "images/product-1.jpg" },
  { id: 6, name: "Oversized Tee", price: 1999, image: "images/product-2.jpg" },
  { id: 7, name: "V-Neck Tee", price: 899, image: "images/product-3.jpg" },
  { id: 8, name: "Long Sleeve Tee", price: 1099, image: "images/product-4.jpg" },
];

function formatPrice(amount) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// ---- Cart storage (localStorage) ----
function getCart() {
  return JSON.parse(localStorage.getItem("cart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

function addToCart(productId, qty = 1) {
  const cart = getCart();
  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, qty });
  }
  saveCart(cart);
  updateCartBadge();
}

function removeFromCart(productId) {
  const cart = getCart().filter((item) => item.id !== productId);
  saveCart(cart);
  renderCart();
  updateCartBadge();
}

// ---- Navbar cart badge ----
function updateCartBadge() {
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  const count = getCart().reduce((sum, item) => sum + item.qty, 0);
  badge.textContent = count;
}

// ---- products.html: dynamic product grid ----
function renderProducts() {
  const grid = document.getElementById("product-grid");
  if (!grid) return;

  grid.innerHTML = PRODUCTS.map(
    (p) => `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}">
        <h3>${p.name}</h3>
        <p class="price">${formatPrice(p.price)}</p>
        <button class="btn add-to-cart-btn" data-id="${p.id}">Add to Cart</button>
      </div>
    `
  ).join("");

  grid.querySelectorAll(".add-to-cart-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      addToCart(Number(btn.dataset.id));
      const originalText = btn.textContent;
      btn.textContent = "Added ✓";
      setTimeout(() => {
        btn.textContent = originalText;
      }, 1000);
    });
  });
}

// ---- product-detail.html: single product add-to-cart ----
function initProductDetail() {
  const section = document.querySelector(".product-detail");
  if (!section) return;

  const btn = section.querySelector(".btn");
  const qtyInput = document.getElementById("quantity");

  btn.addEventListener("click", () => {
    const qty = Math.max(1, Number(qtyInput.value) || 1);
    addToCart(PRODUCTS[0].id, qty);
    const originalText = btn.textContent;
    btn.textContent = "Added ✓";
    setTimeout(() => {
      btn.textContent = originalText;
    }, 1000);
  });
}

// ---- cart.html: dynamic cart rendering ----
function renderCart() {
  const body = document.getElementById("cart-body");
  if (!body) return;

  const cart = getCart();

  if (cart.length === 0) {
    body.innerHTML = `<tr><td colspan="5" class="empty-cart">Your cart is empty.</td></tr>`;
    calculateTotal();
    return;
  }

  body.innerHTML = cart
    .map((item) => {
      const product = PRODUCTS.find((p) => p.id === item.id);
      if (!product) return "";
      const subtotal = product.price * item.qty;
      return `
        <tr data-id="${product.id}">
          <td>${product.name}</td>
          <td><input type="number" class="qty-input" min="1" value="${item.qty}" data-id="${product.id}"></td>
          <td>${formatPrice(product.price)}</td>
          <td class="subtotal">${formatPrice(subtotal)}</td>
          <td><button class="remove-btn" data-id="${product.id}">Remove</button></td>
        </tr>
      `;
    })
    .join("");

  body.querySelectorAll(".qty-input").forEach((input) => {
    input.addEventListener("input", (e) => {
      const id = Number(e.target.dataset.id);
      const qty = Math.max(1, Number(e.target.value) || 1);

      const cart = getCart();
      const item = cart.find((i) => i.id === id);
      if (item) item.qty = qty;
      saveCart(cart);

      const product = PRODUCTS.find((p) => p.id === id);
      const row = body.querySelector(`tr[data-id="${id}"]`);
      row.querySelector(".subtotal").textContent = formatPrice(product.price * qty);

      calculateTotal();
      updateCartBadge();
    });
  });

  body.querySelectorAll(".remove-btn").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.id)));
  });

  calculateTotal();
}

function calculateTotal() {
  const totalEl = document.getElementById("cart-grand-total");
  if (!totalEl) return;

  const total = getCart().reduce((sum, item) => {
    const product = PRODUCTS.find((p) => p.id === item.id);
    return sum + (product ? product.price * item.qty : 0);
  }, 0);

  totalEl.textContent = formatPrice(total);
}

// ---- checkout.html: form validation ----
function initCheckoutForm() {
  const form = document.getElementById("checkout-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    clearErrors(form);

    let valid = true;
    const name = form.name.value.trim();
    const address = form.address.value.trim();
    const pincode = form.pincode.value.trim();
    const phone = form.phone.value.trim();

    if (!name) {
      showError("name", "Name is required.");
      valid = false;
    }
    if (!address) {
      showError("address", "Address is required.");
      valid = false;
    }
    if (!/^\d{6}$/.test(pincode)) {
      showError("pincode", "Pincode must be exactly 6 digits.");
      valid = false;
    }
    if (!/^\d{10}$/.test(phone)) {
      showError("phone", "Phone must be exactly 10 digits.");
      valid = false;
    }

    if (!valid) return;

    localStorage.removeItem("cart");
    updateCartBadge();

    form.hidden = true;
    document.getElementById("order-confirmation").hidden = false;
  });
}

function showError(fieldName, message) {
  const field = document.getElementById(fieldName);
  const errorEl = document.getElementById(`${fieldName}-error`);
  if (errorEl) errorEl.textContent = message;
  if (field) field.classList.add("input-error");
}

function clearErrors(form) {
  form.querySelectorAll(".error-message").forEach((el) => (el.textContent = ""));
  form.querySelectorAll("input").forEach((el) => el.classList.remove("input-error"));
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderProducts();
  initProductDetail();
  renderCart();
  initCheckoutForm();
});
