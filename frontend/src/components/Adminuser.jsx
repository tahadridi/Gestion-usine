import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from './navbar';
import '../assets/css/admin.css';
import { FaUser,FaSearch, FaTrash, FaKey, FaFilter, FaPlus, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5100';

const UserManagementAdmin = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    department: 'all',
    role: 'all',
    hasSystemAccount: 'all',
    search: ''
  });
  const [newUser, setNewUser] = useState({
    cin: '',
    fullName: '',
    address: '',
    role: 'operator',
    department: 'production',
    shift: 'morning',
    phone: '',
    email: '',
    hasSystemAccount: false,
    password: ''
  });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const navigate = useNavigate(); 
const [accessingId, setAccessingId] = useState(null);
const [accessPassword, setAccessPassword] = useState('');
const [accessEmail, setAccessEmail] = useState("");
const [emailEditable, setEmailEditable] = useState(false);
  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { applyFilters(); }, [filters, users]);

 
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await axios.get(`${API_BASE_URL}/api/employees`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Failed to fetch users');
    } finally { setLoading(false); }
  };
  const handleDeleteSystemAccount = async (cin) => {
  if (!window.confirm('Are you sure you want to delete this system account?')) return;
  try {
    const token = localStorage.getItem('authToken');
    await axios.delete(`${API_BASE_URL}/api/employees/system-account/${cin}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('System account deleted successfully');
    fetchUsers();
  } catch (error) {
    console.error('Error deleting system account:', error);
    alert('Failed to delete system account');
  }
};

   const applyFilters = () => {
    let result = [...users];
    if (filters.department !== 'all') result = result.filter(user => user.department === filters.department);
    if (filters.role !== 'all') result = result.filter(user => user.role === filters.role);
    if (filters.hasSystemAccount !== 'all') {
      const hasAccount = filters.hasSystemAccount === 'true';
      result = result.filter(user => user.hasSystemAccount === hasAccount);
    }
    if (filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase();
      result = result.filter(user =>
        user.cin.includes(searchTerm) ||
        user.fullName.toLowerCase().includes(searchTerm)
      );
    }
    setFilteredUsers(result);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearchChange = (e) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewUser(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

const handleCreateUser = async (e) => {
  e.preventDefault();
  
  // Validate form before submission
  if (!validateForm()) return;
  
  try {
    const token = localStorage.getItem('authToken');
    await axios.post(`${API_BASE_URL}/api/employees`, newUser, {
      headers: { Authorization: `Bearer ${token}` }
    });
    alert('User created successfully');
    setNewUser({
      cin: '',
      fullName: '',
      email: '',
      role: 'operator',
      department: 'production',
      shift: 'morning',
      phone: '',
      address: '',
      hasSystemAccount: false,
      password: ''
    });
    fetchUsers();
  } catch (error) {
    console.error('Error creating user:', error);
    alert(error.response?.data?.error || 'Failed to create user');
  }
};
const handleStartAccess = async (cin, userId) => {
  try {
    const token = localStorage.getItem("authToken");
    const res = await axios.get(
      `${API_BASE_URL}/api/employees/get-email/${cin}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.data.email) {
      // User has no email -> allow editing
      setAccessEmail("");
      setEmailEditable(true);
    } else {
      // User already has email -> lock it
      setAccessEmail(res.data.email);
      setEmailEditable(false);
    }

    setAccessingId(userId);
  } catch (err) {
    console.error("Error fetching email:", err);
    alert("Could not fetch email for this user");
  }
};

 const handleCreateSystemAccount = async (cin, email, password) => {
  try {
    const token = localStorage.getItem('authToken');
    await axios.post(
      `${API_BASE_URL}/api/employees/system-account`,
      { cin, email, password },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    alert('System account created successfully');
    setAccessingId(null);
    setAccessPassword('');
    fetchUsers();
  } catch (error) {
    console.error('Error creating system account:', error);
    alert(error.response?.data?.error || 'Failed to create system account');
  }
};

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('authToken');
      await axios.delete(`${API_BASE_URL}/api/employees/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const startEditing = (user) => {
    setEditingId(user._id);
    setEditForm({
      role: user.role,
      department: user.department,
      shift: user.shift
    });
  };
  const validateForm = () => {
  // Validate CIN (8 digits)
  if (!/^\d{8}$/.test(newUser.cin)) {
    alert("CIN must be exactly 8 digits");
    return false;
  }
  
  // Validate required fields
  if (!newUser.fullName.trim()) {
    alert("Full name is required");
    return false;
  }
  
  // Validate email if system account is requested
  if (newUser.hasSystemAccount) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      alert("Please enter a valid email address");
      return false;
    }
    
    if (newUser.password.length < 6) {
      alert("Password must be at least 6 characters");
      return false;
    }
  }
  
  return true;
};

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEditing = async (id) => {
    try {
      const token = localStorage.getItem('authToken');
      await axios.put(`${API_BASE_URL}/api/employees/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('User updated successfully');
      setEditingId(null);
      setEditForm({});
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Failed to update user');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="admin-panel">
      <Navbar />
      <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
        <FaUser /> Autoliv Workers Management 
      </h1>
      {/* Add New User Form */}
      <div className="add-user-section card">
        <h2><FaPlus style={{ marginRight: '8px' }} /> Add New Employee</h2>
        <form onSubmit={handleCreateUser}>
          <div className="form-row">
            <input 
              type="text" 
              name="cin" 
              placeholder="Employee CIN " 
              value={newUser.cin} 
              onChange={(e) => {
                // Only allow numbers and limit to 8 digits
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                setNewUser(prev => ({ ...prev, cin: value }));
              }}
              pattern="[0-9]{8}"
              required 
            />
            <input type="text" name="fullName" placeholder="Full Name" value={newUser.fullName} onChange={handleInputChange} required />
          </div>

          <div className="form-row">
            <input type="text" name="address" placeholder="Address" value={newUser.address} onChange={handleInputChange} />
           <input 
              type="text" 
              name="phone" 
              placeholder="Phone" 
              value={newUser.phone} 
              onChange={(e) => {
                // Only allow numbers
                const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                setNewUser(prev => ({ ...prev, phone: value }));
              }}
            />
          </div>

          <div className="form-row">
            <div className="select-box">
              <span className="select-icon">🏢</span>
              <select name="department" value={newUser.department} onChange={handleInputChange} className="custom-select">
                <option value="production">Production</option>
                <option value="quality">Quality</option>
                <option value="maintenance">Maintenance</option>
                <option value="shipping">Shipping</option>
                <option value="office">Office</option>
              </select>
            </div>

            <div className="select-box">
              <span className="select-icon">👤</span>
              <select name="role" value={newUser.role} onChange={handleInputChange} className="custom-select">
                <option value="operator">Operator</option>
                <option value="technician">Technician</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="select-box">
              <span className="select-icon">⏰</span>
              <select name="shift" value={newUser.shift} onChange={handleInputChange} className="custom-select">
                <option value="morning">Morning Shift</option>
                <option value="afternoon">Afternoon Shift</option>
                <option value="night">Night Shift</option>
                <option value="flex">Flexible</option>
              </select>
            </div>

            <label className="checkbox-label">
              <input type="checkbox" name="hasSystemAccount" checked={newUser.hasSystemAccount} onChange={handleInputChange} />
              Create System Account
            </label>
          </div>

          {newUser.hasSystemAccount && (
            <>
              <div className="form-row">
                <div className="search-box" style={{ position: 'relative' }}>
                  <i className="fas fa-envelope" style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#18207A'
                  }}></i>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    required
                    className="search-input full-width"
                    style={{ paddingLeft: '35px' }} // make space for icon
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="search-box" style={{ position: 'relative' }}>
                  <i className="fas fa-lock" style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#18207A'
                  }}></i>
                  <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                    className="search-input full-width"
                    style={{ paddingLeft: '35px' }} // space for icon
                  />
                </div>
              </div>
            </>
          )}


          <button type="submit" className="btn-add-modern">
            <FaPlus style={{ marginRight: '6px' }} /> Add Employee
          </button>
        </form>
      </div>

      {/* Filters + Search Section ABOVE the table */}
      <div className="filters-section card">
        <h2><FaFilter style={{ marginRight: '8px' }} /> Filters</h2>
        <div className="filter-controls">
          <div className="filter-group">
            <label>Department: </label>
            <div className="select-box">
              <span className="select-icon">🏭</span>
              <select name="department" value={filters.department} onChange={handleFilterChange} className="custom-select">
                <option value="all">All Departments</option>
                <option value="production">Production</option>
                <option value="quality">Quality</option>
                <option value="maintenance">Maintenance</option>
                <option value="shipping">Shipping</option>
                <option value="office">Office</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label>Role: </label>
            <div className="select-box">
              <span className="select-icon">👔</span>
              <select name="role" value={filters.role} onChange={handleFilterChange} className="custom-select">
                <option value="all">All Roles</option>
                <option value="operator">Operator</option>
                <option value="technician">Technician</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="filter-group">
            <label>System Access: </label>
            <div className="select-box">
              <span className="select-icon">🔐</span>
              <select name="hasSystemAccount" value={filters.hasSystemAccount} onChange={handleFilterChange} className="custom-select">
                <option value="all">All Users</option>
                <option value="true">With System Access</option>
                <option value="false">Without System Access</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="filter-group" style={{ flex: 1 }}>
            <label>Search: </label>
            <div className="search-box" style={{ position: 'relative' }}>
              <FaSearch style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#18207A'
              }} />
              <input
                type="text"
                placeholder="Search by CIN or Name..."
                value={filters.search}
                onChange={handleSearchChange}
                className="search-input full-width"
                style={{ paddingLeft: '35px' }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-section card">
        <h2><FaUser style={{ marginRight: '8px' }} /> Employees ({filteredUsers.length})</h2>
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>CIN</th>
                <th>Name</th>
                <th>Role</th>
                <th>Department</th>
                <th>Shift</th>
                <th>System Access</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.cin}</td>
                  <td><FaUser style={{ marginRight: '6px', color: '#18207A' }} /> {user.fullName}</td>
                  <td>
                    {editingId === user._id ? (
                      <div className="select-box">
                        <span className="select-icon">👔</span>
                        <select name="role" value={editForm.role} onChange={handleEditInputChange} className="custom-select">
                          <option value="operator">Operator</option>
                          <option value="technician">Technician</option>
                          <option value="supervisor">Supervisor</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                    ) : (
                      user.role
                    )}
                  </td>
                  <td>
                    {editingId === user._id ? (
                      <div className="select-box">
                        <span className="select-icon">🏢</span>
                        <select name="department" value={editForm.department} onChange={handleEditInputChange} className="custom-select">
                          <option value="production">Production</option>
                          <option value="quality">Quality</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="shipping">Shipping</option>
                          <option value="office">Office</option>
                        </select>
                      </div>
                    ) : (
                      user.department
                    )}
                  </td>
                  <td>
                    {editingId === user._id ? (
                      <div className="select-box">
                        <span className="select-icon">⏰</span>
                        <select name="shift" value={editForm.shift} onChange={handleEditInputChange} className="custom-select">
                          <option value="morning">Morning Shift</option>
                          <option value="afternoon">Afternoon Shift</option>
                          <option value="night">Night Shift</option>
                          <option value="flex">Flexible</option>
                        </select>
                      </div>
                    ) : (
                      user.shift
                    )}
                  </td>
                  <td>
                    {user.hasSystemAccount ? (
                      <span className="pill pill--success">✔</span>
                    ) : (
                      <span className="pill pill--danger">✖</span>
                    )}
                  </td>
              <td style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {editingId === user._id ? (
                  <>
                    <button 
                      onClick={() => saveEditing(user._id)}
                      className="btn-success"
                    >
                      <FaSave style={{ marginRight: '6px' }} /> Save
                    </button>
                    <button 
                      onClick={cancelEditing}
                      className="btn-secondary"
                    >
                      <FaTimes style={{ marginRight: '6px' }} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => startEditing(user)}
                      className="btn-edit"
                    >
                      <FaEdit style={{ marginRight: '6px' }} /> Edit
                    </button>

                    {user.hasSystemAccount ? (
                      <button 
                        onClick={() => handleDeleteSystemAccount(user.cin)}
                        className="btn-warning"
                      >
                        <FaTrash style={{ marginRight: '6px' }} /> Delete Access
                      </button>
                    ) : (
                      accessingId === user._id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <input 
                            type="email" 
                            value={accessEmail}
                            onChange={(e) => setAccessEmail(e.target.value)}
                            readOnly={!emailEditable}
                            placeholder="Enter email"
                            className="search-input full-width"
                          />
                          <input 
                            type="password"
                            placeholder="Enter password"
                            value={accessPassword}
                            onChange={(e) => setAccessPassword(e.target.value)}
                            className="search-input full-width"
                          />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => handleCreateSystemAccount(user.cin, accessEmail, accessPassword)}
                              className="btn-success"
                            >
                              <FaSave style={{ marginRight: '6px' }} /> Confirm
                            </button>
                            <button
                              onClick={() => { 
                                setAccessingId(null); 
                                setAccessPassword(''); 
                                setAccessEmail('');
                              }}
                              className="btn-secondary"
                            >
                              <FaTimes style={{ marginRight: '6px' }} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleStartAccess(user.cin, user._id)}
                          className="btn-primary"
                        >
                          <FaKey style={{ marginRight: '6px' }} /> Add Access
                        </button>
                      )
                    )}

                    <button 
                      onClick={() => handleDeleteUser(user._id)}
                      className="btn-danger"
                    >
                      <FaTrash style={{ marginRight: '6px' }} /> Delete
                    </button>
                  </>
                )}
              </td>

                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="no-users">No users found matching your filters</div>
          )}
        </div>
      </div>

     {/* Footer */}
      <footer className="dashboard-footer">
        <div className="container">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} Steering Wheel Manufacturing System</p>
            <div className="footer-links">
              <span>v1.2.0</span>
              <span>•</span>
              <a href="#privacy">Privacy</a>
              <span>•</span>
              <a href="#terms">Terms</a>
              <span>•</span>
              <a href="#support">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserManagementAdmin;