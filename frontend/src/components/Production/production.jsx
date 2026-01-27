import React, { useState, useEffect, useRef } from 'react';
import { FiSettings, FiPlus, FiPlay, FiPause, FiStopCircle, FiTool, FiTrendingUp, FiBox, FiAlertCircle, FiClock, FiRefreshCw, FiList, FiPieChart, FiBarChart, FiActivity } from 'react-icons/fi';
import { TbEngine, TbProgress } from 'react-icons/tb';
import { IoStatsChart, IoCheckmarkDoneCircle } from 'react-icons/io5';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import axios from 'axios';
import { io } from 'socket.io-client';
import '../../assets/css/production.css';
import Navbar from '../navbar';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100';

// Simple chart components for visualization
const BarChart = ({ data, labels, colors, height = 200 }) => {
  const maxValue = Math.max(...data, 1);
  
  return (
    <div className="bar-chart" style={{ height: `${height}px` }}>
      {data.map((value, index) => (
        <div key={index} className="bar-container">
          <div 
            className="bar" 
            style={{ 
              height: `${(value / maxValue) * 100}%`,
              backgroundColor: colors ? colors[index] : '#3b82f6'
            }}
          />
          <span className="bar-label">{labels ? labels[index] : ''}</span>
          <span className="bar-value">{value}</span>
        </div>
      ))}
    </div>
  );
};

