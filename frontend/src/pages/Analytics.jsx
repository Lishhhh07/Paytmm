import { useEffect, useState } from "react";
import axios from "axios";
import { Navbar } from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:3000/api/v1/account/analytics", {
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token")
        }
      });

      setAnalytics(response.data);
      generateInsights(response.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInsights = (data) => {
    const generatedInsights = [];

    // Insight 1: Highest spending category
    if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
      const highest = data.categoryBreakdown[0];
      generatedInsights.push(
        `${highest.category} is your highest spending category with ₹${highest.amount.toFixed(2)}.`
      );
    }

    // Insight 2: Month-over-month comparison
    if (data.monthlyTrend && data.monthlyTrend.length >= 2) {
      const lastMonth = data.monthlyTrend[data.monthlyTrend.length - 1];
      const previousMonth = data.monthlyTrend[data.monthlyTrend.length - 2];
      
      if (previousMonth.total > 0) {
        const percentageChange = ((lastMonth.total - previousMonth.total) / previousMonth.total) * 100;
        
        if (percentageChange > 0) {
          generatedInsights.push(
            `You spent ${percentageChange.toFixed(1)}% more this month than last month.`
          );
        } else if (percentageChange < 0) {
          generatedInsights.push(
            `You spent ${Math.abs(percentageChange).toFixed(1)}% less this month than last month. Great job!`
          );
        }
      }
    }

    // Insight 3: Net flow status
    if (data.netFlow > 0) {
      generatedInsights.push(
        `You have a positive net flow of ₹${data.netFlow.toFixed(2)}. You're receiving more than spending!`
      );
    } else if (data.netFlow < 0) {
      generatedInsights.push(
        `Your net flow is negative by ₹${Math.abs(data.netFlow).toFixed(2)}. Consider reducing expenses.`
      );
    }

    setInsights(generatedInsights);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No analytics data available</h3>
          <p className="text-gray-600">Start making transactions to see your analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Spending Analytics</h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Sent</div>
            <div className="text-2xl font-bold text-red-600">₹{analytics.totalSent.toFixed(2)}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Received</div>
            <div className="text-2xl font-bold text-green-600">₹{analytics.totalReceived.toFixed(2)}</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Net Flow</div>
            <div className={`text-2xl font-bold ${analytics.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{analytics.netFlow.toFixed(2)}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-600 mb-2">Total Transactions</div>
            <div className="text-2xl font-bold text-blue-600">{analytics.transactionCount}</div>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8">
            <h2 className="font-bold text-lg mb-2">💡 Insights</h2>
            <ul className="space-y-2">
              {insights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-700">• {insight}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Category Spending Chart */}
        {analytics.categoryBreakdown && analytics.categoryBreakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="font-bold text-xl mb-4">Spending by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.categoryBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="amount" fill="#3b82f6" name="Amount (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly Trend Chart */}
        {analytics.monthlyTrend && analytics.monthlyTrend.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h2 className="font-bold text-xl mb-4">Monthly Spending Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} name="Spending (₹)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* No Data Message */}
        {analytics.categoryBreakdown.length === 0 && analytics.monthlyTrend.length === 0 && (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <p className="text-gray-600">Not enough transaction data to show analytics yet.</p>
            <p className="text-sm text-gray-500 mt-2">Make some transactions to see your spending patterns!</p>
          </div>
        )}
      </div>
    </div>
  );
};
