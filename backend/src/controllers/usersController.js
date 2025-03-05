const { auth, rtdb, admin } = require("../firebase");

const signIn = async (req, res) => {
  const { token, fcmToken } = req.body;

  if (!token || !fcmToken) {
    return res.status(400).json({ error: "Missing token or FCM token" });
  }

  try {
    // 🔹 Verify Firebase Authentication token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const uid = decodedToken.uid;

    console.log(`🔑 User authenticated: ${uid}`);

    // 🔹 Retrieve user data from Firebase Realtime Database
    const snapshot = await rtdb.ref(`users/${uid}`).once("value");
    const userData = snapshot.val();

    if (!userData) {
      console.warn(`⚠️ User not found: ${uid}`);
      return res.status(404).json({ error: "User not found" });
    }

    // 🔹 Update FCM token for push notifications
    await rtdb.ref(`users/${uid}`).update({ fcmToken });
    console.log(`📲 Updated FCM token for ${uid}: ${fcmToken}`);

    // 🔹 Return user data & updated FCM token
    return res.status(200).json({
      uid,
      role: userData.role,
      name: userData.name,
      fcmToken,
    });

  } catch (error) {
    console.error("❌ Token verification failed:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Register a new user
const signUp = async (req, res) => {
  const { email, password, name, role } = req.body;

  try {
    // Create a new user in Firebase Authentication
    const userRecord = await auth.createUser({
      email,
      password,
    });

    // Save additional details in Firebase Realtime Database
    await rtdb.ref(`users/${userRecord.uid}`).set({
      name,
      role,
    });

    res.status(201).json({
      message: "User registered successfully",
      uid: userRecord.uid,
      name,
      role,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all users from Firebase Realtime Database
const getUsers = async (req, res) => {
  try {
    // Fetch all users from the "users" node
    const snapshot = await rtdb.ref("users").once("value");
    const users = snapshot.val();

    if (!users) {
      return res.status(404).json({ message: "No users found" });
    }

    // Convert object to an array with user UID included
    const usersList = Object.keys(users).map(uid => ({
      uid,
      ...users[uid],
    }));

    res.status(200).json(usersList);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { signIn, signUp, getUsers };


