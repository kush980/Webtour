const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

// new Email(user, url).sendWelcome(); for an email to new user
// use this module for constructing emails
//centralizes the creation of emails and seperates from send email function
//created email class so that we can input the options to assign for email objects and send various emails
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    // this.firstName = user.name.split(' ')[0];
    this.url = url;
    //used environmental variable from
    this.from = process.env.EMAIL_FROM;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //Sendgrid
      return nodemailer.createTransport({
        service: 'SendGrid', //remeber we did this before with Gmail
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      // service: 'Gmail',
      secure: false,
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '898e1acbc29b21',
        pass: 'f8e510256764d5', //gotten from credentials from mailtrap
      },
    });
  }

  // Send the actual email
  async send(template, subject) {
    // 1) Render HTML based on a pug template
    //remember, __dirname is the current directory, so in this case utils
    const html = pug.renderFile(`./views/emails/${template}.pug`, {
      firstName: this.firstNmae,
      url: this.url,
      subject,
    });
    //behind the scenes, creates a template based on a pug template

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to, //is an argument sent to this function
      subject,
      html,
      text: htmlToText.fromString(html), //convert html to just plain text, npm i html-to-text
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the Natours Family'); //pug template
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 minutes.'
    );
  }
};

// const sendEmail = async (options) => {
// //1) Create a transporter

// const transporter = nodemailer.createTransport({
//   // service: 'Gmail',
//   secure: false,
//   host: 'smtp.mailtrap.io',
//   port: 2525,
//   auth: {
//     user: '898e1acbc29b21',
//     pass: 'f8e510256764d5', //gotten from credentials from mailtrap
//   },
//   //Activate in gmail " less secure app" option
//   //mail trap sends email that never actuallyh send so you can see how it works in dev
// });

//2) Define the email options
// const mailOptions = {
//   from: 'Cass Kornhiser <ckornhiser@gmail.com>',
//   to: options.email, //is an argument sent to this function
//   subject: options.subject,
//   text: options.message,

// tls: { rejectUnauthorized: false },
// };
//3) Actually send the email
//async function
//   await transporter.sendMail(mailOptions);
// };
// module.exports = sendEmail;
