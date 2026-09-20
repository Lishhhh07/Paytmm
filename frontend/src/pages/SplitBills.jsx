import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export const SplitBills = () => {
  const [splits, setSplits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSplits();
  }, []);

  const fetchSplits = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/api/v1/splitbill/my-splits", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      setSplits(response.data.splits);
    } catch (error) {
      console.error("Error fetching split bills:", error);
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

  const getSettlementProgress = (split) => {
    const paidCount = split.participants.filter(p => p.status === 'PAID').length;
    return `${paidCount} / ${split.participants.length}`;
  };

  const getMyShare = (split) => {
    const myParticipation = split.participants.find(
      p => p.user._id === currentUserId
    );
    return myParticipation ? myParticipation.amountOwed : 0;
  };

  const getMyStatus = (split) => {
    const myParticipation = split.participants.find(
      p => p.user._id === currentUserId
    );
    return myParticipation ? myParticipation.status : 'UNKNOWN';
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Split Bills</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Create Split
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
          <CreateSplitForm 
            onClose={() => setShowCreateForm(false)} 
            onSuccess={() => {
              setShowCreateForm(false);
              fetchSplits();
            }}
          />
        )}

        {/* Split Bills List */}
        {loading ? (
          <div className="text-center py-8">Loading split bills...</div>
        ) : splits.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No split bills yet</p>
            <p className="text-sm mt-2">Create your first split to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {splits.map((split) => (
              <div
                key={split._id}
                className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/split/${split._id}`)}
              >
                <h3 className="font-bold text-lg mb-2">{split.title}</h3>
                <div className="text-sm text-gray-600 mb-4">
                  <div>Total: ₹{split.totalAmount.toFixed(2)}</div>
                  <div>Created by: {split.creator.firstName} {split.creator.lastName}</div>
                  <div>{formatDate(split.createdAt)}</div>
                </div>
                
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Progress:</span>
                  <span className="text-sm text-blue-600">{getSettlementProgress(split)} settled</span>
                </div>

                {split.creator._id !== currentUserId && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Your share: ₹{getMyShare(split).toFixed(2)}</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        getMyStatus(split) === 'PAID' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {getMyStatus(split)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Create Split Form Component
function CreateSplitForm({ onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Add current user by default
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setSelectedUsers([payload.userId]);
    }

    // Fetch users
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/user/bulk?filter=${searchFilter}`);
      setUsers(response.data.user);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchFilter]);

  const toggleUser = (userId) => {
    if (selectedUsers.includes(userId)) {
      // Prevent removing yourself
      const token = localStorage.getItem("token");
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (userId === payload.userId) {
        setError("You must be included in the split");
        return;
      }
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
    setError('');
  };

  const handleCreate = async () => {
    setError('');

    if (!title || !totalAmount) {
      setError('Please fill all fields');
      return;
    }

    if (parseFloat(totalAmount) <= 0) {
      setError('Amount must be greater than 0');
      return;
    }

    if (selectedUsers.length < 2) {
      setError('At least 2 participants required');
      return;
    }

    setLoading(true);
    try {
      await axios.post("http://localhost:3000/api/v1/splitbill/create", {
        title,
        totalAmount: parseFloat(totalAmount),
        participantIds: selectedUsers
      }, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create split');
    } finally {
      setLoading(false);
    }
  };

  const sharePerPerson = totalAmount && selectedUsers.length > 0 
    ? (parseFloat(totalAmount) / selectedUsers.length).toFixed(2) 
    : 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Split Bill</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Dinner at Restaurant"
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Total Amount (₹)</label>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="Enter total amount"
              className="w-full px-3 py-2 border rounded"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Select Participants</label>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search users..."
              className="w-full px-3 py-2 border rounded mb-2"
            />
            <div className="max-h-48 overflow-y-auto border rounded p-2">
              {users.map(user => (
                <div
                  key={user._id}
                  className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleUser(user._id)}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => {}}
                    className="mr-2"
                  />
                  <span>{user.firstName} {user.lastName}</span>
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-600 mt-2">
              {selectedUsers.length} participant(s) selected
            </div>
          </div>

          {/* Preview */}
          {totalAmount && selectedUsers.length > 0 && (
            <div className="bg-blue-50 p-3 rounded">
              <div className="text-sm font-medium">Equal Split Preview:</div>
              <div className="text-lg font-bold text-blue-600">
                ₹{sharePerPerson} per person
              </div>
            </div>
          )}

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
              {loading ? 'Creating...' : 'Create Split'}
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
