import React, { useState, useMemo } from 'react';
import CircularProgress from './CircularProgress';
import ActivityHeatmap from './ActivityHeatmap';
import '../App.css';

/**
 * DemoPage – Interactive Demo Mode
 * Shows sample data for GrindMap
 */

const PLATFORM_GOALS = {
  leetcode: 3000,
  codeforces: 500,
  codechef: 300
};

const DemoPage = ({ onBack }) => {
  const [expanded, setExpanded] = useState(null);

  /**
   * Memoized demo data (prevents random regeneration on re-render)
   */
  const demoData = useMemo(() => ({
    leetcode: {
      totalSolved: 487,
      totalQuestions: 3000,
      easySolved: 245,
      mediumSolved: 198,
      hardSolved: 44,
      ranking: 125432,
      submissionCalendar: generateDemoCalendar()
    },
    codeforces: {
      rating: 1542,
      rank: 'Expert',
      solved: 312
    },
    codechef: {
      rating: 1876,
      problem_fully_solved: 156,
      total_stars: 4,
      global_rank: 8234,
      country_rank: 1523
    }
  }), []);

  const platforms = [
    { key: 'leetcode', name: 'LeetCode', color: '#ffa116' },
    { key: 'codeforces', name: 'Codeforces', color: '#1e88e5' },
    { key: 'codechef', name: 'CodeChef', color: '#5d4037' }
  ];

  /**
   * Overall progress calculation
   */
  const totalSolved =
    demoData.leetcode.totalSolved +
    demoData.codeforces.solved +
    demoData.codechef.problem_fully_solved;

  const overallGoal =
    PLATFORM_GOALS.leetcode +
    PLATFORM_GOALS.codeforces +
    PLATFORM_GOALS.codechef;

  const overallPercentage = Math.round((totalSolved / overallGoal) * 100);

  /**
   * Platform progress (normalized by problems solved)
   */
  const getPlatformPercentage = (key) => {
    if (key === 'leetcode') {
      return Math.round(
        (demoData.leetcode.totalSolved / PLATFORM_GOALS.leetcode) * 100
      );
    }

    if (key === 'codeforces') {
      return Math.round(
        (demoData.codeforces.solved / PLATFORM_GOALS.codeforces) * 100
      );
    }

    if (key === 'codechef') {
      return Math.round(
        (demoData.codechef.problem_fully_solved / PLATFORM_GOALS.codechef) * 100
      );
    }

    return 0;
  };

  /**
   * Heatmap transformer
   */
  const getHeatmapData = (calendar) =>
    Object.entries(calendar).map(([ts, count]) => ({
      date: new Date(parseInt(ts) * 1000).toISOString().split('T')[0],
      count
    }));

  /**
   * Demo activity (not all perfect on purpose)
   */
  const todayActivity = {
    leetcode: true,
    codeforces: true,
    codechef: false
  };

  return (
    <div className="app demo-mode">
      {/* Demo Banner */}
      <div className="demo-banner">
        <button className="back-btn" onClick={onBack}>
        Back to Main
      </button>
      
        <h2>🎯 Interactive Demo</h2>
        <p>Explore GrindMap with sample data • Click cards to expand</p>
      </div>

      <h1>GrindMap</h1>

      {/* Overall Progress */}
      <div className="overall">
        <h2>Overall Progress</h2>
        <CircularProgress
          percentage={overallPercentage}
          color="#4caf50"
          size="large"
        />
        <p>
          <strong>{overallPercentage}%</strong> • {totalSolved} / {overallGoal}{' '}
          problems solved
        </p>
      </div>

      {/* Platform Cards */}
      <div className="platforms-grid">
        {platforms.map((plat) => {
          const data = demoData[plat.key];
          const isExpanded = expanded === plat.key;
          const percentage = getPlatformPercentage(plat.key);

          return (
            <div
              key={plat.key}
              role="button"
              tabIndex={0}
              aria-expanded={isExpanded}
              className={`platform-card ${isExpanded ? 'expanded' : ''}`}
              onClick={() =>
                setExpanded(isExpanded ? null : plat.key)
              }
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                setExpanded(isExpanded ? null : plat.key)
              }
            >
              <div className="card-header">
                <h3 style={{ color: plat.color }}>{plat.name}</h3>
                <CircularProgress
                  percentage={percentage}
                  color={plat.color}
                  size={isExpanded ? 'large' : 'medium'}
                />
              </div>

              {/* Summary */}
              <div className="summary">
                {data.totalSolved && (
                  <p>
                    <strong>{data.totalSolved}</strong> solved ({percentage}%)
                  </p>
                )}
                {data.solved && <p><strong>{data.solved}</strong> solved</p>}
                {data.rating && <p>Rating: <strong>{data.rating}</strong></p>}
                {data.rank && <p>Rank: <strong>{data.rank}</strong></p>}
                {data.problem_fully_solved && (
                  <p>
                    Fully Solved:{' '}
                    <strong>{data.problem_fully_solved}</strong>
                  </p>
                )}
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="details">
                  {plat.key === 'leetcode' && (
                    <>
                      <p>
                        Easy: {data.easySolved} | Medium:{' '}
                        {data.mediumSolved} | Hard: {data.hardSolved}
                      </p>
                      <p>Global Ranking: #{data.ranking}</p>

                      <div className="heatmap-section">
                        <h4>Submission Heatmap</h4>
                        <ActivityHeatmap
                          data={getHeatmapData(
                            data.submissionCalendar
                          )}
                        />
                      </div>
                    </>
                  )}

                  {plat.key === 'codeforces' && (
                    <>
                      <p>Current Rating: {data.rating}</p>
                      <p>Rank: {data.rank}</p>
                    </>
                  )}

                  {plat.key === 'codechef' && (
                    <>
                      <p>Stars: {data.total_stars} ⭐</p>
                      <p>Global Rank: #{data.global_rank}</p>
                      <p>Country Rank: #{data.country_rank}</p>
                    </>
                  )}
                </div>
              )}

              <div className="expand-hint">
                {isExpanded ? 'Click to collapse' : 'Click to expand'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Today’s Activity */}
      <div className="today-activity">
        <h2>Today's Activity</h2>
        <div className="activity-list">
          {platforms.map((plat) => (
            <div
              key={plat.key}
              className={`activity-item ${
                todayActivity[plat.key] ? 'done' : 'missed'
              }`}
            >
              <span>{plat.name}</span>
              <span>
                {todayActivity[plat.key]
                  ? '✅ Coded Today'
                  : '❌ No Activity'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Generates 1 year of demo submission data
 */
function generateDemoCalendar() {
  const calendar = {};
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < 365; i++) {
    const ts = now - i * 86400;
    calendar[ts] = Math.floor(Math.random() * 12);
  }

  return calendar;
}

export default DemoPage;
