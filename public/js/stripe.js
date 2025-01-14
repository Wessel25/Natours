import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51QVWrjEuGthBljkDtAafPoseXnbdqDbE1DNXIZReSU80vAZLts4BjAUKahiYRNsYWfpKSuOSVKgW0A4wHzHmQ5S200HQ3wU31S',
);

export const bookTour = async (tourId) => {
  try {
    console.log('Book Tour Axios');
    // 1) Get checkout-session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`,
    );
    console.log(session);
    // 2) Create checkout from + change credit card
    console.log('stripe.js: sessionId =' + session.data.session.id);
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
