const mongoose = require('mongoose');

const connectDatabase = require('../config/database');
const { isUsingLocalDatabase } = require('../config/database');
const env = require('../config/env');
const localStore = require('../data/local-store');
const User = require('../models/user.model');

const seedAdmin = async () => {
  try {
    await connectDatabase();

    if (isUsingLocalDatabase()) {
      const existingAdmin = await localStore.findUserByEmail(
        env.adminSeedEmail.toLowerCase(),
        { includePassword: true },
      );

      await localStore.ensureAdminUser({ resetPassword: true });

      console.log(
        `${existingAdmin ? 'Admin user updated' : 'Admin user created'}: ${env.adminSeedEmail.toLowerCase()}`,
      );
      return;
    }

    const existingAdmin = await User.findOne({
      email: env.adminSeedEmail.toLowerCase(),
    }).select('+password');

    if (existingAdmin && existingAdmin.role !== 'admin') {
      throw new Error(
        `User ${env.adminSeedEmail} already exists and is not an admin account.`,
      );
    }

    if (existingAdmin) {
      existingAdmin.fullName = env.adminSeedName;
      existingAdmin.password = env.adminSeedPassword;
      existingAdmin.department = 'Administration';
      existingAdmin.isActive = true;

      await existingAdmin.save();

      console.log(`Admin user updated: ${existingAdmin.email}`);
    } else {
      const adminUser = await User.create({
        fullName: env.adminSeedName,
        email: env.adminSeedEmail.toLowerCase(),
        password: env.adminSeedPassword,
        role: 'admin',
        department: 'Administration',
      });

      console.log(`Admin user created: ${adminUser.email}`);
    }
  } catch (error) {
    console.error('Unable to seed admin user:', error.message);
    process.exitCode = 1;
  } finally {
    if (!isUsingLocalDatabase()) {
      await mongoose.connection.close();
    }
  }
};

seedAdmin();
