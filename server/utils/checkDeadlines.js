// checkDeadlines.js
import Task from '../models/Task.js';
import { sendDeadlineReminder } from './mailer.js';
import User from '../models/User.js';

export const checkDeadlines = async () => {
  // Verify email environment variables before attempting to send emails
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error('❌ Email environment variables not properly set');
    return;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const nextDay = new Date(tomorrow);
  nextDay.setDate(nextDay.getDate() + 1);

  try {
    const projectsDueTomorrow = await Task.find({
      isProject: true,
      deadline: { $gte: tomorrow, $lt: nextDay }
    }).populate('user', 'email');

    console.log(`Found ${projectsDueTomorrow.length} projects due tomorrow`);

    for (const project of projectsDueTomorrow) {
      const userEmail = project.user?.email;
      if (userEmail) {
        await sendDeadlineReminder(userEmail, project.name, project.deadline.toDateString());
      } else {
        console.log(`⚠️ No email found for project: ${project.name}`);
      }
    }

    console.log(`📬 Checked deadlines: ${projectsDueTomorrow.length} projects due`);
  } catch (err) {
    console.error('❌ Error checking deadlines:', err);
  }
};