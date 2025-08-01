import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import { User, Admin, newbook, BorrowedBook, Location, Notification , OrderHistory} from "./schema.js";
import { verifyToken, checkAdmin, checkUser } from "./middleware.js";
import { fileURLToPath } from 'url';  // add this import
import path from 'path';   
import connectDB from "./database.js";  
import jwt from 'jsonwebtoken';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Ensure PATCH is listed
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['set-cookie'],
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

// JWT Configuration
const maxAge = 3 * 24 * 60 * 60; // 3 days in seconds
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: maxAge
  });
};

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Database connection
try {
  await connectDB();
  console.log('Database connected successfully');
} catch (error) {
  console.error('Database connection failed:', error);
  process.exit(1);
}

// Protected route example
app.get('/data', verifyToken, async(req, res) => {
  try {
    const userEducation = req.query.education;
    const allBooks = await newbook.find({});
    
    // Group books by category
    const organizedBooks = {};

    allBooks.forEach(book => {
      if (book.education === userEducation || book.education === 'All') {
        const category = book.category;
        
        if (!organizedBooks[category]) {
          organizedBooks[category] = [];
        }

        organizedBooks[category].push({
          adminId:book.adminId,
          title: book.title,
          price: book.price,
          rating: 5,
          imgSrc: `http://localhost:3002/uploads/${book.image}`,
          bestseller: book.stock > 50,
          status: book.status,
          id: book._id,
          author: book.author,
          description: book.description,
          stock: book.stock
        });
      }
    });

    res.json(organizedBooks);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

///user details
app.get('/user', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      name: user.name,
      email: user.email,
      education: user.education
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

app.get('/admin', verifyToken, async (req, res) => {
  try {
    const adminuser = await Admin.findById(req.userId);
    if (!adminuser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      name: adminuser.Library_name,
      email: adminuser.address,
      education: adminuser.email,
      id:adminuser.id,
    
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
})

app.get('/adminuser',verifyToken, async (req, res) => {
  try {
    const user = await Admin.findById(req.userId);
if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
      name: user.Library_name,
      email: user.address,
      address: user.email,
      id:user.id,
    
    });
} catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
})

app.post('/addnewbook', verifyToken, upload.single('image'), async (req, res) => {
  try {
    const adminId = req.userId;
    if (!adminId) {
      return res.status(401).json({ message: "Admin not logged in" });
    }
    if (!req.file) {
      return res.status(400).json({ message: 'Image file is required' });
    }

    // Create a new book including the availability field from req.body
    const newBookData = new newbook({
      ...req.body,
      image: req.file.filename,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      adminId: adminId,
      availability: req.body.availability || 'Available' // <-- ensure availability is set
    });

    const savedBook = await newBookData.save();
    console.log(savedBook);
    res.status(201).json(savedBook);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.post('/Usersignup', async (req, res) => {
  const { name, email, password, education } = req.body;

  try {
    // Validate required fields
    if (!name || !email || !password || !education) {
      const missingFields = [];
      if (!name) missingFields.push('name');
      if (!email) missingFields.push('email');
      if (!password) missingFields.push('password');
      if (!education) missingFields.push('education');
      
      return res.status(400).json({ 
        message: "Missing required fields", 
        fields: missingFields 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: "Invalid email format" 
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ 
        message: "User already exists" 
      });
    }

    // Create a new user without password hashing
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password, // Plain-text password (insecure)
      education: education.trim()
    });

    // Save the user to the database
    const savedUser = await newUser.save();
    const token = createToken(savedUser._id);
    
    // Set the JWT cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge * 1000
    });

    // Respond with success message
    return res.status(201).json({ 
      message: "User created successfully",
      user: {
        UserId: savedUser._id,
        password: savedUser.password
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors).map(err => err.message)
      });
    }

    return res.status(500).json({ 
      message: "Server error",
      detail: "An unexpected error occurred while creating your account",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Authentication endpoints
app.post('/Userlogin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user._id);
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: maxAge * 1000
    });

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: "Server error" });
  }
});

// Admin authentication endpoints
app.post('/Adminlogin', async (req, res) => {
  const { email, password } = req.body;

  // Log secret for debugging
  console.log('JWT Secret:', process.env.JWT_SECRET);

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "User not found" });
    }

    // Add detailed logging
    console.log('Admin found:', admin);
    console.log('Password match:', admin.password === password);

    if (admin.password === password) {
      const token = createToken(admin._id);
      
      // Log token creation
      console.log('Generated Token:', token);

      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: maxAge * 1000
      });

      return res.status(200).json({
        message: "Login successful",
        user: { name: admin.name, email: admin.email }
      });
    } else {
      return res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: "Server error" });
  }
});


