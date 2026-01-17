import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

function PlatformCard({ name, data }) {
  let content;

  if (name.includes('LeetCode')) {
    content = <p>Solved: {data.solved}</p>;
  } else if (name === 'Codeforces' || name === 'CodeChef') {
    content = (
      <>
        <p>Solved: {data.solved}</p>
        <p>Rating: {data.rating || 'Unrated'}</p>
      </>
    );
  } else if (name === 'HackerRank') {
    content = <p>Solved: {data.solved}</p>;
  }

  const percentage = data.solved > 0 ? Math.min((data.solved / 500) * 100, 100) : 0; // Arbitrary max for visual

  return (
    <div className="platform-card">
      <h3>{name}</h3>
      {content}
      <div style={{ width: 120, margin: '15px auto' }}>
        <CircularProgressbar
          value={percentage}
          text={`${Math.round(percentage)}%`}
          styles={buildStyles({
            pathColor: '#4caf50',
            textColor: '#333',
            trailColor: '#d6d6d6',
          })}
        />
      </div>
    </div>
  );
}

export default PlatformCard;