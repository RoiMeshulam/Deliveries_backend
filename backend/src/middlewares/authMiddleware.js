const { admin } = require("../firebase"); // Assuming you've initialized Firebase Admin SDK

const authenticateToken = async (req, res, next) => {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    try {
        // Verify the Firebase ID token with the Firebase Admin SDK (automatically handles algorithm)
        const decodedToken = await admin.auth().verifyIdToken(token);
        
        // Attach the decoded token (user data) to the request
        req.user = decodedToken;
        
        // Proceed to the next middleware or route handler
        next();
    } catch (error) {
        console.error("Error during token verification:", error);
        return res.status(403).json({ error: "Invalid or expired token." });
    }
};

module.exports = authenticateToken;
