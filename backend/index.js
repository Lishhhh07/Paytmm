const express = require("express");
const cors = require("cors");

const rootRouter = require("./routes/index");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/v1", rootRouter);

// Start server
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});