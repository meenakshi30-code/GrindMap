import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const CircularProgress = ({ percentage = 0, color = '#ffa116', size = 'medium' }) => {
  const sizes = {
    small: 100,
    medium: 150,
    large: 240
  };
  const width = sizes[size];

  return (
    <div style={{ width: `${width}px`, height: `${width}px`, margin: '20px auto' }}>
      <CircularProgressbar
        value={percentage}
        text={`${percentage}%`}
        styles={buildStyles({
          textSize: '16px',
          pathColor: color,
          textColor: '#1e293b',
          trailColor: '#e2e8f0',
          pathTransitionDuration: 0.8,
        })}
      />
    </div>
  );
};

export default CircularProgress;