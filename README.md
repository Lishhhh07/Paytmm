# PayTM-Style Payment Application 

A full-stack MERN payment application with transaction tracking, spending analytics, and split bill functionality.

##  Features

### Phase 1: Core Payment System
- ✅ User authentication (JWT)
- ✅ Money transfers between users
- ✅ Transaction history with filtering & pagination
- ✅ Real-time balance tracking
- ✅ Transaction categories (Food, Travel, Shopping, Bills, Education, Other)
- ✅ MongoDB transactions for atomicity

### Phase 2: Analytics & Split Bills
- ✅ Spending analytics dashboard
- ✅ Category-wise spending breakdown (bar chart)
- ✅ Monthly spending trends (line chart)
- ✅ Auto-generated financial insights
- ✅ Split bill creation (equal splits)
- ✅ Split bill payment tracking
- ✅ Settlement progress indicators

---

## 🛠️ Tech Stack

**Frontend:**
- React 18
- React Router DOM
- Axios
- Tailwind CSS
- Recharts (data visualization)
- Vite

**Backend:**
- Node.js
- Express
- MongoDB with Mongoose
- JWT for authentication
- Zod for validation

---

##  Installation

### Prerequisites:
- Node.js (v14+)
- MongoDB (v4+)
- npm or yarn

### Setup:

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Paytmm
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install
npm install recharts  # Required for Phase 2 charts
```

4. **Configure environment**
Create `.env` file in root directory:
```
MONGO_URI=mongodb://localhost:27017/paytm
```

5. **Start MongoDB**
```bash
mongod
```

6. **Start backend** (new terminal)
```bash
cd backend
node index.js
```

7. **Start frontend** (new terminal)
```bash
cd frontend
npm run dev
```

8. **Open browser**
Navigate to `http://localhost:5173`

---

## API Endpoints

### Authentication
- `POST /api/v1/user/signup` - Create new account
- `POST /api/v1/user/signin` - Login
- `PUT /api/v1/user` - Update profile
- `GET /api/v1/user/bulk` - Search users

### Transactions
- `GET /api/v1/account/balance` - Get current balance
- `POST /api/v1/account/transfer` - Send money
- `GET /api/v1/account/transactions` - Transaction history (with filters)
- `GET /api/v1/account/analytics` - Spending analytics

### Split Bills
- `POST /api/v1/splitbill/create` - Create split bill
- `GET /api/v1/splitbill/my-splits` - Get all your splits
- `GET /api/v1/splitbill/:splitId` - Get split details
- `POST /api/v1/splitbill/:splitId/pay` - Pay your share

---

##  Database Schema

### User
```javascript
{
  username: String (email, unique),
  password: String,
  firstName: String,
  lastName: String
}
```

### Account
```javascript
{
  userId: ObjectId (ref: User),
  balance: Number
}
```

### Transaction
```javascript
{
  transactionId: String (unique, readable),
  senderId: ObjectId (ref: User),
  receiverId: ObjectId (ref: User),
  amount: Number,
  category: String (enum),
  note: String,
  status: String (Success/Failed),
  createdAt: Date
}
```

### SplitBill
```javascript
{
  creator: ObjectId (ref: User),
  title: String,
  totalAmount: Number,
  participants: [{
    user: ObjectId (ref: User),
    amountOwed: Number,
    status: String (PENDING/PAID),
    transactionId: String
  }],
  createdAt: Date
}
```

---

## Key Features Explained

### MongoDB Transactions
All money transfers use MongoDB transactions to ensure ACID properties. This prevents partial transfers where money is deducted but not credited.

### Spending Analytics
Uses MongoDB aggregation pipelines to calculate statistics directly in the database for optimal performance. Includes:
- Total sent/received/net flow
- Category breakdown
- Monthly spending trends (last 6 months)
- Auto-generated insights

### Split Bills
Equal split functionality where the bill creator has already paid and other participants owe their share. Payment reuses the existing transfer logic, maintaining consistency across collections.

---

## Documentation

- **PHASE2_IMPLEMENTATION_SUMMARY.md** - Phase 2 technical details  
- **PHASE2_INTERVIEW_GUIDE.md** - Phase 2 interview Q&A
- **PHASE2_SETUP_INSTRUCTIONS.md** - Setup and troubleshooting

---

##  Testing

### Quick Test Flow:

1. **Signup** two users (User A & User B)
2. **Login** as User A
3. **Send money** to User B (with category and note)
4. **View transaction history** - should show sent transaction
5. **Login** as User B - should show received transaction
6. **Check analytics** - make multiple transactions to see charts
7. **Create split bill** - include both users
8. **Login** as User B - pay share in split
9. **Verify** - check balances, transaction history, split status

---

##  Security Notes

**This is a learning/demo project. For production, add:**

- Password hashing (bcrypt)
- Input sanitization
- Rate limiting
- HTTPS/TLS
- Refresh tokens
- 2FA for large transfers
- Comprehensive error logging

---

## 🎓 Learning Objectives

This project demonstrates:

- RESTful API design
- MongoDB transactions and atomicity
- JWT authentication
- React hooks (useState, useEffect)
- React Router navigation
- MongoDB aggregation pipelines
- Data visualization with charts
- State management without Redux
- Error handling and validation
- Pagination and filtering
- Responsive UI with Tailwind CSS

---

## 📝 License

MIT License - free to use for learning and personal projects

---

## 👨‍💻 Author

Created as an interview preparation project demonstrating:
- Full-stack development skills
- MongoDB expertise
- React best practices
- System design thinking
- Clean, maintainable code

---

## ⭐ Project Highlights

- **Atomic Transactions**: Ensures data consistency
- **Efficient Aggregation**: Database-level calculations
- **Reusable Code**: Transfer logic reused in split payments
- **Beginner-Friendly**: Clear code structure and documentation
- **Interview-Ready**: Comprehensive Q&A guides

---

**Happy Coding!** 🚀

Remember: This project prioritizes understandability over complexity. Every design decision can be explained and defended in an interview setting.
