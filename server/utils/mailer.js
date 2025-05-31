// mailer.js with enhanced email template
import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendDeadlineReminder = async (email, projectName, deadline) => {
  // Verify environment variables are available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error('❌ Email environment variables not set');
    return;
  }

  try {
    await transporter.sendMail({
      from: `"TaskFlow Reminder" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '⏰ Project Deadline Reminder',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #fff;
              border: 1px solid #e1e1e1;
              border-radius: 8px;
              overflow: hidden;
            }
            .email-header {
              background-color: #2c3e50;
              color: white;
              padding: 15px 20px;
              display: flex;
              align-items: center;
            }
            .email-logo {
              font-weight: bold;
              font-size: 20px;
              display: flex;
              align-items: center;
            }
            .logo-icon {
              background-color: #3498db;
              color: white;
              width: 30px;
              height: 30px;
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 10px;
              font-size: 18px;
            }
            .email-subject {
              background-color: #f8f9fa;
              padding: 15px 20px;
              border-bottom: 1px solid #e9ecef;
              font-size: 18px;
              font-weight: 600;
            }
            .email-body {
              padding: 20px;
            }
            .project-name {
              color: #e74c3c;
              font-weight: bold;
            }
            .deadline {
              font-weight: bold;
            }
            .email-footer {
              padding: 15px 20px;
              border-top: 1px solid #e9ecef;
              background-color: #f8f9fa;
              font-size: 14px;
              color: #6c757d;
            }
            .alert-icon {
              font-size: 24px;
              margin-right: 10px;
              color: #e74c3c;
            }
            .reminder-header {
              display: flex;
              align-items: center;
              margin-bottom: 20px;
            }
            .call-to-action {
              background-color: #3498db;
              color: white;
              padding: 10px 15px;
              text-decoration: none;
              border-radius: 4px;
              display: inline-block;
              margin-top: 15px;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <div class="email-logo">
                <div class="logo-icon">TF</div>
                TaskFlow
              </div>
            </div>
            
            <div class="email-subject">
              ⏰ Project Deadline Reminder
            </div>
            
            <div class="email-body">
              <div class="reminder-header">
                <span class="alert-icon">⏰</span>
                <h2>Project Reminder</h2>
              </div>
              
              <p><span class="project-name">${projectName}</span> is due tomorrow (<span class="deadline">${deadline}</span>).</p>
              
              <p>Don't forget to finish it on time!</p>
              
              <a href="${process.env.CLIENT_URL}" class="call-to-action">View Project Details</a>
            </div>
            
            <div class="email-footer">
              <p>— TaskFlow Team</p>
              <p>This is an automated reminder. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    console.log(`✅ Reminder email sent to ${email}`);
  } catch (err) {
    console.error('❌ Failed to send email:', err);
    console.error('Error details:', err.message);
  }
};