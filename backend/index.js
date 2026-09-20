// backend/index.js
const express = require('express');
const cors = require("cors");
const { startScheduler } = require("./services/schedulerService");

const rootRouter = require("./routes/index");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/v1", rootRouter);

// Start the scheduled payment processor
startScheduler(); // Runs every minute by default

app.listen(3000, () => {
    console.log('Server running on port 3000');
    console.log('Scheduled payment processor started');
});