import { Schema, model } from 'mongoose';

// Define schema for User
const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  education: {
    type: String,
    required: [true, 'Education field is required'],
    trim: true,
    enum: [
      'Computer Science',
      'Commerce',
      'Engineering & Technology',
      'Arts & Humanities',
      'Business & Management',
      'Medical & Healthcare',
      'Law',
      'Agriculture & Environment'
    ]
  }
});

// Location Schema
const LocationSchema = new Schema({
  adminId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Admin', 
    required: true,
    unique: true
  },
  name: { 
    type: String, 
    required: true 
  },
  latitude: { 
    type: Number, 
    required: true,
    min: -90,
    max: 90
  },
  longitude: { 
    type: Number, 
    required: true,
    min: -180,
    max: 180
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add index for faster queries
LocationSchema.index({ adminId: 1, latitude: 1, longitude: 1 });

// Admin Schema
const AdminSchema = new Schema({
  Library_name: { type: String, required: true },
  address: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

// Add Book Schema
const AddbookSchema = new Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  education: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  description: { type: String, required: true },
  image: { 
    type: String, 
    required: true, 
    match: /\.(jpg|jpeg|png|gif)$/i 
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
  },
  status: {
    type: String,
    enum: ['Available', 'Not Available'],
    required: true,
    default: 'Available'
  },
  releasedYear: {
    type: Number,
    required: true,
    min: [1800, 'Year must be after 1800'],
    max: [new Date().getFullYear(), 'Year cannot be in the future'],
    validate: {
      validator: Number.isInteger,
      message: 'Year must be a whole number'
    }
  }
}, { timestamps: true });


// Define BorrowedBook schema
const BorrowedBookSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: Schema.Types.ObjectId,
    ref: 'newbook',
    required: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  borrowedAt: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// Pre-save hook to set the `dueDate` 30 days after `borrowedAt`
BorrowedBookSchema.pre('save', function (next) {
  if (!this.dueDate) {
    const borrowedAt = this.borrowedAt || new Date();
    this.dueDate = new Date(borrowedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  next();
});
const NotificationSchema = new Schema({
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true,
    index: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for system notifications
  },
  bookId: {
    type: Schema.Types.ObjectId,
    ref: 'newbook',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'reserve', 'return', 'warning', 'system'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true // Add index for sorting
  }
});

// Add indexes for better query performance
NotificationSchema.index({ adminId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1 });
NotificationSchema.index({ read: 1 });

const OrderHistorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookId: {
    type: Schema.Types.ObjectId,
    ref: 'newbook',
    required: true
  },
  adminId: {
    type: Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  borrowedAt: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    required: true
  }
}, { timestamps: true });

// Models
const User = model('User', userSchema);
const Admin = model('Admin', AdminSchema);
const newbook = model('newbook', AddbookSchema);
const BorrowedBook = model('BorrowedBook', BorrowedBookSchema);
const Location = model('Location', LocationSchema);
const Notification = model('Notification', NotificationSchema);
const OrderHistory = model('OrderHistory', OrderHistorySchema);

export { User, Admin, newbook, BorrowedBook, Location, Notification, OrderHistory };
