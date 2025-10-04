import React, { useState } from 'react';
import PremiumFeature from './PremiumFeature';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ recordings, userPlan, onUpgrade }) => {
  const [timeframe, setTimeframe] = useState('7d');

  const getAnalyticsData = () => {
    const now = new Date();
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    
    const filteredRecordings = recordings.filter(r => 
      new Date(r.timestamp) >= startDate
    );

    const totalRecordings = filteredRecordings.length;
    const totalDuration = filteredRecordings.reduce((sum, r) => sum + r.duration, 0);
    const totalSize = filteredRecordings.reduce((sum, r) => sum + r.size, 0);
    const avgDuration = totalRecordings > 0 ? totalDuration / totalRecordings : 0;

    // Simulated view data for demo
    const totalViews = totalRecordings * Math.floor(Math.random() * 50 + 10);
    const avgViewTime = avgDuration * 0.7; // Assume 70% completion rate

    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayRecordings = filteredRecordings.filter(r => 
        new Date(r.timestamp).toDateString() === date.toDateString()
      );
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        recordings: dayRecordings.length,
        views: dayRecordings.length * Math.floor(Math.random() * 20 + 5)
      });
    }

    return {
      totalRecordings,
      totalDuration,
      totalSize,
      avgDuration,
      totalViews,
      avgViewTime,
      dailyData
    };
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatFileSize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    const gb = mb / 1024;
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    }
    return `${mb.toFixed(0)} MB`;
  };

  const data = getAnalyticsData();

  return (
    <PremiumFeature 
      feature="analytics" 
      userPlan={userPlan} 
      onUpgrade={onUpgrade}
    >
      <div className="analytics-dashboard">
        <div className="analytics-header">
          <h3>📊 Analytics Dashboard</h3>
          <div className="timeframe-selector">
            <button 
              className={timeframe === '7d' ? 'active' : ''}
              onClick={() => setTimeframe('7d')}
            >
              7 Days
            </button>
            <button 
              className={timeframe === '30d' ? 'active' : ''}
              onClick={() => setTimeframe('30d')}
            >
              30 Days
            </button>
            <button 
              className={timeframe === '90d' ? 'active' : ''}
              onClick={() => setTimeframe('90d')}
            >
              90 Days
            </button>
          </div>
        </div>

        <div className="analytics-grid">
          <div className="metric-card">
            <div className="metric-icon">🎬</div>
            <div className="metric-content">
              <div className="metric-value">{data.totalRecordings}</div>
              <div className="metric-label">Total Recordings</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏱️</div>
            <div className="metric-content">
              <div className="metric-value">{formatDuration(data.totalDuration)}</div>
              <div className="metric-label">Total Duration</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">👀</div>
            <div className="metric-content">
              <div className="metric-value">{data.totalViews.toLocaleString()}</div>
              <div className="metric-label">Total Views</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">💾</div>
            <div className="metric-content">
              <div className="metric-value">{formatFileSize(data.totalSize)}</div>
              <div className="metric-label">Storage Used</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <div className="metric-value">{formatDuration(data.avgDuration)}</div>
              <div className="metric-label">Avg Duration</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⏯️</div>
            <div className="metric-content">
              <div className="metric-value">{formatDuration(data.avgViewTime)}</div>
              <div className="metric-label">Avg View Time</div>
            </div>
          </div>
        </div>

        <div className="chart-container">
          <h4>Daily Activity</h4>
          <div className="chart">
            {data.dailyData.map((day, index) => (
              <div key={index} className="chart-bar">
                <div 
                  className="bar recordings" 
                  style={{ height: `${Math.max(day.recordings * 20, 5)}px` }}
                  title={`${day.recordings} recordings`}
                ></div>
                <div 
                  className="bar views" 
                  style={{ height: `${Math.max(day.views * 2, 5)}px` }}
                  title={`${day.views} views`}
                ></div>
                <div className="chart-label">{day.date}</div>
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color recordings"></div>
              <span>Recordings</span>
            </div>
            <div className="legend-item">
              <div className="legend-color views"></div>
              <span>Views</span>
            </div>
          </div>
        </div>

        <div className="insights-section">
          <h4>📋 Insights</h4>
          <div className="insights-list">
            <div className="insight-item">
              <span className="insight-icon">🚀</span>
              <span>Your recordings get an average of {Math.round(data.totalViews / data.totalRecordings)} views each</span>
            </div>
            <div className="insight-item">
              <span className="insight-icon">⭐</span>
              <span>Viewers watch {Math.round((data.avgViewTime / data.avgDuration) * 100)}% of your recordings on average</span>
            </div>
            <div className="insight-item">
              <span className="insight-icon">📊</span>
              <span>You've been most active on {data.dailyData.reduce((max, day) => day.recordings > max.recordings ? day : max, {recordings: 0, date: 'N/A'}).date}</span>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeature>
  );
};

export default AnalyticsDashboard;