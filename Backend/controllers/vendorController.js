const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const path = require("path"); // Added path module for file extensions
const vendor = require("../models/vendorModel");
const admin = require("../models/adminModel");
const { bucket, db } = require("../config/firebase_config");
const { FieldValue } = require("firebase-admin/firestore");

const addvendor = async (req, res) => {
  try {
    console.log("Received Body:", req.body);
    console.log("Received Files:", req.files);

    // Extracting fields from request body (only text data)
    const {
      password,
      email,
      username,
      organisationType,
      organisationName,
      organisationMail,
      organisationContact,
      GSTIN,
      panNumber,
      aadharNumber,
      AccountNumber,
      IFSCNumber,
      lastLogin,
      createdAt,
    } = req.body;

    // Generate a unique authId using uuid
    const authId = uuidv4(); // Generates a unique identifier

    // Hash the password
    const hashedpassword = await bcrypt.hash(password, 10);

    const panFile = req.files.panUpload[0];
    const aadharFile = req.files.aadharUpload[0];
    const bankFile = req.files.bankUpload[0];

    // Upload files to Firebase Storage with improved function
    const panFileUrl = await uploadFileToStorage(panFile, "pan", authId);
    const aadharFileUrl = await uploadFileToStorage(
      aadharFile,
      "aadhar",
      authId
    );
    const bankFileUrl = await uploadFileToStorage(bankFile, "bank", authId);

    // Prepare vendor details for insertion (text data only)
    const vendorDetails = {
      authId, // Automatically generated authId
      password: hashedpassword,
      email,
      username,
      organisationType,
      organisationName,
      GSTIN,
      organisationMail,
      organisationContact,
      panNumber,
      aadharNumber,
      AccountNumber,
      createdAt,
      IFSCNumber,
      lastLogin,
      documents: {
        panUpload: panFileUrl,
        aadharUpload: aadharFileUrl,
        bankUpload: bankFileUrl,
      },
    };

    // Insert new vendor details into the database
    const code = await vendor.insertNewVendor(vendorDetails);

    const requestToAdmin = {
      requestId: uuidv4(),
      username,
      email,
      status: "pending",
      organisationType,
      organisationName,
      GSTIN,
      organisationMail,
      organisationContact,
      panNumber,
      aadharNumber,
      AccountNumber,
      IFSCNumber,
      createdAt,
      lastLogin,
      documents: {
        panUpload: panFileUrl,
        aadharUpload: aadharFileUrl,
        bankUpload: bankFileUrl,
      },
    };

    const codeForVendorRequest = await admin.addRegistrationRequest(
      requestToAdmin
    );

    if (code === 200 && codeForVendorRequest === 200) {
      return res
        .status(201)
        .json({ Message: "New vendor added successfully", authId });
    } else {
      return res.status(500).json({ Message: "Error adding vendor" });
    }
  } catch (err) {
    console.error("Add vendor error:", err);
    res.status(500).json({ Error: err.message || "Internal server error" });
  }
};

const loginvendor = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({ Message: "Username and password are required" });
    }
    
    // Get vendor data from vendors collection
    const userRef = db.collection("vendors").where("username", "==", username);
    const document = await userRef.get();

    if (document.empty) {
      return res.status(401).json({ Message: "User does not exist.  Enter username and password correctly" });
    }

    let userData = null;
    let docId = null;

    document.forEach((doc) => {
      userData = doc.data();
      docId = doc.id;
    });

    if (!userData) {
      return res.status(401).json({ Message: "User does not exist.  Enter the username correctly" });
    }

    // Validate password inputs before bcrypt comparison
    if (!password || !userData.password) {
      return res.status(401).json({ Message: "Invalid credentials.  Please enter valid credentials." });
    }

    // Verify password
    const pwdCheck = await bcrypt.compare(password, userData.password);

    if (!pwdCheck) {
      return res.status(401).json({ Message: "Wrong password.  Please enter the correct password." });
    }

    // Get status from registration_request collection
    const vendorStatus = db.collection("registration_request").where("username", "==", username);
    const vendorDocument = await vendorStatus.get();
    
    let registrationData = null;
    
    if (!vendorDocument.empty) {
      vendorDocument.forEach((doc) => {
        registrationData = doc.data();
      });
    }

    // Check status from registration_request collection
    if (registrationData.status=="pending") {
      return res
        .status(200)
        .json({
          Message: "Pending is still in approval",
          vendorId: docId,
          status: "pending",
        });
    }

    if (registrationData.status=="rejected") {
      return res
        .status(200)
        .json({
          Message: "Your request is rejected by the vendor. Contact vendor for further details",
          vendorId: docId,
          status: "rejected",
        });
    }

    if (registrationData.status === "removed") {
      return res
        .status(200)
        .json({
          Message: "You are removed by vendor. Contact vendor for more details",
          vendorId: docId,
          status: "removed",
        });
    }
