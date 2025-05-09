// model/User.js 
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    default: 'Bejaia' 
  },
  username: {
    type: String, 
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  tasks: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task", 
    },
  ],
 
  notifications: [
    {
      message: String,
      date: { type: Date, default: Date.now },
      read: { type: Boolean, default: false },
    },
    
  ]
}, { timestamps: true });
const User = mongoose.model("User", userSchema);
export default User;
