// create updateData and call in index.js
/* eslint-disable */
// npm i axios
import axios from 'axios';
import { showAlert } from './alerts';
// export const updateData = async (name, email) => {

//type is either 'password' or 'data'

//before we were just taking in the name and email and updating, now we can update password if that is being changed
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';
    // ? 'http://127.0.01:3000/api/v1/users/updateMyPassword'
    // : 'http://127.0.01:3000/api/v1/users/updateMe';
    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
