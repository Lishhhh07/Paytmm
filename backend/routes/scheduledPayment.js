const express = require('express');
const { authMiddleware } = require('../middleware');
const { ScheduledPayment, User } = require('../db');

const router = express.Router();

// Helper to calculate next run date
function calculateNextRunAt(frequency, startDate = new Date()) {
    const nextDate = new Date(startDate);
    
    if (frequency === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
}

// Create scheduled payment
router.post("/create", authMiddleware, async (req, res) => {
    try {
        const { receiver, amount, category, note, frequency, startDate } = req.body;

        // Validation
        if (!receiver || !amount || !frequency) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        if (!['WEEKLY', 'MONTHLY'].includes(frequency)) {
            return res.status(400).json({ message: "Invalid frequency. Must be WEEKLY or MONTHLY" });
        }

        // Prevent scheduling payment to yourself
        if (req.userId === receiver) {
            return res.status(400).json({ message: "Cannot schedule payment to yourself" });
        }

        // Verify receiver exists
        const receiverUser = await User.findById(receiver);
        if (!receiverUser) {
            return res.status(400).json({ message: "Receiver not found" });
        }

        // Parse and validate start date
        const nextRunAt = startDate ? new Date(startDate) : new Date();
        if (isNaN(nextRunAt.getTime())) {
            return res.status(400).json({ message: "Invalid start date" });
        }

        // Ensure start date is not in the past (allow within 1 minute tolerance)
        const now = new Date();
        if (nextRunAt < new Date(now.getTime() - 60000)) {
            return res.status(400).json({ message: "Start date cannot be in the past" });
        }

        // Create scheduled payment
        const scheduledPayment = await ScheduledPayment.create({
            sender: req.userId,
            receiver,
            amount,
            category: category || 'Other',
            note: note || '',
            frequency,
            nextRunAt,
            active: true
        });

        // Populate user details
        const populated = await ScheduledPayment.findById(scheduledPayment._id)
            .populate('sender', 'firstName lastName')
            .populate('receiver', 'firstName lastName');

        res.json({
            message: "Scheduled payment created successfully",
            scheduledPayment: populated
        });
    } catch (error) {
        res.status(500).json({
            message: "Error creating scheduled payment",
            error: error.message
        });
    }
});

// Get all scheduled payments for logged-in user
router.get("/my-scheduled", authMiddleware, async (req, res) => {
    try {
        const scheduledPayments = await ScheduledPayment.find({
            sender: req.userId
        })
        .populate('sender', 'firstName lastName')
        .populate('receiver', 'firstName lastName')
        .sort({ createdAt: -1 });

        res.json({ scheduledPayments });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching scheduled payments",
            error: error.message
        });
    }
});

// Get specific scheduled payment
router.get("/:id", authMiddleware, async (req, res) => {
    try {
        const scheduledPayment = await ScheduledPayment.findById(req.params.id)
            .populate('sender', 'firstName lastName')
            .populate('receiver', 'firstName lastName');

        if (!scheduledPayment) {
            return res.status(404).json({ message: "Scheduled payment not found" });
        }

        // Check ownership
        if (scheduledPayment.sender._id.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        res.json({ scheduledPayment });
    } catch (error) {
        res.status(500).json({
            message: "Error fetching scheduled payment",
            error: error.message
        });
    }
});

// Pause scheduled payment
router.post("/:id/pause", authMiddleware, async (req, res) => {
    try {
        const scheduledPayment = await ScheduledPayment.findById(req.params.id);

        if (!scheduledPayment) {
            return res.status(404).json({ message: "Scheduled payment not found" });
        }

        // Check ownership
        if (scheduledPayment.sender.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (!scheduledPayment.active) {
            return res.status(400).json({ message: "Scheduled payment is already paused" });
        }

        scheduledPayment.active = false;
        await scheduledPayment.save();

        res.json({
            message: "Scheduled payment paused successfully",
            scheduledPayment
        });
    } catch (error) {
        res.status(500).json({
            message: "Error pausing scheduled payment",
            error: error.message
        });
    }
});

// Resume scheduled payment
router.post("/:id/resume", authMiddleware, async (req, res) => {
    try {
        const scheduledPayment = await ScheduledPayment.findById(req.params.id);

        if (!scheduledPayment) {
            return res.status(404).json({ message: "Scheduled payment not found" });
        }

        // Check ownership
        if (scheduledPayment.sender.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        if (scheduledPayment.active) {
            return res.status(400).json({ message: "Scheduled payment is already active" });
        }

        scheduledPayment.active = true;
        await scheduledPayment.save();

        res.json({
            message: "Scheduled payment resumed successfully",
            scheduledPayment
        });
    } catch (error) {
        res.status(500).json({
            message: "Error resuming scheduled payment",
            error: error.message
        });
    }
});

// Delete/Cancel scheduled payment
router.delete("/:id", authMiddleware, async (req, res) => {
    try {
        const scheduledPayment = await ScheduledPayment.findById(req.params.id);

        if (!scheduledPayment) {
            return res.status(404).json({ message: "Scheduled payment not found" });
        }

        // Check ownership
        if (scheduledPayment.sender.toString() !== req.userId) {
            return res.status(403).json({ message: "Access denied" });
        }

        await ScheduledPayment.findByIdAndDelete(req.params.id);

        res.json({ message: "Scheduled payment deleted successfully" });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting scheduled payment",
            error: error.message
        });
    }
});

module.exports = router;
