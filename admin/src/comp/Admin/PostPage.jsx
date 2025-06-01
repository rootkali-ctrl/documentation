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
  Paper,
  TextField,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Article as ArticleIcon,
  Settings as SettingsIcon,
  ContactPage as ContactPageIcon,
  Event as EventIcon,
  Add,
  Edit,
  Delete,
  ArrowBackIos,
  ArrowForwardIos,
  Link as LinkIcon,
} from "@mui/icons-material";
import { v4 as uuidv4 } from "uuid";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
    name: "Login Settings",
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
  const [inlineBanners, setInlineBanners] = useState([]);
  const [startIndex, setStartIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const storage = getStorage();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [deleteIndexInline, setDeleteIndexInline] = useState(null);
  const [openDeleteDialogInline, setOpenDeleteDialogInline] = useState(false);
  const [openUrlDialog, setOpenUrlDialog] = useState(false);
  const [currentInlineBannerIndex, setCurrentInlineBannerIndex] =
    useState(null);
  const [bannerUrl, setBannerUrl] = useState("");

  const handleDelete = async (indexToDelete) => {
    const banner = heroBanners[indexToDelete];

    // If banner is not uploaded yet, remove it locally and exit
    if (!banner.isUploaded) {
      setHeroBanners((prev) => prev.filter((_, idx) => idx !== indexToDelete));
      return;
    }

    setLoading(true);
    try {
      // Banner was uploaded – delete from backend (includes storage)
      const res = await fetch(
        `${REACT_APP_API_BASE_URL}/api/admin/banners/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: banner.url }),
        }
      );

      if (!res.ok) throw new Error("Failed to delete from backend");
    } catch (error) {
      console.error("Delete failed", error);
      alert("Error deleting banner from backend.");
    } finally {
      setLoading(false);
      // Always remove from local state
      setHeroBanners((prev) => prev.filter((_, idx) => idx !== indexToDelete));
    }
  };

  const handleAddBanner = (bannerType) => (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newBanner = {
      file, // store raw File object
      preview: URL.createObjectURL(file),
      isUploaded: false,
    };

    if (bannerType === "hero") {
      setHeroBanners((prev) => [...prev, newBanner]);
    }
  };


  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // Fetch hero banners
        const heroRes = await fetch(
          `${REACT_APP_API_BASE_URL}/api/admin/banners/recent`
        );
        const heroData = await heroRes.json();

        const normalizedHero = heroData.banners.map((url, index) => ({
          id: index,
          url,
          preview: url,
          isUploaded: true,
        }));
        setHeroBanners(normalizedHero);
        // console.log(items.redirectUrl)

        // Fetch inline banners
        const inlineRes = await fetch(
          `${REACT_APP_API_BASE_URL}/api/admin/banners/recent-inline`
        );
        const inlineData = await inlineRes.json();

        // Handle the new structure where we get objects with imageUrl and redirectUrl
        const normalizedInline = inlineData.banners.map((item, index) => ({
          id: index,
          url: item.imageUrl || item, // Handle both old and new format
          redirectUrl: item.redirectUrl || "", // Handle both old and new format
          preview: item.imageUrl || item, // Handle both old and new format
          isUploaded: true,
        }));
        setInlineBanners(normalizedInline);
      } catch (error) {
        console.error("Failed to fetch banners:", error);
      }
    };

    fetchBanners();
  }, []);

  const handleUploadToBackend = async () => {
    const unsavedBanners = heroBanners.filter((b) => !b.isUploaded);

    if (unsavedBanners.length === 0) {
      alert("No new banners to upload.");
      return;
    }

    try {
      setLoading(true);

      const uploadedUrls = [];

      for (const banner of unsavedBanners) {
        const fileId = uuidv4();
        const fileExtension = banner.file.name.split(".").pop();
        const fileName = `${fileId}.${fileExtension}`;
        const folderPath = `bannerImages/hero`;
        const storageRef = ref(storage, `${folderPath}/${fileName}`);

        // Upload to Firebase Storage
        await uploadBytes(storageRef, banner.file);
        const downloadURL = await getDownloadURL(storageRef);
        uploadedUrls.push(downloadURL);
      }

      // Send URLs to backend
      const response = await fetch(
        `${REACT_APP_API_BASE_URL}/api/admin/save-banner-urls`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bannerUrls: uploadedUrls }),
        }
      );

      if (!response.ok) throw new Error("Failed to upload to backend");

      // Mark all banners as uploaded
      setHeroBanners((prev) =>
        prev.map((b) =>
          b.isUploaded
            ? b
            : { ...b, isUploaded: true, url: uploadedUrls.shift() }
        )
      );

      alert("Banners uploaded successfully to backend!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload banners.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBannerInline = (bannerType) => (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newBanner = {
      file, // store raw File object
      preview: URL.createObjectURL(file),
      isUploaded: false,
      redirectUrl: "", // Initialize with empty redirect URL
    };

    if (bannerType === "inline") {
      // Replace any existing banners with the new one
      setInlineBanners([newBanner]);

      // Open the URL dialog for the newly added banner
      setCurrentInlineBannerIndex(0);
      setBannerUrl("");
      setOpenUrlDialog(true);
      console.log(inlineBanners)
    }
  };


  const handleDeleteInline = async (indexToDelete) => {
  const banner = inlineBanners[indexToDelete];

  // If banner is not uploaded yet, remove it locally and exit
  if (!banner.isUploaded) {
    setInlineBanners((prev) =>
      prev.filter((_, idx) => idx !== indexToDelete)
    );
    return;
  }
 console.log("Deleting inline banner with URL:", banner.url);
  setLoading(true);
  try {
   

    // Banner was uploaded – delete from backend (includes storage)
    const res = await fetch(
      `${REACT_APP_API_BASE_URL}/api/admin/banners-delete-inline`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: banner.url }),
      }
    );

    if (!res.ok) throw new Error("Failed to delete from backend");
  } catch (error) {
    console.error("Delete failed", error);
    alert("Error deleting banner from backend.");
  } finally {
    setLoading(false);
    // Always remove from local state
    setInlineBanners((prev) =>
      prev.filter((_, idx) => idx !== indexToDelete)
    );
  }
};

  
  const handleEditUrl = (index) => {
    setCurrentInlineBannerIndex(index);
    setBannerUrl(inlineBanners[index].redirectUrl || "");
    setOpenUrlDialog(true);
  };

  const handleSaveUrl = () => {
    setInlineBanners((prev) =>
      prev.map((banner, index) =>
        index === currentInlineBannerIndex
          ? { ...banner, redirectUrl: bannerUrl }
          : banner
      )
    );
    setOpenUrlDialog(false);
  };

  const handleUploadToBackendInline = async () => {
    if (!window.confirm("Are you sure you want to save these changes?")) {
      return;
    }

    const unsavedBanners = inlineBanners.filter((b) => !b.isUploaded);

    if (unsavedBanners.length === 0) {
      // If all banners are already uploaded, just update their redirect URLs
      if (inlineBanners.length > 0) {
        try {
          setLoading(true);
          const bannerData = inlineBanners.map((banner) => ({
            imageUrl: banner.url,
            redirectUrl: banner.redirectUrl || "",
          }));
          const response = await fetch(
            `${REACT_APP_API_BASE_URL}/api/admin/save-banner-urls-inline`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ bannerUrls: bannerData }),
            }
          );

          if (!response.ok) throw new Error("Failed to update banner URLs");

          alert("Banner redirect URL updated successfully!");

        } catch (error) {
          console.error("Update error:", error);
          alert("Failed to update banner redirect URL.");
        } finally {
          setLoading(false);
        }
      } else {
        alert("No banner to update.");
      }
      return;
    }

    try {
      setLoading(true);

      const uploadedData = [];

      for (const banner of unsavedBanners) {
        const fileId = uuidv4();
        const fileExtension = banner.file.name.split(".").pop();
        const fileName = `${fileId}.${fileExtension}`;
        const folderPath = `bannerImages/inline`;
        const storageRef = ref(storage, `${folderPath}/${fileName}`);

        // Upload to Firebase Storage
        await uploadBytes(storageRef, banner.file);
        const downloadURL = await getDownloadURL(storageRef);

        // Store both image URL and redirect URL
        uploadedData.push({
          imageUrl: downloadURL,
          redirectUrl: banner.redirectUrl || "",
        });
      }

      // Include existing uploaded banners in the payload
      inlineBanners
        .filter((b) => b.isUploaded)
        .forEach((banner) => {
          uploadedData.push({
            imageUrl: banner.url,
            redirectUrl: banner.redirectUrl || "",
          });
        });

      // Send URLs to backend - limit to only the first/latest banner
      const response = await fetch(
        `${REACT_APP_API_BASE_URL}/api/admin/save-banner-urls-inline`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bannerUrls: uploadedData.slice(0, 1) }),
        }
      );

      if (!response.ok) throw new Error("Failed to upload to backend");

      // Mark all banners as uploaded and update their URLs
      setInlineBanners((prev) => {
        const updatedBanners = [];
        let uploadedIndex = 0;

        for (const banner of prev) {
          if (banner.isUploaded) {
            updatedBanners.push(banner);
          } else {
            // For not yet uploaded banners, update with new URL from server
            const uploadedItem = uploadedData[uploadedIndex++];
            updatedBanners.push({
              ...banner,
              isUploaded: true,
              url: uploadedItem.imageUrl,
              redirectUrl: uploadedItem.redirectUrl,
            });
          }
        }

        // Enforce the limit of 1 banner
        return updatedBanners.slice(0, 1);
      });

      alert("Banner uploaded successfully to backend!");
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload banner.");
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
          Last login at 7th Oct 2025 13:00
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
              sx={{ transform: "translate(-50%, -50%)" }}
            >
              <CircularProgress color="primary" />
            </Box>
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
                onChange={handleAddBanner("hero")}
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

          {/* Modified Component for Inline Banner Section */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mt={6}
            mb={2}
          >
            <Typography variant="h6" fontWeight="bold">
              Inline Banner
            </Typography>
            <Button
              component="label"
              variant="contained"
              startIcon={<Add />}
              sx={{ bgcolor: "#19aedc", textTransform: "none" }}
              disabled={loading || inlineBanners.length >= 1} // Disable if loading or 1 image already exists
            >
              {inlineBanners.length ? "Replace Banner" : "Add Banner"}
              <input
                type="file"
                hidden
                onChange={handleAddBannerInline("inline")}
                accept="image/*"
              />
            </Button>
          </Stack>

          <Box
            borderRadius={2}
            overflow="hidden"
            bgcolor="white"
            boxShadow={1}
            px={3}
            py={2}
          >
            {inlineBanners.length > 0 ? (
              <Box sx={{ position: "relative", width: "100%" }}>
                <Paper
                  elevation={3}
                  sx={{
                    position: "relative",
                    width: "100%",
                    aspectRatio: "16/9",
                    borderRadius: 2,
                    overflow: "hidden",
                    p: 0,
                  }}
                >
                  <img
                    src={
                      inlineBanners[0].isUploaded
                        ? inlineBanners[0].url
                        : inlineBanners[0].preview
                    }
                    alt="inline-banner"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      borderRadius: 10,
                    }}
                  />
                  <Box
                    position="absolute"
                    bottom={10}
                    right={10}
                    display="flex"
                  >
                    <IconButton
                      sx={{
                        bgcolor: "#fff",
                        cursor: "pointer",
                        mr: 1,
                      }}
                      onClick={() => handleEditUrl(0)}
                      disabled={loading}
                    >
                      <LinkIcon />
                    </IconButton>
                    <IconButton
                      sx={{ bgcolor: "#fff", cursor: "pointer" }}
                      onClick={() => {
                        setDeleteIndexInline(0);
                        setOpenDeleteDialogInline(true);
                      }}
                      disabled={loading}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                  <Box
                    position="absolute"
                    bottom={10}
                    left={10}
                    bgcolor="rgba(255,255,255,0.8)"
                    px={2}
                    py={1}
                    borderRadius={1}
                  >
                    <Typography noWrap sx={{ maxWidth: 250 }}>
                      {inlineBanners[0].redirectUrl
                        ? inlineBanners[0].redirectUrl
                        : "No URL set"}
                    </Typography>
                  </Box>
                </Paper>
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  No inline banner added yet. Click "Add Banner" to upload.
                </Typography>
              </Box>
            )}
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
                  mt: 2,
                  textTransform: "none",
                  bgcolor: "#19aedc",
                  color: "white",
                  border: "none",
                }}
                onClick={handleUploadToBackendInline}
                disabled={loading || inlineBanners.length === 0}
              >
                Save changes
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* URL Dialog */}
      <Dialog open={openUrlDialog} onClose={() => setOpenUrlDialog(false)}>
        <DialogTitle>Set Redirect URL</DialogTitle>
        <DialogContent>
          <DialogContentText mb={2}>
            Enter the URL where users will be redirected when they click on this
            banner.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="url"
            label="Redirect URL"
            type="url"
            fullWidth
            variant="outlined"
            value={bannerUrl}
            onChange={(e) => setBannerUrl(e.target.value)}
            placeholder="https://example.com/destination"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenUrlDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveUrl} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog for Inline Banners - Modified for better UX */}
      <Dialog
        open={openDeleteDialogInline}
        onClose={() => setOpenDeleteDialogInline(false)}
      >
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this banner? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDeleteDialogInline(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={async () => {
              await handleDeleteInline(deleteIndexInline);
              setOpenDeleteDialogInline(false);
              setDeleteIndexInline(null);
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
