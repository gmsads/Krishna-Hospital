import React, { useState } from 'react';
import { Filter } from 'lucide-react';

export function TimeFilterBar({ onChange, title = 'Filter Dashboard Analytics' }) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentYearStr = now.getFullYear().toString();

  const [filterMode, setFilterMode] = useState('all'); // 'all', 'date', 'monthly', 'yearly'
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [selectedYear, setSelectedYear] = useState(currentYearStr);

  const handleModeChange = (mode) => {
    setFilterMode(mode);
    onChange && onChange({ filterMode: mode, selectedDate, selectedMonth, selectedYear });
  };

  const handleDateChange = (val) => {
    setSelectedDate(val);
    onChange && onChange({ filterMode: 'date', selectedDate: val, selectedMonth, selectedYear });
  };

  const handleMonthChange = (val) => {
    setSelectedMonth(val);
    onChange && onChange({ filterMode: 'monthly', selectedDate, selectedMonth: val, selectedYear });
  };

  const handleYearChange = (val) => {
    setSelectedYear(val);
    onChange && onChange({ filterMode: 'yearly', selectedDate, selectedMonth, selectedYear: val });
  };

  return (
    <section className="panel" style={{ background: '#f4f8fe', borderColor: '#d3e2f5', marginBottom: '20px', padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={16} color="#1769d7" />
          <strong style={{ fontSize: '13px', color: '#1a3354' }}>{title}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: '#fff', padding: '3px', borderRadius: '8px', border: '1px solid #cce0f5', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="secondary-button"
              style={{ padding: '6px 12px', fontSize: '11px', border: '0', background: filterMode === 'all' ? '#1769d7' : 'transparent', color: filterMode === 'all' ? '#fff' : '#4a5e7a' }}
              onClick={() => handleModeChange('all')}
            >
              All Time / Today
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ padding: '6px 12px', fontSize: '11px', border: '0', background: filterMode === 'date' ? '#1769d7' : 'transparent', color: filterMode === 'date' ? '#fff' : '#4a5e7a' }}
              onClick={() => handleModeChange('date')}
            >
              Date-wise
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ padding: '6px 12px', fontSize: '11px', border: '0', background: filterMode === 'monthly' ? '#1769d7' : 'transparent', color: filterMode === 'monthly' ? '#fff' : '#4a5e7a' }}
              onClick={() => handleModeChange('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className="secondary-button"
              style={{ padding: '6px 12px', fontSize: '11px', border: '0', background: filterMode === 'yearly' ? '#1769d7' : 'transparent', color: filterMode === 'yearly' ? '#fff' : '#4a5e7a' }}
              onClick={() => handleModeChange('yearly')}
            >
              Yearly
            </button>
          </div>

          {/* Date-wise Picker */}
          {filterMode === 'date' && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
            />
          )}

          {/* Monthly Picker */}
          {filterMode === 'monthly' && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
            />
          )}

          {/* Yearly Picker */}
          {filterMode === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              style={{ padding: '6px 10px', border: '1px solid #b8d5f7', borderRadius: '7px', fontSize: '12px', background: '#fff' }}
            >
              <option value="2026">Year 2026</option>
              <option value="2025">Year 2025</option>
              <option value="2024">Year 2024</option>
            </select>
          )}
        </div>
      </div>
    </section>
  );
}

export default TimeFilterBar;
