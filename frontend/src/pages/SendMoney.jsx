import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from "axios";
import { useState, useEffect } from 'react';
import { Navbar } from '../components/Navbar';

export const SendMoney = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const id = searchParams.get("id");
  const name = searchParams.get("name");
  
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(id || '');
  const [selectedUserName, setSelectedUserName] = useState(name || '');
  const [searchFilter, setSearchFilter] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [warnings, setWarnings] = useState([]);
  const [showWarnings, setShowWarnings] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [searchFilter]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/user/bulk?filter=${searchFilter}`);
      setUsers(response.data.user);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user._id);
    setSelectedUserName(`${user.firstName} ${user.lastName}`);
  };

  const handleTransfer = async (confirmed = false) => {
    setError('');

    if (!selectedUser) {
      setError('Please select a recipient');
      return;
    }

    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post("http://localhost:3000/api/v1/account/transfer", {
        to: selectedUser,
        amount: parseFloat(amount),
        category,
        note,
        confirmed
      }, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });

      setTransactionId(response.data.transactionId);
      setSuccess(true);
      setWarnings([]);
      setShowWarnings(false);
    } catch (err) {
      if (err.response?.data?.requiresConfirmation) {
        setWarnings(err.response.data.warnings);
        setShowWarnings(true);
      } else {
        setError(err.response?.data?.message || 'Transfer failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full mx-4 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h2>
            <p className="text-gray-600 mb-2">₹{amount} sent to {selectedUserName}</p>
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Transaction ID</div>
              <div className="font-mono text-sm text-gray-900">{transactionId}</div>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => navigate('/transactions')}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                View Transactions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <span>←</span> Back to Dashboard
        </button>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">Send Money</h1>
            <p className="text-blue-100">Transfer money securely to anyone</p>
          </div>

          <div className="p-8">
            {/* Select Recipient */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Recipient
              </label>
              {selectedUser ? (
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                      {selectedUserName[0].toUpperCase()}
                    </div>
                    <div className="font-semibold text-gray-900">{selectedUserName}</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedUser('');
                      setSelectedUserName('');
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent mb-3"
                  />
                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-xl">
                    {users.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        No users found
                      </div>
                    ) : (
                      users.map(user => (
                        <button
                          key={user._id}
                          onClick={() => handleUserSelect(user)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b last:border-b-0"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {user.firstName[0].toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.username}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedUser && (
              <>
                {/* Amount */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                    disabled={loading}
                  />
                </div>

                {/* Category */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="Other">Other</option>
                    <option value="Food">Food 🍔</option>
                    <option value="Travel">Travel ✈️</option>
                    <option value="Shopping">Shopping 🛍️</option>
                    <option value="Bills">Bills 📄</option>
                    <option value="Education">Education 📚</option>
                  </select>
                </div>

                {/* Note */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a note..."
                    maxLength={200}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                {/* Safety Warnings */}
                {showWarnings && warnings.length > 0 && (
                  <div className="mb-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">⚠️</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-yellow-900 mb-3">Safety Warning</h4>
                        <ul className="space-y-2 mb-4">
                          {warnings.map((warning, index) => (
                            <li key={index} className="text-sm text-yellow-800 flex gap-2">
                              <span>•</span>
                              <span>{warning.message}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleTransfer(true)}
                            disabled={loading}
                            className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-medium"
                          >
                            {loading ? 'Processing...' : 'Confirm & Proceed'}
                          </button>
                          <button
                            onClick={() => {
                              setShowWarnings(false);
                              setWarnings([]);
                            }}
                            disabled={loading}
                            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Submit */}
                {!showWarnings && (
                  <button
                    onClick={() => handleTransfer(false)}
                    disabled={loading}
                    className={`w-full py-4 rounded-xl text-white font-medium text-lg transition-all ${
                      loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl transform hover:-translate-y-0.5'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      `Send ₹${amount || '0'}`
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
