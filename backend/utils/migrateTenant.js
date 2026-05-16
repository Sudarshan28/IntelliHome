const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Device = require('../models/Device');
const Automation = require('../models/Automation');
const AutomationLog = require('../models/AutomationLog');
const Notification = require('../models/Notification');

dotenv.config();

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');

    const users = await User.find();
    if (users.length === 0) {
      console.log('No users found. Create a user first.');
      process.exit(1);
    }

    const admin = users[0];
    console.log(`Migrating all orphaned documents to user: ${admin.name} (${admin._id})`);

    await Device.updateMany({ user: { $exists: false } }, { $set: { user: admin._id } });
    await Automation.updateMany({ user: { $exists: false } }, { $set: { user: admin._id } });
    await AutomationLog.updateMany({ user: { $exists: false } }, { $set: { user: admin._id } });
    await Notification.updateMany({ user: { $exists: false } }, { $set: { user: admin._id } });

    // Ensure all existing docs have user (fallback if exists was true but null)
    await Device.updateMany({ user: null }, { $set: { user: admin._id } });
    await Automation.updateMany({ user: null }, { $set: { user: admin._id } });

    console.log('Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();
