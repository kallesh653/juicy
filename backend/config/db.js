const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const path = require('path');
const os = require('os');

let mongod = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGODB_URI;

    // Check if external MongoDB is available
    if (mongoUri && mongoUri.includes('localhost')) {
      try {
        // Try connecting to external MongoDB first
        const conn = await mongoose.connect(mongoUri, {
          serverSelectionTimeoutMS: 3000
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);
        return;
      } catch (err) {
        console.log('⚠️  External MongoDB not found, starting embedded MongoDB...');
      }
    }

    // Start embedded MongoDB with persistent storage
    const dbPath = path.join(os.homedir(), 'ColdDrinkBilling', 'database');

    mongod = await MongoMemoryServer.create({
      instance: {
        dbPath: dbPath,
        storageEngine: 'wiredTiger',
        port: 27017
      },
      binary: {
        version: '6.0.12'
      }
    });

    mongoUri = mongod.getUri();

    const conn = await mongoose.connect(mongoUri + 'juicy_billing');

    console.log(`✅ Embedded MongoDB Started`);
    console.log(`📁 Data stored at: ${dbPath}`);
    console.log(`📊 Database: juicy_billing`);

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Graceful shutdown
const closeDB = async () => {
  if (mongod) {
    await mongod.stop();
  }
  await mongoose.connection.close();
};

process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

module.exports = connectDB;
