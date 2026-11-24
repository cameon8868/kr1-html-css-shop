/* Локальный консультант с ответами на частые вопросы. */
(function () {
  const widget = document.createElement('div');
  widget.className = 'consultant';

  const toggle = document.createElement('button');
  toggle.className = 'consultant__toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', 'consultant-panel');
  toggle.setAttribute('aria-label', 'Открыть онлайн-консультанта');

  const chatIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  chatIcon.setAttribute('viewBox', '0 0 24 24');
  chatIcon.setAttribute('width', '22');
  chatIcon.setAttribute('height', '22');
  chatIcon.setAttribute('aria-hidden', 'true');
  chatIcon.setAttribute('focusable', 'false');
  const chatShape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  chatShape.setAttribute('d', 'M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8A8.5 8.5 0 0 1 8.7 4a8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z');
  chatShape.setAttribute('fill', 'none');
  chatShape.setAttribute('stroke', 'currentColor');
  chatShape.setAttribute('stroke-width', '2');
  chatShape.setAttribute('stroke-linecap', 'round');
  chatShape.setAttribute('stroke-linejoin', 'round');
  chatIcon.append(chatShape);
  toggle.append(chatIcon);

  const panel = document.createElement('section');
  panel.className = 'consultant__panel';
  panel.id = 'consultant-panel';
  panel.setAttribute('aria-label', 'Онлайн-консультант TechnoShop');
  panel.hidden = true;

  const header = document.createElement('div');
  header.className = 'consultant__header';
  const heading = document.createElement('h2');
  heading.className = 'consultant__title';
  heading.textContent = 'Консультант TechnoShop';

  const closeButton = document.createElement('button');
  closeButton.className = 'consultant__close';
  closeButton.type = 'button';
  closeButton.setAttribute('aria-label', 'Закрыть консультанта');
  closeButton.textContent = '×';
  header.append(heading, closeButton);

  const notice = document.createElement('p');
  notice.className = 'consultant__notice';
  notice.textContent = 'Я виртуальный помощник: подскажу о доставке, возврате и выборе товара. Сообщения не отправляются оператору.';

  const messages = document.createElement('div');
  messages.className = 'consultant__messages';
  messages.setAttribute('role', 'log');
  messages.setAttribute('aria-live', 'polite');
  messages.setAttribute('aria-relevant', 'additions');

  const form = document.createElement('form');
  form.className = 'consultant__form';
  const input = document.createElement('input');
  input.className = 'consultant__input';
  input.type = 'text';
  input.name = 'question';
  input.maxLength = 500;
  input.placeholder = 'Напишите вопрос';
  input.setAttribute('aria-label', 'Ваш вопрос консультанту');
  input.required = true;
  const sendButton = document.createElement('button');
  sendButton.className = 'consultant__send';
  sendButton.type = 'submit';
  sendButton.textContent = 'Отправить';
  form.append(input, sendButton);

  panel.append(header, notice, messages, form);
  widget.append(toggle, panel);
  document.body.append(widget);

  function addMessage(text, sender, linkText, href) {
    const message = document.createElement('p');
    message.className = 'consultant__message consultant__message--' + sender;
    message.textContent = text;
    if (linkText && href) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = linkText;
      message.append(document.createElement('br'), link);
    }
    messages.append(message);
    messages.scrollTop = messages.scrollHeight;
  }

  function answerFor(question) {
    if (/достав|курьер|привез/i.test(question)) {
      return {
        text: 'Доставка по городу стоит 300 руб. Заказы от 5000 руб. доставляются бесплатно. Дату и время менеджер согласует после подтверждения заказа.'
      };
    }
    if (/возврат|верн/i.test(question)) {
      return {
        text: 'Товар можно вернуть в течение 14 дней при сохранении товарного вида и упаковки. Подробности и условия возврата есть на главной странице.',
        linkText: 'Открыть вопросы и ответы',
        href: 'index.html#faq-title'
      };
    }
    if (/подоб|выбрать|выбор|характеристик|каталог|товар/i.test(question)) {
      return {
        text: 'В каталоге можно найти товары по названию, категории и цене, а на странице товара посмотреть характеристики и отзывы.',
        linkText: 'Перейти в каталог',
        href: 'catalog.html'
      };
    }
    if (/контакт|связ|оператор|менеджер|человек/i.test(question)) {
      return {
        text: 'Связаться с магазином можно по телефону или электронной почте на странице контактов.',
        linkText: 'Контакты магазина',
        href: 'contacts.html'
      };
    }
    return {
      text: 'Пока я отвечаю на вопросы о доставке, возврате и выборе товаров. Для других вопросов обратитесь к контактам магазина.',
      linkText: 'Контакты магазина',
      href: 'contacts.html'
    };
  }

  function respond(question) {
    addMessage(question, 'user');
    const response = answerFor(question);
    addMessage(response.text, 'assistant', response.linkText, response.href);
  }

  addMessage('Здравствуйте! Чем могу помочь?', 'assistant');

  toggle.addEventListener('click', function () {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    input.focus();
  });

  closeButton.addEventListener('click', function () {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const question = input.value.trim();
    if (!question) return;
    respond(question);
    input.value = '';
    input.focus();
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && !panel.hidden) {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}());
