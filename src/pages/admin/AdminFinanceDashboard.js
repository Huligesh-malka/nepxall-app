import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  CurrencyRupeeIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";

const API = "http://localhost:5000/api/payments";

export default function AdminFinanceDashboard() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/finance-summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data.data);
    } catch (error) {
      console.error("Error fetching finance data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const stats = [
    {
      title: "Total Revenue",
      value: data.total_received,
      icon: BanknotesIcon,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      trend: "+12.5%",
    },
    {
      title: "Pending Settlements",
      value: data.pending_settlements,
      icon: ClockIcon,
      color: "from-yellow-500 to-yellow-600",
      bgColor: "bg-yellow-50",
      iconColor: "text-yellow-600",
      trend: "8 pending",
    },
    {
      title: "Total Settled",
      value: data.total_settled,
      icon: CheckCircleIcon,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      iconColor: "text-green-600",
      trend: "Settled",
    },
    {
      title: "Today's Collection",
      value: data.today_collection,
      icon: CalendarIcon,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600",
      trend: new Date().toLocaleDateString('en-IN', { weekday: 'short' }),
    },
  ];

  const recentTransactions = [
    { id: 1, customer: "Rahul Sharma", amount: 2500, status: "completed", time: "10:30 AM" },
    { id: 2, customer: "Priya Patel", amount: 1800, status: "pending", time: "11:45 AM" },
    { id: 3, customer: "Amit Kumar", amount: 3200, status: "completed", time: "12:15 PM" },
    { id: 4, customer: "Sneha Reddy", amount: 950, status: "completed", time: "02:30 PM" },
    { id: 5, customer: "Vikram Singh", amount: 4100, status: "pending", time: "03:45 PM" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Finance Dashboard</h1>
              <p className="mt-2 text-sm text-gray-600">
                Real-time overview of your financial metrics
              </p>
            </div>
            <button
              onClick={fetchSummary}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
            >
              <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {stat.trend}
                    </span>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">{stat.title}</h3>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(stat.value)}
                  </p>
                  <div className="mt-4 h-1 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
                      style={{ width: `${Math.min((stat.value / 100000) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Charts and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
              <select className="text-sm border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
              </select>
            </div>
            <div className="h-64 flex items-end justify-between space-x-2">
              {[65, 45, 75, 85, 55, 70, 90].map((height, index) => (
                <div key={index} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div
                      className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg w-full transition-all duration-300 group-hover:from-blue-600 group-hover:to-blue-500"
                      style={{ height: `${height * 0.6}px` }}
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        ₹{height * 100}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      transaction.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.customer}</p>
                      <p className="text-xs text-gray-500">{transaction.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">₹{transaction.amount}</p>
                    <p className={`text-xs ${
                      transaction.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {transaction.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-4 w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border-t border-gray-100">
              View All Transactions
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-between p-4 bg-white rounded-xl shadow hover:shadow-md transition-all duration-200 group">
            <span className="text-sm font-medium text-gray-700">Generate Report</span>
            <span className="text-blue-600 group-hover:translate-x-1 transition-transform duration-200">→</span>
          </button>
          <button className="flex items-center justify-between p-4 bg-white rounded-xl shadow hover:shadow-md transition-all duration-200 group">
            <span className="text-sm font-medium text-gray-700">Export Data</span>
            <span className="text-blue-600 group-hover:translate-x-1 transition-transform duration-200">→</span>
          </button>
          <button className="flex items-center justify-between p-4 bg-white rounded-xl shadow hover:shadow-md transition-all duration-200 group">
            <span className="text-sm font-medium text-gray-700">Manage Payouts</span>
            <span className="text-blue-600 group-hover:translate-x-1 transition-transform duration-200">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}