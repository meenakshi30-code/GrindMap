import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ platformData }) => {
  // Mock data for demonstration - in real implementation, this would come from API
  const codingPatternsData = [
    { date: '2024-01-01', submissions: 2 },
    { date: '2024-01-02', submissions: 5 },
    { date: '2024-01-03', submissions: 1 },
    { date: '2024-01-04', submissions: 8 },
    { date: '2024-01-05', submissions: 3 },
    { date: '2024-01-06', submissions: 6 },
    { date: '2024-01-07', submissions: 4 },
  ];

  const productivityHoursData = [
    { hour: '6AM', submissions: 1 },
    { hour: '8AM', submissions: 3 },
    { hour: '10AM', submissions: 5 },
    { hour: '12PM', submissions: 8 },
    { hour: '2PM', submissions: 6 },
    { hour: '4PM', submissions: 4 },
    { hour: '6PM', submissions: 7 },
    { hour: '8PM', submissions: 9 },
    { hour: '10PM', submissions: 3 },
    { hour: '12AM', submissions: 1 },
  ];

  const ratingGrowthData = [
    { month: 'Jan', leetcode: 1200, codeforces: 1400, codechef: 1500 },
    { month: 'Feb', leetcode: 1250, codeforces: 1450, codechef: 1550 },
    { month: 'Mar', leetcode: 1300, codeforces: 1500, codechef: 1600 },
    { month: 'Apr', leetcode: 1350, codeforces: 1550, codechef: 1650 },
    { month: 'May', leetcode: 1400, codeforces: 1600, codechef: 1700 },
    { month: 'Jun', leetcode: 1450, codeforces: 1650, codechef: 1750 },
  ];

  const difficultyProgressionData = [
    { month: 'Jan', easy: 20, medium: 15, hard: 5 },
    { month: 'Feb', easy: 25, medium: 20, hard: 8 },
    { month: 'Mar', easy: 30, medium: 25, hard: 12 },
    { month: 'Apr', easy: 35, medium: 30, hard: 15 },
    { month: 'May', easy: 40, medium: 35, hard: 18 },
    { month: 'Jun', easy: 45, medium: 40, hard: 22 },
  ];

  const topicDistributionData = [
    { name: 'Arrays', value: 35, color: '#8884d8' },
    { name: 'Strings', value: 25, color: '#82ca9d' },
    { name: 'Dynamic Programming', value: 20, color: '#ffc658' },
    { name: 'Trees', value: 15, color: '#ff7c7c' },
    { name: 'Graphs', value: 5, color: '#8dd1e1' },
  ];

  const problemSolvingSpeedData = [
    { week: 'Week 1', avgTime: 45 },
    { week: 'Week 2', avgTime: 42 },
    { week: 'Week 3', avgTime: 38 },
    { week: 'Week 4', avgTime: 35 },
    { week: 'Week 5', avgTime: 32 },
    { week: 'Week 6', avgTime: 30 },
  ];

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

  return (
    <div className="analytics-dashboard">
      <h2>Advanced Progress Analytics Dashboard</h2>

      <div className="charts-grid">
        {/* Coding Patterns - Line Chart */}
        <div className="chart-container">
          <h3>Coding Patterns (Daily Submissions)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={codingPatternsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="submissions" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Peak Productivity Hours - Bar Chart */}
        <div className="chart-container">
          <h3>Peak Productivity Hours</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={productivityHoursData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="submissions" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rating Growth - Line Chart */}
        <div className="chart-container">
          <h3>Rating Growth Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={ratingGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="leetcode" stroke="#ffa116" strokeWidth={2} />
              <Line type="monotone" dataKey="codeforces" stroke="#1e88e5" strokeWidth={2} />
              <Line type="monotone" dataKey="codechef" stroke="#5d4037" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Difficulty Progression - Stacked Bar Chart */}
        <div className="chart-container">
          <h3>Difficulty Progression Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={difficultyProgressionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="easy" stackId="a" fill="#4caf50" />
              <Bar dataKey="medium" stackId="a" fill="#ff9800" />
              <Bar dataKey="hard" stackId="a" fill="#f44336" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Topic-wise Distribution - Pie Chart */}
        <div className="chart-container">
          <h3>Topic-wise Problem Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={topicDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topicDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Problem Solving Speed Trends - Line Chart */}
        <div className="chart-container">
          <h3>Problem Solving Speed Trends (Avg Minutes)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={problemSolvingSpeedData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgTime" stroke="#9c27b0" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="analytics-summary">
        <h3>Key Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Most Productive Hour</h4>
            <p>8 PM (9 submissions)</p>
          </div>
          <div className="insight-card">
            <h4>Improvement Rate</h4>
            <p>+50 rating points/month</p>
          </div>
          <div className="insight-card">
            <h4>Favorite Topic</h4>
            <p>Arrays (35% of problems)</p>
          </div>
          <div className="insight-card">
            <h4>Speed Improvement</h4>
            <p>15 minutes faster per problem</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;