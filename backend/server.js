require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const routes = require('./src/routes/index');
const { errorHandler } = require('./src/middlewares/errorHandler');
const { Server } = require('socket.io');
const http = require('http');

// Import Firebase setup from firebase.js
const { rtdb, messaging } = require('./src/firebase');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins, adjust in production
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors({
    origin: "*", // You may want to restrict this in production
}));
app.use(bodyParser.json());

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('Server is running');
});

// New Delivery Route
app.post('/newDelivery', async (req, res) => {
    try {
        const deliveryData = req.body;
        console.log('New delivery received:', deliveryData);

        // Fetch FCM tokens from Realtime Database
        const tokensSnapshot = await rtdb.ref("fcmTokens").once("value");
        const tokens = tokensSnapshot.exists() ? Object.values(tokensSnapshot.val()) : [];

        if (tokens.length > 0) {
            const payload = {
                notification: {
                    title: "New Delivery Added",
                    body: `Delivery to ${deliveryData.address}, ${deliveryData.city}`,
                },
                data: {
                    deliveryId: deliveryData.id || 'null',
                },
            };

            try {
                // Send the notification to FCM tokens
                const response = await messaging.sendToDevice(tokens, payload);
                console.log("Notification sent successfully:", response);
            } catch (notificationError) {
                console.error("Error sending notification:", notificationError);
            }
        }

        // Emit the delivery data via Socket.IO
        io.emit('newDelivery', deliveryData);
        res.status(200).send({ success: true });
    } catch (error) {
        console.error('Error handling new delivery:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Handle the 'deliveryDeleted' event from the client
  socket.on('deliveryDeleted', (data) => {
    console.log('Delivery deleted:', data);

    // Emit to all connected clients that a delivery was deleted
    io.emit('deliveryDeleted', data);  // This emits to all clients

    // You can also emit to a specific room or client if needed
    // socket.emit('deliveryDeleted', data);  // This would emit only to the current client
  });

  socket.on('deliveryUpdated', (data) => {
    console.log('Delivery Updated:', data);

    // Emit to all connected clients that a delivery was deleted
    io.emit('deliveryUpdated', data);  // This emits to all clients

    // You can also emit to a specific room or client if needed
    // socket.emit('deliveryDeleted', data);  // This would emit only to the current client
  });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

// Error handling middleware
app.use(errorHandler);

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
