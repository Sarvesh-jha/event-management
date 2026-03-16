const nodemailer = require('nodemailer');

const env = require('../config/env');

let transporter;

const getTransporter = () => {
  if (transporter) {
    return transporter;
  }

  if (env.smtpHost) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpSecure,
      auth:
        env.smtpUser && env.smtpPass
          ? {
              user: env.smtpUser,
              pass: env.smtpPass,
            }
          : undefined,
    });
  } else {
    // Stream transport keeps local development working without a real SMTP account.
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    });
  }

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const info = await getTransporter().sendMail({
    from: env.fromEmail,
    to,
    subject,
    html,
    text,
  });

  if (info.message) {
    console.log(`[email-preview] ${subject} -> ${to}`);
  }

  return info;
};

const sendRegistrationConfirmationEmail = async ({ user, event, registration }) =>
  sendEmail({
    to: user.email,
    subject: `Registration confirmed for ${event.title}`,
    text: [
      `Hello ${user.fullName},`,
      '',
      `Your registration for ${event.title} is ${registration.status}.`,
      `Venue: ${event.venue}`,
      `Start: ${new Date(event.startDate).toLocaleString()}`,
      `QR token: ${registration.qrCodeToken}`,
      '',
      'Keep this email for event check-in.',
    ].join('\n'),
    html: `
      <h2>Registration confirmed</h2>
      <p>Hello ${user.fullName},</p>
      <p>Your registration for <strong>${event.title}</strong> is <strong>${registration.status}</strong>.</p>
      <p><strong>Venue:</strong> ${event.venue}</p>
      <p><strong>Start:</strong> ${new Date(event.startDate).toLocaleString()}</p>
      <p><strong>QR token:</strong> ${registration.qrCodeToken}</p>
      <p>Keep this email for event check-in.</p>
    `,
  });

const sendUpcomingReminderEmail = async ({ user, event }) =>
  sendEmail({
    to: user.email,
    subject: `Reminder: ${event.title} starts soon`,
    text: [
      `Hello ${user.fullName},`,
      '',
      `This is a reminder that ${event.title} starts on ${new Date(event.startDate).toLocaleString()}.`,
      `Venue: ${event.venue}`,
      'We look forward to seeing you there.',
    ].join('\n'),
    html: `
      <h2>Upcoming event reminder</h2>
      <p>Hello ${user.fullName},</p>
      <p><strong>${event.title}</strong> starts on ${new Date(event.startDate).toLocaleString()}.</p>
      <p><strong>Venue:</strong> ${event.venue}</p>
      <p>We look forward to seeing you there.</p>
    `,
  });

module.exports = {
  sendEmail,
  sendRegistrationConfirmationEmail,
  sendUpcomingReminderEmail,
};
