import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrash2, FiEdit, FiPackage, FiTag, FiImage } from 'react-icons/fi';
import { toast } from 'react-toastify';
import inventoryService from '../services/inventoryService';

function InventoryList({ items, onDelete, loading }) {
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!id) {
      toast.error("Error: No item selected for deletion");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(id);
      console.log('Deleting item with ID:', id);
      
      // Use the remove method from inventoryService
      const response = await inventoryService.remove(id);
      console.log('Delete response:', response);
      
      if (response && response.success === false) {
        throw new Error(response.message || 'Failed to delete item');
      }
      
      toast.success("Item deleted successfully");
      
      // Call the onDelete callback if provided
      if (typeof onDelete === 'function') {
        onDelete(id);
      }
    } catch (error) {
      console.error('Error deleting item:', {
        error,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Use the error message from the error object (which was enhanced in the service)
      const errorMessage = error.message || 'Failed to delete item';
      toast.error(errorMessage, { autoClose: 5000 });
    } finally {
      setDeletingId(null);
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= 5) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'In Stock', color: 'bg-green-100 text-green-800' };
  };

  const handleEditItem = (e, itemId) => {
    e.stopPropagation();
    navigate(`/admin/inventory/${itemId}/edit`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="mx-auto h-16 w-16 text-gray-400 mb-3">
          <FiPackage className="w-full h-full" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No items found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding a new item to your inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {items && items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => {
          const stockStatus = getStockStatus(item.quantity);
          
          return (
            <div
              key={item._id}
              className="group bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col h-full"
            >
              {/* Image Section with Status Badge */}
              <div className="relative h-48 bg-gray-50 overflow-hidden">
                {item.imageUrl ? (
                  <img
                    src={`http://localhost:5000${item.imageUrl}`}    
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                    <FiImage className="w-12 h-12 mb-2" />
                    <span className="text-xs">No Image</span>
                  </div>
                )}
                <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                  {stockStatus.text}
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
                    {item.name}
                  </h3>
                  <span className="text-sm font-bold text-indigo-600 whitespace-nowrap ml-2">
                    ${parseFloat(item.price).toFixed(2)}
                  </span>
                </div>

                {item.sku && (
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <FiTag className="mr-1.5 flex-shrink-0" />
                    <span className="truncate">{item.sku}</span>
                  </div>
                )}

                {item.category && (
                  <div className="mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {item.category}
                    </span>
                  </div>
                )}

                <div className="mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FiPackage className="text-gray-400 mr-1.5" />
                      <span className="text-sm text-gray-600">
                        {item.quantity} in stock
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => handleDelete(e, item._id)}
                        disabled={deletingId === item._id}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete item"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleEditItem(e, item._id)}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="View/Edit item"
                      >
                        <FiEdit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No items found</p>
        </div>
      )}
    </div>
  );
}

export default InventoryList;
