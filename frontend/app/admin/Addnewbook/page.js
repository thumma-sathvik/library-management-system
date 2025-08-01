'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Check, X, Upload, BookOpen, Clock, DollarSign, 
  Package, AlertCircle, BookType, ArrowLeft, Sparkles,
  ImageIcon, UserIcon, FileText, School
} from 'lucide-react';
import axios from 'axios';
import Image from 'next/image';

const BOOK_CATEGORIES = [
  'Fiction', 'Non-Fiction', 'Science Fiction', 'Mystery', 'Romance',
  'Biography', 'History', 'Science', 'Technology', 'Business', 'Self-Help'
];

const EDUCATION_OPTIONS = [
  'Computer Science', 'Commerce', 'Engineering & Technology', 'Arts & Humanities',
  'Business & Management', 'Medical & Healthcare', 'Law', 'Agriculture & Environment'
];

// Category color mapping based on dashboard theme
const CATEGORY_COLORS = {
  'Fiction': 'bg-blue-600',
  'Non-Fiction': 'bg-emerald-600',
  'Science Fiction': 'bg-indigo-600',
  'Mystery': 'bg-purple-600',
  'Romance': 'bg-pink-600',
  'Biography': 'bg-amber-600',
  'History': 'bg-emerald-600',
  'Science': 'bg-amber-600',
  'Technology': 'bg-blue-600',
  'Business': 'bg-indigo-600',
  'Self-Help': 'bg-emerald-600',
};

// Text colors to match backgrounds
const CATEGORY_TEXT_COLORS = {
  'Fiction': 'text-blue-600',
  'Non-Fiction': 'text-emerald-600',
  'Science Fiction': 'text-indigo-600',
  'Mystery': 'text-purple-600',
  'Romance': 'text-pink-600',
  'Biography': 'text-amber-600',
  'History': 'text-emerald-600',
  'Science': 'text-amber-600',
  'Technology': 'text-blue-600',
  'Business': 'text-indigo-600',
  'Self-Help': 'text-emerald-600',
};

