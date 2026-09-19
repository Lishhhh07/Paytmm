const express = require("express");
const cors = require("cors");
app.use(cors());
const rootRouter = require("./routes/index");
const app = express();
app.use(express.json());
app.use("/api/v1", rootRouter);


