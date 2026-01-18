import React from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';

const ActivityHeatmap = ({ data }) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 11);

  return (
    <div className="heatmap-wrapper">
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={data}
        classForValue={(value) => {
          if (!value) return 'color-empty';
          return `color-scale-${Math.min(value.count, 4)}`;
        }}
      />
    </div>
  );
};

export default ActivityHeatmap;