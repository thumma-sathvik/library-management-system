'use client';
import Link from 'next/link'

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <main className="container mx-auto px-4 py-12">
        <section className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">About Our Library Management System</h1>
          
          {/* Mission Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              We aim to develop an innovative and user-friendly Library Management System that simplifies the process of locating books across multiple libraries. Our application bridges the gap between users and libraries while promoting an organized and accessible approach to knowledge sharing.
            </p>
            
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="flex-1 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">For Readers</h3>
                <p className="text-gray-600">
                  Discover new books, locate them in libraries near you, and reserve your next great read—all with a few clicks.
                </p>
              </div>
              <div className="flex-1 bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">For Libraries</h3>
                <p className="text-gray-600">
                  Streamline operations, increase visibility, and better serve your community with our comprehensive management tools.
                </p>
              </div>
            </div>
          </div>
          
          {/* Key Features Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Key Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border-l-4 border-black pl-4">
                <h3 className="font-medium text-lg text-gray-800">Advanced Search</h3>
                <p className="text-gray-600">Find books by title or author across multiple libraries</p>
              </div>
              <div className="border-l-4 border-black pl-4">
                <h3 className="font-medium text-lg text-gray-800">Real-time Availability</h3>
                <p className="text-gray-600">See which libraries have your desired book in stock</p>
              </div>
              <div className="border-l-4 border-black pl-4">
                <h3 className="font-medium text-lg text-gray-800">Location-based Searches</h3>
                <p className="text-gray-600">Find libraries near you with your desired books</p>
              </div>
              <div className="border-l-4 border-black pl-4">
                <h3 className="font-medium text-lg text-gray-800">Book Reservation</h3>
                <p className="text-gray-600">Reserve books before visiting the library</p>
              </div>
              <div className="border-l-4 border-black pl-4">
                <h3 className="font-medium text-lg text-gray-800">Personalized Accounts</h3>
                <p className="text-gray-600">Save your preferences and track your reading history</p>
              </div>
              <div className="border-l-4 border-black pl-4">
                <h3 className="font-medium text-lg text-gray-800">Library Information</h3>
                <p className="text-gray-600">Access details like location, hours, and contact information</p>
              </div>
            </div>
          </div>
          
          {/* Technology Stack Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Technology Stack</h2>
            <p className="text-gray-700 mb-6">
              Our application is built using modern web technologies to ensure high performance, reliability, and a seamless user experience:
            </p>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">React.js</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">Next.js</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">Node.js</span>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full">Tailwind CSS</span>
            </div>
            
            <h3 className="text-xl font-semibold text-gray-800 mt-8 mb-3">Coming Soon</h3>
            <p className="text-gray-700 mb-4">
              We're constantly working to improve our system. Future enhancements include:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 pl-4">
              <li>Library inventory management tools</li>
              <li>Personalized book recommendations</li>
              <li>Notification systems for book availability</li>
              <li>Mobile applications for on-the-go access</li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="bg-black text-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="text-xl font-bold mb-2">LibraryHub</div>
              <p className="text-gray-400">Connecting readers with libraries since 2025</p>
            </div>
            <div className="flex space-x-6">
              <Link href="/contact" className="hover:text-gray-300 transition">Contact</Link>
              <Link href="/privacy" className="hover:text-gray-300 transition">Privacy</Link>
              <Link href="/terms" className="hover:text-gray-300 transition">Terms</Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-800 text-center text-gray-400 text-sm">
            &copy; {new Date().getFullYear()} Library Management System. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}