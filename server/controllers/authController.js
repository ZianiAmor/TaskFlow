import User from '../models/User.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const Register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }

    const salt = await bcrypt.genSalt(10);
const hashedPassword = await bcrypt.hash(password, salt);
const newUser = new User({ username, email, password: hashedPassword });
await newUser.save();

    res.status(201).json({ 
      success: true, 
      user: { _id: newUser._id, username } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User Not Found' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.JWT_KEY, { 
      expiresIn: "10d" 
    });

    res.status(200).json({ 
      success: true, 
      token,
      user: { _id: user._id, username: user.username }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      error: 'Server error' 
    });
  }
};

export { Login, Register };