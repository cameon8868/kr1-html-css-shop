/* ===============================
   Страница товара: product.html?id=...
   Требует js/products.js (массивы PRODUCTS и REVIEWS)
   =============================== */

const root = document.getElementById('product-root');
const notFound = document.getElementById('not-found');
const related = document.getElementById('related');
const relatedList = document.getElementById('related-list');
const breadcrumbCurrent = document.getElementById('breadcrumb-current');

const orderDialog = document.getElementById('order-dialog');
const orderForm = document.getElementById('order-form');
const orderTitle = document.getElementById('order-dialog-title');
const selectedProductInput = document.getElementById('selected-product');
const topicSelect = document.getElementById('order-topic');
const successMessage = document.getElementById('success-message');

/* Вспомогательная функция: создать элемент с классом и текстом */
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function formatPrice(value) {
  return Number(value).toLocaleString('ru-RU') + ' руб.';
}

/* ===============================
   1. Модальное окно заказа
   Стоит в начале файла, чтобы работало,
   даже если ниже произойдёт ошибка.
   =============================== */

function openOrderDialog(product) {
  selectedProductInput.value = product.title;
  orderTitle.textContent = `Заявка: ${product.title}`;
  topicSelect.value = 'product';
  orderDialog.showModal();
}

/* Кнопка «Закрыть» */
document.getElementById('close-order-dialog').addEventListener('click', () => {
  orderDialog.close();
});

/* Закрытие по Esc (браузер делает это сам, но так надёжнее) */
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && orderDialog.open) {
    orderDialog.close();
  }
});

/* Сброс формы при любом способе закрытия */
orderDialog.addEventListener('close', () => {
  orderForm.reset();
  orderForm.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
  });
});

orderForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const formElements = Array.from(orderForm.elements);
  formElements.forEach((el) => el.removeAttribute('aria-invalid'));

  if (!orderForm.checkValidity()) {
    formElements.forEach((el) => {
      if (el.willValidate && !el.checkValidity()) {
        el.setAttribute('aria-invalid', 'true');
      }
    });
    orderForm.reportValidity();
    return;
  }

  orderDialog.close();

  successMessage.hidden = false;
  setTimeout(() => { successMessage.hidden = true; }, 4000);
});

/* ===============================
   2. Кнопка «Наверх»
   =============================== */

const scrollTopButton = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  scrollTopButton.classList.toggle('is-visible', window.scrollY > 400);
}, { passive: true });

scrollTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ===============================
   3. Вывод товара
   =============================== */

function renderProduct(product) {
  document.title = `${product.title} — Учебный интернет-магазин`;
  breadcrumbCurrent.textContent = product.title;

  const article = createEl('article', 'product-page');

  const image = createEl('img', 'product-page__image');
  image.src = product.image;
  image.alt = product.title;

  const info = createEl('div', 'product-page__info');
  info.append(
    createEl('h1', 'product-page__title', product.title),
    createEl('p', 'product-page__price', `Цена: ${formatPrice(product.price)}`),
    createEl('p', 'product-page__description', product.description)
  );

  const orderButton = createEl('button', 'button product-page__order', 'Заказать');
  orderButton.type = 'button';
  orderButton.addEventListener('click', () => openOrderDialog(product));
  info.append(orderButton);

  const specsBlock = createEl('section', 'product-page__specs');
  specsBlock.append(createEl('h2', null, 'Характеристики'));

  const dl = createEl('dl', 'specs-table');
  Object.entries(product.specs || {}).forEach(([key, value]) => {
    const row = createEl('div', 'specs-table__row');
    row.append(createEl('dt', null, key), createEl('dd', null, value));
    dl.append(row);
  });
  specsBlock.append(dl);

  article.append(image, info, specsBlock);
  root.append(article);
}

function renderRelated(currentId) {
  /* Пропускаем пустые или неполные записи в PRODUCTS */
  const others = PRODUCTS.filter(
    (p) => p && p.id && p.title && p.id !== currentId
  );
  if (!others.length) return;

  others.forEach((p) => {
    const li = createEl('li');
    const link = createEl('a', null, `${p.title} — ${formatPrice(p.price)}`);
    link.href = `product.html?id=${encodeURIComponent(p.id)}`;
    li.append(link);
    relatedList.append(li);
  });

  related.hidden = false;
}

const id = new URLSearchParams(location.search).get('id');
const currentProduct = PRODUCTS.find((p) => p && p.id === id);

