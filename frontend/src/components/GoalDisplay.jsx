import React from 'react';

function GoalDisplay({ goal }) {
  return (
    <div className="goal-display">
      <h2>Goal Set</h2>
      <p>{goal} problems</p>
    </div>
  );
}

export default GoalDisplay;