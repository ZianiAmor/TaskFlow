// model/User.js 
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    default: 'London' // Set appropriate default
  },
  username: {
    type: String, 
    required: true,
    unique: true,
    trim: true,// this removes spaces at the beginning and the end
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
  projects: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project", 
    },
  ],
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
    },
  ],
  notifications: [
    {
      message: String,
      date: { type: Date, default: Date.now },
      read: { type: Boolean, default: false },
    },
    
  ],
  tasksCompleted: { type: Number, default: 0 },
  projectsCompleted: { type: Number, default: 0 }
}, { timestamps: true });
const User = mongoose.model("User", userSchema);
export default User;