app.post('/Adminsignup', async (req, res) => {
  const { Library_name, address, email, password } = req.body;

  // Input validation
  if (!Library_name || !address || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
  }

  try {
    const existingAdmin = await Admin.findOne({ email: email });

    if (existingAdmin) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const newAdmin = new Admin({
      Library_name,
      address,
      email,
      password, // Consider hashing password here
    });

    await newAdmin.save();
    
    const token = createToken(newAdmin._id);  // Create JWT token for the new admin

    // Set the JWT token in a cookie
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: maxAge * 1000 // Expiry set for 3 days
    });

    return res.status(201).json({
      message: "Admin created successfully",
      admin: { Library_name, email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});


app.get("/bookdetails", async (req, res) => {
  try {
    const books = await newbook.find({})
    .populate('adminId','_id');
     // Fetch all books

    // Map over the books to ensure the image URL is constructed correctly
    const processedBooks = books.map(book => ({
      title: book.title,
      author: book.author,
      category: book.category,
      price: book.price,
      stock: book.stock,
      status: book.status,
      imgSrc: book.image ? `http://localhost:3002/uploads/${book.image}` : '', // Make sure this points to the right location
      id: book._id,
      adminId: book.adminId,
      description: book.description
    }));

    res.status(200).json(processedBooks); // Send the processed book data as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching books' });
  }
});


// Borrow book route
// Updated borrow book route with auto stock reduction
app.post('/borrow', verifyToken, async (req, res) => {
  const { bookId, adminId } = req.body;
  const userId = req.userId;

  console.log('Borrow request:', { bookId, adminId, userId });

  try {
    // Find the book
    const book = await newbook.findById(bookId);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Check if stock is available
    if (book.stock <= 0) {
      return res.status(400).json({ message: 'Book is out of stock' });
    }
    
    // Calculate return date (exactly 1 month from now)
    const borrowDate = new Date();
    const returnDate = new Date(borrowDate);
    returnDate.setMonth(returnDate.getMonth() + 1);
    
    // Create borrowing record
    const borrowedBook = new BorrowedBook({
      userId,
      bookId: book._id,
      adminId,
      borrowedAt: borrowDate,
      dueDate: returnDate,
      returnDate: null // Will be set when book is returned
    });
    
    // Save borrowing record
    await borrowedBook.save();
    
    // Reduce stock by 1
    book.stock = Math.max(0, book.stock - 1);
    
    // If stock becomes 0, mark as unavailable
    if (book.stock === 0) {
      book.status = 'Not Available';
    }
    
    // Save updated book
    await book.save();

    res.status(200).json({ 
      message: 'Book borrowed successfully',
      borrowedBook,
      returnDate: returnDate,
      daysToReturn: 30
    });
  } catch (error) {
    console.error('Error in borrow:', error);
    res.status(500).json({ message: 'Failed to borrow book' });
  }
});

//borrowed books
app.get('/borrowed-books', verifyToken, async (req, res) => {
  const userId = req.userId;

  try {
    // Enhanced population of book and admin details
    const borrowedBooks = await BorrowedBook.find({ userId })
      .populate({
        path: 'bookId',
        select: 'title author description image price stock status',
        model: 'newbook'  // Make sure this matches your model name
      })
      .populate({
        path: 'adminId',
        select: 'Library_name address',
        model: 'Admin'
      })
      .lean();  // Convert to plain JavaScript object

    // Transform and validate the data
    const processedBooks = borrowedBooks.map(book => ({
      _id: book._id,
      userId: book.userId,
      bookDetails: book.bookId ? {
        title: book.bookId.title,
        author: book.bookId.author,
        image: book.bookId.image ? `http://localhost:3002/uploads/${book.bookId.image}` : null,
        status: book.bookId.status,
        price: book.bookId.price,
        stock: book.bookId.stock
      } : null,
      libraryDetails: book.adminId ? {
        name: book.adminId.Library_name,
        address: book.adminId.address
      } : null,
      borrowedAt: book.borrowedAt,
      dueDate: book.dueDate
    }));

    // Log for debugging
    console.log('Processed BorrowedBooks:', JSON.stringify(processedBooks, null, 2));

    res.status(200).json({ 
      borrowedBooks: processedBooks,
      count: processedBooks.length 
    });

  } catch (error) {
    console.error('Error fetching borrowed books:', error);
    res.status(500).json({ 
      message: 'Failed to fetch borrowed books',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});
// Add this new endpoint to handle book returns
app.post('/return-book/:borrowId', verifyToken, async (req, res) => {
  try {
    const { borrowId } = req.params;
    console.log(`Processing return for borrowId: ${borrowId}`);

    // Find the borrowing record
    const borrowRecord = await BorrowedBook.findById(borrowId);
    if (!borrowRecord) {
      return res.status(404).json({ error: 'Borrow record not found' });
    }

    // Set the return date to the current date
    const returnDate = new Date();
    borrowRecord.returnDate = returnDate;
    await borrowRecord.save();

    // Find and update the associated book record
    const book = await newbook.findById(borrowRecord.bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Increase the stock by 1
    book.stock = book.stock + 1;
    // If the book was marked as 'Not Available' and there is stock, set it as 'Available'
    if (book.stock > 0 && book.status === 'Not Available') {
      book.status = 'Available';
    }
    await book.save();
    console.log(`Book updated: ${book.title} (Stock: ${book.stock}, Status: ${book.status})`);

    // Archive the borrowing record in OrderHistory
    const orderHistory = new OrderHistory({
      userId: borrowRecord.userId,
      bookId: borrowRecord.bookId,
      adminId: borrowRecord.adminId,
      borrowedAt: borrowRecord.borrowedAt,
      dueDate: borrowRecord.dueDate,
      returnDate: returnDate
    });
    await orderHistory.save();
    console.log('Order history record created.');

    // Fetch user details for notification
    const user = await User.findById(borrowRecord.userId);
    const userName = user ? user.name : 'A user';
    const bookTitle = book.title ? book.title : 'Unknown book';

    // Create a notification for the admin
    const notification = new Notification({
      adminId: borrowRecord.adminId,
      userId: borrowRecord.userId,
      bookId: borrowRecord.bookId,
      message: `${userName} returned "${bookTitle}" (Stock now: ${book.stock})`,
      type: 'return',
      read: false,
      createdAt: new Date()
    });
    await notification.save();
    console.log('Notification created.');

    // Remove the borrowing record from active orders
    await BorrowedBook.findByIdAndDelete(borrowId);
    console.log('Borrowing record deleted.');

    // Send a success response with updated book information
    res.status(200).json({ 
      message: 'Book returned successfully and archived to order history',
      bookId: book._id,
      bookTitle: book.title,
      newStock: book.stock,
      newStatus: book.status,
      returnDate: returnDate
    });
  } catch (error) {
    console.error('Error in return-book endpoint:', error);
    res.status(500).json({ 
      message: 'Failed to return book',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update or add this endpoint for handling stock updates
app.patch('/books/:id/stock', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, status } = req.body;
    
    console.log(`Stock update request received: ID=${id}, Stock=${stock}, Status=${status}`);
    
    // Validate ID
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid book ID' });
    }
    
    // Validate stock
    if (stock === undefined || stock === null) {
      return res.status(400).json({ message: 'Stock value is required' });
    }
    
    // Find the book
    const book = await newbook.findById(id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Parse stock to integer
    const parsedStock = parseInt(stock, 10);
    
    // Update the stock
    book.stock = parsedStock;
    
    // Update the status
    if (status) {
      book.status = status;
    } else {
      book.status = parsedStock > 0 ? 'Available' : 'Not Available';
    }
    
    // Save the updated book
    await book.save();
    
    console.log(`Book updated successfully: ID=${id}, New Stock=${book.stock}, New Status=${book.status}`);
    
    res.status(200).json({
      message: 'Stock updated successfully',
      book
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
});
// Add a POST endpoint as a fallback for PATCH
app.post('/books/:id/update-stock', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, status } = req.body;
    
    console.log(`Stock update request received (POST): ID=${id}, Stock=${stock}, Status=${status}`);
    
    // Validate ID
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Invalid book ID' });
    }
    
    // Validate stock
    if (stock === undefined || stock === null) {
      return res.status(400).json({ message: 'Stock value is required' });
    }
    
    // Find the book
    const book = await newbook.findById(id);
    
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    // Parse stock to integer
    const parsedStock = parseInt(stock, 10);
    
    // Update the stock
    book.stock = parsedStock;
    
    // Update the status
    if (status) {
      book.status = status;
    } else {
      book.status = parsedStock > 0 ? 'Available' : 'Not Available';
    }
    
    // Save the updated book
    await book.save();
    
    console.log(`Book updated successfully: ID=${id}, New Stock=${book.stock}, New Status=${book.status}`);
    
    res.status(200).json({
      message: 'Stock updated successfully',
      book
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Failed to update stock', error: error.message });
  }
});
// In index.js, update the libraries endpoint
app.get('/libraries/:bookTitle', verifyToken, async (req, res) => {
  const { bookTitle } = req.params;
  try {
    const books = await newbook.find({ title: bookTitle })
      .populate('adminId', 'Library_name address');
    
    if (!books || books.length === 0) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.status(200).json(books);
  } catch (error) {
    console.error('Error fetching book data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/bookquery', verifyToken, async (req, res) => {
  const { query } = req.query; // Accessing query from req.query
  try {
    const result = await newbook.find({ title: { $regex: query, $options: 'i' } }); // Assuming you're searching by book title
    
    if (result.length > 0) {
      // Adding imgSrc to each book in the result
      result.forEach(book => {
        book.image = `http://localhost:3002/uploads/${book.image}`;
      });

      res.json(result);
    } else {
      res.status(404).json({ message: 'Book not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.get('/adminnotification', async(req,res) =>{

})
app.get('/orders', verifyToken, async (req, res) => {
  try {
    const { adminId } = req.query;
    console.log('Searching for orders with adminId:', adminId);

    const orders = await BorrowedBook.find({ adminId })
      .populate({
        path: 'bookId',
        model: 'newbook',
        select: 'title author price image'
      })
      .populate({
        path: 'userId',
        model: 'User',
        select: 'name email'
      })
      .sort({ borrowedAt: -1 }) // Most recent first
      .lean();

    // Debug logging
    console.log('Found orders:', JSON.stringify(orders, null, 2));

    if (!orders.length) {
      return res.status(200).json([]);
    }

    const processedOrders = orders.map(order => {
      if (!order.bookId) {
        console.log('Missing bookId for order:', order._id);
      }
      
      return {
        _id: order._id,
        userId: {
          _id: order.userId?._id,
          name: order.userId?.name || 'Unknown User'
        },
        bookId: order.bookId ? {
          _id: order.bookId._id,
          title: order.bookId.title,
          author: order.bookId.author
        } : null,
        borrowedAt: order.borrowedAt,
        dueDate: order.dueDate
      };
    });

    res.json(processedOrders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Replace or update the existing borrowing-records endpoint
app.get('/borrowing-records', verifyToken, async (req, res) => {
  try {
    const { adminId } = req.query;
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }
    
    const records = await BorrowedBook.find({ adminId })
      .populate({
        path: 'bookId',
        select: 'title author status',
        model: 'newbook'
      })
      .populate({
        path: 'userId',
        select: 'name email',
        model: 'User'
      })
      .sort({ borrowedAt: -1 })
      .lean();

    // Transform the data to ensure all required fields are present
    const processedRecords = records.map(record => ({
      _id: record._id?.toString(),
      borrowedAt: record.borrowedAt || new Date(),
      dueDate: record.dueDate || new Date(),
      userId: {
        _id: record.userId?._id || 'unknown',
        name: record.userId?.name || 'Unknown User',
        email: record.userId?.email || 'No Email'
      },
      bookId: {
        _id: record.bookId?._id || 'unknown',
        title: record.bookId?.title || 'Unknown Book',
        author: record.bookId?.author || 'Unknown Author',
        status: record.bookId?.status || 'Unknown'
      },
      status: record.dueDate && new Date(record.dueDate) < new Date() ? 'Overdue' : 'Active'
    }));

    res.json(processedRecords);
  } catch (error) {
    console.error('Error fetching borrowing records:', error);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});
// Add location endpoint
app.post('/save-location', verifyToken, async (req, res) => {
  const { adminId, name, latitude, longitude } = req.body;

  try {
    // Find existing location for this admin or create new one
    let location = await Location.findOne({ adminId });
    
    if (location) {
      // Update existing location
      location.latitude = latitude;
      location.longitude = longitude;
      await location.save();
    } else {
      // Create new location
      location = new Location({
        adminId,
        name,
        latitude,
        longitude
      });
      await location.save();
    }

    res.status(200).json(location);
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ message: 'Error saving location data' });
  }
});

// Add this new endpoint
app.get('/locations', verifyToken, async (req, res) => {
  try {
    const { adminIds } = req.query;
    
    if (!adminIds) {
      return res.status(400).json({ message: 'Admin IDs are required' });
    }

    const adminIdArray = adminIds.split(',');
    
    const locations = await Location.find({
      adminId: { $in: adminIdArray }
    });

    res.status(200).json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Error fetching location data' });
  }
});


app.get('/users', async (req, res) => {
  const users = await User.find({});
  if (!users) {
    res.json("user not found");
  } else {
    res.json(users);
    console.log(users);
  }
});

// Logout endpoint
app.post('/logout', (req, res) => {
  res.cookie('jwt', '', {
    maxAge: 1,
    httpOnly: true
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// Delete book endpoint
app.delete('/books/:id', verifyToken, async (req, res) => {
  try {
    const bookId = req.params.id;
    await newbook.findByIdAndDelete(bookId);
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Failed to delete book' });
  }
});

// Delete order endpoint
app.delete('/orders/:id', verifyToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log('orderid',orderId);
    await BorrowedBook.findByIdAndDelete(orderId);
    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ message: 'Failed to delete order' });
  }
});



//order history 
app.post('/return-book/:borrowId', verifyToken, async (req, res) => {
  try {
    const { borrowId } = req.params;
    console.log(`Processing return for borrowId: ${borrowId}`);
    
    // Find the borrowing record
    const borrowRecord = await BorrowedBook.findById(borrowId);
    if (!borrowRecord) {
      console.log('No borrowing record found');
      return res.status(404).json({ message: 'Borrowing record not found' });
    }
    
    // Set the return date to the current date
    const returnDate = new Date();
    
    // Find and update the associated book record
    const book = await newbook.findById(borrowRecord.bookId);
    if (!book) {
      console.log('Associated book not found');
      return res.status(404).json({ message: 'Associated book not found' });
    }
    
    // Increase the stock by 1 and update status if necessary
    book.stock = book.stock + 1;
    if (book.status === 'Not Available' && book.stock > 0) {
      book.status = 'Available';
    }
    await book.save();
    console.log(`Book updated: ${book.title} (Stock: ${book.stock}, Status: ${book.status})`);
    
    // Archive the borrowing record in OrderHistory
    const orderHistory = new OrderHistory({
      userId: borrowRecord.userId,
      bookId: borrowRecord.bookId,
      adminId: borrowRecord.adminId,
      borrowedAt: borrowRecord.borrowedAt,
      dueDate: borrowRecord.dueDate,
      returnDate: returnDate
    });
    await orderHistory.save();
    console.log('Order history record created.');
    
    // Fetch user details for notification
    const user = await User.findById(borrowRecord.userId);
    const userName = user ? user.name : 'A user';
    const bookTitle = book.title || 'Unknown book';
    
    // Create a notification for the admin
    const notification = new Notification({
      adminId: borrowRecord.adminId,
      userId: borrowRecord.userId,
      bookId: borrowRecord.bookId,
      message: `${userName} returned "${bookTitle}" (Stock now: ${book.stock})`,
      type: 'return',
      read: false,
      createdAt: new Date()
    });
    await notification.save();
    console.log('Notification created.');
    
    // Remove the borrowing record from active orders
    await BorrowedBook.findByIdAndDelete(borrowId);
    console.log('Borrowing record deleted.');
    
    // Send a success response with updated book information
    res.status(200).json({ 
      message: 'Book returned successfully and archived to order history',
      bookId: book._id,
      bookTitle: book.title,
      newStock: book.stock,
      newStatus: book.status,
      returnDate: returnDate
    });
    
  } catch (error) {
    console.error('Error in return-book endpoint:', error);
    res.status(500).json({ 
      message: 'Failed to return book',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// Delete user endpoint
app.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    console.log('userid',userId);
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});
app.delete('/books/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const book = await newbook.findById(id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    await book.remove();
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    console.error('Error deleting book:', error);
    res.status(500).json({ message: 'Error deleting book' });
  }
});
// On your backend server
app.patch('/books/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const updatedBook = await newbook.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!updatedBook) {
      return res.status(404).json({ message: 'Book not found' });
    }
    
    res.json(updatedBook);
  } catch (error) {
    res.status(500).json({ message: 'Error updating book status', error });
  }
});
app.put('/books/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    // Find the book by ID
    const book = await newbook.findById(id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    // Update the availability field
    book.status = status;

    // Save the updated book
    await book.save();

    // Respond with the updated book
    res.status(200).json({ message: 'Book availability updated successfully', book });
  } catch (error) {
    console.error('Error updating book availability:', error);
    res.status(500).json({ message: 'Failed to update availability', error });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('jwt', { path: '/', httpOnly: true, secure: true }); // Ensure the same path and domain as when the cookie was set
  res.send({ message: 'Logged out successfully' });
});

app.post('/adminnotification', verifyToken, async (req, res) => {
  try {
    const { adminId, userId, bookId, message, type = 'info' } = req.body;
    
    // Enhanced validation
    if (!adminId || !bookId || !message) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        details: { 
          adminId: !adminId ? 'missing' : 'present',
          bookId: !bookId ? 'missing' : 'present',
          message: !message ? 'missing' : 'present'
        }
      });
    }

    // Verify that referenced documents exist
    const [admin, book, user] = await Promise.all([
      Admin.findById(adminId),
      newbook.findById(bookId),
      userId ? User.findById(userId) : null
    ]);

    if (!admin || !book) {
      return res.status(404).json({
        error: 'Referenced document not found',
        details: {
          admin: admin ? 'found' : 'not found',
          book: book ? 'found' : 'not found'
        }
      });
    }

    // Create and save notification with validation
    const notification = new Notification({
      adminId,
      userId,
      bookId,
      message: message.trim(),
      type,
      read: false,
      createdAt: new Date()
    });

    const savedNotification = await notification.save();
    
    // Populate referenced fields with error handling
    const populatedNotification = await Notification.findById(savedNotification._id)
      .populate('adminId', 'Library_name')
      .populate('bookId', 'title')
      .populate('userId', 'name email')
      .lean()
      .catch(err => {
        console.error('Population error:', err);
        return savedNotification;
      });

    // Send success response with populated data
    res.status(201).json({
      message: 'Notification created successfully',
      notification: populatedNotification
    });

  } catch (error) {
    console.error('Server error creating notification:', error);
    
    // Enhanced error response
    res.status(500).json({
      error: 'Failed to create notification',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

// 4. Add notification retrieval endpoint
app.get('/adminnotifications', verifyToken, async (req, res) => {
  try {
    const { adminId } = req.query;
    
    if (!adminId) {
      return res.status(400).json({ error: 'Admin ID is required' });
    }

    const notifications = await Notification.find({ adminId })
      .populate('adminId', 'Library_name')
      .populate('bookId', 'title')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});
app.delete('/adminnotification/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotification = await Notification.findByIdAndDelete(id);
    if (!deletedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ success: true, deletedNotification });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Server error deleting notification' });
  }
});

// Add this endpoint after your other notification endpoints
app.delete('/adminnotifications/clear-all', verifyToken, async (req, res) => {
  try {
    const { adminId } = req.query;
    
    if (!adminId) {
      return res.status(400).json({ message: 'Admin ID is required' });
    }

    // Delete all notifications for the specified admin
    const result = await Notification.deleteMany({ adminId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'No notifications found to delete' });
    }

    res.status(200).json({ 
      message: 'All notifications cleared successfully',
      deletedCount: result.deletedCount 
    });

  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ 
      message: 'Failed to clear notifications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


// 5. Add notification mark as read endpoint
app.patch('/adminnotifications/:id/read', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.status(200).json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to update notification' });
  }
});

//analytics
// Add analytics endpoint
app.get('/analytics', verifyToken, async (req, res) => {
  try {
      const { timeframe } = req.query;
      const adminId = req.userId; // Use the admin's id from the token

      // Determine start date based on timeframe (week, month, year)
      const now = new Date();
      let startDate = new Date();
      if (timeframe === 'week') {
          startDate.setDate(now.getDate() - 7);
      } else if (timeframe === 'year') {
          startDate.setFullYear(now.getFullYear() - 1);
      } else {
          // default to month
          startDate.setMonth(now.getMonth() - 1);
      }

      // Fetch borrowed books for this admin in the chosen timeframe
      const borrowedBooks = await BorrowedBook.find({
          adminId,
          borrowedAt: { $gte: startDate }
      });

      // Calculate total borrows
      const totalBorrows = borrowedBooks.length;

      // Calculate Top Books grouped by bookId
      const topBooksMap = {};
      borrowedBooks.forEach(record => {
          const key = record.bookId.toString();
          topBooksMap[key] = (topBooksMap[key] || 0) + 1;
      });

      // Fetch and build topBooks with book title
      const topBooksArr = await Promise.all(Object.entries(topBooksMap).map(async ([bookId, count]) => {
          const book = await newbook.findById(bookId);
          return {
              id: bookId,
              title: book ? book.title : "Unknown",
              borrows: count
          };
      }));
      const topBooks = topBooksArr.sort((a, b) => b.borrows - a.borrows).slice(0, 5);

      // Calculate Top Categories (fetch category via each book)
      const categoryCount = {};
      for (const record of borrowedBooks) {
          const book = await newbook.findById(record.bookId);
          if (book && book.category) {
              categoryCount[book.category] = (categoryCount[book.category] || 0) + 1;
          }
      }
      const topCategories = Object.entries(categoryCount)
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

      // Build Borrowing Trends between startDate and now
      const borrowingTrends = [];
      let currentDate = new Date(startDate);
      while (currentDate <= now) {
          const dateStr = currentDate.toISOString().split('T')[0];
          const count = borrowedBooks.filter(b =>
              b.borrowedAt.toISOString().split('T')[0] === dateStr
          ).length;
          borrowingTrends.push({ date: dateStr, borrows: count });
          currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate User Stats: activeUsers and topUsers
      const userSet = new Set(borrowedBooks.map(b => b.userId.toString()));
      const activeUsers = userSet.size;
      const userCount = {};
      borrowedBooks.forEach(record => {
          const key = record.userId.toString();
          userCount[key] = (userCount[key] || 0) + 1;
      });
      const topUsers = Object.entries(userCount)
          .map(([userId, borrows]) => ({ id: userId, borrows }))
          .sort((a, b) => b.borrows - a.borrows)
          .slice(0, 5);
      const userStats = { activeUsers, topUsers };

      // Calculate Overall Stats (using placeholder values for trends/ratings)
      const returnedCount = borrowedBooks.filter(b => b.returnDate).length;
      const returnRate = totalBorrows ? Math.round((returnedCount / totalBorrows) * 100) : 0;
      const overallStats = {
          totalBorrows,
          borrowTrend: 0, // placeholder; you may add trend calculations if needed
          avgRating: 4.5, // placeholder value
          ratingTrend: 0, // placeholder
          returnRate,
          returnTrend: 0 // placeholder
      };

      res.json({
          topBooks,
          topCategories,
          borrowingTrends,
          userStats,
          overallStats
      });
  } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to fetch analytics data' });
  }
});
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));