import React, { useState } from "react";
import "./App.css";
import CircularProgress from "./components/CircularProgress";
import ActivityHeatmap from "./components/ActivityHeatmap";
import DemoPage from "./components/DemoPage";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import { useGrindMapData } from "./hooks/useGrindMapData";
import { PLATFORMS, OVERALL_GOAL } from "./utils/platforms";

function App() {
  const [showDemo, setShowDemo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const {
    usernames,
    platformData,
    loading,
    totalSolved,
    handleChange,
    fetchAll,
    getPlatformPercentage,
    getHeatmapData,
    hasSubmittedToday,
  } = useGrindMapData();

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

  // Today's Activity Logic
  const today = new Date();

  return (
    <div className="app">
      {showDemo ? (
        <>
          <DemoPage onBack={() => setShowDemo(false)} />
        </>
      ) : showAnalytics ? (
        <>
          <button onClick={() => setShowAnalytics(false)} className="back-btn">
            ← Back to Main
          </button>
          <AnalyticsDashboard platformData={platformData} />
        </>
      ) : (
        <>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <button
              onClick={() => setShowDemo(true)}
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              View Demo
            </button>
            <button
              onClick={() => setShowAnalytics(true)}
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              View Analytics
            </button>
          </div>
          <h1>GrindMap</h1>

          <div className="username-inputs">
            <h2>Enter Your Usernames</h2>
            {PLATFORMS.map((plat) => (
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
            <button
              onClick={fetchAll}
              disabled={loading}
              className="refresh-btn"
            >
              {loading ? "Loading..." : "Refresh All"}
            </button>
          </div>

          <div className="overall">
            <h2>Overall Progress</h2>
            <CircularProgress
              solved={totalSolved}
              goal={OVERALL_GOAL}
              color="#4caf50"
            />
            <p>
              {totalSolved} / {OVERALL_GOAL} problems solved
            </p>
          </div>

          <div className="platforms-grid">
            {PLATFORMS.map((plat) => {
              const data = platformData[plat.key];
              const isExpanded = expanded === plat.key;
              const percentage = getPlatformPercentage(plat.key);

              return (
                <div
                  key={plat.key}
                  className={`platform-card ${isExpanded ? "expanded" : ""}`}
                  onClick={() => toggleExpand(plat.key)}
                >
                  <div className="card-header">
                    <h3 style={{ color: plat.color }}>{plat.name}</h3>
                    <div className="platform-progress">
                      <CircularProgress
                        percentage={percentage}
                        color={plat.color}
                        size={isExpanded ? "large" : "medium"}
                      />
                    </div>
                  </div>

                  {data ? (
                    data.error ? (
                      <p className="error">{data.error}</p>
                    ) : (
                      <>
                        <div className="summary">
                          {data.totalSolved && (
                            <p>
                              <strong>{data.totalSolved}</strong> solved (
                              {percentage}%)
                            </p>
                          )}
                          {data.solved && (
                            <p>
                              <strong>{data.solved}</strong> solved
                            </p>
                          )}
                          {data.rating && (
                            <p>
                              Rating: <strong>{data.rating}</strong>
                            </p>
                          )}
                          {data.rank && (
                            <p>
                              Rank: <strong>{data.rank}</strong>
                            </p>
                          )}
                          {data.problem_fully_solved && (
                            <p>
                              Fully Solved:{" "}
                              <strong>{data.problem_fully_solved}</strong>
                            </p>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="details">
                            {plat.key === "leetcode" && (
                              <>
                                <p>
                                  Easy: {data.easySolved} | Medium:{" "}
                                  {data.mediumSolved} | Hard: {data.hardSolved}
                                </p>
                                <p>Global Ranking: #{data.ranking || "N/A"}</p>
                                <div className="heatmap-section">
                                  <h4>Submission Heatmap</h4>
                                  <ActivityHeatmap
                                    data={getHeatmapData(
                                      data.submissionCalendar,
                                    )}
                                  />
                                </div>
                              </>
                            )}
                            {plat.key === "codeforces" && (
                              <>
                                <p>Current Rating: {data.rating}</p>
                                <p>Current Rank: {data.rank}</p>
                              </>
                            )}
                            {plat.key === "codechef" && (
                              <>
                                <p>Stars: {data.total_stars || 0} ⭐</p>
                                <p>Global Rank: #{data.global_rank || "N/A"}</p>
                                <p>
                                  Country Rank: #{data.country_rank || "N/A"}
                                </p>
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

          {/* Today's Activity */}
          <div className="today-activity">
            <h2>
              Today's Activity (
              {today.toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              )
            </h2>
            <div className="activity-list">
              {PLATFORMS.map((plat) => {
                const submittedToday = hasSubmittedToday(plat.key);
                const hasData =
                  platformData[plat.key] && !platformData[plat.key].error;

                return (
                  <div
                    key={plat.key}
                    className={`activity-item ${submittedToday ? "done" : hasData ? "active-no-sub" : "missed"}`}
                  >
                    <span>{plat.name}</span>
                    <span>
                      {submittedToday
                        ? "✅ Coded Today"
                        : hasData
                          ? "✅ Active (No submission today)"
                          : "❌ No Data"}
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
