import React, { useState, useRef } from "react";
import { toast } from 'react-toastify';
import inventoryService from "../services/inventoryService.js";
import { FiUpload } from 'react-icons/fi';

function InventoryForm({ onItemAdded }) {
  const [form, setForm] = useState({ 
    name: "", 
    sku: "",
    description: "",
    quantity: "", 
    price: "",
    category: "General",
    image: null,
    imagePreview: ""
  });
  
  const fileInputRef = useRef(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    if (form.quantity === '') {
      newErrors.quantity = 'Quantity is required';
    } else if (isNaN(Number(form.quantity)) || Number(form.quantity) < 0) {
      newErrors.quantity = 'Quantity must be a positive number';
    }
    
    if (form.price === '') {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(form.price)) || Number(form.price) <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    // Validate image file if present
    if (form.image) {
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(form.image.type)) {
        newErrors.image = 'Only JPG, JPEG, and PNG files are allowed';
      } else if (form.image.size > maxSize) {
        newErrors.image = 'Image size must be less than 5MB';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'image' && files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setForm(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
      };
      
      reader.readAsDataURL(file);
    } else {
      setForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      formData.append('name', form.name.trim());
      if (form.sku) formData.append('sku', form.sku);
      if (form.description) formData.append('description', form.description);
      formData.append('quantity', Number(form.quantity) || 0);
      formData.append('price', Number(form.price) || 0);
      formData.append('category', form.category || 'General');
      if (form.image) {
        formData.append('image', form.image);
      }
      
      try {
        const response = await inventoryService.create(formData);
        
        if ((response && response._id) || (response && response.success === true) || (response.data && response.data._id)) {
          const item = response.data || response;
          
          toast.success('Item added successfully!');
          setForm({ 
            name: "", 
            sku: "",
            description: "",
            quantity: "", 
            price: "",
            category: "General",
            image: null,
            imagePreview: ""
          });
          
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          if (typeof onItemAdded === 'function') {
            onItemAdded();
          }
          return; // Success, exit the function
        }
        
        // If we get here, the response format is unexpected
        console.error('Unexpected response format:', response);
        throw new Error('Received an unexpected response from the server');
        
      } catch (apiError) {
        console.error('API Error details:', {
          message: apiError.message,
          response: apiError.response,
          status: apiError.status,
          data: apiError.data
        });
        throw apiError; // Re-throw to be caught by the outer catch
      }
    } catch (error) {
      console.error('Error adding item:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add item';
      toast.error(errorMessage);
      setErrors(prev => ({
        ...prev,
        submit: errorMessage
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}


      <div className="sm:col-span-6">
  <label className="block text-sm font-medium text-gray-700">Item Image</label>
  <input
    type="file"
    name="image"
    id="image"
    accept="image/jpeg,image/png,image/jpg"
    onChange={handleChange}
    className="mt-2 block w-full text-sm text-gray-500 
               file:mr-4 file:py-2 file:px-4 
               file:rounded-md file:border-0 
               file:text-sm file:font-semibold 
               file:bg-indigo-50 file:text-indigo-700 
               hover:file:bg-indigo-100"
  />
  {errors.image && (
    <p className="mt-1 text-sm text-red-600">{errors.image}</p>
  )}
</div>


      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Item Name *
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="name"
              id="name"
              value={form.name}
              onChange={handleChange}
              className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.name ? 'border-red-500' : ''
              }`}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>
        </div>
        
        <div className="sm:col-span-3">
          <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
            SKU
          </label>
          <div className="mt-1">
            <input
              type="text"
              name="sku"
              id="sku"
              value={form.sku}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter SKU (optional)"
            />
          </div>
        </div>
      </div>
      
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          value={form.description}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter item description (optional)"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
            Quantity <span className="text-red-500">*</span>
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            value={form.quantity}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
              errors.quantity ? 'border-red-500' : ''
            }`}
            placeholder="0"
          />
          {errors.quantity && (
            <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700">
            Price ($) <span className="text-red-500">*</span>
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={handleChange}
              className={`block w-full pl-7 pr-12 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors.price ? 'border-red-500' : ''
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price}</p>
          )}
        </div>
        
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
          >
            <option value="General">General</option>
            <option value="Electronics">Electronics</option>
            <option value="Clothing">Clothing</option>
            <option value="Food">Food</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      
      <div className="pt-2 space-y-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
            isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Saving...' : 'Save Item'}
        </button>
        {errors.submit && (
          <p className="text-sm text-red-600 text-center">{errors.submit}</p>
        )}
      </div>
    </form>
  );
}

export default InventoryForm;






















