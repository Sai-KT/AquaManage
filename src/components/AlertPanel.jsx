import React from 'react';
import { AlertTriangle, Droplets, CloudRain, CheckCircle, AlertCircle, Thermometer, Info } from 'lucide-react';
import { alerts } from '../data/mockData';

const iconMap = {
  AlertTriangle, Droplets, CloudRain, CheckCircle, AlertCircle, Thermometer, Info
};

export default function AlertPanel({ limit }) {
  const items = limit ? alerts.slice(0, limit) : alerts;

  return (
    <div className="alert-list">
      {items.map((alert) => {
        const Icon = iconMap[alert.icon] || Info;
        return (
          <div
            key={alert.id}
            className={`alert-item ${!alert.read ? 'unread' : ''}`}
          >
            <div className={`alert-icon ${alert.type}`}>
              <Icon size={16} />
            </div>
            <div className="alert-content">
              <div className="alert-title">{alert.title}</div>
              <div className="alert-message">{alert.message}</div>
              <div className="alert-time">{alert.time}</div>
            </div>
            {!alert.read && <div className="alert-unread-dot" />}
          </div>
        );
      })}
    </div>
  );
}
