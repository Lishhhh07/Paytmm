import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export const ScheduledPayments = () => {
  const [scheduledPayments, setScheduledPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchScheduledPayments();
  }, []);

  const fetchScheduledPayments = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/api/v1/scheduled/my-scheduled", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      setScheduledPayments(response.data.scheduledPayments);
    } catch (error) {
      console.error("Error fetching scheduled payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id) => {
    try {
      await axios.post(`http://localhost:3000/api/v1/scheduled/${id}/pause`, {}, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      fetchScheduledPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to pause');
    }
  };

  const handleResume = async (id) => {
    try {
      await axios.post(`http://localhost:3000/api/v1/scheduled/${id}/resume`, {}, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      fetchScheduledPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to resume');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this scheduled payment?')) return;
    
    try {
      await axios.delete(`http://localhost:3000/api/v1/scheduled/${id}`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      fetchScheduledPayments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Scheduled Payments</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Create Scheduled Payment
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <CreateScheduledPaymentForm 
            onClose={() => setShowCreateForm(false)} 
            onSuccess={() => {
              setShowCreateForm(false);
              fetchScheduledPayments();
            }}
          />
        )}

        {/* Scheduled Payments List */}
        {loading ? (
          <div className="text-center py-8">Loading scheduled payments...</div>
        ) : scheduledPayments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No scheduled payments yet</p>
            <p className="text-sm mt-2">Create your first scheduled payment to automate recurring transfers!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scheduledPayments.map((payment) => (
              <div
                key={payment._id}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{payment.receiver.firstName} {payment.receiver.lastName}</h3>
                    <div className="text-2xl font-bold text-blue-600 mt-1">₹{payment.amount}</div>
                  </div>
                  <span className={`px-3 py-1 rounded text-sm font-medium ${
                    payment.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {payment.active ? 'ACTIVE' : 'PAUSED'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex justify-between">
                    <span>Frequency:</span>
                    <span className="font-medium">{payment.frequency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Category:</span>
                    <span className="font-medium">{payment.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Next run:</span>
                    <span className="font-medium">{formatDate(payment.nextRunAt)}</span>
                  </div>
                  {payment.lastRunAt && (
                    <div className="flex justify-between">
                      <span>Last run:</span>
                      <span className="font-medium">{formatDate(payment.lastRunAt)}</span>
                    </div>
                  )}
                  {payment.note && (
                    <div className="mt-2 pt-2 border-t">
                      <span className="text-xs italic">{payment.note}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {payment.active ? (
                    <button
                      onClick={() => handlePause(payment._id)}
                      className="flex-1 px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={() => handleResume(payment._id)}
                      className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Resume
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(payment._id)}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Create Scheduled Payment Form Component
function CreateScheduledPaymentForm({ onClose, onSuccess }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [note, setNote] = useState('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [searchFilter]);

  useEffect(() => {
    // Set default start date to today
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setStartDate(formattedDate);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/user/bulk?filter=${searchFilter}`);
      setUsers(response.data.user);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreate = async () => {
    setError('');

    if (!selectedUser || !amount || !startDate) {
      setError('Please fill all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:3000/api/v1/scheduled/create", {
        receiver: selectedUser,
        amount: parseFloat(amount),
        category,
        note,
        frequency,
        startDate
      }, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create scheduled payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Scheduled Payment</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Recipient *</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
            >
              <option value="">Select recipient</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.firstName} {user.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
            >
              <option value="Other">Other</option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Bills">Bills</option>
              <option value="Education">Education</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Note</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
              maxLength={200}
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Frequency *</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
            >
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Start Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={loading}
              className={`flex-1 py-2 rounded ${
                loading ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2 bg-gray-300 hover:bg-gray-400 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
