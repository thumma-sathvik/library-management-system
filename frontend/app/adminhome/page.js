'use client'
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { 
  BookOpen, Users, ShoppingCart, BarChart2, 
  Edit, Trash2, Plus, Search, ArrowRight
} from 'lucide-react';

// TabPanel Component
const TabPanel = ({ children, value, index }) => (
  <div className={`${value === index ? 'block' : 'hidden'}`}>
    {children}
  </div>
);

// Stats Card Component with consistent colored icons
const StatsCard = ({ title, value, icon, linkTo }) => (
  <Link href={linkTo}>
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <h3 className="text-3xl font-bold mt-2 text-gray-800">{value}</h3>
        </div>
        <div className={`rounded-full p-3 ${
          title === 'Total Books' ? 'bg-blue-600' : 
          title === 'Active Borrowings' ? 'bg-amber-600' : 
          'bg-emerald-600'
        }`}>
          {icon}
        </div>
      </div>
      <div className="mt-auto flex items-center text-gray-700 font-medium text-sm">
        <span>View details</span>
        <ArrowRight size={16} className={`ml-1 ${
          title === 'Total Books' ? 'text-blue-600' : 
          title === 'Active Borrowings' ? 'text-amber-600' : 
          'text-emerald-600'
        }`} />
      </div>
    </div>
  </Link>
);

