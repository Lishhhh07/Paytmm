const { ScheduledPayment } = require('../db');
const { executeTransfer } = require('./paymentService');
const { default: mongoose } = require('mongoose');

/**
 * Scheduled Payment Processor
 * 
 * This service periodically checks for due scheduled payments and processes them.
 * 
 * IDEMPOTENCY PROTECTION:
 * Uses lastRunAt field to prevent duplicate execution.
 * A scheduled payment is only processed if:
 * 1. It's active
 * 2. nextRunAt <= current time
 * 3. lastRunAt < nextRunAt (not already processed for this occurrence)
 * 
 * This ensures that even if the scheduler runs multiple times,
 * each scheduled payment occurrence is processed exactly once.
 */

// Helper to calculate next run date
function calculateNextRunAt(frequency, currentDate = new Date()) {
    const nextDate = new Date(currentDate);
    
    if (frequency === 'WEEKLY') {
        nextDate.setDate(nextDate.getDate() + 7);
    } else if (frequency === 'MONTHLY') {
        nextDate.setMonth(nextDate.getMonth() + 1);
    }
    
    return nextDate;
}

/**
 * Process all due scheduled payments
 * Should be called periodically (e.g., every minute)
 */
async function processScheduledPayments() {
    try {
        const now = new Date();
        
        // Find active scheduled payments that are due
        // IDEMPOTENCY: Only get payments where lastRunAt < nextRunAt
        // This prevents processing the same occurrence twice
        const duePayments = await ScheduledPayment.find({
            active: true,
            nextRunAt: { $lte: now },
            $or: [
                { lastRunAt: null },                          // Never executed
                { $expr: { $lt: ['$lastRunAt', '$nextRunAt'] } }  // Not processed for this occurrence
            ]
        }).populate('sender', 'firstName lastName')
          .populate('receiver', 'firstName lastName');

        console.log(`[Scheduler] Found ${duePayments.length} due payment(s) to process`);

        for (const payment of duePayments) {
            await processSingleScheduledPayment(payment);
        }

        return {
            processed: duePayments.length,
            timestamp: now
        };
    } catch (error) {
        console.error('[Scheduler] Error processing scheduled payments:', error);
        return {
            processed: 0,
            error: error.message,
            timestamp: new Date()
        };
    }
}

/**
 * Process a single scheduled payment
 * Wrapped in MongoDB transaction for atomicity
 */
async function processSingleScheduledPayment(payment) {
    const session = await mongoose.startSession();
    
    try {
        session.startTransaction();

        // Double-check idempotency within transaction
        // Fetch fresh copy with session lock
        const freshPayment = await ScheduledPayment.findById(payment._id).session(session);
        
        if (!freshPayment || !freshPayment.active) {
            await session.abortTransaction();
            console.log(`[Scheduler] Payment ${payment._id} no longer active, skipping`);
            return;
        }

        // CRITICAL IDEMPOTENCY CHECK
        // If lastRunAt >= nextRunAt, this occurrence was already processed
        if (freshPayment.lastRunAt && freshPayment.lastRunAt >= freshPayment.nextRunAt) {
            await session.abortTransaction();
            console.log(`[Scheduler] Payment ${payment._id} already processed for this occurrence, skipping`);
            return;
        }

        // Execute the transfer
        try {
            const result = await executeTransfer({
                senderId: freshPayment.sender,
                receiverId: freshPayment.receiver,
                amount: freshPayment.amount,
                category: freshPayment.category,
                note: `Scheduled payment: ${freshPayment.note || 'Recurring payment'}`,
                session
            });

            // Update scheduled payment record
            const currentNextRunAt = freshPayment.nextRunAt;
            freshPayment.lastRunAt = new Date();
            freshPayment.nextRunAt = calculateNextRunAt(freshPayment.frequency, currentNextRunAt);
            await freshPayment.save({ session });

            await session.commitTransaction();

            console.log(`[Scheduler] ✓ Processed payment ${payment._id} - Transaction ${result.transactionId}`);
        } catch (transferError) {
            // Transfer failed (likely insufficient balance)
            await session.abortTransaction();
            
            console.log(`[Scheduler] ✗ Payment ${payment._id} failed: ${transferError.message}`);
            
            // Update nextRunAt anyway to avoid retrying immediately
            // This uses a separate operation (not in failed transaction)
            await ScheduledPayment.findByIdAndUpdate(payment._id, {
                nextRunAt: calculateNextRunAt(payment.frequency, payment.nextRunAt)
            });
            
            // Note: In production, you might want to:
            // - Send notification to user
            // - Increment failure counter
            // - Auto-pause after N failures
        }
    } catch (error) {
        await session.abortTransaction();
        console.error(`[Scheduler] Error processing payment ${payment._id}:`, error);
    } finally {
        session.endSession();
    }
}

/**
 * Start the scheduler
 * Runs every minute by default
 */
function startScheduler(intervalMinutes = 1) {
    console.log(`[Scheduler] Starting scheduler (interval: ${intervalMinutes} minute(s))`);
    
    // Run immediately on start
    processScheduledPayments();
    
    // Then run periodically
    const intervalMs = intervalMinutes * 60 * 1000;
    setInterval(processScheduledPayments, intervalMs);
}

module.exports = {
    startScheduler,
    processScheduledPayments
};
