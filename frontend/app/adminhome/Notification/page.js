'use client';
import { useState, useEffect } from 'react';
import { Bell, X, Trash2, BookOpen, Clock, User, Trash } from 'lucide-react';
import axios from 'axios';

const Notification = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [adminId, setAdminId] = useState(null);

  // Fetch the admin info to retrieve the adminId
  const fetchAdmin = async () => {
    try {
      const response = await axios.get('http://localhost:3002/admin', {
        withCredentials: true,
      });
      // Assuming the endpoint returns an object with an "id" property
      setAdminId(response.data.id);
    } catch (error) {
      console.error('Error fetching admin info:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      if (!adminId) return; // Wait for adminId to be fetched
      // Use the correct endpoint with adminId as a query parameter
      const response = await axios.get('http://localhost:3002/adminnotifications', {
        params: { adminId },
        withCredentials: true,
      });
      console.log('All notifications from server:', response.data);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    fetchAdmin();
  }, []);

  useEffect(() => {
    if (adminId) {
      fetchNotifications();
      // Poll for notifications every minute once adminId is available
      const interval = setInterval(fetchNotifications, 60000);
      return () => clearInterval(interval);
    }
  }, [adminId]);

const handleDelete = async (notificationId) => {
  try {
    // Use the correct endpoint URL matching your backend route
    await axios.delete(`http://localhost:3002/adminnotification/${notificationId}`, {
      withCredentials: true,
    });
    setNotifications(prev => prev.filter(n => n._id !== notificationId));
  } catch (error) {
    console.error('Error deleting notification:', error);
  }
};

const handleClearAll = async () => {
  try {
    await axios.delete(`http://localhost:3002/adminnotifications/clear-all`, {
      params: { adminId },
      withCredentials: true,
    });
    setNotifications([]);
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
};

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full hover:bg-slate-100 relative transition-all duration-200 group"
      >
        <Bell className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="fixed right-4 top-16 w-[480px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden transition-all duration-200 animate-slideIn">
          <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-slate-700" />
              <h3 className="font-semibold text-slate-700">Notifications</h3>
              {notifications.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-500 rounded-full">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                >
                  <Trash className="w-3.5 h-3.5 mr-1.5" />
                  Clear All
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <Bell className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-500 text-center">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <div 
                    key={notification._id} 
                    className="group p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {notification.bookId && notification.bookId.title ? (
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Bell className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 font-medium mb-1">
                          {notification.message}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <div className="flex items-center text-slate-500">
                            <Clock className="w-3.5 h-3.5 mr-1" />
                            {new Date(notification.createdAt).toLocaleString()}
                          </div>
                          {notification.userId && notification.userId.name && (
                            <div className="flex items-center text-blue-600">
                              <User className="w-3.5 h-3.5 mr-1" />
                              {notification.userId.name}
                            </div>
                          )}
                          {notification.bookId && notification.bookId.title && (
                            <div className="flex items-center text-emerald-600">
                              <BookOpen className="w-3.5 h-3.5 mr-1" />
                              {notification.bookId.title}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-500 transition-all duration-200"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add global styles */}
      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.2s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #e2e8f0;
          border-radius: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background-color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default Notification;