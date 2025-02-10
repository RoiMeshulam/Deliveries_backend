require('dotenv').config();
const http = require('http');
const { initWebSocket } = require("./src/services/websocket");
const app = require('./app');

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

// Initialize WebSocket
initWebSocket(server);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});





// // New Delivery Route with WebSocket Integration
// app.post('/newDelivery', async (req, res) => {
//   try {
//       const deliveryData = req.body;
//       console.log('New delivery received:', deliveryData);

//       // Fetch FCM tokens from Firebase Realtime Database
//       const tokensSnapshot = await rtdb.ref("fcmTokens").once("value");
//       const tokens = tokensSnapshot.exists() ? Object.values(tokensSnapshot.val()) : [];

//       if (tokens.length > 0) {
//           const payload = {
//               notification: {
//                   title: "New Delivery Added",
//                   body: `Delivery to ${deliveryData.address}, ${deliveryData.city}`,
//               },
//               data: {
//                   deliveryId: deliveryData.id || 'null',
//               },
//           };

//           try {
//               // Send notification to all FCM tokens
//               const response = await messaging.sendToDevice(tokens, payload);
//               console.log("Notification sent successfully:", response);
//           } catch (notificationError) {
//               console.error("Error sending notification:", notificationError);
//           }
//       }

//       // Emit the delivery data to all connected clients
//       io.emit('newDelivery', deliveryData);

//       res.status(200).send({ success: true });
//   } catch (error) {
//       console.error('Error handling new delivery:', error);
//       res.status(500).send({ success: false, error: error.message });
//   }
// });