const PieChart = ({ data, labels, colors }) => {
  const total = data.reduce((sum, value) => sum + value, 0);
  let cumulativePercent = 0;

  return (
    <div className="pie-chart">
      <svg viewBox="0 0 100 100" width="100" height="100">
        {data.map((value, index) => {
          const percent = (value / total) * 100;
          const startPercent = cumulativePercent;
          cumulativePercent += percent;
          
          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r="45"
              fill="transparent"
              stroke={colors ? colors[index] : '#3b82f6'}
              strokeWidth="10"
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeDashoffset={100 - startPercent}
              transform="rotate(-90 50 50)"
            />
          );
        })}
      </svg>
      <div className="pie-labels">
        {labels.map((label, index) => (
          <div key={index} className="pie-label">
            <span 
              className="color-dot" 
              style={{ backgroundColor: colors ? colors[index] : '#3b82f6' }}
            />
            <span>{label}: {data[index]} ({Math.round((data[index] / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineChart = ({ data, labels, color = '#3b82f6', height = 150 }) => {
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue;
  const svgHeight = height - 30;
  
  return (
    <div className="line-chart" style={{ height: `${height}px` }}>
      <svg width="100%" height={svgHeight} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
          <line
            key={index}
            x1="0"
            y1={svgHeight * ratio}
            x2="100%"
            y2={svgHeight * ratio}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        ))}
        
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={data.map((value, index) => 
            `${(index / (data.length - 1)) * 100},${svgHeight - ((value - minValue) / range) * svgHeight}`
          ).join(' ')}
        />
        
        {data.map((value, index) => (
          <circle
            key={index}
            cx={`${(index / (data.length - 1)) * 100}%`}
            cy={svgHeight - ((value - minValue) / range) * svgHeight}
            r="4"
            fill={color}
            stroke="white"
            strokeWidth="2"
          />
        ))}
      </svg>
      
      <div className="line-labels">
        {labels && labels.map((label, index) => (
          <span key={index} className="line-label">{label}</span>
        ))}
      </div>
    </div>
  );
};

const DonutChart = ({ data, labels, colors, size = 100 }) => {
  const total = data.reduce((sum, value) => sum + value, 0);
  let cumulativePercent = 0;

  return (
    <div className="donut-chart">
      <svg width={size} height={size} viewBox="0 0 100 100">
        {data.map((value, index) => {
          const percent = (value / total) * 100;
          const startPercent = cumulativePercent;
          cumulativePercent += percent;
          
          return (
            <circle
              key={index}
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              stroke={colors ? colors[index] : '#3b82f6'}
              strokeWidth="10"
              strokeDasharray={`${percent} ${100 - percent}`}
              strokeDashoffset={100 - startPercent}
              transform="rotate(-90 50 50)"
            />
          );
        })}
        <text x="50" y="50" textAnchor="middle" dy="0.3em" fontSize="16" fontWeight="600" fill="#374151">
          {total}
        </text>
      </svg>
      <div className="donut-labels">
        {labels.map((label, index) => (
          <div key={index} className="donut-label">
            <span 
              className="color-dot" 
              style={{ backgroundColor: colors ? colors[index] : '#3b82f6' }}
            />
            <span>{label}: {data[index]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProductionControl = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [notification, setNotification] = useState({ show: false, message: '' });
  const [batches, setBatches] = useState([]);
  const [productionLines, setProductionLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyticsTimeRange, setAnalyticsTimeRange] = useState('7d');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  
  const socketRef = useRef(null);
  const progressIntervalRef = useRef(null);

  
// Socket.IO connection - SIMPLIFIED VERSION
useEffect(() => {
  socketRef.current = io(API_BASE_URL);
  
  socketRef.current.on('connect', () => {
    console.log('Connected to server via Socket.IO');
  });
  
  socketRef.current.on('batchProgress', (data) => {
    console.log('Batch progress update received:', data);
    
    // Instead of complex state updates, just refresh the data silently
    fetchProductionDataSilent();
  });
  
  socketRef.current.on('batchCompleted', (data) => {
    showNotification(`Batch ${data.batchId} completed!`);
    fetchProductionDataSilent();
  });
  
  socketRef.current.on('batchAssigned', (data) => {
    showNotification(`Batch ${data.batchId} assigned to ${data.lineName}`);
    fetchProductionDataSilent();
  });
  
  socketRef.current.on('lineStatusUpdated', (data) => {
    // For line status updates, we can update directly
    setProductionLines(prevLines => 
      prevLines.map(line => 
        line.id === data.lineId 
          ? { ...line, status: data.status }
          : line
      )
    );
  });
  
  socketRef.current.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  return () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };
}, []);


// Fetch production data
  // Fetch production data
const fetchProductionData = async () => {
  try {
    const [batchesRes, linesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/batches`),
      axios.get(`${API_BASE_URL}/api/production-lines`)
    ]);

    console.log('Batches API response:', batchesRes.data);
    console.log('Lines API response:', linesRes.data);

    if (batchesRes.data.success) {
      setBatches(batchesRes.data.batches);
    }

    if (linesRes.data.success) {
      // Create a map of batches by ID for easy lookup
      const batchesMap = {};
      if (batchesRes.data.success) {
        batchesRes.data.batches.forEach(batch => {
          batchesMap[batch._id] = batch;
        });
      }

      // Transform the data to match the expected format
      const transformedLines = linesRes.data.lines.map(line => {
        // Get the first batch in the queue (if any)
        let currentBatch = null;
        
        if (line.queue && line.queue.length > 0) {
          // Check if queue contains batch objects or just IDs
          const firstQueueItem = line.queue[0];
          
          // If it's already a populated batch object
          if (firstQueueItem && typeof firstQueueItem === 'object' && firstQueueItem.batchId) {
            currentBatch = firstQueueItem;
          } 
          // If it's just an ID, look it up in the batches map
          else if (typeof firstQueueItem === 'string') {
            currentBatch = batchesMap[firstQueueItem];
          }
          // If it's an ObjectId object, convert to string and look up
          else if (firstQueueItem && typeof firstQueueItem === 'object' && firstQueueItem.toString) {
            currentBatch = batchesMap[firstQueueItem.toString()];
          }
        }
        
        return {
          id: line._id,
          name: line.name,
          status: line.status,
          batchId: currentBatch ? currentBatch.batchId : 'No Batch',
          product: currentBatch ? currentBatch.productName : 'Idle',
          progress: currentBatch ? currentBatch.progress : 0,
          speed: line.status === 'busy' ? 45 : 0,
          operator: 'Operator',
          efficiency: calculateEfficiency(line, currentBatch),
          nextMaintenance: '2023-12-15',
          output: calculateOutput(currentBatch),
          target: calculateTarget(currentBatch),
          batch: currentBatch
        };
      });
      
      console.log('Transformed lines:', transformedLines);
      setProductionLines(transformedLines);
    }
  } catch (error) {
    console.error('Error fetching production data:', error);
    showNotification('Error loading production data');
  } finally {
    setLoading(false);
  }
};

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      const [analyticsRes, statusRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/analytics/production?timeRange=${analyticsTimeRange}`),
        axios.get(`${API_BASE_URL}/api/analytics/system-status`)
      ]);

      if (analyticsRes.data.success) {
        setAnalyticsData(analyticsRes.data.data);
      }

      if (statusRes.data.success) {
        setSystemStatus(statusRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

// Start automatic progress updates for active batches
useEffect(() => {
  const updateProgress = async () => {
    try {
      // Get all active batches that need progress updates
      // Check for both possible status values
      const activeBatches = batches.filter(batch => 
        (batch.status === 'assigned' || batch.status === 'in-production') && 
        batch.progress < 100
      );
      
      if (activeBatches.length > 0) {
        console.log('Updating progress for', activeBatches.length, 'active batches');
      }
      
      // Update each active batch
      for (const batch of activeBatches) {
        const newProgress = Math.min(batch.progress + 2, 100);
        
        try {
          await axios.put(`${API_BASE_URL}/api/batches/${batch._id}/progress`, {
            progress: newProgress
          });
          console.log('Updated batch', batch.batchId, 'progress to', newProgress);
        } catch (error) {
          console.error('Error updating batch progress:', error);
        }
      }
    } catch (error) {
      console.error('Error in progress update:', error);
    }
  };
  
  // Set up interval for progress updates
  progressIntervalRef.current = setInterval(updateProgress, 1000);
  
  return () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };
}, [batches]);

useEffect(() => {
  fetchProductionData();
  fetchAnalyticsData();
  
  // Set up silent refresh every 5 seconds (no loader)
  const refreshInterval = setInterval(() => {
    fetchProductionDataSilent();
  }, 5000);
  
  return () => {
    clearInterval(refreshInterval);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };
}, [analyticsTimeRange]);

// Add this new function for silent data fetching
const fetchProductionDataSilent = async () => {
  try {
    const [batchesRes, linesRes] = await Promise.all([
      axios.get(`${API_BASE_URL}/api/batches`),
      axios.get(`${API_BASE_URL}/api/production-lines`)
    ]);

    if (batchesRes.data.success) {
      setBatches(batchesRes.data.batches);
    }

    if (linesRes.data.success) {
      // Create a map of batches by ID for easy lookup
      const batchesMap = {};
      if (batchesRes.data.success) {
        batchesRes.data.batches.forEach(batch => {
          batchesMap[batch._id] = batch;
        });
      }

      // Use the SAME transformation logic as fetchProductionData
      const transformedLines = linesRes.data.lines.map(line => {
        // Get the first batch in the queue (if any)
        let currentBatch = null;
        
        if (line.queue && line.queue.length > 0) {
          // Check if queue contains batch objects or just IDs
          const firstQueueItem = line.queue[0];
          
          // If it's already a populated batch object
          if (firstQueueItem && typeof firstQueueItem === 'object' && firstQueueItem.batchId) {
            currentBatch = firstQueueItem;
          } 
          // If it's just an ID, look it up in the batches map
          else if (typeof firstQueueItem === 'string') {
            currentBatch = batchesMap[firstQueueItem];
          }
          // If it's an ObjectId object, convert to string and look up
          else if (firstQueueItem && typeof firstQueueItem === 'object' && firstQueueItem.toString) {
            currentBatch = batchesMap[firstQueueItem.toString()];
          }
        }
        
        return {
          id: line._id,
          name: line.name,
          status: line.status,
          batchId: currentBatch ? currentBatch.batchId : 'No Batch',
          product: currentBatch ? currentBatch.productName : 'Idle',
          progress: currentBatch ? currentBatch.progress : 0,
          speed: line.status === 'busy' ? 45 : 0,
          operator: 'Operator',
          efficiency: calculateEfficiency(line, currentBatch),
          nextMaintenance: '2023-12-15',
          output: calculateOutput(currentBatch),
          target: calculateTarget(currentBatch),
          batch: currentBatch
        };
      });
      
      setProductionLines(transformedLines);
    }
  } catch (error) {
    console.error('Error silently fetching production data:', error);
  }
};
const handleControlAction = async (lineId, action) => {
  try {
    const status = action === 'start' ? 'busy' :
                   action === 'pause' ? 'paused' :
                   action === 'stop' ? 'idle' : 'maintenance';

    const response = await axios.put(`${API_BASE_URL}/api/production-lines/${lineId}/status`, { status });

    if (response.data.success) {
      showNotification(`Line status updated to ${status}`);
      // Optimistically update UI
      setProductionLines(prev => prev.map(line => line.id === lineId ? { ...line, status } : line));
    }
  } catch (err) {
    console.error(err);
    showNotification('Error updating line status');
  }
};

  const showNotification = (message) => {
    setNotification({ show: true, message });
    setTimeout(() => setNotification({ show: false, message: '' }), 3000);
  };

  const getStatusColor = (status) => {
    switch(status){
      case 'busy': return '#d60d1dff';
      case 'idle': return '#2dbd13ff';
      case 'paused': return '#f59e0b';
      case 'maintenance': return '#000000ff';
      default: return '#6b7280';
    }
  };

  // Update calculation functions to use batch data
  const calculateEfficiency = (line, batch) => {
    if (line.status !== 'busy' || !batch) return 0;
    return Math.floor(Math.random() * 10) + 85;
  };
  
  const calculateOutput = (batch) => {
    if (!batch) return 0;
    return Math.round((batch.quantity * batch.progress) / 100);
  };
  
  const calculateTarget = (batch) => {
    if (!batch) return 0;
    return batch.quantity;
  };

  const linesWithBatches = productionLines.filter(line => line.batchId !== 'No Batch');
  const idleLines = productionLines.filter(line => line.batchId === 'No Batch');

  // Render content based on active tab
  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard':
        return (
          <>
            {/* System Status Overview */}
            <div className="overview-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor:'rgba(59,130,246,0.1)' }}>
                  <TbEngine style={{ color:'#3b82f6' }}/>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{systemStatus?.energyConsumption || 0} kWh</span>
                  <Sparklines data={systemStatus?.energyTrend || [0,0,0,0]} width={80} height={20}>
                    <SparklinesLine color="#3b82f6" style={{ strokeWidth: 3, fill: "none" }} />
                  </Sparklines>
                  <span className="stat-label">Energy Consumption</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor:'rgba(245,158,11,0.1)' }}>
                  <FiBox style={{ color:'#f59e0b' }}/>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{systemStatus?.ordersInQueue || 0}</span>
                  <Sparklines data={systemStatus?.queueTrend || [0,0,0,0]} width={80} height={20}>
                    <SparklinesLine color="#f59e0b" style={{ strokeWidth: 3, fill: "none" }} />
                  </Sparklines>
                  <span className="stat-label">Orders in Queue</span>
                </div>
              </div>

                           <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor:'rgba(16,185,129,0.1)' }}>
                  <IoStatsChart style={{ color:'#10b981' }}/>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{systemStatus?.totalBatches || 0}</span>
                  <Sparklines data={systemStatus?.batchesTrend || [0,0,0,0]} width={80} height={20}>
                    <SparklinesLine color="#10b981" style={{ strokeWidth: 3, fill:"none" }}/>
                  </Sparklines>
                  <span className="stat-label">Total Batches</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor:'rgba(239,68,68,0.1)' }}>
                  <FiAlertCircle style={{ color:'#ef4444' }}/>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{systemStatus?.defectRate || 0}%</span>
                  <Sparklines data={systemStatus?.defectTrend || [0,0,0,0]} width={80} height={20}>
                    <SparklinesLine color="#ef4444" style={{ strokeWidth: 3, fill:"none" }}/>
                  </Sparklines>
                  <span className="stat-label">Defect Rate</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor:'rgba(16,185,129,0.1)' }}>
                  <FiTrendingUp style={{ color:'#10b981' }}/>
                </div>
                <div className="stat-content">
                  <span className="stat-value">{systemStatus?.OEE || 0}%</span>
                  <Sparklines data={systemStatus?.OEETrend || [0,0,0,0]} width={80} height={20}>
                    <SparklinesLine color="#10b981" style={{ strokeWidth: 3, fill:"none" }}/>
                  </Sparklines>
                  <span className="stat-label">OEE</span>
                </div>
              </div>
            </div>

            {/* Active Production Lines */}
            <div className="section">
              <div className="section-header">
                <h3>Active Production Lines</h3>
                <span className="section-badge">{linesWithBatches.length} Active</span>
              </div>
              {linesWithBatches.length > 0 ? (
                <div className="production-grid">
                  {linesWithBatches.map(line => (
                    <div key={line.id} className="line-card">
                      <div className="line-header">
                        <h4>{line.name}</h4>
                        <span className="status-badge" style={{backgroundColor:getStatusColor(line.status)}}>
                          {line.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="line-details">
                        <div className="detail-row">
                          <span className="detail-label">Batch ID</span>
                          <span className="detail-value">{line.batchId}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Product</span>
                          <span className="detail-value">{line.product}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Progress</span>
                          <div className="progress-container">
                            <div className="progress-bar">
                              <div className="progress-fill" style={{width:`${line.progress}%`}}></div>
                            </div>
                            <span className="progress-value">{line.progress}%</span>
                          </div>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Output</span>
                          <span className="detail-value">{Math.round(line.output)}/{line.target} units</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Efficiency</span>
                          <span className="detail-value">{line.efficiency}%</span>
                        </div>
                      </div>
                      <div className="line-controls">
                        <button className="control-btn start" onClick={()=>handleControlAction(line.id,'start')}>
                          <FiPlay/>
                        </button>
                        <button className="control-btn pause" onClick={()=>handleControlAction(line.id,'pause')}>
                          <FiPause/>
                        </button>
                        <button className="control-btn stop" onClick={()=>handleControlAction(line.id,'stop')}>
                          <FiStopCircle/>
                        </button>
                        <button className="control-btn maintenance" onClick={()=>handleControlAction(line.id,'maintenance')}>
                          <FiTool/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <FiList size={48} />
                  <h4>No active production lines</h4>
                  <p>All production lines are currently idle</p>
                </div>
              )}
            </div>
          </>
        );

    // In your renderContent function for the production tab
case 'production':
  return (
    <div className="section">
      <div className="section-header">
        <h3>All Production Lines</h3>
        <span className="section-badge">{productionLines.length} Total</span>
      </div>
      <div className="production-grid">
        {productionLines.map(line => (
          <div key={line.id} className="line-card">
            <div className="line-header">
              <h4>{line.name}</h4>
              <span className="status-badge" style={{backgroundColor:getStatusColor(line.status)}}>
                {line.status.toUpperCase()}
              </span>
            </div>
            <div className="line-details">
              <div className="detail-row">
                <span className="detail-label">Batch ID</span>
                <span className="detail-value">{line.batchId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Product</span>
                <span className="detail-value">{line.product}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Progress</span>
                <div className="progress-container">
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width:`${line.progress}%`}}></div>
                  </div>
                  <span className="progress-value">{line.progress}%</span>
                </div>
              </div>
              <div className="detail-row">
                <span className="detail-label">Status</span>
                <span className="detail-value">{line.status}</span>
              </div>
              {line.batchId !== 'No Batch' && (
                <div className="detail-row">
                  <span className="detail-label">Output</span>
                  <span className="detail-value">{Math.round(line.output)}/{line.target} units</span>
                </div>
              )}
            </div>
            <div className="line-controls">
              <button className="control-btn start" onClick={()=>handleControlAction(line.id,'start')}>
                <FiPlay/>
              </button>
              <button className="control-btn pause" onClick={()=>handleControlAction(line.id,'pause')}>
                <FiPause/>
              </button>
              <button className="control-btn stop" onClick={()=>handleControlAction(line.id,'stop')}>
                <FiStopCircle/>
              </button>
              <button className="control-btn maintenance" onClick={()=>handleControlAction(line.id,'maintenance')}>
                <FiTool/>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

      case 'batches':
        return (
          <div className="section">
            <div className="section-header">
              <h3>All Batches</h3>
              <span className="section-badge">{batches.length} Total</span>
            </div>
            <div className="batches-table-container">
              <table className="batches-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Product</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Line</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
  {batches.map(batch => (
    <tr key={batch._id}>
      <td>{batch.batchId}</td>
      <td>{batch.productName}</td>
      <td>
        <span className={`status-badge ${batch.status}`}>
          {batch.status}
        </span>
      </td>
      <td>
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{width:`${batch.progress}%`}}></div>
          </div>
          <span className="progress-value">{batch.progress}%</span>
        </div>
      </td>
      <td>
        {batch.status === 'completed' 
          ? batch.completedLineName || 'Unknown Line' 
          : batch.assignedLine?.name || 'Pending'}
      </td>
      <td>{new Date(batch.createdAt).toLocaleDateString()}</td>
    </tr>
  ))}
</tbody>

              </table>
            </div>
          </div>
        );

      case 'analytics':
        if (!analyticsData) {
          return <div className="loading-spinner">Loading analytics data...</div>;
        }

        return (
          <div className="analytics-container">
            <div className="analytics-header">
              <h3>Production Analytics</h3>
              <div className="time-range-selector">
                <button className={analyticsTimeRange === '7d' ? 'active' : ''} onClick={() => setAnalyticsTimeRange('7d')}>
                  7 Days
                </button>
                <button className={analyticsTimeRange === '30d' ? 'active' : ''} onClick={() => setAnalyticsTimeRange('30d')}>
                  30 Days
                </button>
                <button className={analyticsTimeRange === '90d' ? 'active' : ''} onClick={() => setAnalyticsTimeRange('90d')}>
                  90 Days
                </button>
              </div>
            </div>

            <div className="analytics-grid">
              {/* Batch Status Distribution */}
              <div className="analytics-card">
                <div className="card-header">
                  <FiPieChart className="card-icon" />
                  <h4>Batch Status Distribution</h4>
                </div>
                <PieChart 
                  data={analyticsData.statusDistribution}
                  labels={['Completed', 'In Production', 'Pending', 'Cancelled']}
                  colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
                />
              </div>

              {/* Daily Production Trend */}
              <div className="analytics-card">
                <div className="card-header">
                  <FiTrendingUp className="card-icon" />
                  <h4>Daily Production Trend</h4>
                </div>
                <LineChart 
                  data={analyticsData.dailyProduction}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  color="#3b82f6"
                  height={150}
                />
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-value">{Math.round(analyticsData.dailyProduction.reduce((a, b) => a + b, 0) / analyticsData.dailyProduction.length)}</span>
                    <span className="stat-label">Avg Daily</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{Math.max(...analyticsData.dailyProduction)}</span>
                    <span className="stat-label">Peak Daily</span>
                  </div>
                </div>
              </div>

              {/* Energy Consumption */}
              <div className="analytics-card">
                <div className="card-header">
                  <TbEngine className="card-icon" />
                  <h4>Energy Consumption</h4>
                </div>
                <LineChart 
                  data={analyticsData.dailyEnergy}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  color="#f59e0b"
                  height={150}
                />
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-value">{Math.round(analyticsData.dailyEnergy.reduce((a, b) => a + b, 0) / analyticsData.dailyEnergy.length)} kWh</span>
                    <span className="stat-label">Avg Daily</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{Math.max(...analyticsData.dailyEnergy)} kWh</span>
                    <span className="stat-label">Peak Usage</span>
                  </div>
                </div>
              </div>

              {/* Efficiency Trend */}
              <div className="analytics-card">
                <div className="card-header">
                  <FiActivity className="card-icon" />
                  <h4>Efficiency Trend</h4>
                </div>
                <LineChart 
                  data={analyticsData.dailyEfficiency}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  color="#10b981"
                  height={150}
                />
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-value">{Math.round(analyticsData.dailyEfficiency.reduce((a, b) => a + b, 0) / analyticsData.dailyEfficiency.length)}%</span>
                    <span className="stat-label">Avg Efficiency</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{Math.max(...analyticsData.dailyEfficiency)}%</span>
                    <span className="stat-label">Peak Efficiency</span>
                  </div>
                </div>
              </div>

              {/* Defect Analysis */}
              <div className="analytics-card">
                <div className="card-header">
                  <FiAlertCircle className="card-icon" />
                  <h4>Defect Analysis</h4>
                </div>
                <LineChart 
                  data={analyticsData.dailyDefects}
                  labels={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']}
                  color="#ef4444"
                  height={150}
                />
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-value">{Math.round(analyticsData.dailyDefects.reduce((a, b) => a + b, 0) / analyticsData.dailyDefects.length)}</span>
                    <span className="stat-label">Avg Daily Defects</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{Math.max(...analyticsData.dailyDefects)}</span>
                    <span className="stat-label">Max Defects</span>
                  </div>
                </div>
              </div>

              {/* Shift Performance */}
              <div className="analytics-card">
                <div className="card-header">
                  <FiClock className="card-icon" />
                  <h4>Shift Performance</h4>
                </div>
                <BarChart 
                  data={analyticsData.shiftPerformance.map(s => s.output)}
                  labels={analyticsData.shiftPerformance.map(s => s.shift)}
                  colors={['#6366f1', '#8b5cf6', '#ec4899']}
                  height={120}
                />
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-value">{analyticsData.shiftPerformance[0].efficiency}%</span>
                    <span className="stat-label">Morning Eff.</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{analyticsData.shiftPerformance[1].efficiency}%</span>
                    <span className="stat-label">Afternoon Eff.</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{analyticsData.shiftPerformance[2].efficiency}%</span>
                    <span className="stat-label">Night Eff.</span>
                  </div>
                </div>
              </div>

              {/* Material Usage */}
              <div className="analytics-card">
                <div className="card-header">
                  <FiBox className="card-icon" />
                  <h4>Material Usage</h4>
                </div>
                <DonutChart 
                  data={analyticsData.materialUsage}
                  labels={['Steel', 'Plastic', 'Electronics', 'Leather', 'Other']}
                  colors={['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']}
                />
                <div className="stats-row">
                  <div className="stat">
                    <span className="stat-value">{analyticsData.materialUsage.reduce((a, b) => a + b, 0)}</span>
                    <span className="stat-label">Total Materials</span>
                  </div>
                </div>
                </div>

                {/* Downtime Analysis */}
                <div className="analytics-card">
                  <div className="card-header">
                    <FiTool className="card-icon" />
                    <h4>Downtime Analysis</h4>
                  </div>
                  <BarChart 
                    data={analyticsData.downtimeReasons.map(d => d.minutes)}
                    labels={analyticsData.downtimeReasons.map(d => d.reason)}
                    colors={['#ef4444', '#f59e0b', '#3b82f6', '#10b981']}
                    height={120}
                  />
                  <div className="stats-row">
                    <div className="stat">
                      <span className="stat-value">
                        {analyticsData.downtimeReasons.reduce((total, reason) => total + reason.minutes, 0)}m
                      </span>
                      <span className="stat-label">Total Downtime</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="section">
                <div className="section-header">
                  <h4>Key Performance Indicators</h4>
                </div>
                <div className="kpi-grid">
                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                      <IoCheckmarkDoneCircle style={{ color: '#10b981' }} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-value">{systemStatus?.OEE || 0}%</span>
                      <span className="kpi-label">OEE</span>
                    </div>
                  </div>
                  
                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                      <FiActivity style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-value">{Math.round((linesWithBatches.length / productionLines.length) * 100)}%</span>
                      <span className="kpi-label">Line Utilization</span>
                    </div>
                  </div>

                                    <div className="kpi-card">
                    <div className="kpi-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                      <FiAlertCircle style={{ color: '#ef4444' }} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-value">{systemStatus?.defectRate || 0}%</span>
                      <span className="kpi-label">Defect Rate</span>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                      <FiClock style={{ color: '#8b5cf6' }} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-value">
                        {analyticsData.downtimeReasons.reduce((total, reason) => total + reason.minutes, 0)}m
                      </span>
                      <span className="kpi-label">Total Downtime</span>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ backgroundColor: 'rgba(99, 102, 241, 0.1)' }}>
                      <FiBox style={{ color: '#6366f1' }} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-value">
                        {analyticsData.materialUsage.reduce((a, b) => a + b, 0)}
                      </span>
                      <span className="kpi-label">Materials Used</span>
                    </div>
                  </div>

                  <div className="kpi-card">
                    <div className="kpi-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                      <FiTrendingUp style={{ color: '#f59e0b' }} />
                    </div>
                    <div className="kpi-content">
                      <span className="kpi-value">
                        {Math.round(analyticsData.dailyProduction.reduce((a, b) => a + b, 0) / analyticsData.dailyProduction.length)}
                      </span>
                      <span className="kpi-label">Avg Daily Output</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );

      default:
        return <div>Select a view from the sidebar</div>;
    }
  };

  return (
    <div className="production-control">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <TbEngine className="logo-icon" />
            <h1>ProdControl</h1>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab==='dashboard'?'active':''}`} onClick={()=>setActiveTab('dashboard')}>
            <IoStatsChart className="nav-icon"/> Dashboard
          </button>
          <button className={`nav-item ${activeTab==='production'?'active':''}`} onClick={()=>setActiveTab('production')}>
            <TbProgress className="nav-icon"/> All Lines
          </button>
          <button className={`nav-item ${activeTab==='batches'?'active':''}`} onClick={()=>setActiveTab('batches')}>
            <FiBox className="nav-icon"/> All Batches
          </button>
          <button className={`nav-item ${activeTab==='analytics'?'active':''}`} onClick={()=>setActiveTab('analytics')}>
            <FiTrendingUp className="nav-icon"/> Analytics
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="nav-item"><FiSettings className="nav-icon"/> Settings</button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <Navbar />
        <header className="header">
          <h2>
            {activeTab === 'dashboard' && 'Production Dashboard'}
            {activeTab === 'production' && 'All Production Lines'}
            {activeTab === 'batches' && 'All Batches'}
            {activeTab === 'analytics' && 'Production Analytics'}
          </h2>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => {
              fetchProductionData();
              fetchAnalyticsData();
            }}>
              <FiRefreshCw className="btn-icon"/> Refresh
            </button>
          </div>
        </header>

        {loading ? (
          <div className="loading-spinner">Loading production data...</div>
        ) : (
          renderContent()
        )}
      </div>

      {/* Notification */}
      {notification.show && (
        <div className="notification">
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default ProductionControl;