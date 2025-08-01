'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { MapPin, Clock, Phone, Building2, Star, ChevronRight, Loader2, BookOpen, XCircle, CircleCheck, AlertCircle } from 'lucide-react';

axios.defaults.withCredentials = true;

const BookCard = ({ id, adminId, title, price, rating, imgSrc, bestseller, description, isBorrowed, onCardClick }) => (
  <div 
    className="w-[300px] bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
    onClick={() => onCardClick(title, id, adminId)}
  >
    <div className="relative overflow-hidden rounded-t-xl">
      <img
        src={imgSrc || "/api/placeholder/300/220"}
        alt={title}
        className="w-full h-[220px] object-cover transition-transform duration-300 hover:scale-105"
      />
      {bestseller && (
        <div className="absolute top-3 right-3 bg-gradient-to-r from-gray-800 to-black text-white text-sm px-3 py-1 rounded-full font-medium shadow-md">
          Bestseller
        </div>
      )}
      {isBorrowed && (
        <div className="absolute bottom-3 left-3 bg-black text-white text-sm px-3 py-1 rounded-full font-medium shadow-md flex items-center">
          <BookOpen className="w-4 h-4 mr-1" />
          Reserved
        </div>
      )}
    </div>
    <div className="p-5">
      <h3 className="font-bold text-xl h-14 line-clamp-2 mb-3 text-gray-800">{title}</h3>
      {description && (
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{description}</p>
      )}
      <div className="flex justify-between items-center">
        {rating && (
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"}`}
              />
            ))}
            <span className="ml-2 text-sm font-medium text-gray-600">({rating}.0)</span>
          </div>
        )}
        {price && (
          <span className="text-xl font-bold text-gray-900">${price}</span>
        )}
      </div>
    </div>
  </div>
);


