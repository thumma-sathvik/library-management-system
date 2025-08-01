'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, BookOpen, Package, User, Calendar, 
  UserCircle, ArrowRight, Clock, GraduationCap, Phone, Mail, 
  ChevronDown, ChevronUp, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [purchases, setPurchases] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [hasFetchedData, setHasFetchedData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch current admin
        const adminResponse = await axios.get('http://localhost:3002/admin', {
          withCredentials: true,
        });
        const adminId = adminResponse.data.id;

        // Fetch all users
        const usersResponse = await axios.get('http://localhost:3002/users', {
          withCredentials: true,
        });
        setUsers(usersResponse.data);

        // Fetch borrowing records for this admin
        const borrowingRecordsResponse = await axios.get(`http://localhost:3002/borrowing-records?adminId=${adminId}`, {
          withCredentials: true,
        });

        // Organize purchases by user
        const purchasesByUser = {};
        borrowingRecordsResponse.data.forEach(record => {
          if (record.userId && record.userId._id) {
            const userId = record.userId._id;
            if (!purchasesByUser[userId]) {
              purchasesByUser[userId] = [];
            }
            purchasesByUser[userId].push({
              _id: record._id,
              bookTitle: record.bookId?.title || 'Unknown Book',
              bookAuthor: record.bookId?.author || 'Unknown Author',
              bookCover: record.bookId?.imgSrc,
              borrowedAt: record.borrowedAt,
              dueDate: record.dueDate,
              status: record.status || 'Active'
            });
          }
        });
        
        setPurchases(purchasesByUser);
        setHasFetchedData(true);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Enhanced search helper function
  const searchMatch = (text, searchTerm) => {
    if (!text) return false;
    const searchLower = searchTerm.toLowerCase().trim();
    const textLower = text.toLowerCase().trim();
    
    // Exact match
    if (textLower === searchLower) return true;
    
    // Contains match
    if (textLower.includes(searchLower)) return true;
    
    // Word boundary match (e.g., "john" matches "John Smith")
    const words = textLower.split(/\s+/);
    return words.some(word => word.startsWith(searchLower));
  };

  // Updated filter function with improved search
  const filteredUsers = users.filter(user => {
    if (!searchTerm.trim()) {
      // Show all users with borrowing records when no search term
      return Object.keys(purchases).includes(user._id);
    }

    // Check if user has any borrowing records
    const hasPurchases = Object.keys(purchases).includes(user._id);
    if (!hasPurchases) return false;

    // Comprehensive search across multiple fields
    return (
      searchMatch(user.name, searchTerm) ||          // Match name
      searchMatch(user.email, searchTerm) ||         // Match email
      searchMatch(user.education, searchTerm) ||     // Match education
      searchMatch(user.phoneNumber, searchTerm) ||   // Match phone
      
      // Search in borrowed books
      purchases[user._id]?.some(purchase => 
        searchMatch(purchase.bookTitle, searchTerm) ||   // Match book title
        searchMatch(purchase.bookAuthor, searchTerm)     // Match book author
      )
    );
  });

  // Toggle user details expansion
  const toggleUserDetails = (userId) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Function to check if a date is overdue
  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const dueDate = new Date(dateString);
    const now = new Date();
    return now > dueDate;
  };
  
  // Get days remaining or overdue
  const getDaysText = (dateString) => {
    if (!dateString) return '';
    
    const now = new Date();
    const dueDate = new Date(dateString);
    const overdue = now > dueDate;
    
    const diffTime = Math.abs(now - dueDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return overdue 
      ? `${diffDays} day${diffDays !== 1 ? 's' : ''} overdue` 
      : `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-500 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Simple Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Library Users</h1>
          <p className="text-gray-600 mt-1">Manage and view users who have borrowed books</p>
        </div>
        
        {/* Just Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, education, phone or borrowed books..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-gray-900"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 relative mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-gray-200 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <UserCircle className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              <p className="text-gray-600">Loading user data...</p>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">Error loading data</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 text-sm font-medium text-red-700 hover:text-red-900 flex items-center"
                  >
                    Refresh data
                    <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Empty State */}
          {!loading && !error && hasFetchedData && filteredUsers.length === 0 && (
            <div className="py-16 px-4">
              <div className="max-w-md mx-auto text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">No users found</h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  {searchTerm
                    ? "No users match your search criteria."
                    : "There are no users who have borrowed books yet."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Clear search
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* User List */}
          {(!loading && !error && filteredUsers.length > 0) && (
            <div className="divide-y divide-gray-100">
              {filteredUsers.map(user => (
                <div key={user._id} className="group">
                  {/* User Summary */}
                  <div className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center mb-4 md:mb-0">
                        <div className="h-10 w-10 bg-gradient-to-br from-blue-100 to-blue-50 text-blue-700 font-medium rounded-full flex items-center justify-center flex-shrink-0 border border-blue-200">
                          {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <h3 className="font-semibold text-gray-900 text-lg">{user.name}</h3>
                          </div>
                          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1">
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-3.5 w-3.5 mr-1 text-gray-400" />
                              <span>{user.email}</span>
                            </div>
                            {user.education && (
                              <div className="flex items-center text-sm text-gray-600">
                                <GraduationCap className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                <span>{user.education}</span>
                              </div>
                            )}
                            {user.phoneNumber && (
                              <div className="flex items-center text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                <span>{user.phoneNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-start sm:items-center">
                        <div className="flex items-center mr-6">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mr-2">
                            <BookOpen className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Books Borrowed</span>
                            <p className="font-semibold text-gray-900">{purchases[user._id]?.length || 0}</p>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => toggleUserDetails(user._id)}
                          className={`mt-3 sm:mt-0 px-4 py-2 text-sm font-medium rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            expandedUser === user._id 
                              ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                              : 'bg-white text-blue-600 border-gray-300 hover:bg-gray-50 hover:text-blue-700'
                          }`}
                          aria-expanded={expandedUser === user._id}
                        >
                          <div className="flex items-center">
                            {expandedUser === user._id ? (
                              <>
                                <ChevronUp className="h-4 w-4 mr-1" />
                                <span>Hide Books</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-4 w-4 mr-1" />
                                <span>View Books</span>
                              </>
                            )}
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded User Details */}
                  {expandedUser === user._id && (
                    <div className="px-6 py-5 bg-gray-50 border-t border-gray-100">
                      <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-blue-600" />
                        Borrowed Books
                      </h4>
                      
                      {purchases[user._id] && purchases[user._id].length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {purchases[user._id].map((purchase, index) => {
                            const overdueStatus = isOverdue(purchase.dueDate);
                            
                            return (
                              <div 
                                key={`purchase-${user._id}-${index}`} 
                                className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                              >
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="font-medium text-gray-900 line-clamp-1">{purchase.bookTitle}</h5>
                                    
                                    {/* Status indicator */}
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      overdueStatus
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${
                                        overdueStatus ? 'bg-red-600' : 'bg-green-600'
                                      }`}></span>
                                      {overdueStatus ? 'Overdue' : 'Active'}
                                    </span>
                                  </div>
                                  
                                  <p className="text-sm text-gray-600 mb-3">by {purchase.bookAuthor}</p>
                                  
                                  <div className="space-y-1.5">
                                    <div className="flex items-center text-sm">
                                      <Package className="h-4 w-4 text-gray-400 mr-1.5" />
                                      <span className="text-gray-700">Borrowed: {formatDate(purchase.borrowedAt)}</span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm">
                                      <Calendar className="h-4 w-4 text-gray-400 mr-1.5" />
                                      <span className={`${overdueStatus ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                        Due: {formatDate(purchase.dueDate)}
                                      </span>
                                    </div>
                                    
                                    <div className="flex items-center text-sm">
                                      <Clock className="h-4 w-4 text-gray-400 mr-1.5" />
                                      <span className={`${overdueStatus ? 'text-red-600' : 'text-green-600'} text-xs font-medium`}>
                                        {getDaysText(purchase.dueDate)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg bg-white">
                          <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No borrowing records found for this user.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;