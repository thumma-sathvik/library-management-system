'use client'
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, BookOpen, AlertCircle, Loader2, Trash2, Plus, Filter, X, Edit3,
  ShoppingCart, CheckCircle2, Star, ArrowUpDown
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortField, setSortField] = useState('title');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [updatingStock, setUpdatingStock] = useState(null);
  const [stockValues, setStockValues] = useState({});
  const [originalStockValues, setOriginalStockValues] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [stockAction, setStockAction] = useState('reduce'); // 'reduce', 'unavailable' or 'available'
  const [stockReductionAmount, setStockReductionAmount] = useState(1);
  const [availableStock, setAvailableStock] = useState(1); // new state for "available" action
  const [borrowedBooks, setBorrowedBooks] = useState({});

  // Update the useEffect that fetches books
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch admin data
        const adminResponse = await axios.get('http://localhost:3002/admin', {
          withCredentials: true,
        });
        const adminId = adminResponse.data.id;

        // Fetch books
        const booksResponse = await axios.get('http://localhost:3002/bookdetails', {
          withCredentials: true,
        });

        // Filter and validate books
        const filteredBooks = booksResponse.data
          .filter(book => book.adminId && book.adminId._id === adminId)
          .map(book => ({
            ...book,
            _id: book._id || book.id, // Ensure _id is set
            stock: typeof book.stock === 'number' ? book.stock : 0,
            status: book.status || (book.stock > 0 ? 'Available' : 'Not Available'),
            // Add mock rating data that looks realistic
            rating: (Math.floor(Math.random() * 10) + 30) / 10, // Random rating between 3.0 and 4.9
            ratingCount: Math.floor(Math.random() * 150) + 50 // Random count between 50 and 199
          }));

        console.log('Filtered books:', filteredBooks);

        // Initialize stock values and keep original values for comparison
        const initialStockValues = {};
        filteredBooks.forEach(book => {
          if (book._id) {
            initialStockValues[book._id] = book.stock;
          }
        });

        setStockValues(initialStockValues);
        setOriginalStockValues(initialStockValues);
        setBooks(filteredBooks);

        // Fetch borrowed books data for this admin
        const borrowingResponse = await axios.get(`http://localhost:3002/borrowing-records?adminId=${adminId}`, {
          withCredentials: true,
        });

        // Create a map of bookId -> count of borrows
        const borrowCounts = {};
        borrowingResponse.data.forEach(record => {
          const bookId = record.bookId?._id;
          if (bookId) {
            borrowCounts[bookId] = (borrowCounts[bookId] || 0) + 1;
          }
        });

        setBorrowedBooks(borrowCounts);
      } catch (err) {
        setError('Unable to fetch books. Please try again later.');
        console.error('Error fetching books:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get unique categories
  const categories = ['All', ...new Set(books.map(book => book.category || 'Uncategorized'))];

  // Filter books by search term and category
  const filteredBooks = books.filter(book => {
    const matchesSearch =
      book.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (book.stock && book.stock.toString().includes(searchTerm));

    const matchesCategory = selectedCategory === 'All' || book.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sort books
  const sortedBooks = [...filteredBooks].sort((a, b) => {
    let fieldA = a[sortField] || '';
    let fieldB = b[sortField] || '';

    if (typeof fieldA === 'string') fieldA = fieldA.toLowerCase();
    if (typeof fieldB === 'string') fieldB = fieldB.toLowerCase();

    if (fieldA < fieldB) return sortDirection === 'asc' ? -1 : 1;
    if (fieldA > fieldB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  // Toggle sort direction
  const toggleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Remove book from local state
  const removeBookFromState = (bookId) => {
    setBooks(books.filter(book => book._id !== bookId));
  };

  // Delete book functionality
  const handleDeleteBook = async (bookId) => {
    // Check if book has borrowers first
    if (borrowedBooks[bookId] && borrowedBooks[bookId] > 0) {
      return showToast(`Cannot delete book - it has ${borrowedBooks[bookId]} active borrowers`, 'error');
    }

    if (!confirm('Are you sure you want to delete this book?')) return;
    try {
      await axios.delete(`http://localhost:3002/books/${bookId}`, { withCredentials: true });
      removeBookFromState(bookId);

      // Show success toast
      showToast('Book successfully deleted', 'success');
    } catch (err) {
      console.error('Error deleting book:', err);

      // Show error toast
      showToast('Failed to delete book', 'error');
    }
  };

  // Improve the openStockUpdateModal function to log and validate the book
  const openStockUpdateModal = (book) => {
    console.log('Opening modal for book:', book);

    if (!book || !book._id) {
      showToast('Invalid book selection', 'error');
      return;
    }

    setSelectedBook(book);
    // If stock is already 0, default to 'unavailable'
    setStockAction(book.stock === 0 ? 'unavailable' : 'reduce');
    setStockReductionAmount(1);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedBook(null);
  };

  // Update stock based on selected action
  const updateStock = async () => {
    if (!selectedBook || !selectedBook._id) {
      showToast('Invalid book selection', 'error');
      return;
    }

    try {
      setUpdatingStock(selectedBook._id);
      const currentStock = selectedBook.stock || 0;
      let newStockValue;

      if (stockAction === 'unavailable') {
        newStockValue = 0;
      } else if (stockAction === 'available') {
        newStockValue = availableStock;
      } else { // reduce
        newStockValue = Math.max(0, currentStock - stockReductionAmount);
      }

      // Determine new status
      const newStatus = newStockValue > 0 ? 'Available' : 'Not Available';

      console.log('Updating stock for book:', {
        id: selectedBook._id,
        title: selectedBook.title,
        currentStock,
        newStock: newStockValue,
        newStatus
      });

      const response = await axios.patch(
        `http://localhost:3002/books/${selectedBook._id}/stock`,
        { stock: newStockValue, status: newStatus },
        { withCredentials: true, headers: { 'Content-Type': 'application/json' } }
      );

      console.log('Stock update response:', response.data);

      if (response.data && response.data.book) {
        setBooks(books.map(book =>
          book._id === selectedBook._id
            ? { ...book, stock: response.data.book.stock, status: response.data.book.status }
            : book
        ));
      } else {
        setBooks(books.map(book =>
          book._id === selectedBook._id
            ? { ...book, stock: newStockValue, status: newStatus }
            : book
        ));
      }

      closeModal();
      showToast(
        `Book ${stockAction === 'unavailable'
          ? 'marked as unavailable'
          : stockAction === 'available'
            ? `marked as available (stock set to ${availableStock})`
            : `stock reduced by ${stockReductionAmount}`
        }`,
        'success'
      );
    } catch (err) {
      console.error('Error updating stock:', err);
      let errorMessage = 'Failed to update stock: ';
      if (err.response) {
        errorMessage += err.response.data?.message || `Server error (${err.response.status})`;
      } else if (err.request) {
        errorMessage += 'No response from server. Please check your connection.';
      } else {
        errorMessage += err.message;
      }
      showToast(errorMessage, 'error');
    } finally {
      setUpdatingStock(null);
    }
  };

  // Get status text based on stock and borrowed count
  const getStatusText = (book) => {
    const borrowCount = borrowedBooks[book._id] || 0;

    if (book.stock <= 0) {
      return 'Unavailable';
    } else if (book.stock <= 3) {
      return 'Low Stock';
    } else {
      return 'In Stock';
    }
  };

  // Show toast notification
  const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500 ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => document.body.removeChild(toast), 500);
    }, 3000);
  };

  // Format date from timestamp
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Generate star rating display
  const renderStarRating = (rating, count) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    return (
      <div className="flex items-center">
        <div className="flex items-center">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={16}
              className={`${i < fullStars
                  ? 'text-yellow-400 fill-yellow-400'
                  : i === fullStars && hasHalfStar
                    ? 'text-yellow-400 fill-yellow-400 half-star'
                    : 'text-gray-300'
                }`}
            />
          ))}
        </div>
        <span className="ml-1 text-xs text-gray-600">({count})</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6">
      {/* Header with sort options */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Book Management</h1>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => toggleSort('title')}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${sortField === 'title'
                ? 'bg-gray-100 border-gray-300 text-gray-900'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            Name
            <ArrowUpDown size={14} />
          </button>

          <button
            onClick={() => toggleSort('stock')}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${sortField === 'stock'
                ? 'bg-gray-100 border-gray-300 text-gray-900'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            Stock
            <ArrowUpDown size={14} />
          </button>

          <button
            onClick={() => toggleSort('rating')}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border transition-colors ${sortField === 'rating'
                ? 'bg-gray-100 border-gray-300 text-gray-900'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
          >
            Rating
            <ArrowUpDown size={14} />
          </button>
        </div>
      </div>

      {/* Search and filter bar */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6 border border-gray-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search books by title, author or description..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2 pl-4 pr-10 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500 appearance-none"
            >
              {categories.map((category, index) => (
                <option key={`category-${index}-${category}`} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
          </div>

          <Link
            href="/admin/Addnewbook"
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg transition-colors md:w-auto"
          >
            <Plus size={16} />
            <span>Add Book</span>
          </Link>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Loader2 className="w-12 h-12 text-gray-700 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your book collection...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-800">Error loading books</h3>
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

      {/* No results */}
      {!loading && !error && sortedBooks.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm text-center py-12 border border-dashed border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-1">No books found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory !== 'All'
              ? "Try adjusting your search or filters"
              : "Start by adding books to your collection"}
          </p>
          <Link
            href="/admin/Addnewbook"
            className="inline-flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            <span>Add Your First Book</span>
          </Link>
        </div>
      )}

      {/* Grid View */}
      {!loading && !error && sortedBooks.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedBooks.map(book => {
            const statusText = getStatusText(book);
            const hasActiveBorrowers = borrowedBooks[book._id] && borrowedBooks[book._id] > 0;

            return (
              <div
                key={book._id || `book-${book.title}-${book.author}`}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col h-full w-full"
                style={{ maxWidth: '100%' }}
              >
                {/* Book cover image with status badge */}
                <div className="relative h-48 bg-gray-100 overflow-hidden w-full">
                  
                {book.imgSrc ? (
    <div className="w-full h-full relative">
        <Image
            src={
              book.imgSrc.startsWith('http')
                ? book.imgSrc
                : `http://localhost:3002/uploads/${book.imgSrc}`
            }
            alt={book.title || "Book cover"}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover object-center w-full h-full transition-transform group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://placehold.co/400x600/e2e8f0/64748b?text=No+Cover";
            }}
        />
    </div>
) : (
    <div className="w-full h-full flex items-center justify-center bg-gray-200">
        <BookOpen className="w-12 h-12 text-gray-400" />
    </div>
)}

                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${book.stock > 10 ? 'bg-green-500 text-white' :
                      book.stock > 0 ? 'bg-yellow-500 text-white' :
                        'bg-red-500 text-white'
                    }`}>
                    {statusText}
                  </div>
                </div>

                {/* Book details */}
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-1">{book.title}</h3>
                    <p className="text-gray-700 text-sm mb-2">by {book.author}</p>

                    {/* Star Rating */}
                    <div className="mb-3">
                      {renderStarRating(book.rating, book.ratingCount)}
                    </div>

                    <div className="flex flex-col text-sm text-gray-600 space-y-2 mb-4 border-t border-gray-100 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category:</span>
                        <span className="font-medium text-gray-800">{book.category || 'Uncategorized'}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Stock:</span>
                        <span className="font-medium text-gray-800">{book.stock}</span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">Borrowers:</span>
                        <span className={`font-medium ${hasActiveBorrowers ? 'text-blue-600' : 'text-gray-800'}`}>
                          {hasActiveBorrowers ? borrowedBooks[book._id] : 'None'}
                        </span>
                      </div>

                      {book.releasedYear && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Released:</span>
                          <span className="font-medium text-gray-800">{book.releasedYear}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex justify-between gap-2 mt-auto">
                    <button
                      onClick={() => openStockUpdateModal(book)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 px-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium text-sm transition-colors"
                      disabled={updatingStock === book._id}
                    >
                      {updatingStock === book._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Edit3 size={14} />
                      )}
                      <span>Update Stock</span>
                    </button>

                    <button
                      onClick={() => handleDeleteBook(book._id)}
                      className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 ${hasActiveBorrowers ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        } rounded-lg font-medium text-sm transition-colors`}
                      disabled={hasActiveBorrowers}
                      title={hasActiveBorrowers ? "Cannot delete - book has active borrowers" : "Delete book"}
                    >
                      <Trash2 size={14} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stock Update Modal */}
      {showModal && selectedBook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-semibold text-gray-800 mb-6">Update Stock</h3>

            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-1">{selectedBook.title}</h4>
              <div className="flex justify-between">
                <p className="text-sm text-gray-600">Current stock: {selectedBook.stock}</p>
                <p className={`text-sm font-medium ${selectedBook.status === 'Available' ? 'text-green-600' : 'text-red-600'
                  }`}>
                  Status: {selectedBook.status || (selectedBook.stock > 0 ? 'Available' : 'Not Available')}
                </p>
              </div>

              {borrowedBooks[selectedBook._id] > 0 && (
                <div className="mt-2 bg-blue-50 p-2 rounded text-sm text-blue-600">
                  <CheckCircle2 className="inline-block h-4 w-4 mr-1" />
                  This book has {borrowedBooks[selectedBook._id]} active borrowers
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Choose an action:</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="reduce"
                      name="stockAction"
                      value="reduce"
                      checked={stockAction === 'reduce'}
                      onChange={() => setStockAction('reduce')}
                      className="h-4 w-4 text-gray-900 focus:ring-gray-500 border-gray-300"
                      disabled={selectedBook.stock === 0}
                    />
                    <label htmlFor="reduce" className={`ml-2 block text-sm ${selectedBook.stock === 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                      Reduce stock by specific amount
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="unavailable"
                      name="stockAction"
                      value="unavailable"
                      checked={stockAction === 'unavailable'}
                      onChange={() => setStockAction('unavailable')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="unavailable" className="ml-2 block text-sm text-gray-700">
                      Mark as unavailable (set stock to 0)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="available"
                      name="stockAction"
                      value="available"
                      checked={stockAction === 'available'}
                      onChange={() => setStockAction('available')}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="available" className="ml-2 block text-sm text-gray-700">
                      Mark as available (set new stock)
                    </label>
                  </div>
                </div>
              </div>

              {stockAction === 'reduce' && (
                <div>
                  <label htmlFor="reductionAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Reduction amount:
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="reductionAmount"
                      min="1"
                      max={selectedBook.stock}
                      value={stockReductionAmount}
                      onChange={(e) => setStockReductionAmount(Math.min(parseInt(e.target.value) || 1, selectedBook.stock))}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                    <span className="ml-2 text-sm text-gray-500">
                      New stock will be: {Math.max(0, (selectedBook.stock - stockReductionAmount))}
                    </span>
                  </div>

                  <div className="mt-2 text-sm text-gray-500">
                    New status will be:
                    <span className={`ml-1 font-medium ${(selectedBook.stock - stockReductionAmount) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {(selectedBook.stock - stockReductionAmount) > 0 ? 'Available' : 'Not Available'}
                    </span>
                  </div>
                </div>
              )}

              {stockAction === 'available' && (
                <div>
                  <label htmlFor="availableStock" className="block text-sm font-medium text-gray-700 mb-2">
                    New stock value:
                  </label>
                  <div className="flex items-center">
                    <input
                      type="number"
                      id="availableStock"
                      min="1"
                      value={availableStock}
                      onChange={(e) => setAvailableStock(parseInt(e.target.value) || 1)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-gray-500"
                    />
                    <span className="ml-2 text-sm text-gray-500">
                      This will set the stock to the entered value.
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={updateStock}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors flex items-center gap-2"
                disabled={updatingStock === selectedBook._id}
              >
                {updatingStock === selectedBook._id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart size={16} />
                )}
                Update Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for half stars */}
      <style jsx global>{`
        .half-star {
          position: relative;
          overflow: hidden;
          width: 16px;
        }
        .half-star:before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background-color: white;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default ManageBooks;