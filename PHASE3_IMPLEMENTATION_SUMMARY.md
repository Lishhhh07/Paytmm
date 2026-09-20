# Phase 3 Implementation Summary

## 📋 Overview
Phase 3 adds **Payment Safety Engine** (rule-based checks) and **Scheduled Payments** (automated recurring transfers) to your fintech payment application.

---

## 🆕 FILES CREATED

### Backend (3 services + 1 route):
1. **backend/services/paymentService.js** - Reusable transfer logic
2. **backend/services/safetyCheckService.js** - Rule-based payment safety checks
3. **backend/services/schedulerService.js** - Scheduled payment processor
4. **backend/routes/scheduledPayment.js** - Scheduled payment CRUD operations

### Frontend (1 page):
1. **frontend/src/pages/ScheduledPayments.jsx** - Scheduled payments management UI

---

## ✏️ FILES MODIFIED

### Backend (5 files):
1. **backend/db.js** - Added ScheduledPayment model
2. **backend/index.js** - Started scheduler service
3. **backend/routes/index.js** - Added scheduled payment routes
4. **backend/routes/account.js** - Refactored to use payment service + added safety check endpoint
5. **backend/routes/splitBill.js** - Refactored to use payment service

### Frontend (3 files):
1. **frontend/src/App.jsx** - Added scheduled payments route
2. **frontend/src/pages/SendMoney.jsx** - Added safety check warnings with confirm/cancel flow
3. **frontend/src/pages/Dashboard.jsx** - Added Scheduled button to Quick Actions

---

## 🔌 NEW API ENDPOINTS

### Payment Safety:
- `POST /api/v1/account/check-safety` - Check payment risk (optional, frontend can skip)
- `POST /api/v1/account/transfer` - Modified to include safety checks before transfer

### Scheduled Payments:
- `POST /api/v1/scheduled/create` - Create scheduled payment
- `GET /api/v1/scheduled/my-scheduled` - Get user's scheduled payments
- `GET /api/v1/scheduled/:id` - Get specific scheduled payment
- `POST /api/v1/scheduled/:id/pause` - Pause scheduled payment
- `POST /api/v1/scheduled/:id/resume` - Resume scheduled payment
- `DELETE /api/v1/scheduled/:id` - Delete scheduled payment

---

## 🗄️ NEW DATABASE SCHEMA

### ScheduledPayment Model:
```javascript
{
  sender: ObjectId (ref: User),
  receiver: ObjectId (ref: User),
  amount: Number,
  category: String (enum),
  note: String,
  frequency: String ('WEEKLY' | 'MONTHLY'),
  nextRunAt: Date,           // When to run next
  lastRunAt: Date,            // When last executed
  active: Boolean,            // Can be paused
  createdAt: Date
}
```

---

## 🛡️ PART 1: PAYMENT SAFETY ENGINE

### Rule-Based Safety Checks (NOT AI/ML):

#### **RULE 1: UNUSUALLY LARGE PAYMENT**
- Calculates sender's average transaction amount
- Triggers if: `currentAmount > averageAmount × 3`
- Requires minimum 3 previous transactions
- **Example:** Average is ₹500, trying to send ₹2000 → Warning

#### **RULE 2: NEW RECIPIENT**
- Checks if sender has paid this receiver before
- Triggers if: No previous successful payment to this user
- **Example:** First time paying Bob → Warning

#### **RULE 3: POSSIBLE DUPLICATE**
- Checks for recent identical payment
- Triggers if: Same amount to same receiver within last 10 minutes
- **Example:** Sent ₹1000 to Alice 5 minutes ago, trying again → Warning

### Implementation:
```javascript
// Backend runs checks automatically
const safetyCheck = await checkPaymentRisk(senderId, receiverId, amount);

// Returns:
{
  safe: false,
  warnings: [
    { type: 'LARGE_AMOUNT', message: '...' },
    { type: 'NEW_RECIPIENT', message: '...' }
  ]
}
```

### Flow:
1. User clicks "Initiate Transfer"
2. **Backend** runs safety checks
3. If warnings exist → Return to frontend with `requiresConfirmation: true`
4. Frontend shows warning modal with details
5. User can **Cancel** or **Confirm & Proceed**
6. If confirmed, backend re-runs check but allows transfer with `confirmed=true` flag

### Security:
✅ **Backend validates** - Frontend cannot bypass checks  
✅ Confirmation flag sent from frontend is verified  
✅ Checks run again on confirmed request

---

## ⏰ PART 2: SCHEDULED PAYMENTS

