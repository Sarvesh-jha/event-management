const mongoose = require('mongoose');

const connectDatabase = require('../config/database');
const { isUsingLocalDatabase } = require('../config/database');
const env = require('../config/env');
const localStore = require('../data/local-store');
const { buildSampleEvents } = require('../data/sample-events');
const Event = require('../models/event.model');
const User = require('../models/user.model');

const seedDemoData = async () => {
  try {
    await connectDatabase();

    if (isUsingLocalDatabase()) {
      const adminUser = await localStore.ensureAdminUser();
      const existingEventsCount = await localStore.countEvents();

      if (existingEventsCount > 0) {
        console.log('Demo event data already exists. Skipping seed.');
        return;
      }

      await localStore.insertEvents(buildSampleEvents(adminUser._id));
      console.log('Demo events seeded successfully.');
      return;
    }

    let adminUser = await User.findOne({ email: env.adminSeedEmail.toLowerCase() });

    if (!adminUser) {
      adminUser = await User.create({
        fullName: env.adminSeedName,
        email: env.adminSeedEmail.toLowerCase(),
        password: env.adminSeedPassword,
        role: 'admin',
        department: 'Administration',
      });
    }

    const existingEventsCount = await Event.countDocuments();
    if (existingEventsCount > 0) {
      console.log('Demo event data already exists. Skipping seed.');
      return;
    }

    await Event.insertMany(buildSampleEvents(adminUser._id));
    console.log('Demo events seeded successfully.');
  } catch (error) {
    console.error('Unable to seed demo data:', error.message);
    process.exitCode = 1;
  } finally {
    if (!isUsingLocalDatabase()) {
      await mongoose.connection.close();
    }
  }
};

seedDemoData();
