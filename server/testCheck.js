// testEmail.js
import dotenv from 'dotenv';
import { transporter, sendDeadlineReminder } from './utils/mailer.js';

// Load environment variables
dotenv.config();

const testEmail = async () => {
  console.log('Testing email configuration...');
  
  // Check if environment variables are set
  if (!process.env.EMAIL_USER) {
    console.error('❌ EMAIL_USER environment variable not set');
    return;
  }
  
  if (!process.env.EMAIL_APP_PASSWORD) {
    console.error('❌ EMAIL_APP_PASSWORD environment variable not set');
    return;
  }

  console.log(`✅ Using email: ${process.env.EMAIL_USER}`);
  console.log('✅ App Password is set (not shown for security)');

  try {
    // First, verify SMTP connection
    console.log('Verifying SMTP connection...');
    const verification = await transporter.verify();
    console.log('✅ SMTP connection verified:', verification);
    
    // Then try sending a test email
    console.log('Sending test email...');
    await sendDeadlineReminder(
      process.env.EMAIL_USER, // Send to yourself for testing
      'Test Project',
      new Date().toDateString()
    );
    
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Email test failed:', error);
    console.error('Error details:', error.message);
  }
};

testEmail();