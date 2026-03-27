require('dotenv').config();
console.log('Starting TicketB backend server...');
const express = require("express");
const app = express();
const cors = require("cors");
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const userrouter = require('./routers/userRouter');
const vendorrouter = require('./routers/vendorRouter');
const eventrouter = require('./routers/eventRouter');
const ticketrouter = require('./routers/ticketRouter');
const adminrouter = require('./routers/adminRouter');
require('dotenv').config(); // For environment variables
const {db} =  require("./config/firebase_config");

const resetTokens = new Map();

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Loaded from .env
    pass: process.env.EMAIL_PASS, // Loaded from .env
  },
});

transporter.verify((error, success) => {
  if (error) {
  } else {
  }
});

// Make transporter available to routes
app.locals.emailTransporter = transporter;

// Email template generator 
const generateEmailTemplate = (vendorName, status) => {
  const displayName = vendorName || "Vendor";

  if (status === "accepted") {
    return {
      subject: "Your TicketB Vendor Registration Has Been Approved",
      text: `Dear ${displayName},\n\nCongratulations! Your vendor registration on TicketB has been approved.\n\nYou can now log in to your account and start using our platform to manage your events and tickets.\n\nIf you have any questions or need assistance, please don't hesitate to contact our support team.\n\nBest regards,\nTicketB Admin Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #19aedc; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">TicketB</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>Registration Approved!</h2>
            <p>Dear ${displayName},</p>
            <p>Congratulations! Your vendor registration on TicketB has been approved.</p>
            <p>You can now log in to your account and start using our platform to manage your events and tickets.</p>
            <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
            <p>Best regards,<br>TicketB Admin Team</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message from TicketB. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };
  } else if (status === "rejected") {
    return {
      subject: "Update on Your TicketB Vendor Registration",
      text: `Dear ${displayName},\n\nWe regret to inform you that your vendor registration on TicketB has not been approved at this time.\n\nIf you would like more information about this decision or wish to reapply with additional information, please contact our support team.\n\nBest regards,\nTicketB Admin Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #19aedc; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">TicketB</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>Registration Status Update</h2>
            <p>Dear ${displayName},</p>
            <p>We regret to inform you that your vendor registration on TicketB has not been approved at this time.</p>
            <p>If you would like more information about this decision or wish to reapply with additional information, please contact our support team.</p>
            <p>Best regards,<br>TicketB Admin Team</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message from TicketB. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };
  } else if (status === "removed") {
    return {
      subject: "Your TicketB Vendor Account Has Been Removed",
      text: `Dear ${displayName},\n\nYour vendor account on TicketB has been removed from our system.\n\nIf you believe this is an error or have any questions, please contact our support team.\n\nBest regards,\nTicketB Admin Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #19aedc; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">TicketB</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
            <h2>Account Removal Notice</h2>
            <p>Dear ${displayName},</p>
            <p>Your vendor account on TicketB has been removed from our system.</p>
            <p>If you believe this is an error or have any questions, please contact our support team.</p>
            <p>Best regards,<br>TicketB Admin Team</p>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
            <p>This is an automated message from TicketB. Please do not reply to this email.</p>
          </div>
        </div>
      `
    };
  }

  return {
    subject: "TicketB Vendor Registration Update",
    text: `Dear ${displayName},\n\nThere has been an update to your vendor registration on TicketB.\n\nPlease log in to your account to view the current status.\n\nBest regards,\nTicketB Admin Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #19aedc; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">TicketB</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>Registration Status Update</h2>
          <p>Dear ${displayName},</p>
          <p>There has been an update to your vendor registration on TicketB.</p>
          <p>Please log in to your account to view the current status.</p>
          <p>Best regards,<br>TicketB Admin Team</p>
        </div>
        <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #666;">
          <p>This is an automated message from TicketB. Please do not reply to this email.</p>
        </div>
      </div>
    `
  };
};

