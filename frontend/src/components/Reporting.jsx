// Reporting.jsx
import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import Navbar from "./navbar";
import { Bar, Line, Doughnut } from "react-chartjs-2";
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
import "./../assets/css/reporting.css";

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

const Reporting = () => {
  const [reportType, setReportType] = useState("production");
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState(null);
  const [summary, setSummary] = useState({});
  const reportRef = useRef();

  const reportTypes = [
    { value: "production", label: "Production Report", icon: "fa-industry" },
    { value: "inventory", label: "Inventory Report", icon: "fa-boxes" },
    { value: "efficiency", label: "Efficiency Report", icon: "fa-tachometer-alt" },
    { value: "quality", label: "Quality Report", icon: "fa-check-circle" },
    { value: "financial", label: "Financial Report", icon: "fa-chart-line" },
  ];

  // Fetch data from your actual backend APIs
  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all data from your actual APIs
      const [productsRes, materialsRes, batchesRes, linesRes, reclamationsRes, employeesRes, activitiesRes] = await Promise.all([
        axios.get('http://localhost:5100/api/products'),
        axios.get('http://localhost:5100/api/stock'),
        axios.get('http://localhost:5100/api/batches'),
        axios.get('http://localhost:5100/api/production-lines'),
        axios.get('http://localhost:5100/api/reclamations'),
        axios.get('http://localhost:5100/api/employees'),
        axios.get('http://localhost:5100/api/activities?limit=100')
      ]);

      // Extract data from responses
      const products = productsRes.data || [];
      const materials = materialsRes.data || [];
      const batches = batchesRes.data?.batches || batchesRes.data || [];
      const lines = linesRes.data?.lines || linesRes.data || [];
      const reclamations = reclamationsRes.data?.reclamations || reclamationsRes.data || [];
      const employees = employeesRes.data || [];
      const activities = activitiesRes.data?.activities || activitiesRes.data || [];

      // Filter data based on date range
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999); // Include entire end day
      
      const filteredBatches = batches.filter(batch => {
        const batchDate = new Date(batch.createdAt || batch.startDate || batch.date);
        return batchDate >= startDate && batchDate <= endDate;
      });

      const filteredReclamations = reclamations.filter(reclamation => {
        const recDate = new Date(reclamation.createdAt || reclamation.date);
        return recDate >= startDate && recDate <= endDate;
      });

      const filteredActivities = activities.filter(activity => {
        const activityDate = new Date(activity.timestamp || activity.date);
        return activityDate >= startDate && activityDate <= endDate;
      });

      // Generate report based on type
      let data = [];
      let summaryData = {};
      let chartConfig = null;

      switch (reportType) {
        case "production":
          data = generateProductionReport(filteredBatches, lines);
          summaryData = generateProductionSummary(filteredBatches, lines, filteredActivities);
          chartConfig = generateProductionChart(data);
          break;
        
        case "inventory":
          data = generateInventoryReport(materials);
          summaryData = generateInventorySummary(materials);
          chartConfig = generateInventoryChart(data);
          break;
        
        case "efficiency":
          data = generateEfficiencyReport(filteredBatches, lines);
          summaryData = generateEfficiencySummary(filteredBatches, lines);
          chartConfig = generateEfficiencyChart(data);
          break;
        
        case "quality":
          data = generateQualityReport(filteredReclamations, filteredBatches);
          summaryData = generateQualitySummary(filteredReclamations, filteredBatches);
          chartConfig = generateQualityChart(data);
          break;
        
        case "financial":
          data = generateFinancialReport(products, filteredBatches, materials);
          summaryData = generateFinancialSummary(products, filteredBatches, materials);
          chartConfig = generateFinancialChart(data);
          break;
        
        default:
          data = [];
      }

      setReportData(data);
      setSummary(summaryData);
      setChartData(chartConfig);
    } catch (error) {
      console.error("Error generating report:", error);
      setReportData([]);
      setSummary({});
      setChartData(null);
    }
    setLoading(false);
  };

  // Enhanced Report generation functions using real data structure
  const generateProductionReport = (batches, lines) => {
    const lineStats = {};
    
    // Initialize line stats
    lines.forEach(line => {
      lineStats[line._id] = {
        lineId: line._id,
        lineName: line.name || `Line ${line._id}`,
        totalBatches: 0,
        completedBatches: 0,
        inProgressBatches: 0,
        pendingBatches: 0,
        efficiency: 0
      };
    });

    // Count batches per line
    batches.forEach(batch => {
      const lineId = batch.assignedLine || batch.lineId;
      if (lineId && lineStats[lineId]) {
        lineStats[lineId].totalBatches++;
        
        switch(batch.status) {
          case 'completed':
            lineStats[lineId].completedBatches++;
            break;
          case 'in-production':
            lineStats[lineId].inProgressBatches++;
            break;
          case 'pending':
            lineStats[lineId].pendingBatches++;
            break;
        }
      }
    });

    // Calculate efficiency
    Object.values(lineStats).forEach(line => {
      line.efficiency = line.totalBatches > 0 
        ? Math.round((line.completedBatches / line.totalBatches) * 100)
        : 0;
    });

    return Object.values(lineStats);
  };

  const generateInventoryReport = (materials) => {
    return materials.map(material => ({
      materialId: material._id,
      materialName: material.materialName || material.name,
      currentStock: material.quantity || 0,
      minStock: material.minStock || 10,
      unitPrice: material.unitPrice || 0,
      status: (material.quantity || 0) < (material.minStock || 10) ? 'Low Stock' : 'Adequate',
      lastUpdated: material.lastUpdated || material.updatedAt,
      totalValue: (material.quantity || 0) * (material.unitPrice || 0)
    }));
  };

  const generateEfficiencyReport = (batches, lines) => {
    const dailyData = [];
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    // Generate data for each day in the range
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayBatches = batches.filter(b => {
        const batchDate = new Date(b.createdAt || b.date);
        return batchDate >= dayStart && batchDate <= dayEnd;
      });
      
      const completed = dayBatches.filter(b => b.status === 'completed').length;
      const efficiency = dayBatches.length > 0 ? Math.round((completed / dayBatches.length) * 100) : 0;
      
      dailyData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        totalBatches: dayBatches.length,
        completedBatches: completed,
        efficiency: efficiency,
        day: date.toDateString()
      });
    }
    
    return dailyData;
  };

  const generateQualityReport = (reclamations, batches) => {
    const productStats = {};
    
    // Initialize with products from batches
    batches.forEach(batch => {
      const productName = batch.productName || batch.productId || 'Unknown Product';
      if (!productStats[productName]) {
        productStats[productName] = {
          productName: productName,
          totalBatches: 0,
          reclamations: 0,
          defectRate: 0
        };
      }
      productStats[productName].totalBatches++;
    });

    // Count reclamations per product
    reclamations.forEach(rec => {
      const productName = rec.product?.name || rec.productName || 'Unknown Product';
      if (productStats[productName]) {
        productStats[productName].reclamations++;
      }
    });

    // Calculate defect rates
    Object.keys(productStats).forEach(product => {
      productStats[product].defectRate = productStats[product].totalBatches > 0 
        ? Math.round((productStats[product].reclamations / productStats[product].totalBatches) * 100)
        : 0;
    });

    return Object.values(productStats);
  };

  // Fixed calculateMaterialCost function
  const calculateMaterialCost = (product, materials, productBatches) => {
    // Simple calculation - you might want to enhance this based on your product materials structure
    if (product.materials && Array.isArray(product.materials)) {
      return product.materials.reduce((total, material) => {
        const materialData = materials.find(m => m.materialName === material);
        return total + ((materialData?.unitPrice || 10) * 2); // Assuming 2 units per product
      }, 0);
    }
    return (productBatches || 1) * 50; // Default cost per batch
  };

  const generateFinancialReport = (products, batches, materials) => {
    const financialData = products.map(product => {
      const productBatches = batches.filter(b => 
        b.productName === product.name || b.productId === product._id
      );
      
      const revenue = productBatches.length * (product.price || 100); // Default price if not set
      const materialCost = calculateMaterialCost(product, materials, productBatches.length);
      const profit = revenue - materialCost;
      
      return {
        productId: product._id,
        productName: product.name || product.productName,
        price: product.price || 100,
        batchesProduced: productBatches.length,
        totalRevenue: revenue,
        materialCost: materialCost,
        profit: profit,
        profitMargin: revenue > 0 ? Math.round((profit / revenue) * 100) : 0
      };
    });

    return financialData;
  };

  // Enhanced Summary generation functions
  const generateProductionSummary = (batches, lines, activities) => ({
    totalBatches: batches.length,
    completedBatches: batches.filter(b => b.status === 'completed').length,
    inProgressBatches: batches.filter(b => b.status === 'in-production').length,
    activeLines: lines.filter(l => l.status === 'busy').length,
    totalLines: lines.length,
    avgEfficiency: batches.length > 0 ? 
      Math.round((batches.filter(b => b.status === 'completed').length / batches.length) * 100) : 0,
    dailyActivity: activities.filter(a => 
      new Date(a.timestamp).toDateString() === new Date().toDateString()
    ).length
  });

  const generateInventorySummary = (materials) => ({
    totalItems: materials.length,
    lowStockItems: materials.filter(m => (m.quantity || 0) < (m.minStock || 10)).length,
    outOfStock: materials.filter(m => (m.quantity || 0) === 0).length,
    totalValue: materials.reduce((sum, m) => sum + ((m.quantity || 0) * (m.unitPrice || 0)), 0),
    criticalItems: materials.filter(m => (m.quantity || 0) <= 5).length
  });

  const generateEfficiencySummary = (batches, lines) => {
    const completed = batches.filter(b => b.status === 'completed').length;
    const totalProductionTime = batches.reduce((total, batch) => {
      if (batch.startedAt && batch.completedAt) {
        return total + (new Date(batch.completedAt) - new Date(batch.startedAt));
      }
      return total;
    }, 0);
    
    const avgProductionTime = completed > 0 ? Math.round(totalProductionTime / completed / 60000) : 0; // in minutes
    
    return {
      overallEfficiency: batches.length > 0 ? Math.round((completed / batches.length) * 100) : 0,
      avgCompletionTime: avgProductionTime,
      bestPerformingLine: findBestPerformingLine(batches, lines),
      utilizationRate: Math.round((lines.filter(l => l.status === 'busy').length / lines.length) * 100),
      totalProductionTime: Math.round(totalProductionTime / 3600000) // in hours
    };
  };

  const findBestPerformingLine = (batches, lines) => {
    const linePerformance = {};
    
    lines.forEach(line => {
      const lineBatches = batches.filter(b => b.assignedLine === line._id);
      const completed = lineBatches.filter(b => b.status === 'completed').length;
      linePerformance[line.name] = lineBatches.length > 0 ? 
        Math.round((completed / lineBatches.length) * 100) : 0;
    });
    
    const bestLine = Object.entries(linePerformance).reduce((best, [name, efficiency]) => {
      return efficiency > best.efficiency ? { name, efficiency } : best;
    }, { name: 'None', efficiency: 0 });
    
    return `${bestLine.name} (${bestLine.efficiency}%)`;
  };

  const generateQualitySummary = (reclamations, batches) => ({
    totalReclamations: reclamations.length,
    resolvedReclamations: reclamations.filter(r => r.status === 'resolved').length,
    pendingReclamations: reclamations.filter(r => r.status === 'pending').length,
    defectRate: batches.length > 0 ? Math.round((reclamations.length / batches.length) * 10000) / 100 : 0, // Percentage with decimals
    avgResolutionTime: calculateAvgResolutionTime(reclamations),
    highPriorityReclamations: reclamations.filter(r => r.priority === 3 || r.urgency === 'high').length
  });

  const calculateAvgResolutionTime = (reclamations) => {
    const resolvedReclamations = reclamations.filter(r => 
      r.status === 'resolved' && r.createdAt && r.resolution?.resolvedAt
    );
    
    if (resolvedReclamations.length === 0) return 0;
    
    const totalTime = resolvedReclamations.reduce((total, rec) => {
      const created = new Date(rec.createdAt);
      const resolved = new Date(rec.resolution.resolvedAt);
      return total + (resolved - created);
    }, 0);
    
    return Math.round(totalTime / resolvedReclamations.length / 3600000); // in hours
  };

  const generateFinancialSummary = (products, batches, materials) => {
    const totalRevenue = batches.length * 100; // Simplified calculation
    const totalCost = materials.reduce((sum, m) => sum + ((m.quantity || 0) * (m.unitPrice || 0)), 0);
    const profit = totalRevenue - totalCost;
    
    return {
      totalRevenue: totalRevenue,
      totalCost: totalCost,
      profit: profit,
      profitMargin: totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0,
      batchesProduced: batches.length,
      productsCount: products.length,
      roi: totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0
    };
  };

  // Chart generation functions
  const generateProductionChart = (data) => ({
    labels: data.map(item => item.lineName),
    datasets: [
      {
        label: 'Completed Batches',
        data: data.map(item => item.completedBatches),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      },
      {
        label: 'In Progress',
        data: data.map(item => item.inProgressBatches),
        backgroundColor: 'rgba(255, 206, 86, 0.8)',
      }
    ]
  });

  const generateInventoryChart = (data) => ({
    labels: data.map(item => item.materialName),
    datasets: [
      {
        label: 'Current Stock',
        data: data.map(item => item.currentStock),
        backgroundColor: data.map(item => 
          item.currentStock < (item.minStock || 10) ? 'rgba(255, 99, 132, 0.8)' : 'rgba(75, 192, 192, 0.8)'
        ),
      }
    ]
  });

  const generateEfficiencyChart = (data) => ({
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Efficiency %',
        data: data.map(item => item.efficiency),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
      }
    ]
  });

  const generateQualityChart = (data) => ({
    labels: data.map(item => item.productName),
    datasets: [
      {
        label: 'Defect Rate %',
        data: data.map(item => item.defectRate),
        backgroundColor: 'rgba(255, 159, 64, 0.8)',
      }
    ]
  });

  const generateFinancialChart = (data) => ({
    labels: data.map(item => item.productName),
    datasets: [
      {
        label: 'Profit Margin %',
        data: data.map(item => item.profitMargin),
        backgroundColor: data.map(item => 
          item.profitMargin > 0 ? 'rgba(75, 192, 192, 0.8)' : 'rgba(255, 99, 132, 0.8)'
        ),
      }
    ]
  });

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const exportToPDF = () => {
    if (!reportData || reportData.length === 0) return;
    
    const doc = new jsPDF();
    const reportTitle = reportTypes.find(r => r.value === reportType)?.label;
    
    // Title
    doc.setFontSize(20);
    doc.text(reportTitle, 20, 20);
    
    // Date range
    doc.setFontSize(12);
    doc.text(`Period: ${dateRange.start} to ${dateRange.end}`, 20, 30);
    
    // Summary
    doc.setFontSize(14);
    doc.text('Summary', 20, 45);
    doc.setFontSize(10);
    
    let yPosition = 55;
    Object.entries(summary).forEach(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      doc.text(`${label}: ${value}`, 20, yPosition);
      yPosition += 7;
    });
    
    // Data table
    if (reportData.length > 0) {
      const headers = [Object.keys(reportData[0])];
      const rows = reportData.map(row => Object.values(row));
      
      autoTable(doc, {
        head: headers,
        body: rows,
        startY: yPosition + 10,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [24, 32, 122] }
      });
    }
    
    doc.save(`${reportType}_report_${dateRange.start}_to_${dateRange.end}.pdf`);
  };

  const exportToCSV = () => {
    if (!reportData || reportData.length === 0) return;
    
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map(row => headers.map(header => 
        `"${String(row[header] || '').replace(/"/g, '""')}"`
      ).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}_report_${dateRange.start}_to_${dateRange.end}.csv`;
    a.click();
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: reportTypes.find(r => r.value === reportType)?.label,
      },
    },
  };

  const formatNumber = (num) => {
    if (typeof num === 'number') {
      return num.toLocaleString();
    }
    return num;
  };

  return (
    <div className="reporting-page">
      <Navbar/>
      <div className="reporting-header">
        <h1>Analytics & Reports</h1>
        <p>Comprehensive insights into your manufacturing operations</p>
      </div>

      <div className="reporting-controls">
        <div className="control-group">
          <label>Report Type:</label>
          <select 
            value={reportType} 
            onChange={(e) => setReportType(e.target.value)}
            className="report-select"
          >
            {reportTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>From:</label>
          <input 
            type="date" 
            value={dateRange.start}
            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
            className="date-input"
          />
        </div>

        <div className="control-group">
          <label>To:</label>
          <input 
            type="date" 
            value={dateRange.end}
            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
            className="date-input"
          />
        </div>

        <div className="control-group">
          <button 
            onClick={fetchReportData} 
            disabled={loading}
            className="generate-btn"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-chart-bar"></i> Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Loading report data...</p>
          </div>
        </div>
      )}

      {reportData && reportData.length > 0 && (
        <div className="report-content" ref={reportRef}>
          {/* Summary Cards */}
          <div className="summary-cards">
            {Object.entries(summary).map(([key, value]) => (
              <div key={key} className="summary-card">
                <div className="summary-value">{formatNumber(value)}</div>
                <div className="summary-label">
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
              </div>
            ))}
          </div>

          {/* Chart Section */}
          {chartData && (
            <div className="chart-section">
              <div className="chart-container">
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          )}

          {/* Data Table */}
          <div className="data-section">
            <h3>Detailed Data</h3>
            <div className="table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    {reportData.length > 0 && Object.keys(reportData[0]).map(key => (
                      <th key={key}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex}>{formatNumber(value)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="export-section">
            <button onClick={exportToPDF} className="export-btn pdf">
              <i className="fas fa-file-pdf"></i> Export PDF
            </button>
            <button onClick={exportToCSV} className="export-btn csv">
              <i className="fas fa-file-csv"></i> Export CSV
            </button>
          </div>
        </div>
      )}

      {!loading && (!reportData || reportData.length === 0) && (
        <div className="no-data">
          <i className="fas fa-chart-bar"></i>
          <p>No data available for the selected criteria</p>
          <p className="subtext">Try adjusting the date range or select a different report type</p>
        </div>
      )}
    </div>
  );
};

export default Reporting;