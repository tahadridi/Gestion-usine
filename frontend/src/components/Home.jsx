// Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from './navbar';
import '../assets/css/home.css';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const Home = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalMaterials: 0,
    availableMaterials: 0,
    unavailableMaterials: 0,
    lowStockMaterials: 0,
    totalUsers: 0,
    activeBatches: 0,
    pendingTasks: 0,
    completedBatches: 0,
    productionLines: 0
  });
  
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showAllLowStock, setShowAllLowStock] = useState(false);
  const [loading, setLoading] = useState(true);
  const [productionStats, setProductionStats] = useState({
    todayBatches: 0,
    weeklyBatches: 0,
    monthlyBatches: 0
  });
  const [lineStatus, setLineStatus] = useState([]);
  const [lineChartData, setLineChartData] = useState(null);
  const [topLines, setTopLines] = useState([]);
  const [dailyProductionData, setDailyProductionData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [efficiency, setEfficiency] = useState(0);
  const [efficiencyTrend, setEfficiencyTrend] = useState([]);
  const [reclamations, setReclamations] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all data in parallel including activities
        const [
          productsRes, 
          materialsRes, 
          usersRes, 
          batchesRes, 
          linesRes,
          notificationsRes,
          activitiesRes,
          reclamationsRes
        ] = await Promise.all([
          axios.get('http://localhost:5100/api/products'),
          axios.get('http://localhost:5100/api/stock'),
          axios.get('http://localhost:5100/api/employees'),
          axios.get('http://localhost:5100/api/batches'),
          axios.get('http://localhost:5100/api/production-lines'),
          axios.get('http://localhost:5100/api/notifications?limit=10&sort=-timestamp'),
          axios.get('http://localhost:5100/api/activities?limit=5'),
          axios.get('http://localhost:5100/api/reclamations?limit=3&sort=-createdAt')
        ]);

        const products = productsRes.data || [];
        const materials = materialsRes.data || [];
        const users = usersRes.data || [];
        const batches = Array.isArray(batchesRes.data) ? batchesRes.data : batchesRes.data.batches || [];
        const lines = linesRes.data?.lines || [];
        const notifications = notificationsRes.data || [];
        const activities = activitiesRes.data?.activities || [];
        const reclamationsData = reclamationsRes.data?.reclamations || [];

        // Calculate stats
        const availableMaterials = materials.filter(m => m.available).length;
        const unavailableMaterials = materials.length - availableMaterials;
        const lowStockMaterials = materials.filter(m => m.quantity < 10);
        
        // Calculate production stats
        const today = new Date();
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const todayBatches = batches.filter(b => 
          new Date(b.createdAt) >= todayStart
        ).length;
        
        const weeklyBatches = batches.filter(b => 
          new Date(b.createdAt) >= weekStart
        ).length;
        
        const monthlyBatches = batches.filter(b => 
          new Date(b.createdAt) >= monthStart
        ).length;

        // Enhanced efficiency calculation function
        const calculateEfficiency = (batches, lines) => {
          if (batches.length === 0) return 0;
          
          // Calculate completion rate
          const totalBatches = batches.length;
          const completedBatches = batches.filter(b => b.status === 'completed').length;
          const completionRate = (completedBatches / totalBatches) * 100;
          
          // Calculate average production time (if you have start and complete times)
          const completedWithTimes = batches.filter(b => 
            b.status === 'completed' && b.startedAt && b.completedAt
          );
          
          let timeEfficiency = 100;
          if (completedWithTimes.length > 0) {
            const avgProductionTime = completedWithTimes.reduce((total, batch) => {
              const start = new Date(batch.startedAt);
              const end = new Date(batch.completedAt);
              return total + (end - start);
            }, 0) / completedWithTimes.length;
            
            // Compare against ideal production time (adjust as needed)
            const idealTime = 3600000; // 1 hour in milliseconds
            timeEfficiency = Math.max(0, Math.min(100, (idealTime / avgProductionTime) * 100));
          }
          
          // Calculate line utilization
          const busyLines = lines.filter(line => line.status === 'busy').length;
          const totalLines = lines.length;
          const utilizationRate = totalLines > 0 ? (busyLines / totalLines) * 100 : 0;
          
          // Weighted average of different efficiency factors
          return Math.round(
            (completionRate * 0.4) + 
            (timeEfficiency * 0.4) + 
            (utilizationRate * 0.2)
          );
        };

        // Track efficiency trend function
        const trackEfficiencyTrend = (batches) => {
          const weeklyEfficiency = [];
          const now = new Date();
          
          // Calculate efficiency for each of the last 4 weeks
          for (let i = 3; i >= 0; i--) {
            const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7));
            const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((i - 1) * 7));
            
            const weekBatches = batches.filter(b => {
              const batchDate = new Date(b.createdAt);
              return batchDate >= weekStart && batchDate < weekEnd;
            });
            
            const weekCompleted = weekBatches.filter(b => b.status === 'completed').length;
            const weekEfficiency = weekBatches.length > 0 ? 
              Math.round((weekCompleted / weekBatches.length) * 100) : 0;
            
            weeklyEfficiency.push(weekEfficiency);
          }
          
          return weeklyEfficiency;
        };

        // Calculate efficiency
        const efficiencyRate = calculateEfficiency(batches, lines);
        const trendData = trackEfficiencyTrend(batches);
          
        // Calculate daily production for the last 7 days
        const dailyProduction = {};
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          dailyProduction[dateStr] = batches.filter(b => {
            const batchDate = new Date(b.createdAt);
            return batchDate.toDateString() === date.toDateString();
          }).length;
        }

        setStats({
          totalProducts: products.length,
          totalMaterials: materials.length,
          availableMaterials,
          unavailableMaterials,
          lowStockMaterials: lowStockMaterials.length,
          totalUsers: users.length,
          activeBatches: batches.filter(b => b.status === 'in-production' || b.status === 'pending').length,
          completedBatches: batches.filter(b => b.status === 'completed').length,
          productionLines: lines.length,
          pendingTasks: batches.filter(b => b.status === 'pending').length
        });
        
        setProductionStats({
          todayBatches,
          weeklyBatches,
          monthlyBatches
        });

        setEfficiency(efficiencyRate);
        setEfficiencyTrend(trendData);

        // Set daily production chart data
        setDailyProductionData({
          labels: Object.keys(dailyProduction),
          datasets: [
            {
              label: 'Batches Completed',
              data: Object.values(dailyProduction),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.3,
              fill: true,
            }
          ]
        });

        // Get recent products (last 3)
        setRecentProducts(products.slice(-3));
        
        // Get low stock items
        setLowStockItems(lowStockMaterials.slice(0, 5));
        
        // Get production line status - only active lines (busy or idle)
        const activeLines = lines.filter(line => 
          line.status === 'busy'||line.status === 'paused' || line.status === 'maintenance'
        );
        
        setLineStatus(activeLines.map(line => ({
          name: line.name,
          status: line.status,
          queue: line.queue?.length || 0
        })));

        // Calculate top 5 most used production lines from batches
        const lineUsage = {};
        
        // Count completed batches per line
        batches
          .filter(batch => batch.status === 'completed' && batch.completedLineName)
          .forEach(batch => {
            if (!lineUsage[batch.completedLineName]) {
              lineUsage[batch.completedLineName] = 0;
            }
            lineUsage[batch.completedLineName] += 1;
          });
        
        // Count current batches in queues
        lines.forEach(line => {
          if (!lineUsage[line.name]) {
            lineUsage[line.name] = 0;
          }
          lineUsage[line.name] += line.queue?.length || 0;
        });
        
        // Convert to array and sort by usage
        const topLinesData = Object.entries(lineUsage)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        
        setTopLines(topLinesData);
        
        // Prepare chart data for top lines (doughnut chart)
        const colors = [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ];
        
        const lineUtilizationData = {
          labels: topLinesData.map(line => line.name),
          datasets: [
            {
              data: topLinesData.map(line => line.count),
              backgroundColor: colors,
              borderColor: colors.map(color => color.replace('0.7', '1')),
              borderWidth: 1,
            }
          ]
        };
        
        setLineChartData(lineUtilizationData);

        // Set the activities from the API response
        setRecentActivities(activities);

        // Set notifications
        setNotifications(notifications);
        
        // Set reclamations
         setReclamations(reclamationsData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Fetch weather data (mock for demonstration)
    const fetchWeather = async () => {
      try {
        // In a real app, you would use a weather API
        const mockWeather = {
          temp: 28,
          condition: 'Sunny',
          icon: 'fa-sun',
          alert: false
        };
        setWeather(mockWeather);
      } catch (err) {
        console.error('Error fetching weather:', err);
      }
    };
    
    fetchWeather();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchData, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  const formatActivityAction = (activity) => {
    switch (activity.action) {
      case 'login':
        return 'logged in to the system';
      case 'logout':
        return 'logged out of the system';
      case 'signup':
        return 'created a new account';
      case 'start':
        return `started batch ${activity.details.batchId} for ${activity.details.product}`;
      case 'complete':
        return `completed batch ${activity.details.batchId}`;
      case 'create':
        if (activity.target === 'employee') {
          return `added employee ${activity.details.name} (CIN: ${activity.details.cin})`;
        } else if (activity.target === 'product') {
          return `added product ${activity.details.name}`;
        } else if (activity.target === 'stock item') {
          return `added ${activity.details.materialName} to stock`;
        } else if (activity.target === 'system account') {
          return `created system account for CIN: ${activity.details.cin}`;
        }
        return `created ${activity.target}`;
      case 'update':
        if (activity.target === 'employee') {
          return `updated employee ${activity.details.userId}`;
        } else if (activity.target === 'stock') {
          return `updated stock for ${activity.details.materialName} from ${activity.details.previousQuantity} to ${activity.details.newQuantity} units`;
        }
        return `updated ${activity.target}`;
      case 'delete':
        if (activity.target === 'employee') {
          return `deleted employee ${activity.details.name}`;
        } else if (activity.target === 'product') {
          return `deleted product ${activity.details.name}`;
        } else if (activity.target === 'batch') {
          return `deleted batch ${activity.details.batchId}`;
        } else if (activity.target === 'notification') {
          return `deleted notification`;
        } else if (activity.target === 'system account') {
          return `deleted system account for CIN: ${activity.details.cin}`;
        }
        return `deleted ${activity.target}`;
      case 'acknowledge':
        return `acknowledged ${activity.details.type} notification`;
      default:
        return `${activity.action} ${activity.target}`;
    }
  };

  const getPriorityClass = (priority) => {
    switch(priority) {
      case 3: return 'high-priority';
      case 2: return 'medium-priority';
      case 1: return 'low-priority';
      default: return 'medium-priority';
    }
  };

  // Helper function to get priority text
  const getPriorityText = (priority) => {
    switch(priority) {
      case 3: return 'High';
      case 2: return 'Medium';
      case 1: return 'Low';
      default: return 'Medium';
    }
  };

  // Helper function to get priority icon
  const getPriorityIcon = (priority) => {
    switch(priority) {
      case 3: return 'fa-exclamation-circle';
      case 2: return 'fa-info-circle';
      case 1: return 'fa-check-circle';
      default: return 'fa-info-circle';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMins / 60);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHrs < 24) return `${diffHrs} hr ago`;
    return activityTime.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'idle': return 'success';
      case 'busy': return 'warning';
      case 'paused': return 'secondary';
      case 'maintenance': return 'danger';
      default: return 'info';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'idle': return 'Idle';
      case 'busy': return 'Busy';
      case 'paused': return 'Paused';
      case 'maintenance': return 'Maintenance';
      default: return status;
    }
  };

  // Chart options for line utilization (doughnut)
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Top 5 Most Used Production Lines',
      },
    },
  };

  // Chart options for daily production
  const dailyProductionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Production (Last 7 Days)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Batches'
        }
      }
    }
  };

  return (
    <div className="home-component">
      <Navbar />
      
      {/* Header Section */}
      <section className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="header-top">
              <h1>Admin Dashboard</h1>
              <div className="header-controls">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <p>Welcome back! Here's an overview of your manufacturing operations.</p>
            <div className="header-info">
              <div className="current-time">
                <i className="fas fa-clock"></i> {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              {weather && (
                <div className="weather-info">
                  <i className={`fas ${weather.icon}`}></i>
                  <span>{weather.temp}°F - {weather.condition}</span>
                  {weather.alert && <span className="weather-alert"><i className="fas fa-exclamation-triangle"></i></span>}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Stats Overview */}
      <section className="stats-section">
        <div className="container">
          <h2 className="section-title">System Overview</h2>
          {loading ? (
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i> Loading data...
            </div>
          ) : (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon primary">
                  <i className="fas fa-cubes"></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.totalProducts}</h3>
                  <p>Total Products</p>
                </div>
                <Link to="/adminpage" className="stat-link">
                  <i className="fas fa-arrow-right"></i>
                </Link>
                <div className="stat-trend">
                  <i className="fas fa-arrow-up"></i> 12%
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon warning">
                  <i className="fas fa-boxes"></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.totalMaterials}</h3>
                  <p>Materials in Stock</p>
                </div>
                <Link to="/stockmanagement" className="stat-link">
                  <i className="fas fa-arrow-right"></i>
                </Link>
                <div className="stat-trend down">
                  <i className="fas fa-arrow-down"></i> 5%
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon success">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-info">
                  <h3>{stats.completedBatches}</h3>
                  <p>Completed Batches</p>
                </div>
                <Link to="/Fabrication" className="stat-link">
                  <i className="fas fa-arrow-right"></i>
                </Link>
                <div className="stat-trend">
                  <i className="fas fa-arrow-up"></i> 8%
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-card">
                  <div className="stat-icon danger">
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.lowStockMaterials}</h3>
                    <p>Low Stock Items</p>
                  </div>
                  <Link to="/stockmanagement" className="stat-link">
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                  <div className="stat-trend down">
                   
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-card">
                  <div className="stat-icon info">
                    <i className="fas fa-industry"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.productionLines}</h3>
                    <p>Production Lines</p>
                  </div>
                  <Link to="/Production" className="stat-link">
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                  <div className="stat-trend">
                    
                  </div>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-card">
                  <div className="stat-icon secondary">
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <h3>{stats.totalUsers}</h3>
                    <p>Employees</p>
                  </div>
                  <Link to="/Admin" className="stat-link">
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                  <div className="stat-trend">
                    
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Main Dashboard Content */}
      <div className="dashboard-content">
        <div className="container">
          <div className="content-grid">
            {/* Left Column */}
            <div className="content-col">
              {/* Quick Actions */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Quick Actions</h3>
                </div>
                <div className="card-body">
                  <div className="quick-actions">
                    <Link to="/Fabrication" className="quick-action-btn">
                      <i className="fas fa-play-circle"></i>
                      <span>Start New Batch</span>
                    </Link>
                    <Link to="/stockmanagement" className="quick-action-btn">
                      <i className="fas fa-box"></i>
                      <span>Add Stock Item</span>
                    </Link>
                    <Link to="/adminpage" className="quick-action-btn">
                      <i className="fas fa-cube"></i>
                      <span>Create Product</span>
                    </Link>
                    <Link to="/Admin" className="quick-action-btn">
                      <i className="fas fa-user-plus"></i>
                      <span>Add Employee</span>
                    </Link>
                    <Link to="/Production" className="quick-action-btn">
                      <i className="fas fa-cog"></i>
                      <span>Production</span>
                    </Link>
                    <Link to="/reports" className="quick-action-btn">
                      <i className="fas fa-chart-bar"></i>
                      <span>Generate Report</span>
                    </Link>
                  </div>
                </div>
              </div>
              
              
              {/* Notifications */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Notifications</h3>
                  <Link to="/notifications">View All</Link>
                </div>
                <div className="card-body">
                  {notifications.length > 0 ? (
                    <div className="notifications-list">
                      {notifications.slice(0, 5).map((notification, index) => (
                        <div key={index} className={`notification-item ${notification.priority}`}>
                          <div className="notification-icon">
                            <i className={`fas ${
                              notification.type === 'alert' ? 'fa-exclamation-circle' : 
                              notification.type === 'info' ? 'fa-info-circle' : 
                              'fa-check-circle'
                            }`}></i>
                          </div>
                          <div className="notification-content">
                            <h4>{notification.title}</h4>
                            <p>{notification.message}</p>
                            <span className="notification-time">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                          <button className="notification-dismiss">
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No notifications</p>
                  )}
                </div>
              </div>
             
              
              {/* Recent Products */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Recent Products</h3>
                  <Link to="/adminpage">View All</Link>
                </div>
                <div className="card-body">
                  {recentProducts.length > 0 ? (
                    <div className="product-list">
                      {recentProducts.map((product, index) => (
                        <div key={index} className="product-item">
                          <div className="product-info">
                            <h4>{product.name}</h4>
                            <p>{product.description}</p>
                          </div>
                          <div className="product-meta">
                            <span className="product-price">${product.price}</span>
                            <span className={`product-status ${product.available ? 'available' : 'unavailable'}`}>
                              {product.available ? 'Available' : 'Unavailable'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No products found</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Middle Column */}
            <div className="content-col">
              {/* Efficiency Metrics */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Production Efficiency</h3>
                  <div className="efficiency-header">
                    <span className="efficiency-badge">{efficiency}%</span>
                    {efficiencyTrend.length > 1 && (
                      <span className={`efficiency-trend ${
                        efficiencyTrend[efficiencyTrend.length - 1] > efficiencyTrend[efficiencyTrend.length - 2] 
                          ? 'up' : 'down'
                      }`}>
                        <i className={`fas fa-arrow-${
                          efficiencyTrend[efficiencyTrend.length - 1] > efficiencyTrend[efficiencyTrend.length - 2] 
                            ? 'up' : 'down'
                        }`}></i>
                        {Math.abs(efficiencyTrend[efficiencyTrend.length - 1] - efficiencyTrend[efficiencyTrend.length - 2])}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  <div className="efficiency-meter">
                    <div className="meter-bar">
                      <div 
                        className="meter-fill" 
                        style={{width: `${efficiency}%`}}
                        data-efficiency={efficiency}
                      ></div>
                    </div>
                    <div className="meter-labels">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* Weekly trend chart with date labels */}

{efficiencyTrend.length > 0 && (
  <div className="efficiency-trend-chart">
    <h4>Weekly Performance</h4>
    <div className="trend-bars">
      {efficiencyTrend.map((value, index) => {
        const now = new Date();
        const weekOffset = (3 - index) * 7;
        const weekDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekOffset);
        
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const weekLabel = `${weekDate.getDate()} ${monthNames[weekDate.getMonth()]}`;
        
        return (
          <div key={index} className="trend-bar">
            <div 
              className="trend-fill" 
              style={{height: `${value}%`}}
              title={`Week of ${weekDate.toDateString()}: ${value}% efficiency`}
            ></div>
            <span>{weekLabel}</span>
          </div>
        );
      })}
          </div>
          <div className="trend-direction">
            <span>Recent →</span>
          </div>
        </div>
      )}
                </div>
              </div>
              
              {/* Line Utilization */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Line Utilization</h3>
                  <Link to="/Production">Details</Link>
                </div>
                <div className="card-body">
                  {lineChartData ? (
                    <div className="chart-container">
                      <Doughnut data={lineChartData} options={lineChartOptions} />
                    </div>
                  ) : (
                    <p className="no-data">No utilization data available</p>
                  )}
                  
                  <div className="top-lines-list">
                    <h4>Top Performing Lines</h4>
                    {topLines.map((line, index) => (
                      <div key={index} className="top-line-item">
                        <span className="line-rank">#{index + 1}</span>
                        <span className="line-name">{line.name}</span>
                        <span className="line-count">{line.count} batches</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Low Stock Alert */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Low Stock Alert</h3>
                  <Link to="/stockmanagement">Manage Stock</Link>
                </div>
                <div className="card-body">
                  {lowStockItems.length > 0 ? (
                    <div className="low-stock-list">
                      {lowStockItems.slice(0, showAllLowStock ? undefined : 3).map((item, index) => (
                        <div key={index} className="low-stock-item">
                          <div className="material-info">
                            <h4>{item.materialName}</h4>
                            <p>Only {item.quantity} units remaining</p>
                          </div>
                          <div className="material-actions">
                            <button className="btn-small primary">Reorder</button>
                          </div>
                        </div>
                      ))}
                      {lowStockItems.length > 3 && (
                        <button 
                          className="show-more-btn"
                          onClick={() => setShowAllLowStock(!showAllLowStock)}
                        >
                          {showAllLowStock ? 'Show Less' : `Show All (${lowStockItems.length})`}
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="no-data">No low stock items</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="content-col">
              {/* Production Stats */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Production Statistics</h3>
                  <Link to="/Fabrication">View All</Link>
                </div>
                <div className="card-body">
                  <div className="production-stats">
                    <div className="production-stat">
                      <div className="stat-value">{productionStats.todayBatches}</div>
                      <div className="stat-label">Today</div>
                    </div>
                    <div className="production-stat">
                      <div className="stat-value">{productionStats.weeklyBatches}</div>
                      <div className="stat-label">This Week</div>
                    </div>
                    <div className="production-stat">
                      <div className="stat-value">{productionStats.monthlyBatches}</div>
                      <div className="stat-label">This Month</div>
                    </div>
                  </div>
                  
                  {dailyProductionData && (
                    <div className="chart-container">
                      <Line data={dailyProductionData} options={dailyProductionOptions} />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recent Activities */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Recent Activities</h3>
                  <Link to="/activities">View All</Link>
                </div>
                <div className="card-body">
                  {recentActivities.length > 0 ? (
                    <div className="activities-list">
                      {recentActivities.map((activity, index) => (
                        <div key={index} className="activity-item">
                          <div className="activity-avatar">
                            {activity.userId ? (
                              <span>{activity.userId.substring(0, 2).toUpperCase()}</span>
                            ) : (
                              <i className="fas fa-user"></i>
                            )}
                          </div>
                          <div className="activity-content">
                            <p>
                              <span className="activity-user">{activity.user || 'System'}</span> 
                              {' '}{formatActivityAction(activity)}
                            </p>
                            <span className="activity-time">
                              {formatTime(activity.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No recent activities</p>
                  )}
                </div>
              </div>
              
              {/* Reclamation Status */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Recent Reclamations</h3>
                  <Link to="/reclamations">View All</Link>
                </div>
                <div className="card-body">
                  {loading ? (
                    <p className="no-data">Loading reclamations...</p>
                  ) : reclamations.length > 0 ? (
                    <div className="reclamations-list">
                      {reclamations.map((reclamation, index) => (
                        <div key={index} className={`reclamation-item ${getPriorityClass(reclamation.priority)}`}>
                          <div className="reclamation-icon">
                            <i className={`fas ${getPriorityIcon(reclamation.priority)}`}></i>
                          </div>
                          <div className="reclamation-content">
                              <h3>{reclamation.title}</h3>
                              <p>{reclamation.description}</p>
                              <p className="reclamation-sender">
                                Sent by: <strong>{reclamation.submittedBy}</strong> ({reclamation.userRole})
                              </p>
                              <span className="reclamation-time">
                                {formatTime(reclamation.createdAt)}
                              </span>
                            </div>

                          <span className="priority-badge">
                            {getPriorityText(reclamation.priority)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">No reclamations found</p>
                  )}
                </div>
              </div>
              
              {/* Line Status */}
              <div className="dashboard-card">
                <div className="card-header">
                  <h3>Production Line Status</h3>
                  <Link to="/Production">Manage Lines</Link>
                </div>
                <div className="card-body">
                  {lineStatus.length > 0 ? (
                    <div className="line-status-list">
                      {lineStatus.map((line, index) => (
                        <div key={index} className="line-status-item">
                          <div className="line-info">
                            <span className="line-name">{line.name}</span>
                            <span className={`status-badge ${getStatusColor(line.status)}`}>
                              {getStatusText(line.status)}
                            </span>
                          </div>
                          <div className="line-queue">
                            {line.queue} in queue
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">All production lines are currently idle</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </div>
  );
};

export default Home;