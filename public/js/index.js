import '@babel/polyfill';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { showAlert } from './alerts';
import { bookTour } from './stripe';

const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    if (e.target.matches('.form--login')) {
      e.preventDefault();
      console.log(
        'LoginForm Submit: index.js line 10 --at Function: addEventListener()',
      );
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      console.log('Email and Password');
      console.log(`Email: ${email} + Password: ${password}`);
      login(email, password);
    }
  });
}

if (logoutBtn) {
  console.log('index.js line 20 --at Function: logoutBtn');
  logoutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  console.log('Login.js: line 76, updateData');
  userDataForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);

    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  console.log('index.js at Function: userPasswordForm');
  userPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    document.querySelector('.btn--save--password').textContent = 'Updating...';
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );
    document.querySelector('.btn--save--password').textContent =
      'Save password';

    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  console.log('Button Book tour');
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    const tour = e.target.dataset.tourId;
    bookTour(tour);
  });
}