if (registrationData.status === "accepted") {
    return res
      .status(200)
      .json({
        Message: "Login successful",
        vendorId: docId,
        status: "accepted",
      });
  } }catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ Error: err.message || "Internal server error" });
  }
};

const lastlogin = async (req, res) => {
  const { username } = req.body;

  try {
    const vendorSnapshot = await db
      .collection("vendors")
      .where("username", "==", username)
      .get();

    if (vendorSnapshot.empty) {
      return res.status(401).json({ Message: "Vendor not found" });
    }

    const vendorDoc = vendorSnapshot.docs[0];

    await vendorDoc.ref.update({
      lastLogin: FieldValue.serverTimestamp(),
    });

    return res.json({
      Message: "Login successful",
      vendorId: vendorDoc.id,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ Message: "Internal server error" });
  }
};

const fetchLastLogin = async (req, res) => {
  console.log('=== fetchLastLogin function called ===');
  const { vendorId } = req.params;
  console.log('Looking for vendor with ID:', vendorId);
  
  try {
    // Use .doc() since vendorId is the document ID, not a field
    const vendorDoc = await db.collection("vendors").doc(vendorId).get();
    
    if (!vendorDoc.exists) {
      console.log('No vendor found with ID:', vendorId);
      return res.status(404).json({ error: "Vendor not found" });
    }

    const vendorData = vendorDoc.data();
    console.log('Vendor data found:', vendorData);
    
    // Since you want lastLogin specifically, extract it
    const lastLogin = vendorData.lastLogin;
    
    res.status(200).json({ 
      lastLogin: lastLogin,
      // You can include other data if needed
      vendorId: vendorId
    });
    
  } catch (err) {
    console.error("Get vendor by ID error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
}

const addOrganizationDetails = async (req, res) => {
  try {
    const { name, type, GSTIN, mailId, contact_number, authId } = req.body;

    if (!authId) {
      return res.status(400).json({ Error: "Missing vendor ID" });
    }

    const vendorRef = db.collection("vendors").doc(authId);
    const vendorDoc = await vendorRef.get();

    if (!vendorDoc.exists) {
      return res.status(404).json({ Error: "Vendor not found" });
    }

    await vendorRef.update({
      organizationDetails: {
        name,
        type,
        GSTIN,
        mailId,
        contact_number,
      },
    });

    res
      .status(200)
      .json({ Message: "Organization details are added to the vendor" });
  } catch (err) {
    console.error("Add organization details error:", err);
    res.status(500).json({ Error: err.message || "Internal server error" });
  }
};

const addDocuments = async (req, res) => {
  try {
    const {
      panCardNumber,
      aadharCardNumber,
      bankAccountNumber,
      IFSC_Code,
      authId,
    } = req.body;

    if (!authId) {
      return res.status(400).json({ Error: "Missing vendor ID" });
    }

    const vendorRef = db.collection("vendors").doc(authId);
    const vendorDoc = await vendorRef.get();

    if (!vendorDoc.exists) {
      return res.status(404).json({ Error: "Vendor not found" });
    }

    await vendorRef.update({
      documents: {
        panCardNumber,
        aadharCardNumber,
        bankAccountNumber,
        IFSC_Code,
      },
    });

    res
      .status(200)
      .json({ Message: "Successfully added the documents for the vendor" });
  } catch (err) {
    console.error("Add documents error:", err);
    res.status(500).json({ Error: err.message || "Internal server error" });
  }
};

const getAllEventStatistics = async (req, res) => {
  try {
    const now = new Date();

    // Get all events
    const eventsSnapshot = await db.collection("events").get();
    const allEventStats = [];

    for (const doc of eventsSnapshot.docs) {
      const eventData = doc.data();
      const eventId = doc.id;
      const eventDate = new Date(eventData.eventDate); // assuming ISO format

      // Determine event status
      const status = eventDate < now ? "completed" : "not completed";

      const price = {
        vip: eventData.Tickets?.vip_ticket_price || 0,
        regular: eventData.Tickets?.regular_ticket_price || 0,
        children: eventData.Tickets?.children_ticket_price || 0,
      };

      const revenue = { vip: 0, regular: 0, children: 0 };
      const tickets_sold = { vip: 0, regular: 0, children: 0 };

      // Get all tickets for this event
      const ticketsSnapshot = await db
        .collection("tickets")
        .where("event_id", "==", eventId)
        .get();

      ticketsSnapshot.forEach((ticketDoc) => {
        const { tickets } = ticketDoc.data();

        if (tickets) {
          tickets_sold.vip += tickets.vip_ticket_count || 0;
          tickets_sold.regular += tickets.regular_ticket_count || 0;
          tickets_sold.children += tickets.children_ticket_count || 0;

          revenue.vip += (tickets.vip_ticket_count || 0) * price.vip;
          revenue.regular +=
            (tickets.regular_ticket_count || 0) * price.regular;
          revenue.children +=
            (tickets.children_ticket_count || 0) * price.children;
        }
      });

      allEventStats.push({
        eventId,
        eventName: eventData.eventName,
        status,
        tickets_sold,
        revenue,
        totalRevenue: revenue.vip + revenue.regular + revenue.children,
      });
    }

    res.status(200).json({ allEventStats });
  } catch (err) {
    console.error("Get all event statistics error:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
};

const getEventStatistics = async (req, res) => {
  try {
    const eventId = req.params.eventId;

    if (!eventId) {
      return res.status(400).json({ message: "Event ID is required" });
    }

    // Fetch event data
    const eventRef = db.collection("events").doc(eventId);
    const eventDoc = await eventRef.get();

    if (!eventDoc.exists) {
      return res.status(404).json({ message: "Event not found" });
    }

    const eventData = eventDoc.data();

    const price = {
      vip: eventData.Tickets?.vip_ticket_price || 0,
      regular: eventData.Tickets?.regular_ticket_price || 0,
      children: eventData.Tickets?.children_ticket_price || 0,
    };

    const revenue = { vip: 0, regular: 0, children: 0 };
    const tickets_sold = { vip: 0, regular: 0, children: 0 };
    const allTickets = []; // To store full ticket data

    const ticketsSnapshot = await db
      .collection("tickets")
      .where("event_id", "==", eventId)
      .get();

    ticketsSnapshot.docs.forEach((doc) => {
      const ticketData = doc.data();
      const { tickets } = ticketData;

      if (tickets) {
        // Update ticket stats with null checks
        tickets_sold.vip += tickets.vip_ticket_count || 0;
        tickets_sold.regular += tickets.regular_ticket_count || 0;
        tickets_sold.children += tickets.children_ticket_count || 0;

        // Update revenue with null checks
        revenue.vip += (tickets.vip_ticket_count || 0) * price.vip;
        revenue.regular += (tickets.regular_ticket_count || 0) * price.regular;
        revenue.children +=
          (tickets.children_ticket_count || 0) * price.children;
      }

      // Push full ticket data (optionally add doc.id)
      allTickets.push({
        ticketId: doc.id,
        ...ticketData,
      });
    });

    res.status(200).json({
      tickets_sold,
      revenue,
      totalRevenue: revenue.vip + revenue.regular + revenue.children,
      allTickets,
    });
  } catch (err) {
    console.error("Get event statistics error:", err);
    res.status(500).json({ error: err.message || "Something went wrong" });
  }
};

const checkVendorEmail = async (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email parameter is required",
      });
    }

    // Query Firestore for vendors with the specified email
    const snapshot = await db
      .collection("vendors")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    // Check if any matching documents were found
    const exists = !snapshot.empty;

    return res.status(200).json({
      success: true,
      exists: exists,
    });
  } catch (err) {
    console.error("Check vendor email error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error while checking email",
      error: err.message || "Internal server error",
    });
  }
};

