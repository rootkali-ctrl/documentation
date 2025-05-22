const admin = require("../models/adminModel");
const vendor = require("../models/vendorModel");
const { db, bucket } = require("../config/firebase_config");
const { v4: uuidv4 } = require("uuid");

const acceptRegistrationRequest = async (req, res) => {
  try {
    const { email } = req.body; // Get only email from request body

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    // Find the registration request using email
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
    await doc.ref.update({ status: "accepted" });

    const vendorSnap = await db
      .collection("vendors")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!vendorSnap.empty) {
      await vendorSnap.docs[0].ref.update({ status: true });
    }

    res.status(200).json({ message: "Successfully accepted request" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const rejectRegistrationRequest = async (req, res) => {
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

    await requestSnap.docs[0].ref.update({ status: "rejected" });

    const vendorSnap = await db
      .collection("vendors")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!vendorSnap.empty) {
      await vendorSnap.docs[0].ref.delete();
    }

    res.status(200).json({ message: "Successfully rejected the request" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getAllRegistrationRequests = async (req, res) => {
  try {
    const request_snapshot = await db.collection("registration_request").get();
    const registration_requests = request_snapshot.docs.map((doc) => ({
      requestId: doc.id,
      data: { ...doc.data() },
    }));
    res.status(200).json({ registration_requests });
  } catch (err) {
    console.log(err);
    res.status(500).json({ Error: err });
  }
};

const getRequestDetails = async (req, res) => {
  try {
    const requestid = req.params.requestid;
    const request_snapshot = await db
      .collection("registration_request")
      .doc(requestid)
      .get();
    const request_details = request_snapshot.data();
    res.status(200).json({ request_details });
  } catch (err) {
    console.log(err);
    res.status(500).json({ Error: err });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const eventRef = db.collection("events");
    const snapshot = await eventRef.get();
    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json({ events });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const getVendorStatus = async (req, res) => {
  try {
    const { username, email } = req.query;
    const requestSnap = await db
      .collection("registration_request")
      .where("username", "==", username)
      .where("email", "==", email)
      .limit(1)
      .get();

    if (requestSnap.empty) {
      return res
        .status(404)
        .json({ message: "No matching registration request found" });
    }

    const data = requestSnap.docs[0].data();
    res.status(200).json({ status: data.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const removeVendor = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "email is required" });
    }

    const vendorSnap = await db
      .collection("vendors")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (vendorSnap.empty) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const doc = vendorSnap.docs[0];
    await doc.ref.update({ status: "removed" });

    // Optionally update status in 'registration_request' collection to 'removed'
    const requestSnap = await db
      .collection("registration_request")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!requestSnap.empty) {
      await requestSnap.docs[0].ref.update({ status: "removed" });
    }

    return res.status(200).json({ message: "Vendor removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

const addBanner = async (req, res) => {
  try {
    const bannerUrls = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileName = `Admin Banner/banner_${Date.now()}_${
          file.originalname
        }`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        await new Promise((resolve, reject) => {
          blobStream.on("error", reject);
          blobStream.on("finish", async () => {
            try {
              await fileUpload.makePublic();
              const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
              bannerUrls.push(publicUrl);
              resolve();
            } catch (err) {
              reject(err);
            }
          });

          blobStream.end(file.buffer);
        });
      }
    }

    // Store each banner URL in Firestore
    for (const url of bannerUrls) {
      await db.collection("hero_banners").add({
        url,
        uploadedAt: new Date(),
      });
    }

    return res.status(201).json({
      message: "Admin banners uploaded successfully",
      bannerUrls,
    });
  } catch (err) {
    console.log("Banner upload error:", err);
    return res.status(500).json({ error: err.message });
  }
};

const saveBannerUrls = async (req, res) => {
  try {
    const { bannerUrls } = req.body;
    if (!Array.isArray(bannerUrls)) {
      return res.status(400).json({ error: "Invalid bannerUrls" });
    }

    for (const url of bannerUrls) {
      await db.collection("hero_banners").add({
        url,
        uploadedAt: new Date(),
      });
    }

    return res.status(201).json({
      message: "Banner URLs saved successfully",
    });
  } catch (err) {
    console.log("Banner URL save error:", err);
    return res.status(500).json({ error: err.message });
  }
};

const getRecentBanners = async (req, res) => {
  try {
    const [files] = await bucket.getFiles({ prefix: "bannerImages/hero" }); // Adjust folder name if needed

    const sortedFiles = files
      .filter(
        (file) =>
          file.name.endsWith(".jpg") ||
          file.name.endsWith(".png") ||
          file.name.endsWith(".avif")
      )
      .sort((a, b) => b.metadata.updated.localeCompare(a.metadata.updated)) // descending by updated time
      .slice(0, 4);

    const signedUrls = await Promise.all(
      sortedFiles.map((file) =>
        file
          .getSignedUrl({
            action: "read",
            expires: "03-09-2030",
          })
          .then((urls) => urls[0])
      )
    );

    res.status(200).json({ banners: signedUrls });
  } catch (err) {
    console.error("Error fetching banners:", err);
    res.status(500).json({ error: "Failed to fetch banners" });
  }
};

const deleteBannerFromStorage = async (downloadUrl) => {
  try {
    const url = new URL(downloadUrl);
    console.log("Parsed URL:", url.href);

    const pathname = url.pathname; // e.g., /bucket-name/bannerImages/hero/filename.avif
    console.log("URL pathname:", pathname);

    const parts = pathname.split("/");

    // Make sure it has at least: [ '', 'bucket', 'folder', 'file' ]
    if (parts.length < 3) {
      throw new Error("Invalid path structure in URL");
    }
    // Remove bucket name (2nd element), get the rest
    const filePath = parts.slice(2).join("/"); // removes leading slash and bucket name
    console.log("Decoded file path to delete:", filePath);

    await bucket.file(filePath).delete();
    console.log("Successfully deleted:", filePath);
  } catch (error) {
    console.error("Delete error (storage):", error.message);
    throw error;
  }
};

const deleteBanner = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    // 1. Delete from Firebase Storage
    await deleteBannerFromStorage(url);

    return res
      .status(200)
      .json({ message: " Banner deleted successfully from Firebase Storage" });
  } catch (err) {
    console.error(" Backend deletion failed:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to delete banner from Firebase Storage" });
  }
};

const addBannerInline = async (req, res) => {
  try {
    const { redirectUrls } = req.body; // Get redirect URLs from request body
    const bannerUrlsInline = [];

    if (req.files && req.files.length > 0) {
      for (const [index, file] of req.files.entries()) {
        const fileName = `Admin Banner/banner_${Date.now()}_${
          file.originalname
        }`;
        const fileUpload = bucket.file(fileName);

        const blobStream = fileUpload.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        await new Promise((resolve, reject) => {
          blobStream.on("error", reject);
          blobStream.on("finish", async () => {
            try {
              await fileUpload.makePublic();
              const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
              bannerUrlsInline.push({
                imageUrl: publicUrl,
                redirectUrl: redirectUrls ? redirectUrls[index] : "", // Add redirect URL
              });
              resolve();
            } catch (err) {
              reject(err);
            }
          });

          blobStream.end(file.buffer);
        });
      }
    }

    return res.status(201).json({
      message: "Admin banners uploaded successfully",
      bannerUrlsInline,
    });
  } catch (err) {
    console.log("Banner upload error:", err);
    return res.status(500).json({ error: err.message });
  }
};

const getRecentBannersInline = async (req, res) => {
  try {
    // First try to get from firestore
    const inlineBannerRef = db.collection("inline_banners");
    const snapshot = await inlineBannerRef
      .orderBy("uploadedAt", "desc")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      const banners = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        banners.push({
          imageUrl: data.imageUrl,
          redirectUrl: data.redirectUrl || "",
          id: doc.id,
        });
      });

      return res.status(200).json({ banners });
    }

    // Fallback to storage if no banners in firestore
    const [files] = await bucket.getFiles({ prefix: "bannerImages/inline" });

    if (files.length === 0) {
      return res.status(200).json({ banners: [] });
    }

    const sortedFiles = files
      .filter(
        (file) =>
          file.name.endsWith(".jpg") ||
          file.name.endsWith(".png") ||
          file.name.endsWith(".avif")
      )
      .sort((a, b) => b.metadata.updated.localeCompare(a.metadata.updated)) // descending by updated time
      .slice(0, 1); // Only get the most recent one

    const signedUrls = await Promise.all(
      sortedFiles.map((file) =>
        file
          .getSignedUrl({
            action: "read",
            expires: "03-09-2030",
          })
          .then((urls) => ({
            imageUrl: urls[0],
            redirectUrl: "", // No redirect URL available for storage-only entries
          }))
      )
    );

    res.status(200).json({ banners: signedUrls });
  } catch (err) {
    console.error("Error fetching inline banners:", err);
    res.status(500).json({ error: "Failed to fetch inline banners" });
  }
};

const deleteBannerFromStorageInline = async (url) => {
  try {
    const urlObj = new URL(url);
    console.log("Parsed URL:", urlObj.href);
    const pathname = urlObj.pathname;
    console.log("Path name:", pathname) 
    const encodedFilePath = pathname.split("/"); 

    if (!encodedFilePath) {
      throw new Error("Invalid Firebase Storage URL");
    }
    const filepath = encodedFilePath.slice(2).join("/");
    console.log("Deleted file path:", filepath)
    
    await bucket.file(filepath).delete();

    console.log("Successfully deleted from storage:", filepath);
  } catch (err) {
    console.error("Delete error (storage):", err.message);
    throw new Error("Backend deletion failed: " + err.message);
  }
};



// Updated deleteBannerInline function
const deleteBannerInline = async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: "No URL provided" });
  }

  try {
    // 1. Delete from Firebase Storage if it's a storage URL
      await deleteBannerFromStorageInline(url);
    

    // 2. Delete from Firestore
    const inlineBannerRef = db.collection("inline_banners");
    const snapshot = await inlineBannerRef.where("imageUrl", "==", url).get();

    if (snapshot.empty) {
      console.warn("No matching inline banner document found for URL:", url);
    } else {
      const batch = db.batch();
      snapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return res
      .status(200)
      .json({ message: "Inline banner deleted successfully" });
  } catch (err) {
    console.error("Inline banner deletion failed:", err.message);
    return res
      .status(500)
      .json({ error: "Failed to delete inline banner", details: err.message });
  }
};