const AddNewBook = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [bookData, setBookData] = useState({
    title: '',
    author: '',
    category: '',
    education: '',
    price: '',
    stock: '',
    description: '',
    image: null,
    availability: 'Available',
    yearReleased: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [success, setSuccess] = useState(false);
  const [formTouched, setFormTouched] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Track if form has been touched to show validation hints
  useEffect(() => {
    if (bookData.title || bookData.author || bookData.category) {
      setFormTouched(true);
    }
  }, [bookData.title, bookData.author, bookData.category]);

  // Validate form fields
  const validateForm = () => {
    const errors = {};
    const requiredFields = ['title', 'author', 'category', 'description', 'yearReleased', 'price', 'stock'];
    
    requiredFields.forEach(field => {
      if (!bookData[field]) {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace('Released', '')} is required`;
      }
    });
    
    if (!bookData.image) {
      errors.image = 'Cover image is required';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Run validation
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setError('Please fill in all required fields');
      
      // Scroll to the first error
      const firstErrorField = document.getElementById(Object.keys(errors)[0]);
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstErrorField.focus();
      }
      
      return;
    }
    
    setLoading(true);

    try {
      const formData = new FormData();
      
      // Add all fields to formData
      Object.keys(bookData).forEach((key) => {
        if (key === 'image') {
          if (bookData[key]) {
            formData.append(key, bookData[key]);
          }
        } else if (key === 'yearReleased') {
          formData.append('releasedYear', bookData[key]);
        } else {
          formData.append(key, bookData[key]);
        }
      });

      const response = await axios.post('http://localhost:3002/addnewbook', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      if (response.status === 201) {
        // Success! First set success state before trying to create notification
        setSuccess(true);
        
        // Create notification for the new book - protect against undefined adminId
        try {
          const adminId = response.data?.book?.adminId;
          const bookId = response.data?.book?._id;
          
          if (adminId && bookId) {
            await axios.post(
              'http://localhost:3002/adminnotification',
              {
                adminId: adminId,
                bookId: bookId,
                message: `New book "${bookData.title}" has been added to the library`,
                type: 'system'
              },
              {
                withCredentials: true
              }
            );
          }
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Don't let notification error prevent success state
        }

        // Redirect after success
        setTimeout(() => {
          router.push('/adminhome');
        }, 2000);
      }
    } catch (error) {
      console.error('Error adding book:', error);
      setError(
        error.response?.data?.message || 
        error.message ||
        'Failed to add book. Please check all fields and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setError('Please select a valid image file (JPEG, PNG, or GIF)');
        e.target.value = '';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size should not exceed 5MB');
        e.target.value = '';
        return;
      }

      setBookData({ ...bookData, image: file });
      if (validationErrors.image) {
        setValidationErrors({...validationErrors, image: null});
      }
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear validation error for this field when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Get category color or default to gray
  const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || 'bg-gray-600';
  };
  
  // Get category text color
  const getCategoryTextColor = (category) => {
    return CATEGORY_TEXT_COLORS[category] || 'text-gray-600';
  };

  // Get input border class based on validation state
  const getInputBorderClass = (fieldName) => {
    if (validationErrors[fieldName]) {
      return 'border-red-500 focus:ring-red-500/40 focus:border-red-500';
    }
    return 'border-gray-300 focus:ring-blue-500/40 focus:border-blue-500';
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <div className="max-w-md w-full bg-white rounded-xl shadow-xl border border-gray-100 p-10 text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-50 text-green-600 flex items-center justify-center">
              <Check size={48} className="text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Book Added Successfully!</h2>
          <p className="text-gray-700 mb-8">Your new book has been added to the library and is now available.</p>
          <div className="animate-pulse">
            <p className="text-sm text-gray-700 flex items-center justify-center">
              <Sparkles size={16} className="mr-1.5 text-blue-500" />
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-xl border border-gray-100 relative overflow-hidden">
          {/* Floating back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="absolute top-6 left-6 z-10 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-all group"
            title="Back to dashboard"
          >
            <ArrowLeft size={18} className="text-gray-600 group-hover:text-blue-600 transition-colors" />
          </button>
          
          <div className="border-b border-gray-100 px-8 py-6 flex justify-between items-center">
            <div className="pl-10">
              <h2 className="text-2xl font-semibold text-gray-900">Add New Book</h2>
              <p className="mt-1 text-sm text-gray-700">Enter book details to add to your library</p>
            </div>
            <div className="hidden sm:block">
              <div className="bg-blue-50 text-blue-700 py-1.5 px-3 rounded-full text-sm font-medium flex items-center">
                <Sparkles size={14} className="mr-1.5" />
                <span>Create Library Entry</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mx-8 mt-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm flex items-start rounded-r-md">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error</p>
                <p>{error}</p>
              </div>
              <button 
                onClick={() => setError('')} 
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X size={18} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Left column - Book image */}
              <div className="md:col-span-1 space-y-6">
                <div className="space-y-3 group">
                  <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-blue-600 transition-colors">
                    <ImageIcon size={16} className="mr-1.5 text-blue-600" />
                    Cover Image <span className="text-red-500">*</span>
                  </label>
                  <div 
                    id="image"
                    onClick={triggerFileInput}
                    className={`
                      border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer
                      transition-all h-80 relative
                      ${validationErrors.image ? 'border-red-400 bg-red-50' : 
                        previewUrl ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'}
                    `}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,image/gif"
                      required
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {previewUrl ? (
                      <div className="relative w-full h-full">
                        <div className="w-full h-full relative">
                          {/* Fixed Image component by using width and height properly */}
                          <Image 
                            src={previewUrl}
                            alt="Book cover preview"
                            fill
                            style={{objectFit: "contain"}}
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                          <div className="bg-white p-2.5 rounded-full opacity-0 hover:opacity-100 shadow-lg transform hover:scale-110 transition-all">
                            <Upload size={20} className="text-blue-600" />
                          </div>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 bg-white bg-opacity-90 px-3 py-2 rounded-lg text-xs text-gray-700 shadow-sm">
                          {bookData.image?.name && `${bookData.image.name} (${(bookData.image.size / (1024 * 1024)).toFixed(2)} MB)`}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <div className="absolute -inset-1 opacity-30 bg-blue-200 rounded-full blur-sm"></div>
                          <Upload className={`h-12 w-12 ${validationErrors.image ? 'text-red-500' : 'text-blue-500'} relative`} />
                        </div>
                        <p className="text-sm text-gray-700 text-center mt-4">
                          <span className={`font-medium ${validationErrors.image ? 'text-red-600' : 'text-blue-600'}`}>
                            Click to upload
                          </span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          JPG, PNG or GIF (max 5MB)
                        </p>
                        {validationErrors.image && (
                          <p className="text-xs text-red-600 mt-2 bg-red-50 px-2 py-1 rounded-md">
                            {validationErrors.image}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Category Selector with visual preview */}
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-blue-600 transition-colors">
                    <BookType size={16} className="mr-1.5 text-blue-600" />
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={bookData.category}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border rounded-lg bg-white focus:outline-none transition-all group-hover:border-blue-300 text-gray-900 ${getInputBorderClass('category')}`}
                  >
                    <option value="">Select a category</option>
                    {BOOK_CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  
                  {bookData.category && (
                    <div className="flex items-center bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                      <div className={`w-4 h-4 rounded-full ${getCategoryColor(bookData.category)} mr-2`}></div>
                      <span className={`text-gray-800 ${getCategoryTextColor(bookData.category)}`}>
                        <span className="font-medium">{bookData.category}</span> selected
                      </span>
                    </div>
                  )}
                  
                  {validationErrors.category && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md">{validationErrors.category}</p>
                  )}
                </div>

                {/* Availability Switch */}
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-purple-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Availability Status
                  </label>
                  <div className="flex items-center space-x-4">
                    <label className={`relative inline-flex items-center px-3 py-2 rounded-lg cursor-pointer border ${bookData.availability === 'Available' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                      <input
                        type="radio"
                        name="availability"
                        value="Available"
                        checked={bookData.availability === 'Available'}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <span className={`mr-2 w-4 h-4 rounded-full ${bookData.availability === 'Available' ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      <span className={`text-sm font-medium ${bookData.availability === 'Available' ? 'text-green-700' : 'text-gray-700'}`}>Available</span>
                    </label>
                    <label className={`relative inline-flex items-center px-3 py-2 rounded-lg cursor-pointer border ${bookData.availability === 'Not Available' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                      <input
                        type="radio"
                        name="availability"
                        value="Not Available"
                        checked={bookData.availability === 'Not Available'}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <span className={`mr-2 w-4 h-4 rounded-full ${bookData.availability === 'Not Available' ? 'bg-red-500' : 'bg-gray-300'}`}></span>
                      <span className={`text-sm font-medium ${bookData.availability === 'Not Available' ? 'text-red-700' : 'text-gray-700'}`}>Not Available</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right column - Book details */}
              <div className="md:col-span-2 space-y-6">
                {/* Title and Author */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-blue-600 transition-colors">
                      <BookOpen size={16} className="mr-1.5 text-blue-600" />
                      Book Title <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      id="title"
                      type="text"
                      name="title"
                      required
                      placeholder="Enter book title"
                      value={bookData.title}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all group-hover:border-blue-300 text-gray-900 ${getInputBorderClass('title')}`}
                    />
                    {validationErrors.title && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md">{validationErrors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-blue-600 transition-colors">
                      <UserIcon size={16} className="mr-1.5 text-blue-600" />
                      Author <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="author"
                      type="text"
                      name="author"
                      required
                      placeholder="Enter author name"
                      value={bookData.author}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all group-hover:border-blue-300 text-gray-900 ${getInputBorderClass('author')}`}
                    />
                    {validationErrors.author && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md">{validationErrors.author}</p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-blue-600 transition-colors">
                    <FileText size={16} className="mr-1.5 text-emerald-600" />
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    placeholder="Enter book description"
                    value={bookData.description}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all group-hover:border-blue-300 text-gray-900 ${getInputBorderClass('description')}`}
                  />
                  {validationErrors.description && (
                    <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md">{validationErrors.description}</p>
                  )}
                </div>

                {/* Three columns for small details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 group">
                    <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-amber-600 transition-colors">
                      <Clock size={16} className="mr-1.5 text-amber-600" />
                      Year Released <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      id="yearReleased"
                      type="number"
                      name="yearReleased"
                      required
                      min="1900"
                      max={new Date().getFullYear()}
                      placeholder="Year released"
                      value={bookData.yearReleased}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all group-hover:border-amber-300 text-gray-900 ${getInputBorderClass('yearReleased')}`}
                    />
                    {validationErrors.yearReleased && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md">{validationErrors.yearReleased}</p>
                    )}
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-emerald-600 transition-colors">
                      <DollarSign size={16} className="mr-1.5 text-emerald-600" />
                      Price ($) <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      id="price"
                      type="number"
                      name="price"
                      required
                      min="0"
                      step="0.01"
                      placeholder="Enter price"
                      value={bookData.price}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all group-hover:border-emerald-300 text-gray-900 ${getInputBorderClass('price')}`}
                    />
                    {validationErrors.price && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md">{validationErrors.price}</p>
                    )}
                  </div>

                  <div className="space-y-2 group">
                    <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-indigo-600 transition-colors">
                      <Package size={16} className="mr-1.5 text-indigo-600" />
                      Stock Quantity <span className="text-red-500 ml-1">*</span>
                    </label>
                    <input
                      id="stock"
                      type="number"
                      name="stock"
                      required
                      min="0"
                      placeholder="Stock quantity"
                      value={bookData.stock}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none transition-all group-hover:border-indigo-300 text-gray-900 ${getInputBorderClass('stock')}`}
                    />
                    {validationErrors.stock && (
                      <p className="text-xs text-red-600 mt-1 bg-red-50 px-2 py-1 rounded-md">{validationErrors.stock}</p>
                    )}
                  </div>
                </div>

                {/* Field of Education */}
                <div className="space-y-2 group">
                  <label className="text-sm font-medium text-gray-800 flex items-center group-hover:text-blue-600 transition-colors">
                    <School size={16} className="mr-1.5 text-amber-600" />
                    Field of Education
                  </label>
                  <select
                    name="education"
                    value={bookData.education}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all group-hover:border-amber-300 text-gray-900"
                  >
                    <option value="">Select field of education (optional)</option>
                    {EDUCATION_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Form Buttons */}
            <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500/40 disabled:opacity-50 transition-all flex items-center"
                >
                  <X size={18} className="mr-1.5" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-50 transition-all flex items-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      <span>Adding Book...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Sparkles className="w-5 h-5 mr-2" />
                      <span>Add Book to Library</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddNewBook;