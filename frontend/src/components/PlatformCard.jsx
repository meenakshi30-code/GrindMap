import React from "react";
import CircularProgress from "./CircularProgress";
import ActivityHeatmap from "./ActivityHeatmap";

const PlatformCard = ({ platform, data, expanded, onToggle, percentage }) => {
  const isExpanded = expanded === platform.key;

  if (!data) {
    return (
      <div
        className={`platform-card ${isExpanded ? "expanded" : ""}`}
        onClick={() => onToggle(platform.key)}
      >
        <div className="card-header">
          <h3 style={{ color: platform.color }}>{platform.name}</h3>
          <div className="platform-progress">
            <CircularProgress
              percentage={percentage}
              color={platform.color}
              size={isExpanded ? "large" : "medium"}
            />
          </div>
        </div>
        <p className="placeholder">Enter username and refresh</p>
      </div>
    );
  }

  if (data.error) {
    return (
      <div
        className={`platform-card ${isExpanded ? "expanded" : ""}`}
        onClick={() => onToggle(platform.key)}
      >
        <div className="card-header">
          <h3 style={{ color: platform.color }}>{platform.name}</h3>
          <div className="platform-progress">
            <CircularProgress
              percentage={0}
              color={platform.color}
              size={isExpanded ? "large" : "medium"}
            />
          </div>
        </div>
        <p className="error-msg">{data.error}</p>
      </div>
    );
  }

  return (
    <div
      className={`platform-card ${isExpanded ? "expanded" : ""}`}
      onClick={() => onToggle(platform.key)}
    >
      <div className="card-header">
        <h3 style={{ color: platform.color }}>{platform.name}</h3>
        <div className="platform-progress">
          <CircularProgress
            percentage={percentage}
            color={platform.color}
            size={isExpanded ? "large" : "medium"}
          />
        </div>
      </div>

      <div className="summary">
        {data.totalSolved !== undefined && (
          <p>
            <strong>{data.totalSolved}</strong> solved ({percentage}%)
          </p>
        )}
        {data.solved !== undefined && (
          <p>
            <strong>{data.solved}</strong> solved
          </p>
        )}
        {data.rating !== undefined && (
          <p>
            Rating: <strong>{data.rating}</strong>
          </p>
        )}
        {data.rank && (
          <p>
            Rank: <strong>{data.rank}</strong>
          </p>
        )}
        {data.problem_fully_solved !== undefined && (
          <p>
            Fully Solved: <strong>{data.problem_fully_solved}</strong>
          </p>
        )}
      </div>

      {isExpanded && (
        <div className="details">
          {platform.key === "leetcode" && (
            <>
              <div className="difficulty-breakdown">
                <div className="diff-item">
                  <span style={{ color: "#00af9b" }}>Easy</span>
                  <strong>{data.easySolved}</strong>
                </div>
                <div className="diff-item">
                  <span style={{ color: "#ffb800" }}>Medium</span>
                  <strong>{data.mediumSolved}</strong>
                </div>
                <div className="diff-item">
                  <span style={{ color: "#ff2d55" }}>Hard</span>
                  <strong>{data.hardSolved}</strong>
                </div>
              </div>

              <div className="ranking">
                Global Ranking: <strong>#{data.ranking || "N/A"}</strong>
              </div>

              <div className="heatmap-section">
                <h4>Submission Heatmap</h4>
                {/* Ensure data.submissionCalendar is passed correctly or getHeatmapData is used */}
                {data.submissionCalendar ? (
                  <ActivityHeatmap
                    data={
                      // We need to move getHeatmapData helper or pass raw calendar
                      // For now assuming data is pre-processed or we handle it here
                      Object.entries(data.submissionCalendar).map(
                        ([ts, count]) => ({
                          date: new Date(parseInt(ts) * 1000)
                            .toISOString()
                            .split("T")[0],
                          count,
                        }),
                      )
                    }
                  />
                ) : (
                  <p>No calendar data</p>
                )}
              </div>
            </>
          )}

          {platform.key === "codeforces" && (
            <div className="expanded-details">
              <p>
                Current Rating: <strong>{data.rating}</strong>
              </p>
              <p>
                Current Rank: <strong>{data.rank}</strong>
              </p>
              <p>
                Max Rating: <strong>{data.maxRating || "N/A"}</strong>
              </p>
            </div>
          )}

          {platform.key === "codechef" && (
            <div className="expanded-details">
              <p>
                Stars: <strong>{data.total_stars || 0} ⭐</strong>
              </p>
              <p>
                Global Rank: <strong>#{data.global_rank || "N/A"}</strong>
              </p>
              <p>
                Country Rank: <strong>#{data.country_rank || "N/A"}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformCard;