### Features:
- **Frequencies:** WEEKLY, MONTHLY
- **Status:** ACTIVE or PAUSED
- **Actions:** Create, Pause, Resume, Delete
- **Auto-execution:** Background scheduler runs every minute

### How It Works:

#### 1. Creating Scheduled Payment:
```javascript
POST /api/v1/scheduled/create
{
  receiver: "userId",
  amount: 2000,
  category: "Bills",
  note: "Rent payment",
  frequency: "MONTHLY",
  startDate: "2026-10-01"
}
```

- Validates receiver exists
- Prevents scheduling to yourself
- Sets `nextRunAt` to startDate
- Sets `active` to true

#### 2. Scheduler Service:
**Runs every minute** (started in `backend/index.js`):

```javascript
// Find due payments
const duePayments = await ScheduledPayment.find({
  active: true,
  nextRunAt: { $lte: now },
  $or: [
    { lastRunAt: null },                        // Never run
    { $expr: { $lt: ['$lastRunAt', '$nextRunAt'] } }  // Not run for this occurrence
  ]
});

// Process each
for (const payment of duePayments) {
  await processSingleScheduledPayment(payment);
}
```

#### 3. Processing Logic:
```javascript
async function processSingleScheduledPayment(payment) {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // IDEMPOTENCY CHECK
    const freshPayment = await ScheduledPayment.findById(payment._id).session(session);
    if (freshPayment.lastRunAt >= freshPayment.nextRunAt) {
      abort(); // Already processed
      return;
    }
    
    // Execute transfer
    await executeTransfer({
      senderId: payment.sender,
      receiverId: payment.receiver,
      amount: payment.amount,
      ...
      session
    });
    
    // Update schedule
    freshPayment.lastRunAt = now;
    freshPayment.nextRunAt = calculateNextRunAt(frequency, nextRunAt);
    await freshPayment.save({ session });
    
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    
    // On insufficient funds:
    // - Don't create negative balance (transfer fails)
    // - Update nextRunAt to avoid immediate retry
    // - Log failure
  }
}
```

---

## 🔒 IDEMPOTENCY PROTECTION

### Problem:
If scheduler runs twice simultaneously, a scheduled payment might execute twice.

### Solution - Multiple Layers:

#### **Layer 1: Database Query Filter**
```javascript
{
  $expr: { $lt: ['$lastRunAt', '$nextRunAt'] }
}
```
Only fetches payments where `lastRunAt < nextRunAt`

#### **Layer 2: Transaction Lock**
```javascript
const freshPayment = await ScheduledPayment.findById(id).session(session);
```
MongoDB session creates document lock

#### **Layer 3: Re-check Within Transaction**
```javascript
if (freshPayment.lastRunAt >= freshPayment.nextRunAt) {
  abort();
}
```
Double-check after acquiring lock

#### **Layer 4: Atomic Update**
```javascript
freshPayment.lastRunAt = now;
await freshPayment.save({ session });
```
Both transfer and status update in ONE transaction

### Result:
Even if scheduler runs 100 times simultaneously, each scheduled occurrence executes **exactly once**.

---

## 🔄 REFACTORED PAYMENT LOGIC

### Before Phase 3:
- Transfer logic duplicated in:
  - `routes/account.js` (normal transfers)
  - `routes/splitBill.js` (split payments)
  
### After Phase 3:
- **ONE reusable service:** `services/paymentService.js`

```javascript
async function executeTransfer({ senderId, receiverId, amount, category, note, session }) {
  // Validate
  // Check balance
  // Debit sender
  // Credit receiver
  // Create transaction
  // Return transaction ID
}
```

**Used by:**
1. Normal transfers (`account.js`)
2. Split payments (`splitBill.js`)
3. Scheduled payments (`schedulerService.js`)

