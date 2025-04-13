const nodemailer = require('nodemailer');

const sendMail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.email, 
        pass: process.env.pass  
      }
    });

    const mailOptions = {
      from: 'VR Wonders <vrwondersgifts@gmail.com>',
      to,
      cc:process.env.cc,
      bcc:process.env.bcc,
      subject,
      text,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log('Mail sent to:', to);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

module.exports = sendMail;
