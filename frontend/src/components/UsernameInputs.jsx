import React, { useState } from "react";

const PLATFORM_CONFIG = {
  leetcode: {
    name: "LeetCode",
    placeholder: "e.g. tourist",
    urlPart: "leetcode.com/",
    regex: /^[a-zA-Z0-9_.-]+$/,
  },
  codeforces: {
    name: "Codeforces",
    placeholder: "e.g. tourist",
    urlPart: "codeforces.com/profile/",
    regex: /^[a-zA-Z0-9_.-]+$/,
  },
  codechef: {
    name: "CodeChef",
    placeholder: "e.g. gennady",
    urlPart: "codechef.com/users/",
    regex: /^[a-zA-Z0-9_.]+$/,
  },
};

function UsernameInputs({ usernames, onChange, onFetch, loading }) {
  const [errors, setErrors] = useState({});

  const validateAndChange = (platform, value) => {
    let newValue = value.trim();
    let error = null;

    // URL Handling
    if (
      newValue.includes("http") ||
      newValue.includes("www.") ||
      newValue.includes(".com") ||
      newValue.includes(".jp")
    ) {
      // try extract
      const config = PLATFORM_CONFIG[platform];
      // Match strict part
      const lowerValue = newValue.toLowerCase();
      if (lowerValue.includes(config.urlPart)) {
        try {
          // Basic split logic
          const afterDomain = lowerValue.split(config.urlPart)[1];
          newValue = afterDomain.split("/")[0].split("?")[0]; // simple extraction
        } catch (e) {
          error = "Invalid URL format";
        }
      } else {
        error = `Not a valid ${config.name} URL`;
      }
    }

    // Regex Validation
    if (!error && newValue) {
      const config = PLATFORM_CONFIG[platform];
      if (config.regex && !config.regex.test(newValue)) {
        error = "Invalid username format";
      }
    }

    setErrors((prev) => ({ ...prev, [platform]: error }));
    onChange(platform, newValue);
  };

  const handleFetch = () => {
    // Check for blocking errors
    const hasErrors = Object.values(errors).some((e) => e);
    // basic check: at least one username should probably be present, but user request only said "Prevent ... if input field is empty"
    // Assuming this means "don't fetch for empty fields" which App.js already does.
    // But if ALL are empty, maybe warn?
    const allEmpty = Object.keys(PLATFORM_CONFIG).every((k) => !usernames[k]);

    if (hasErrors) {
      return; // Button should be disabled or we just return.
    }
    if (allEmpty) {
      // Optional: could set a general error
      return;
    }
    onFetch();
  };

  const hasErrors = Object.values(errors).some((e) => e);
  const allEmpty = Object.keys(PLATFORM_CONFIG).every((k) => !usernames[k]);

  return (
    <div className="username-inputs">
      <h2>Enter Your Usernames</h2>
      {Object.keys(PLATFORM_CONFIG).map((key) => {
        const config = PLATFORM_CONFIG[key];
        return (
          <div
            key={key}
            className="input-group"
            style={{ alignItems: "flex-start" }}
          >
            <label style={{ marginTop: "12px" }}>{config.name}</label>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <input
                type="text"
                value={usernames[key]}
                onChange={(e) => validateAndChange(key, e.target.value)}
                placeholder={config.placeholder}
                style={{
                  borderColor: errors[key] ? "#ef4444" : undefined,
                  outlineColor: errors[key] ? "#ef4444" : undefined,
                }}
              />
              {errors[key] && (
                <span
                  className="error-msg"
                  style={{
                    color: "#ef4444",
                    fontSize: "0.9em",
                    marginTop: "5px",
                    marginBottom: "10px",
                    textAlign: "left",
                  }}
                >
                  {errors[key]}
                </span>
              )}
            </div>
          </div>
        );
      })}
      <button
        onClick={handleFetch}
        disabled={loading || hasErrors || allEmpty}
        className="refresh-btn"
        style={{ opacity: loading || hasErrors || allEmpty ? 0.6 : 1 }}
      >
        {loading ? "Loading..." : "Refresh All"}
      </button>
    </div>
  );
}

export default UsernameInputs;
