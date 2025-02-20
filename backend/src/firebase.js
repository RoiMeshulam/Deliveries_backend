require('dotenv').config();
const admin = require('firebase-admin');
const path = require('path');

// Load the Firebase service account key from the .env file
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

// Initialize Firebase Admin SDK with credentials from .env file
admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath)),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Firestore instance from Admin SDK
const firestoreDb = admin.firestore(); // Initialize Firestore
const rtdb = admin.database(); // Initialize Realtime Database
const messaging = admin.messaging(); // Initialize Firebase Cloud Messaging
const auth = admin.auth(); // Initialize Firebase Authentication

module.exports = { admin, firestoreDb, rtdb, messaging, auth };