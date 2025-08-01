'use client'
import { useState } from 'react';

const backgrounds = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66",
    name: "Classic Library"
  },
  {
    id: 2, 
    url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570",
    name: "Modern Library"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f",
    name: "Study Space"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da",
    name: "Library Interior"
  }
];

const Front = () => {
  const [currentBg, setCurrentBg] = useState(0);
  
  const handleNavigation = (path) => {
    window.location.href = path;
  };
  
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-700 py-6 px-4 shadow-lg">
        <h1 className="text-4xl md:text-5xl font-bold text-center text-white tracking-wide">
          Library Management System
        </h1>
      </header>

      {/* Background Selector */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        {backgrounds.map((bg, index) => (
          <button
            key={bg.id}
            onClick={() => setCurrentBg(index)}
            className={`w-3 h-3 rounded-full ${currentBg === index ? 'bg-white' : 'bg-white/50'}`}
          />
        ))}
      </div>

      {/* Main content */}
      <main className="relative min-h-[calc(100vh-88px)]">
        {/* Background image with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000"
          style={{ backgroundImage: `url('${backgrounds[currentBg].url}')` }}
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
        </div>

        {/* Content */}
        <div className="relative flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 p-8 min-h-[calc(100vh-88px)]">
          {/* User Card */}
          <div className="group w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl">
            <div className="p-8">
              <div className="bg-blue-50 rounded-full p-6 mb-6 w-32 h-32 mx-auto">
                <img 
                  src="./login.png"
                  alt="User login"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Student Portal
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Access your student account to manage borrowed books and reservations
              </p>
              <button 
                onClick={() => handleNavigation('/login')}
                className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl text-lg font-medium transition-all duration-300 hover:from-blue-600 hover:to-blue-700 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Login as Student
              </button>
            </div>
          </div>

          {/* Admin Card */}
          <div className="group w-full max-w-sm bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl">
            <div className="p-8">
              <div className="bg-blue-50 rounded-full p-6 mb-6 w-32 h-32 mx-auto">
                <img 
                  src="./user.png"
                  alt="Admin login"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                Admin Dashboard
              </h2>
              <p className="text-gray-600 text-center mb-6">
                Manage library resources, users, and administrative functions
              </p>
              <button
                onClick={() => handleNavigation('/adminlogin')}
                className="w-full py-4 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl text-lg font-medium transition-all duration-300 hover:from-gray-800 hover:to-gray-900 hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Login as Admin
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Front;