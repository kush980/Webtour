/* eslint-disable */
// npm i axios
import axios from 'axios';
import { showAlert } from './alerts';

export const login = async (email, password) => {
  // console.log(email, password);
  // using axios cdn on base.pug page
  try {
    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/login', //can do this because the api is on the same url, additional path added to current url like we did with image upload
      // url: 'http://127.0.0.1:3000/api/v1/users/login', can;t use this in production
      data: {
        email, //   email:email, eslint you just put email
        password,
      },
    });
    if (res.data.status === 'success') {
      //login success?
      // alert('Logged in successfully!'); is replaced with showAlert function
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1000); //after 1000 milleseconds
    }
  } catch (err) {
    showAlert('error', err.response.data.message); //found in axios documentation
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
    });
    //need to reload the page because the server will be sent the new invalid cookie and therefore the user will no longer be logged in
    if ((res.data.status = 'success')) location.reload(); //need the reload to be true so that the cache is cleared as well
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out. Try again.');
  }
};
