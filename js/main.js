/* ===============================
   1. Форма заказа
   =============================== */

const orderDialog = document.getElementById('order-dialog');
const orderButtons = document.querySelectorAll('.product-card__button');
const closeDialogButton = document.getElementById('close-order-dialog');
const selectedProductInput = document.getElementById('selected-product');

orderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const productName = button.dataset.product;

    selectedProductInput.value = productName;

    orderDialog.showModal();
  });
});

closeDialogButton.addEventListener('click', () => {
  orderDialog.close();
});

const orderForm = document.getElementById('order-form');

const successMessage = document.getElementById('success-message');

orderForm.addEventListener('submit', (event) => {

  event.preventDefault();

  const formElements = Array.from(orderForm.elements);

  formElements.forEach((element) => {
    if (element.willValidate) {
      element.removeAttribute('aria-invalid');
    }
  });

  if (!orderForm.checkValidity()) {
    formElements.forEach((element) => {
      if (element.willValidate && !element.checkValidity()) {
        element.setAttribute('aria-invalid', 'true');
      }
    });

    orderForm.reportValidity();
    return;
  }

  successMessage.hidden = false;

  orderForm.reset();

  orderDialog.close();
});

/* ===============================
   2. Модальное окно характеристик
   =============================== */

const specsDialog = document.getElementById('specs-dialog');
const specsTitle  = document.getElementById('specs-dialog-title');
const specsList   = document.getElementById('specs-dialog-list');
const specsButtons = document.querySelectorAll('.product-card__more-btn');

function openSpecsDialog(title, specs) {
  specsTitle.textContent = title || 'Характеристики';

  specsList.innerHTML = '';

  Object.entries(specs).forEach(([key, value]) => {
    const li = document.createElement('li');

    const keySpan = document.createElement('span');
    keySpan.textContent = key + ':';

    li.appendChild(keySpan);
    li.append(' ' + value);

    specsList.appendChild(li);
  });

  specsDialog.showModal();
}

specsButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    let specs = {};

    try {
      specs = JSON.parse(btn.dataset.specs || '{}');
    } catch (err) {
      console.warn('Некорректный JSON в data-specs:', err);
    }

    openSpecsDialog(btn.dataset.title, specs);
  });
});

specsDialog.querySelectorAll('[data-close-specs]').forEach((el) => {
  el.addEventListener('click', () => specsDialog.close());
});


document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;

  if (specsDialog.open) specsDialog.close();
  if (orderDialog.open) orderDialog.close();
});

specsDialog.addEventListener('click', (e) => {
  if (e.target === specsDialog) specsDialog.close();
});

const orderTitle = document.getElementById('order-dialog-title');

orderButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.product-card');
    const productName = card.querySelector('.product-card__title').textContent;

    selectedProductInput.value = productName;
    orderTitle.textContent = `Заявка: ${productName}`;

    orderDialog.showModal();
  });
});

/* ===============================
   3. Кнопка «Наверх»
   =============================== */

const scrollTopButton = document.getElementById('scroll-top');

window.addEventListener('scroll', () => {
  scrollTopButton.classList.toggle('is-visible', window.scrollY > 400);
}, { passive: true });

scrollTopButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});