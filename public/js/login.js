/* eslint-disable*/
import axios from 'axios';
import { showAlert } from './alerts';

//Login button
document.addEventListener('DOMContentLoaded', () => {
  console.log('login.js line 56 --at: Function-> logout()');
  const form = document.querySelector('.form--login');
  const loginBtn = form ? document.querySelector('.btn--green') : null;

  console.log('Loginform:', form, 'LoginBtn:', loginBtn);
  if (loginBtn) {
    loginBtn.addEventListener('click', (e) => {
      form.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true }),
      );
    });
  }
});

//Login
export const login = async (email, password) => {
  console.log('login.js line 22 --at login()');
  try {
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:3000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });
    // Check if the login was successful
    if (res.data.status === 'Success') {
      showAlert('success', 'Logged in successfully!');
      console.log(`location: ${location}`);
      window.setTimeout(() => {
        location.assign('/'); // Redirect after login
      }, 1500);
    }
  } catch (err) {
    console.error(
      'AxiosError for url: http://127.0.0.1:3000/api/v1/users/login ',
      err,
    ); // Log the entire error object for debugging

    if (err.res && err.res.data && err.res.data.message) {
      showAlert('error', err.res.data.message);
    } else {
      showAlert('error', 'Something went wrong! Please try again.');
    }
  }
};

//Logout
export const logout = async () => {
  console.log('login.js line 56 --at logout()');
  try {
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });

    if (res.data.status === 'success') {
      location.reload(true);
    }
  } catch (err) {
    showAlert('error', 'Error logging out! Try again');
  }
};
