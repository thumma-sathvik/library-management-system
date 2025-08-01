'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Building2, Book, User, ShoppingCart, X, Menu, Search } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';

// Helper function to get full image path
const getFullImagePath = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath; // Already a full URL
  return `http://localhost:3002/${imagePath.replace(/^\//, '')}`; // Adjust the base URL as needed
};

// Separated SearchResults component
const SearchResults = ({ results = [], isVisible, isScrolled, onSelect }) => {
  if (!isVisible || !Array.isArray(results) || results.length === 0) return null;

  return (
    <div className={`absolute top-full left-0 w-96 mt-2 rounded-xl shadow-lg overflow-hidden ${
      isScrolled ? 'bg-white' : 'bg-white/95 backdrop-blur-sm'
    }`}>
      <div className="max-h-96 overflow-y-auto">
        {results.map((book, index) => (
          <div 
            key={book.id || index} 
            className="group hover:bg-gray-50 transition-colors duration-200"
            role="option"
            tabIndex={0}
            onClick={() => onSelect && onSelect(book)}
            onKeyDown={(e) => e.key === 'Enter' && onSelect && onSelect(book)}
          >
            <div className="flex items-start p-4 space-x-4">
              <div className="flex-shrink-0">
                {book.image ? (
                  <img
                    src={getFullImagePath(book.image)}
                    alt={book.title}
                    className="w-16 h-20 object-cover rounded-md shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/placeholder-book.png';
                    }}
                  />
                ) : (
                  <div className="w-16 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                    <Book className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                  {book.title}
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  {book.author}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    {results.length > 0 && (
  <div className="p-3 border-t border-gray-100 bg-gray-50">
    <Link href="/search" className="block w-full text-center text-sm text-gray-600 hover:text-gray-900">
      View all {results.length} results
    </Link>
  </div>
)}
    </div>
  );
};

// Separated SearchInput component
const SearchInput = ({ searchQuery, setSearchQuery, isSearching, isScrolled }) => (
  <div className="relative">
    <Search
      className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
        isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-400'
      }`}
    />
    <input
      type="text"
      placeholder="Search books..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className={`pl-10 pr-4 py-2.5 w-64 rounded-full transition-all duration-200 ${
        isScrolled ? 'bg-gray-100 focus:bg-white border-gray-200' : 'bg-white/10 focus:bg-white/20'
      } border border-transparent focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm ${
        isScrolled ? 'text-black placeholder-gray-500' : 'text-white placeholder-gray-400'
      }`}
    />
    {isSearching && (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )}
  </div>
);

// Updated LibraryModal component
const LibraryModal = ({ isOpen, onClose, libraries, selectedBook, onBorrowFromLibrary }) => {
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState({});

  useEffect(() => {
    const fetchLocations = async () => {
      if (libraries && libraries.length > 0) {
        try {
          const adminIds = libraries.map(lib => lib.adminId?._id).filter(Boolean);
          const response = await axios.get(`http://localhost:3002/locations?adminIds=${adminIds.join(',')}`, {
            withCredentials: true,
          });
          const locationMap = {};
          response.data.forEach(loc => {
            locationMap[loc.adminId] = loc;
          });
          setLocations(locationMap);
        } catch (err) {
          console.error('Error fetching locations:', err);
        }
      }
    };
    fetchLocations();
    setError(null);
  }, [isOpen, libraries]);

  const handleMapClick = (adminId) => {
    const location = locations[adminId];
    if (location?.latitude && location?.longitude) {
      window.open(`https://www.google.com/maps?q=${location.latitude},${location.longitude}`, '_blank');
    } else {
      alert('Location information not available');
    }
  };

  if (!isOpen || error || !libraries) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl w-full max-w-2xl shadow-2xl transform transition-all">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Available Libraries
          </h2>
          <button 
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-100 transition-colors duration-200"
          >
            <span className="text-2xl text-gray-500 hover:text-gray-700">×</span>
          </button>
        </div>

        {selectedBook && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-4">
              {selectedBook.image ? (
                <img
                  src={getFullImagePath(selectedBook.image)}
                  alt={selectedBook.title}
                  className="w-16 h-20 object-cover rounded-md shadow-sm"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/placeholder-book.png';
                  }}
                />
              ) : (
                <div className="w-16 h-20 bg-gray-100 rounded-md flex items-center justify-center">
                  <Book className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedBook.title}</h3>
                <p className="text-sm text-gray-600">{selectedBook.author}</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-6">
            {Array.isArray(libraries) && libraries.map((library, index) => (
              <div key={library._id || index} className="p-6 border rounded-xl bg-white hover:shadow-lg transition-shadow duration-300">
                <div className="flex justify-between items-start">
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">
                      {library.adminId?.Library_name || 'Library Name Not Available'}
                    </h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleMapClick(library.adminId?._id)}
                        className="flex items-center text-gray-600 group hover:text-blue-600 w-full text-left"
                      >
                        <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                        <p className="text-sm transition-colors">
                          {library.adminId?.address || 'Address Not Available'}
                        </p>
                      </button>
                      <div className="flex items-center text-gray-600 group">
                        <Clock className="w-5 h-5 mr-3 text-blue-600" />
                        <p className="text-sm group-hover:text-blue-600 transition-colors">9:00 AM - 6:00 PM</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right space-y-3">
                    <div className="bg-blue-50 rounded-xl px-4 py-3">
                      <Building2 className="w-5 h-5 inline-block mr-2 text-blue-600" />
                      <span className="text-blue-600 font-semibold">
                        {library.stock || 0} copies available
                      </span>
                    </div>
                    <button
                      onClick={() => onBorrowFromLibrary(selectedBook && selectedBook._id ? selectedBook._id : selectedBook, library._id)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      Borrow Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }) => {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [libraries, setLibraries] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showAccountPopup, setShowAccountPopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [userInfo, setUserInfo] = useState([]);
  const [isClient, setIsClient] = useState(false);

  // Detect client-side once mounted
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle click outside search results
  useEffect(() => {
  const handleClickOutside = (event) => {
    if (
      showAccountPopup &&
      !event.target.closest('.account-popup') &&
      !event.target.closest('.account-button')
    ) {
      setShowAccountPopup(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [showAccountPopup]);

  // Handle search with debounce
// Handle search with debounce
useEffect(() => {
  const searchTimeout = setTimeout(async () => {
    if (searchQuery) {
      setIsSearching(true);
      try {
        // You might need to update this URL to the correct endpoint
        const searchResponse = await axios.get('http://localhost:3002/bookquery', {
          withCredentials: true,
          params: { query: searchQuery },
        });
        setSearchResults(searchResponse.data);
      } catch (error) {
        console.error('Error fetching search results:', error);
        setSearchResults([]);
        // You could add more specific error handling here
        // For example, show a toast notification to the user
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
    }
  }, 300);
  return () => clearTimeout(searchTimeout);
}, [searchQuery]);

  // Updated handleBookSelect to pass the entire book object
  const handleBookSelect = async (book) => {
    try {
      const response = await axios.get(`http://localhost:3002/libraries/${book.title}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        withCredentials: true,
      });
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setLibraries(response.data);
        setSelectedBook(book);
        setIsModalOpen(true);
      } else {
        throw new Error('No library information available');
      }
    } catch (error) {
      console.error('Error fetching libraries:', error);
      alert('Error fetching library information. Please try again.');
    }
  };

  const handleBorrowFromLibrary = async (bookId, libraryId) => {
    try {
      const actualBookId = typeof bookId === 'object' ? bookId._id : bookId;
      await axios.post(
        'http://localhost:3002/borrow',
        { 
          bookId: actualBookId,
          libraryId,
          userId: localStorage.getItem('userId')
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          withCredentials: true,
        }
      );
      setBorrowedBooks((prev) => [...prev, actualBookId]);
      setIsModalOpen(false);
      alert('Book borrowed successfully!');
    } catch (error) {
      console.error('Error borrowing book:', error);
      alert(error.response?.data?.message || 'Failed to borrow book.');
    }
  };

  const fetchLibraryInfo = async () => {
  setIsLoading(true);
  try {
    const response = await axios.get('http://localhost:3002/user', { withCredentials: true });
    setUserInfo(response.data);
    console.log('userdata',response.data);
    setError(null);
  } catch (error) {
    console.error('Error fetching library data:', error);
    setError('Failed to load account information');
    setUserInfo({
      name: "Error loading",
      address: "Error loading",
      email: "Error loading"
    });
  } finally {
    setIsLoading(false);
  }
};
  // Fetch library info once component mounts
  useEffect(() => {
    fetchLibraryInfo();
  }, []);

  // Handle click outside of account popup to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showAccountPopup && !event.target.closest('.account-popup') && !event.target.closest('.account-button')) {
        setShowAccountPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showAccountPopup]);

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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50">
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-lg' : 'bg-black'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center space-x-3">
              <Link href="/loginhome" className="flex items-center space-x-3">
                <Book className={`w-8 h-8 ${isScrolled ? 'text-black' : 'text-white'}`} />
                <span className={`text-2xl font-bold tracking-tight ${isScrolled ? 'text-black' : 'text-white'}`}>
                  LibraryHub
                </span>
              </Link>
            </div>
            <div className="hidden lg:flex items-center space-x-10">
              <div className="flex space-x-8">
                {['Home', 'Catalog', 'About'].map((item) => (
                  <Link
                    key={item}
                    href={item === 'Catalog' 
                      ? '/loginhome/catalog' 
                      : item === 'About'
                      ? '/loginhome/about'
                      : '/loginhome'}
                    className={`font-medium text-sm tracking-wider transition-colors duration-200 ${
                      isScrolled ? 'text-gray-800 hover:text-black' : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {item.toUpperCase()}
                  </Link>
                ))}
              </div>
              <div className="relative">
                <SearchInput 
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  isSearching={isSearching}
                  isScrolled={isScrolled}
                />
                <SearchResults 
                  results={searchResults}
                  isVisible={searchQuery.length > 0}
                  isScrolled={isScrolled}
                  onSelect={handleBookSelect}
                />
              </div>
              <div className="flex items-center space-x-6">
                <Link 
                  href="/loginhome/orders"
                  className="p-2 rounded-full hover:bg-gray-800/20 transition-colors duration-200"
                >
                  <ShoppingCart className={`w-5 h-5 ${isScrolled ? 'text-gray-800' : 'text-gray-300'}`} />
                </Link>
                <button
                  onClick={toggleAccountPopup}
                 className="account-button flex items-center space-x-2 px-5 py-2.5 rounded-full transition-all duration-200 bg-black text-white hover:bg-gray-900"
                  >
                <User className="w-4 h-4" />
               <span className="text-sm font-medium">Account</span>
               </button>
                <button
                  onClick={() => setMenuOpen(!isMenuOpen)}
                  className="lg:hidden p-2 rounded-lg hover:bg-gray-800/20"
                >
                  {isMenuOpen ? (
                    <X className={`w-6 h-6 ${isScrolled ? 'text-black' : 'text-white'}`} />
                  ) : (
                    <Menu className={`w-6 h-6 ${isScrolled ? 'text-black' : 'text-white'}`} />
                  )}
                </button>
              </div>
            </div>
            {isMenuOpen && (
              <div className="lg:hidden bg-white shadow-xl rounded-b-2xl">
                <div className="px-6 py-4 space-y-4">
                  {['Home', 'Catalog', 'About'].map((item) => (
                    <Link
                      key={item}
                      href={item === 'Catalog' 
                        ? '/loginhome/catalog' 
                        : item === 'About'
                        ? '/loginhome/about'
                        : '/loginhome'}
                      className="block px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-xl transition-colors duration-200"
                    >
                      {item}
                    </Link>
                  ))}
                  <div className="relative mt-4">
                    <SearchInput 
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      isSearching={isSearching}
                      isScrolled={true}
                    />
                    <SearchResults 
                      results={searchResults}
                      isVisible={searchQuery.length > 0}
                      isScrolled={true}
                      onSelect={handleBookSelect}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <Link href="/loginhome/orders" className="flex items-center space-x-2 px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-xl transition-colors duration-200">
                      <ShoppingCart className="w-5 h-5" />
                      <span>Orders</span>
                    </Link>
                    <Link href="/account" className="flex items-center space-x-2 px-4 py-3 text-gray-800 hover:bg-gray-50 rounded-xl transition-colors duration-200">
                      <User className="w-5 h-5" />
                      <span>Account</span>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
          {showAccountPopup && (
  <div className="account-popup absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-40">
    <div className="p-4 border-b border-slate-200">
      <h3 className="font-bold text-lg text-slate-800">Account Information</h3>
    </div>
    {isLoading ? (
      <div className="p-4 text-center">
        <p className="text-sm text-slate-600">Loading account info...</p>
      </div>
    ) : error ? (
      <div className="p-4 text-center">
        <p className="text-sm text-red-600">{error}</p>
        <button 
          onClick={fetchLibraryInfo}
          className="mt-2 px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors duration-200"
        >
          Retry
        </button>
      </div>
    ) : (
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-slate-500">NAME</label>
          <p className="text-sm font-medium text-slate-800">{userInfo.name}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">EDUCATION</label>
          <p className="text-sm font-medium text-slate-800">{userInfo.education}</p>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-500">EMAIL</label>
          <p className="text-sm font-medium text-slate-800">{userInfo.email}</p>
        </div>
      </div>
    )}
    <div className="p-4 border-t border-slate-200">
      <button 
        onClick={handleLogout}
        className="w-full py-2 flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
      >
        <span>Sign Out</span>
      </button>
    </div>
  </div>
)}
        </div>
      </nav>
      <main className="flex-grow pt-24 pb-16">
        {children}
      </main>
      <footer className="bg-black">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Book className="w-6 h-6 text-white" />
                <span className="text-xl font-bold text-white">LibraryHub</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Discover a world of knowledge through our comprehensive collection of books, research materials, and educational resources.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-6">Quick Links</h3>
              <ul className="space-y-4">
                {['Book Borrowing', 'Research Help', 'Study Spaces', 'Digital Library'].map((item) => (
                  <li key={item}>
                    <Link
                      href={`/${item.toLowerCase().replace(' ', '-')}`}
                      className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-6">Contact</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                <li className="flex items-center space-x-2">
                  <span>123 Library Street</span>
                </li>
                <li>City, State 12345</li>
                <li className="hover:text-white transition-colors duration-200">
                  <a href="tel:+15551234567">(555) 123-4567</a>
                </li>
                <li className="hover:text-white transition-colors duration-200">
                  <a href="mailto:info@libraryhub.com">info@libraryhub.com</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-6">Hours</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                <li>Monday - Friday: 8AM - 9PM</li>
                <li>Saturday: 9AM - 6PM</li>
                <li>Sunday: 11AM - 5PM</li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-gray-800">
            <div className="text-center text-sm text-gray-500">
              <p>&copy; {new Date().getFullYear()} LibraryHub. All rights reserved.</p>
            </div>
          </div>
        </div>
        <LibraryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          libraries={libraries}
          selectedBook={selectedBook}
          onBorrowFromLibrary={handleBorrowFromLibrary}
        />
      </footer>
    </div>
  );
};

export default Layout;