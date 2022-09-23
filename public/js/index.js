// console.log('Hello from parcel!');
//-npm run watch:js, builds file for you
/* eslint-disable */
//npm i @babel/polyfill

import '@babel/polyfill'; //allows new JS to be seen on old browsers
import { login, logout } from './login';
import { displayMap } from './mapbox';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

//DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logOutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// DELEGATION --makes sure map is trying to load on every view
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}
if (loginForm)
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // VALUES
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    login(email, password);
  });
if (logOutBtn) logOutBtn.addEventListener('click', logout);

if (userDataForm)
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //create multiform datta form
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    //since files in an array and there is only one we take the first\
    //this is just expanding the form from before when it was just name and email
    //as you can see below

    //now when choosing to update photo, brings up the file finder on your computer

    // const name = document.getElementById('name').value;
    // const email = document.getElementById('email').value;
    // updateSettings({ name, email }, 'data');
    updateSettings(form, 'data');
  });

if (userPasswordForm)
  userPasswordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';
    //these are the names of the values that our api expcects to see
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;
    console.log(password);
    updateSettings({ passwordCurrent, password, passwordConfirm }, 'password');
    //sent to api, matches if you did this manually in postman
    //rememeber, type is password which will be passed into updateSettings
    document.querySelector('.btn--save-password').textContent = 'Save password';
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });

if (bookBtn)
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...'; //changes text after pressed
    //tour-id automatically becomes tourId
    // const tourId = e.target.dataset.tourId; below is the destructured version
    const { tourId } = e.target.dataset;
    bookTour(tourId); //this id is passed to this function located in stripe.js
  });
