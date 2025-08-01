'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, User, BookOpen, Loader2, AlertCircle, RotateCcw, BookX, BookCheck } from 'lucide-react';

const BorrowingRecords = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortField, setSortField] = useState('borrowedAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [returningBook, setReturningBook] = useState(null);

  // Fetch admin data and orders
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch admin data to get the adminId
        const adminResponse = await axios.get('http://localhost:3002/admin', {
          withCredentials: true,
        });
        const adminId = adminResponse.data.id;
        setAdminId(adminId);

        // Fetch orders data
        const ordersResponse = await axios.get('http://localhost:3002/orders', {
          params: { adminId: adminId },
          withCredentials: true,
        });
        
        // Add computed status for each order
        const processedOrders = ordersResponse.data.map(order => {
          const now = new Date();
          const dueDate = new Date(order.dueDate);
          let status = 'Active';
          
          if (now > dueDate) {
            status = 'Overdue';
          }
          
          return {
            ...order,
            status
          };
        });
        
        setOrders(processedOrders);
        setFilteredOrders(processedOrders);
      } catch (error) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter and sort orders when dependencies change
  useEffect(() => {
    if (!orders.length) return;

    let result = [...orders];

    // Apply status filter
    if (filterStatus !== 'All') {
      result = result.filter(order => order.status === filterStatus);
    }

    // Apply search filter
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      result = result.filter(order => 
        order.userId?.name?.toLowerCase().includes(lowercaseSearch) ||
        order.bookId?.title?.toLowerCase().includes(lowercaseSearch) ||
        order._id?.toLowerCase().includes(lowercaseSearch)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let fieldA, fieldB;

      switch (sortField) {
        case 'borrowedAt':
          fieldA = new Date(a.borrowedAt);
          fieldB = new Date(b.borrowedAt);
          break;
        case 'dueDate':
          fieldA = new Date(a.dueDate);
          fieldB = new Date(b.dueDate);
          break;
        case 'userName':
          fieldA = a.userId?.name?.toLowerCase() || '';
          fieldB = b.userId?.name?.toLowerCase() || '';
          break;
        case 'bookTitle':
          fieldA = a.bookId?.title?.toLowerCase() || '';
          fieldB = b.bookId?.title?.toLowerCase() || '';
          break;
        default:
          fieldA = a[sortField];
          fieldB = b[sortField];
      }

      if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredOrders(result);
  }, [orders, searchTerm, filterStatus, sortField, sortDirection]);

  // Format date with better display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    const now = new Date();
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    
    // Calculate days difference
    const diffTime = Math.abs(date - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let relativeTime = '';
    if (date < now) {
      relativeTime = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      relativeTime = `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
    
    return {
      formatted: date.toLocaleDateString(undefined, options),
      relative: relativeTime
    };
  };

  // Handle book return
  const handleReturnBook = async (borrowId, bookId) => {
    try {
      setReturningBook(borrowId);
      
      console.log(`Processing return for borrow ID: ${borrowId}, Book ID: ${bookId}`);
      
      // Call the endpoint to return book
      const response = await axios.post(`http://localhost:3002/return-book/${borrowId}`, {}, {
        withCredentials: true
      });
      
      console.log('Return response:', response.data);
      
      if (response.status === 200) {
        // Remove the returned book from the orders list
        setOrders(prevOrders => prevOrders.filter(order => order._id !== borrowId));
        setFilteredOrders(prevFilteredOrders => prevFilteredOrders.filter(order => order._id !== borrowId));
        
        // Show success message with stock update information
        showToast(`Book '${response.data.bookTitle}' returned successfully. Stock updated to ${response.data.newStock}`, 'success');
      } else {
        throw new Error('Failed to return book');
      }
    } catch (error) {
      console.error('Error returning book:', error);
      showToast('Failed to return book. Please try again.', 'error');
    } finally {
      setReturningBook(null);
    }
  };

  // Toast notification helper
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 flex items-center ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`;
    
    const icon = document.createElement('span');
    icon.className = 'mr-2 flex-shrink-0';
    icon.innerHTML = type === 'success' 
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = message;
    
    toast.appendChild(icon);
    toast.appendChild(textSpan);
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);
  };

  // Calculate summary statistics
  const totalOrders = filteredOrders.length;
  const overdueOrders = filteredOrders.filter(order => order.status === 'Overdue').length;
  const activeOrders = filteredOrders.filter(order => order.status === 'Active').length;
  
  // If adminId is not available yet, show a better loading state
  if (!adminId) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center min-h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-800">Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Borrowing Records</h1>
            <p className="mt-2 text-slate-600">Track and manage book borrowings</p>
          </div>
        </div>

        {/* Stats Cards with Updated Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center border border-slate-200">
            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-indigo-600 text-white">
              <BookOpen size={24} />
            </div>
            <div className="ml-4">
              <p className="text-slate-500 text-sm font-medium">Total Records</p>
              <p className="text-2xl font-bold text-slate-800">{totalOrders}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center border border-slate-200">
            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-emerald-600 text-white">
              <BookCheck size={24} />
            </div>
            <div className="ml-4">
              <p className="text-slate-500 text-sm font-medium">Active Borrows</p>
              <p className="text-2xl font-bold text-slate-800">{activeOrders}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-5 flex items-center border border-slate-200">
            <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-rose-600 text-white">
              <BookX size={24} />
            </div>
            <div className="ml-4">
              <p className="text-slate-500 text-sm font-medium">Overdue Books</p>
              <p className="text-2xl font-bold text-slate-800">{overdueOrders}</p>
            </div>
          </div>
        </div>

        {/* Search and Filter with Updated Theme */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Search by user, book or ID..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-full py-2 pl-4 pr-10 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading or Error States */}
        {loading && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-800">Loading borrowing records...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-800">Failed to load data</h3>
              <p className="text-red-600 mt-1">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-900"
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Borrowed Books Grid View Only */}
        {!loading && !error && (
          <>
            {filteredOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => {
                  const borrowedDateInfo = formatDate(order.borrowedAt);
                  const dueDateInfo = formatDate(order.dueDate);
                  
                  return (
                    <div 
                      key={order._id} 
                      className={`relative bg-white rounded-xl shadow-sm overflow-hidden border ${
                        order.status === 'Overdue' ? 'border-red-200' : 'border-gray-100'
                      }`}
                    >
                      {order.status === 'Overdue' && (
                        <div className="absolute top-0 right-0 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded-bl-lg">
                          Overdue
                        </div>
                      )}
                      
                      <div className="p-5">
                        <div className="flex items-center mb-4">
                          <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-gray-900 leading-tight">{order.bookId.title}</h3>
                            <p className="text-sm text-gray-700">by {order.bookId.author}</p>
                          </div>
                        </div>
                        
                        <div className="border-t border-gray-100 pt-4">
                          <div className="flex items-center mb-3">
                            <User className="h-4 w-4 text-blue-500 mr-2" />
                            <span className="text-sm text-gray-800 font-medium">{order.userId.name}</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-xs text-gray-700 mb-1 font-medium">Borrowed</p>
                              <p className="text-sm font-medium text-gray-900">{borrowedDateInfo.formatted}</p>
                              <p className="text-xs text-gray-700">{borrowedDateInfo.relative}</p>
                            </div>
                            
                            <div className={`p-2 rounded-lg ${order.status === 'Overdue' ? 'bg-red-50' : 'bg-blue-50'}`}>
                              <p className="text-xs text-gray-700 mb-1 font-medium">Due Date</p>
                              <p className={`text-sm font-medium ${order.status === 'Overdue' ? 'text-red-700' : 'text-gray-900'}`}>
                                {dueDateInfo.formatted}
                              </p>
                              <p className={`text-xs ${order.status === 'Overdue' ? 'text-red-600' : 'text-gray-700'}`}>
                                {dueDateInfo.relative}
                              </p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleReturnBook(order._id, order.bookId._id)}
                            disabled={returningBook === order._id}
                            className={`w-full ${
                              order.status === 'Overdue' 
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            } px-3 py-2 rounded-lg font-medium inline-flex items-center justify-center transition-colors duration-150 ${
                              returningBook === order._id ? 'opacity-70 cursor-not-allowed' : ''
                            }`}
                          >
                            {returningBook === order._id ? (
                              <>
                                <Loader2 className="animate-spin h-4 w-4 mr-1.5" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4 mr-1.5" />
                                <span>Complete Return</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No borrowing records found</h3>
                <p className="text-gray-700 max-w-md mx-auto">
                  {searchTerm || filterStatus !== 'All' 
                    ? "Try adjusting your search or filters"
                    : "There are no borrowing records in the system yet"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BorrowingRecords;