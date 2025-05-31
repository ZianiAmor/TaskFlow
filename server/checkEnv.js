// checkEnv.js
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('Environment Variable Check:');
console.log('---------------------------');

// Check for EMAIL_USER
console.log('EMAIL_USER:', process.env.EMAIL_USER ? 
  `✅ Set (${process.env.EMAIL_USER})` : 
  '❌ NOT SET');

// Check for EMAIL_APP_PASSWORD
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 
  '✅ Set (Value hidden for security)' : 
  '❌ NOT SET');

// Check for EMAIL_PASS (the old variable name)
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? 
  '✅ Set (Value hidden for security)' : 
  '❌ NOT SET');

// Check which variable is actually available
if (process.env.EMAIL_APP_PASSWORD) {
  console.log('Using EMAIL_APP_PASSWORD');
} else if (process.env.EMAIL_PASS) {
  console.log('Using EMAIL_PASS');
} else {
  console.log('No email password variable found!');
}

console.log('---------------------------');