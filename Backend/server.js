const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const { db } = require("./config/firebase_config");
const userrouter = require('./routers/userRouter');
const vendorrouter = require('./routers/vendorRouter');
const eventrouter = require('./routers/eventRouter');
const ticketrouter = require('./routers/ticketRouter');
const adminrouter = require('./routers/adminRouter');

require("dotenv").config();

const app = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Nodemailer Transporter Setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Error verifying transporter", error);
  } else {
    console.log("Transporter is ready to send emails");
  }
});

// Store transporter globally if needed
app.locals.emailTransporter = transporter;

// Email Template Generator Function
const generateEmailTemplate = (vendorName, status) => {
  const name = vendorName || "Vendor";
  let subject, text, html;

  switch (status) {
    case "accepted":
      subject = "TicketB Vendor Registration Approved";
      text = `Dear ${name},\n\nCongratulations! Your vendor registration has been approved.\n\nThank you for registering with TicketB.\n\nBest regards,\nTicketB Team`;
      html = `<h2>Hello ${name},</h2><p>Congratulations! Your vendor registration has been <strong>approved</strong>.</p><p>Thank you for registering with TicketB.</p><p>Best regards,<br/>TicketB Team</p>`;
      break;
    case "rejected":
      subject = "TicketB Vendor Registration Rejected";
      text = `Dear ${name},\n\nWe regret to inform you that your vendor registration has been rejected.\n\nThank you for your interest in TicketB.\n\nBest regards,\nTicketB Team`;
      html = `<h2>Hello ${name},</h2><p>We regret to inform you that your vendor registration has been <strong>rejected</strong>.</p><p>Thank you for your interest in TicketB.</p><p>Best regards,<br/>TicketB Team</p>`;
      break;
    case "removed":
      subject = "TicketB Vendor Account Removed";
      text = `Dear ${name},\n\nYour vendor account has been removed from our platform.\n\nIf you believe this is a mistake, please contact support.\n\nBest regards,\nTicketB Team`;
      html = `<h2>Hello ${name},</h2><p>Your vendor account has been <strong>removed</strong> from our platform.</p><p>If you believe this is a mistake, please contact support.</p><p>Best regards,<br/>TicketB Team</p>`;
      break;
    default:
      subject = "TicketB Vendor Registration Update";
      text = `Dear ${name},\n\nThere has been an update regarding your vendor registration.\n\nBest regards,\nTicketB Team`;
      html = `<h2>Hello ${name},</h2><p>There has been an update regarding your vendor registration.</p><p>Best regards,<br/>TicketB Team</p>`;
  }

  return { subject, text, html };
};

// Send Email API
app.post("/api/send-email", async (req, res) => {
  const { to, subject, text, html } = req.body;

  if (!to || (!subject && !text && !html)) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    await transporter.sendMail({
      from: `"TicketB" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html
    });

    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// Admin Send Email Based on Status
app.post("/api/admin/send-email", async (req, res) => {
  const { to, vendorName, status, subject, text, html } = req.body;

  if (!to) {
    return res.status(400).json({ success: false, error: "Missing required fields" });
  }

  try {
    let emailContent;

    if (status) {
      emailContent = generateEmailTemplate(vendorName, status);
    } else if (subject && text && html) {
      emailContent = { subject, text, html };
    } else {
      return res.status(400).json({ success: false, error: "Invalid email data" });
    }

    await transporter.sendMail({
      from: `"TicketB Admin" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html
    });

    res.status(200).json({ success: true, message: `Email sent successfully for status: ${status || "custom"}` });
  } catch (error) {
    console.error("Error sending admin email:", error);
    res.status(500).json({ success: false, error: "Failed to send email" });
  }
});

// Admin Remove Vendor API
app.delete("/api/admin/removevendor", async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const querySnapshot = await db.collection("registration_request").where("email", "==", email).get();

    if (querySnapshot.empty) {
      return res.status(404).json({ message: "No registration request found with the provided email" });
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    if (data.status.toLowerCase() !== "accepted") {
      return res.status(400).json({ message: `Cannot remove vendor. Status is '${data.status}'. It must be 'accepted'.` });
    }

    await doc.ref.update({ status: "removed" });

    const vendorSnapshot = await db.collection("vendors").where("email", "==", email).get();
    if (!vendorSnapshot.empty) {
      const vendorDoc = vendorSnapshot.docs[0];
      await vendorDoc.ref.update({ status: false });
    }

    res.status(200).json({ message: "Vendor removed successfully" });
  } catch (error) {
    console.error("Error removing vendor:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mount all routers
app.use("/api/user", userrouter);
app.use("/api/vendor", vendorrouter);
app.use("/api/event", eventrouter);
app.use("/api/ticket", ticketrouter);
app.use("/api/admin", adminrouter);

// Default Routes
app.get("/", (req, res) => {
  res.send("Welcome to the TicketB backend API.");
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unexpected server error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Server Listen
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
