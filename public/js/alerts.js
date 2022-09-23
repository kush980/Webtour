//atm we have like three javascript files attatched to base.pug which is bad practice, need to use a web bundler
// sudo npm i parcel-bundler --save-dev
/* eslint-disable */

//need a function for hiding elements

export const hideAlert = () => {
  const el = document.querySelector('.alert');
  if (el) el.parentElement.removeChild(el);
  //confused about this? google the documentation
};

//we are doing this so we can controll the css of the alert, look in style for this class to see what it is
// type is 'success' or 'error'
export const showAlert = (type, msg) => {
  const markup = `<div class ="alert alert--${type}">${msg}</div>`;
  document.querySelector('body').insertAdjacentHTML('afterbegin', markup);
  window.setTimeout(hideAlert, 5000);
  //this means place inside the body but right at the beginning
  //markup is the html we want to include
};
