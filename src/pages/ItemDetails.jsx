// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { getItemById } from "../services/inventoryService";

// const ItemDetailsPage = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [item, setItem] = useState(null);

//   useEffect(() => {
//     getItemById(id).then((res) => setItem(res.data));
//   }, [id]);

//   if (!item) return <p>Loading item details...</p>;

//   return (
//     <div className="p-6">
//       <button
//         className="mb-4 px-4 py-2 bg-gray-300 rounded"
//         onClick={() => navigate(-1)}
//       >
//         Back
//       </button>
//       <h2 className="text-2xl font-bold mb-2">{item.name}</h2>
//       <p><strong>Quantity:</strong> {item.quantity}</p>
//       <p><strong>Price:</strong> ₹{item.price}</p>
//       <p><strong>Description:</strong> {item.description}</p>
//       <p><strong>Category:</strong> {item.category || "Uncategorized"}</p>
//     </div>
//   );
// };

// export default ItemDetailsPage;









import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getItemById } from "../services/inventoryService";

const ItemDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  useEffect(() => {
    getItemById(id).then((res) => setItem(res.data));
  }, [id]);

  if (!item)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600 animate-pulse">Loading item details...</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg p-6">
        {/* Back Button */}
        <button
          className="mb-4 px-4 py-2 bg-gradient-to-r from-gray-300 to-gray-400 rounded-lg shadow hover:from-gray-400 hover:to-gray-500 transition"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        {/* Item Title */}
        <h2 className="text-3xl font-bold text-indigo-700 mb-4">{item.name}</h2>

        {/* Item Details */}
        <div className="space-y-3 text-gray-700">
          <p>
            <span className="font-semibold">📦 Quantity:</span> {item.quantity}
          </p>
          <p>
            <span className="font-semibold">💰 Price:</span>{" "}
            <span className="text-green-600 font-bold">₹{item.price}</span>
          </p>
          <p>
            <span className="font-semibold">📝 Description:</span> {item.description}
          </p>
          <p>
            <span className="font-semibold">🏷 Category:</span>{" "}
            {item.category || "Uncategorized"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4">
          <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition">
            Edit Item
          </button>
          <button className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition">
            Delete Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemDetailsPage;
