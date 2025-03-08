// server/middleware/auth.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: "No token provided" });
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = await User.findById(decoded._id);
    if (!req.user) return res.status(401).json({ error: "User not found" });
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

export const verifyTokenSocket = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    const user = await User.findById(decoded._id);
    if (!user) throw new Error("User not found");
    return user;
  } catch (error) {
    throw new Error("Authentication failed");
  }
};

export default auth;
