import React from 'react';
import { useDroneStore } from '../stores/droneStore';
import './RedDroneCounter.css';

const RedDroneCounter = () => {
  const { getRedDronesCount } = useDroneStore();
  const redDroneCount = getRedDronesCount();

  if (redDroneCount === 0) {
    return null; // Don't show counter if no red drones
  }

  return (
    <div className="red-drone-counter">
      <div className="counter-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" 
            fill="currentColor"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.7"/>
        </svg>
      </div>
      <div className="counter-content">
        <div className="counter-number">{redDroneCount}</div>
        <div className="counter-label">Unauthorized</div>
      </div>
      <div className="counter-pulse"></div>
    </div>
  );
};

export default RedDroneCounter;