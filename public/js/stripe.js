/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
//this object is gloabaly available from tour.pug script tag

export const bookTour = async (tourId) => {
  const stripe = Stripe(
    'pk_test_51HvVJZH4OqSHUwdZF7FNqpWVSuG9zjBMssuRV6w4bY5elIsn1bvqMXVswWScZlJPeobfvI4Gl0T8dHgR1nIXV7MM00Urwq1wx2'
  );
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `/api/v1/bookings/checkout-session/${tourId}`
      // `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );

    // 2) Create checkout form + chanre credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
