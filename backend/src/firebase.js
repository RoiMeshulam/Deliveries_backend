const admin = require('firebase-admin');
// const { getAuth } = require('firebase/auth');

// Your Firebase service account key file
const serviceAccount = require('./moneymonitor-d37db-firebase-adminsdk-w6e6s-0dda1398e7.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://moneymonitor-d37db-default-rtdb.firebaseio.com/', // Your Realtime Database URL
});

// Firestore instance from Admin SDK
const firestoreDb = admin.firestore(); // This is the correct way to initialize Firestore for server use
const rtdb = admin.database(); // Use admin.database() for Realtime Database
const messaging = admin.messaging();
const auth = admin.auth();

module.exports = { admin, firestoreDb, rtdb, messaging, auth };