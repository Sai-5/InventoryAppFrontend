import React from "react";
import { Link } from "react-router-dom";
import {
  FiPackage,
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiBox,
} from "react-icons/fi";

const AdminDashboard = () => {
  const stats = [
    {
      label: "Total Products",
      value: "1,234",
      change: "+12%",
      changeType: "increase",
      icon: <FiPackage className="h-4 w-4" />,
    },
    {
      label: "Total Orders",
      value: "568",
      change: "+5.5%",
      changeType: "increase",
      icon: <FiShoppingBag className="h-4 w-4" />,
    },
    {
      label: "Total Revenue",
      value: "$24,780",
      change: "+8.1%",
      changeType: "increase",
      icon: <FiDollarSign className="h-4 w-4" />,
    },
    {
      label: "In Stock",
      value: "845",
      change: "-2.3%",
      changeType: "decrease",
      icon: <FiBox className="h-4 w-4" />,
    },
  ];

  const quickActions = [
    {
      title: "Inventory",
      description: "Manage stock & pricing",
      icon: <FiPackage className="h-5 w-5" />,
      path: "/admin/inventory",
      gradient: "from-blue-500 to-blue-600",
      image: "https://img.icons8.com/color/48/box.png",
    },
    {
      title: "Users",
      description: "Manage accounts",
      icon: <FiUsers className="h-5 w-5" />,
      path: "/admin/users",
      gradient: "from-green-500 to-green-600",
      image: "https://img.icons8.com/color/48/user-group-man-man.png",
    },
    {
      title: "Orders",
      description: "View all orders",
      icon: <FiShoppingBag className="h-5 w-5" />,
      path: "/admin/orders",
      gradient: "from-purple-500 to-purple-600",
      image: "https://img.icons8.com/color/48/shopping-cart.png",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-6">

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <h2 className="text-md font-semibold text-gray-800 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, idx) => (
            <Link key={idx} to={action.path} className="group">
              <div className="bg-white shadow rounded-md p-4 flex items-center hover:shadow-lg transition">
                {/* Small Image */}
                <img
                  src={action.image}
                  alt={action.title}
                  className="h-8 w-8 rounded-md object-contain"
                />
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-500">{action.description}</p>
                  {/* Removed arrow icon */}
                  <div className="mt-1 text-xs font-medium text-blue-600 group-hover:text-blue-800">
                    Go to {action.title}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
