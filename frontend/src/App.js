import React, { useState } from 'react';
import './App.css';
import CircularProgress from './components/CircularProgress';
import ActivityHeatmap from './components/ActivityHeatmap';
import DemoPage from './components/DemoPage';
import AnalyticsDashboard from './components/AnalyticsDashboard';

function App() {
  const [showDemo, setShowDemo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [usernames, setUsernames] = useState({
    leetcode: '',
    codeforces: '',
    codechef: '',
  });

  const [platformData, setPlatformData] = useState({
    leetcode: null,
    codeforces: null,
    codechef: null,
  });

  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(false);

  const platforms = [
    { key: 'leetcode', name: 'LeetCode', color: '#ffa116' },
    { key: 'codeforces', name: 'Codeforces', color: '#1e88e5' },
    { key: 'codechef', name: 'CodeChef', color: '#5d4037' },
  ];

  const handleChange = (key, value) => {
    setUsernames(prev => ({ ...prev, [key]: value }));
  };

  const fetchAll = async () => {
    setLoading(true);
    const newData = {};

    for (const plat of platforms) {
      const username = usernames[plat.key].trim();
      if (!username) {
        newData[plat.key] = null;
        continue;
      }

      try {
        if (plat.key === 'leetcode') {
          const res = await fetch(`http://localhost:5000/api/leetcode/${username}`);
          const result = await res.json();
          if (result.data) {
            newData.leetcode = result.data;
          } else {
            newData.leetcode = { error: 'User not found' };
          }
        } else if (plat.key === 'codeforces') {
          const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
          const info = await infoRes.json();
          if (info.status === "OK") {
            const rating = info.result[0].rating || 0;
            const rank = info.result[0].rank || 'unrated';

            const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
            const status = await statusRes.json();
            const solved = new Set(
              status.result?.filter(s => s.verdict === "OK")
                .map(s => `${s.problem.contestId}-${s.problem.index}`) || []
            ).size;

            newData.codeforces = { rating, rank, solved };
          } else {
            newData.codeforces = { error: 'User not found' };
          }
        } else if (plat.key === 'codechef') {
          const res = await fetch(`https://codechef-api.vercel.app/handle/${username}`);
          const result = await res.json();
          if (result.rating) {
            newData.codechef = result;
          } else {
            newData.codechef = { error: 'User not found' };
          }
        }
      } catch (err) {
        newData[plat.key] = { error: 'Failed to fetch' };
      }
    }

    setPlatformData(newData);
    setLoading(false);
  };

  const totalSolved = 
    (platformData.leetcode?.totalSolved || 0) +
    (platformData.codeforces?.solved || 0) +
    (platformData.codechef?.problem_fully_solved || 0);

  const overallGoal = 10000;

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

  const getPlatformPercentage = (platKey) => {
    const data = platformData[platKey];
    if (!data || data.error) return 0;

    if (platKey === 'leetcode') {
      return Math.round((data.totalSolved / data.totalQuestions) * 100);
    }
    if (platKey === 'codeforces') {
      return data.rating ? Math.round((data.rating / 3500) * 100) : 0;
    }
    if (platKey === 'codechef') {
      return data.rating ? Math.round((data.rating / 3000) * 100) : 0;
    }
    return 0;
  };

  const getHeatmapData = (calendar) => {
    if (!calendar) return [];
    return Object.entries(calendar).map(([ts, count]) => ({
      date: new Date(parseInt(ts) * 1000).toISOString().split('T')[0],
      count
    }));
  };

  // Today's Activity Logic
  const today = new Date();
  const todayString = today.toISOString().split('T')[0]; // '2025-12-20'
  const todayKey = todayString.replace(/-/g, ''); // '20251220' - format LeetCode uses

  const hasSubmittedToday = (platKey) => {
    if (platKey === 'leetcode' && platformData.leetcode && platformData.leetcode.submissionCalendar) {
      return platformData.leetcode.submissionCalendar[todayKey] > 0;
    }
    return false; // Other platforms don't have calendar
  };

  return (
    <div className="app">
      {showDemo ? (
        <>
          <button onClick={() => setShowDemo(false)} className="back-btn">← Back to Main</button>
          <DemoPage />
        </>
      ) : showAnalytics ? (
        <>
          <button onClick={() => setShowAnalytics(false)} className="back-btn">← Back to Main</button>
          <AnalyticsDashboard platformData={platformData} />
        </>
      ) : (
        <>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <button onClick={() => setShowDemo(true)} style={{ padding: '10px 20px', fontSize: '1em', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px' }}>View Demo</button>
            <button onClick={() => setShowAnalytics(true)} style={{ padding: '10px 20px', fontSize: '1em', background: '#4caf50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>View Analytics</button>
          </div>
          <h1>GrindMap</h1>

      <div className="username-inputs">
        <h2>Enter Your Usernames</h2>
        {platforms.map(plat => (
          <div key={plat.key} className="input-group">
            <label>{plat.name}</label>
            <input
              type="text"
              value={usernames[plat.key]}
              onChange={(e) => handleChange(plat.key, e.target.value)}
              placeholder={`Your ${plat.name} username`}
            />
          </div>
        ))}
        <button onClick={fetchAll} disabled={loading} className="refresh-btn">
          {loading ? 'Loading...' : 'Refresh All'}
        </button>
      </div>

      <div className="overall">
        <h2>Overall Progress</h2>
        <CircularProgress solved={totalSolved} goal={overallGoal} color="#4caf50" />
        <p>{totalSolved} / {overallGoal} problems solved</p>
      </div>

      <div className="platforms-grid">
        {platforms.map(plat => {
          const data = platformData[plat.key];
          const isExpanded = expanded === plat.key;
          const percentage = getPlatformPercentage(plat.key);

          return (
            <div
              key={plat.key}
              className={`platform-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleExpand(plat.key)}
            >
              <div className="card-header">
                <h3 style={{ color: plat.color }}>{plat.name}</h3>
                <div className="platform-progress">
                  <CircularProgress percentage={percentage} color={plat.color} size={isExpanded ? 'large' : 'medium'} />
                </div>
              </div>

              {data ? (
                data.error ? (
                  <p className="error">{data.error}</p>
                ) : (
                  <>
                    <div className="summary">
                      {data.totalSolved && <p><strong>{data.totalSolved}</strong> solved ({percentage}%)</p>}
                      {data.solved && <p><strong>{data.solved}</strong> solved</p>}
                      {data.rating && <p>Rating: <strong>{data.rating}</strong></p>}
                      {data.rank && <p>Rank: <strong>{data.rank}</strong></p>}
                      {data.problem_fully_solved && <p>Fully Solved: <strong>{data.problem_fully_solved}</strong></p>}
                    </div>

                    {isExpanded && (
                      <div className="details">
                        {plat.key === 'leetcode' && (
                          <>
                            <p>Easy: {data.easySolved} | Medium: {data.mediumSolved} | Hard: {data.hardSolved}</p>
                            <p>Global Ranking: #{data.ranking || 'N/A'}</p>
                            <div className="heatmap-section">
                              <h4>Submission Heatmap</h4>
                              <ActivityHeatmap data={getHeatmapData(data.submissionCalendar)} />
                            </div>
                          </>
                        )}
                        {plat.key === 'codeforces' && (
                          <>
                            <p>Current Rating: {data.rating}</p>
                            <p>Current Rank: {data.rank}</p>
                          </>
                        )}
                        {plat.key === 'codechef' && (
                          <>
                            <p>Stars: {data.total_stars || 0} ⭐</p>
                            <p>Global Rank: #{data.global_rank || 'N/A'}</p>
                            <p>Country Rank: #{data.country_rank || 'N/A'}</p>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )
              ) : (
                <p>Enter username and refresh</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Today's Activity - NOW WORKING */}
      <div className="today-activity">
        <h2>Today's Activity ({today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })})</h2>
        <div className="activity-list">
          {platforms.map(plat => {
            const submittedToday = hasSubmittedToday(plat.key);
            const hasData = platformData[plat.key] && !platformData[plat.key].error;

            return (
              <div key={plat.key} className={`activity-item ${submittedToday ? 'done' : hasData ? 'active-no-sub' : 'missed'}`}>
                <span>{plat.name}</span>
                <span>
                  {submittedToday ? '✅ Coded Today' : hasData ? '✅ Active (No submission today)' : '❌ No Data'}
                </span>
              </div>
            );
          })}
        </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;