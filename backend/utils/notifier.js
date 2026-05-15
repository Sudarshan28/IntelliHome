const Notification = require('../models/Notification');
const User = require('../models/User');
const nodemailer = require('nodemailer');

const createTransporter = async () => {
  // Using Ethereal for testing, replace with real credentials in production
  let testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, 
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const notify = async (title, message, type = 'info', io) => {
  try {
    // 1. Get all users to notify (or specific user if implemented)
    const users = await User.find();
    
    for (let user of users) {
      // 2. Save to MongoDB
      const notification = new Notification({
        userId: user._id,
        title,
        message,
        type
      });
      await notification.save();

      // 3. Send via Socket.io
      io.emit('new_notification', notification);

      // 4. Send Email if user has email alerts enabled
      if (user.settings && user.settings.emailAlerts) {
        let transporter = await createTransporter();
        let info = await transporter.sendMail({
          from: '"IntelliHome System" <alerts@intellihome.local>',
          to: user.email,
          subject: `[${type.toUpperCase()}] ${title}`,
          text: message,
          html: `<b>${title}</b><p>${message}</p>`
        });
        console.log("Email preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
    }
  } catch (err) {
    console.error('Notifier Error:', err);
  }
};

module.exports = notify;
