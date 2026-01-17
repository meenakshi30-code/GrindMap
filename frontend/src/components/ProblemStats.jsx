import React from 'react';

function ProblemStats({ solved, total }) {
  return (
    <div className="problem-stats">
      <h2>Problems Solved</h2>
      <p>{solved} / {total}</p>
    </div>
  );
}

export default ProblemStats;