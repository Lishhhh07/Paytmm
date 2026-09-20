import { useEffect, useState } from "react";
import axios from "axios";
import { Appbar } from "../components/Appbar";
import { useNavigate, useParams } from "react-router-dom";

export const SplitBillDetails = () => {
  const [split, setSplit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { splitId } = useParams();

  useEffect(() => {
    fetchSplitDetails();
  }, [splitId]);

  const fetchSplitDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/v1/splitbill/${splitId}`, {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });
      setSplit(response.data.split);
    } catch (error) {
      console.error("Error fetching split details:", error);
      setError("Failed to load split bill details");
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

  const handlePayShare = async () => {
    setError('');
    setSuccess('');
    setPaying(true);

    try {
      const response = await axios.post(
        `http://localhost:3000/api/v1/splitbill/${splitId}/pay`,
        {},
        {
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token")
          }
        }
      );

      setSuccess(`Payment successful! Transaction ID: ${response.data.transactionId}`);
      
      // Refresh split details
      setTimeout(() => {
        fetchSplitDetails();
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const getMyParticipation = () => {
    if (!split) return null;
    return split.participants.find(p => p.user._id === currentUserId);
  };

  const canPayShare = () => {
    const myParticipation = getMyParticipation();
    if (!myParticipation) return false;
    if (myParticipation.status === 'PAID') return false;
    if (split.creator._id === currentUserId) return false;
    return true;
  };

  const getSettlementStats = () => {
    if (!split) return { paid: 0, total: 0, percentage: 0 };
    const paid = split.participants.filter(p => p.status === 'PAID').length;
    const total = split.participants.length;
    const percentage = (paid / total) * 100;
    return { paid, total, percentage };
  };

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

  if (loading) {
    return (
      <div>
        <Appbar />
        <div className="m-8 text-center">Loading split bill details...</div>
      </div>
    );
  }

  if (!split) {
    return (
      <div>
        <Appbar />
        <div className="m-8 text-center">
          <p className="text-red-500">Split bill not found</p>
          <button
            onClick={() => navigate('/split-bills')}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded"
          >
            Back to Split Bills
          </button>
        </div>
      </div>
    );
  }

  const stats = getSettlementStats();

  return (
    <div>
      <Appbar />
      <div className="m-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{split.title}</h1>
          <button
            onClick={() => navigate('/split-bills')}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
          >
            Back to Split Bills
          </button>
        </div>

        {/* Split Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold">₹{split.totalAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Share Per Person</div>
              <div className="text-2xl font-bold text-blue-600">
                ₹{(split.totalAmount / split.participants.length).toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Created By</div>
              <div className="text-lg font-semibold">
                {split.creator.firstName} {split.creator.lastName}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Created on {formatDate(split.createdAt)}
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Settlement Progress</span>
              <span className="font-medium">{stats.paid} / {stats.total} settled</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-500 h-3 rounded-full transition-all"
                style={{ width: `${stats.percentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* My Share Section */}
        {split.creator._id !== currentUserId && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-bold text-lg">Your Share</div>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{getMyParticipation()?.amountOwed.toFixed(2)}
                </div>
              </div>
              <div>
                {getMyParticipation()?.status === 'PAID' ? (
                  <div className="text-green-600 font-bold">✓ PAID</div>
                ) : (
                  <button
                    onClick={handlePayShare}
                    disabled={paying || !canPayShare()}
                    className={`px-6 py-3 rounded-lg font-medium ${
                      paying || !canPayShare()
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    {paying ? 'Processing...' : 'Pay My Share'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Participants List */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-bold text-xl mb-4">Participants</h2>
          <div className="space-y-3">
            {split.participants.map((participant, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-xl text-white">
                      {participant.user.firstName[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">
                      {participant.user.firstName} {participant.user.lastName}
                      {participant.user._id === split.creator._id && (
                        <span className="ml-2 text-xs bg-yellow-200 px-2 py-1 rounded">
                          Creator
                        </span>
                      )}
                      {participant.user._id === currentUserId && (
                        <span className="ml-2 text-xs bg-blue-200 px-2 py-1 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      ₹{participant.amountOwed.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded text-sm font-medium ${
                      participant.status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {participant.status}
                  </span>
                  {participant.transactionId && (
                    <div className="text-xs text-gray-500 mt-1">
                      {participant.transactionId}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
