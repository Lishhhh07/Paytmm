import { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const Dashboard = () => {
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate('/signin');
      return;
    }

    fetchDashboardData();
  }, [navigate]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      // Fetch balance
      const balanceResponse = await axios.get("http://localhost:3000/api/v1/account/balance", {
        headers: { Authorization: "Bearer " + token }
      });
      setBalance(balanceResponse.data.balance);

      // Fetch recent transactions
      const txnResponse = await axios.get("http://localhost:3000/api/v1/account/transactions?limit=5", {
        headers: { Authorization: "Bearer " + token }
      });
      setRecentTransactions(txnResponse.data.transactions);

      // Get user name from token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const usersResponse = await axios.get("http://localhost:3000/api/v1/user/bulk");
      const currentUser = usersResponse.data.user.find(u => u._id === payload.userId);
      if (currentUser) {
        setUserName(currentUser.firstName);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      if (error.response?.status === 403) {
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    { icon: "💸", label: "Send Money", path: "/send", gradient: "from-blue-500 to-indigo-500" },
    { icon: "🧾", label: "Split Bill", path: "/split-bills", gradient: "from-purple-500 to-pink-500" },
    { icon: "⏰", label: "Schedule", path: "/scheduled-payments", gradient: "from-green-500 to-emerald-500" },
    { icon: "📊", label: "Analytics", path: "/analytics", gradient: "from-orange-500 to-amber-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-gray-600 text-lg">Loading your dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Greeting */}
        <div className="mb-8 animate-fadeIn">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {getGreeting()}{userName && `, ${userName}`}! 👋
          </h1>
          <p className="text-gray-600">Welcome back to your wallet</p>
        </div>

        {/* Balance Card */}
        <div className="mb-8 animate-slideUp">
          <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <div className="text-sm text-blue-100 mb-2">Available Balance</div>
              <div className="text-5xl font-bold mb-6">₹{balance.toFixed(2)}</div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/send')}
                  className="px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                >
                  Send Money
                </button>
                <button
                  onClick={() => navigate('/transactions')}
                  className="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-all"
                >
                  View History
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => navigate(action.path)}
                className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all transform hover:-translate-y-1 group"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center text-3xl mb-3 group-hover:scale-110 transition-transform`}>
                  {action.icon}
                </div>
                <div className="font-semibold text-gray-900">{action.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Recent Transactions</h2>
              <button
                onClick={() => navigate('/transactions')}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                View All →
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="space-y-4">
                {recentTransactions.map((txn, index) => {
                  const isSent = txn.senderId._id === currentUserId;
                  const otherPerson = isSent ? txn.receiverId : txn.senderId;
                  
                  return (
                    <div 
                      key={txn._id} 
                      className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-xl transition-colors"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                          isSent ? 'bg-gradient-to-br from-red-500 to-pink-500' : 'bg-gradient-to-br from-green-500 to-emerald-500'
                        }`}>
                          {otherPerson.firstName[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {otherPerson.firstName} {otherPerson.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(txn.createdAt)} • {txn.category}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${
                        isSent ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {isSent ? '-' : '+'}₹{txn.amount}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {recentTransactions.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No transactions yet</h3>
            <p className="text-gray-600 mb-6">Start by sending money to someone!</p>
            <button
              onClick={() => navigate('/send')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Send Money
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
