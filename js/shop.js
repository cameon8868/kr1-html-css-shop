/* Общие для всех страниц функции темы, поиска и корзины. */
(function () {
  const themeButton = document.querySelector('[data-theme-toggle]');
  const themeIcon = document.querySelector('[data-theme-icon]');
  const themeKey = 'shop-theme';

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    if (themeButton) {
      const isDark = theme === 'dark';
      themeButton.setAttribute('aria-pressed', String(isDark));
      themeButton.setAttribute('aria-label', isDark ? 'Включить светлую тему' : 'Включить тёмную тему');
      themeIcon.textContent = isDark ? '☀' : '☾';
    }
  }

  applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  if (themeButton) {
    themeButton.addEventListener('click', function () {
      const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(theme);
      try {
        localStorage.setItem(themeKey, theme);
      } catch (error) {
        console.warn('Не удалось сохранить тему:', error);
      }
    });
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'cart-dialog';
  dialog.setAttribute('aria-labelledby', 'cart-title');

  const heading = document.createElement('h2');
  heading.id = 'cart-title';
  heading.textContent = 'Корзина';

  const items = document.createElement('ul');
  items.className = 'cart-list';

  const total = document.createElement('p');
  total.className = 'cart-total';
  total.setAttribute('aria-live', 'polite');

  const empty = document.createElement('p');
  empty.className = 'cart-empty';
  empty.textContent = 'Корзина пока пуста.';

  const actions = document.createElement('div');
  actions.className = 'cart-actions';

  const closeButton = document.createElement('button');
  closeButton.className = 'button button--secondary';
  closeButton.type = 'button';
  closeButton.textContent = 'Продолжить покупки';
  closeButton.addEventListener('click', function () { dialog.close(); });

  const checkoutButton = document.createElement('button');
  checkoutButton.className = 'button button--primary';
  checkoutButton.type = 'button';
  checkoutButton.textContent = 'Оформить заказ';

  actions.append(closeButton, checkoutButton);
  dialog.append(heading, empty, items, total, actions);
  document.body.append(dialog);

  const cartKey = 'shop-cart';
  let cart = [];
  let checkoutPending = false;

  function loadCart() {
    try {
      const saved = JSON.parse(localStorage.getItem(cartKey) || '[]');
      if (!Array.isArray(saved)) throw new TypeError('Ожидался список товаров');
      return saved.filter(function (item) {
        return item && PRODUCTS.some(function (product) { return product.id === item.id; }) &&
          Number.isInteger(item.quantity) && item.quantity > 0;
      });
    } catch (error) {
      console.warn('Не удалось загрузить корзину:', error);
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
    } catch (error) {
      console.error('Не удалось сохранить корзину:', error);
    }
  }

  function productFor(id) {
    return PRODUCTS.find(function (product) { return product.id === id; });
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('ru-RU') + ' руб.';
  }

  function updateCount() {
    const count = cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    document.querySelectorAll('[data-cart-count]').forEach(function (element) {
      element.textContent = String(count);
    });
  }

  function renderCart() {
    items.replaceChildren();
    let sum = 0;

    cart.forEach(function (item) {
      const product = productFor(item.id);
      if (!product) return;
      sum += product.price * item.quantity;

      const row = document.createElement('li');
      row.className = 'cart-item';
      const name = document.createElement('strong');
      name.textContent = product.title;
      const price = document.createElement('span');
      price.textContent = formatPrice(product.price * item.quantity);

      const controls = document.createElement('div');
      controls.className = 'cart-item__controls';
      [['−', 'decrease', 'Уменьшить количество'], ['+', 'increase', 'Увеличить количество'], ['Удалить', 'remove', 'Удалить товар']].forEach(function (entry) {
        const button = document.createElement('button');
        button.className = 'button button--secondary';
        button.type = 'button';
        button.dataset.cartAction = entry[1];
        button.dataset.productId = item.id;
        button.setAttribute('aria-label', entry[2] + ': ' + product.title);
        button.textContent = entry[0];
        controls.append(button);
      });

      row.append(name, price, controls);
      items.append(row);
    });

    empty.hidden = cart.length > 0;
    items.hidden = cart.length === 0;
    total.hidden = cart.length === 0;
    total.textContent = 'Итого: ' + formatPrice(sum);
    checkoutButton.disabled = cart.length === 0;
    updateCount();
  }

  cart = loadCart();
  renderCart();

  document.querySelectorAll('[data-cart-open]').forEach(function (button) {
    button.addEventListener('click', function () {
      renderCart();
      dialog.showModal();
    });
  });

  document.addEventListener('click', function (event) {
    const addButton = event.target.closest('[data-cart-add]');
    if (!addButton) return;
    const product = productFor(addButton.dataset.cartAdd);
    if (!product) return;

    const existing = cart.find(function (item) { return item.id === product.id; });
    if (existing) existing.quantity += 1;
    else cart.push({ id: product.id, quantity: 1 });

    saveCart();
    renderCart();
    addButton.textContent = 'Добавлено';
    window.setTimeout(function () {
      if (addButton.isConnected) addButton.textContent = 'В корзину';
    }, 1200);
  });

  items.addEventListener('click', function (event) {
    const button = event.target.closest('[data-cart-action]');
    if (!button) return;
    const item = cart.find(function (entry) { return entry.id === button.dataset.productId; });
    if (!item) return;

    if (button.dataset.cartAction === 'increase') item.quantity += 1;
    if (button.dataset.cartAction === 'decrease') item.quantity -= 1;
    if (button.dataset.cartAction === 'remove' || item.quantity <= 0) {
      cart = cart.filter(function (entry) { return entry.id !== item.id; });
    }
    saveCart();
    renderCart();
  });

  checkoutButton.addEventListener('click', function () {
    const orderDialog = document.getElementById('order-dialog');
    const selectedProduct = document.getElementById('selected-product');
    if (!orderDialog || !selectedProduct) {
      window.location.href = 'index.html#popular';
      return;
    }

    selectedProduct.value = cart.map(function (item) {
      const product = productFor(item.id);
      return product.title + ' × ' + item.quantity;
    }).join(', ');

    const title = document.getElementById('order-dialog-title');
    if (title) title.textContent = 'Оформление заказа';
    const topic = document.getElementById('order-topic');
    if (topic) topic.value = 'product';
    checkoutPending = true;
    dialog.close();
    orderDialog.showModal();
  });

  const orderForm = document.getElementById('order-form');
  const orderDialog = document.getElementById('order-dialog');
  if (orderForm) {
    orderForm.addEventListener('submit', function (event) {
      if (!checkoutPending || !orderForm.checkValidity()) return;
      cart = [];
      saveCart();
      renderCart();
      checkoutPending = false;
    });
  }
  if (orderDialog) {
    orderDialog.addEventListener('close', function () { checkoutPending = false; });
  }
}());