// Books Table Component – Updated hover states to match theme
const BooksTable = ({ books }) => {
  const router = useRouter();
  const displayedBooks = books.slice(0, 3); // Now displaying only 3 records
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mt-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Recent Books</h3>
          <p className="text-xs text-gray-500 mt-1">Your latest library additions</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <BookOpen size={14} className="text-indigo-600 mr-1.5" />
                  Book
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-100">
            {displayedBooks.map((book, index) => (
              <tr key={book._id ? book._id : `book-${index}`} className="group hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-lg relative flex-shrink-0 bg-gray-100 overflow-hidden border border-gray-200">
                      <Image
                        src={book.imgSrc || "/placeholder-book.jpg"}
                        alt={book.title}
                        fill
                        sizes="48px"
                        className="object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/placeholder-book.jpg";
                        }}
                      />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                        {book.title}
                      </div>
                      <div className="text-xs text-gray-500">{book.author}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full inline-flex items-center">
                    <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                      book.category === 'Fiction' ? 'bg-indigo-500' :
                      book.category === 'Science' ? 'bg-amber-500' :
                      book.category === 'History' ? 'bg-emerald-500' :
                      'bg-gray-500'
                    }`}></span>
                    {book.category || 'Uncategorized'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{book.stock}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${book.status === 'Available' ? 'bg-green-100 text-green-800' : 
                      book.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' : 
                     'bg-red-100 text-red-800'}`}>
                    {book.status === 'Available' && <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5 inline-block"></span>}
                    {book.status === 'Not Available' && <span className="w-1.5 h-1.5 bg-amber-600 rounded-full mr-1.5 inline-block"></span>}
                    {book.status === 'Out of Stock' && <span className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1.5 inline-block"></span>}
                    {book.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
        <Link 
          href="/admin/manage-books"
          className="text-sm text-gray-700 hover:text-gray-900 font-medium flex items-center"
        >
          <span>View All Books</span>
          <ArrowRight size={16} className="ml-1 text-indigo-600" />
        </Link>
      </div>
    </div>
  );
};

// Orders Table Component - Updated with black/white theme
const OrdersTable = ({ orders }) => {
  const activeOrders = orders
    .filter(order => order.status === 'Active' || !order.status)
    .sort((a, b) => new Date(b.borrowedAt) - new Date(a.borrowedAt))
    .slice(0, 3);
    
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mt-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Active Borrowings</h3>
          <p className="text-xs text-gray-500 mt-1">Current borrowers in your library</p>
        </div>
      </div>
      
      {activeOrders.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Borrower
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Book
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Borrowed Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white divide-y divide-gray-100">
              {activeOrders.map((order) => {
                const now = new Date();
                const dueDate = new Date(order.dueDate);
                const isOverdue = now > dueDate;
                const diffTime = Math.abs(now - dueDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const daysText = isOverdue 
                  ? `${diffDays} day${diffDays !== 1 ? 's' : ''} overdue` 
                  : `${diffDays} day${diffDays !== 1 ? 's' : ''} remaining`;
                 
                return (
                  <tr key={order._id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium text-sm">
                          {order.userId?.name ? order.userId.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                            {order.userId?.name || 'Unknown User'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.bookId?.title || 'Unknown Book'}
                      </div>
                      <div className="text-xs text-gray-500">
                        by {order.bookId?.author || 'Unknown Author'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(order.borrowedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {new Date(order.dueDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className={`text-xs ${isOverdue ? 'text-red-500' : 'text-green-600'}`}>
                          {daysText}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <ShoppingCart className="h-12 w-12 text-amber-300 mx-auto mb-3" />
          <p className="text-gray-500">No active borrowings at the moment</p>
        </div>
      )}
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
        <Link 
          href="/admin/borrowing-records"
          className="text-sm text-gray-700 hover:text-gray-900 font-medium flex items-center"
        >
          <span>View All Borrowings</span>
          <ArrowRight size={16} className="ml-1 text-amber-600" />
        </Link>
      </div>
    </div>
  );
};

// Users Table Component – Updated to show borrowed books count
const UsersTable = ({ users, orders }) => {
  // Calculate borrowed books count for each user
  const userBorrowCounts = {};
  
  orders.forEach(order => {
    if (order.userId && order.userId._id) {
      const userId = order.userId._id;
      if (!userBorrowCounts[userId]) {
        userBorrowCounts[userId] = 0;
      }
      
      // Only count active borrowings
      if (order.status === 'Active' || !order.status) {
        userBorrowCounts[userId]++;
      }
    }
  });
  
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 mt-6">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-lg font-bold text-gray-800">Recent Users</h3>
          <p className="text-xs text-gray-500 mt-1">Latest user registrations actively borrowing</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Education</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <BookOpen size={14} className="text-emerald-600 mr-1.5" />
                  Books Borrowed
                </div>
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {users.slice(0, 5).map((user) => (
              <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ml-3 text-sm font-medium text-gray-900">{user.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{user.education || 'Not specified'}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${userBorrowCounts[user._id] > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                      {userBorrowCounts[user._id] || 0} book{userBorrowCounts[user._id] !== 1 ? 's' : ''}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
        <Link 
          href="/admin/manage-users"
          className="text-sm text-gray-700 hover:text-gray-900 font-medium flex items-center"
        >
          <span>View All Users</span>
          <ArrowRight size={16} className="ml-1 text-emerald-600" />
        </Link>
      </div>
    </div>
  );
};

// Main AdminDashboard Component
const AdminDashboard = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [books, setBooks] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserDataAndOrders = async () => {
      try {
        setLoading(true);
        setError(null);

        const adminResponse = await axios.get('http://localhost:3002/admin', {
          withCredentials: true,
        });
        setAdmin(adminResponse.data);
        const adminId = adminResponse.data.id;

        // Fetch and filter books
        const booksResponse = await axios.get('http://localhost:3002/bookdetails', {
          withCredentials: true,
        });
        const filteredBooks = booksResponse.data.filter(book => book.adminId._id === adminId);
        setBooks(filteredBooks);

        // Fetch orders
        const ordersResponse = await axios.get('http://localhost:3002/orders', {
          params: { adminId: adminId },
          withCredentials: true,
        });
        setOrders(ordersResponse.data);

        // Fetch users
        const usersResponse = await axios.get('http://localhost:3002/users', {
          withCredentials: true,
        });
        setUsers(usersResponse.data);
      } catch (error) {
        setError('Failed to fetch data');
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-indigo-600 border-r-amber-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-xl shadow-md max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-black"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter users to only those currently borrowing something
  const activeUserIds = Array.from(new Set(orders
    .filter(o => o.status === 'Active' || !o.status)
    .map(o => o.userId._id)));
  const filteredUsers = users.filter(u => activeUserIds.includes(u._id));

  // Stats cards with themed icons and colors
  const stats = [
    { 
      title: 'Total Books', 
      value: books.length, 
      icon: <BookOpen size={24} className="text-white" />, 
      linkTo: '/admin/manage-books'
    },
    { 
      title: 'Active Borrowings', 
      value: orders.filter(o => o.status === 'Active' || !o.status).length, 
      icon: <ShoppingCart size={24} className="text-white" />, 
      linkTo: '/admin/borrowing-records'
    },
    { 
      title: 'Users', 
      value: filteredUsers.length, 
      icon: <Users size={24} className="text-white" />, 
      linkTo: '/admin/manage-users'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header with greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome back, {admin?.Library_name || 'Admin'}</h1>
          <p className="text-gray-600">Here's what's happening with your library today</p>
        </div>

        {/* Quick Action Button */}
        <div className="mb-8 flex justify-end">
          <Link 
            href="/admin/Addnewbook"
            className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-2 rounded-lg hover:from-black hover:to-gray-800 transition-colors flex items-center gap-2"
          >
            <Plus size={18} className="text-white" />
            <span>Add New Book</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Tabs */}
        <div className="mt-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              <button 
                onClick={() => setActiveTab(0)} 
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 0 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                <BookOpen size={16} className={`mr-1.5 ${activeTab === 0 ? 'text-blue-600' : 'text-gray-400'}`} />
                Books
              </button>
              
              <button 
                onClick={() => setActiveTab(1)} 
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 1 
                    ? 'border-amber-600 text-amber-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                <ShoppingCart size={16} className={`mr-1.5 ${activeTab === 1 ? 'text-amber-600' : 'text-gray-400'}`} />
                Borrowings
              </button>
              
              <button 
                onClick={() => setActiveTab(2)} 
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === 2 
                    ? 'border-emerald-600 text-emerald-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } transition-colors`}
              >
                <Users size={16} className={`mr-1.5 ${activeTab === 2 ? 'text-emerald-600' : 'text-gray-400'}`} />
                Users
              </button>
            </nav>
          </div>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <BooksTable books={books} />
          </TabPanel>
          
          <TabPanel value={activeTab} index={1}>
            <OrdersTable orders={orders} />
          </TabPanel>
          
          <TabPanel value={activeTab} index={2}>
            <UsersTable users={filteredUsers} orders={orders} />
          </TabPanel>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;