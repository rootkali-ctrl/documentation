import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Article as ArticleIcon,
  Settings as SettingsIcon,
  ContactPage as ContactPageIcon,
  Event as EventIcon,
  Add,
  Delete,
  ArrowBackIos,
  ArrowForwardIos,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth } from "../../firebase/firebase_config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const sidebarItems = [
  {
    name: "Dashboard",
    icon: <TrendingUpIcon />,
    active: false,
    path: "/admin/dashboardupcoming",
  },
  {
    name: "Users",
    icon: <GroupIcon />,
    active: false,
    path: "/admin/userpage",
  },
  {
    name: "Posts",
    icon: <ArticleIcon />,
    active: true,
    path: "/admin/postpage",
  },
  {
    name: "Vendors",
    icon: <SettingsIcon />,
    active: false,
    path: "/admin/loginsettings",
  },
  {
    name: "Contact",
    icon: <ContactPageIcon />,
    active: false,
    path: "/admin/contactpage",
  },
  {
    name: "Events",
    icon: <EventIcon />,
    active: false,
    path: "/admin/eventmanagement",
  },
];

const PostPage = () => {
  const MAX_VISIBLE = 1;
  const [heroBanners, setHeroBanners] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const storage = getStorage();
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [lastLogin, setLastLogin] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Please log in to access this page.");
        setLoading(false);
        return;
      }

      try {
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          setError("Admin profile not found.");
          setLoading(false);
          return;
        }

        const data = adminDoc.data();
        setLastLogin(data.lastlogin || "");
      } catch (err) {
        setError("Failed to load admin details: " + err.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatLastLogin = (timestamp) => {
    if (!timestamp) return "Never";
    try {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch (err) {
      return "Invalid date";
    }
  };

  // Extract filename from Firebase Storage URL
  const getFileNameFromUrl = (url) => {
    try {
      const decodedUrl = decodeURIComponent(url);
      const matches = decodedUrl.match(/bannerImages%2Fhero%2F([^?]+)/);
      return matches ? matches[1] : null;
    } catch (err) {
      console.error("Error extracting filename:", err);
      return null;
    }
  };

  const handleDelete = async (indexToDelete) => {
    const banner = heroBanners[indexToDelete];

    // If banner is not uploaded yet, remove it locally and exit
    if (!banner.isUploaded) {
      setHeroBanners((prev) => prev.filter((_, idx) => idx !== indexToDelete));
      return;
    }

    setLoading(true);
    try {
      // Extract filename from URL and delete from Firebase Storage
      const fileName = getFileNameFromUrl(banner.url);
      if (fileName) {
        const fileRef = ref(storage, `bannerImages/hero/${fileName}`);
        await deleteObject(fileRef);
        console.log("Deleted from Firebase Storage:", fileName);
      }

      // Delete from backend database
      const res = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/banners/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: banner.url }),
        }
      );

      // Log the response for debugging
      console.log("Backend response status:", res.status);
      const responseData = await res.json().catch(() => null);
      console.log("Backend response data:", responseData);

      if (!res.ok) {
        throw new Error(
          `Failed to delete from backend: ${res.status} - ${
            responseData?.message || res.statusText
          }`
        );
      }

      setSuccessMessage("Banner deleted successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Delete failed", error);
      setError("Error deleting banner: " + error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
      // Always remove from local state
      setHeroBanners((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    }
  };

  const handleAddBanner = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size should be less than 5MB");
      setTimeout(() => setError(null), 3000);
      return;
    }

    const newBanner = {
      file,
      preview: URL.createObjectURL(file),
      isUploaded: false,
    };

    setHeroBanners((prev) => [...prev, newBanner]);
  };

  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        // Fetch hero banners
        const heroRes = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/admin/banners/recent`
        );

        if (!heroRes.ok) {
          throw new Error("Failed to fetch hero banners");
        }

        const heroData = await heroRes.json();

        const normalizedHero = heroData.banners.map((url, index) => ({
          id: index,
          url,
          preview: url,
          isUploaded: true,
        }));
        setHeroBanners(normalizedHero);
      } catch (error) {
        console.error("Failed to fetch banners:", error);
        setError("Failed to load banners: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, []);

  const handleUploadToBackend = async () => {
    const unsavedBanners = heroBanners.filter((b) => !b.isUploaded);

    if (unsavedBanners.length === 0) {
      setError("No new banners to upload.");
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      setLoading(true);
      const uploadedUrls = [];

      for (const banner of unsavedBanners) {
        const fileId = uuidv4();
        const fileExtension = banner.file.name.split(".").pop();
        const fileName = `${fileId}.${fileExtension}`;

        // Store in bannerImages/hero folder
        const folderPath = `bannerImages/hero`;
        const storageRef = ref(storage, `${folderPath}/${fileName}`);

        console.log("Uploading to:", `${folderPath}/${fileName}`);

        // Upload to Firebase Storage
        await uploadBytes(storageRef, banner.file);
        const downloadURL = await getDownloadURL(storageRef);

        console.log("Upload successful, URL:", downloadURL);
        uploadedUrls.push(downloadURL);
      }

      // Send URLs to backend
      const response = await fetch(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/save-banner-urls`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bannerUrls: uploadedUrls }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload to backend");
      }

      // Mark all banners as uploaded
      setHeroBanners((prev) =>
        prev.map((b) =>
          b.isUploaded
            ? b
            : { ...b, isUploaded: true, url: uploadedUrls.shift() }
        )
      );

      setSuccessMessage("Banners uploaded successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      console.error("Upload error:", error);
      setError("Failed to upload banners: " + error.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box height="100vh" display="flex" flexDirection="column" bgcolor="#faf9fb">
      {/* Top Bar */}
      <Box
        height={89}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={5}
        py={2}
        borderBottom="1px solid #ddd"
        bgcolor="#f9fafb"
      >
        <Typography variant="h4">
          <Box component="span" fontWeight="bold" color="#19aedc">
            ticketb
          </Box>
          <Box component="span" fontWeight="bold" color="black">
            {" "}
            admin
          </Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>
          Last login at{" "}
          {lastLogin ? formatLastLogin(lastLogin) : "May 13, 2025 02:46 PM"}
        </Typography>
      </Box>

      {/* Body */}
      <Box display="flex" flex={1}>
        {/* Sidebar */}
        <Box
          width={276}
          flexShrink={0}
          bgcolor="#f9fafb"
          py={10}
          px={3}
          boxShadow={3}
          position="sticky"
          top={0}
          height="90vh"
          overflow="auto"
        >
          {sidebarItems.map((item) => (
            <Button
              key={item.name}
              onClick={() => (window.location.href = item.path)}
              variant={item.active ? "contained" : "outlined"}
              fullWidth
              sx={{
                justifyContent: "flex-start",
                my: 2,
                paddingY: 2,
                borderRadius: "10px",
                borderColor: item.active ? "#19aedc" : "#ddd",
                bgcolor: item.active ? "#e3f2fd" : "white",
                color: item.active ? "#19aedc" : "black",
                textTransform: "none",
                fontWeight: item.active ? "bold" : "normal",
                gap: 2,
                boxShadow: 1,
              }}
              startIcon={item.icon}
            >
              {item.name}
            </Button>
          ))}
        </Box>

        {/* Main Content */}
        <Box
          flex={1}
          px={5}
          py={4}
          overflow="auto"
          maxHeight="calc(100vh - 89px)"
        >
          {loading && (
            <Box
              position="fixed"
              top="50%"
              left="50%"
              sx={{ transform: "translate(-50%, -50%)", zIndex: 9999 }}
            >
              <CircularProgress color="primary" />
            </Box>
          )}

          {/* Success Message */}
          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage("")}>
              {successMessage}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Hero Banners Section */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" fontWeight="bold">
              Hero Banners
            </Typography>
            <Button
              component="label"
              variant="contained"
              startIcon={<Add />}
              sx={{ bgcolor: "#19aedc", textTransform: "none" }}
              disabled={loading}
            >
              Add Banner
              <input
                type="file"
                hidden
                onChange={handleAddBanner}
                accept="image/*"
              />
            </Button>
          </Stack>

          <Box
            position="relative"
            borderRadius={2}
            overflow="hidden"
            bgcolor="white"
            boxShadow={1}
            px={3}
            py={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              {startIndex > 0 && (
                <IconButton
                  onClick={() => setStartIndex(startIndex - 1)}
                  disabled={loading}
                >
                  <ArrowBackIos />
                </IconButton>
              )}

              {heroBanners
                .slice(startIndex, startIndex + 1)
                .map((banner, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: "relative",
                      width: "100%",
                      aspectRatio: "16/9",
                      borderRadius: 2,
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={banner.preview}
                      alt={`hero-banner-${index}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: 10,
                      }}
                    />

                    <IconButton
                      sx={{
                        bgcolor: "#fff",
                        position: "absolute",
                        top: 8,
                        right: 8,
                      }}
                      onClick={() => {
                        setDeleteIndex(index + startIndex);
                        setConfirmOpen(true);
                      }}
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                ))}

              {heroBanners.length > startIndex + MAX_VISIBLE && (
                <IconButton
                  onClick={() => setStartIndex(startIndex + 1)}
                  disabled={loading}
                >
                  <ArrowForwardIos />
                </IconButton>
              )}
            </Stack>

            {/* Dot Indicators */}
            <Stack direction="row" justifyContent="center" mt={2} spacing={1}>
              {heroBanners.map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: i === startIndex ? "#19aedc" : "grey.400",
                    cursor: "pointer",
                  }}
                  onClick={() => setStartIndex(i)}
                />
              ))}
            </Stack>

            <Box
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                sx={{
                  ml: 2,
                  textTransform: "none",
                  bgcolor: "#19aedc",
                  color: "white",
                  border: "none",
                }}
                onClick={handleUploadToBackend}
                disabled={loading || heroBanners.length === 0}
              >
                Save changes
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Confirmation Dialog for Hero Banner Delete */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this banner? This
            action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmOpen(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              handleDelete(deleteIndex);
              setConfirmOpen(false);
            }}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PostPage;