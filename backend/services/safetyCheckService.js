const { Transaction } = require('../db');
const { default: mongoose } = require('mongoose');

/**
 * Rule-based payment safety checks
 * 
 * This is NOT machine learning or AI fraud detection.
 * These are simple rules to warn users about potentially risky payments.
 * 
 * Returns: { safe: boolean, warnings: [ { type, message } ] }
 */
async function checkPaymentRisk(senderId, receiverId, amount) {
    const warnings = [];

    try {
        // RULE 1: UNUSUALLY LARGE PAYMENT
        // Check if amount is significantly higher than user's average
        const averageCheck = await checkUnusuallyLargePayment(senderId, amount);
        if (averageCheck) {
            warnings.push(averageCheck);
        }

        // RULE 2: NEW RECIPIENT
        // Check if sender has paid this receiver before
        const newRecipientCheck = await checkNewRecipient(senderId, receiverId);
        if (newRecipientCheck) {
            warnings.push(newRecipientCheck);
        }

        // RULE 3: POSSIBLE DUPLICATE
        // Check for recent payment with same amount to same receiver
        const duplicateCheck = await checkPossibleDuplicate(senderId, receiverId, amount);
        if (duplicateCheck) {
            warnings.push(duplicateCheck);
        }

        return {
            safe: warnings.length === 0,
            warnings
        };
    } catch (error) {
        console.error('Error in safety check:', error);
        // On error, allow payment to proceed (fail open)
        return { safe: true, warnings: [] };
    }
}

/**
 * RULE 1: Check if payment is unusually large compared to user's average
 * Only triggers if user has enough transaction history (minimum 3 transactions)
 */
async function checkUnusuallyLargePayment(senderId, amount) {
    const MINIMUM_TRANSACTIONS = 3;
    const LARGE_PAYMENT_MULTIPLIER = 3;

    // Get sender's previous successful sent transactions
    const previousTransactions = await Transaction.find({
        senderId: new mongoose.Types.ObjectId(senderId),
        status: 'Success'
    }).select('amount');

    // Need enough history to calculate meaningful average
    if (previousTransactions.length < MINIMUM_TRANSACTIONS) {
        return null; // Not enough data
    }

    // Calculate average
    const totalAmount = previousTransactions.reduce((sum, txn) => sum + txn.amount, 0);
    const averageAmount = totalAmount / previousTransactions.length;

    // Check if current amount is significantly higher
    if (amount > averageAmount * LARGE_PAYMENT_MULTIPLIER) {
        return {
            type: 'LARGE_AMOUNT',
            message: `This amount (₹${amount}) is significantly higher than your average payment (₹${averageAmount.toFixed(2)}). Please verify before proceeding.`
        };
    }

    return null;
}

/**
 * RULE 2: Check if this is a new recipient
 * User has never sent money to this receiver before
 */
async function checkNewRecipient(senderId, receiverId) {
    const previousPayment = await Transaction.findOne({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        status: 'Success'
    });

    if (!previousPayment) {
        return {
            type: 'NEW_RECIPIENT',
            message: 'You haven\'t paid this user before. Please verify the recipient details.'
        };
    }

    return null;
}

/**
 * RULE 3: Check for possible duplicate payment
 * Same amount to same receiver within last 10 minutes
 */
async function checkPossibleDuplicate(senderId, receiverId, amount) {
    const DUPLICATE_CHECK_WINDOW = 10; // minutes

    const tenMinutesAgo = new Date(Date.now() - DUPLICATE_CHECK_WINDOW * 60 * 1000);

    const recentSimilarPayment = await Transaction.findOne({
        senderId: new mongoose.Types.ObjectId(senderId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        amount: amount,
        status: 'Success',
        createdAt: { $gte: tenMinutesAgo }
    });

    if (recentSimilarPayment) {
        return {
            type: 'POSSIBLE_DUPLICATE',
            message: `You recently sent ₹${amount} to this user ${Math.round((Date.now() - recentSimilarPayment.createdAt) / 60000)} minutes ago. This might be a duplicate payment.`
        };
    }

    return null;
}

module.exports = {
    checkPaymentRisk
};
