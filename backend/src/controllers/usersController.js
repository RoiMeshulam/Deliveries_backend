const { auth, rtdb, admin } = require("../firebase");

// ✅ User Login (React Native will send email & password)
const signIn = async (req, res) => {
  const idToken = req.body.token;

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    // Fetch user details from Firebase Realtime Database
    const snapshot = await rtdb.ref(`users/${uid}`).once("value");
    const userData = snapshot.val();

    if (userData) {
      // Send back a response with the user data and a token
      res.status(200).json({
        token: userData.token, // You can customize this if you want to generate a new token
        uid,
        role: userData.role,
        name: userData.name,
      });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    console.error("Error verifying token:", error);
    res.status(401).json({ error: "Unauthorized" });
  }
};

// ✅ User Signup (Register a new user)
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

// ✅ Get all users from Firebase Realtime Database
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


