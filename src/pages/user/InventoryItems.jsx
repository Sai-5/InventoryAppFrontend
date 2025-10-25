// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { FiSearch, FiShoppingCart, FiPlus, FiInfo, FiImage, FiPackage, FiStar } from 'react-icons/fi';
// import { toast } from 'react-toastify';
// import inventoryService from '../../services/inventoryService';
// import { useCart } from '../../contexts/CartContext';
// import { API_URL } from '../../config';

// // Skeleton Loader Component
// const ProductCardSkeleton = () => (
//   <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
//     <div className="h-56 bg-gray-200"></div>
//     <div className="p-5">
//       <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
//       <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
//       <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
//       <div className="h-10 bg-gray-200 rounded mt-4"></div>
//     </div>
//   </div>
// );

// const InventoryItems = () => {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [addingToCart, setAddingToCart] = useState({});
//   const navigate = useNavigate();
//   const { addToCart, cart } = useCart();

//   // Fetch items from the backend
//   useEffect(() => {
//     const fetchItems = async () => {
//       try {
//         setLoading(true);
//         console.log('Starting to fetch items...');
        
//         // First, try with the service
//         console.log('Trying with inventoryService...');
//         try {
//           const serviceResponse = await inventoryService.getAll();
//           console.log('Service response received:', {
//             type: typeof serviceResponse,
//             isArray: Array.isArray(serviceResponse),
//             data: serviceResponse
//           });
          
//           if (Array.isArray(serviceResponse)) {
//             console.log(`Received ${serviceResponse.length} items from service`);
//             setItems(serviceResponse);
//             return;
//           }
          
//           // If service returns object with data array
//           if (serviceResponse && Array.isArray(serviceResponse.data)) {
//             console.log(`Received ${serviceResponse.data.length} items in data property`);
//             setItems(serviceResponse.data);
//             return;
//           }
          
//           console.warn('Unexpected service response format, trying direct fetch...');
//         } catch (serviceError) {
//           console.warn('Service call failed, trying direct fetch...', serviceError);
//         }
        
//         // If service call fails, try direct fetch
//         const token = localStorage.getItem('userJwtToken');
//         console.log('Attempting direct fetch to API...');
        
//         const response = await fetch('http://localhost:5000/api/items', {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             ...(token ? { 'Authorization': `Bearer ${token}` } : {})
//           }
//         });
        
//         console.log('Direct fetch status:', response.status);
        
//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
//         }
        
//         const data = await response.json();
//         console.log('Direct fetch response data:', {
//           type: typeof data,
//           isArray: Array.isArray(data),
//           data: data
//         });
        
//         // Handle different response formats
//         if (Array.isArray(data)) {
//           setItems(data);
//         } else if (data && Array.isArray(data.data)) {
//           setItems(data.data);
//         } else if (data && data.success && Array.isArray(data.items)) {
//           setItems(data.items);
//         } else {
//           console.warn('Unexpected response format, trying to extract items from response object');
//           // Try to find an array in the response
//           const possibleArray = Object.values(data).find(Array.isArray);
//           if (Array.isArray(possibleArray)) {
//             setItems(possibleArray);
//           } else {
//             throw new Error('Could not find items array in response');
//           }
//         }
//       } catch (error) {
//         console.error('Error details:', {
//           message: error.message,
//           response: error.response?.data || 'No response data',
//           status: error.response?.status || 'No status'
//         });
//         toast.error(`Failed to load inventory items: ${error.message}`);
//         setItems([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchItems();
//   }, []);

//   // Handle adding item to cart
//   const handleAddToCart = async (item) => {
//     try {
//       setAddingToCart(prev => ({ ...prev, [item._id]: true }));
      
//       // Check if item is already in cart
//       const existingItem = cart.items.find(cartItem => 
//         cartItem.item?._id === item._id || cartItem._id === item._id
//       );
      
//       // If item exists in cart, increment quantity, else add new item
//       const quantity = existingItem ? existingItem.quantity + 1 : 1;
      
//       await addToCart(item._id, quantity);
//       toast.success(`${item.name} added to cart`);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       toast.error(error.response?.data?.message || 'Failed to add item to cart');
//     } finally {
//       setAddingToCart(prev => ({ ...prev, [item._id]: false }));
//     }
//   };

//   // Filter items based on search term
//   const filteredItems = items.filter(item => {
//     if (!searchTerm) return true;
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       item.name?.toLowerCase().includes(searchLower) ||
//       item.category?.toLowerCase().includes(searchLower) ||
//       item.description?.toLowerCase().includes(searchLower)
//     );
//   });

