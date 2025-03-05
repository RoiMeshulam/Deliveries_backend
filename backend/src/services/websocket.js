const { Server } = require("socket.io");
const { rtdb, messaging } = require("../firebase");

let io;
const connectedUsers = new Map(); // Store connected users
const userFcmTokens = new Map();
let currentRef = null; // Store current Firebase listener reference

const initWebSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Update this for production security
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId;
        console.log(`🔌 User connected: ${userId} (Socket ID: ${socket.id})`);
    
        if (userId) {
            connectedUsers.set(userId, socket);
        }
    
        // ✅ Listen for FCM token updates and store in Firebase
        socket.on("registerFcmToken", async (fcmToken) => {
            console.log(`📲 Received FCM token from user ${userId}: ${fcmToken}`);
            
            userFcmTokens.set(userId, fcmToken); // Store in memory
    
            // ✅ Save to Firebase Database
            await rtdb.ref(`users/${userId}`).update({ fcmToken });
    
            console.log(`✅ FCM token saved to Firebase for user ${userId}`);
        });
    
        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${userId} (Socket ID: ${socket.id})`);
            connectedUsers.delete(userId);
        });
    });
    

    // Start Firebase Listener and set automatic updates
    startFirebaseListener();
    scheduleDailyListenerUpdate();

    return io;
};

// Function to determine today's date in Israeli Time (UTC+2 or UTC+3)
const getTodayDatePath = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // Convert to Israel time (adjust for DST manually if needed)

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `deliveries/${year}/${month}/${day}`;
};

// Firebase Listener for Real-time Database
const startFirebaseListener = () => {
    const todayPath = getTodayDatePath();
    console.log(`📡 Listening for changes at: ${todayPath}`);

    if (currentRef) {
        console.log("🛑 Removing previous Firebase listener...");
        currentRef.off(); // Remove previous listener
    }

    currentRef = rtdb.ref(todayPath);

    // Listen for new deliveries
    currentRef.on("child_added", (snapshot) => {
        const data = { id: snapshot.key, ...snapshot.val() };
        console.log("📦 New delivery:", data);
        io.emit("updateDeliveries", { type: "new", data });

        sendFcmNotification(data);
    });

    // Listen for updates
    currentRef.on("child_changed", (snapshot) => {
        const data = { id: snapshot.key, ...snapshot.val() };
        console.log("🔄 Delivery updated:", data);
        io.emit("updateDeliveries", { type: "update", data });
    });

    // Listen for deletions
    currentRef.on("child_removed", (snapshot) => {
        const id = snapshot.key;
        console.log("🗑️ Delivery deleted:", id);
        io.emit("updateDeliveries", { type: "delete", id });
    });
};

// Function to schedule daily listener update at midnight (Israel Time)
const scheduleDailyListenerUpdate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2); // Convert to Israel time
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0); // Set to next midnight

    const timeUntilMidnight = nextMidnight - now;
    console.log(`⏳ Scheduling next listener update in ${timeUntilMidnight / 1000 / 60} minutes`);

    setTimeout(() => {
        console.log("🌅 Midnight reached, updating Firebase listener...");
        startFirebaseListener(); // Update the listener
        scheduleDailyListenerUpdate(); // Reschedule for next day
    }, timeUntilMidnight);
};

const sendFcmNotification = async (delivery) => {
    const title = `📦 משלוח חדש זמין!`;  // Title in Hebrew (New Delivery Available!)
    const body = ` משלוח חדש לכתובת ${delivery.address}, ${delivery.city}.`;

    try {
        // ✅ Get FCM Tokens from Firebase Realtime Database
        const snapshot = await rtdb.ref("users").once("value");
        const users = snapshot.val();

        if (!users) {
            console.log("⚠️ No users found in Firebase.");
            return;
        }

        // ✅ Extract FCM tokens from users
        const fcmTokens = Object.values(users)
            .map(user => user.fcmToken)
            .filter(token => token); // Remove null values

        if (fcmTokens.length === 0) {
            console.log("⚠️ No registered FCM tokens.");
            return;
        }

        // ✅ Construct a Rich Notification with Custom Data
        const message = {
            notification: { title, body },
            data: {
                deliveryId: delivery.id,
                address: delivery.address,
                city: delivery.city,
                customer: delivery.customer || "Unknown",
                status: delivery.status ? "נמסר" : "ממתין", // Delivered / Pending
            },
            tokens: fcmTokens, // ✅ Send to multiple devices
        };

        const response = await messaging.sendEachForMulticast(message);
        console.log("✅ Custom FCM Notification sent successfully:", response);
        
    } catch (error) {
        console.error("❌ Error sending custom FCM notification:", error);
    }
};




module.exports = { initWebSocket };
