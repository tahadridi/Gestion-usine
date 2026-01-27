// Dashboard.jsx
import React from 'react';
import { FiBox, FiActivity, FiBarChart2, FiTrendingUp } from 'react-icons/fi';


function Dashboard() {
  const stats = [
    { title: 'Batches en production', value: 12, icon: <FiBox size={24} /> },
    { title: 'Progression moyenne', value: '72%', icon: <FiActivity size={24} /> },
    { title: 'Produits fabriqués', value: 250, icon: <FiBarChart2 size={24} /> },
    { title: 'Amélioration', value: '15%', icon: <FiTrendingUp size={24} /> },
  ];

  return (
    <div className="dashboard-page" style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F9FF' }}>
      {/* Sidebar */}
      <aside style={{ width: '220px', backgroundColor: '#18207A', color: 'white', padding: '2rem 1rem' }}>
        <h2 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 700 }}>ProdControl</h2>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li className="sidebar-item active" style={{ marginBottom: '1.5rem', cursor: 'pointer' }}>Dashboard</li>
            <li className="sidebar-item" style={{ marginBottom: '1.5rem', cursor: 'pointer' }}>Production</li>
            <li className="sidebar-item" style={{ marginBottom: '1.5rem', cursor: 'pointer' }}>Analytics</li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem' }}>
        

        <h1 style={{ color: '#18207A', marginBottom: '2rem' }}>Dashboard</h1>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          {stats.map((stat, idx) => (
            <div key={idx} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                backgroundColor: '#E8EEFF',
                borderRadius: '50%',
                width: '50px',
                height: '50px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#18207A'
              }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#6c757d' }}>{stat.title}</p>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#18207A' }}>{stat.value}</h2>
              </div>
            </div>
          ))}
        </div>

        {/* Placeholder for charts */}
        <div style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', height: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#18207A', marginBottom: '1rem' }}>Production par ligne</h3>
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}>
              Chart placeholder
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', height: '300px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
            <h3 style={{ color: '#18207A', marginBottom: '1rem' }}>Performance des batches</h3>
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6c757d' }}>
              Chart placeholder
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
