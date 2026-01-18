import React, { useState } from "react";
import "./App.css";
import CircularProgress from "./components/CircularProgress";

import DemoPage from "./components/DemoPage";
import AnalyticsDashboard from "./components/AnalyticsDashboard";
import BadgeCollection from "./components/BadgeCollection";
import GoalDashboard from "./components/GoalDashboard";
import UsernameInputs from "./components/UsernameInputs";
import PlatformCard from "./components/PlatformCard";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useGrindMapData } from "./hooks/useGrindMapData";
import { PLATFORMS, OVERALL_GOAL } from "./utils/platforms";

function AppContent() {
  const [showDemo, setShowDemo] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showBadges, setShowBadges] = useState(false);
  const [showGoals, setShowGoals] = useState(false);
  const [expanded, setExpanded] = useState(null);

  const {
    usernames,
    platformData,
    loading,
    totalSolved,
    handleChange,
    fetchAll,
    getPlatformPercentage,
    hasSubmittedToday,
  } = useGrindMapData();

  const toggleExpand = (key) => {
    setExpanded(expanded === key ? null : key);
  };

  // Today's Activity Logic
  const today = new Date();

  return (
    <div className="app">
  <div className="container">

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
      ) : showBadges ? (
        <>
          <button onClick={() => setShowBadges(false)} className="back-btn">
            ← Back to Main
          </button>
          <BadgeCollection />
        </>
      ) : showGoals ? (
        <>
          <button onClick={() => setShowGoals(false)} className="back-btn">
            ← Back to Main
          </button>
          <GoalDashboard />
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
                marginRight: "10px",
              }}
            >
              View Analytics
            </button>
            <button
              onClick={() => setShowBadges(true)}
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                background: "#9b59b6",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                marginRight: "10px",
              }}
            >
              🏆 Achievements
            </button>
            <button
              onClick={() => setShowGoals(true)}
              style={{
                padding: "10px 20px",
                fontSize: "1em",
                background: "#e74c3c",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              🎯 Goals
            </button>
          </div>

          <ThemeToggle />

          <h1>GrindMap</h1>

          <UsernameInputs
            usernames={usernames}
            onChange={handleChange}
            onFetch={fetchAll}
            loading={loading}
          />

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
            {PLATFORMS.map((plat) => (
              <PlatformCard
                key={plat.key}
                platform={plat}
                data={platformData[plat.key]}
                expanded={expanded}
                onToggle={toggleExpand}
                percentage={getPlatformPercentage(plat.key)}
                loading={loading}
              />
            ))}
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
</div>

  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
