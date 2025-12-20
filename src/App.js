import React, { useState } from 'react';
import './App.css';
import ProblemStats from './components/ProblemStats';
import GoalDisplay from './components/GoalDisplay';
import CircularProgress from './components/CircularProgress';
import ActivityHeatmap from './components/ActivityHeatmap';
import UsernameInputs from './components/UsernameInputs';
import PlatformCard from './components/PlatformCard';

function App() {
  // Old mock states (you can keep or remove later)
  const [solved, setSolved] = useState(45);
  const [total, setTotal] = useState(100);
  const [goal, setGoal] = useState(80);

  const [activityData, setActivityData] = useState([
    { date: '2025-01-01', count: 3 },
    { date: '2025-01-02', count: 1 },
  ]);

  // Multi-platform states
  const [usernames, setUsernames] = useState({
    leetcode: '',
    codeforces: '',
    codechef: '',
    hackerrank: '',
    github: '',
    code360: '',
  });

  const [platformData, setPlatformData] = useState({
    leetcode: { solved: 0, total: 0, easy: 0, medium: 0, hard: 0 },
    codeforces: { rating: 0, solved: 0 },
    codechef: { rating: 0, solved: 0 },
    github: { contributions: [] },
    hackerrank: { solved: 0 },
    code360: { solved: 0 },
  });

  // Fetch function — MUST be inside the component, but OUTSIDE the return
  const fetchAllData = async () => {
    // LeetCode
    if (usernames.leetcode.trim()) {
      try {
        const res = await fetch(`https://leetcode-stats-api.herokuapp.com/${usernames.leetcode}`);
        const data = await res.json();
        if (data.status === "success") {
          setPlatformData(prev => ({
            ...prev,
            leetcode: {
              solved: data.totalSolved,
              total: data.totalQuestions,
              easy: data.easySolved,
              medium: data.mediumSolved,
              hard: data.hardSolved,
            }
          }));
        }
      } catch (e) {
        console.error('LeetCode fetch error:', e);
      }
    }

    // GitHub contributions
    if (usernames.github.trim()) {
      try {
        const res = await fetch(`https://github.com/users/${usernames.github}/contributions`);
        const text = await res.text();
        const matches = [...text.matchAll(/data-date="([^"]+)" data-level="([^"]+)"/g)];
        const contributions = matches.map(m => ({
          date: m[1],
          count: m[2] === "0" ? 0 : parseInt(m[2])  // level 1-4 → contributions
        }));
        setPlatformData(prev => ({ ...prev, github: { contributions } }));
      } catch (e) {
        console.error('GitHub fetch error:', e);
      }
    }

    // Codeforces
    if (usernames.codeforces.trim()) {
      try {
        const infoRes = await fetch(`https://codeforces.com/api/user.info?handles=${usernames.codeforces}`);
        const infoData = await infoRes.json();
        if (infoData.status === "OK" && infoData.result[0]) {
          const rating = infoData.result[0].rating || 0;

          const statusRes = await fetch(`https://codeforces.com/api/user.status?handle=${usernames.codeforces}`);
          const statusData = await statusRes.json();
          if (statusData.status === "OK") {
            const solvedSet = new Set(
              statusData.result
                .filter(s => s.verdict === "OK")
                .map(s => `${s.problem.contestId}-${s.problem.index}`)
            );
            const solved = solvedSet.size;

            setPlatformData(prev => ({
              ...prev,
              codeforces: { rating, solved }
            }));
          }
        }
      } catch (e) {
        console.error('Codeforces error:', e);
      }
    }
  };

  return (
    <div className="app">
      <h1>GrindMap</h1>

      {/* Temporary manual inputs - you can remove later */}
      <div style={{ marginBottom: '20px' }}>
        <label>Update Solved: </label>
        <input
          type="number"
          value={solved}
          onChange={(e) => setSolved(Number(e.target.value))}
        />
      </div>
      <div style={{ marginBottom: '30px' }}>
        <label>Update Goal: </label>
        <input
          type="number"
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
        />
      </div>

      {/* Old components - optional to keep */}
      <ProblemStats solved={solved} total={total} />
      <GoalDisplay goal={goal} />
      <CircularProgress solved={solved} goal={goal} />
      <ActivityHeatmap data={activityData} />

      {/* New multi-platform section */}
      <UsernameInputs usernames={usernames} setUsernames={setUsernames} />

      <button onClick={fetchAllData} style={{ padding: '10px 20px', fontSize: '16px', margin: '20px 0' }}>
        Refresh Progress
      </button>

      <div className="platforms-grid">
        <PlatformCard name="LeetCode" data={platformData.leetcode} />
        <PlatformCard name="Codeforces" data={platformData.codeforces} />
        <PlatformCard name="GitHub" data={platformData.github} />
        {/* Add more cards as you implement other platforms */}
      </div>
    </div>
  );
}

export default App;