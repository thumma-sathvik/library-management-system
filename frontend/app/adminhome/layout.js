'use client'
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Book, 
  Users, 
  History, 
  BarChart2, 
  Settings, 
  LogOut, 
  ChevronDown,
  Menu as MenuIcon,
  Bell,
  User,
  X as CloseIcon,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Library
} from 'lucide-react';
import Link from 'next/link';
import '../globals.css';
import axios from 'axios';
import Notification from './Notification/page';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const AdminLayout = ({ children }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [isMobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [libraryInfo, setLibraryInfo] = useState({
    name: "Loading...",
    address: "Loading...",
    email: "Loading..."
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get the current pathname to highlight active menu item
  const pathname = usePathname();

  // Define your color theme based on your dashboard
  const iconColors = {
    dashboard: "text-blue-600",
    books: "text-blue-600",
    users: "text-emerald-600",
    borrowings: "text-amber-600",
    reports: "text-indigo-600",
    logout: "text-red-600"
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/adminhome', description: 'Get an overview of your library', color: iconColors.dashboard },
    { icon: Book, label: 'Manage Books', href: '/admin/manage-books', description: 'Add, edit and remove books', color: iconColors.books },
    { icon: Users, label: 'Manage Users', href: '/admin/manage-users', description: 'View and manage user accounts', color: iconColors.users },
    { icon: History, label: 'Borrowing Records', href: '/admin/borrowing-records', description: 'Track all borrowing activities', color: iconColors.borrowings },
    { icon: BarChart2, label: 'Reports & Analytics', href: '/admin/reports', description: 'View insights and statistics', color: iconColors.reports },
  ];
  
  // Check if mobile view on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobileView(window.innerWidth < 768);
      // Auto-collapse sidebar on small screens
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    
    // Set initial state
    checkIfMobile();
    
    // Add event listener
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const fetchLibraryInfo = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:3002/adminuser', {
        withCredentials: true
      });
      setLibraryInfo(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching library data:', error);
      setError('Failed to load library information');
      setLibraryInfo({
        name: "Error loading",
        address: "Error loading",
        email: "Error loading"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLibraryInfo();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      // Close account popup when clicking outside
      if (showAccountPopup && 
          !event.target.closest('.account-popup') && 
          !event.target.closest('.account-button')) {
        setShowAccountPopup(false);
      }
      
      // Close mobile sidebar when clicking outside on mobile
      if (isMobileView && 
          isMobileSidebarOpen && 
          !event.target.closest('.sidebar') && 
          !event.target.closest('.menu-button')) {
        setMobileSidebarOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountPopup, isMobileView, isMobileSidebarOpen]);

  const toggleAccountPopup = () => {
    if (!showAccountPopup) {
      fetchLibraryInfo();
    }
    setShowAccountPopup(!showAccountPopup);
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:3002/logout', {}, { withCredentials: true });
      window.location.href = '/login';
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Function to check if a route is active
  const isRouteActive = (href) => {
    // For the dashboard, we want an exact match
    if (href === '/adminhome') {
      return pathname === '/adminhome';
    }
    // For other routes, we check if the pathname starts with the href
    return pathname.startsWith(href);
  };

  // Function to handle mobile menu toggle
  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!isMobileSidebarOpen);
  };

  // Handle navigation click on mobile - close sidebar after navigation
  const handleNavClick = () => {
    if (isMobileView) {
      setMobileSidebarOpen(false);
    }
  };

  // Format library name initial for the avatar
  const getLibraryInitial = () => {
    if (libraryInfo.name && libraryInfo.name !== "Loading..." && libraryInfo.name !== "Error loading") {
      return libraryInfo.name.charAt(0).toUpperCase();
    }
    return "L";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation - Black and white theme with subtle shadows */}
      <nav className="fixed top-0 w-full bg-white border-b border-gray-200 shadow-sm z-30">
        <div className="px-4 py-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={isMobileView ? toggleMobileSidebar : () => setSidebarCollapsed(!isSidebarCollapsed)}
                className="menu-button p-2 rounded-full hover:bg-gray-100 hover:text-gray-900 transition-colors"
                aria-label="Toggle menu"
              >
                <MenuIcon className="w-5 h-5 text-gray-700" />
              </button>
              
              <div className="font-bold text-xl text-gray-900 flex items-center">
                <Library className="h-6 w-6 text-gray-800 mr-2" />
                <span className="hidden xs:inline">LibraryHub</span>
                <span className="text-black ml-1">Admin</span>
              </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="md:block">
                <Notification />
              </div>

              {/* Account Button - Sleek black and white design */}
              <div className="relative">
                <button 
                  onClick={toggleAccountPopup}
                  className="account-button flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-sm">
                    {getLibraryInitial()}
                  </div>
                  <span className="hidden md:inline text-sm font-medium text-gray-800">{
                    libraryInfo.name !== "Loading..." && libraryInfo.name !== "Error loading" 
                      ? libraryInfo.name.split(' ')[0] 
                      : "Account"
                  }</span>
                  <ChevronDown className="hidden md:block w-4 h-4 text-gray-500" />
                </button>
                
                {/* Account Popup - Black and white theme */}
                {showAccountPopup && (
                  <div className="account-popup absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center text-white font-medium text-xl">
                          {getLibraryInitial()}
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900">Library Account</h3>
                          <p className="text-xs text-gray-500">Account Information</p>
                        </div>
                      </div>
                    </div>
                    
                    {isLoading ? (
                      <div className="p-6 text-center">
                        <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-gray-600">Loading library information...</p>
                      </div>
                    ) : error ? (
                      <div className="p-6 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                          <CloseIcon className="w-6 h-6 text-gray-500" />
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{error}</p>
                        <button 
                          onClick={fetchLibraryInfo}
                          className="px-4 py-2 text-sm bg-gray-800 hover:bg-black text-white rounded-lg transition-colors duration-200"
                        >
                          Retry
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 space-y-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center mb-3">
                            <BookOpen className="w-4 h-4 text-gray-700 mr-2" />
                            <label className="text-xs font-medium text-gray-500">LIBRARY NAME</label>
                          </div>
                          <p className="text-sm font-medium text-gray-800">{libraryInfo.name}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-medium text-gray-500">ADDRESS</label>
                          </div>
                          <p className="text-sm font-medium text-gray-700">{libraryInfo.address}</p>
                        </div>
                        
                        <div>
                          <div className="flex items-center mb-1">
                            <label className="text-xs font-medium text-gray-500">EMAIL</label>
                          </div>
                          <p className="text-sm font-medium text-gray-700">{libraryInfo.email}</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                      <button 
                        onClick={handleLogout}
                        className="w-full py-2 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar Overlay with smoother fade */}
      {isMobileView && isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-20 transition-opacity duration-300"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Enhanced with black and white styling */}
      <aside 
        className={`sidebar fixed left-0 top-0 mt-16 h-full bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ease-in-out z-30
          ${isMobileView 
            ? isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full' 
            : isSidebarCollapsed ? 'w-20' : 'w-64'
          }
        `}
      >
        {/* Mobile sidebar header with close button */}
        {isMobileView && (
          <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-bold text-gray-900 flex items-center">
              <Library className="h-5 w-5 text-gray-700 mr-2" />
              Menu
            </h2>
            <button 
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
            >
              <CloseIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        )}

        {/* Sidebar toggle button for desktop */}
        {!isMobileView && (
          <button
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors hidden md:flex"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            )}
          </button>
        )}

        <div className="flex flex-col h-full">
          <div className="flex-1 py-6 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <ul className="space-y-1.5 px-3">
              {menuItems.map((item) => {
                const isActive = isRouteActive(item.href);
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      onClick={handleNavClick}
                      className={`group flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                        isActive 
                          ? 'bg-gray-100 text-gray-900' 
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className={`flex items-center justify-center w-8 h-8 ${
                        isActive ? item.color : 'text-gray-500 group-hover:text-gray-900'
                      }`}>
                        <item.icon className="w-5 h-5" />
                      </div>
                      
                      {(!isSidebarCollapsed || isMobileView) && (
                        <div className="ml-3 overflow-hidden">
                          <span className="font-medium">{item.label}</span>
                          {!isSidebarCollapsed && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>
                          )}
                        </div>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Sidebar Footer with improved styling and red logout button */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button 
              onClick={handleLogout}
              className={`flex items-center w-full px-3 py-2.5 text-gray-700 hover:bg-red-50 rounded-lg transition-colors duration-200 ${isSidebarCollapsed && !isMobileView ? 'justify-center' : ''}`}
            >
              <div className="flex items-center justify-center w-8 h-8 text-red-600">
                <LogOut className="w-5 h-5" />
              </div>
              {(!isSidebarCollapsed || isMobileView) && <span className="ml-3 font-medium">Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content with improved padding and transitions */}
      <main 
        className={`pt-16 transition-all duration-300 ${
          isMobileView 
            ? 'ml-0' // No margin on mobile as sidebar is overlay style
            : isSidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <div className="p-4 md:p-6 max-w-screen-2xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;