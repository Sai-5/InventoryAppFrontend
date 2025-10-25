import React, { useState, useEffect } from 'react';
import { FiX, FiChevronLeft, FiChevronRight, FiSave, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';
import inventoryService from '../services/inventoryService';

const InventoryItem = ({ item, onClose, onUpdate }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    quantity: '',
    sku: '',
    category: 'General',
    image: null,
    imagePreview: ''
  });
  
  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        price: item.price ? parseFloat(item.price).toFixed(2) : '',
        quantity: item.quantity || '',
        sku: item.sku || '',
        category: item.category || 'General',
        image: null,
        imagePreview: item.imageUrl ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${item.imageUrl[0] || item.imageUrl}` : ''
      });
    }
  }, [item]);
  
  if (!item) return null;
  
  // Get the base URL from environment variables or use a default
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  // Handle case where imageUrl might be an array or a single string
  const images = [];
  if (item.imageUrl) {
    if (Array.isArray(item.imageUrl)) {
      images.push(...item.imageUrl);
    } else {
      images.push(item.imageUrl);
    }
  }
  
  const hasMultipleImages = images.length > 1;
  
  const goToNextImage = () => {
    setCurrentImageIndex((prevIndex) => 
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const goToPrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      
      reader.readAsDataURL(file);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.quantity || !formData.price) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      const formDataToSend = new FormData();
      
      // Manually append each field with proper handling
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('price', formData.price);
      formDataToSend.append('quantity', formData.quantity);
      formDataToSend.append('sku', formData.sku || '');
      formDataToSend.append('category', formData.category || 'General');
      
      // Only append image if a new one was selected
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      } else if (formData.imagePreview && !formData.imagePreview.startsWith('data:')) {
        // If there's an existing image and no new image was selected
        formDataToSend.append('imageUrl', formData.imagePreview);
      }

      // Log the form data being sent
      const formDataObj = {};
      formDataToSend.forEach((value, key) => {
        formDataObj[key] = value;
      });
      console.log('Sending update with data:', formDataObj);
      
      const response = await inventoryService.update(item._id, formDataToSend);
      
      // Make sure the response has the expected structure
      if (!response) {
        throw new Error('No response received from server');
      }
      
      toast.success('Item updated successfully');
      setIsEditing(false);
      
      // Pass the updated item data to the parent component
      if (onUpdate) {
        onUpdate(response.data || response);
      }
    } catch (error) {
      console.error('Error updating item:', {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      
      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         'Failed to update item. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        setIsLoading(true);
        await inventoryService.remove(item._id);
        toast.success('Item deleted successfully');
        if (onUpdate) onUpdate();
        onClose();
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error(error.response?.data?.message || 'Failed to delete item');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Image Gallery */}
            <div className="md:w-1/2">
              <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
                {images.length > 0 ? (
                  <>
                    <img
                      src={`${API_BASE_URL}${images[currentImageIndex]}`}
                      alt={item.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/400?text=Image+Not+Available';
                      }}
                    />
                    
                    {hasMultipleImages && (
                      <>
                        <button
                          onClick={goToPrevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                          aria-label="Previous image"
                        >
                          <FiChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={goToNextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
                          aria-label="Next image"
                        >
                          <FiChevronRight className="h-6 w-6" />
                        </button>
                        
                        {/* Image Indicators */}
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`h-2 w-2 rounded-full ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                              }`}
                              aria-label={`Go to image ${index + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <span>No image available</span>
                  </div>
                )}
              </div>
              
              {/* Thumbnails */}
              {hasMultipleImages && images.length > 1 && (
                <div className="mt-4 flex space-x-2 overflow-x-auto py-2">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-16 h-16 border-2 rounded overflow-hidden ${
                        index === currentImageIndex ? 'border-indigo-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={`${API_BASE_URL}${img}`}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {/* Item Details */}
            <div className="md:w-1/2 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                {item.sku && (
                  <p className="text-sm text-gray-500 mt-1">SKU: {item.sku}</p>
                )}
              </div>
              
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">
                  ${parseFloat(item.price).toFixed(2)}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  {item.quantity} in stock
                </span>
              </div>
              
              {item.category && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Category</h4>
                  <p className="mt-1 text-sm text-gray-600 capitalize">
                    {item.category}
                  </p>
                </div>
              )}
              
              {item.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Description</h4>
                  <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                    {item.description}
                  </p>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleChange}
                          step="0.01"
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                        <input
                          type="number"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                      <input
                        type="text"
                        name="sku"
                        value={formData.sku}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="General">General</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Clothing">Clothing</option>
                        <option value="Food">Food</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Update Image
                      </label>
                      <div className="mt-1 flex items-center">
                        <label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50">
                          <span>Choose file</span>
                          <input
                            type="file"
                            name="image"
                            onChange={handleChange}
                            className="sr-only"
                            accept="image/*"
                          />
                        </label>
                        <span className="ml-2 text-sm text-gray-500">
                          {formData.image ? formData.image.name : 'No file chosen'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="flex-1 flex justify-center items-center bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                      >
                        {isLoading ? 'Saving...' : (
                          <>
                            <FiSave className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        disabled={isLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center bg-indigo-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <FiEdit2 className="mr-2 h-4 w-4" />
                      Edit Item
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      disabled={isLoading}
                    >
                      <FiTrash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                    <button
                      type="button"
                      className="flex-1 bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      onClick={onClose}
                      disabled={isLoading}
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryItem;
