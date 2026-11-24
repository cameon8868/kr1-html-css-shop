/* Рендер карточек, фильтрация каталога и форма заявки. */
(function () {
  const productList = document.querySelector('[data-product-list]');
  const orderDialog = document.getElementById('order-dialog');
  const orderForm = document.getElementById('order-form');

  function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function formatPrice(price) {
    return Number(price).toLocaleString('ru-RU') + ' руб.';
  }

  function createCard(product) {
    const card = createElement('article', 'product-card');
    const image = createElement('img', 'product-card__image');
    image.src = product.image;
    image.alt = product.title;
    image.loading = 'lazy';

    const title = createElement('h3', 'product-card__title', product.title);
    const description = createElement('p', 'product-card__description', product.short);
    const link = createElement('a', 'product-card__link', 'Подробнее');
    link.href = 'product.html?id=' + encodeURIComponent(product.id);

    const price = createElement('p', 'product-card__price', formatPrice(product.price));
    const addButton = createElement('button', 'button button--primary product-card__button', 'В корзину');
    addButton.type = 'button';
    addButton.dataset.cartAdd = product.id;

    const orderButton = createElement('button', 'button button--secondary product-card__order-button', 'Заказать');
    orderButton.type = 'button';
    orderButton.dataset.productId = product.id;
    orderButton.dataset.product = product.title;

    if (product.popular) card.classList.add('product-card--featured');
    card.append(image, title, description, link, price, addButton, orderButton);
    return card;
  }

  if (productList) {
    const availableProducts = productList.hasAttribute('data-popular-only')
      ? PRODUCTS.filter(function (product) { return product.popular; })
      : PRODUCTS.slice();

    const form = document.getElementById('filters-form');
    const queryInput = document.getElementById('catalog-search');
    const categoryInput = document.getElementById('filter-category');
    const minInput = document.getElementById('price-from');
    const maxInput = document.getElementById('price-to');
    const popularInput = document.getElementById('filter-popular');
    const newInput = document.getElementById('filter-new');
    const sortInput = document.getElementById('filter-sort');
    const resultCount = document.getElementById('catalog-result-count');

    function renderProducts() {
      const query = queryInput ? queryInput.value.trim().toLocaleLowerCase('ru-RU') : '';
      const category = categoryInput ? categoryInput.value : '';
      const minPrice = minInput && minInput.value !== '' ? Number(minInput.value) : null;
      const maxPrice = maxInput && maxInput.value !== '' ? Number(maxInput.value) : null;
      const minValid = minPrice === null || (Number.isFinite(minPrice) && minPrice >= 0);
      const maxValid = maxPrice === null || (Number.isFinite(maxPrice) && maxPrice >= 0);
      let products = availableProducts.filter(function (product) {
        const searchableText = [product.title, product.short, product.description]
          .join(' ').toLocaleLowerCase('ru-RU');
        return (!query || searchableText.includes(query)) &&
          (!category || product.category === category) &&
          (minPrice === null || product.price >= minPrice) &&
          (maxPrice === null || product.price <= maxPrice) &&
          (!popularInput || !popularInput.checked || product.popular) &&
          (!newInput || !newInput.checked || product.isNew);
      });

      if (sortInput && sortInput.value === 'price-asc') {
        products.sort(function (a, b) { return a.price - b.price; });
      } else if (sortInput && sortInput.value === 'price-desc') {
        products.sort(function (a, b) { return b.price - a.price; });
      } else if (sortInput && sortInput.value === 'title') {
        products.sort(function (a, b) { return a.title.localeCompare(b.title, 'ru'); });
      }

      productList.replaceChildren();
      products.forEach(function (product) { productList.append(createCard(product)); });

      if (resultCount) {
        if (!minValid || !maxValid) {
          resultCount.textContent = 'Введите корректную минимальную цену.';
        } else if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
          resultCount.textContent = 'Минимальная цена не может быть больше максимальной.';
        } else {
          resultCount.textContent = products.length
            ? 'Найдено товаров: ' + products.length
            : 'По заданным условиям товары не найдены.';
        }
      }
    }

    if (form) {
      const initialQuery = new URLSearchParams(window.location.search).get('q') || '';
      queryInput.value = initialQuery;
      renderProducts();
      form.addEventListener('input', renderProducts);
      form.addEventListener('change', renderProducts);
      form.addEventListener('reset', function () {
        window.setTimeout(function () {
          renderProducts();
          const url = new URL(window.location.href);
          url.searchParams.delete('q');
          window.history.replaceState({}, '', url);
        });
      });
    } else {
      renderProducts();
    }
  }

  if (orderDialog && orderForm) {
    const orderTitle = document.getElementById('order-dialog-title');
    const selectedProductInput = document.getElementById('selected-product');
    const topicSelect = document.getElementById('order-topic');
    const successMessage = document.getElementById('success-message');
    const closeButton = document.getElementById('close-order-dialog');

    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-product-id]');
      if (!button || !button.classList.contains('product-card__order-button')) return;
      const product = PRODUCTS.find(function (item) { return item.id === button.dataset.productId; });
      if (!product) return;
      selectedProductInput.value = product.title;
      orderTitle.textContent = 'Заявка: ' + product.title;
      topicSelect.value = 'product';
      orderDialog.showModal();
    });

    closeButton.addEventListener('click', function () { orderDialog.close(); });
    orderDialog.addEventListener('close', function () {
      orderForm.reset();
      orderForm.querySelectorAll('[aria-invalid]').forEach(function (element) {
        element.removeAttribute('aria-invalid');
      });
    });

    orderForm.addEventListener('submit', function (event) {
      event.preventDefault();
      const elements = Array.from(orderForm.elements);
      elements.forEach(function (element) { element.removeAttribute('aria-invalid'); });
      if (!orderForm.checkValidity()) {
        elements.forEach(function (element) {
          if (element.willValidate && !element.checkValidity()) {
            element.setAttribute('aria-invalid', 'true');
          }
        });
        orderForm.reportValidity();
        return;
      }
      orderDialog.close();
      successMessage.hidden = false;
      window.setTimeout(function () { successMessage.hidden = true; }, 4000);
    });
  }

  const scrollTopButton = document.getElementById('scroll-top');
  if (scrollTopButton) {
    window.addEventListener('scroll', function () {
      scrollTopButton.classList.toggle('is-visible', window.scrollY > 400);
    }, { passive: true });
    scrollTopButton.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}());
