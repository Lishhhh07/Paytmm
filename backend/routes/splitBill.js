const express = require('express');
const { authMiddleware } = require('../middleware');
const { SplitBill, User } = require('../db');
const { default: mongoose } = require('mongoose');
const { executeTransfer } = require('../services/paymentService');

const router = express.Router();

// Create a new split bill (Equal split only)
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { title, totalAmount, participantIds } = req.body;

        // Validation
        if (!title || !totalAmount || !participantIds || !Array.isArray(participantIds)) {
            return res.status(400).json({ message: "Invalid input" });
        }

        if (totalAmount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        if (participantIds.length === 0) {
            return res.status(400).json({ message: "At least one participant required" });
        }

        // Check for duplicate participants
        const uniqueParticipants = [...new Set(participantIds)];
        if (uniqueParticipants.length !== participantIds.length) {
            return res.status(400).json({ message: "Duplicate participants not allowed" });
        }

        // Check if creator is in participants list
        if (!participantIds.includes(req.userId)) {
            return res.status(400).json({ message: "Creator must be included in participants" });
        }

        // Verify all participants exist
        const users = await User.find({ _id: { $in: participantIds } });
        if (users.length !== participantIds.length) {
            return res.status(400).json({ message: "One or more participants not found" });
        }

        // Calculate equal split
        const sharePerPerson = totalAmount / participantIds.length;

        // Create participants array
        const participants = participantIds.map(userId => ({
            user: userId,
            amountOwed: sharePerPerson,
            // Creator's share is automatically marked as PAID
            status: userId === req.userId ? 'PAID' : 'PENDING',
            transactionId: null
        }));

        // Create split bill
        const splitBill = await SplitBill.create({
            creator: req.userId,
            title,
            totalAmount,
            participants
        });

        // Populate user details
        const populatedSplit = await SplitBill.findById(splitBill._id)
            .populate('creator', 'firstName lastName')
            .populate('participants.user', 'firstName lastName');

        res.json({
            message: "Split bill created successfully",
            splitBill: populatedSplit
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating split bill",
            error: error.message
        });
    }
});

// Get all split bills involving the logged-in user
router.get("/my-splits", authMiddleware, async (req, res) => {
    try {
        // Find splits where user is either creator or participant
        const splits = await SplitBill.find({
            $or: [
                { creator: req.userId },
                { 'participants.user': req.userId }
            ]
        })
        .populate('creator', 'firstName lastName')
        .populate('participants.user', 'firstName lastName')
        .sort({ createdAt: -1 });

        res.json({ splits });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching split bills",
            error: error.message
        });
    }
});

// Get details of a specific split bill
router.get("/:splitId", authMiddleware, async (req, res) => {
    try {
        const { splitId } = req.params;

        const split = await SplitBill.findById(splitId)
            .populate('creator', 'firstName lastName')
            .populate('participants.user', 'firstName lastName');

        if (!split) {
            return res.status(404).json({ message: "Split bill not found" });
        }

        // Check if user is part of this split
        const isCreator = split.creator._id.toString() === req.userId;
        const isParticipant = split.participants.some(
            p => p.user._id.toString() === req.userId
        );

        if (!isCreator && !isParticipant) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json({ split });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching split bill details",
            error: error.message
        });
    }
});

// Pay your share in a split bill
router.post("/:splitId/pay", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const { splitId } = req.params;

        // Fetch the split bill
        const split = await SplitBill.findById(splitId).session(session);

        if (!split) {
            await session.abortTransaction();
            return res.status(404).json({ message: "Split bill not found" });
        }

        // Find the participant
        const participantIndex = split.participants.findIndex(
            p => p.user.toString() === req.userId
        );

        if (participantIndex === -1) {
            await session.abortTransaction();
            return res.status(403).json({ message: "You are not part of this split" });
        }

        const participant = split.participants[participantIndex];

        // Check if already paid
        if (participant.status === 'PAID') {
            await session.abortTransaction();
            return res.status(400).json({ message: "You have already paid your share" });
        }

        // Prevent creator from paying themselves
        if (split.creator.toString() === req.userId) {
            await session.abortTransaction();
            return res.status(400).json({ message: "Creator's share is already settled" });
        }

        const amount = participant.amountOwed;

        // Use reusable payment service
        const result = await executeTransfer({
            senderId: req.userId,
            receiverId: split.creator,
            amount,
            category: 'Other',
            note: `Split bill payment: ${split.title}`,
            session
        });

        // Update participant status in split bill
        split.participants[participantIndex].status = 'PAID';
        split.participants[participantIndex].transactionId = result.transactionId;
        await split.save({ session });

        // Commit the transaction
        await session.commitTransaction();

        res.json({
            message: "Payment successful",
            transactionId: result.transactionId
        });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({
            message: error.message || "Payment failed",
            error: error.message
        });
    } finally {
        session.endSession();
    }
});

module.exports = router;