if (currentProduct) {
  try {
    renderProduct(currentProduct);
  } catch (err) {
    console.error('Ошибка при выводе товара:', err);
  }

  try {
    renderRelated(currentProduct.id);
  } catch (err) {
    console.error('Ошибка при выводе других товаров:', err);
  }
} else {
  document.title = 'Товар не найден — Учебный интернет-магазин';
  breadcrumbCurrent.textContent = 'Товар не найден';
  notFound.hidden = false;
}

/* ===============================
   4. Отзывы
   Примеры берутся из REVIEWS (products.js),
   новые отзывы сохраняются в localStorage браузера.
   =============================== */

const reviewsSection = document.getElementById('reviews');
const reviewsSummary = document.getElementById('reviews-summary');
const reviewsList = document.getElementById('reviews-list');
const reviewForm = document.getElementById('review-form');
const reviewMessage = document.getElementById('review-message');

const MAX_STARS = 5;

function reviewsStorageKey(productId) {
  return `shop-reviews:${productId}`;
}

function loadSavedReviews(productId) {
  try {
    const raw = localStorage.getItem(reviewsStorageKey(productId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function saveReviews(productId, reviews) {
  try {
    localStorage.setItem(reviewsStorageKey(productId), JSON.stringify(reviews));
    return true;
  } catch (err) {
    return false;
  }
}

/* Склонение: 1 отзыв, 2 отзыва, 5 отзывов */
function pluralize(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function starsText(rating) {
  return '★'.repeat(rating) + '☆'.repeat(MAX_STARS - rating);
}

function renderReviews(productId) {
  const all = [...loadSavedReviews(productId), ...(REVIEWS[productId] || [])]
    .filter((r) => Number.isInteger(r.rating) && r.rating >= 1 && r.rating <= MAX_STARS);

  reviewsList.replaceChildren();

  if (!all.length) {
    reviewsSummary.textContent = 'Отзывов пока нет. Станьте первым!';
    return;
  }

  const average = all.reduce((sum, r) => sum + r.rating, 0) / all.length;
  const word = pluralize(all.length, 'отзыв', 'отзыва', 'отзывов');
  reviewsSummary.textContent =
    `Средняя оценка: ${average.toFixed(1)} из ${MAX_STARS} (${all.length} ${word})`;

  all.forEach((review) => {
    const item = createEl('li', 'review');

    const header = createEl('div', 'review__header');
    const stars = createEl('span', 'review__stars', starsText(review.rating));
    stars.setAttribute('aria-label', `Оценка: ${review.rating} из ${MAX_STARS}`);
    header.append(
      createEl('strong', 'review__author', review.author),
      stars,
      createEl('span', 'review__date', review.date)
    );

    item.append(header, createEl('p', 'review__text', review.text));
    reviewsList.append(item);
  });
}

function initReviews(productId) {
  reviewsSection.hidden = false;
  renderReviews(productId);

  /* Снимаем подсветку ошибки, когда человек начал исправлять поле */
  reviewForm.addEventListener('input', (event) => {
    event.target.removeAttribute('aria-invalid');
  });

  reviewForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const elements = Array.from(reviewForm.elements);
    elements.forEach((el) => el.removeAttribute('aria-invalid'));

    if (!reviewForm.checkValidity()) {
      elements.forEach((el) => {
        if (el.willValidate && !el.checkValidity()) {
          el.setAttribute('aria-invalid', 'true');
        }
      });
      reviewForm.reportValidity();
      return;
    }

    const data = new FormData(reviewForm);
    const review = {
      author: String(data.get('author')).trim(),
      rating: Number(data.get('rating')),
      date: new Date().toLocaleDateString('ru-RU'),
      text: String(data.get('text')).trim()
    };

    /* Пробелы вместо текста проходят встроенную проверку, поэтому проверяем сами */
    if (review.author.length < 2 || review.text.length < 10) {
      const bad = review.author.length < 2 ? 'review-name' : 'review-text';
      const field = document.getElementById(bad);
      field.setAttribute('aria-invalid', 'true');
      field.focus();
      return;
    }

    const saved = loadSavedReviews(productId);
    saved.unshift(review);
    const ok = saveReviews(productId, saved);

    renderReviews(productId);
    reviewForm.reset();

    reviewMessage.textContent = ok
      ? 'Спасибо! Ваш отзыв добавлен.'
      : 'Отзыв показан, но браузер не смог его сохранить.';
    reviewMessage.hidden = false;
    setTimeout(() => { reviewMessage.hidden = true; }, 4000);
  });
}

if (currentProduct) {
  try {
    initReviews(currentProduct.id);
  } catch (err) {
    console.error('Ошибка в блоке отзывов:', err);
  }
}
