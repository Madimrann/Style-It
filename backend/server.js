const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins explicitly
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(204);
});
app.use(express.json({ limit: '50mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Google Vision API Configuration
const GOOGLE_VISION_API_KEY = process.env.GOOGLE_VISION_API_KEY;
const VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

// Gemini API Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Rembg Service Configuration
const REMBG_SERVICE_URL = process.env.REMBG_SERVICE_URL || 'http://localhost:5001';

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/styleit', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Multer for memory storage (for rembg proxy)
const memoryStorage = multer.memoryStorage();

// MongoDB Schemas
const wardrobeItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  tags: [String],
  occasionTags: [String], // e.g. ["casual", "formal", "sporty", "work", "date"]
  color: String,
  colors: String, // Multiple colors detected
  description: String, // AI-generated description
  style: String, // Style information
  confidence: { type: Number, default: 0.8 },
  createdAt: { type: Date, default: Date.now }
});

const outfitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  items: [{
    name: String,
    category: String,
    image: String,
    tags: [String],
    _id: String // Item ID for duplicate detection
  }],
  occasion: String,
  confidence: { type: Number, default: 0.8 },
  lastWorn: { type: Date }, // Track when outfit was last worn
  createdAt: { type: Date, default: Date.now }
});

const plannedOutfitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  outfit: { type: mongoose.Schema.Types.ObjectId, ref: 'Outfit' }, // Optional reference to saved outfit
  name: { type: String, default: '' }, // Outfit name for this date
  occasion: { type: String, default: '' }, // Occasion for this date
  items: [{ // Direct outfit items data
    name: String,
    category: String,
    image: String,
    tags: [String]
  }],
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Category Schema - for managing apparel categories
const categorySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g., 'tops', 'bottoms'
  label: { type: String, required: true }, // Display name, e.g., 'Tops'
  color: { type: String, default: '#3b82f6' }, // Color for UI
  order: { type: Number, default: 0 }, // Display order
  keywords: { type: [String], default: [] }, // Keywords for AI detection
  createdAt: { type: Date, default: Date.now }
});

// Occasion Schema - for managing occasion types
const occasionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, // e.g., 'casual', 'formal'
  label: { type: String, required: true }, // Display name, e.g., 'Casual'
  color: { type: String, default: '#3b82f6' }, // Color for UI
  order: { type: Number, default: 0 }, // Display order
  keywords: { type: [String], default: [] }, // Keywords for AI detection (e.g., ['wedding', 'party', 'gala'])
  createdAt: { type: Date, default: Date.now }
});

const WardrobeItem = mongoose.model('WardrobeItem', wardrobeItemSchema);
const Outfit = mongoose.model('Outfit', outfitSchema);
const PlannedOutfit = mongoose.model('PlannedOutfit', plannedOutfitSchema);
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Occasion = mongoose.model('Occasion', occasionSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// API Routes

// Test endpoint to verify server is accessible
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Backend is accessible!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'unknown'
  });
});

// Test POST endpoint to verify POST requests work
app.post('/api/test', (req, res) => {
  res.json({
    message: 'POST requests work!',
    timestamp: new Date().toISOString(),
    origin: req.headers.origin || 'unknown',
    body: req.body
  });
});

// ==================== AUTHENTICATION ROUTES ====================

// User Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user (password will be hashed by pre-save hook)
    const user = new User({ email, password, name, role: 'user' });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle duplicate key errors more gracefully
    if (error.code === 11000) {
      if (error.keyPattern?.username) {
        return res.status(500).json({
          error: 'Database configuration error. Please contact administrator.'
        });
      }
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    res.status(500).json({ error: error.message || 'An error occurred during signup' });
  }
});