const saveBannerUrlsInline = async (req, res) => {
  try {
    const { bannerUrls } = req.body;
    if (!Array.isArray(bannerUrls)) {
      return res.status(400).json({ error: "Invalid bannerUrls" });
    }

    // Delete all existing inline banners first (since we only want 1)
    const inlineBannerRef = db.collection("inline_banners");
    const existingBanners = await inlineBannerRef.get();

    // Delete each existing document in a batch
    const batch = db.batch();
    existingBanners.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();

    // Now add the new banner(s) - typically just one
    for (const bannerData of bannerUrls) {
      await inlineBannerRef.add({
        imageUrl: bannerData.imageUrl,
        redirectUrl: bannerData.redirectUrl || "",
        uploadedAt: new Date(),
      });
    }

    return res.status(201).json({
      message: "Inline banner URLs saved successfully",
    });
  } catch (err) {
    console.log("Inline banner URL save error:", err);
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  acceptRegistrationRequest,
  rejectRegistrationRequest,
  getAllRegistrationRequests,
  getRequestDetails,
  getVendorStatus,
  getAllEvents,
  removeVendor,
  addBanner,
  saveBannerUrls,
  getRecentBanners,
  deleteBanner,
  addBannerInline,
  getRecentBannersInline,
  deleteBannerInline,
  saveBannerUrlsInline,
};
