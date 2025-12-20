import React from 'react';

function UsernameInputs({ usernames, setUsernames }) {
  const platforms = ['codeforces', 'github'];

  const handleChange = (platform, value) => {
    setUsernames(prev => ({ ...prev, [platform]: value }));
  };

  return (
    <div className="username-inputs">
      <h2>Auto-Fetch Usernames</h2>
      {platforms.map(platform => (
        <div key={platform} className="input-group">
          <label>{platform.charAt(0).toUpperCase() + platform.slice(1)}:</label>
          <input
            type="text"
            value={usernames[platform]}
            onChange={(e) => handleChange(platform, e.target.value)}
            placeholder={`e.g. tourist`}
          />
        </div>
      ))}
    </div>
  );
}

export default UsernameInputs;