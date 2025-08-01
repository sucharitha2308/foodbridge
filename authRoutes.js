const express = require('express');
const router = express.Router();
const User = require('./User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (res, id, role) => {
  const token = jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
};

// Register User or Volunteer
router.post('/register', async (req, res) => {
  const { name, email, password, address, role, hintQuestion, hintAnswer, areaOfOperation } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name, email, password, address, role, hintQuestion, hintAnswer, areaOfOperation
    });

    if (user) {
      generateToken(res, user._id, user.role);
      res.status(201).json({
        message: 'Registration successful',
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('REGISTRATION ERROR:', error); 
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login User or Volunteer
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;

  try {
    const user = await User.findOne({ email, role });

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id, user.role);
      res.status(200).json({
        message: 'Login successful',
        role: user.role,
      });
    } else {
      res.status(401).json({ message: 'Invalid email, password, or role' });
    }
  } catch (error) {
    console.error('LOGIN ERROR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Forgot Password - CORRECTED LOGIC
router.post('/forgot-password', async (req, res) => {
    const { email, hintAnswer, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }
        
        if (user.hintAnswer.toLowerCase() !== hintAnswer.toLowerCase()) {
            return res.status(400).json({ message: 'Security hint answer is incorrect.' });
        }

        // Manually hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update only the password field for the user
        await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });

        res.status(200).json({ message: 'Password has been reset successfully.' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Server error during password reset.' });
    }
});


// Logout
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;