const nodemailer = require('nodemailer');

const sendEmail = async options => {
  //Create Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  //Define the email optionalDependencies

  const mailOptions = {
    from: 'Fortune Sam-Olayemi cyb3rcykic@gmail.com',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html
  };
  //Actually send Email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
