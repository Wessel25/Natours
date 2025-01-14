export const showAlert = (type, msg) => {
  console.log('Alert.js at Function: showAlert()');
  // hide any existing alert
  hideAlert();

  // create the alert markup
  const markup = `<div class="alert alert--${type}">${msg}</div>`;

  // insert the alert at the beginning of the body
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);

  // automatically hide the alert after 5 seconds
  window.setTimeout(hideAlert, 5000);
};

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) {
    el.parentElement.removeChild(el);
  }
};
