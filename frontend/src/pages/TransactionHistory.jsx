import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const navigate = useNavigate();

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:3000/api/v1/account/transactions?page=${page}&limit=10`;
      
      if (filter !== 'all') {
        url += `&filter=${filter}`;
      }
      if (category) {
        url += `&category=${category}`;
      }

      const response = await axios.get(url, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });

      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      if (error.response?.status === 403) {
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/signin');
      return;
    }
    fetchTransactions();
  }, [page, filter, category, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCurrentUserId = () => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    }
    return null;
  };

  const currentUserId = getCurrentUserId();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h1>
          <p className="text-gray-600">View all your past transactions</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Transactions</option>
                <option value="sent">Sent Only</option>
                <option value="received">Received Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="Food">Food 🍔</option>
                <option value="Travel">Travel ✈️</option>
                <option value="Shopping">Shopping 🛍️</option>
                <option value="Bills">Bills 📄</option>
                <option value="Education">Education 📚</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transactions List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
              <div className="text-gray-600">Loading transactions...</div>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or make your first transaction</p>
            <button
              onClick={() => navigate('/send')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Send Money
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {transactions.map((txn, index) => {
              const isSent = txn.senderId._id === currentUserId;
              const otherPerson = isSent ? txn.receiverId : txn.senderId;
              
              return (
                <div
                  key={txn._id}
                  className="bg-white rounded-2xl shadow-md p-6 hover:shadow-lg transition-all"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${
                        isSent ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'
                      }`}>
                        {otherPerson.firstName[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-lg text-gray-900">
                            {otherPerson.firstName} {otherPerson.lastName}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            isSent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {isSent ? 'Sent' : 'Received'}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {formatDate(txn.createdAt)}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                            {txn.category}
                          </span>
                          <span className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-mono">
                            {txn.transactionId}
                          </span>
                        </div>
                        {txn.note && (
                          <div className="mt-3 text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                            "{txn.note}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-2xl font-bold ${
                        isSent ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isSent ? '-' : '+'}₹{txn.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {txn.status}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center items-center gap-4">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-600 hover:text-indigo-600 transition-all"
            >
              ← Previous
            </button>
            <span className="text-gray-700 font-medium">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
              className="px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:border-indigo-600 hover:text-indigo-600 transition-all"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
