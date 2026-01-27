import React, { useState, useEffect } from 'react';
import axios from 'axios';
import brandLogos from '../assets/images/brandlogos';
import brandSteering from '../assets/images/brandsteering';
import "@fortawesome/fontawesome-free/css/all.min.css";
import Navbar from './navbar';
import {Box, Tag, Building, ListPlus, Image, Save, Car, Warehouse, CirclePlus} from "lucide-react";
import toast, { Toaster } from 'react-hot-toast'; 
import { useAuthStore } from '../store/useAuthStore.js';
import { LogOut } from "lucide-react";
// Modern styles with a professional color scheme
const modernStyles = {
  container: {
    backgroundColor: "#edf2f7",
    minHeight: "100vh",
    padding: "20px 0"
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
    padding: '25px',
    marginBottom: '25px'
  },
  header: {
    color: '#18207A',
    fontWeight: '600',
    marginBottom: '25px',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center'
  },
  sectionTitle: {
    color: '#2D3748',
    fontWeight: '600',
    marginBottom: '15px',
    fontSize: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 15px',
    backgroundColor: 'rgba(24, 32, 122, 0.05)',
    borderRadius: '6px',
    borderLeft: '4px solid #18207A'
  },
  label: {
    fontWeight: '500',
    marginBottom: '8px',
    color: '#495057',
    fontSize: '14px'
  },
  dropdown: {
    position: 'relative',
    width: '100%'
  },
  dropdownButton: {
    textAlign: 'left',
    width: '100%',
    padding: '12px 16px',
    fontSize: '14px',
    color: '#495057',
    backgroundColor: '#fff',
    border: '1px solid #e1e5eb',
    borderRadius: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
  },
  dropdownButtonHover: {
    borderColor: '#18207A',
    boxShadow: '0 0 0 3px rgba(24, 32, 122, 0.1)'
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    zIndex: 1000,
    width: '100%',
    backgroundColor: '#fff',
    border: '1px solid #e1e5eb',
    borderRadius: '8px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
    marginTop: '4px',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  dropdownItem: {
    padding: '10px 16px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
    fontSize: '14px'
  },
  dropdownItemHover: {
    backgroundColor: '#f8f9fa'
  },
  groupHeader: {
    padding: '10px 16px',
    backgroundColor: 'rgba(24, 32, 122, 0.05)',
    fontWeight: '600',
    fontSize: '13px',
    color: '#18207A',
    borderBottom: '1px solid #e1e5eb'
  },
  logo: {
    width: '20px',
    height: '20px',
    marginRight: '10px',
    borderRadius: '3px'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e1e5eb',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    width: '100%',
    boxSizing: 'border-box'
  },
  inputFocus: {
    borderColor: '#18207A',
    boxShadow: '0 0 0 3px rgba(24, 32, 122, 0.1)',
    outline: 'none'
  },
  materialBadge: {
    padding: '6px 12px',
    borderRadius: '50px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    margin: '0 8px 8px 0',
    cursor: 'pointer'
  },
  availableMaterial: {
    backgroundColor: 'rgba(40, 167, 69, 0.15)',
    color: '#28a745',
    border: '1px solid rgba(40, 167, 69, 0.3)'
  },
  unavailableMaterial: {
    backgroundColor: 'rgba(220, 53, 69, 0.15)',
    color: '#dc3545',
    border: '1px solid rgba(220, 53, 69, 0.3)'
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #18207A 0%, #134698 100%)',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '8px',
    fontFamily: '"Inter", sans-serif',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(24, 32, 122, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonPrimaryHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(24, 32, 122, 0.3)',
    background: 'linear-gradient(135deg, #0f144e 0%, #0d3a7d 100%)'
  },
  buttonSecondary: {
    background: 'linear-gradient(135deg, #18207A 0%, #134698 100%)',
    color: 'white',
    border: 'none',
    padding: '0.8rem 1.5rem',
    borderRadius: '8px',
    fontFamily: '"Inter", sans-serif',
    fontWeight: '500',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 6px rgba(24, 32, 122, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonSecondaryHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 12px rgba(24, 32, 122, 0.3)',
    background: 'linear-gradient(135deg, #0f144e 0%, #0d3a7d 100%)'
  },
  materialItem: {
    padding: '12px 16px',
    border: '1px solid #e1e5eb',
    borderRadius: '8px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.2s ease'
  },
  materialItemHover: {
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
  },
  previewImage: {
    width: '100%',
    maxWidth: '200px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  fileInputContainer: {
    position: 'relative',
    overflow: 'hidden',
    display: 'inline-block',
    width: '100%'
  },
  fileInputButton: {
    border: '1px dashed #e1e5eb',
    borderRadius: '8px',
    padding: '30px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8f9fa',
    width: '100%',
    boxSizing: 'border-box'
  },
  fileInputButtonHover: {
    borderColor: '#18207A',
    backgroundColor: 'rgba(24, 32, 122, 0.03)'
  },
  select: {
    padding: '12px 16px',
    border: '1px solid #e1e5eb',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    width: '100%',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  }
};

function AdminDashboard() {
  const [groups, setGroups] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);
  const [product, setProduct] = useState({
    brand: '',
    model: '',
    name: '',
    group: '', 
    type: 'steering',
    materials: [],
    image: null
  });
  const [material, setMaterial] = useState({ name: '', quantity: '' });
  const [preview, setPreview] = useState(null);
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [isHovered, setIsHovered] = useState({});
  const [steeringWheelImage, setSteeringWheelImage] = useState(null);
  const [message, setMessage] = useState('');
  const { authUser, logout } = useAuthStore();
const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  // Required quantity of each material to build ONE unit
  const REQUIRED_QUANTITIES = {
    "Steel Frame": 1,             
    "Aluminum Core": 1,           
    "Foam Padding": 1,            
    "Leather Cover": 1,           
    "Plastic Trim": 2,            
    "Multifunction Buttons": 8,   
    "Carbon Fiber Trim": 1,       
    "Carbon Fiber Inserts": 1,    
    "Carbon Fiber": 1,            
    "Wood Trim": 1,              
    "Electronic Controls": 0,     
    "Airbag Module": 1,           
    "default": 1
  };

  // Mapping of brand names to steering wheel image keys
  const brandToSteeringKey = {
    "Abarth": "abarthsteering",
    "Alfa Romeo": "alfaromeosteering",
    "Chrysler": "chryslersteering",
    "Citroen": "citroensteering",
    "DS": "dssteering",
    "Dacia": "daciasteering",
    "Dodge": "dodgesteering",
    "Fiat": "fiatsteering",
    "Ford": "fordsteering",
    "Jeep": "jeepsteering",
    "Lancia": "lanciasteering",
    "Maserati": "maseratisteering",
    "Mercedes Benz": "mercedesbenzsteering",
    "Mini": "ministeering",
    "Opel": "opelsteering",
    "Peugeot": "peugeotsteering",
    "Renault": "renaultsteering",
    "Seat": "seatsteering",
    "Skoda": "skodasteering",
    "Toyota": "toyotasteering",
    "Volkswagen": "volkswagensteering",
    "Volvo Cars": "volvocarssteering",
    "Volvo Trucks": "volvotruckssteering",
    "Audi": "audisteering",
    "BMW": "bmwsteering",
    "Vauxhall": "vauxhallsteering",
    "Scania": "scaniasteering"
  };

  // Fetch groups data
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await axios.get('http://localhost:5100/api/car-groups');
        if (!res.data || !res.data.success || !Array.isArray(res.data.data)) {
          throw new Error('Invalid API response structure');
        }
        const organizedGroups = res.data.data.map(group => ({
          groupName: group.groupName || 'Unknown Group',
          brands: (group.brands || []).map(brand => ({
            name: brand.name || 'Unknown Brand',
            models: brand.models || [],
            logo: brandLogos[`${(brand.name || '').toLowerCase().replace(/\s+/g, '')}Logo`]
          }))
        }));
        setGroups(organizedGroups);
      } catch (err) {
        console.error('❌ Failed to fetch car groups:', err);
        setGroups([
          {
            groupName: 'Stellantis',
            brands: [
              { name: 'Abarth', models: ['595', '124 Spider'], logo: brandLogos.abarthLogo },
              { name: 'Alfa Romeo', models: ['Giulia', 'Stelvio'], logo: brandLogos.alfaromeoLogo }
            ]
          }
        ]);
      }
    };
    fetchGroups();
  }, []);

  // Fetch materials + stock for selected brand/model
  useEffect(() => {
    const fetchMaterialsAndStock = async () => {
      if (!selectedBrand || !selectedModel) return;
      try {
        // Fetch materials for brand/model
        const matRes = await axios.get(
          `http://localhost:5100/api/materials?brand=${encodeURIComponent(
            selectedBrand
          )}&model=${encodeURIComponent(selectedModel)}`
        );

        // Fetch stock database
        const stockRes = await axios.get("http://localhost:5100/api/stock");

        const materialsArray =
          matRes.data?.data || matRes.data?.materials || matRes.data || [];

        // Merge with stock and add required quantity
        const materialsWithStock = materialsArray.map((materialName) => {
          const stockItem = stockRes.data.find(
            (s) => s.materialName && materialName && s.materialName.toLowerCase() === materialName.toLowerCase()
          );

          const requiredQty =
            REQUIRED_QUANTITIES[materialName] || REQUIRED_QUANTITIES["default"];

          const stockQty = stockItem ? stockItem.quantity : 0;

          return {
            name: materialName,
            stock: stockQty,
            required: requiredQty,
            isAvailable: stockQty >= requiredQty,
          };
        });

        setAvailableMaterials(materialsWithStock);

      } catch (err) {
        console.error("❌ Failed to fetch materials/stock:", err);
        setAvailableMaterials([]);
      }
    };

    fetchMaterialsAndStock();
  }, [selectedBrand, selectedModel]);

  // Set steering wheel image when brand/model changes
  useEffect(() => {
    if (selectedBrand && brandToSteeringKey[selectedBrand]) {
      const steeringKey = brandToSteeringKey[selectedBrand];
      if (brandSteering[steeringKey]) {
        setSteeringWheelImage(brandSteering[steeringKey]);
        setPreview(brandSteering[steeringKey]);
        setProduct(prev => ({ ...prev, image: brandSteering[steeringKey] }));
      }
    }
  }, [selectedBrand, selectedModel]);

  const availableModels = selectedBrand
    ? groups.flatMap(group => group.brands).find(brand => brand.name === selectedBrand)?.models || []
    : [];

  useEffect(() => {
    setProduct(prev => ({ ...prev, brand: selectedBrand, model: selectedModel }));
  }, [selectedBrand, selectedModel]);

  const addStockMaterial = (name) => {
    const materialObj = availableMaterials.find(m => m.name === name);
    if (!materialObj || materialObj.stock <= 0) return toast.error(`${name} not in stock`);
    if (product.materials.some(m => m.name.toLowerCase() === name.toLowerCase())) return toast.error('Material already added');
    const qty = prompt(`Enter quantity for ${name}:`, '1');
    if (!qty || isNaN(qty) || qty <= 0) return;
    setProduct({ ...product, materials: [...product.materials, { name, quantity: Number(qty) }] });
  };

  // Notify function 
  const checkMaterialAvailability = async () => {
    if (!selectedBrand || !selectedModel) return;

    try {
      // Find all unavailable materials
      const unavailableMaterials = availableMaterials.filter(mat => !mat.isAvailable);

      if (unavailableMaterials.length > 0) {
        // Prepare grouped notification
        const missingMaterials = unavailableMaterials.map(mat => ({
          material: mat.name,
          required: mat.required,
          currentStock: mat.stock
        }));

        const message = `${selectedBrand} ${selectedModel} requires materials that are not fully available.`;

        await axios.post('http://localhost:5100/api/notifications', {
          message,
          type: 'material_unavailable',
          brand: selectedBrand,
          model: selectedModel,
          missingMaterials
        });

       toast.error(`Some materials are unavailable. Notification sent.`);
        return false; // indicate that stock is insufficient
      }

      return true; // all materials are available
    } catch (err) {
      console.error('Error checking material availability:', err);
      return true;
    }
  };

  const addMaterial = () => {
    if (!material.name || !material.quantity) return toast.error('Please enter material name and quantity');
    if (product.materials.some(m => m.name.toLowerCase() === material.name.toLowerCase())) return toast.error('Material already added');
    setProduct({ ...product, materials: [...product.materials, { ...material, quantity: Number(material.quantity) }] });
    setMaterial({ name: '', quantity: '' });
  };

  const removeMaterial = (index) => {
    const newMaterials = [...product.materials];
    newMaterials.splice(index, 1);
    setProduct({ ...product, materials: newMaterials });
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setProduct({ ...product, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const getFullProductName = () => {
    if (product.brand && product.model) {
      return `${product.brand} ${product.model} ${product.type === 'Steering Wheel' }`;
    }
    return product.name;
  };
  
  const getProductGroup = () => {
    for (const group of groups) {
      for (const brand of group.brands) {
        if (brand.name === selectedBrand && brand.models.includes(selectedModel)) {
          return group.groupName;
        }
      }
    }
    return null; // fallback
  };


const handleSubmit = async () => {
  if (!product.brand || !product.model) {
    setMessage('Please select brand and model');
    setMessageType('error');
    return;
  }

  await checkMaterialAvailability();

  const materialsToSend = product.materials.length > 0 
    ? product.materials 
    : availableMaterials.map(mat => ({ name: mat.name, quantity: mat.required }));

  const productGroup = getProductGroup();

  try {
    // Check if product already exists
    const res = await axios.get('http://localhost:5100/api/products', {
      params: {
        brand: product.brand,
        model: product.model,
        type: product.type
      }
    });

    if (res.data.exists) {
      return toast.error(' Product already exists .');
     
      return;
    }

    // Create product
    await axios.post('http://localhost:5100/api/products', {
      brand: product.brand,
      model: product.model,
      group: productGroup,
      name: product.name || `${product.brand} ${product.model} ${product.type === 'steering' ? 'Steering Wheel' : 'Airbag'}`,
      type: product.type,
      materials: materialsToSend,
      image: product.image
    });

    return toast.success(' Product saved successfully!');
  

    setSelectedBrand('');
    setSelectedModel('');
    setProduct({ brand: '', model: '', name: '', type: 'steering', materials: [], image: null });
    setPreview(null);
    setSteeringWheelImage(null);

  } catch (err) {
    console.error('Error saving product:', err);
    return toast.error(err.response?.data?.error || 'Failed to save product.');
    
  }
};



  return (
    <div>
      <Toaster/>
      <Navbar />
      
      <div style={modernStyles.container}>
        <div className="container py-4">
          <div style={modernStyles.card}>
            <h2 style={modernStyles.header}>
              <i className="fas fa-plus-circle me-2"></i>Add New Product
            </h2>
            
            <div className="row">
              {/* Left Column - Vehicle Selection */}
              <div className="col-md-6">
                <div style={modernStyles.card}>
                  <h3 style={modernStyles.sectionTitle}>
                     <Car className="w-5 h-5 mr-2 text-blue-800" />Vehicle Information
                  </h3>
                  
                  {/* Brand Selection - Custom Dropdown */}
                  <div className="mb-4">
                    <div style={modernStyles.label}>
                      <Building size={20} className="w-5 h-5 mr-2 " />Brand
                    </div>
                    <div style={modernStyles.dropdown}>
                      <button 
                          style={{ 
                            ...modernStyles.dropdownButton, 
                            ...(isHovered.brandDropdown ? modernStyles.dropdownButtonHover : {})
                          }} 
                          onClick={() => setIsBrandDropdownOpen(!isBrandDropdownOpen)}
                          onMouseEnter={() => setIsHovered({...isHovered, brandDropdown: true})}
                          onMouseLeave={() => setIsHovered({...isHovered, brandDropdown: false})}
                        >
                          <span>
                            {selectedBrand ? (
                              <>
                                {/* Find the brand logo from groups */}
                                {(() => {
                                  // Find the brand object that matches the selected brand
                                  let brandLogo = null;
                                  groups.forEach(group => {
                                    const foundBrand = group.brands.find(brand => brand.name === selectedBrand);
                                    if (foundBrand && foundBrand.logo) {
                                      brandLogo = foundBrand.logo;
                                    }
                                  });
                                  
                                  return brandLogo ? (
                                    <img src={brandLogo} alt={`${selectedBrand} logo`} style={{...modernStyles.logo, marginRight: '8px'}} />
                                  ) : (
                                    <i className="fas fa-car me-2"></i>
                                  );
                                })()}
                                {selectedBrand}
                              </>
                            ) : (
                              'Select Brand'
                            )}
                          </span>
                          <i className={`fas fa-chevron-${isBrandDropdownOpen ? 'up' : 'down'}`}></i>
                        </button>
                      {isBrandDropdownOpen && (
                        <div style={modernStyles.dropdownMenu}>
                          {groups.map((group, groupIndex) => (
                            <div key={`group-${groupIndex}`}>
                              <div style={modernStyles.groupHeader}>
                                <i className="fas fa-building me-2"></i>
                                {group.groupName}
                              </div>
                              {group.brands.map((brand, brandIndex) => (
                                <div
                                  key={`${brand.name}-${brandIndex}`}
                                  style={{
                                    ...modernStyles.dropdownItem,
                                    ...(isHovered[`brand-${brand.name}`] ? modernStyles.dropdownItemHover : {})
                                  }}
                                  onClick={() => {
                                    setSelectedBrand(brand.name);
                                    setIsBrandDropdownOpen(false);
                                  }}
                                  onMouseEnter={() => setIsHovered({...isHovered, [`brand-${brand.name}`]: true})}
                                  onMouseLeave={() => setIsHovered({...isHovered, [`brand-${brand.name}`]: false})}
                                >
                                  {brand.logo && <img src={brand.logo} alt={`${brand.name} logo`} style={modernStyles.logo} />}
                                  {brand.name}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Model Selection */}
                  <div className="mb-4">
                    <div style={modernStyles.label}>
                     <Tag size={20} className="w-5 h-5 mr-2 text-green-700" />Model
                    </div>
                    <select 
                      style={{
                        ...modernStyles.select,
                        ...(isHovered.modelSelect ? modernStyles.inputFocus : {})
                      }} 
                      value={selectedModel} 
                      onChange={e => setSelectedModel(e.target.value)} 
                      disabled={!selectedBrand}
                      onFocus={() => setIsHovered({...isHovered, modelSelect: true})}
                      onBlur={() => setIsHovered({...isHovered, modelSelect: false})}
                    >
                      <option value="">Select Model</option>
                      {availableModels.map((model, index) => (
                        <option key={`${model}-${index}`} value={model}>
                          {model}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product Type */}
                  <div className="mb-4">
                    <div style={modernStyles.label}>
                       <Box size={20} className="w-5 h-5 mr-2 text-blue-800" />Product Type
                    </div>
                    <select 
                      style={{
                        ...modernStyles.select,
                        ...(isHovered.typeSelect ? modernStyles.inputFocus : {})
                      }} 
                      value={product.type} 
                      onChange={e => setProduct({ ...product, type: e.target.value })}
                      onFocus={() => setIsHovered({...isHovered, typeSelect: true})}
                      onBlur={() => setIsHovered({...isHovered, typeSelect: false})}
                    >
                      <option value="steering">Steering Wheel</option>
                    </select>
                  </div>
                </div>
                
                {/* Materials Stock */}
                <div style={modernStyles.card}>
                  <h3 style={modernStyles.sectionTitle}>
                    <Warehouse className="h-6 w-6 text-blue-800 mr-2" />Required Materials
                  </h3>
                  <div>
                    {availableMaterials.length > 0 ? (
                      availableMaterials.map((mat) => (
                        <span
                          key={mat.name}
                          style={{
                            ...modernStyles.materialBadge,
                            ...(mat.isAvailable ? modernStyles.availableMaterial : modernStyles.unavailableMaterial)
                          }}
                          title={
                            mat.isAvailable
                              ? `Stock: ${mat.stock}, required: ${mat.required}`
                              : `Insufficient stock: ${mat.stock} available, need ${mat.required}`
                          }
                          onClick={() => addStockMaterial(mat.name)}
                        >
                          <i className={`fas ${mat.isAvailable ? 'fa-check-circle' : 'fa-exclamation-circle'} me-1`}></i>
                          {mat.name} ({mat.required})
                        </span>
                      ))
                    ) : (
                      <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                        <i className="fas fa-info-circle me-1"></i>
                        No materials defined for this model
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Right Column - Materials & Image */}
              <div className="col-md-6">
                {/* Add Custom Material */}
                <div style={modernStyles.card}>
                  <h3 style={modernStyles.sectionTitle}>
                    <CirclePlus className="h-6 w-6 text-green-600 mr-2" />Add Custom Material
                  </h3>
                  <div className="row">
                    <div className="col-7">
                      <div style={modernStyles.label}>Material Name</div>
                      <input 
                        style={{
                          ...modernStyles.input,
                          ...(isHovered.materialName ? modernStyles.inputFocus : {})
                        }} 
                        type="text" 
                        placeholder="Material name" 
                        value={material.name} 
                        onChange={e => setMaterial({ ...material, name: e.target.value })}
                        onFocus={() => setIsHovered({...isHovered, materialName: true})}
                        onBlur={() => setIsHovered({...isHovered, materialName: false})}
                      />
                    </div>
                    <div className="col-3">
                      <div style={modernStyles.label}>Quantity</div>
                      <input 
                        style={{
                          ...modernStyles.input,
                          ...(isHovered.materialQty ? modernStyles.inputFocus : {})
                        }} 
                        type="number" 
                        placeholder="Qty" 
                        value={material.quantity} 
                        onChange={e => setMaterial({ ...material, quantity: e.target.value })}
                        onFocus={() => setIsHovered({...isHovered, materialQty: true})}
                        onBlur={() => setIsHovered({...isHovered, materialQty: false})}
                      />
                    </div>
                    <div className="col-2 d-flex align-items-end">
                      <button 
                        style={{
                          ...modernStyles.buttonPrimary,
                          ...(isHovered.addMaterialBtn ? modernStyles.buttonPrimaryHover : {})
                        }} 
                        onClick={addMaterial}
                        onMouseEnter={() => setIsHovered({...isHovered, addMaterialBtn: true})}
                        onMouseLeave={() => setIsHovered({...isHovered, addMaterialBtn: false})}
                      >
                        <i className="fas fa-plus"></i>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Current Materials */}
                <div style={modernStyles.card}>
                  <h3 style={modernStyles.sectionTitle}>
                   <ListPlus className="w-6 h-6 mr-2 " />Materials to be added
                  </h3>
                  {product.materials.length > 0 ? (
                    product.materials.map((m, i) => (
                      <div 
                        key={i}
                        style={{
                          ...modernStyles.materialItem,
                          ...(isHovered[`material-${i}`] ? modernStyles.materialItemHover : {})
                        }}
                        onMouseEnter={() => setIsHovered({...isHovered, [`material-${i}`]: true})}
                        onMouseLeave={() => setIsHovered({...isHovered, [`material-${i}`]: false})}
                      >
                        <span>
                          <i className="fas fa-toolbox me-2 text-primary"></i>
                          {m.name} - {m.quantity}
                        </span>
                        <button 
                          className="btn btn-sm"
                          style={{ color: '#dc3545' }}
                          onClick={() => removeMaterial(i)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                      <i className="fas fa-info-circle me-2"></i>No materials added yet
                    </div>
                  )}
                </div>
                
                {/* Image Upload - Fixed to only cover the upload area */}
                <div style={modernStyles.card}>
                  <h3 style={modernStyles.sectionTitle}>
                    <Image className="w-6 h-6 mr-2 text-purple-700" />Product Image
                  </h3>
                  <div style={modernStyles.fileInputContainer}>
                    <div 
                      style={{
                        ...modernStyles.fileInputButton,
                        ...(isHovered.uploadArea ? modernStyles.fileInputButtonHover : {})
                      }}
                      onMouseEnter={() => setIsHovered({...isHovered, uploadArea: true})}
                      onMouseLeave={() => setIsHovered({...isHovered, uploadArea: false})}
                    >
                      <input 
                        type="file" 
                        style={{
                          position: 'absolute',
                          left: '0',
                          top: '0',
                          opacity: '0',
                          width: '100%',
                          height: '100%',
                          cursor: 'pointer'
                        }} 
                        accept="image/*" 
                        onChange={handleImage} 
                      />
                      {preview ? (
                        <img src={preview} alt="Preview" style={modernStyles.previewImage} />
                      ) : (
                        <>
                          <i className="fas fa-cloud-upload-alt mb-2" style={{ fontSize: '32px', color: '#6c757d' }}></i>
                          <div>Click to upload or drag and drop</div>
                          <div style={{ fontSize: '12px', color: '#6c757d' }}>PNG, JPG up to 5MB</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Submit Button */}
                <button
                  style={{
                    ...modernStyles.buttonSecondary,
                    ...(isHovered.submitBtn ? modernStyles.buttonSecondaryHover : {}),
                    width: '100%',
                    padding: '12px',
                    marginTop: '20px'
                  }}
                  onClick={handleSubmit}
                  onMouseEnter={() => setIsHovered({...isHovered, submitBtn: true})}
                  onMouseLeave={() => setIsHovered({...isHovered, submitBtn: false})}
                >
                  <Save className="w-5 h-5 mr-2 " />Add Product
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;