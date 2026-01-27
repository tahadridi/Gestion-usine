import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import '../assets/css/stockmanagement.css';
import Navbar from './navbar';
import "@fortawesome/fontawesome-free/css/all.min.css";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_URL = "http://localhost:5100/api/stock";

const StockDashboard = () => {
  const [materials, setMaterials] = useState([]);
  const [filteredMaterials, setFilteredMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    materialName: '',
    available: false,
    quantity: 0
  });
  const [showAll, setShowAll] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartType, setChartType] = useState('bar');
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // Fetch critical notifications
useEffect(() => {
  const fetchCriticalAlerts = async () => {
    try {
      const res = await axios.get('http://localhost:5100/api/notifications?type=critical_stock');
      if (res.data && Array.isArray(res.data)) {
        setCriticalAlerts(res.data.filter(alert => !alert.read));
      }
    } catch (err) {
      console.error('Failed to fetch critical alerts:', err);
    }
  };

  fetchCriticalAlerts();
  const intervalId = setInterval(fetchCriticalAlerts, 30000);
  return () => clearInterval(intervalId);
}, []);



  // Fetch notifications
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5100/api/notifications');
      if (res.data && Array.isArray(res.data)) {
        // Sort by newest first
        const sorted = res.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setNotifications(sorted);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  fetchNotifications();
  const intervalId = setInterval(fetchNotifications, 30000);
  return () => clearInterval(intervalId);
}, []);



  // Fetch materials from your MongoDB database
  const fetchMaterials = async () => {
    try {
      const res = await fetch('http://localhost:5100/api/stock'); 
      const data = await res.json();
      setMaterials(data); 
      setFilteredMaterials(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stock:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    filterAndSortMaterials();
    // whenever filters/search/sort change, reset to page 1
    setCurrentPage(1);
  }, [searchTerm, availabilityFilter, sortBy, materials]);

  const filterAndSortMaterials = () => {
    let result = [...materials];
    
    // Apply search filter
    if (searchTerm) {
      result = result.filter(material => 
        material.materialName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply availability filter
    if (availabilityFilter !== 'all') {
      const availableFilter = availabilityFilter === 'available';
      result = result.filter(material => material.available === availableFilter);
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        return a.materialName.localeCompare(b.materialName);
      } else if (sortBy === 'quantity') {
        return b.quantity - a.quantity;
      } else if (sortBy === 'updated') {
        return new Date(b.lastUpdated) - new Date(a.lastUpdated);
      }
      return 0;
    });
    
    setFilteredMaterials(result);
  };

  const handleEdit = (material) => {
    setEditingMaterial({ ...material });
  };

  // Save Edited Material
  const handleSave = async () => {
    if (editingMaterial) {
      try {
        await axios.put(`${API_URL}/${editingMaterial._id}`, {
          quantity: editingMaterial.quantity,
          available: editingMaterial.available,
          lastUpdated: new Date()
        });
        const updatedMaterials = materials.map(material =>
          material._id === editingMaterial._id ? editingMaterial : material
        );
        setMaterials(updatedMaterials);
        setEditingMaterial(null);
        alert('Material updated successfully!');
      } catch (error) {
        console.error('Error updating material:', error);
        alert('Failed to update material.');
      }
    }
  };
// Handle Seen (delete notification permanently)
const handleSeen = async (id) => {
  try {
    await axios.delete(`http://localhost:5100/api/notifications/${id}`);
    setNotifications(prev => prev.filter(n => n._id !== id));
  } catch (error) {
    console.error("Error deleting notification:", error);
  }
};



  // Add New Material
  const handleAdd = async () => {
    try {
      const res = await axios.post(API_URL, {
        materialName: newMaterial.materialName,
        quantity: newMaterial.quantity,
        available: newMaterial.available,
        lastUpdated: new Date()
      });
      setMaterials([...materials, res.data]);
      setShowAddModal(false);
      setNewMaterial({
        materialName: '',
        available: false,
        quantity: 0
      });
      alert('Material added successfully!');
    } catch (error) {
      console.error('Error adding material:', error);
      alert('Failed to add material.');
    }
  };

  // Delete material
  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this material?');
    if (!ok) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      setMaterials(materials.filter(m => m._id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Delete failed. Make sure your API supports DELETE /api/stock/:id');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (editingMaterial) {
      setEditingMaterial({
        ...editingMaterial,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };

  const handleNewMaterialChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewMaterial({
      ...newMaterial,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5100/api/notifications/${id}/read`);
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? {...notif, read: true} : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const calculateStats = () => {
    const total = materials.length;
    const available = materials.filter(m => m.available).length;
    const unavailable = total - available;
    const lowStock = materials.filter(m => m.quantity < 10).length;
    
    return { total, available, unavailable, lowStock };
  };

  // Prepare data for the chart
  const prepareChartData = () => {
    // For the chart, we'll use the filtered materials but limit to top 10 for better visualization
    const chartMaterials = [...filteredMaterials]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    return {
      labels: chartMaterials.map(material => material.materialName),
      datasets: [
        {
          label: 'Stock Quantity',
          data: chartMaterials.map(material => material.quantity),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 205, 86, 0.7)',
            'rgba(201, 203, 207, 0.7)',
            'rgba(0, 128, 128, 0.7)',
            'rgba(128, 0, 128, 0.7)',
            'rgba(128, 128, 0, 0.7)',
          ],
          borderColor: [
            'rgb(54, 162, 235)',
            'rgb(75, 192, 192)',
            'rgb(153, 102, 255)',
            'rgb(255, 159, 64)',
            'rgb(255, 99, 132)',
            'rgb(255, 205, 86)',
            'rgb(201, 203, 207)',
            'rgb(0, 128, 128)',
            'rgb(128, 0, 128)',
            'rgb(128, 128, 0)',
          ],
          borderWidth: 1,
        },
      ],
    };
  };

  // Bar chart options with legend
  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: true,
        labels: {
          font: {
            size: 12,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          color: '#2c3e50'
        }
      },
      title: {
        display: true,
        text: 'Material Stock Levels',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#2c3e50'
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: {
            size: 11
          }
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Doughnut chart options with legend
  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        display: true,
        labels: {
          font: {
            size: 12,
            family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
          },
          color: '#2c3e50',
          padding: 15
        }
      },
      title: {
        display: true,
        text: 'Material Stock Distribution',
        font: {
          size: 16,
          weight: 'bold'
        },
        color: '#2c3e50'
      },
    }
  };

  const stats = calculateStats();

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageMaterials = filteredMaterials.slice(pageStart, pageStart + pageSize);
  const rowsToShow = showAll ? filteredMaterials : pageMaterials;

  if (loading) {
    return <div className="loading">Loading materials...</div>;
  }

  return (
    <div>
      <Navbar />
      <div className="stock-dashboard">
        <div className="container mt-4">
          {/* Header row with title + quick actions */}
          <div className="row mb-4 align-items-center">
            <div className="col-md-8">
              <h2 className="page-title"><i className="fas fa-boxes me-2"></i>Material Stock Management</h2>
              <p className="text-muted mb-0"> View and update material stock levels</p>
            </div>
            <div className="col-md-4 d-flex justify-content-end align-items-center gap-2">
              {/* Notification Bell */}
              <div className="notification-container position-relative">
                <button 
                  className="btn-notification"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <i className="fas fa-bell"></i>
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="notification-badge">
                      {notifications.filter(n => !n.read).length}
                    </span>
                  )}
                </button>
                
                  {/* Notification Dropdown */}
                  {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-header">
                  <h6>Notifications</h6>
                  {notifications.length > 0 && (
                    <button 
                      className="btn-clear-all"
                      onClick={clearAllNotifications}
                    >
                      Clear All
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notifications.length === 0 ? (
                    <div className="notification-item">No notifications</div>
                  ) : (
                    notifications.map((notif, index) => (
                      <div 
                        key={notif._id} 
                        className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                      >
                        {/* Regular notifications (old format) */}
                        {notif.type !== 'material_unavailable' && (
                          <>
                            <div className="notification-message" style={{ color: '#d9534f', fontSize: "1rem", fontWeight: "bold" }}>
                              {notif.message}
                            </div>
                            <div className="notification-time">
                              {new Date(notif.timestamp).toLocaleString()}
                            </div>
                          </>
                        )}
                        
                        {/* New format for material unavailable notifications */}
                        {notif.type === 'material_unavailable' && (
                          <>
                            <div className="notification-message" style={{ color: '#141f64ff', fontSize: "1rem", fontWeight: "bold" }}>
                              {notif.message}
                            </div>
                            
                            {notif.missingMaterials && notif.missingMaterials.length > 0 && (
                              <div className="notification-details">
                                <div style={{ marginTop: '8px', fontWeight: 'bold' }}>Missing Materials:</div>
                                {notif.missingMaterials.map((mat, idx) => (
                                  <div key={idx} style={{ marginLeft: '10px', fontSize: '0.9rem' }}>
                                    • {mat.material}: Need {mat.required}, Have {mat.currentStock}
                                  </div>
                                ))}
                              </div>
                            )}
                            {notif.type === 'reclamation' && (
                                <>
                                  <div className="notification-message" style={{ color: '#141f64ff', fontSize: "1rem", fontWeight: "bold" }}>
                                    Reclamation: {notif.reclamation?.title}
                                  </div>
                                  <div className="notification-user" style={{ fontSize: "0.9rem", color: "#666", marginTop: "4px" }}>
                                    Submitted by: {notif.userEmail || notif.submittedBy}
                                  </div>
                                  <div className="notification-time">
                                    {new Date(notif.timestamp).toLocaleString()}
                                  </div>
                                </>
                              )}
                            <div className="notification-time">
                              {new Date(notif.timestamp).toLocaleString()}
                            </div>
                          </>
                        )}

                        {/* ✅ New Seen button */}
                        <div className="d-flex justify-content-end mt-2">
                          <button
                            className="btn-clear-all"
                            onClick={() => handleSeen(notif._id)}
                          >
                            <i className="fas fa-eye me-1"></i> Seen
                          </button>
                        </div>

                        {/* ✅ Add separator line except for last item */}
                        {index < notifications.length - 1 && (
                          <hr className="notification-separator" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
              </div>

              <button 
                className="btn-chart-toggle"
                onClick={() => setShowChart(!showChart)}
              >
                <i className={`fas ${showChart ? 'fa-table' : 'fa-chart-bar'}`}></i>
                {showChart ? ' Show Table' : ' Show Chart'}
              </button>

              <button 
                className="btn-add-modern"
                onClick={() => setShowAddModal(true)}
              >
                <i className="fas fa-plus-circle"></i> Add New Material
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="card stats-card">
                <div className="stats-icon text-primary">
                  <i className="fas fa-box"></i>
                </div>
                <div className="stats-number">{stats.total}</div>
                <div className="stats-label">Total Materials</div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card stats-card">
                <div className="stats-icon text-success">
                  <i className="fas fa-check-circle"></i>
                </div>
                <div className="stats-number">{stats.available}</div>
                <div className="stats-label">Available</div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card stats-card">
                <div className="stats-icon text-danger">
                  <i className="fas fa-times-circle"></i>
                </div>
                <div className="stats-number">{stats.unavailable}</div>
                <div className="stats-label">Unavailable</div>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="card stats-card">
                <div className="stats-icon text-warning">
                  <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="stats-number">{stats.lowStock}</div>
                <div className="stats-label">Low Stock</div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="card mb-4 filters-sticky">
            <div className="card-body">
              <div className="row g-2 align-items-center">
               <div className="col-md-6">
                  <div className="search-box">
                    <i className="fas fa-search search-icon"></i>
                    <input 
                      type="text" 
                      className="form-control search-input" 
                      placeholder="Search materials..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                  <div className="col-md-3">
                    <div className="select-box" style={{ position: 'relative' }}>
                      <i 
                        className={`select-icon fas ${
                          availabilityFilter === "available" ? "fa-check-circle text-success" :
                          availabilityFilter === "unavailable" ? "fa-times-circle text-danger" :
                          "fa-layer-group text-primary"
                        }`}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          transition: 'all 0.3s ease',
                          fontSize: '16px',
                          pointerEvents: 'none'
                        }}
                      ></i>
                      <select 
                        className="form-select custom-select ps-5"
                        value={availabilityFilter}
                        onChange={(e) => setAvailabilityFilter(e.target.value)}
                      >
                        <option value="all">All Availability</option>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                  </div>

                  <div className="col-md-3">
                    <div className="select-box">
                      <i className="fas fa-sort-amount-down select-icon"></i>
                      <select 
                        className="form-select custom-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="name">Sort by Name</option>
                        <option value="quantity">Sort by Quantity</option>
                        <option value="updated">Sort by Last Updated</option>
                      </select>
                    </div>
                  </div>
              </div>
            </div>
          </div>

          {/* Chart Visualization */}
          {showChart && (
            <div className="card mb-4">
                <div className="card-body">
                  <div className="row mb-3">
                    <div className="col-md-12 d-flex justify-content-between align-items-center">
                      
                      <div className="btn-group" role="group">
                        <button
                          type="button"
                          className={`btn-add-modern ${chartType === 'bar' ? 'active' : ''}`}
                          onClick={() => setChartType('bar')}
                          style={{fontSize: '12px', padding: '5px 12px', margin: '0 4px'}}
                        >
                          <i className="fas fa-chart-bar me-1"></i> Bar Chart
                        </button>
                        <button
                          type="button"
                          className={`btn-add-modern ${chartType === 'doughnut' ? 'active' : ''}`}
                          onClick={() => setChartType('doughnut')}
                          style={{fontSize: '12px', padding: '5px 12px', margin: '0 4px'}}
                        >
                          <i className="fas fa-chart-pie me-1"></i> Doughnut Chart
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="chart-container" style={{ minHeight: '400px', position: 'relative' }}>
                        {chartType === 'bar' ? (
                          <Bar 
                            data={prepareChartData()} 
                            options={barChartOptions}
                            style={{ width: '100%', height: '100%' }}
                          />
                        ) : (
                          <div className="doughnut-container" style={{ 
                            height: '400px', 
                            display: 'flex', 
                            justifyContent: 'center', 
                            alignItems: 'center' 
                          }}>
                            <Doughnut 
                              data={prepareChartData()} 
                              options={doughnutChartOptions}
                              style={{ maxWidth: '100%', maxHeight: '100%' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>          
          )}

          {/* Materials List - simplified table */}
          {!showChart && (
            <div className="card">
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>Material Name</th>
                        <th>Stock Quantity</th>
                        <th>Status</th>
                        <th>Last Updated</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rowsToShow.map((material) => (
                        <tr key={material._id} className="material-card">
                          <td className="fw-500">{material.materialName}</td>
                          <td
                            className={
                              material.quantity < 100
                                ? 'status-unavailable'
                                : material.quantity < 500
                                ? 'stock-low'
                                : 'status-available'
                            }
                          >
                            {material.quantity}
                          </td>
                          <td>
                            <span className={`pill ${material.available ? 'pill--success' : 'pill--danger'}`}>
                              <i className={`fas ${material.available ? 'fa-check-circle' : 'fa-times-circle'} me-1`}></i>
                              {material.available ? 'Available' : 'Unavailable'}
                            </span>
                          </td>
                          <td>{new Date(material.lastUpdated).toLocaleString()}</td>
                          <td className="text-end">
                            <button
                              className="icon-btn"
                              title="Edit"
                              onClick={() => handleEdit(material)}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button
                              className="icon-btn danger ms-1"
                              title="Delete"
                              onClick={() => handleDelete(material._id)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {/* Show More toggle (kept) */}
                  {filteredMaterials.length > pageSize && (
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <div>
                        {!showAll && (
                          <nav className="pagination-nav">
                            <button
                              className="page-btn"
                              disabled={currentPage === 1}
                              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            >
                              <i className="fas fa-chevron-left"></i>
                            </button>

                            {[...Array(totalPages)].map((_, idx) => {
                              const page = idx + 1;
                              return (
                                <button
                                  key={page}
                                  className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                  onClick={() => setCurrentPage(page)}
                                >
                                  {page}
                                </button>
                              );
                            })}

                            <button
                              className="page-btn"
                              disabled={currentPage === totalPages}
                              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            >
                              <i className="fas fa-chevron-right"></i>
                            </button>
                          </nav>
                        )}
                      </div>

                      <div className="text-end">
                        <button
                          className="btn-show-more"
                          onClick={() => setShowAll(!showAll)}
                          onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#18207A';
                            e.currentTarget.style.color = 'white';
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = '#18207A';
                          }}
                        >
                          {showAll ? 'Show Less' : 'Show More'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {filteredMaterials.length === 0 && (
                  <div className="text-center p-4">
                    No materials found matching your criteria.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Edit Material Modal */}
        {editingMaterial && (
          <>
            <div className="modal-backdrop show" style={{ backgroundColor: 'black', opacity: 0.3 }}></div>
            <div className="modal show" tabIndex="-1" style={{ display: 'block' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Edit Material Stock</h5>
                    <button type="button" className="btn-close" onClick={() => setEditingMaterial(null)}></button>
                  </div>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label className="form-label">Material Name</label>
                        <input type="text" className="form-control" value={editingMaterial.materialName} readOnly />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Stock Quantity</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="quantity"
                          value={editingMaterial.quantity} 
                          onChange={handleInputChange}
                          min="0" 
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="available"
                            checked={editingMaterial.available} 
                            onChange={handleInputChange}
                          />
                          <label className="form-check-label">Available</label>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setEditingMaterial(null)}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={handleSave}>Save Changes</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Add Material Modal */}
        {showAddModal && (
          <>
            <div className="modal-backdrop show" style={{ backgroundColor: 'black', opacity: 0.3 }}></div>
            <div className="modal show" tabIndex="-1" style={{ display: 'block' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Add New Material to Stock</h5>
                    <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <form>
                      <div className="mb-3">
                        <label className="form-label">Material Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          name="materialName"
                          value={newMaterial.materialName} 
                          onChange={handleNewMaterialChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Initial Stock Quantity</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          name="quantity"
                          value={newMaterial.quantity} 
                          onChange={handleNewMaterialChange}
                          min="0" 
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <div className="form-check form-switch">
                          <input 
                            className="form-check-input" 
                            type="checkbox" 
                            name="available"
                            checked={newMaterial.available} 
                            onChange={handleNewMaterialChange}
                          />
                          <label className="form-check-label">Available</label>
                        </div>
                      </div>
                    </form>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                    <button type="button" className="btn btn-primary" onClick={handleAdd}>Add Material</button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default StockDashboard;