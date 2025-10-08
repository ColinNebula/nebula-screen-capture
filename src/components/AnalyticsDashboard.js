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

    // Group data intelligently based on timeframe
    const chartData = [];
    
    if (timeframe === '7d') {
      // Show daily data for 7 days
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayRecordings = filteredRecordings.filter(r => 
          new Date(r.timestamp).toDateString() === date.toDateString()
        );
        chartData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          recordings: dayRecordings.length,
          views: dayRecordings.length * Math.floor(Math.random() * 20 + 5)
        });
      }
    } else {
      // Group by weeks for 30 and 90 day views
      const weeksToShow = timeframe === '30d' ? 4 : 12;
      const daysPerGroup = Math.ceil(days / weeksToShow);
      
      for (let i = weeksToShow - 1; i >= 0; i--) {
        const endDate = new Date(now.getTime() - i * daysPerGroup * 24 * 60 * 60 * 1000);
        const startDateGroup = new Date(endDate.getTime() - daysPerGroup * 24 * 60 * 60 * 1000);
        
        const groupRecordings = filteredRecordings.filter(r => {
          const recDate = new Date(r.timestamp);
          return recDate >= startDateGroup && recDate <= endDate;
        });
        
        const weekLabel = timeframe === '30d' 
          ? `Week ${weeksToShow - i}`
          : `W${weeksToShow - i}`;
        
        chartData.push({
          date: weekLabel,
          recordings: groupRecordings.length,
          views: groupRecordings.length * Math.floor(Math.random() * 20 + 5)
        });
      }
    }

    return {
      totalRecordings,
      totalDuration,
      totalSize,
      avgDuration,
      totalViews,
      avgViewTime,
      chartData
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
          <h4>{timeframe === '7d' ? 'Daily Activity' : 'Weekly Activity'}</h4>
          <div className="chart">
            {data.chartData.map((item, index) => {
              const maxRecordings = Math.max(...data.chartData.map(d => d.recordings), 1);
              const maxViews = Math.max(...data.chartData.map(d => d.views), 1);
              return (
                <div key={index} className="chart-bar">
                  <div 
                    className="bar recordings" 
                    style={{ height: `${Math.max((item.recordings / maxRecordings) * 150, 5)}px` }}
                    title={`${item.recordings} recordings`}
                  ></div>
                  <div 
                    className="bar views" 
                    style={{ height: `${Math.max((item.views / maxViews) * 150, 5)}px` }}
                    title={`${item.views} views`}
                  ></div>
                  <div className="chart-label">{item.date}</div>
                </div>
              );
            })}
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
              <span>You've been most active on {data.chartData.reduce((max, item) => item.recordings > max.recordings ? item : max, {recordings: 0, date: 'N/A'}).date}</span>
            </div>
          </div>
        </div>
      </div>
    </PremiumFeature>
  );
};

export default AnalyticsDashboard;