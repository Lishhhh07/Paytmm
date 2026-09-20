// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account, Transaction } = require('../db');
const { default: mongoose } = require('mongoose');
const { executeTransfer } = require('../services/paymentService');
const { checkPaymentRisk } = require('../services/safetyCheckService');

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })
});

// Check payment safety before transfer
router.post("/check-safety", authMiddleware, async (req, res) => {
    try {
        const { to, amount } = req.body;

        if (!to || !amount) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const safetyCheck = await checkPaymentRisk(req.userId, to, amount);
        res.json(safetyCheck);
    } catch (error) {
        res.status(500).json({
            message: "Error checking payment safety",
            error: error.message
        });
    }
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const { amount, to, category, note, confirmed } = req.body;

        // Run safety checks (backend validation - don't trust frontend)
        const safetyCheck = await checkPaymentRisk(req.userId, to, amount);
        
        // If warnings exist and user hasn't confirmed, return warnings
        if (!safetyCheck.safe && !confirmed) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Payment requires confirmation",
                requiresConfirmation: true,
                warnings: safetyCheck.warnings
            });
        }

        // Use reusable transfer service
        const result = await executeTransfer({
            senderId: req.userId,
            receiverId: to,
            amount,
            category,
            note,
            session
        });

        await session.commitTransaction();

        res.json({
            message: "Transfer successful",
            transactionId: result.transactionId
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: error.message || "Transfer failed",
            error: error.message
        });
    } finally {
        session.endSession();
    }
});

// Get transaction history
router.get("/transactions", authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const filter = req.query.filter; // 'sent', 'received', or undefined for all
        const category = req.query.category; // Filter by category

        // Build query based on filters
        let query = {
            $or: [
                { senderId: req.userId },
                { receiverId: req.userId }
            ]
        };

        // Apply sent/received filter
        if (filter === 'sent') {
            query = { senderId: req.userId };
        } else if (filter === 'received') {
            query = { receiverId: req.userId };
        }

        // Apply category filter
        if (category) {
            query.category = category;
        }

        // Get total count for pagination
        const total = await Transaction.countDocuments(query);

        // Fetch transactions with populated sender and receiver info
        const transactions = await Transaction.find(query)
            .populate('senderId', 'firstName lastName')
            .populate('receiverId', 'firstName lastName')
            .sort({ createdAt: -1 }) // Newest first
            .skip(skip)
            .limit(limit);

        res.json({
            transactions,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching transactions",
            error: error.message
        });
    }
});

// Get analytics
router.get("/analytics", authMiddleware, async (req, res) => {
    try {
        // Calculate total sent using aggregation
        const sentResult = await Transaction.aggregate([
            { $match: { senderId: new mongoose.Types.ObjectId(req.userId) } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalSent = sentResult.length > 0 ? sentResult[0].total : 0;

        // Calculate total received using aggregation
        const receivedResult = await Transaction.aggregate([
            { $match: { receiverId: new mongoose.Types.ObjectId(req.userId) } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        const totalReceived = receivedResult.length > 0 ? receivedResult[0].total : 0;

        // Calculate net flow
        const netFlow = totalReceived - totalSent;

        // Count total transactions
        const transactionCount = await Transaction.countDocuments({
            $or: [
                { senderId: req.userId },
                { receiverId: req.userId }
            ]
        });

        // Category breakdown (only sent transactions count as expenses)
        const categoryBreakdown = await Transaction.aggregate([
            { $match: { senderId: new mongoose.Types.ObjectId(req.userId) } },
            { 
                $group: { 
                    _id: "$category", 
                    amount: { $sum: "$amount" } 
                } 
            },
            { $project: { _id: 0, category: "$_id", amount: 1 } },
            { $sort: { amount: -1 } }
        ]);

        // Monthly spending trend (last 6 months, only sent transactions)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyTrend = await Transaction.aggregate([
            { 
                $match: { 
                    senderId: new mongoose.Types.ObjectId(req.userId),
                    createdAt: { $gte: sixMonthsAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    total: { $sum: "$amount" }
                }
            },
            { $sort: { "_id.year": 1, "_id.month": 1 } },
            {
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $toString: "$_id.year" },
                            "-",
                            {
                                $cond: {
                                    if: { $lt: ["$_id.month", 10] },
                                    then: { $concat: ["0", { $toString: "$_id.month" }] },
                                    else: { $toString: "$_id.month" }
                                }
                            }
                        ]
                    },
                    total: 1
                }
            }
        ]);

        res.json({
            totalSent,
            totalReceived,
            netFlow,
            transactionCount,
            categoryBreakdown,
            monthlyTrend
        });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching analytics",
            error: error.message
        });
    }
});

module.exports = router;