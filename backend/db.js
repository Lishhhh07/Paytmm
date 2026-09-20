const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/paytm")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    }
});
const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
});
const Account = mongoose.model('Account', accountSchema);

// Transaction Schema
const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        enum: ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Other'],
        default: 'Other'
    },
    note: {
        type: String,
        maxLength: 200
    },
    status: {
        type: String,
        enum: ['Success', 'Failed'],
        default: 'Success'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

// SplitBill Schema
const splitBillSchema = new mongoose.Schema({
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        maxLength: 100
    },
    totalAmount: {
        type: Number,
        required: true
    },
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amountOwed: {
            type: Number,
            required: true
        },
        status: {
            type: String,
            enum: ['PENDING', 'PAID'],
            default: 'PENDING'
        },
        transactionId: {
            type: String,
            default: null
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const SplitBill = mongoose.model('SplitBill', splitBillSchema);

// ScheduledPayment Schema
const scheduledPaymentSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        enum: ['Food', 'Travel', 'Shopping', 'Bills', 'Education', 'Other'],
        default: 'Other'
    },
    note: {
        type: String,
        maxLength: 200
    },
    frequency: {
        type: String,
        enum: ['WEEKLY', 'MONTHLY'],
        required: true
    },
    nextRunAt: {
        type: Date,
        required: true
    },
    lastRunAt: {
        type: Date,
        default: null
    },
    active: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const ScheduledPayment = mongoose.model('ScheduledPayment', scheduledPaymentSchema);

const User = mongoose.model('User', userSchema);

module.exports = {
	User,
    Account,
    Transaction,
    SplitBill,
    ScheduledPayment
};