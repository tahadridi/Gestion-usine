import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../assets/css/fabrication.css';
import Navbar from './navbar';
import ReclamationForm from './reclamation';
import { useAuthStore } from '../store/useAuthStore.js';
import { FileWarning } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast'; 
import { LogOut,User } from "lucide-react";
import { Link } from 'react-router-dom';

function Fabrication() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOption, setFilterOption] = useState('all');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [products, setProducts] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });
  const [batchQuantity, setBatchQuantity] = useState(1);
  const [materialAvailability, setMaterialAvailability] = useState({});
  const [stock, setStock] = useState([]);
  const [showReclamationForm, setShowReclamationForm] = useState(false);
  const [reclamationProduct, setReclamationProduct] = useState(null); 
   const { authUser,logout  } = useAuthStore();
  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await axios.get('http://localhost:5100/api/products');
        const formattedProducts = res.data.map(prod => ({
          ...prod,
          materials: prod.materials || []
        }));
        setProducts(formattedProducts);
      } catch (err) {
        console.error('Erreur lors de la récupération des produits:', err);
        setProducts([]);
        toast.error('Error loading products', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);
//check availability
useEffect(() => {
  const checkMaterialAvailability = async () => {
    if (!products.length) return;
    
    try {
      const stockRes = await axios.get('http://localhost:5100/api/stock');
      const availabilityMap = {};
      
      products.forEach(product => {
        const hasAllMaterials = product.materials.every(material => {
          const materialName = material.name || material;
          const requiredQty = material.quantity || 1;
          
          const stockItem = stockRes.data.find(
            s => s.materialName && s.materialName.toLowerCase() === materialName.toLowerCase()
          );
          
          return stockItem && stockItem.quantity >= requiredQty;
        });
        
        availabilityMap[product._id] = hasAllMaterials;
      });
      
      setMaterialAvailability(availabilityMap);
    } catch (err) {
      console.error('Error checking material availability:', err);
    }
  };
  
  checkMaterialAvailability();
}, [products]);



  // Fetch materials from Stock collection
 useEffect(() => {
  const fetchMaterials = async () => {
    try {
      const res = await axios.get('http://localhost:5100/api/stock');
      const materialNames = res.data.map(item => item.materialName);
      setAllMaterials(materialNames);
      setStock(res.data); 
    } catch (err) {
      console.error('Erreur lors de la récupération des matériaux:', err);
      setAllMaterials([]);
      setStock([]);
    }
  };
  fetchMaterials();
}, []);

 const handleReclamationClick = (product) => {
    setReclamationProduct(product);
    setShowReclamationForm(true);
  };

const startBatch = async (product) => {
  try {
    setBatchLoading(true);
    
    // Check material availability with the specified quantity
    const stockRes = await axios.get('http://localhost:5100/api/stock');
    const insufficientMaterials = [];
    
    // Check each material for the required quantity
    for (const material of product.materials) {
      const materialName = material.name || material;
      const requiredQty = (material.quantity || 1) * batchQuantity;
      
      const stockItem = stockRes.data.find(
        s => s.materialName && s.materialName.toLowerCase() === materialName.toLowerCase()
      );
      
      if (!stockItem || stockItem.quantity < requiredQty) {
        insufficientMaterials.push({
          material: materialName,
          required: requiredQty,
          currentStock: stockItem ? stockItem.quantity : 0
        });
      }
    }
    
    // If there are insufficient materials, send notification and return
    if (insufficientMaterials.length > 0) {
      // Send notification
      await axios.post('http://localhost:5100/api/notifications', {
        message: `Operator tried to fabricate ${batchQuantity} units of ${product.name}`,
        type: 'material_unavailable',
        brand: product.brand,
        model: product.model,
        missingMaterials: insufficientMaterials,
        priority: 2, // Important
        read: false,
        submittedBy: authUser?.email || 'unknown@example.com', 
        userRole: authUser?.role || 'operator' 
      });
      
      toast.error(`Insufficient materials to fabricate ${batchQuantity} units`);
      toast.error(`A Reclamation was sent to the stock manager`);
      return;
    }

    // If all materials are available, proceed with batch creation
    const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const batchData = {
      batchId,
      productId: product._id,
      productName: product.name,
      quantity: batchQuantity,
      productGroup: product.group,
      materials: product.materials,
      submittedBy: authUser?.email || 'unknown@example.com',
      userRole: authUser?.role || 'operator'
    };

    const response = await axios.post('http://localhost:5100/api/batches/start', batchData);

    if (response.data.success) {
      toast.success(
        `Batch ${batchId} started successfully! Assigned to: ${response.data.assignedLine?.name || 'Pending assignment'}`,
        'success'
      );

      // Delete product from database
      try {
        await axios.delete(`http://localhost:5100/api/products/${product._id}`);
        setProducts(prev => prev.filter(p => p._id !== product._id));
      } catch (deleteError) {
        console.error('Error deleting product:', deleteError);
        toast.error('Batch started but failed to delete product', 'warning');
      }

      setModalProduct(null);
      setBatchQuantity(1);
    } else {
      toast.error(response.data.message || 'Failed to start batch', 'error');
    }
  } catch (error) {
    console.error('Error starting batch:', error);
    toast.error('Error starting batch: ' + (error.response?.data?.error || error.message), 'error');
  } finally {
    setBatchLoading(false);
  }
};

  

  const filteredProducts = products.filter(product => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch = 
      product.name.toLowerCase().includes(lowerSearch) ||
      product.materials.some(mat => (mat.name || mat).toLowerCase().includes(lowerSearch));

    const matchesType =
      filterOption === 'all' ||
      (filterOption === 'steering' && product.type === 'steering')

    const matchesMaterials = selectedMaterials.length === 0 || 
      selectedMaterials.every(material => 
        product.materials.some(m => (m.name || m) === material)
      );

    return matchesSearch && matchesType && matchesMaterials;
  });

  return (
    <div className="fabrication-page">
      <Toaster/>
      <Navbar />
      <div className="container py-5">
        
        <div className="row">
          <div className="col-md-9">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="page-title">Products to Fabricate</h1>
              <span className="product-count">{filteredProducts.length} products</span>
            </div>
            
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading products...</p>
              </div>
            ) : (
              <div className="row">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, idx) => (
                    <div className="col-md-6 col-lg-4 mb-4" key={idx}>
                      <div 
                        className="card fabrication-card h-100"
                        onClick={() => setModalProduct(product)}
                      >
                       <div className="card-img-container">
                        {product.image ? (
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="product-image" // Add this class
                            onError={(e) => {
                              e.target.style.display = 'none';
                              // Show placeholder when image fails to load
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        {!product.image && (
                          <div className="image-placeholder">
                            <i className="fas fa-car"></i>
                          </div>
                        )}
                        <div className="product-type-badge">
                          {product.type || 'Product'}
                        </div>
                      </div>
                        <div className="card-body">
                          <h5 className="card-title">{product.name}</h5>
                                
                                      {!materialAvailability[product._id] && (
                                        <div className="material-warning-badge">
                                          <i className="fas fa-exclamation-triangle"></i>
                                          Insufficient Materials
                                        </div>
                                      )}
                            <div className="materials-preview">
                            <h6 className="section-label">Materials Required:</h6>
                            <ul className="material-list">
                              {product.materials.slice(0, 3).map((material, i) => {
                                const materialName = material.name || material;
                                const quantity = material.quantity || 1;
                                return (
                                  <li className="material-item" key={i}>
                                    <span className="material-name">{materialName}</span>
                                    <span className="material-quantity">
                                      {quantity} {quantity !== 1 ? 'units' : 'unit'}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                            {product.materials.length > 3 && (
                              <div className="additional-materials">
                                +{product.materials.length - 3} more materials
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="card-footer">
                          <button className="view-details-btn">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12 text-center py-5">
                    <div className="no-products-placeholder">
                      <i className="fas fa-box-open"></i>
                      <h4>No products found</h4>
                      <p>Try adjusting your search or filter criteria</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="col-md-3">
            <button 
      className="btn-reclamation-link"
      onClick={() => handleReclamationClick(null)}
    >
      <i className="fas fa-plus"></i> New Reclamation
    </button>
            <div className="sticky-sidebar">
                      
              <div className="filter-card">
                <div className="filter-header">
                  <h4>Search & Filter</h4>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setSearchTerm('');
                      setFilterOption('all');
                      setSelectedMaterials([]);
                      setAdvancedOpen(false);
                    }}
                  >
                    <i className="fas fa-redo"></i> Reset
                  </button>
                </div>
                
                <div className="search-box">
                  <i className="fas fa-search search-icon"></i>
                  <input 
                    type="text"
                    className="search-input"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="filter-section">
                  <label className="filter-label">Filter by Type</label>
                  <div className="type-filter-options">
                    <button 
                      className={`filter-pill ${filterOption === 'all' ? 'active' : ''}`}
                      onClick={() => setFilterOption('all')}
                    >
                      All
                    </button>
                    <button 
                      className={`filter-pill ${filterOption === 'steering' ? 'active' : ''}`}
                      onClick={() => setFilterOption('steering')}
                    >
                      Steering
                    </button>
                  </div>
                </div>

                <div className="filter-section">
                  <button 
                    className="advanced-filter-toggle"
                    onClick={() => setAdvancedOpen(!advancedOpen)}
                  >
                    <span>Advanced Filters</span>
                    <i className={`fas fa-chevron-${advancedOpen ? 'up' : 'down'}`}></i>
                  </button>
                  
                  {advancedOpen && (
                    <div className="advanced-filters">
                      <label className="filter-label">Filter by Material:</label>
                      <div className="materials-filter">
                        {allMaterials.map((material, idx) => (
                          <div className="material-checkbox" key={idx}>
                            <input 
                              type="checkbox"
                              id={`material-${idx}`}
                              value={material}
                              checked={selectedMaterials.includes(material)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedMaterials([...selectedMaterials, material]);
                                } else {
                                  setSelectedMaterials(selectedMaterials.filter(m => m !== material));
                                }
                              }}
                            />
                            <label htmlFor={`material-${idx}`}>
                              <span className="checkmark"></span>
                              {material}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal with quantity input */}
        {modalProduct && (
          <div className="modal-overlay" onClick={() => setModalProduct(null)}>
            <div className="modal-container" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{modalProduct.name}</h3>
                <button className="modal-close" onClick={() => setModalProduct(null)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="modal-body">
                <div className="modal-section">
                  <h4>Materials Required</h4>
                          <div className="materials-list">
                            {modalProduct.materials.map((material, i) => {
                              const materialName = material.name || material;
                              const perUnit = material.quantity || 1;
                              const required = perUnit * batchQuantity; // 🔥 total required based on batchQuantity

                              // Find stock entry for this material
                              const stockItem = stock.find(
                                s => s.materialName && s.materialName.toLowerCase() === materialName.toLowerCase()
                              );
                              const availableQty = stockItem ? stockItem.quantity : 0;

                              // Check stock availability
                              const isInsufficient = availableQty < required;
                              const color = isInsufficient ? 'red' : 'green';

                              return (
                                <div className="material-row" key={i}>
                                  <span 
                                    className="material-name" 
                                    style={{ color }}
                                  >
                                    {materialName}
                                  </span>
                                  <span 
                                    className="material-quantity" 
                                    style={{ color }}
                                  >
                                    {required} {required !== 1 ? 'units' : 'unit'} 
                                    ({availableQty} available)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                </div>
                
                  <div className="modal-section">
                    <h4>Batch Details</h4>
                    <div className="form-group">
                      <label>Quantity to Produce:</label>
                      <input
                        type="number"
                        min="1"
                        value={batchQuantity}
                        onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="quantity-input"
                        disabled={batchLoading}
                      />
                    </div>
                  </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn-secondary" 
                  onClick={() => setModalProduct(null)}
                  disabled={batchLoading}
                >
                  Cancel
                </button>
                <button 
                  className="btn-primary" 
                  onClick={() => startBatch(modalProduct)}
                  disabled={batchLoading|| !materialAvailability[modalProduct._id]}
                >
                  {batchLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Starting...
                    </>
                  ) : (
                    'Start Fabrication'
                  )}
              </button>
            </div>
          </div>
        </div>
      )}
       {/* Reclamation Form Modal */}
      {showReclamationForm && (
        <ReclamationForm 
          product={reclamationProduct}
          onClose={() => {
            setShowReclamationForm(false);
            setReclamationProduct(null);
          }}
        />
      )}
    </div>
  );
}

export default Fabrication;