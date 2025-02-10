const { Server } = require("socket.io");

let io; // Define `io` globally

const initWebSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Update this for production security
            methods: ["GET", "POST"],
        },
    });

    io.on("connection", (socket) => {
        const userId = socket.handshake.query.userId; // Get user ID from the client
        console.log(`🔌 User connected: ${userId} (Socket ID: ${socket.id})`);
    
        socket.on("newDelivery", (data) => {
            console.log("📦 New delivery received:", data);
            io.emit("updateDeliveries", data); // Broadcast update to all clients
        });
    
        socket.on("disconnect", () => {
            console.log(`❌ User disconnected: ${userId} (Socket ID: ${socket.id})`);
        });
    });
    

    return io;
};

// Function to send real-time updates
const sendRealTimeUpdate = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = { initWebSocket, sendRealTimeUpdate };
