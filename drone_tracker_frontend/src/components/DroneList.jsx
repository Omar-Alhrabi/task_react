import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { useDroneStore } from '../stores/droneStore';
import './DroneList.css';

const DroneItem = ({ index, style, data }) => {
  const { drone, onDroneClick, selectedDroneId } = data;
  const droneData = drone[index];
  
  if (!droneData) return null;

  const isSelected = selectedDroneId === droneData.id;
  const color = droneData.color;
  const flightTime = droneData.flightTime || '00:00:00';
  
  return (
    <div 
      style={style} 
      className={`drone-item ${isSelected ? 'selected' : ''}`}
      onClick={() => onDroneClick(droneData.id)}
    >
      <div className="drone-item-content">
        <div className="drone-header">
          <div className="drone-title">
            <div className={`drone-status ${color}`}></div>
            <span className="drone-id">{droneData.id}</span>
          </div>
          <span className="flight-time">{flightTime}</span>
        </div>
        <div className="drone-details">
          <div className="drone-info-row">
            <div className="drone-info">
              <span className="label">Altitude</span>
              <span className="value">{droneData.altitude?.toFixed(1) || '0.0'} m</span>
            </div>
            <div className="drone-info">
              <span className="label">Speed</span>
              <span className="value">{droneData.speed?.toFixed(1) || '0.0'} m/s</span>
            </div>
          </div>
          <div className="drone-coordinates">
            <span className="coordinates-label">Coordinates</span>
            <span className="coordinates-value">
              {droneData.latitude?.toFixed(6)}, {droneData.longitude?.toFixed(6)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const DroneList = ({ onDroneClick }) => {
  const { 
    getActiveDrones, 
    selectedDroneId, 
    getRedDronesCount
  } = useDroneStore();
  
  const activeDrones = getActiveDrones();
  const redDroneCount = getRedDronesCount();
  
  const itemData = useMemo(() => ({
    drone: activeDrones,
    onDroneClick,
    selectedDroneId
  }), [activeDrones, onDroneClick, selectedDroneId]);

  return (
    <>
      {/* Sidebar - Always visible */}
      <div className="drone-list-sidebar open">
        <div className="drone-list-header">
          {/* Logo */}
          <div className="logo-container">
            <img src="/sager_log.svg" alt="SAGER" className="sager-logo" />
          </div>
          
          {/* Title */}
          <h2>DRONE FLYING</h2>
          
          {/* Stats */}
          <div className="drone-stats">
            <div className="stat-item">
              <span className="stat-number">{activeDrones.length}</span>
              <span className="stat-label">Drones</span>
            </div>
          </div>
        </div>
        
        <div className="drone-list-content">
          {activeDrones.length > 0 ? (
            <List
              height={window.innerHeight - 200}
              itemCount={activeDrones.length}
              itemSize={120}
              itemData={itemData}
              className="drone-virtual-list"
            >
              {DroneItem}
            </List>
          ) : (
            <div className="no-drones">
              <p>No active drones</p>
            </div>
          )}
        </div>
      </div>

    </>
  );
};

export default DroneList;