const getVendorById = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const doc = await db.collection("vendors").doc(vendorId).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Remove sensitive fields before returning
    const vendorData = doc.data();
    if (vendorData.password) {
      delete vendorData.password; // Don't return password hash
    }

    res.status(200).json(vendorData);
  } catch (err) {
    console.error("Get vendor by ID error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

const vendorGetWithPass = async (req, res) => {
  try {
    const vendorId = req.params.vendorId;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const doc = await db.collection("vendors").doc(vendorId).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    const vendorData = doc.data();

    res.status(200).json(vendorData);
  } catch (err) {
    console.error("Get vendor by ID error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
};

const vendorUpdateDetails = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const {
      username,
      organisationContact,
      organisationMail,
      newPassword,
      email, // Extract email for registration_request
    } = req.body;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID is required",
      });
    }

    const vendorRef = db.collection("vendors").doc(vendorId);
    const doc = await vendorRef.get();

    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    const updates = {};

    // Validate username
    if (username !== undefined) {
      if (username.trim() === "") {
        return res.status(400).json({ success: false, message: "Username cannot be empty" });
      }

      const usernameQuery = await db
        .collection("vendors")
        .where("username", "==", username.trim())
        .get();

      const usernameExists = usernameQuery.docs.some((doc) => doc.id !== vendorId);

      if (usernameExists) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }

      updates.username = username.trim();
    }

    // Validate organisationContact
    if (organisationContact !== undefined) {
      if (organisationContact.trim() === "") {
        return res.status(400).json({ success: false, message: "Organization contact cannot be empty" });
      }

      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(organisationContact.trim())) {
        return res.status(400).json({ success: false, message: "Invalid phone number format" });
      }

      updates.organisationContact = organisationContact.trim();
    }

    // Validate organisationMail
    if (organisationMail !== undefined) {
      if (organisationMail.trim() === "") {
        return res.status(400).json({ success: false, message: "Organization email cannot be empty" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(organisationMail.trim())) {
        return res.status(400).json({ success: false, message: "Invalid email format" });
      }

      updates.organisationMail = organisationMail.trim().toLowerCase();
    }

    // Password update
    if (newPassword !== undefined && newPassword.trim() !== "") {
      if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: "Password must be at least 8 characters long" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updates.password = hashedPassword;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid updates provided" });
    }

    updates.updatedAt = new Date();

    // Update vendors document
    await vendorRef.update(updates);

    // ALSO update registration_request if email provided
    if (email) {
      const regQuery = await db
        .collection("registration_request")
        .where("email", "==", email.trim().toLowerCase())
        .get();

      if (!regQuery.empty) {
        const regDocRef = regQuery.docs[0].ref;
        await regDocRef.update(updates); // Apply same updates
      } else {
        console.warn("No registration_request found for email:", email);
      }
    }

    const updatedDoc = await vendorRef.get();
    const updatedVendor = updatedDoc.data();
    delete updatedVendor.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedVendor,
    });
  } catch (error) {
    console.error("Error updating vendor profile:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// Improved file upload function to resolve the socket hang-up error
const uploadFileToStorage = async (file, type, authId) => {
  try {
    // Create a more organized file path with folders
    const fileName = `vendor-documents/${type}/${authId}_${Date.now()}${path.extname(
      file.originalname || ""
    )}`;
    const fileUpload = bucket.file(fileName);

    // Set upload options with metadata
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: file.mimetype,
        // Set predefined ACL during upload instead of making public after
        predefinedAcl: "publicRead",
      },
      resumable: false, // For smaller files, non-resumable uploads can be more reliable
    });

    return new Promise((resolve, reject) => {
      // Handle stream completion
      blobStream.on("finish", async () => {
        try {
          // Generate the public URL without explicitly making it public
          await fileUpload.makePublic();
          const publicUrl = `https://storage.googleapis.com/${
            bucket.name
          }/${encodeURIComponent(fileName)}`;
          resolve(publicUrl);
        } catch (err) {
          console.error("Error generating public URL:", err);
          reject(new Error(`Error generating public URL: ${err.message}`));
        }
      });

      // Handle stream errors
      blobStream.on("error", (err) => {
        console.error("Upload stream error:", err);
        reject(new Error(`Upload failed: ${err.message}`));
      });

      // Set a timeout to prevent hanging connections
      const streamTimeout = setTimeout(() => {
        blobStream.destroy(new Error("Upload timeout after 30 seconds"));
      }, 30000); // 30 second timeout

      // Clear timeout when stream ends
      blobStream.on("end", () => clearTimeout(streamTimeout));

      // Write the file to the stream and end it
      blobStream.end(file.buffer);
    });
  } catch (err) {
    console.error("Error initiating upload:", err);
    throw new Error(`Failed to initiate upload: ${err.message}`);
  }
};



module.exports = {
  addvendor,
  loginvendor,
  addOrganizationDetails,
  addDocuments,
  getAllEventStatistics,
  getEventStatistics,
  getVendorById,
  checkVendorEmail,
  vendorGetWithPass,
  vendorUpdateDetails,
  lastlogin,
  fetchLastLogin
};
