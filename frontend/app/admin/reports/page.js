'use client';
import { useState, useEffect } from 'react';
import { 
  BookOpen, Users, Star, BarChart as BarChartIcon, LineChart as LineChartIcon, 
  TrendingUp, Library, LayoutGrid, ChevronRight
} from 'lucide-react';
import axios from 'axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
} from 'recharts';

const Reports = () => {
  const [timeFilter, setTimeFilter] = useState('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    topBooks: [],
    topCategories: [],
    borrowingTrends: [],
    userStats: {},
    overallStats: {}
  });

  // Enhanced color palette
  const COLORS = ['#4F46E5', '#06B6D4', '#F59E0B', '#EC4899', '#10B981', '#8B5CF6'];

  useEffect(() => {
    fetchAnalytics();
  }, [timeFilter]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3002/analytics?timeframe=${timeFilter}`, {
        withCredentials: true
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format data for better visualization
  const formatTrendsData = () => {
    if (!stats.borrowingTrends || stats.borrowingTrends.length === 0) return [];
    
    // Add a 7-day moving average
    const movingAvg = [...stats.borrowingTrends];
    for (let i = 3; i < movingAvg.length; i++) {
      const avg = (
        movingAvg[i].borrows + 
        movingAvg[i-1].borrows + 
        movingAvg[i-2].borrows + 
        movingAvg[i-3].borrows
      ) / 4;
      movingAvg[i].average = parseFloat(avg.toFixed(1));
    }
    
    return movingAvg;
  };

  // Enhanced loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700 font-medium">Preparing your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Library Analytics Dashboard</h1>
            <p className="mt-1 text-slate-600 text-sm">Insights and performance metrics for your library</p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="flex items-center bg-white rounded-lg shadow-sm border border-slate-200 p-1">
              <button 
                onClick={() => setTimeFilter('week')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === 'week' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Week
              </button>
              <button 
                onClick={() => setTimeFilter('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === 'month' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Month
              </button>
              <button 
                onClick={() => setTimeFilter('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeFilter === 'year' 
                    ? 'bg-indigo-600 text-white' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Year
              </button>
            </div>
          </div>
        </div>
        
        {/* Main Activity Chart - Full Width */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center">
              <LineChartIcon className="w-5 h-5 mr-2 text-indigo-600" />
              Borrowing Activity Overview
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-xs">
                <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block mr-1"></span>
                <span className="text-slate-600">Daily Borrows</span>
              </div>
              <div className="flex items-center text-xs">
                <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block mr-1"></span>
                <span className="text-slate-600">Moving Average</span>
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={formatTrendsData()} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorBorrows" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.7}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#E2E8F0" />
                <XAxis 
                  dataKey="date" 
                  stroke="#94A3B8" 
                  tickLine={false}
                  axisLine={false}
                  tick={{fontSize: 11}}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
                  }}
                />
                <YAxis 
                  stroke="#94A3B8" 
                  tickLine={false}
                  axisLine={false}
                  tick={{fontSize: 11}}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    border: 'none',
                    fontSize: '12px'
                  }}
                  formatter={(value, name) => [value, name === 'borrows' ? 'Books Borrowed' : 'Moving Average']}
                  labelFormatter={(label) => {
                    const date = new Date(label);
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric'
                    });
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="borrows" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBorrows)" 
                  activeDot={{ r: 5, fill: '#4F46E5', stroke: 'white', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, fill: '#06B6D4', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Most Borrowed Books - Vertical Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center mb-6">
              <Library className="w-5 h-5 mr-2 text-indigo-600" />
              Most Borrowed Books
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topBooks.slice(0, 5)}
                  margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="title"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    interval={0}
                    tick={{
                      fontSize: 12,
                      fill: '#475569',
                    }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{fontSize: 12, fill: '#475569'}}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: 'none',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`${value} borrows`, '']}
                  />
                  <defs>
                    {stats.topBooks.slice(0, 5).map((_, index) => (
                      <linearGradient
                        key={`gradient-${index}`}
                        id={`barGradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop offset="0%" stopColor={COLORS[index]} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={COLORS[index]} stopOpacity={0.5} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Bar 
                    dataKey="borrows"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                  >
                    {stats.topBooks.slice(0, 5).map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#barGradient-${index})`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution - Enhanced Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center mb-6">
              <LayoutGrid className="w-5 h-5 mr-2 text-indigo-600" />
              Category Distribution
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.topCategories}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    stroke="none"
                  >
                    {stats.topCategories.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      border: 'none',
                      fontSize: '12px'
                    }}
                    formatter={(value, name, props) => {
                      const total = stats.topCategories.reduce((sum, cat) => sum + cat.count, 0);
                      const percent = ((value / total) * 100).toFixed(1);
                      return [`${value} (${percent}%)`, props.payload.category];
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    iconType="circle"
                    iconSize={10}
                    formatter={(value) => (
                      <span style={{ color: '#475569', fontSize: '12px', fontWeight: 500 }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;