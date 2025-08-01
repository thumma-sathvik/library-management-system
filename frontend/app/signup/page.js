'use client';
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';

const educationOptions = [
  'Computer Science',
  'Commerce',
  'Engineering & Technology',
  'Arts & Humanities',
  'Business & Management',
  'Medical & Healthcare',
  'Law',
  'Agriculture & Environment'
];

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    education: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  if (!formData.name || !formData.email || !formData.password || !formData.education) {
    setError('All fields are required');
    setLoading(false);
    return;
  }

  try {
    const response = await axios.post(
      'http://localhost:3002/Usersignup',
      formData, 
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true, // Ensure cookies are sent
      }
    );
      if (response.status === 201) {
        alert('Signup successful!');
        console.log(response.data);
        router.push('/login');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {/* Header Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Create Account
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Join us to get started with your journey
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Name Input */}
          <div className="space-y-1">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              placeholder="John Doe"
            />
          </div>

          {/* Email Input */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              placeholder="john@example.com"
            />
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="block w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900"
              placeholder="••••••••"
            />
          </div>

          {/* Education Dropdown */}
          <div className="space-y-1" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700">
              Field of Education
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="relative w-full px-4 py-3 text-left bg-white rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <span className={formData.education ? 'text-gray-900' : 'text-gray-400'}>
                  {formData.education || 'Select your field of education'}
                </span>
                <span className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <ChevronDown
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </span>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
                  <ul className="py-1 max-h-60 overflow-auto">
                    {educationOptions.map((option) => (
                      <li
                        key={option}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, education: option }));
                          setIsDropdownOpen(false);
                        }}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-gray-900">{option}</span>
                        {formData.education === option && (
                          <Check className="h-4 w-4 text-blue-500" />
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
