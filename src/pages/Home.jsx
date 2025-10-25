import React from 'react';

function HomePage() {
  return (
    <div className="flex-1 w-full">
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700 text-white px-6 py-12">
        <div className="max-w-4xl w-full mx-auto text-center">
          {/* Hero Section */}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 drop-shadow-lg">
            Welcome to <span className="text-yellow-300">Inventory Management</span>
          </h1>
          
          <p className="text-lg md:text-xl text-gray-100 mb-10 max-w-2xl mx-auto">
            A simple and powerful way to manage your{' '}
            <span className="font-semibold text-white">stock, items, and prices</span>.
            <br />
            Stay organized, save time, and keep your business running smoothly.
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 text-left">
            {[
              {
                title: 'Easy Management',
                description: 'Intuitive interface for managing your inventory with ease.'
              },
              {
                title: 'Real-time Updates',
                description: 'Track stock levels and get updates in real-time.'
              },
              {
                title: 'Secure & Reliable',
                description: 'Your data is safe with our secure cloud storage.'
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-200">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