const LibraryModal = ({ isOpen, onClose, libraries, selectedBook, onBorrowFromLibrary }) => {
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState({});
  const [activeLibrary, setActiveLibrary] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  useEffect(() => {
    const fetchLocations = async () => {
      if (libraries && libraries.length > 0) {
        try {
          const adminIds = libraries.map(lib => lib.adminId?._id).filter(Boolean);
          const response = await axios.get(`http://localhost:3002/locations?adminIds=${adminIds.join(',')}`, {
            withCredentials: true
          });
          
          const locationMap = {};
          response.data.forEach(loc => {
            locationMap[loc.adminId] = loc;
          });
          setLocations(locationMap);
          setActiveLibrary(libraries[0]);
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

  const getAvailabilityStatus = (library) => {
    if (!library) return null;
    if (library.stock > 5) return {
      color: "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800",
      icon: <CircleCheck className="h-4 w-4 mr-1 animate-pulse" />,
      label: "Available",
      message: `${library.stock} copies available`
    };
    if (library.stock > 0) return {
      color: "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-800",
      icon: <Clock className="h-4 w-4 mr-1 animate-spin animate-duration-[3000ms]" />,
      label: "Limited Stock",
      message: `${library.stock} copies left`
    };
    return {
      color: "bg-gradient-to-r from-red-100 to-red-200 text-red-800",
      icon: <AlertCircle className="h-4 w-4 mr-1 animate-pulse" />,
      label: "Unavailable",
      message: "Currently out of stock"
    };
  };

  if (!isOpen || error || !libraries) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative bg-white rounded-2xl w-full max-w-5xl shadow-2xl transform transition-all overflow-hidden">
        {/* Header with gradient background */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-800 to-black">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {selectedBook?.title}
            </h2>
            <p className="text-gray-300 mt-1">Available at {libraries.length} locations</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 hover:bg-gray-700/50 transition-colors duration-200"
          >
            <XCircle className="w-6 h-6 text-white hover:text-gray-200" />
          </button>
        </div>

        <div className="flex h-[600px]">
          {/* Library List with enhanced styling */}
          <div className="w-1/2 border-r overflow-y-auto bg-gray-50">
            {libraries.map((library, index) => {
              const availability = getAvailabilityStatus(library);
              return (
                <div 
                  key={library._id || index}
                  onClick={() => setActiveLibrary(library)}
                  className={`p-6 border-b cursor-pointer transition-all duration-200 ${
                    activeLibrary?._id === library._id 
                      ? 'bg-gray-100 border-l-4 border-l-black' 
                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {library.adminId?.Library_name || 'Library Name Not Available'}
                      </h3>
                      <div className={`${availability.color} px-3 py-1 rounded-full flex items-center text-sm`}>
                        {availability.icon}
                        {availability.label}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-gray-600 group">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center mr-3 group-hover:bg-gray-200 transition-colors">
                          <MapPin className="w-4 h-4 text-gray-800" />
                        </div>
                        <p className="text-sm">{library.adminId?.address || 'Address Not Available'}</p>
                      </div>
                      
                      <div className="flex items-center text-gray-600 group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-sm">9:00 AM - 6:00 PM</p>
                      </div>

                      <div className="flex items-center text-gray-600 group">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 group-hover:bg-blue-200 transition-colors">
                          <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <p className="text-sm">{availability.message}</p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onBorrowFromLibrary(selectedBook, library._id, library.adminId);
                      }}
                      disabled={library.stock === 0}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
                        library.stock === 0 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-black hover:bg-gray-900 text-white hover:shadow-lg'
                      }`}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span>{library.stock === 0 ? 'Not Available' : 'Reserve Now'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Section with styled location card */}
          <div className="w-1/2 p-6 bg-white">
            <div className="rounded-xl h-full flex flex-col">
              {activeLibrary && (
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-xl text-gray-900">Location Details</h3>
                      <p className="text-gray-500 text-sm mt-1">
                        {locations[activeLibrary.adminId?._id]?.distance 
                          ? `${(locations[activeLibrary.adminId?._id]?.distance).toFixed(1)} miles away`
                          : 'Distance information unavailable'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleMapClick(activeLibrary.adminId?._id)}
                      className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center shadow-md"
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      Open in Maps
                    </button>
                  </div>

                  {/* Styled Location Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 shadow-lg border border-gray-200">
                    <div className="space-y-6">
                      {/* Library Info */}
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-gray-800" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {activeLibrary.adminId?.Library_name || 'Library Branch'}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {activeLibrary.adminId?.address || 'Address Not Available'}
                          </p>
                        </div>
                      </div>

                      {/* Operating Hours */}
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Clock className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Operating Hours</h4>
                          <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                            <div>Monday - Friday</div>
                            <div>9:00 AM - 6:00 PM</div>
                            <div>Saturday</div>
                            <div>10:00 AM - 4:00 PM</div>
                            <div>Sunday</div>
                            <div>Closed</div>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Contact Information</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {activeLibrary.adminId?.phone || 'Phone not available'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activeLibrary.adminId?.email || 'Email not available'}
                          </p>
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-gray-900 mb-2">Additional Information</h4>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-gray-800 rounded-full mr-2"></div>
                            Free WiFi available
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                            Study rooms available
                          </li>
                          <li className="flex items-center">
                            <div className="w-2 h-2 bg-blue-600 rounded-full mr-2"></div>
                            Printing services
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GenreSection = ({ title, books, onBorrow, borrowedBooks = [], onCardClick }) => (
  books.length > 0 && (
    <div className="mb-16">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
        {/* <button className="group flex items-center text-blue-600 hover:text-blue-800 transition-colors">
          View All
          <ChevronRight className="w-5 h-5 ml-1 transform group-hover:translate-x-1 transition-transform" />
        </button> */}
      </div>
      <div className="relative">
        <div className="overflow-x-auto pb-4">
          <div className="flex space-x-6">
            {books.map((book) => (
              <BookCard
                key={book.id}
                {...book}
                isBorrowed={Array.isArray(borrowedBooks) && borrowedBooks.includes(book.id)}
                onBorrow={onBorrow}
                onCardClick={onCardClick}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
);

const LoginHomePage = () => {
  const [books, setBooks] = useState({});
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [userEducation, setUserEducation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All Books');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [libraries, setLibraries] = useState(null);
  const router = useRouter();
  const [userData,setUserData] = useState(null);
  
 useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('http://localhost:3002/user', {
          withCredentials: true,
        });
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

 const handleBorrowFromLibrary = async (selectedBook, libraryId, adminId) => {
  try {
    // First make the borrow request
    const response = await axios.post(
      'http://localhost:3002/borrow',
      {
        bookId: selectedBook.id,
        libraryId: libraryId,
        adminId: adminId._id
      },
      {
        withCredentials: true
      }
    );

    if (response.status === 200) {
      try {
        // Create notification after successful borrow
        const notificationData = {
          adminId: adminId._id,
          userId: userData?._id, // Make sure userData exists
          bookId: selectedBook.id,
          message: `${userData?.name || 'A user'} has reserved "${selectedBook.title}"`,
          type: 'reserve'
        };

        // Log the data being sent
        console.log('Sending notification data:', notificationData);

        const notificationResponse = await axios.post(
          'http://localhost:3002/adminnotification',
          notificationData,
          {
            withCredentials: true
          }
        );

        console.log('Notification created:', notificationResponse.data);
      } catch (notificationError) {
        console.error('Error creating notification:', notificationError.response?.data || notificationError.message);
      }

      // Update UI
      setBorrowedBooks(prev => [...(Array.isArray(prev) ? prev : []), selectedBook.id]);
      setIsModalOpen(false);
      alert('Book reserved successfully!');
    }
  } catch (error) {
    console.error('Error reserving book:', error.response?.data || error.message);
    alert(error.response?.data?.message || 'Failed to reserve book. Please try again.');
  }
};
 useEffect(() => {
  const fetchUserAndBooks = async () => {
    try {
      setLoading(true);
      setError(null);

      const userResponse = await axios.get('http://localhost:3002/user', {
        withCredentials: true,
      });

      if (!userResponse.data || !userResponse.data.education) {
        throw new Error('Invalid user data received');
      }

      setUserEducation(userResponse.data.education);

      const booksResponse = await axios.get(
        `http://localhost:3002/data?education=${userResponse.data.education}`,
        { withCredentials: true }
      );

      if (!booksResponse.data) {

        throw new Error('Invalid books data received');
      }
     console.log(booksResponse.data)
      // Group books by title but keep each library's stock separate
      const groupedBooks = {};
      Object.entries(booksResponse.data).forEach(([category, bookList]) => {
        const uniqueBooks = bookList.reduce((acc, book) => {
          const existingBookIndex = acc.findIndex(b => b.title === book.title);
          if (existingBookIndex === -1) {
            // First occurrence of this book
            acc.push({
              ...book,
              // Remove stock from the book card since it will be shown per library
              displayStock: false
            });
          }
          return acc;
        }, []);
        groupedBooks[category] = uniqueBooks;
      });
      setBooks(groupedBooks);

      const borrowedBooksResponse = await axios.get(
        'http://localhost:3002/borrowed-books',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          withCredentials: true,
        }
      );

      if (borrowedBooksResponse.data) {
        setBorrowedBooks(borrowedBooksResponse.data.borrowedBookIds);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.message);

      if (error.response?.status === 401) {
        router.push('/Userlogin');
      }
    } finally {
      setLoading(false);
    }
  };

  fetchUserAndBooks();
}, [router]);

const handleCardClick = async (bookTitle, bookId, adminId) => {
  try {
    const response = await axios.get(`http://localhost:3002/libraries/${bookTitle}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      withCredentials: true,
    });
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      setLibraries(response.data);
      setSelectedBook({
        title: bookTitle,
        id: bookId,
        adminId: adminId  // Make sure to include adminId here
      });
      setIsModalOpen(true);
    } else {
      throw new Error('No library information available');
    }
  } catch (error) {
    console.error('Error fetching libraries:', error);
    alert('Error fetching library information. Please try again.');
  }
};




if (loading) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex justify-center items-center">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-8 flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gray-800 rounded-full animate-spin"></div>
          <Loader2 className="w-8 h-8 text-gray-800 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-lg font-medium bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-black">
          Loading your library...
        </p>
      </div>
    </div>
  );
}

if (error) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex justify-center items-center p-4">
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-red-100 p-8 max-w-lg w-full">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-gray-800" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Error Occurred</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-gray-800 to-black text-white rounded-xl font-medium hover:from-black hover:to-gray-900 transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

  return (
  <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
    <div className="container mx-auto px-6 py-12">
      <div className="mb-12">
        {/* Enhanced Header Section with black theme */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-black mb-4">
            {userEducation
              ? `Recommended Books for ${userEducation} Students`
              : 'Book Recommendations'}
          </h1>
          
          {/* Navigation Tabs with black theme */}
          <nav className="flex space-x-2">
            {['All Books', 'Bestsellers', 'New Releases', 'On Sale'].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                    tab === activeTab
                      ? 'bg-gradient-to-r from-gray-800 to-black text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </nav>
        </div>

        {/* Content Section with black theme */}
        <div className="space-y-12">
          {Object.entries(books).map(([category, bookList]) => (
            <div key={category} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
              <GenreSection
                title={category}
                books={bookList}
                borrowedBooks={borrowedBooks}
                onBorrow={handleBorrowFromLibrary}
                onCardClick={handleCardClick}
              />
            </div>
          ))}
        </div>

        {/* Keep existing LibraryModal */}
        <LibraryModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          libraries={libraries}
          selectedBook={selectedBook}
          onBorrowFromLibrary={handleBorrowFromLibrary}
        />
      </div>
    </div>
  </div>
);
};
export default LoginHomePage;