// Password reset email 
function generatePasswordResetEmail(vendorName, resetToken) {
  const resetUrl = `${process.env.FRONTEND_URL}/vendor-reset-password?token=${resetToken}`;
  // Or if you don't have FRONTEND_URL set:
  // const resetUrl = `http://localhost:3000/vendor-reset-password?token=${resetToken}`;
  
  const subject = "Reset Your TicketB Password";
  
  const text = `
Hi ${vendorName},

You requested to reset your password for your TicketB vendor account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you did not request this reset, please ignore this email.

Best regards,
TicketB Team
  `.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Reset Your TicketB Password</h2>
      <p>Hi ${vendorName},</p>
      
      <p>You requested to reset your password for your TicketB vendor account.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Password
        </a>
      </div>
      
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${resetUrl}</p>
      
      <p><strong>This link will expire in 1 hour.</strong></p>
      
      <p>If you did not request this reset, please ignore this email.</p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #666; font-size: 12px;">
        Best regards,<br>
        TicketB Team
      </p>
    </div>
  `;

  return { subject, text, html };
}

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiresAt) {
      resetTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // 1 hour

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();


    const vendorSnap = await db
      .collection("vendors")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();


    if (vendorSnap.empty) {
      // Also try case-insensitive search by getting all vendors and filtering
      const allVendorsSnap = await db.collection("vendors").get();
      let foundVendor = null;

      allVendorsSnap.forEach(doc => {
        const data = doc.data();
        if (data.email && data.email.toLowerCase().trim() === normalizedEmail) {
          foundVendor = { doc, data };
        }
      });

      if (!foundVendor) {
        return res.status(400).json({
          success: false,
          error: 'No vendor account found with this email address.'
        });
      }

      const vendorDoc = foundVendor.doc;
      const vendorData = foundVendor.data;

      // Check if vendor account is active
      if (vendorData.status === false) {
        return res.status(400).json({
          success: false,
          error: 'Your account is not active. Please contact support.'
        });
      }

      // Generate reset token for manually found vendor
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now

      resetTokens.set(resetToken, {
        email: vendorData.email,
        expiresAt: expiresAt,
        vendorId: vendorDoc.id
      });

      // Generate and send email
      const emailContent = generatePasswordResetEmail(vendorData.organisationName || vendorData.name, resetToken);

      const mailOptions = {
        from: `"TicketB Admin" <${process.env.EMAIL_USER}>`,
        to: vendorData.email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      };

      await transporter.sendMail(mailOptions);

  
      return res.status(200).json({
        success: true,
        message: 'Password reset link has been sent to your email address.'
      });
    }

    const vendorDoc = vendorSnap.docs[0];
    const vendorData = vendorDoc.data();

    // Check if vendor account is active
    if (vendorData.status === false) {
      return res.status(400).json({
        success: false,
        error: 'Your account is not active. Please contact support.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour from now

    // Store token with expiration
    resetTokens.set(resetToken, {
      email: vendorData.email,
      expiresAt: expiresAt,
      vendorId: vendorDoc.id
    });

    // Generate and send email
    const emailContent = generatePasswordResetEmail(vendorData.organisationName || vendorData.name, resetToken);

    const mailOptions = {
      from: `"TicketB Admin" <${process.env.EMAIL_USER}>`,
      to: vendorData.email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    };

    await transporter.sendMail(mailOptions);


    res.status(200).json({
      success: true,
      message: 'Password reset link has been sent to your email address.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required'
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters long'
      });
    }

    // Check if token exists and is valid
    const tokenData = resetTokens.get(token);
    if (!tokenData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // Check if token is expired
    if (Date.now() > tokenData.expiresAt) {
      resetTokens.delete(token);
      return res.status(400).json({
        success: false,
        error: 'Reset token has expired. Please request a new one.'
      });
    }

    // Hash the new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const vendorRef = db.collection("vendors").doc(tokenData.vendorId);
    await vendorRef.update({
      password: hashedPassword,
      updatedAt: new Date().toISOString()
    });

    // Remove the used token
    resetTokens.delete(token);


    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error. Please try again later.'
    });
  }
});

// Endpoint to verify reset token (optional - for frontend validation)
app.post('/api/auth/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    const tokenData = resetTokens.get(token);
    if (!tokenData || Date.now() > tokenData.expiresAt) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid'
    });

  } catch (error) {
    console.error('Error in verify reset token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// General email sending endpoint
app.post('/api/send-email', async (req, res) => {
  const { to, subject, text, html } = req.body;

  // Validate request body
  if (!to || (!subject && !text && !html)) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: recipient email and content'
    });
  }

  try {
    const mailOptions = {
      from: `"TicketB Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject: subject || "Message from TicketB"
    };

    // Add either text or HTML content
    if (text) mailOptions.text = text;
    if (html) mailOptions.html = html;

    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    res.status(200).json({ success: true, message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// Admin email endpoint specifically for vendor status updates
app.post('/api/admin/send-email', async (req, res) => {
  const { to, vendorName, status, subject, text, html } = req.body;

  // Validate request body
  if (!to) {
    return res.status(400).json({
      success: false,
      error: 'Missing required field: recipient email'
    });
  }

  try {
    // Determine if we should use provided content or generate from template
    const useTemplate = status === 'accepted' || status === 'rejected' || status === 'removed';
    const emailContent = useTemplate
      ? generateEmailTemplate(vendorName, status)
      : { subject, text, html };

    const mailOptions = {
      from: `"TicketB Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      text: emailContent.text
    };

    // Add HTML content if available
    if (emailContent.html) {
      mailOptions.html = emailContent.html;
    }

    await transporter.sendMail(mailOptions);

    const statusText = status ? `for ${status} status` : '';
    console.log(`Vendor notification email sent to ${to} ${statusText}`);

    res.status(200).json({
      success: true,
      message: `Email notification ${statusText} sent successfully`
    });
  } catch (error) {
    console.error('Error sending vendor status email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send vendor status email',
      details: error.message
    });
  }
});

app.delete('/api/admin/removevendor', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const requestSnap = await db
      .collection("registration_request")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (requestSnap.empty) {
      return res
        .status(404)
        .json({ message: "No matching registration request found" });
    }

    const doc = requestSnap.docs[0];
    const requestData = doc.data();

    const currentStatus = requestData.status?.toLowerCase();

    if (currentStatus !== "accepted") {
      return res
        .status(400)
        .json({
          message: `Cannot remove vendor. Current status is '${requestData.status || 'undefined'}'. Status must be 'accepted' to remove.`,
          currentStatus: requestData.status
        });
    }

    await doc.ref.update({ status: "removed" });

    const vendorSnap = await db
      .collection("vendors")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!vendorSnap.empty) {
      await vendorSnap.docs[0].ref.update({ status: false });
    }

    res.status(200).json({ message: "Successfully removed vendor" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.use('/api/user', userrouter);
app.use('/api/vendor', vendorrouter);
app.use('/api/event', eventrouter);
app.use('/api/ticket', ticketrouter);
app.use('/api/admin', adminrouter);

// Error handling middleware
app.use((err, req, res, next) => {
  // ...existing code...
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

const PORT = process.env.PORT || 8080;
console.log('About to start Express server...');
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  // ...existing code...
});