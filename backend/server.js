const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/user');
const Admin = require('./models/admin');

const app = express();

// CORS for Vercel frontend
app.use(cors({
  origin: 'https://sample1-rust.vercel.app',
  credentials: true
}));

app.use(bodyParser.json());
app.use(express.static('public'));

// Multer for image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ===== ROUTES =====

// Register User
app.post('/register-user', async (req, res) => {
  try {
    const { password, ...otherData } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ ...otherData, password: hashedPassword });
    await newUser.save();
    res.send('User Registered Successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering user');
  }
});

// Register Admin
app.post('/register-admin', async (req, res) => {
  try {
    const { password, ...otherData } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ ...otherData, password: hashedPassword });
    await newAdmin.save();
    res.send('Admin Registered Successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error registering admin');
  }
});

// Login User
app.post('/login-user', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).send('Invalid email or password');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send('Invalid email or password');
    res.send('Login Successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error during login');
  }
});

// Login Admin
app.post('/login-admin', async (req, res) => {
  try {
    const { email, password, admin_type } = req.body;
    const admin = await Admin.findOne({ email, admin_type });
    if (!admin) return res.status(401).send('Invalid credentials');
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).send('Invalid credentials');
    res.send('Login Successful');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error during login');
  }
});

// Get User Data
app.post('/user-data', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email }).select('-password');
    if (!user) return res.status(404).send('User not found');
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching user data');
  }
});

// Get Admin Data
app.post('/admin-data', async (req, res) => {
  try {
    const { email, admin_type } = req.body;
    const admin = await Admin.findOne({ email, admin_type }).select('-password');
    if (!admin) return res.status(404).send('Admin not found');
    res.json(admin);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching admin data');
  }
});

// Change User Password
app.post('/change-password-user', async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate({ email }, { password: hashedPassword }, { new: true });
    if (!user) return res.status(404).send('User not found');
    res.send('Password changed successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error changing password');
  }
});

// Change Admin Password
app.post('/change-password-admin', async (req, res) => {
  try {
    const { email, newPassword, admin_type } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const admin = await Admin.findOneAndUpdate(
      { email, admin_type },
      { password: hashedPassword },
      { new: true }
    );
    if (!admin) return res.status(404).send('Admin not found');
    res.send('Password changed successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error changing password');
  }
});

// Upload User Image
app.post('/upload-image-user', upload.single('image'), async (req, res) => {
  try {
    const { email } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const user = await User.findOneAndUpdate({ email }, { image: imagePath }, { new: true });
    if (!user) return res.status(404).send('User not found');
    res.send('Image uploaded successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading image');
  }
});

// Upload Admin Image
app.post('/upload-image-admin', upload.single('image'), async (req, res) => {
  try {
    const { email, admin_type } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const admin = await Admin.findOneAndUpdate({ email, admin_type }, { image: imagePath }, { new: true });
    if (!admin) return res.status(404).send('Admin not found');
    res.send('Image uploaded successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error uploading image');
  }
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