// User Login
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt from:', req.headers.origin || req.ip);
    console.log('📧 Email:', req.body.email);

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('❌ Missing email or password');
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.log('❌ Invalid password for user:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ Login successful for user:', email);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get current user (protected route)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user profile (protected route)
app.put('/api/auth/profile/:id', authenticateToken, async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.params.id !== req.user.userId) {
      return res.status(403).json({ error: 'You can only update your own profile' });
    }

    const { name, email, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update name and email
    if (name) user.name = name;
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      user.password = newPassword; // Will be hashed by pre-save hook
    }

    await user.save();

    res.json({
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete user account (user can delete their own account)
app.delete('/api/auth/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Delete all user's data
    await WardrobeItem.deleteMany({ user: userId });
    await Outfit.deleteMany({ user: userId });
    await PlannedOutfit.deleteMany({ user: userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all users (admin only)
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete user (admin only)
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role (admin only)
app.put('/api/admin/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get admin stats (admin only)
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalWardrobeItems = await WardrobeItem.countDocuments();
    const totalOutfits = await Outfit.countDocuments();
    const totalPlannedOutfits = await PlannedOutfit.countDocuments();

    res.json({
      totalUsers,
      totalWardrobeItems,
      totalOutfits,
      totalPlannedOutfits
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user-specific wardrobe items (admin only)
app.get('/api/admin/users/:userId/wardrobe', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const items = await WardrobeItem.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Get user wardrobe items error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user-specific saved outfits (admin only)
app.get('/api/admin/users/:userId/outfits', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const outfits = await Outfit.find({ user: req.params.userId }).sort({ createdAt: -1 });
    res.json(outfits);
  } catch (error) {
    console.error('Get user outfits error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user-specific planned outfits (admin only)
app.get('/api/admin/users/:userId/planned-outfits', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const plannedOutfits = await PlannedOutfit.find({ user: req.params.userId }).populate('outfit').sort({ date: 1 });
    res.json(plannedOutfits);
  } catch (error) {
    console.error('Get user planned outfits error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin delete user's wardrobe item (admin only)
app.delete('/api/admin/users/:userId/wardrobe/:itemId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const item = await WardrobeItem.findOne({ _id: req.params.itemId, user: req.params.userId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    await WardrobeItem.findByIdAndDelete(req.params.itemId);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Admin delete wardrobe item error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin delete user's saved outfit (admin only)
app.delete('/api/admin/users/:userId/outfits/:outfitId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const outfit = await Outfit.findOne({ _id: req.params.outfitId, user: req.params.userId });
    if (!outfit) {
      return res.status(404).json({ error: 'Outfit not found' });
    }
    await Outfit.findByIdAndDelete(req.params.outfitId);
    res.json({ message: 'Outfit deleted successfully' });
  } catch (error) {
    console.error('Admin delete outfit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin delete user's planned outfit (admin only)
app.delete('/api/admin/users/:userId/planned-outfits/:outfitId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const plannedOutfit = await PlannedOutfit.findOne({ _id: req.params.outfitId, user: req.params.userId });
    if (!plannedOutfit) {
      return res.status(404).json({ error: 'Planned outfit not found' });
    }
    await PlannedOutfit.findByIdAndDelete(req.params.outfitId);
    res.json({ message: 'Planned outfit deleted successfully' });
  } catch (error) {
    console.error('Admin delete planned outfit error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== CATEGORY & OCCASION ROUTES ====================

// Get all categories (public - for all users)
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, label: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all occasions (public - for all users)
app.get('/api/occasions', async (req, res) => {
  try {
    const occasions = await Occasion.find().sort({ order: 1, label: 1 });
    res.json(occasions);
  } catch (error) {
    console.error('Get occasions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin only)
app.post('/api/admin/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, label, color, order, keywords } = req.body;

    if (!id || !label) {
      return res.status(400).json({ error: 'ID and label are required' });
    }

    // Process keywords: convert to lowercase array
    const processedKeywords = keywords && Array.isArray(keywords)
      ? keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0)
      : [];
    const uniqueKeywords = [...new Set(processedKeywords)];

    const category = new Category({
      id: id.toLowerCase().trim(),
      label,
      color: color || '#3b82f6',
      order: order || 0,
      keywords: uniqueKeywords
    });

    await category.save();
    res.json(category);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Category with this ID already exists' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update category (admin only)
app.put('/api/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { label, color, order, keywords } = req.body;
    const category = await Category.findOne({ id: req.params.id });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (label) category.label = label;
    if (color) category.color = color;
    if (order !== undefined) category.order = order;

    // Update keywords if provided
    if (keywords !== undefined) {
      const processedKeywords = Array.isArray(keywords)
        ? keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0)
        : [];
      category.keywords = [...new Set(processedKeywords)];
    }

    await category.save();
    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete category (admin only)
app.delete('/api/admin/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const category = await Category.findOneAndDelete({ id: req.params.id });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create occasion (admin only)
app.post('/api/admin/occasions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id, label, color, order, keywords } = req.body;

    if (!id || !label) {
      return res.status(400).json({ error: 'ID and label are required' });
    }

    // Process keywords: convert to lowercase array, include the occasion id and label
    const processedKeywords = keywords && Array.isArray(keywords)
      ? keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0)
      : [];

    // Always include the occasion id and label as keywords
    const allKeywords = [
      id.toLowerCase().trim(),
      label.toLowerCase().trim(),
      ...processedKeywords
    ];
    const uniqueKeywords = [...new Set(allKeywords)];

    const occasion = new Occasion({
      id: id.toLowerCase().trim(),
      label,
      color: color || '#3b82f6',
      order: order || 0,
      keywords: uniqueKeywords
    });

    await occasion.save();
    res.json(occasion);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Occasion with this ID already exists' });
    }
    console.error('Create occasion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update occasion (admin only)
app.put('/api/admin/occasions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { label, color, order, keywords } = req.body;
    const occasion = await Occasion.findOne({ id: req.params.id });

    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    if (label) occasion.label = label;
    if (color) occasion.color = color;
    if (order !== undefined) occasion.order = order;

    // Update keywords if provided
    if (keywords !== undefined) {
      const processedKeywords = Array.isArray(keywords)
        ? keywords.map(k => k.toLowerCase().trim()).filter(k => k.length > 0)
        : [];

      // Always include the occasion id and label as keywords
      const allKeywords = [
        occasion.id.toLowerCase().trim(),
        (label || occasion.label).toLowerCase().trim(),
        ...processedKeywords
      ];
      occasion.keywords = [...new Set(allKeywords)];
    }

    await occasion.save();
    res.json(occasion);
  } catch (error) {
    console.error('Update occasion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete occasion (admin only)
app.delete('/api/admin/occasions/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const occasion = await Occasion.findOneAndDelete({ id: req.params.id });

    if (!occasion) {
      return res.status(404).json({ error: 'Occasion not found' });
    }

    res.json({ message: 'Occasion deleted successfully' });
  } catch (error) {
    console.error('Delete occasion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== WARDROBE ROUTES ====================

// Get all wardrobe items (user-specific)
app.get('/api/wardrobe', authenticateToken, async (req, res) => {
  try {
    const items = await WardrobeItem.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new wardrobe item (user-specific)
app.post('/api/wardrobe', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { name, category, tags, occasionTags, color, colors, description, style, confidence } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : req.body.image;

    const newItem = new WardrobeItem({
      user: req.user.userId,
      name,
      category,
      image,
      tags: tags ? (typeof tags === 'string' ? tags.split(',') : tags) : [],
      occasionTags: occasionTags || [],
      color: color || 'unknown',
      colors: colors || color || 'unknown',
      description: description || '',
      style: style || 'unknown',
      confidence: confidence || 0.8
    });

    await newItem.save();
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete wardrobe item (user-specific)
app.delete('/api/wardrobe/:id', authenticateToken, async (req, res) => {
  try {
    const item = await WardrobeItem.findOne({ _id: req.params.id, user: req.user.userId });
    if (!item) {
      return res.status(404).json({ error: 'Item not found or access denied' });
    }
    await WardrobeItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all outfits (user-specific)
app.get('/api/outfits', authenticateToken, async (req, res) => {
  try {
    const outfits = await Outfit.find({ user: req.user.userId }).sort({ createdAt: -1 });
    res.json(outfits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to check for duplicate outfit (same items) within last N days
const checkDuplicateOutfit = async (userId, items, daysThreshold = 7) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return null;
  }

  const itemIds = items
    .map(item => item._id || item.id)
    .filter(Boolean)
    .sort()
    .map(id => id.toString());

  if (itemIds.length === 0) {
    return null;
  }

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);

  // Check saved outfits - look for outfits created within the threshold period
  // Use createdAt for saved outfits, lastWorn for worn outfits (if set)
  const recentOutfits = await Outfit.find({
    user: userId,
    $or: [
      { createdAt: { $gte: thresholdDate } }, // Check outfits saved recently
      { lastWorn: { $gte: thresholdDate, $ne: null } } // Also check outfits worn recently
    ]
  }).sort({ createdAt: -1 }); // Sort by most recent first

  for (const outfit of recentOutfits) {
    const outfitItemIds = (outfit.items || [])
      .map(item => item._id || item.id)
      .filter(Boolean)
      .sort()
      .map(id => id.toString());

    // Check if same items (exact match)
    if (JSON.stringify(outfitItemIds) === JSON.stringify(itemIds)) {
      // Use lastWorn date if available, otherwise use createdAt (when saved)
      const dateToUse = outfit.lastWorn || outfit.createdAt;
      const daysAgo = Math.floor((new Date() - new Date(dateToUse)) / (1000 * 60 * 60 * 24));
      const dateType = outfit.lastWorn ? 'worn' : 'saved';

      return {
        isDuplicate: true,
        message: `This outfit was ${dateType} ${daysAgo} day(s) ago (${new Date(dateToUse).toLocaleDateString()}).`,
        daysAgo: daysAgo,
        date: dateToUse
      };
    }
  }

  return null;
};

// Add new outfit (user-specific)
app.post('/api/outfits', authenticateToken, async (req, res) => {
  try {
    const newOutfit = new Outfit({
      ...req.body,
      user: req.user.userId
    });
    await newOutfit.save();

    // Check for duplicate outfit (notification only, don't prevent saving)
    const duplicateCheck = await checkDuplicateOutfit(req.user.userId, req.body.items, 7);

    res.json({
      ...newOutfit.toObject(),
      duplicateWarning: duplicateCheck // Include warning if duplicate found
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete outfit (user-specific)
app.delete('/api/outfits/:id', authenticateToken, async (req, res) => {
  try {
    const outfit = await Outfit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!outfit) {
      return res.status(404).json({ error: 'Outfit not found or access denied' });
    }
    await Outfit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Outfit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get planned outfits (user-specific)
app.get('/api/planned-outfits', authenticateToken, async (req, res) => {
  try {
    console.log('📥 GET /api/planned-outfits - Fetching planned outfits for user:', req.user.userId);
    const plannedOutfits = await PlannedOutfit.find({ user: req.user.userId }).populate('outfit').sort({ date: 1 });
    console.log(`📦 Found ${plannedOutfits.length} planned outfits for user`);

    // Clean up old documents that don't have items AND don't have name (migration)
    const incompleteOutfits = plannedOutfits.filter(po => {
      const hasItems = po.items && Array.isArray(po.items) && po.items.length > 0;
      const hasName = po.name && po.name.trim().length > 0;
      const hasOutfitRef = po.outfit && typeof po.outfit === 'object';
      return !hasItems && !hasName && !hasOutfitRef;
    });

    if (incompleteOutfits.length > 0) {
      console.log(`🧹 Found ${incompleteOutfits.length} incomplete planned outfits, cleaning up...`);
      const idsToDelete = incompleteOutfits.map(po => po._id);
      await PlannedOutfit.deleteMany({ _id: { $in: idsToDelete }, user: req.user.userId });
      console.log('✅ Cleaned up incomplete planned outfits');

      const completeOutfits = plannedOutfits.filter(po => {
        const hasItems = po.items && Array.isArray(po.items) && po.items.length > 0;
        const hasName = po.name && po.name.trim().length > 0;
        const hasOutfitRef = po.outfit && typeof po.outfit === 'object';
        return hasItems || hasName || hasOutfitRef;
      });
      return res.json(completeOutfits);
    }

    res.json(plannedOutfits);
  } catch (error) {
    console.error('❌ Error fetching planned outfits:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add planned outfit (user-specific)
app.post('/api/planned-outfits', authenticateToken, async (req, res) => {
  try {
    console.log('📥 Received planned outfit data for user:', req.user.userId);

    // Check if there's an existing planned outfit for this date and user
    const date = new Date(req.body.date);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date provided');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await PlannedOutfit.findOne({
      user: req.user.userId,
      date: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    });

    // Clean items - preserve _id for tracking, ensure proper structure
    const cleanItems = (req.body.items || []).map(item => ({
      name: item.name || 'Item',
      category: item.category || 'Unknown',
      image: item.image || '',
      tags: item.tags || [],
      _id: item._id || item.id || null // Preserve item ID for duplicate detection
    }));

    // Check for duplicate outfit (notification only, don't prevent saving)
    const duplicateCheck = await checkDuplicateOutfit(req.user.userId, cleanItems, 7);

    if (existing) {
      // Update existing
      console.log('🔄 Updating existing planned outfit:', existing._id);
      console.log('   Before update - Name:', existing.name, 'Items:', existing.items?.length || 0);
      existing.name = req.body.name !== undefined ? req.body.name : existing.name;
      existing.occasion = req.body.occasion !== undefined ? req.body.occasion : existing.occasion;
      existing.items = cleanItems;
      existing.notes = req.body.notes !== undefined ? req.body.notes : existing.notes;
      existing.date = date; // Update date as well
      existing.user = req.user.userId; // Ensure user is set

      try {
        await existing.save();
        console.log('✅ Updated planned outfit:', existing._id);
        console.log('   After update - Name:', existing.name, 'Items:', existing.items?.length || 0);
        console.log('   Full updated document:', JSON.stringify(existing.toObject(), null, 2));
        res.json({
          ...existing.toObject(),
          duplicateWarning: duplicateCheck // Include warning if duplicate found
        });
      } catch (saveError) {
        console.error('❌ Error saving existing planned outfit:', saveError);
        console.error('   Save error details:', saveError.message);
        console.error('   Validation errors:', saveError.errors);
        throw saveError;
      }
    } else {
      // Create new
      console.log('➕ Creating new planned outfit');
      console.log('   Data being saved:', {
        date: date,
        name: req.body.name || '',
        occasion: req.body.occasion || '',
        itemsCount: cleanItems.length,
        notes: req.body.notes || ''
      });

      const newPlannedOutfit = new PlannedOutfit({
        user: req.user.userId,
        date: date,
        name: req.body.name || '',
        occasion: req.body.occasion || '',
        items: cleanItems,
        notes: req.body.notes || ''
      });

      try {
        await newPlannedOutfit.save();
        console.log('✅ Created planned outfit:', newPlannedOutfit._id);
        console.log('   Full created document:', JSON.stringify(newPlannedOutfit.toObject(), null, 2));
        res.json({
          ...newPlannedOutfit.toObject(),
          duplicateWarning: duplicateCheck // Include warning if duplicate found
        });
      } catch (saveError) {
        console.error('❌ Error saving new planned outfit:', saveError);
        console.error('   Save error details:', saveError.message);
        console.error('   Validation errors:', saveError.errors);
        throw saveError;
      }
    }
  } catch (error) {
    console.error('❌ Error in planned outfit endpoint:', error);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      error: error.message,
      details: error.errors || error.stack
    });
  }
});

// Delete planned outfit (user-specific)
app.delete('/api/planned-outfits/:id', authenticateToken, async (req, res) => {
  try {
    const plannedOutfit = await PlannedOutfit.findOne({ _id: req.params.id, user: req.user.userId });
    if (!plannedOutfit) {
      return res.status(404).json({ error: 'Planned outfit not found or access denied' });
    }
    await PlannedOutfit.findByIdAndDelete(req.params.id);
    res.json({ message: 'Planned outfit deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename/Update planned outfit by ID
app.put('/api/planned-outfits/:id', authenticateToken, async (req, res) => {
  try {
    const { name, notes } = req.body;
    const plannedOutfit = await PlannedOutfit.findOne({ _id: req.params.id, user: req.user.userId });

    if (!plannedOutfit) {
      return res.status(404).json({ error: 'Planned outfit not found or access denied' });
    }

    if (name !== undefined) plannedOutfit.name = name;
    if (notes !== undefined) plannedOutfit.notes = notes;
    // Add other fields to update if necessary

    await plannedOutfit.save();
    console.log(`✅ Renamed/Updated planned outfit ${req.params.id} to "${plannedOutfit.name}"`);
    res.json(plannedOutfit);
  } catch (error) {
    console.error('❌ Error updating planned outfit:', error);
    res.status(500).json({ error: error.message });
  }
});

// AI Image Analysis with Google Vision API - ADVANCED CLOTHING DETECTION
app.post('/api/analyze-image', async (req, res) => {
  try {
    const { imageData } = req.body; // Base64 image data

    if (!imageData) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    console.log('🔍 Backend: Starting Google Vision API call...');
    console.log('🔑 Backend: Vision API Key exists:', !!GOOGLE_VISION_API_KEY);
    console.log('📸 Backend: Image data info:', {
      hasImageData: !!imageData,
      imageDataLength: imageData ? imageData.length : 0,
      imageDataStart: imageData ? imageData.substring(0, 50) : 'none'
    });

    if (!GOOGLE_VISION_API_KEY) {
      throw new Error('Google Vision API key not configured');
    }

    try {
      const visionResponse = await axios.post(
        `${VISION_API_URL}?key=${GOOGLE_VISION_API_KEY}`,
        {
          requests: [
            {
              image: {
                content: imageData
              },
              features: [
                { type: "OBJECT_LOCALIZATION", maxResults: 10 },
                { type: "LABEL_DETECTION", maxResults: 10 }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Google Vision API response received');
      console.log('📝 Raw response:', JSON.stringify(visionResponse.data, null, 2));

      const response = visionResponse.data.responses[0];

      if (!response) {
        throw new Error('No response from Vision API');
      }

      // Extract objects and labels
      const objects = response.localizedObjectAnnotations || [];
      const labels = response.labelAnnotations || [];

      console.log('🎯 Detected objects:', objects.map(obj => obj.name));
      console.log('🏷️ Detected labels:', labels.map(label => label.description));

      // Filter for clothing-related objects (including accessories)
      const clothingObjects = objects.filter(obj =>
        ['Shirt', 'Pants', 'Dress', 'T-shirt', 'Jacket', 'Coat', 'Shorts', 'Skirt', 'Shoe', 'Boot', 'Hat', 'Bag', 'Watch', 'Belt', 'Sunglasses', 'Necklace', 'Ring', 'Bracelet', 'Earrings', 'Tie', 'Jeans', 'Trousers', 'Blouse', 'Sweater', 'Hoodie'].includes(obj.name)
      );

      // Filter for clothing-related labels (including accessories)
      const clothingLabels = labels.filter(label =>
        label.description.toLowerCase().includes('clothing') ||
        label.description.toLowerCase().includes('shirt') ||
        label.description.toLowerCase().includes('pants') ||
        label.description.toLowerCase().includes('dress') ||
        label.description.toLowerCase().includes('jacket') ||
        label.description.toLowerCase().includes('shoe') ||
        label.description.toLowerCase().includes('hat') ||
        label.description.toLowerCase().includes('bag') ||
        label.description.toLowerCase().includes('watch') ||
        label.description.toLowerCase().includes('strap') ||
        label.description.toLowerCase().includes('tie') ||
        label.description.toLowerCase().includes('accessory') ||
        label.description.toLowerCase().includes('jewelry') ||
        label.description.toLowerCase().includes('jeans') ||
        label.description.toLowerCase().includes('denim') ||
        label.description.toLowerCase().includes('trousers')
      );

      // Determine the main category
      let category = 'CLOTHING';
      let confidence = 0.5;
      let description = 'Clothing item detected';
      let tags = [];

      if (clothingObjects.length > 0) {
        const mainObject = clothingObjects[0];
        category = mainObject.name.toUpperCase();
        confidence = mainObject.score;
        description = `${mainObject.name} detected`;
        tags = [mainObject.name.toLowerCase()];
      } else if (clothingLabels.length > 0) {
        const mainLabel = clothingLabels[0];
        category = mainLabel.description.toUpperCase();
        confidence = mainLabel.score;
        description = `${mainLabel.description} detected`;
        tags = [mainLabel.description.toLowerCase()];
      }

      // Try to match detected category to database categories first
      let matchedCategory = null;
      try {
        const dbCategories = await Category.find().sort({ order: 1 });
        const detectedCategoryUpper = category.toUpperCase();
        const detectedCategoryLower = category.toLowerCase();

        console.log(`🔍 Matching detected category "${detectedCategoryUpper}" against ${dbCategories.length} database categories`);
        console.log(`📋 Available categories:`, dbCategories.map(c => `${c.id} (${c.label})`).join(', '));

        // First, try to find an exact match by category ID (case-insensitive)
        matchedCategory = dbCategories.find(cat =>
          cat.id.toUpperCase() === detectedCategoryUpper
        );
        if (matchedCategory) {
          console.log(`✅ Exact ID match found: ${matchedCategory.id}`);
        }

        // Also check for common variations (e.g., "CAP" should match "hat" category)
        // This handles cases where Google Vision detects "CAP" but the category ID is "hat"
        if (!matchedCategory) {
          const detectedVariations = [];
          if (detectedCategoryUpper === 'CAP' || detectedCategoryUpper === 'HAT') {
            detectedVariations.push('hat', 'hats', 'cap', 'caps');
          }

          for (const variation of detectedVariations) {
            matchedCategory = dbCategories.find(cat => cat.id.toLowerCase() === variation.toLowerCase());
            if (matchedCategory) {
              console.log(`✅ Variation match found: ${matchedCategory.id} for "${detectedCategoryUpper}"`);
              break;
            }
          }
        }

        // If no exact match, try keyword-based matching using category keywords from database
        // This should run BEFORE label matching to catch items like "jacket" -> "outerwear"
        // This is similar to how occasions use keywords
        if (!matchedCategory) {
          const allText = [...tags, ...labels.map(l => l.description), detectedCategoryLower].join(' ').toLowerCase();
          console.log(`🔍 Trying keyword matching. All text: "${allText}"`);
          console.log(`🔍 Detected category: "${detectedCategoryUpper}"`);

          // Check all categories using their keywords
          const keywordMatches = [];
          dbCategories.forEach(cat => {
            const catKeywords = cat.keywords || [];
            const catIdLower = cat.id.toLowerCase();
            const catLabelLower = (cat.label || '').toLowerCase();

            // Check if any keyword matches the detected text
            const hasKeywordMatch = catKeywords.some(keyword => {
              if (!keyword || typeof keyword !== 'string') return false;
              const keywordLower = keyword.toLowerCase().trim();
              // Check if keyword appears in the text (word boundary aware)
              const keywordRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
              return keywordRegex.test(allText);
            });

            // Also check if category id or label appears in text
            const hasNameMatch = allText.includes(catIdLower) ||
              allText.includes(catLabelLower);

            // Also check if the detected category name matches a keyword (e.g., "jacket" detected -> match "jacket" keyword in outerwear)
            const detectedMatchesKeyword = catKeywords.some(keyword => {
              if (!keyword || typeof keyword !== 'string') return false;
              const keywordLower = keyword.toLowerCase().trim();
              return keywordLower === detectedCategoryLower || detectedCategoryLower === keywordLower;
            });

            if (hasKeywordMatch || hasNameMatch || detectedMatchesKeyword) {
              const matchType = detectedMatchesKeyword ? 'detected-keyword' : (hasKeywordMatch ? 'keyword' : 'name');
              keywordMatches.push({ category: cat, matchType });
              console.log(`  📌 ${cat.id} matched via ${matchType}`);
            }
          });

          // If we found keyword matches, prioritize them
          if (keywordMatches.length > 0) {
            // Prefer detected-keyword matches (where detected category name matches a keyword)
            // Then keyword matches, then name matches
            const detectedKeywordMatch = keywordMatches.find(m => m.matchType === 'detected-keyword');
            if (detectedKeywordMatch) {
              matchedCategory = detectedKeywordMatch.category;
              console.log(`✅ Detected category keyword match found: ${matchedCategory.id} (${matchedCategory.label})`);
            } else {
              const keywordMatch = keywordMatches.find(m => m.matchType === 'keyword');
              if (keywordMatch) {
                // If multiple keyword matches, prioritize specific categories over general ones
                // General categories: tops, bottoms, shoes, outerwear, accessories
                const generalCategories = ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'];
                const keywordMatchesOnly = keywordMatches.filter(m => m.matchType === 'keyword');

                if (keywordMatchesOnly.length > 1) {
                  // Prefer outerwear over tops for jacket/coat/blazer items
                  const detectedIsOuterwear = ['jacket', 'coat', 'blazer', 'windbreaker', 'parka', 'bomber', 'trench', 'raincoat'].includes(detectedCategoryLower);
                  if (detectedIsOuterwear) {
                    const outerwearMatch = keywordMatchesOnly.find(m => m.category.id.toLowerCase() === 'outerwear');
                    if (outerwearMatch) {
                      matchedCategory = outerwearMatch.category;
                      console.log(`✅ Keyword match found (prioritized outerwear): ${matchedCategory.id} (${matchedCategory.label})`);
                    } else {
                      matchedCategory = keywordMatchesOnly[0].category;
                      console.log(`✅ Keyword match found: ${matchedCategory.id} (${matchedCategory.label})`);
                    }
                  } else {
                    matchedCategory = keywordMatchesOnly[0].category;
                    console.log(`✅ Keyword match found: ${matchedCategory.id} (${matchedCategory.label})`);
                  }
                } else {
                  matchedCategory = keywordMatch.category;
                  console.log(`✅ Keyword match found: ${matchedCategory.id} (${matchedCategory.label}) via keywords`);
                }
              } else {
                matchedCategory = keywordMatches[0].category;
                console.log(`✅ Name match found: ${matchedCategory.id} (${matchedCategory.label})`);
              }
            }
          }
        }

        // If no keyword match, try to match by label (e.g., "Skirt" matches category with label "Skirt")
        // Prioritize exact matches first, then specific categories over general ones
        if (!matchedCategory) {
          const detectedLabel = category.charAt(0) + category.slice(1).toLowerCase();
          const generalCategories = ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'];

          // Try exact label match first
          matchedCategory = dbCategories.find(cat =>
            cat.label.toLowerCase() === detectedLabel.toLowerCase()
          );

          // If no exact match, try partial matches but prioritize specific categories
          if (!matchedCategory) {
            const labelMatches = dbCategories.filter(cat =>
              cat.label.toLowerCase().includes(detectedLabel.toLowerCase()) ||
              detectedLabel.toLowerCase().includes(cat.label.toLowerCase())
            );

            if (labelMatches.length > 0) {
              // Prioritize specific categories (like "hat") over general ones (like "accessories")
              const specificMatch = labelMatches.find(cat => !generalCategories.includes(cat.id.toLowerCase()));
              if (specificMatch) {
                matchedCategory = specificMatch;
              } else {
                // If no specific match, still prioritize exact matches over partial
                const exactLabelMatch = labelMatches.find(cat => cat.label.toLowerCase() === detectedLabel.toLowerCase());
                matchedCategory = exactLabelMatch || labelMatches[0];
              }
            }
          }

          if (matchedCategory) {
            console.log(`✅ Label match found: ${matchedCategory.id} (${matchedCategory.label})`);
          }
        }

        // If still no match, try fuzzy matching - prioritize specific matches over general ones
        // This handles cases like "HAT" matching "hats" category, or "WATCH" matching "watch" category
        // Specific categories (shirt, jacket, hat) should take precedence over general ones (tops, outerwear, accessories)
        if (!matchedCategory) {
          const fuzzyMatches = [];

          // General category names that should be deprioritized (only used as fallback)
          const generalCategories = ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'];

          dbCategories.forEach(cat => {
            const catIdLower = cat.id.toLowerCase();
            const catLabelLower = cat.label.toLowerCase();
            const detectedLower = detectedCategoryLower;
            let matchScore = 0;
            let matchReason = '';
            const isGeneralCategory = generalCategories.includes(catIdLower);

            // Check if detected name is the start of category name (e.g., "hat" matches "hats")
            if (catIdLower.startsWith(detectedLower) || catLabelLower.startsWith(detectedLower)) {
              matchScore = isGeneralCategory ? 2.5 : 4; // Higher score for specific categories
              matchReason = 'starts-with';
            }
            // Check if category name is the start of detected name (e.g., "hats" matches "hat")
            else if (detectedLower.startsWith(catIdLower) || detectedLower.startsWith(catLabelLower)) {
              matchScore = isGeneralCategory ? 2.5 : 4; // Higher score for specific categories
              matchReason = 'starts-with-reverse';
            }
            // Check for plural/singular variations (e.g., "hat" matches "hats", "watch" matches "watches")
            else {
              const detectedStem = detectedLower.replace(/s$|es$/, '');
              const catIdStem = catIdLower.replace(/s$|es$/, '');
              const catLabelStem = catLabelLower.replace(/s$|es$/, '');

              if (detectedStem === catIdStem || detectedStem === catLabelStem ||
                catIdStem === detectedLower || catLabelStem === detectedLower) {
                matchScore = isGeneralCategory ? 1.5 : 3; // Higher score for specific categories
                matchReason = 'stem-match';
              }
              // Check if detected is contained in category (but only if it's a meaningful match)
              // Exclude common words that might cause false matches (like "hat" in "that" or "accessories")
              else if (catIdLower.includes(detectedLower) && detectedLower.length >= 3) {
                // Make sure it's not a false match (e.g., "hat" shouldn't match "that" or "accessories")
                const wordBoundary = new RegExp(`\\b${detectedLower}\\b`, 'i');
                if (wordBoundary.test(catIdLower) || wordBoundary.test(catLabelLower)) {
                  matchScore = isGeneralCategory ? 0.5 : 2; // Higher score for specific categories
                  matchReason = 'contains-word';
                }
              }
            }

            if (matchScore > 0) {
              fuzzyMatches.push({ category: cat, score: matchScore, reason: matchReason });
            }
          });

          // Sort by score (highest first) and pick the best match
          // This ensures specific categories (shirt, jacket, hat) are chosen over general ones (tops, outerwear, accessories)
          if (fuzzyMatches.length > 0) {
            fuzzyMatches.sort((a, b) => {
              if (Math.abs(b.score - a.score) < 0.1) {
                // If scores are very close, prefer non-general categories
                const aIsGeneral = generalCategories.includes(a.category.id.toLowerCase());
                const bIsGeneral = generalCategories.includes(b.category.id.toLowerCase());
                if (aIsGeneral && !bIsGeneral) return 1;
                if (!aIsGeneral && bIsGeneral) return -1;
              }
              return b.score - a.score;
            });
            matchedCategory = fuzzyMatches[0].category;
            console.log(`✅ Fuzzy match found: ${matchedCategory.id} (${matchedCategory.label}) - Score: ${fuzzyMatches[0].score}, Reason: ${fuzzyMatches[0].reason}`);
            if (fuzzyMatches.length > 1) {
              console.log(`📊 Other potential matches:`, fuzzyMatches.slice(1).map(m => `${m.category.id} (score: ${m.score})`).join(', '));
            }
          }
        }

        // If still no match, use the hardcoded mapping as fallback
        // But check for custom categories first (like "outerwear", "hats", "watch", "skirt")
        if (!matchedCategory) {
          // Check if there's a custom category that matches
          // Order matters: check specific categories first, then general ones
          // Example: check "jacket" before "outerwear", "hat" before "accessories", "shirt" before "tops"
          const customCategoryChecks = {
            // Outerwear items (specific first, then general)
            'JACKET': ['jacket', 'jackets', 'outerwear', 'tops'],
            'COAT': ['coat', 'coats', 'outerwear', 'tops'],
            'OUTERWEAR': ['outerwear', 'tops'],
            'BLAZER': ['blazer', 'blazers', 'jacket', 'outerwear', 'tops'],
            'WINDBREAKER': ['windbreaker', 'windbreakers', 'jacket', 'outerwear', 'tops'],
            'PARKA': ['parka', 'parkas', 'jacket', 'coat', 'outerwear', 'tops'],
            'BOMBER': ['bomber', 'bombers', 'bomber-jacket', 'jacket', 'outerwear', 'tops'],
            'TRENCH': ['trench', 'trench-coat', 'coat', 'outerwear', 'tops'],
            'RAINCOAT': ['raincoat', 'rain-coat', 'coat', 'outerwear', 'tops'],

            // Tops items (specific first, then general)
            'SHIRT': ['shirt', 'shirts', 'tops'],
            'T-SHIRT': ['t-shirt', 'tshirt', 'tee', 'shirt', 'tops'],
            'TSHIRT': ['t-shirt', 'tshirt', 'tee', 'shirt', 'tops'],
            'TOP': ['top', 'tops'],
            'ACTIVE SHIRT': ['active-shirt', 'active', 'shirt', 'tops'],
            'BLOUSE': ['blouse', 'blouses', 'tops'],
            'SWEATER': ['sweater', 'sweaters', 'tops'],
            'HOODIE': ['hoodie', 'hoodies', 'tops'],
            'CARDIGAN': ['cardigan', 'cardigans', 'sweater', 'tops'],
            'TANK TOP': ['tank-top', 'tank', 'tops'],
            'TANK': ['tank-top', 'tank', 'tops'],

            // Bottoms items (specific first, then general)
            'PANT': ['pant', 'pants', 'bottoms'],
            'PANTS': ['pants', 'bottoms'],
            'JEAN': ['jean', 'jeans', 'denim', 'bottoms'],
            'JEANS': ['jeans', 'denim', 'bottoms'],
            'TROUSERS': ['trousers', 'pants', 'bottoms'],
            'SHORTS': ['shorts', 'bottoms'],
            'SKIRT': ['skirt', 'skirts', 'bottoms'],
            'SKORTS': ['skorts', 'skirt', 'shorts', 'bottoms'],
            'LEGGINGS': ['leggings', 'bottoms'],
            'JOGGERS': ['joggers', 'pants', 'bottoms'],
            'CHINOS': ['chinos', 'pants', 'bottoms'],

            // Shoes items (specific first, then general)
            'SHOE': ['shoe', 'shoes'],
            'FOOTWEAR': ['footwear', 'shoes'],
            'SNEAKER': ['sneaker', 'sneakers', 'shoes'],
            'SNEAKERS': ['sneakers', 'shoes'],
            'BOOT': ['boot', 'boots', 'shoes'],
            'BOOTS': ['boots', 'shoes'],
            'HEELS': ['heels', 'heels', 'shoes'],
            'SANDALS': ['sandals', 'sandals', 'shoes'],
            'LOAFERS': ['loafers', 'shoes'],
            'OXFORDS': ['oxfords', 'shoes'],
            'MOCASSINS': ['mocassins', 'shoes'],
            'FLATS': ['flats', 'shoes'],
            'HIGH HEELS': ['high-heels', 'heels', 'shoes'],
            'WEDGES': ['wedges', 'shoes'],
            'SLIPPERS': ['slippers', 'shoes'],

            // Accessories items (specific first, then general)
            'WATCH': ['watch', 'watches', 'accessories'],
            'WATCHES': ['watches', 'accessories'],
            'HAT': ['hat', 'hats', 'cap', 'caps', 'accessories'],
            'CAP': ['cap', 'caps', 'hat', 'accessories'],
            'BAG': ['bag', 'bags', 'handbag', 'accessories'],
            'HANDBAG': ['handbag', 'bags', 'accessories'],
            'BELT': ['belt', 'belts', 'accessories'],
            'SUNGLASSES': ['sunglasses', 'glasses', 'accessories'],
            'GLASSES': ['glasses', 'sunglasses', 'accessories'],
            'NECKLACE': ['necklace', 'necklaces', 'accessories'],
            'RING': ['ring', 'rings', 'accessories'],
            'BRACELET': ['bracelet', 'bracelets', 'accessories'],
            'EARRINGS': ['earrings', 'earring', 'accessories'],
            'EARRING': ['earring', 'earrings', 'accessories'],
            'TIE': ['tie', 'ties', 'necktie', 'neckties', 'bowtie', 'bow-tie', 'accessories'],
            'NECKTIE': ['tie', 'ties', 'necktie', 'neckties', 'accessories'],
            'BOW TIE': ['tie', 'ties', 'bowtie', 'bow-tie', 'accessories'],
            'BOWTIE': ['tie', 'ties', 'bowtie', 'bow-tie', 'accessories'],
            'SCARF': ['scarf', 'scarves', 'accessories'],
            'SCARVES': ['scarves', 'scarf', 'accessories'],
            'GLOVES': ['gloves', 'glove', 'accessories'],
            'GLOVE': ['glove', 'gloves', 'accessories'],
            'WALLET': ['wallet', 'wallets', 'accessories'],
            'ACCESSORY': ['accessory', 'accessories']
          };

          const customMatches = customCategoryChecks[detectedCategoryUpper];
          if (customMatches) {
            // Check categories in order - first match wins
            // Order: specific categories first (hat, jacket), then general ones (accessories, outerwear)
            // For "HAT" or "CAP", prioritize "hat" category over "accessories"
            const generalCategories = ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'];

            // First, try to find specific categories (not in generalCategories list)
            for (const customId of customMatches) {
              const foundCategory = dbCategories.find(cat => cat.id.toLowerCase() === customId.toLowerCase());
              if (foundCategory && !generalCategories.includes(foundCategory.id.toLowerCase())) {
                matchedCategory = foundCategory;
                console.log(`✅ Found specific custom category match: ${matchedCategory.id} for "${detectedCategoryUpper}"`);
                break;
              }
            }

            // If no specific category found, fall back to general categories
            if (!matchedCategory) {
              for (const customId of customMatches) {
                matchedCategory = dbCategories.find(cat => cat.id.toLowerCase() === customId.toLowerCase());
                if (matchedCategory) {
                  console.log(`✅ Found general custom category match: ${matchedCategory.id} for "${detectedCategoryUpper}"`);
                  break;
                }
              }
            }
          }

          // If no custom category found, use default hardcoded mapping
          if (!matchedCategory) {
            const categoryMapping = {
              // Shoes
              'SHOE': 'shoes',
              'FOOTWEAR': 'shoes',
              'SNEAKER': 'shoes',
              'BOOT': 'shoes',

              // Tops (consolidate shirts, sweaters - jackets/coats go to outerwear if it exists)
              'SHIRT': 'tops',
              'T-SHIRT': 'tops',
              'TOP': 'tops',
              'ACTIVE SHIRT': 'tops',
              'BLOUSE': 'tops',
              'SWEATER': 'tops',
              'HOODIE': 'tops',
              // Check if outerwear exists before defaulting to tops
              'JACKET': dbCategories.find(c => c.id.toLowerCase() === 'outerwear') ? 'outerwear' : 'tops',
              'COAT': dbCategories.find(c => c.id.toLowerCase() === 'outerwear') ? 'outerwear' : 'tops',
              'BLAZER': dbCategories.find(c => c.id.toLowerCase() === 'outerwear') ? 'outerwear' : 'tops',

              // Bottoms (consolidate pants and jeans)
              'PANT': 'bottoms',
              'PANTS': 'bottoms',
              'JEAN': 'bottoms',
              'JEANS': 'bottoms',
              'TROUSERS': 'bottoms',
              'SHORTS': 'bottoms',
              'SKIRT': 'bottoms', // Fallback to bottoms if no skirt category

              // Accessories (consolidate watch, hat, bags, etc.)
              'WATCH': dbCategories.find(c => c.id.toLowerCase() === 'watch') ? 'watch' : 'accessories',
              'HAT': dbCategories.find(c => c.id.toLowerCase() === 'hat') ? 'hat' : 'accessories',
              'BAG': 'accessories',
              'BELT': 'accessories',
              'TIE': 'accessories',
              'NECKTIE': 'accessories',
              'BOW TIE': 'accessories',
              'BOWTIE': 'accessories',
              'SUNGLASSES': 'accessories',
              'NECKLACE': 'accessories',
              'RING': 'accessories',
              'BRACELET': 'accessories',
              'EARRINGS': 'accessories',
              'ACCESSORY': 'accessories'
            };

            const mappedCategoryId = categoryMapping[detectedCategoryUpper];
            if (mappedCategoryId) {
              matchedCategory = dbCategories.find(cat => cat.id === mappedCategoryId);
            }
          }
        }

        // If we found a match, use the database category ID (uppercase for consistency)
        if (matchedCategory) {
          category = matchedCategory.id.toUpperCase();
          console.log(`✅ Matched detected item "${detectedCategoryUpper}" to database category: ${matchedCategory.id} (${matchedCategory.label})`);
        } else {
          // Fallback: use first category or default
          if (dbCategories.length > 0) {
            category = dbCategories[0].id.toUpperCase();
            console.log(`⚠️ No match found, using first database category: ${category}`);
          } else {
            category = 'CLOTHING';
            console.log(`⚠️ No categories in database, using default: ${category}`);
          }
        }
      } catch (dbError) {
        console.error('❌ Error loading categories from database:', dbError);
        // Fallback to hardcoded mapping if database query fails
        const categoryMapping = {
          'SHOE': 'SHOES', 'FOOTWEAR': 'SHOES', 'SNEAKER': 'SHOES', 'BOOT': 'SHOES',
          'SHIRT': 'TOPS', 'T-SHIRT': 'TOPS', 'TOP': 'TOPS', 'BLOUSE': 'TOPS',
          'SWEATER': 'TOPS', 'HOODIE': 'TOPS', 'JACKET': 'TOPS', 'COAT': 'TOPS',
          'PANT': 'BOTTOMS', 'PANTS': 'BOTTOMS', 'JEAN': 'BOTTOMS', 'JEANS': 'BOTTOMS',
          'TROUSERS': 'BOTTOMS', 'SHORTS': 'BOTTOMS', 'SKIRT': 'BOTTOMS',
          'WATCH': 'ACCESSORIES', 'HAT': 'ACCESSORIES', 'BAG': 'ACCESSORIES',
          'BELT': 'ACCESSORIES', 'SUNGLASSES': 'ACCESSORIES', 'NECKLACE': 'ACCESSORIES',
          'RING': 'ACCESSORIES', 'BRACELET': 'ACCESSORIES', 'EARRINGS': 'ACCESSORIES', 'ACCESSORY': 'ACCESSORIES'
        };
        category = categoryMapping[category] || 'CLOTHING';
      }

      // Function to auto-tag occasions based on category and tags
      // IMPROVED: Now uses keyword mapping from database for smarter detection
      const getOccasionTags = async (category, tags, labels) => {
        const occasionTags = [];
        const allText = [...tags, ...labels.map(l => l.description)].join(' ').toLowerCase();

        // Load occasions from database
        let dbOccasions = [];
        try {
          dbOccasions = await Occasion.find().sort({ order: 1 });
        } catch (error) {
          console.error('Error loading occasions from database:', error);
          // Fallback to default occasions if database query fails
          dbOccasions = [
            { id: 'casual', label: 'Casual', keywords: ['casual', 'everyday', 'relaxed', 'comfortable'] },
            { id: 'formal', label: 'Formal', keywords: ['formal', 'dress', 'elegant', 'suit', 'tuxedo'] },
            { id: 'work', label: 'Work', keywords: ['work', 'office', 'professional', 'business', 'corporate'] },
            { id: 'sporty', label: 'Sporty', keywords: ['sport', 'athletic', 'active', 'gym', 'fitness', 'running'] }
          ];
        }

        // Helper function to find occasion by ID or label
        const findOccasion = (idOrLabel) => {
          return dbOccasions.find(occ =>
            occ.id.toLowerCase() === idOrLabel.toLowerCase() ||
            occ.label.toLowerCase() === idOrLabel.toLowerCase()
          );
        };

        // Helper function to add occasion if it exists in database
        const addOccasionIfExists = (occasionId) => {
          const occasion = findOccasion(occasionId);
          if (occasion && !occasionTags.includes(occasion.id)) {
            occasionTags.push(occasion.id);
          }
        };

        // IMPROVED: Check all occasions using their keywords
        dbOccasions.forEach(occasion => {
          const occasionKeywords = occasion.keywords || [];
          const occasionIdLower = occasion.id.toLowerCase();
          const occasionLabelLower = (occasion.label || '').toLowerCase();

          // Check if any keyword matches the detected text
          const keywordMatches = occasionKeywords.some(keyword => {
            if (!keyword || typeof keyword !== 'string') return false;
            const keywordLower = keyword.toLowerCase().trim();
            // Exact word match (better than substring to avoid false positives)
            return allText.includes(keywordLower) ||
              allText.split(/\s+/).some(word => word === keywordLower);
          });

          // Also check if occasion id or label appears in text
          const nameMatches = allText.includes(occasionIdLower) ||
            allText.includes(occasionLabelLower);

          if (keywordMatches || nameMatches) {
            addOccasionIfExists(occasion.id);
          }
        });

        // Enhanced category-based rules (for better accuracy)
        // These rules complement keyword matching
        const categoryRules = {
          'SHOES': {
            'formal': ['dress shoe', 'oxford', 'loafer', 'heel', 'pump'],
            'work': ['dress shoe', 'oxford', 'loafer', 'professional'],
            'sporty': ['sneaker', 'running', 'athletic', 'trainer', 'sport'],
            'casual': ['sneaker', 'canvas', 'flat', 'slip-on']
          },
          'TOPS': {
            'formal': ['dress shirt', 'blouse', 'suit', 'tuxedo', 'evening'],
            'work': ['button', 'polo', 'blazer', 'professional', 'business'],
            'sporty': ['active', 'athletic', 'gym', 'fitness', 'workout'],
            'casual': ['t-shirt', 'cotton', 'relaxed', 'everyday']
          },
          'BOTTOMS': {
            'formal': ['dress pants', 'slacks', 'trousers', 'suit'],
            'work': ['khaki', 'chino', 'dress pants', 'professional'],
            'sporty': ['shorts', 'active', 'athletic', 'gym'],
            'casual': ['jeans', 'denim', 'relaxed', 'everyday']
          },
          'ACCESSORIES': {
            'formal': ['watch', 'belt', 'jewelry', 'necklace', 'ring', 'bracelet'],
            'work': ['watch', 'belt', 'bag', 'briefcase'],
            'sporty': ['hat', 'cap', 'sunglasses', 'fitness'],
            'casual': ['hat', 'cap', 'bag', 'backpack', 'sunglasses']
          }
        };

        // Apply category-specific rules
        if (categoryRules[category]) {
          Object.keys(categoryRules[category]).forEach(occasionId => {
            const keywords = categoryRules[category][occasionId];
            const matches = keywords.some(keyword => allText.includes(keyword));
            if (matches) {
              addOccasionIfExists(occasionId);
            }
          });
        }

        // Default to casual if no specific occasion found
        if (occasionTags.length === 0) {
          const casualOccasion = findOccasion('casual');
          if (casualOccasion) {
            occasionTags.push(casualOccasion.id);
          } else if (dbOccasions.length > 0) {
            // Fallback to first occasion if casual doesn't exist
            occasionTags.push(dbOccasions[0].id);
          }
        }

        // Remove duplicates and return
        return [...new Set(occasionTags)];
      };

      // Extract colors from labels if available
      const colorLabels = labels.filter(label =>
        ['red', 'blue', 'green', 'yellow', 'black', 'white', 'gray', 'brown', 'pink', 'purple', 'orange', 'silver', 'gold', 'bronze'].includes(label.description.toLowerCase())
      );
      const colors = colorLabels.length > 0 ? colorLabels.map(label => label.description.toLowerCase()) : ['unknown'];

      // Generate occasion tags based on category and detected features
      const occasionTags = await getOccasionTags(category, tags, labels);

      // Extract all detected labels for keyword reference
      const detectedLabels = labels.map(label => label.description);
      const allDetectedText = [...tags, ...detectedLabels];

      console.log('🎯 Final analysis result:', {
        category,
        confidence,
        tags,
        occasionTags,
        description,
        colors,
        detectedLabels: detectedLabels,
        allDetectedText: allDetectedText,
        source: 'google-vision'
      });

      res.json({
        category: category,
        confidence: confidence,
        tags: tags,
        occasionTags: occasionTags,
        description: description,
        colors: colors,
        style: 'unknown',
        detectedLabels: detectedLabels, // Add detected labels for keyword reference
        source: 'google-vision'
      });

    } catch (visionError) {
      console.error('❌ Google Vision API error:', visionError.response?.data || visionError.message);

      // Simple fallback - just return clothing category
      res.json({
        category: 'CLOTHING',
        confidence: 0.5,
        tags: [],
        occasionTags: ['casual'],
        description: 'Clothing item',
        colors: ['unknown'],
        style: 'unknown',
        source: 'fallback'
      });
      return;
    }

  } catch (error) {
    console.error('❌ Backend: Image analysis error:', error.message);

    // Simple fallback - just return clothing category
    res.json({
      category: 'CLOTHING',
      confidence: 0.5,
      tags: [],
      occasionTags: ['casual'],
      description: 'Clothing item',
      colors: ['unknown'],
      style: 'unknown',
      source: 'fallback'
    });
  }
});

// Remove background using rembg service (proxy endpoint)
// Remove background using rembg service (proxy endpoint)
app.post('/api/remove-background', async (req, res) => {
  try {
    // Check if it's a JSON request with base64 data first
    if (req.is('application/json') && req.body.imageData) {
      console.log('🖼️ Background removal via Base64');
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(req.body.imageData, 'base64');

        // Create FormData for rembg service
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('image', buffer, {
          filename: 'image.jpg',
          contentType: 'image/jpeg'
        });

        // Forward to rembg service
        const rembgResponse = await axios.post(
          `${REMBG_SERVICE_URL}/remove-background`,
          formData,
          {
            headers: formData.getHeaders(),
            responseType: 'arraybuffer'
          }
        );

        // Return the processed image
        res.set('Content-Type', 'image/png');
        res.send(rembgResponse.data);
        return;
      } catch (error) {
        console.error('Rembg service error (Base64):', error.message);
        return res.status(500).json({ error: 'Background removal failed' });
      }
    }

    // Handle FormData upload (legacy web way)
    const uploadSingle = multer({ storage: memoryStorage }).single('image');

    uploadSingle(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ error: 'Error processing image file' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' });
      }

      try {
        // Create FormData for rembg service
        const FormData = require('form-data');
        const formData = new FormData();
        formData.append('image', req.file.buffer, {
          filename: req.file.originalname,
          contentType: req.file.mimetype
        });

        // Forward to rembg service
        const rembgResponse = await axios.post(
          `${REMBG_SERVICE_URL}/remove-background`,
          formData,
          {
            headers: formData.getHeaders(),
            responseType: 'arraybuffer'
          }
        );

        // Return the processed image
        res.set('Content-Type', 'image/png');
        res.send(rembgResponse.data);
      } catch (error) {
        console.error('Rembg service error:', error.message);
        res.status(500).json({ error: 'Background removal failed' });
      }
    });
  } catch (error) {
    console.error('Background removal proxy error:', error.message);
    res.status(500).json({ error: 'Background removal failed' });
  }
});

// Get all wardrobe items
app.get('/api/wardrobe', async (req, res) => {
  try {
    const items = await WardrobeItem.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wardrobe items' });
  }
});

// Migration endpoint to add occasion tags to existing items
app.post('/api/migrate-occasion-tags', async (req, res) => {
  try {
    console.log('🔄 Starting occasion tags migration...');

    const items = await WardrobeItem.find();
    let updatedCount = 0;

    for (const item of items) {
      // Force update all items to use only 4 generic occasions
      // Skip if item already has occasion tags
      if (item.occasionTags && item.occasionTags.length > 0) {
        continue;
      }

      // Generate occasion tags based on existing category and tags
      const allText = [...(item.tags || []), item.category || '', item.name || ''].join(' ').toLowerCase();
      const occasionTags = [];

      // Apply the same simplified logic as in the image analysis (4 generic occasions only)
      // Formal occasions
      if (item.category === 'SHOES' && (allText.includes('dress') || allText.includes('formal') || allText.includes('leather'))) {
        occasionTags.push('formal');
      }
      if (item.category === 'TOPS' && (allText.includes('dress shirt') || allText.includes('blouse') || allText.includes('formal'))) {
        occasionTags.push('formal');
      }
      if (item.category === 'BOTTOMS' && (allText.includes('dress pants') || allText.includes('slacks') || allText.includes('formal'))) {
        occasionTags.push('formal');
      }

      // Work occasions
      if (item.category === 'TOPS' && (allText.includes('button') || allText.includes('polo') || allText.includes('work'))) {
        occasionTags.push('work');
      }
      if (item.category === 'BOTTOMS' && (allText.includes('khaki') || allText.includes('chino') || allText.includes('work'))) {
        occasionTags.push('work');
      }
      if (item.category === 'SHOES' && (allText.includes('dress') || allText.includes('formal') || allText.includes('leather'))) {
        occasionTags.push('work');
      }

      // Sporty occasions
      if (item.category === 'TOPS' && (allText.includes('active') || allText.includes('sport') || allText.includes('athletic'))) {
        occasionTags.push('sporty');
      }
      if (item.category === 'BOTTOMS' && (allText.includes('shorts') || allText.includes('active') || allText.includes('sport'))) {
        occasionTags.push('sporty');
      }
      if (item.category === 'SHOES' && (allText.includes('running') || allText.includes('athletic') || allText.includes('sport'))) {
        occasionTags.push('sporty');
      }

      // Casual occasions (default for most items)
      if (item.category === 'TOPS' && (allText.includes('t-shirt') || allText.includes('casual') || allText.includes('cotton'))) {
        occasionTags.push('casual');
      }
      if (item.category === 'BOTTOMS' && (allText.includes('jeans') || allText.includes('denim') || allText.includes('casual'))) {
        occasionTags.push('casual');
      }
      if (item.category === 'SHOES' && (allText.includes('sneaker') || allText.includes('casual') || allText.includes('canvas'))) {
        occasionTags.push('casual');
      }

      // Accessories occasions
      if (item.category === 'ACCESSORIES') {
        // Hats and caps - generally casual
        if (allText.includes('hat') || allText.includes('cap') || allText.includes('baseball')) {
          occasionTags.push('casual', 'sporty');
        }
        // Watches - can be formal or casual
        if (allText.includes('watch')) {
          occasionTags.push('formal', 'work');
        }
        // Bags - versatile
        if (allText.includes('bag') || allText.includes('purse')) {
          occasionTags.push('casual', 'work');
        }
        // Belts - formal and casual
        if (allText.includes('belt')) {
          occasionTags.push('formal', 'work');
        }
        // Sunglasses - casual and sporty
        if (allText.includes('sunglass') || allText.includes('glasses')) {
          occasionTags.push('casual', 'sporty');
        }
        // Jewelry - formal
        if (allText.includes('necklace') || allText.includes('ring') || allText.includes('bracelet') || allText.includes('earring')) {
          occasionTags.push('formal');
        }
      }

      // Default to casual if no specific occasion found
      if (occasionTags.length === 0) {
        occasionTags.push('casual');
      }

      // Update the item
      await WardrobeItem.findByIdAndUpdate(item._id, {
        occasionTags: [...new Set(occasionTags)] // Remove duplicates
      });

      updatedCount++;
    }

    console.log(`✅ Migration completed. Updated ${updatedCount} items with occasion tags.`);
    res.json({
      message: `Migration completed successfully. Updated ${updatedCount} items with occasion tags.`,
      updatedCount
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ error: 'Migration failed' });
  }
});

// Force migration endpoint to update ALL items to use only 4 generic occasions
app.post('/api/force-migrate-occasion-tags', async (req, res) => {
  try {
    console.log('🔄 Starting FORCE occasion tags migration...');

    const items = await WardrobeItem.find();
    let updatedCount = 0;

    for (const item of items) {
      // Generate occasion tags based on existing category and tags (simplified to 4 generic occasions)
      const allText = [...(item.tags || []), item.category || '', item.name || ''].join(' ').toLowerCase();
      const occasionTags = [];

      // Apply the same simplified logic as in the image analysis (4 generic occasions only)
      // Formal occasions
      if (item.category === 'SHOES' && (allText.includes('dress') || allText.includes('formal') || allText.includes('leather'))) {
        occasionTags.push('formal');
      }
      if (item.category === 'TOPS' && (allText.includes('dress shirt') || allText.includes('blouse') || allText.includes('formal'))) {
        occasionTags.push('formal');
      }
      if (item.category === 'BOTTOMS' && (allText.includes('dress pants') || allText.includes('slacks') || allText.includes('formal'))) {
        occasionTags.push('formal');
      }

      // Work occasions
      if (item.category === 'TOPS' && (allText.includes('button') || allText.includes('polo') || allText.includes('work'))) {
        occasionTags.push('work');
      }
      if (item.category === 'BOTTOMS' && (allText.includes('khaki') || allText.includes('chino') || allText.includes('work'))) {
        occasionTags.push('work');
      }
      if (item.category === 'SHOES' && (allText.includes('dress') || allText.includes('formal') || allText.includes('leather'))) {
        occasionTags.push('work');
      }

      // Sporty occasions
      if (item.category === 'TOPS' && (allText.includes('active') || allText.includes('sport') || allText.includes('athletic'))) {
        occasionTags.push('sporty');
      }
      if (item.category === 'BOTTOMS' && (allText.includes('shorts') || allText.includes('active') || allText.includes('sport'))) {
        occasionTags.push('sporty');
      }
      if (item.category === 'SHOES' && (allText.includes('running') || allText.includes('athletic') || allText.includes('sport'))) {
        occasionTags.push('sporty');
      }

      // Casual occasions (default for most items)
      if (item.category === 'TOPS' && (allText.includes('t-shirt') || allText.includes('casual') || allText.includes('cotton'))) {
        occasionTags.push('casual');
      }
      if (item.category === 'BOTTOMS' && (allText.includes('jeans') || allText.includes('denim') || allText.includes('casual'))) {
        occasionTags.push('casual');
      }
      if (item.category === 'SHOES' && (allText.includes('sneaker') || allText.includes('casual') || allText.includes('canvas'))) {
        occasionTags.push('casual');
      }

      // Accessories occasions
      if (item.category === 'ACCESSORIES') {
        // Hats and caps - generally casual
        if (allText.includes('hat') || allText.includes('cap') || allText.includes('baseball')) {
          occasionTags.push('casual', 'sporty');
        }
        // Watches - can be formal or casual
        if (allText.includes('watch')) {
          occasionTags.push('formal', 'work');
        }
        // Bags - versatile
        if (allText.includes('bag') || allText.includes('purse')) {
          occasionTags.push('casual', 'work');
        }
        // Belts - formal and casual
        if (allText.includes('belt')) {
          occasionTags.push('formal', 'work');
        }
        // Sunglasses - casual and sporty
        if (allText.includes('sunglass') || allText.includes('glasses')) {
          occasionTags.push('casual', 'sporty');
        }
        // Jewelry - formal
        if (allText.includes('necklace') || allText.includes('ring') || allText.includes('bracelet') || allText.includes('earring')) {
          occasionTags.push('formal');
        }
      }

      // Default to casual if no specific occasion found
      if (occasionTags.length === 0) {
        occasionTags.push('casual');
      }

      // Update the item with only the 4 generic occasions
      await WardrobeItem.findByIdAndUpdate(item._id, {
        occasionTags: [...new Set(occasionTags)] // Remove duplicates
      });

      updatedCount++;
    }

    console.log(`✅ FORCE Migration completed. Updated ${updatedCount} items with simplified occasion tags.`);
    res.json({
      message: `Force migration completed successfully. Updated ${updatedCount} items with simplified occasion tags.`,
      updatedCount
    });

  } catch (error) {
    console.error('❌ Force migration error:', error);
    res.status(500).json({ error: 'Force migration failed' });
  }
});


// Update wardrobe item category and occasion tags (user editing)
app.put('/api/wardrobe/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, tags, occasionTags } = req.body;

    const updateData = { category };
    if (tags !== undefined) updateData.tags = tags;
    if (occasionTags !== undefined) updateData.occasionTags = occasionTags;

    const updatedItem = await WardrobeItem.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    console.log('✅ Updated wardrobe item:', updatedItem.name, 'with occasion tags:', updatedItem.occasionTags);
    res.json(updatedItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// AI Outfit Recommendation using Gemini API
// New category-based outfit recommendation route
app.get('/api/recommend-outfit/:occasion', authenticateToken, async (req, res) => {
  try {
    const { occasion } = req.params;

    if (!occasion) {
      return res.status(400).json({ error: 'Occasion is required' });
    }

    console.log('🤖 Generating outfit recommendation for occasion:', occasion, 'for user:', req.user.userId);

    // Get wardrobe items - if "random", get ALL items regardless of occasion
    const occasionLower = occasion.toLowerCase();
    let wardrobeItems;

    if (occasionLower === 'random') {
      // For random, get ALL wardrobe items regardless of occasion
      wardrobeItems = await WardrobeItem.find({
        user: req.user.userId
      });
      console.log('🎲 Random outfit: Using all wardrobe items regardless of occasion');
    } else {
      // For specific occasions, filter by occasion tags
      wardrobeItems = await WardrobeItem.find({
        user: req.user.userId,
        $or: [
          { occasionTags: { $in: [occasionLower] } },
          { occasionTags: { $regex: `(^|,)\\s*${occasionLower}\\s*(,|$)` } }
        ]
      });
    }

    console.log('👕 Available wardrobe items for', occasion + ':', wardrobeItems.length);

    // Debug: Show some example occasion tags
    if (wardrobeItems.length > 0) {
      console.log('🔍 Sample occasion tags from found items:');
      wardrobeItems.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.name}: [${item.occasionTags}]`);
      });
    }

    if (wardrobeItems.length === 0) {
      const message = occasionLower === 'random'
        ? 'No items found in your wardrobe. Try uploading some items first!'
        : `No items found for ${occasion} occasion. Try uploading more items or selecting a different occasion.`;

      return res.json({
        message: message,
        occasion: occasion,
        recommendedOutfit: null
      });
    }

    // Filter items by category
    const tops = wardrobeItems.filter(item =>
      ['TOPS', 'TOP'].includes(item.category.toUpperCase())
    );
    const bottoms = wardrobeItems.filter(item =>
      ['BOTTOMS', 'BOTTOM'].includes(item.category.toUpperCase())
    );
    const shoes = wardrobeItems.filter(item =>
      ['SHOES', 'SHOE', 'FOOTWEAR'].includes(item.category.toUpperCase())
    );
    const outerwear = wardrobeItems.filter(item => {
      const categoryUpper = item.category.toUpperCase();
      const itemNameUpper = (item.name || '').toUpperCase();

      // Check exact category matches
      if (['OUTERWEAR', 'JACKET', 'COAT', 'JACKETS'].includes(categoryUpper)) {
        return true;
      }

      // Check if category contains outerwear keywords
      if (categoryUpper.includes('JACKET') || categoryUpper.includes('COAT') || categoryUpper.includes('OUTERWEAR')) {
        return true;
      }

      // Check item name for all outerwear types (even if categorized as tops)
      const outerwearKeywords = [
        'JACKET', 'COAT', 'BLAZER', 'WINDBREAKER',
        'PARKA', 'BOMBER', 'TRENCH', 'RAINCOAT', 'RAIN COAT',
        'VEST', 'SWEATER COAT', 'SWEATER JACKET'
      ];

      const hasOuterwearKeyword = outerwearKeywords.some(keyword => itemNameUpper.includes(keyword));

      // If item name contains outerwear keyword and is categorized as TOPS, treat as outerwear
      if (hasOuterwearKeyword && categoryUpper === 'TOPS') {
        return true;
      }

      // Also check if category is OUTERWEAR (case variations)
      if (categoryUpper === 'OUTERWEAR' || categoryUpper.includes('OUTERWEAR')) {
        return true;
      }

      return false;
    });
    const accessories = wardrobeItems.filter(item =>
      ['ACCESSORIES', 'ACCESSORY'].includes(item.category.toUpperCase())
    );

    console.log('📊 Category breakdown for', occasion + ':');
    console.log('  - Tops:', tops.length);
    console.log('  - Bottoms:', bottoms.length);
    console.log('  - Shoes:', shoes.length);
    console.log('  - Outerwear:', outerwear.length);
    console.log('  - Accessories:', accessories.length);

    // Check if we have minimum required items
    if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
      const message = occasionLower === 'random'
        ? 'Not enough items to create a complete outfit. Need at least one top, bottom, and shoes in your wardrobe.'
        : `Not enough items to create a complete ${occasion} outfit. Need at least one top, bottom, and shoes.`;

      return res.json({
        message: message,
        occasion: occasion,
        recommendedOutfit: null,
        availableCategories: {
          tops: tops.length,
          bottoms: bottoms.length,
          shoes: shoes.length,
          outerwear: outerwear.length,
          accessories: accessories.length
        }
      });
    }

    // Helper function to pick random item from array
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

    // Helper function to identify accessory type from item name/category
    const getAccessoryType = (item) => {
      const nameUpper = (item.name || '').toUpperCase();
      const categoryUpper = (item.category || '').toUpperCase();

      // Check for specific accessory types
      if (nameUpper.includes('HAT') || nameUpper.includes('CAP') || nameUpper.includes('BEANIE')) {
        return 'hat';
      }
      if (nameUpper.includes('WATCH') || nameUpper.includes('TIMEPIECE')) {
        return 'watch';
      }
      if (nameUpper.includes('BRACELET') || nameUpper.includes('BANGLE')) {
        return 'bracelet';
      }
      if (nameUpper.includes('NECKLACE') || nameUpper.includes('PENDANT')) {
        return 'necklace';
      }
      if (nameUpper.includes('RING')) {
        return 'ring';
      }
      if (nameUpper.includes('EARRING') || nameUpper.includes('EARRINGS')) {
        return 'earring';
      }
      if (nameUpper.includes('BAG') || nameUpper.includes('HANDBAG') || nameUpper.includes('PURSE') || nameUpper.includes('BACKPACK')) {
        return 'bag';
      }
      if (nameUpper.includes('BELT')) {
        return 'belt';
      }
      if (nameUpper.includes('SUNGLASS') || nameUpper.includes('GLASSES') || nameUpper.includes('EYEWEAR')) {
        return 'sunglasses';
      }
      if (nameUpper.includes('SCARF')) {
        return 'scarf';
      }
      if (nameUpper.includes('TIE') || nameUpper.includes('NECKTIE') || nameUpper.includes('BOW TIE') || nameUpper.includes('BOWTIE')) {
        return 'tie';
      }

      // Default: use a hash of the name as type to ensure uniqueness
      return `other_${nameUpper.substring(0, 10)}`;
    };

    // Helper function to pick accessories with probability (0, 1, or 2 items max)
    // Ensures different accessory types when selecting multiple items
    // Probability: 30% no accessories, 40% one accessory, 30% two accessories
    const pickAccessoriesWithProbability = (arr) => {
      if (arr.length === 0) return [];

      const random = Math.random();
      let count = 0;

      if (random < 0.3) {
        // 30% chance: no accessories
        count = 0;
      } else if (random < 0.7) {
        // 40% chance: one accessory
        count = 1;
      } else {
        // 30% chance: two accessories
        count = 2;
      }

      if (count === 0) return [];

      // Group accessories by type
      const accessoriesByType = {};
      arr.forEach(item => {
        const type = getAccessoryType(item);
        if (!accessoriesByType[type]) {
          accessoriesByType[type] = [];
        }
        accessoriesByType[type].push(item);
      });

      const types = Object.keys(accessoriesByType);

      if (count === 1) {
        // Pick one random accessory from any type
        const randomType = types[Math.floor(Math.random() * types.length)];
        const itemsOfType = accessoriesByType[randomType];
        return [itemsOfType[Math.floor(Math.random() * itemsOfType.length)]];
      } else {
        // Pick two accessories of different types
        if (types.length < 2) {
          // If we only have one type, just return one item
          const onlyType = types[0];
          const itemsOfType = accessoriesByType[onlyType];
          return [itemsOfType[Math.floor(Math.random() * itemsOfType.length)]];
        }

        // Shuffle types and pick from different types
        const shuffledTypes = [...types].sort(() => 0.5 - Math.random());
        const selected = [];

        // Pick first accessory from first type
        const firstType = shuffledTypes[0];
        const firstTypeItems = accessoriesByType[firstType];
        selected.push(firstTypeItems[Math.floor(Math.random() * firstTypeItems.length)]);

        // Pick second accessory from a different type
        const secondType = shuffledTypes[1];
        const secondTypeItems = accessoriesByType[secondType];
        selected.push(secondTypeItems[Math.floor(Math.random() * secondTypeItems.length)]);

        return selected;
      }
    };

    // Helper function to pick outerwear with probability (sometimes show, sometimes not)
    // Probability: 50% include outerwear, 50% no outerwear (when available)
    const pickOuterwearWithProbability = (arr) => {
      if (arr.length === 0) return null;

      const random = Math.random();
      // 50% chance to include outerwear
      if (random < 0.5) {
        return pickRandom(arr);
      }
      return null;
    };

    // Create the outfit
    // Top, bottom, shoes: always included (if available)
    // Outerwear: probability-based (sometimes included)
    // Accessories: probability-based (0, 1, or 2 items)
    const outfit = {
      top: pickRandom(tops),
      bottom: pickRandom(bottoms),
      shoes: pickRandom(shoes),
      outerwear: pickOuterwearWithProbability(outerwear), // Sometimes included (50% probability)
      accessories: pickAccessoriesWithProbability(accessories) // Return 0-2 accessories based on probability
    };

    // Generate styling tips based on occasion
    const stylingTips = generateStylingTips(occasion, outfit);

    // Convert recommended outfit to items array for duplicate check
    const recommendedItems = [
      outfit.top,
      outfit.bottom,
      outfit.shoes,
      outfit.outerwear,
      ...(Array.isArray(outfit.accessories) ? outfit.accessories : outfit.accessories ? [outfit.accessories] : [])
    ].filter(Boolean); // Remove null/undefined items

    // Check for duplicate outfit (notification only)
    const duplicateCheck = await checkDuplicateOutfit(req.user.userId, recommendedItems, 7);

    res.json({
      occasion: occasion,
      recommendedOutfit: outfit,
      stylingTips: stylingTips,
      confidence: 0.9,
      duplicateWarning: duplicateCheck, // Include warning if duplicate found
      availableItems: {
        tops: tops.length,
        bottoms: bottoms.length,
        shoes: shoes.length,
        outerwear: outerwear.length,
        accessories: accessories.length
      }
    });

  } catch (error) {
    console.error('❌ Outfit recommendation error:', error);
    res.status(500).json({ error: 'Failed to recommend outfit' });
  }
});

// Helper function to generate styling tips
const generateStylingTips = (occasion, outfit) => {
  const tips = [];
  const occasionLower = occasion.toLowerCase();

  if (occasionLower === 'random') {
    tips.push('A versatile mix-and-match outfit from your wardrobe');
    tips.push('Perfect for experimenting with different styles');
    tips.push('Mix casual and formal pieces for a unique look');
    return tips;
  }

  switch (occasionLower) {
    case 'formal':
      tips.push('Perfect for business meetings and formal events');
      tips.push('Consider adding a blazer or dress jacket for extra sophistication');
      break;
    case 'casual':
      tips.push('Great for everyday wear and relaxed settings');
      tips.push('Layer with a light jacket or cardigan for versatility');
      break;
    case 'work':
      tips.push('Professional and comfortable for the office');
      tips.push('Add a statement accessory to personalize your look');
      break;
    case 'date':
      tips.push('Elegant and stylish for a romantic evening');
      tips.push('Consider adding subtle jewelry or a nice watch');
      break;
    case 'sporty':
      tips.push('Perfect for active lifestyle and athletic activities');
      tips.push('Layer appropriately for weather conditions');
      break;
    case 'party':
      tips.push('Fun and festive for celebrations');
      tips.push('Add bold accessories to make a statement');
      break;
    case 'travel':
      tips.push('Comfortable and versatile for travel');
      tips.push('Choose wrinkle-resistant fabrics when possible');
      break;
    case 'wedding':
      tips.push('Elegant and appropriate for special occasions');
      tips.push('Consider the wedding theme and venue');
      break;
    case 'meeting':
      tips.push('Professional and confident for important meetings');
      tips.push('Choose colors that convey trust and competence');
      break;
    default:
      tips.push('Stylish and appropriate for the occasion');
      tips.push('Accessorize to complete your look');
  }

  return tips;
};

// Legacy Gemini-based recommendation route (kept for fallback)
app.post('/api/recommend-outfit-gemini', async (req, res) => {
  try {
    const { occasion, wardrobeItems } = req.body;

    if (!occasion || !wardrobeItems || wardrobeItems.length === 0) {
      return res.status(400).json({ error: 'Occasion and wardrobe items are required' });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('🤖 Generating Gemini outfit recommendation for occasion:', occasion);
    console.log('👕 Available wardrobe items:', wardrobeItems.length);

    // Prepare wardrobe data for Gemini
    const wardrobeData = wardrobeItems.map(item => ({
      name: item.name,
      category: item.category,
      tags: item.tags || []
    }));

    // Create prompt for Gemini
    const prompt = `You are a fashion expert AI assistant. Based on the user's wardrobe items and the occasion "${occasion}", recommend a complete outfit.

Available wardrobe items:
${wardrobeData.map(item => `- ${item.name} (Category: ${item.category}, Tags: ${item.tags.join(', ')})`).join('\n')}

Please recommend a complete outfit for "${occasion}" using ONLY the items from the user's wardrobe above. 

Return your response in this exact JSON format:
{
  "occasion": "${occasion}",
  "recommendedItems": [
    {
      "name": "exact item name from wardrobe",
      "category": "item category",
      "reasoning": "why this item is perfect for this occasion"
    }
  ],
  "stylingTips": "brief styling advice for this outfit",
    "confidence": 0.85
}

Make sure to:
1. Only use items that exist in the wardrobe list above
2. Create a complete outfit (top, bottom, shoes, accessories if available)
3. Match the occasion appropriately
4. Provide practical styling advice
5. Return valid JSON only, no additional text`;

    try {
      const geminiResponse = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Gemini API response received');

      const responseText = geminiResponse.data.candidates[0].content.parts[0].text;
      console.log('📝 Raw Gemini response:', responseText);

      // Parse the JSON response from Gemini
      let recommendation;
      try {
        // Extract JSON from the response (in case there's extra text)
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          recommendation = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('❌ Error parsing Gemini response:', parseError);
        throw new Error('Failed to parse AI response');
      }

      // Map recommended items back to full wardrobe items
      const recommendedOutfit = {
        id: Date.now(),
        occasion: recommendation.occasion,
        items: recommendation.recommendedItems.map(recItem => {
          const fullItem = wardrobeItems.find(item =>
            item.name.toLowerCase() === recItem.name.toLowerCase()
          );
          return fullItem ? {
            ...fullItem,
            reasoning: recItem.reasoning
          } : null;
        }).filter(item => item !== null),
        stylingTips: recommendation.stylingTips,
        confidence: recommendation.confidence || 0.8,
        createdAt: new Date()
      };

      console.log('🎯 Final recommendation:', recommendedOutfit);

      res.json(recommendedOutfit);

    } catch (geminiError) {
      console.error('❌ Gemini API error:', geminiError.response?.data || geminiError.message);

      // Fallback recommendation using simple logic
      const fallbackRecommendation = generateFallbackRecommendation(occasion, wardrobeItems);
      res.json(fallbackRecommendation);
    }

  } catch (error) {
    console.error('❌ Outfit recommendation error:', error.message);
    res.status(500).json({ error: 'Failed to generate outfit recommendation' });
  }
});

// Fallback recommendation function
function generateFallbackRecommendation(occasion, wardrobeItems) {
  console.log('🔄 Generating fallback recommendation...');

  // Simple categorization
  const tops = wardrobeItems.filter(item => item.category === 'TOPS');
  const bottoms = wardrobeItems.filter(item => item.category === 'BOTTOMS');
  const shoes = wardrobeItems.filter(item => item.category === 'SHOES');
  const accessories = wardrobeItems.filter(item => item.category === 'ACCESSORIES');

  const recommendedItems = [];

  // Add one item from each category if available
  if (tops.length > 0) recommendedItems.push(tops[0]);
  if (bottoms.length > 0) recommendedItems.push(bottoms[0]);
  if (shoes.length > 0) recommendedItems.push(shoes[0]);
  if (accessories.length > 0) recommendedItems.push(accessories[0]);

  return {
    id: Date.now(),
    occasion: occasion,
    items: recommendedItems,
    stylingTips: `Perfect for ${occasion.toLowerCase()}. Mix and match these pieces for a stylish look.`,
    confidence: 0.6,
    createdAt: new Date()
  };
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Drop old username index if it exists
const cleanupOldIndexes = async () => {
  try {
    // Wait for MongoDB connection
    if (mongoose.connection.readyState !== 1) {
      await new Promise(resolve => {
        mongoose.connection.once('connected', resolve);
      });
    }

    const userCollection = mongoose.connection.collection('users');
    const indexes = await userCollection.indexes();

    // Check if username_1 index exists
    const usernameIndex = indexes.find(idx => idx.name === 'username_1');
    if (usernameIndex) {
      console.log('🗑️  Removing old username index...');
      await userCollection.dropIndex('username_1');
      console.log('✅ Old username index removed');
    } else {
      console.log('ℹ️  No old username index found');
    }
  } catch (error) {
    // Index might not exist, which is fine
    if (error.code === 27 || error.codeName === 'IndexNotFound') {
      console.log('ℹ️  No old username index to remove');
    } else {
      console.error('⚠️  Error cleaning up old indexes:', error.message);
    }
  }
};

// Migrate existing data to admin user
const migrateExistingDataToAdmin = async (adminUserId) => {
  try {
    // Migrate wardrobe items
    const wardrobeItemsWithoutUser = await WardrobeItem.countDocuments({ user: { $exists: false } });
    if (wardrobeItemsWithoutUser > 0) {
      await WardrobeItem.updateMany(
        { user: { $exists: false } },
        { $set: { user: adminUserId } }
      );
      console.log(`✅ Migrated ${wardrobeItemsWithoutUser} wardrobe items to admin`);
    }

    // Migrate outfits
    const outfitsWithoutUser = await Outfit.countDocuments({ user: { $exists: false } });
    if (outfitsWithoutUser > 0) {
      await Outfit.updateMany(
        { user: { $exists: false } },
        { $set: { user: adminUserId } }
      );
      console.log(`✅ Migrated ${outfitsWithoutUser} outfits to admin`);
    }

    // Migrate planned outfits
    const plannedOutfitsWithoutUser = await PlannedOutfit.countDocuments({ user: { $exists: false } });
    if (plannedOutfitsWithoutUser > 0) {
      await PlannedOutfit.updateMany(
        { user: { $exists: false } },
        { $set: { user: adminUserId } }
      );
      console.log(`✅ Migrated ${plannedOutfitsWithoutUser} planned outfits to admin`);
    }
  } catch (error) {
    console.error('❌ Error migrating existing data:', error);
  }
};

// Seed initial categories and occasions
const seedCategoriesAndOccasions = async () => {
  try {
    // Seed categories with keywords for better AI detection
    const defaultCategories = [
      {
        id: 'tops',
        label: 'Tops',
        color: '#3b82f6',
        order: 1,
        keywords: ['shirt', 't-shirt', 'top', 'blouse', 'sweater', 'hoodie', 'active shirt', 'dress shirt', 'polo', 'tank top', 'tank', 'crop top', 'cardigan', 'vest', 'jumper']
      },
      {
        id: 'bottoms',
        label: 'Bottoms',
        color: '#f59e0b',
        order: 2,
        keywords: ['pants', 'jeans', 'trousers', 'shorts', 'skirt', 'denim', 'slacks', 'chino', 'khaki', 'leggings', 'capri', 'cargo pants']
      },
      {
        id: 'shoes',
        label: 'Shoes',
        color: '#8b5cf6',
        order: 3,
        keywords: ['shoe', 'footwear', 'sneaker', 'boot', 'sneakers', 'boots', 'dress shoe', 'oxford', 'loafer', 'pump', 'heel', 'sandal', 'flip flop', 'slipper', 'athletic shoe', 'running shoe', 'trainer']
      },
      {
        id: 'outerwear',
        label: 'Outerwear',
        color: '#8B9DC3',
        order: 4,
        keywords: ['jacket', 'coat', 'blazer', 'windbreaker', 'parka', 'bomber', 'bomber jacket', 'trench', 'trench coat', 'raincoat', 'rain coat', 'outerwear', 'hoodie', 'sweater', 'cardigan', 'vest', 'pullover']
      },
      {
        id: 'accessories',
        label: 'Accessories',
        color: '#6b7280',
        order: 5,
        keywords: ['watch', 'hat', 'cap', 'bag', 'belt', 'tie', 'necktie', 'bow tie', 'bowtie', 'sunglasses', 'necklace', 'ring', 'bracelet', 'earrings', 'earring', 'accessory', 'jewelry', 'backpack', 'purse', 'handbag', 'briefcase', 'wallet', 'scarf', 'gloves']
      }
    ];

    for (const cat of defaultCategories) {
      // Separate fields: use $setOnInsert for fields that should only be set on insert
      // Use $set for fields that should be updated even if document exists (like keywords)
      const { keywords, ...catWithoutKeywords } = cat;
      await Category.findOneAndUpdate(
        { id: cat.id },
        {
          $setOnInsert: catWithoutKeywords, // Only set these fields on insert
          $set: { keywords: keywords || [] } // Always update keywords (even if category exists)
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Categories seeded');

    // Seed occasions with keywords for better AI detection
    const defaultOccasions = [
      {
        id: 'casual',
        label: 'Casual',
        color: '#3b82f6',
        order: 1,
        keywords: ['casual', 'everyday', 'relaxed', 'comfortable', 'informal', 'street', 'weekend', 'leisure', 'sneaker', 'canvas', 'flat', 'slip-on', 't-shirt', 'cotton', 'jeans', 'denim', 'hat', 'cap', 'bag', 'backpack', 'sunglasses']
      },
      {
        id: 'formal',
        label: 'Formal',
        color: '#8b5cf6',
        order: 2,
        keywords: ['formal', 'dress', 'elegant', 'suit', 'tuxedo', 'evening', 'gala', 'black tie', 'cocktail', 'sophisticated', 'dress shoe', 'oxford', 'loafer', 'heel', 'pump', 'dress shirt', 'blouse', 'dress pants', 'slacks', 'trousers', 'watch', 'belt', 'jewelry', 'necklace', 'ring', 'bracelet']
      },
      {
        id: 'work',
        label: 'Work',
        color: '#f59e0b',
        order: 3,
        keywords: ['work', 'office', 'professional', 'business', 'corporate', 'smart casual', 'business casual', 'workplace', 'dress shoe', 'oxford', 'loafer', 'button', 'polo', 'blazer', 'khaki', 'chino', 'dress pants', 'watch', 'belt', 'bag', 'briefcase']
      },
      {
        id: 'sporty',
        label: 'Sporty',
        color: '#ef4444',
        order: 4,
        keywords: ['sport', 'athletic', 'active', 'gym', 'fitness', 'running', 'workout', 'exercise', 'training', 'sports', 'sneaker', 'trainer', 'shorts', 'hat', 'cap', 'sunglasses', 'fitness']
      }
    ];

    for (const occ of defaultOccasions) {
      // Separate fields: use $setOnInsert for fields that should only be set on insert
      // Use $set for fields that should be updated even if document exists (like keywords)
      const { keywords, ...occWithoutKeywords } = occ;
      await Occasion.findOneAndUpdate(
        { id: occ.id },
        {
          $setOnInsert: occWithoutKeywords, // Only set these fields on insert
          $set: { keywords: keywords || [] } // Always update keywords (even if occasion exists)
        },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Occasions seeded');
  } catch (error) {
    console.error('❌ Error seeding categories/occasions:', error);
  }
};

// Create default admin user if it doesn't exist
const createDefaultAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@styleit.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        email: adminEmail,
        password: adminPassword,
        name: 'Admin',
        role: 'admin'
      });
      await admin.save();
      console.log('✅ Default admin user created:', adminEmail);
      console.log('   Password:', adminPassword);
      console.log('   ⚠️  Please change the default password in production!');
    } else {
      console.log('✅ Admin user already exists');
    }

    // Migrate existing data to admin
    await migrateExistingDataToAdmin(admin._id);
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
  }
};

// Start server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Access from mobile: http://192.168.56.1:3000`);
  // Clean up old indexes and create default admin after MongoDB connection is established
  await cleanupOldIndexes();
  await seedCategoriesAndOccasions();
  await createDefaultAdmin();
});

