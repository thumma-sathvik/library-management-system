'use client'
import axios from 'axios'
import React, { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Search, Calendar, BookOpen, Clock, Library, Filter, RefreshCw, Eye, ArrowRight } from 'lucide-react'

const BorrowedBooks = () => {
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'dueDate', direction: 'ascending' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchBorrowedBooks = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get('http://localhost:3002/borrowed-books', {
          withCredentials: true,
        });
        console.log(response.data);
        setBorrowedBooks(response.data.borrowedBooks);
        setError(null);
      } catch (error) {
        console.error('Error fetching borrowed books:', error);
        setError('Failed to load borrowed books. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBorrowedBooks();
  }, []);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate days remaining
 const getDueDate = (dueDate) => {
  // Ensure dueDate is a valid Date object
  const date = new Date(dueDate);
  
  // Format the due date in a readable format (e.g., 'Mar 30, 2025')
  const formattedDueDate = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',  // Abbreviated month (e.g., 'Mar', 'Feb')
    day: 'numeric'   // Day of the month (e.g., '30')
  });

  return formattedDueDate;
};


console.log(getDueDate()); // Example: "Mar 30, 2025"
const calculateDaysRemaining = (dueDate) => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const now = new Date();
  return Math.ceil((due - now) / (1000 * 3600 * 24));
};




  // Sort books
  const sortedBooks = React.useMemo(() => {
    let sortableBooks = [...borrowedBooks];
    if (sortConfig.key) {
      sortableBooks.sort((a, b) => {
        // Handle nested properties
        const keyParts = sortConfig.key.split('.');
        let aValue = a;
        let bValue = b;
        
        for (const part of keyParts) {
          aValue = aValue?.[part] ?? null;
          bValue = bValue?.[part] ?? null;
        }
        
        // Special case for dates
        if (sortConfig.key === 'dueDate' || sortConfig.key === 'borrowDate') {
          aValue = aValue ? new Date(aValue).getTime() : 0;
          bValue = bValue ? new Date(bValue).getTime() : 0;
        }
        
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableBooks;
  }, [borrowedBooks, sortConfig]);

  // Request sort
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Filter books based on search query and status
  const filteredBooks = sortedBooks.filter(book => {
    const matchesSearch = 
      (book.bookId?.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (book.bookId?.author?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (book.AdminId?.Library_name?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (filterStatus === 'All') return matchesSearch;
    if (filterStatus === 'Overdue') return matchesSearch && new Date(book.dueDate) < new Date();
    if (filterStatus === 'DueSoon') {
  const daysRemaining = calculateDaysRemaining(book.dueDate);
  return matchesSearch && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 10;
}
    if (filterStatus === 'Active') return matchesSearch && new Date(book.dueDate) >= new Date();
    return matchesSearch;
  });

  // Stats calculations
  const overdueCount = borrowedBooks.filter(book => new Date(book.dueDate) < new Date()).length;
  const dueSoonCount = borrowedBooks.filter(book => {
    const daysRemaining = getDueDate(book.dueDate);
    return daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 10;
  }).length;

  const stats = [
    { 
      title: 'Total Borrowed', 
      value: borrowedBooks.length, 
      icon: <BookOpen className="h-6 w-6 text-blue-500" />,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700'
    },
    { 
      title: 'Overdue Books', 
      value: overdueCount, 
      icon: <Clock className="h-6 w-6 text-red-500" />,
      bgColor: 'bg-red-50',
      textColor: 'text-red-700'
    },
    { 
      title: 'Due Soon', 
      value: dueSoonCount, 
      icon: <Calendar className="h-6 w-6 text-amber-500" />,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700'
    },
    { 
      title: 'Libraries', 
      value: [...new Set(borrowedBooks.map(book => book.libraryDetails?.name))].filter(Boolean).length, 
      icon: <Library className="h-6 w-6 text-indigo-500" />,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-700'
    }
  ];

  // Enhanced StatsCard Component
  const StatsCard = ({ title, value, icon, bgColor, textColor }) => (
    <div className={`${bgColor} p-6 rounded-xl shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-4">
            {icon}
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">{title}</p>
            <h3 className={`text-2xl font-bold mt-1 ${textColor}`}>{value}</h3>
          </div>
        </div>
      </div>
    </div>
  );

  // Get book status
const getBookStatus = (book) => {
  if (!book.dueDate) return { label: 'Unknown', class: 'bg-gray-100 text-gray-800', textColor: 'text-gray-800' };

  const daysRemaining = calculateDaysRemaining(book.dueDate);

  if (daysRemaining < 0) {
    return { 
      label: `Overdue by ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''}`, 
      class: 'bg-red-100 text-red-800 border border-red-200', 
      textColor: 'text-red-800'
    };
  }

  if (daysRemaining <= 3) {
    return { 
      label: `Due in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`, 
      class: 'bg-amber-100 text-amber-800 border border-amber-200',
      textColor: 'text-amber-800' 
    };
  }

  return { 
    label: 'Active', 
    class: 'bg-green-100 text-green-800 border border-green-200',
    textColor: 'text-green-800'
  };
};

  // Sort indicator
  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) {
      return null;
    }
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-4 w-4 ml-1 inline" /> 
      : <ChevronDown className="h-4 w-4 ml-1 inline" />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between pb-6 border-b border-gray-200 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Borrowed Books</h1>
            <p className="text-gray-600 mt-1">View and manage your library loans in one place</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center">
                <h2 className="text-lg font-semibold text-gray-900">Borrowed Books</h2>
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="ml-3 text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
              <div className="relative flex-1 md:max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by title, author, or library..."
                  className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Advanced filters panel */}
            {showFilters && (
              <div className="pt-4 pb-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select 
                    id="statusFilter"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="All">All Books</option>
                    <option value="Active">Active</option>
                    <option value="DueSoon">Due Soon</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select 
                    id="sortBy"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={sortConfig.key}
                    onChange={(e) => setSortConfig({ key: e.target.value, direction: 'ascending' })}
                  >
                    <option value="bookId.title">Title</option>
                    <option value="bookId.author">Author</option>
                    <option value="AdminId.Library_name">Library</option>
                    <option value="borrowDate">Borrow Date</option>
                    <option value="dueDate">Due Date</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 mb-1">
                    Direction
                  </label>
                  <select 
                    id="sortDirection"
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={sortConfig.direction}
                    onChange={(e) => setSortConfig({ ...sortConfig, direction: e.target.value })}
                  >
                    <option value="ascending">Ascending</option>
                    <option value="descending">Descending</option>
                  </select>
                </div>
              </div>
            )}
          </div>
          
          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}
          
          {/* Error state */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded m-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && !error && filteredBooks.length === 0 && (
            <div className="bg-white py-12 px-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 mb-4">
                <BookOpen className="h-8 w-8 text-indigo-300" />
              </div>
              <p className="mt-2 text-gray-900 text-lg font-medium">No borrowed books found</p>
              <p className="mt-1 text-gray-500">Books you borrow from the library will appear here</p>
            </div>
          )}
          
          {/* Books table */}
          {!isLoading && !error && filteredBooks.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('bookId.title')}>
                      <div className="flex items-center">
                        Book <SortIndicator column="bookId.title" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('AdminId.Library_name')}>
                      <div className="flex items-center">
                        Library <SortIndicator column="AdminId.Library_name" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('borrowDate')}>
                      <div className="flex items-center">
                        Borrowed On <SortIndicator column="borrowDate" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('dueDate')}>
                      <div className="flex items-center">
                        Due Date <SortIndicator column="dueDate" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBooks.map((book, index) => {
                    const status = getBookStatus(book);
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-12 w-10 flex-shrink-0 overflow-hidden rounded-sm shadow-sm border border-gray-200">
                              {book.bookId?.imageUrl ? (
                                <img 
                                  src={book.bookId.imageUrl} 
                                  alt={book.bookId?.title || 'Book cover'} 
                                  className="h-12 w-10 object-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = "/api/placeholder/40/60";
                                  }}
                                />
                              ) : (
                                <div className="h-12 w-10 bg-indigo-50 flex items-center justify-center">
                                  <BookOpen className="h-6 w-6 text-indigo-200" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 line-clamp-1">{book.bookDetails?.title || 'Unknown Title'}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{book.bookDetails?.author || 'Unknown Author'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{book.libraryDetails?.name || 'Unknown Library'}</div>
                          <div className="text-xs text-gray-500">{book.libraryDetails?.address || ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(book.borrowedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(book.dueDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${status.class}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex space-x-3 justify-end">
                            <button className="text-indigo-600 hover:text-indigo-900 inline-flex items-center">
                              <Eye className="h-4 w-4 mr-1" />
                              <span>Details</span>
                            </button>
                            {getDueDate(book.dueDate) >= 0 && (
                              <button className="text-blue-600 hover:text-blue-900 inline-flex items-center">
                                <RefreshCw className="h-4 w-4 mr-1" />
                                <span>Renew</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Pagination */}
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredBooks.length}</span> of{' '}
                      <span className="font-medium">{filteredBooks.length}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Previous</span>
                        <ChevronDown className="h-5 w-5 rotate-90" />
                      </button>
                      <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-indigo-50 text-sm font-medium text-indigo-600 hover:bg-indigo-100">
                        1
                      </button>
                      <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Next</span>
                        <ChevronDown className="h-5 w-5 -rotate-90" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BorrowedBooks;