const express = require("express");
const cors = require("cors");
const bodyParser = require('body-parser');
const { errorHandler } = require('./src/middlewares/errorHandler');
const routes = require('./src/routes/index');

const app = express();

// Middleware
app.use(cors({
    origin: "*", // Change this in production
}));
app.use(bodyParser.json());

// Routes
app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('Server is running');
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
