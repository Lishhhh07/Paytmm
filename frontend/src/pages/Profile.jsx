import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Navbar } from "../components/Navbar";

export const Profile = () => {
  const [user, setUser] = useState(null);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/signin');
        return;
      }

      // Decode JWT to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Fetch user data from bulk endpoint (workaround since there's no /me endpoint)
      const usersResponse = await axios.get(`http://localhost:3000/api/v1/user/bulk`, {
        headers: { Authorization: "Bearer " + token }
      });

      const currentUser = usersResponse.data.user.find(u => u._id === payload.userId);
      setUser(currentUser);

      // Fetch account balance
      const balanceResponse = await axios.get("http://localhost:3000/api/v1/account/balance", {
        headers: { Authorization: "Bearer " + token }
      });
      setAccount(balanceResponse.data);

    } catch (error) {
      console.error("Error fetching user data:", error);
      if (error.response?.status === 403) {
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      navigate('/signin');
    }
  };

  if (loading) {
    return (
      <div>
        <Appbar />
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <div className="text-gray-600">Loading profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Appbar />
      <div className="max-w-4xl mx-auto p-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
        >
          <span>←</span> Back to Dashboard
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center text-white text-4xl font-bold">
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-gray-600">{user?.username}</p>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Current Balance</div>
            <div className="text-3xl font-bold text-gray-900">
              ₹{account?.balance?.toFixed(2)}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-sm text-gray-500 mb-2">Account Status</div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xl font-semibold text-gray-900">Active</span>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Information</h2>
          <div className="space-y-4">
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">First Name</span>
              <span className="font-medium text-gray-900">{user?.firstName}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Last Name</span>
              <span className="font-medium text-gray-900">{user?.lastName}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">Email</span>
              <span className="font-medium text-gray-900">{user?.username}</span>
            </div>
            <div className="flex justify-between py-3 border-b">
              <span className="text-gray-600">User ID</span>
              <span className="font-mono text-sm text-gray-600">{user?._id}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/send')}
              className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">💸</div>
              <div className="text-sm font-medium text-gray-700">Send Money</div>
            </button>
            <button
              onClick={() => navigate('/transactions')}
              className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">📜</div>
              <div className="text-sm font-medium text-gray-700">History</div>
            </button>
            <button
              onClick={() => navigate('/analytics')}
              className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">📊</div>
              <div className="text-sm font-medium text-gray-700">Analytics</div>
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">🏠</div>
              <div className="text-sm font-medium text-gray-700">Dashboard</div>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-100">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Danger Zone</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-4 border-b">
              <div>
                <div className="font-medium text-gray-900">Logout</div>
                <div className="text-sm text-gray-500">Sign out from your account</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