//   if (loading) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {[...Array(8)].map((_, i) => (
//             <ProductCardSkeleton key={i} />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (items.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
//           <FiShoppingCart className="h-6 w-6 text-blue-600" />
//         </div>
//         <h2 className="mt-3 text-lg font-medium text-gray-900">No items found</h2>
//         <p className="mt-1 text-gray-500">There are no items available in the inventory.</p>
//         <div className="mt-6">
//           <Link
//             to="/"
//             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             <FiArrowLeft className="mr-2" /> Back to Home
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gray-50 min-h-screen py-8">
//       <div className="container mx-auto px-4">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
//           <div className="mb-4 md:mb-0">
//             <h1 className="text-3xl font-bold text-gray-800">Our Products</h1>
//             <p className="text-gray-600 mt-1">Browse our collection of quality items</p>
//           </div>
          
//           {/* Search */}
//           <div className="w-full md:w-96">
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <FiSearch className="text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 placeholder="Search by name, category, or description..."
//                 className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//       {/* Products Grid */}
//       {filteredItems.length > 0 ? (
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {filteredItems.map((item) => (
//             <div 
//               key={item._id} 
//               className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
//             >
//               {/* Product Image */}
//               <div className="relative h-56 bg-gray-50 group overflow-hidden">
//                 <div className="w-full h-full flex items-center justify-center">
//                   {item.imageUrl ? (
//                     <img 
//                       src={
//                         item.imageUrl.startsWith('http') 
//                           ? item.imageUrl 
//                           : item.imageUrl.startsWith('/uploads/') 
//                             ? `${API_URL.replace('/api', '')}${item.imageUrl}`
//                             : item.imageUrl.startsWith('/') 
//                               ? `${API_URL}${item.imageUrl}`
//                               : `${API_URL}/${item.imageUrl}`
//                       }
//                       alt={item.name}
//                       className="w-full h-full object-contain p-4 transition-all duration-300 group-hover:scale-110"
//                       onError={(e) => {
//                         e.target.onerror = null;
//                         e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
//                       }}
//                       loading="lazy"
//                     />
//                   ) : (
//                     <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
//                       <FiImage className="h-12 w-12 text-gray-300 mb-2" />
//                       <span className="text-gray-400 text-sm">No image available</span>
//                     </div>
//                   )}
//                 </div>
                
//                 {/* Sale Badge */}
//                 {item.originalPrice && item.originalPrice > item.price && (
//                   <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
//                     SALE
//                   </div>
//                 )}
                
//                 {/* Rating Badge */}
//                 {item.rating && (
//                   <div className="absolute top-3 left-3 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
//                     <FiStar className="w-3 h-3 mr-1 fill-current" />
//                     {item.rating.toFixed(1)}
//                   </div>
//                 )}
                
//                 {/* Stock Status Badge */}
//                 {item.quantity <= 0 ? (
//                   <div className="absolute top-3 right-3 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
//                     <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
//                     Out of Stock
//                   </div>
//                 ) : (
//                   <div className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
//                     <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
//                     In Stock
//                   </div>
//                 )}
                
//                 {/* Quick View Button - Will be shown on hover */}
//                 <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
//                   <Link 
//                     to={`/items/${item._id}`}
//                     className="bg-white text-gray-800 hover:bg-gray-100 px-4 py-2 rounded-full text-sm font-medium shadow-md transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300 flex items-center"
//                   >
//                     <FiInfo className="mr-1.5" /> Quick View
//                   </Link>
//                 </div>
//               </div>
              
//               {/* Product Info */}
//               <div className="p-5 pt-3">
//                 <div className="flex justify-between items-start mb-2">
//                   <div className="flex-1 min-w-0">
//                     <h3 className="text-lg font-bold text-gray-900 truncate hover:text-blue-600 transition-colors">
//                       {item.name}
//                     </h3>
//                     {item.category && (
//                       <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 mb-1">
//                         {item.category}
//                       </span>
//                     )}
//                   </div>
//                   <div className="ml-2 flex-shrink-0 text-right">
//                     {item.originalPrice && item.originalPrice > item.price ? (
//                       <>
//                         <span className="text-xl font-bold text-red-600">
//                           ${item.price?.toFixed(2) || '0.00'}
//                         </span>
//                         <span className="block text-xs text-gray-500 line-through">
//                           ${item.originalPrice.toFixed(2)}
//                         </span>
//                       </>
//                     ) : (
//                       <span className="text-xl font-bold text-gray-900">
//                         ${item.price?.toFixed(2) || '0.00'}
//                       </span>
//                     )}
//                   </div>
//                 </div>
                
//                 <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem] mt-2">
//                   {item.description || 'No description available'}
//                 </p>
                
//                 <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
//                   <div className="flex items-center text-sm text-gray-500">
//                     <FiPackage className={`mr-1.5 ${item.quantity > 0 ? 'text-green-500' : 'text-red-500'}`} />
//                     <span className={item.quantity > 0 ? 'text-gray-600' : 'text-red-600 font-medium'}>
//                       {item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}
//                     </span>
//                   </div>
                  
//                   <button
//                     onClick={() => handleAddToCart(item)}
//                     disabled={item.quantity <= 0 || addingToCart[item._id]}
//                     className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
//                       item.quantity > 0 
//                         ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg' 
//                         : 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                     } ${addingToCart[item._id] ? 'opacity-75' : ''}`}
//                   >
//                     {addingToCart[item._id] ? (
//                       <>
//                         <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                           <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                           <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                         </svg>
//                         Adding...
//                       </>
//                     ) : (
//                       <>
//                         <FiShoppingCart className="mr-2" />
//                         {item.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : (
//         <div className="text-center py-12">
//           <svg
//             className="mx-auto h-12 w-12 text-gray-400"
//             fill="none"
//             viewBox="0 0 24 24"
//             stroke="currentColor"
//             aria-hidden="true"
//           >
//             <path
//               vectorEffect="non-scaling-stroke"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//               strokeWidth={2}
//               d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
//             />
//           </svg>
//           <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
//           <p className="mt-1 text-sm text-gray-500">
//             {searchTerm ? 'No items match your search.' : 'No items available at the moment.'}
//           </p>
//           <div className="mt-6">
//             <button
//               type="button"
//               onClick={() => window.location.reload()}
//               className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//             >
//               Refresh Page
//             </button>
//           </div>
//         </div>
//       )}
//       </div>
//     </div>
//   );
// };

// export default InventoryItems;



















// import React, { useState, useEffect } from 'react';
// import { useNavigate, Link } from 'react-router-dom';
// import { FiSearch, FiShoppingCart, FiImage, FiPackage, FiStar } from 'react-icons/fi';
// import { toast } from 'react-toastify';
// import inventoryService from '../../services/inventoryService';
// import { useCart } from '../../contexts/CartContext';
// import { API_URL } from '../../config';

// // Skeleton Loader Component
// const ProductCardSkeleton = () => (
//   <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 animate-pulse">
//     <div className="h-56 bg-gray-200"></div>
//     <div className="p-5">
//       <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
//       <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
//       <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
//       <div className="h-10 bg-gray-200 rounded mt-4"></div>
//     </div>
//   </div>
// );

// const InventoryItems = () => {
//   const [items, setItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [addingToCart, setAddingToCart] = useState({});
//   const navigate = useNavigate();
//   const { addToCart, cart } = useCart();

//   // Fetch items from the backend
//   useEffect(() => {
//     const fetchItems = async () => {
//       try {
//         setLoading(true);

//         try {
//           const serviceResponse = await inventoryService.getAll();
//           if (Array.isArray(serviceResponse)) {
//             setItems(serviceResponse);
//             return;
//           }
//           if (serviceResponse && Array.isArray(serviceResponse.data)) {
//             setItems(serviceResponse.data);
//             return;
//           }
//         } catch {
//           console.warn('Service failed, trying direct fetch...');
//         }

//         const token = localStorage.getItem('userJwtToken');
//         const response = await fetch('http://localhost:5000/api/items', {
//           method: 'GET',
//           headers: {
//             'Content-Type': 'application/json',
//             ...(token ? { 'Authorization': `Bearer ${token}` } : {})
//           }
//         });

//         if (!response.ok) {
//           const errorText = await response.text();
//           throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
//         }

//         const data = await response.json();
//         if (Array.isArray(data)) {
//           setItems(data);
//         } else if (data && Array.isArray(data.data)) {
//           setItems(data.data);
//         } else if (data && data.success && Array.isArray(data.items)) {
//           setItems(data.items);
//         } else {
//           const possibleArray = Object.values(data).find(Array.isArray);
//           if (Array.isArray(possibleArray)) {
//             setItems(possibleArray);
//           } else {
//             throw new Error('Could not find items array in response');
//           }
//         }
//       } catch (error) {
//         console.error('Error loading items:', error);
//         toast.error(`Failed to load inventory items: ${error.message}`);
//         setItems([]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchItems();
//   }, []);

//   // Handle adding item to cart
//   const handleAddToCart = async (item) => {
//     try {
//       setAddingToCart(prev => ({ ...prev, [item._id]: true }));
//       const existingItem = cart.items.find(cartItem =>
//         cartItem.item?._id === item._id || cartItem._id === item._id
//       );
//       const quantity = existingItem ? existingItem.quantity + 1 : 1;
//       await addToCart(item._id, quantity);
//       toast.success(`${item.name} added to cart`);
//     } catch (error) {
//       console.error('Error adding to cart:', error);
//       toast.error(error.response?.data?.message || 'Failed to add item to cart');
//     } finally {
//       setAddingToCart(prev => ({ ...prev, [item._id]: false }));
//     }
//   };

//   // Filter items based on search term
//   const filteredItems = items.filter(item => {
//     if (!searchTerm) return true;
//     const searchLower = searchTerm.toLowerCase();
//     return (
//       item.name?.toLowerCase().includes(searchLower) ||
//       item.category?.toLowerCase().includes(searchLower) ||
//       item.description?.toLowerCase().includes(searchLower)
//     );
//   });

//   if (loading) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {[...Array(8)].map((_, i) => (
//             <ProductCardSkeleton key={i} />
//           ))}
//         </div>
//       </div>
//     );
//   }

//   if (items.length === 0) {
//     return (
//       <div className="text-center py-12">
//         <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
//           <FiShoppingCart className="h-6 w-6 text-blue-600" />
//         </div>
//         <h2 className="mt-3 text-lg font-medium text-gray-900">No items found</h2>
//         <p className="mt-1 text-gray-500">There are no items available in the inventory.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="bg-gray-50 min-h-screen py-8">
//       <div className="container mx-auto px-4">
//         {/* Header + Search */}
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
//           <div className="mb-4 md:mb-0">
//             <h1 className="text-3xl font-bold text-gray-800">Our Products</h1>
//             <p className="text-gray-600 mt-1">Browse our collection of quality items</p>
//           </div>
//           <div className="w-full md:w-96">
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <FiSearch className="text-gray-400" />
//               </div>
//               <input
//                 type="text"
//                 placeholder="Search by name, category, or description..."
//                 className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
//                 value={searchTerm}
//                 onChange={(e) => setSearchTerm(e.target.value)}
//               />
//             </div>
//           </div>
//         </div>

//         {/* Products Grid */}
//         {filteredItems.length > 0 ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {filteredItems.map((item) => (
//               <div
//                 key={item._id}
//                 className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 border border-gray-100"
//               >
//                 {/* Product Image */}
//                 <div className="relative h-56 bg-gray-50 group overflow-hidden">
//                   <div className="w-full h-full flex items-center justify-center">
//                     {item.imageUrl ? (
//                       <img
//                         src={
//                           item.imageUrl.startsWith('http')
//                             ? item.imageUrl
//                             : item.imageUrl.startsWith('/uploads/')
//                               ? `${API_URL.replace('/api', '')}${item.imageUrl}`
//                               : item.imageUrl.startsWith('/')
//                                 ? `${API_URL}${item.imageUrl}`
//                                 : `${API_URL}/${item.imageUrl}`
//                         }
//                         alt={item.name}
//                         className="w-full h-full object-contain p-4 transition-all duration-300 group-hover:scale-110"
//                         onError={(e) => {
//                           e.target.onerror = null;
//                           e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
//                         }}
//                         loading="lazy"
//                       />
//                     ) : (
//                       <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 p-4 text-center">
//                         <FiImage className="h-12 w-12 text-gray-300 mb-2" />
//                         <span className="text-gray-400 text-sm">No image available</span>
//                       </div>
//                     )}
//                   </div>

//                   {/* Sale Badge */}
//                   {item.originalPrice && item.originalPrice > item.price && (
//                     <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
//                       SALE
//                     </div>
//                   )}

//                   {/* Rating Badge */}
//                   {item.rating && (
//                     <div className="absolute top-3 left-3 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-0.5 rounded-full flex items-center">
//                       <FiStar className="w-3 h-3 mr-1 fill-current" />
//                       {item.rating.toFixed(1)}
//                     </div>
//                   )}

//                   {/* Stock Status */}
//                   {item.quantity <= 0 ? (
//                     <div className="absolute top-3 right-3 bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
//                       <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
//                       Out of Stock
//                     </div>
//                   ) : (
//                     <div className="absolute top-3 right-3 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
//                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
//                       In Stock
//                     </div>
//                   )}
//                 </div>

//                 {/* Product Info */}
//                 <div className="p-5 pt-3">
//                   <div className="flex justify-between items-start mb-2">
//                     <div className="flex-1 min-w-0">
//                       <h3 className="text-lg font-bold text-gray-900 truncate hover:text-blue-600 transition-colors">
//                         {item.name}
//                       </h3>
//                       {item.category && (
//                         <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full mt-2 mb-1">
//                           {item.category}
//                         </span>
//                       )}
//                     </div>
//                     <div className="ml-2 flex-shrink-0 text-right">
//                       {item.originalPrice && item.originalPrice > item.price ? (
//                         <>
//                           <span className="text-xl font-bold text-red-600">
//                             ${item.price?.toFixed(2) || '0.00'}
//                           </span>
//                           <span className="block text-xs text-gray-500 line-through">
//                             ${item.originalPrice.toFixed(2)}
//                           </span>
//                         </>
//                       ) : (
//                         <span className="text-xl font-bold text-gray-900">
//                           ${item.price?.toFixed(2) || '0.00'}
//                         </span>
//                       )}
//                     </div>
//                   </div>

//                   <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem] mt-2">
//                     {item.description || 'No description available'}
//                   </p>

//                   <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
//                     <div className="flex items-center text-sm text-gray-500">
//                       <FiPackage className={`mr-1.5 ${item.quantity > 0 ? 'text-green-500' : 'text-red-500'}`} />
//                       <span className={item.quantity > 0 ? 'text-gray-600' : 'text-red-600 font-medium'}>
//                         {item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}
//                       </span>
//                     </div>

//                     <button
//                       onClick={() => handleAddToCart(item)}
//                       disabled={item.quantity <= 0 || addingToCart[item._id]}
//                       className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
//                         item.quantity > 0
//                           ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg'
//                           : 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                       } ${addingToCart[item._id] ? 'opacity-75' : ''}`}
//                     >
//                       {addingToCart[item._id] ? (
//                         <>
//                           <svg
//                             className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
//                             xmlns="http://www.w3.org/2000/svg"
//                             fill="none"
//                             viewBox="0 0 24 24"
//                           >
//                             <circle
//                               className="opacity-25"
//                               cx="12"
//                               cy="12"
//                               r="10"
//                               stroke="currentColor"
//                               strokeWidth="4"
//                             ></circle>
//                             <path
//                               className="opacity-75"
//                               fill="currentColor"
//                               d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                             ></path>
//                           </svg>
//                           Adding...
//                         </>
//                       ) : (
//                         <>
//                           <FiShoppingCart className="mr-2" />
//                           {item.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-12">
//             <h3 className="mt-2 text-sm font-medium text-gray-900">No items found</h3>
//             <p className="mt-1 text-sm text-gray-500">
//               {searchTerm ? 'No items match your search.' : 'No items available at the moment.'}
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default InventoryItems;









import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FiSearch, FiShoppingCart, FiImage, FiPackage, FiStar,
  FiEye, FiZap, FiTrendingUp, FiTag, FiFilter,
  FiShield, FiAward
} from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import inventoryService from '../../services/inventoryService';
import { useCart } from '../../contexts/CartContext';
import { API_URL } from '../../config';

// Skeleton Loader
const ProductCardSkeleton = () => (
  <div className="group relative animate-fade-in-up">
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl blur opacity-20 animate-pulse-glow"></div>
    <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
      <div className="aspect-[4/3] bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100 relative overflow-hidden"></div>
      <div className="p-8 space-y-4">
        <div className="h-6 bg-slate-200 rounded-2xl animate-pulse"></div>
        <div className="h-4 bg-slate-200 rounded-xl w-3/4 animate-pulse"></div>
        <div className="h-4 bg-slate-200 rounded-xl w-1/2 animate-pulse"></div>
        <div className="flex items-center justify-between pt-4">
          <div className="h-8 bg-slate-200 rounded-full w-24 animate-pulse"></div>
          <div className="h-12 bg-slate-200 rounded-2xl w-36 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
);

// Background particles
const FloatingParticles = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <div
        key={i}
        className={`absolute w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-20 animate-float-${i % 3}`}
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${3 + Math.random() * 4}s`
        }}
      />
    ))}
  </div>
);

const InventoryItems = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingToCart, setAddingToCart] = useState({});
  const [filterVisible, setFilterVisible] = useState(false);
  const navigate = useNavigate();
  const { addToCart, cart } = useCart();

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const serviceResponse = await inventoryService.getAll();
        if (Array.isArray(serviceResponse)) {
          setItems(serviceResponse);
        } else if (serviceResponse?.data && Array.isArray(serviceResponse.data)) {
          setItems(serviceResponse.data);
        }
      } catch (error) {
        console.error('Error loading items:', error);
        toast.error('Failed to load inventory items');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Add to cart
  const handleAddToCart = async (item, event) => {
    try {
      setAddingToCart(prev => ({ ...prev, [item._id]: true }));
      const existingItem = cart.items.find(cartItem =>
        cartItem.item?._id === item._id || cartItem._id === item._id
      );
      const quantity = existingItem ? existingItem.quantity + 1 : 1;
      await addToCart(item._id, quantity);

      // Custom toast notification
      toast.success(
        <div className="flex items-center">
          <img 
            src={getImageUrl(item.imageUrl) || 'https://via.placeholder.com/50'} 
            alt={item.name}
            className="w-12 h-12 object-cover rounded mr-3"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/50';
            }}
          />
          <div>
            <div className="font-semibold">{item.name}</div>
            <div className="text-sm">Successfully added to cart!</div>
            <div className="text-xs text-gray-500">Quantity: {quantity}</div>
          </div>
        </div>,
        {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          className: 'bg-white text-gray-800 shadow-lg',
          bodyClassName: 'p-0',
        }
      );
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error(
        <div>
          <div className="font-semibold">Failed to add to cart</div>
          <div className="text-sm">{error.response?.data?.message || 'Please try again'}</div>
        </div>,
        {
          position: "bottom-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          className: 'bg-red-50 text-red-800',
        }
      );
    } finally {
      setAddingToCart(prev => ({ ...prev, [item._id]: false }));
    }
  };


  const getDiscountPercentage = (originalPrice, currentPrice) => {
    if (originalPrice && originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/uploads/')) return `${API_URL.replace('/api', '')}${imageUrl}`;
    if (imageUrl.startsWith('/')) return `${API_URL}${imageUrl}`;
    return `${API_URL}/${imageUrl}`;
  };

  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.name?.toLowerCase().includes(searchLower) ||
      item.category?.toLowerCase().includes(searchLower) ||
      item.description?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8">
          {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <FiShoppingCart className="w-20 h-20 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600">No Items Available</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      <ToastContainer 
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        toastClassName="bg-white text-gray-800 shadow-lg rounded-lg overflow-hidden"
        bodyClassName="p-0"
        progressClassName="bg-blue-500"
      />
      <FloatingParticles />
      <div className="container mx-auto px-4 py-12 relative z-10">
        {/* Search Bar */}
        <div className="max-w-3xl mx-auto mb-12">
          <div className="relative bg-white rounded-2xl shadow-md flex items-center px-4 py-2">
            <FiSearch className="text-gray-500 w-6 h-6 mr-2" />
            <input
              type="text"
              placeholder="Search products..."
              className="flex-1 px-4 py-2 text-lg bg-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">×</button>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredItems.map(item => {
            const discountPercentage = getDiscountPercentage(item.originalPrice, item.price);

            return (
              <div key={item._id} className="bg-white rounded-2xl shadow-lg overflow-hidden group">
                <div className="relative">
                  {item.imageUrl ? (
                    <img
                      src={getImageUrl(item.imageUrl)}
                      alt={item.name}
                      className="w-full h-60 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-60 flex items-center justify-center bg-gray-100">
                      <FiImage className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  {discountPercentage > 0 && (
                    <span className="absolute top-4 left-4 px-3 py-1 text-sm font-bold bg-red-500 text-white rounded-lg">
                      {discountPercentage}% OFF
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-xl font-bold text-blue-600">${item.price?.toFixed(2)}</span>
                      {item.originalPrice && item.originalPrice > item.price && (
                        <span className="text-sm text-gray-400 line-through ml-2">${item.originalPrice.toFixed(2)}</span>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${item.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.quantity > 0 ? `${item.quantity} left` : 'Sold Out'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleAddToCart(item, e)}
                    disabled={item.quantity <= 0 || addingToCart[item._id]}
                    className="w-full px-4 py-2 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {addingToCart[item._id] ? 'Adding...' : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InventoryItems;
