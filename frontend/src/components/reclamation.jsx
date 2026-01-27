import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import '../assets/css/reclamation.css';

function ReclamationForm({ product, onClose }) {
  const { authUser } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      // Create the reclamation data object
      const reclamationData = {
        message: `Reclamation: ${title}`,
        type: 'reclamation',
        reclamation: {
          title: title.trim(),
          description: description.trim(),
          urgency,
        },
        priority: urgency === 'high' ? 3 : urgency === 'medium' ? 2 : 1,
        timestamp: new Date(),
        submittedBy: authUser?.email || 'unknown@example.com',
        userRole: authUser?.role || 'operator',
        userEmail: authUser?.email || 'unknown@example.com'
      };

      // If there's a product associated with this reclamation
      if (product) {
        reclamationData.brand = product.brand || '';
        reclamationData.model = product.model || '';
        reclamationData.message = `Reclamation for ${product.name}: ${title}`;
      }

      console.log('Submitting reclamation:', reclamationData);
      
      // Send the request with error handling
     // In handleSubmit function, change the API endpoint:
const response = await axios.post('http://localhost:5100/api/reclamations', {
  title: title.trim(),
  description: description.trim(),
  urgency,
  submittedBy: authUser?.email || 'unknown@example.com',
  userEmail: authUser?.email || 'unknown@example.com',
  userRole: authUser?.role || 'operator',
  product: product ? {
    name: product.name,
    brand: product.brand || '',
    model: product.model || '',
    productId: product._id
  } : null,
  priority: urgency === 'high' ? 3 : urgency === 'medium' ? 2 : 1
}, {
  headers: {
    'Content-Type': 'application/json'
  }
});
      
      console.log('Reclamation submitted successfully:', response.data);
      toast.success('Reclamation submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting reclamation:', error);
      
      // Detailed error information
      if (error.response) {
        // The server responded with an error status
        console.error('Server response data:', error.response.data);
        console.error('Server response status:', error.response.status);
        console.error('Server response headers:', error.response.headers);
        
        toast.error(`Server error: ${error.response.status} - ${error.response.data.message || 'Please check the data and try again'}`);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        toast.error('Network error: No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request
        console.error('Request setup error:', error.message);
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <div className="reclamation-modal-overlay" onClick={onClose}>
      <div className="reclamation-modal-container" onClick={e => e.stopPropagation()}>
        <div className="reclamation-modal-header">
          <h3>Submit Reclamation</h3>
          <button className="reclamation-modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="reclamation-modal-body">
            {product && (
              <div className="reclamation-modal-section">
                <div className="reclamation-product-info">
                  <h4>Product Information</h4>
                  <p><strong>Name:</strong> {product.name}</p>
                  {product.brand && <p><strong>Brand:</strong> {product.brand}</p>}
                  {product.model && <p><strong>Model:</strong> {product.model}</p>}
                </div>
              </div>
            )}
            
            <div className="reclamation-modal-section">
              <div className="reclamation-form-group">
                <label htmlFor="reclamation-title">Title *</label>
                <input
                  type="text"
                  id="reclamation-title"
                  className="reclamation-form-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief description of the issue"
                  disabled={submitting}
                  required
                />
              </div>
              
              <div className="reclamation-form-group">
                <label htmlFor="reclamation-description">Description *</label>
                <textarea
                  id="reclamation-description"
                  className="reclamation-form-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detailed explanation of the issue..."
                  disabled={submitting}
                  required
                ></textarea>
              </div>
              
              <div className="reclamation-form-group">
                <label htmlFor="reclamation-urgency">Urgency</label>
                <select
                  id="reclamation-urgency"
                  className="reclamation-form-select"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  disabled={submitting}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="reclamation-modal-footer">
            <button 
              type="button" 
              className="reclamation-btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="reclamation-btn-primary" 
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Submitting...
                </>
              ) : (
                'Submit Reclamation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReclamationForm;