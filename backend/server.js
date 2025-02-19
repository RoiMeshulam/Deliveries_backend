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

