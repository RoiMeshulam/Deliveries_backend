const admin = require('firebase-admin');
require("dotenv").config();

// const { getAuth } = require('firebase/auth');

// Your Firebase service account key file
const serviceAccount = require(process.env.SERVICE_ACCOUNT);

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL, // Your Realtime Database URL
});

// Firestore instance from Admin SDK
const firestoreDb = admin.firestore(); // This is the correct way to initialize Firestore for server use
const rtdb = admin.database(); // Use admin.database() for Realtime Database
const messaging = admin.messaging();

module.exports = { admin, firestoreDb, rtdb, messaging };