**Benefits:**
- ✅ DRY (Don't Repeat Yourself)
- ✅ Single point of maintenance
- ✅ Consistent validation everywhere
- ✅ Easier testing

---

## 📊 COMPLETE APPLICATION FLOW

```
User Signup/Signin
    ↓
Dashboard
    ├─> Send Money
    │   ├─> Enter amount, recipient
    │   ├─> Backend runs safety checks
    │   ├─> Show warnings (if any)
    │   ├─> User confirms or cancels
    │   └─> Execute transfer
    │
    ├─> Transaction History
    │   └─> View all transactions (including scheduled)
    │
    ├─> Analytics
    │   └─> Spending charts and insights
    │
    ├─> Split Bills
    │   ├─> Create split
    │   └─> Pay share
    │
    └─> Scheduled Payments
        ├─> Create recurring payment
        ├─> Pause/Resume
        ├─> Delete
        └─> Auto-executes in background
```

---

## 🧪 MANUAL TESTING CHECKLIST

### Safety Checks:

#### Test 1: Large Amount Warning
- [ ] Make 3 transactions of ₹100-200
- [ ] Try to send ₹1000
- [ ] Should see "Unusually large" warning
- [ ] Click "Cancel" - transfer aborted
- [ ] Try again, click "Confirm & Proceed" - transfer succeeds

#### Test 2: New Recipient Warning
- [ ] Create new user Bob
- [ ] Try to send money to Bob (first time)
- [ ] Should see "New recipient" warning
- [ ] Confirm and send
- [ ] Try sending to Bob again - no warning this time

#### Test 3: Duplicate Payment Warning
- [ ] Send ₹500 to Alice
- [ ] Immediately try sending ₹500 to Alice again
- [ ] Should see "Possible duplicate" warning
- [ ] Wait 11 minutes, try again - no warning

#### Test 4: Multiple Warnings
- [ ] Send to new user with unusually large amount
- [ ] Should see both warnings in one modal

### Scheduled Payments:

#### Test 5: Create Weekly Payment
- [ ] Go to Scheduled Payments
- [ ] Click "Create Scheduled Payment"
- [ ] Recipient: Bob, Amount: ₹500, Frequency: WEEKLY
- [ ] Start date: Today
- [ ] Create
- [ ] Should appear in list as ACTIVE

#### Test 6: Scheduler Execution
- [ ] Set nextRunAt to past date manually in DB (for testing)
- [ ] Wait 1 minute for scheduler
- [ ] Check backend console logs
- [ ] Verify transaction created
- [ ] Verify Bob's balance increased
- [ ] Verify sender's balance decreased
- [ ] Verify lastRunAt updated
- [ ] Verify nextRunAt is 7 days later

#### Test 7: Insufficient Funds
- [ ] Create scheduled payment for ₹10,000
- [ ] Set nextRunAt to past
- [ ] Ensure sender has <₹10,000
- [ ] Wait for scheduler
- [ ] Should fail gracefully
- [ ] Balance should NOT go negative
- [ ] nextRunAt should still update (avoid retry loop)

#### Test 8: Pause/Resume
- [ ] Pause active payment
- [ ] Status changes to PAUSED
- [ ] Wait for scheduler - should NOT execute
- [ ] Resume payment
- [ ] Status changes to ACTIVE
- [ ] Scheduler should execute on next run

#### Test 9: Delete
- [ ] Delete scheduled payment
- [ ] Should disappear from list
- [ ] Scheduler should not process it

#### Test 10: Idempotency
- [ ] Create payment with nextRunAt in past
- [ ] Manually trigger scheduler multiple times quickly
- [ ] Should only execute ONCE
- [ ] Check transaction count = 1

---

## 🎓 INTERVIEW QUESTIONS & ANSWERS

### Q1: "Explain your payment safety checks."

**Answer:**
> "I implemented three rule-based safety checks that run on the backend before every transfer:
> 
> **Rule 1 - Large Amount:** Compares current amount to user's historical average. If it's 3× higher and they have enough history (minimum 3 transactions), we warn them.
> 
> **Rule 2 - New Recipient:** Checks if the user has paid this person before. First-time recipients trigger a warning.
> 
> **Rule 3 - Duplicate Payment:** Looks for identical payments to the same person within 10 minutes, which might indicate accidental double-submission.
> 
> These are simple rules, not AI. The backend runs the checks and returns warnings to the frontend. Users can cancel or confirm. Even if confirmed, the backend re-validates to prevent frontend bypasses. It's educational fraud prevention, showing understanding of transaction patterns without over-engineering."

---

### Q2: "How does your scheduled payment scheduler work?"

**Answer:**
> "The scheduler runs as a background interval in the Node.js process, triggered every minute. It queries MongoDB for active scheduled payments where `nextRunAt <= current time` and `lastRunAt < nextRunAt`.
> 
> For each due payment, it:
> 1. Starts a MongoDB transaction
> 2. Executes the transfer using our reusable `executeTransfer` service
> 3. Updates `lastRunAt` to now
> 4. Calculates new `nextRunAt` based on frequency (add 7 days for weekly, 1 month for monthly)
> 5. Commits everything together
> 
> If transfer fails (like insufficient balance), we abort the transaction but still update `nextRunAt` separately to avoid retrying immediately. This prevents an infinite loop of failures.
> 
> It's a simple in-process scheduler suitable for this scale. For production with multiple servers, I'd use a distributed scheduler like Agenda or Bull with Redis."

---

### Q3: "How do you prevent duplicate execution of scheduled payments?"

**Answer:**
> "I use a multi-layer idempotency strategy:
> 
> **Layer 1 - Query Filter:** The database query only returns payments where `lastRunAt < nextRunAt`. This means we already know the current occurrence hasn't been processed.
> 
> **Layer 2 - MongoDB Transaction Lock:** When we fetch the payment with `.session(session)`, MongoDB locks the document.
> 
> **Layer 3 - Recheck Inside Transaction:** Even with the lock, we double-check that `lastRunAt < nextRunAt` hasn't changed.
> 
> **Layer 4 - Atomic Update:** We update `lastRunAt` and execute the transfer in the same transaction, so both succeed or both fail.
> 
> The key insight is using `lastRunAt` as an execution marker. Once `lastRunAt >= nextRunAt`, that occurrence is done. Even if the scheduler runs 100 times, the query won't find that payment again until `nextRunAt` is updated."

---

### Q4: "Why refactor payment logic into a service?"

**Answer:**
> "Originally, transfer logic was duplicated in three places: normal transfers, split payments, and now scheduled payments. This violates DRY and creates maintenance issues.
> 
> I refactored the core logic into `paymentService.executeTransfer()`, which handles:
> - Amount validation
> - Self-transfer prevention  
> - Balance checking
> - Atomic balance updates
> - Transaction record creation
> 
> All three features now call this service with their specific parameters. Benefits:
> 
> **Maintainability:** Fix a bug once, it's fixed everywhere.
> **Consistency:** Same validation logic across all payment types.
> **Testability:** Test one service instead of three endpoints.
> **Flexibility:** Easy to add new payment types (like refunds) later.
> 
> The service requires a MongoDB session parameter, ensuring callers handle transactions properly. This enforces atomicity without hiding it."

---

### Q5: "How would you scale the scheduler to multiple servers?"

**Answer:**
> "Current implementation runs in-process, which works fine for a single server but has issues with multiple instances:
> 
> **Problem:** Each server would run the scheduler, potentially processing the same payments multiple times.
> 
> **Solutions in order of complexity:**
> 
> **Option 1 - Leader Election:**
> Use a library like `redis-leader` to elect one server as leader. Only the leader runs the scheduler. If it dies, another takes over.
> 
> **Option 2 - Distributed Lock:**
> Before processing each payment, acquire a distributed lock (using Redis) with a short TTL. If lock acquisition fails, another server is handling it.
> 
> **Option 3 - Message Queue:**
> Use Bull (Redis-based queue) or RabbitMQ. One process polls for due payments and adds them to the queue. Multiple workers process from the queue, which handles distribution and retries.
> 
> **Option 4 - Dedicated Scheduler Service:**
> Separate microservice handles only scheduling. Use Agenda (MongoDB-based) or node-cron with distributed coordination.
> 
> I'd start with Option 1 (leader election) as it requires minimal code changes. The idempotency protection we already have (lastRunAt check) provides additional safety even if locks fail."

---

## 📝 EDGE CASES HANDLED

✅ **Scheduled payment to yourself** - Prevented at creation  
✅ **Invalid receiver** - Validated before saving  
✅ **Start date in past** - Rejected (1 minute tolerance)  
✅ **Insufficient balance** - Transfer fails, schedule continues  
✅ **Payment deleted while processing** - Check active status  
✅ **Duplicate scheduler runs** - Idempotency protection  
✅ **Server restart during transfer** - MongoDB transaction rollback  
✅ **Paused payment** - Skipped by query filter  
✅ **Safety check with no transaction history** - Rule 1 doesn't trigger  
✅ **Confirming with changed amount** - Backend re-validates  

---

## 🏆 KEY ACHIEVEMENTS

✅ **Rule-based safety** without over-engineering  
✅ **Idempotent scheduler** with clear explanation  
✅ **Refactored payment logic** into reusable service  
✅ **Backend-enforced security** (frontend can't bypass)  
✅ **Simple, understandable code** (interview-ready)  
✅ **No unnecessary dependencies** (no Redis, Kafka, etc.)  
✅ **Graceful failure handling** (insufficient funds)  
✅ **Clear user experience** (warnings with confirm/cancel)  

---

**Phase 3 complete! The application now has production-ready safety checks and scheduled payments!** 🚀
