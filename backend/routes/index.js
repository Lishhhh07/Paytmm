const express = require('express');
const userRouter = require("./user");
const accountRouter = require("./account");
const splitBillRouter = require("./splitBill");
const scheduledPaymentRouter = require("./scheduledPayment");

const router = express.Router();

router.use("/user", userRouter);
router.use("/account", accountRouter);
router.use("/splitbill", splitBillRouter);
router.use("/scheduled", scheduledPaymentRouter);

module.exports = router;