import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export function StatCard({ label, value, change, trend, detail, icon, tone, onClick }) {
  return (
    <div
      className={`stat-card tone-${tone} ${onClick ? 'clickable-card' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', transition: 'all 0.2s ease' }}
    >
      <div className="stat-top">
        <div>
          <span>{label}</span>
          <strong>{value}</strong>
        </div>
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-bottom">
        <span className={trend === 'up' ? 'trend-up' : 'trend-down'}>
          {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </span>
        <span>{detail}</span>
      </div>
    </div>
  );
}

export default StatCard;
