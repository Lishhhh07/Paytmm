const { Account, Transaction } = require('../db');
const { default: mongoose } = require('mongoose');

// Helper function to generate readable transaction ID
function generateTransactionId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp}${randomStr}`;
}

/**
 * Reusable transfer logic used by:
 * - Normal user transfers
 * - Split bill payments
 * - Scheduled payments
 * 
 * IMPORTANT: Must be called within a MongoDB transaction session
 */
async function executeTransfer({ senderId, receiverId, amount, category, note, session }) {
    // Validate amount
    if (!amount || amount <= 0) {
        throw new Error("Invalid amount");
    }

    // Prevent sending money to yourself
    if (senderId.toString() === receiverId.toString()) {
        throw new Error("Cannot transfer money to yourself");
    }

    // Fetch sender account
    const senderAccount = await Account.findOne({ userId: senderId }).session(session);
    if (!senderAccount || senderAccount.balance < amount) {
        throw new Error("Insufficient balance");
    }

    // Fetch receiver account
    const receiverAccount = await Account.findOne({ userId: receiverId }).session(session);
    if (!receiverAccount) {
        throw new Error("Invalid receiver account");
    }

    // Perform atomic balance updates
    await Account.updateOne(
        { userId: senderId }, 
        { $inc: { balance: -amount } }
    ).session(session);

    await Account.updateOne(
        { userId: receiverId }, 
        { $inc: { balance: amount } }
    ).session(session);

    // Create transaction record
    const transactionId = generateTransactionId();
    await Transaction.create([{
        transactionId,
        senderId,
        receiverId,
        amount,
        category: category || 'Other',
        note: note || '',
        status: 'Success'
    }], { session });

    return { transactionId };
}

module.exports = {
    executeTransfer,
    generateTransactionId
};
