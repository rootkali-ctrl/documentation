import React, { useEffect, useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GppGoodIcon from "@mui/icons-material/GppGood";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";

import {
  Button,
  Typography,
  useMediaQuery,
  Box,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useParams } from "react-router-dom";

import axios from "axios";
import VendorProfileHeader from "./VendorProfileHeader";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const VendorProfile = () => {
  const { vendorId } = useParams();
  const [vendorData, setVendorData] = useState(null);
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isVendorIdReady, setIsVendorIdReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Edit states
  const [editStates, setEditStates] = useState({
    username: false,
    organizationContact: false,
    organizationMail: false,
    password: false,
  });

  // Temp values for editing
  const [tempValues, setTempValues] = useState({
    username: "",
    organizationContact: "",
    organizationMail: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});

  // Fetch vendor details
  useEffect(() => {
    const fetchVendorDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/vendor/vendorupdate/${vendorId}`
        );
        setVendorData(res.data);
        setOriginalData(res.data);
        setTempValues({
          username: res.data.username || "",
          organizationContact: res.data.organisationContact || "",
          organizationMail: res.data.organisationMail || "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (err) {
        console.error("Error fetching vendor data:", err);
        setMessage({ type: "error", text: "Failed to load vendor data" });
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorDetails();
      setIsVendorIdReady(true);
    }
  }, [vendorId]);

  // Check if any changes were made
  const hasChanges = () => {
    if (!originalData || !vendorData) return false;

    return (
      vendorData.username !== originalData.username ||
      vendorData.organisationContact !== originalData.organisationContact ||
      vendorData.organisationMail !== originalData.organisationMail ||
      tempValues.newPassword.trim() !== ""
    );
  };

  // Generic edit handlers
  const handleEdit = (field) => {
    setEditStates((prev) => ({ ...prev, [field]: true }));
    if (field === "password") {
      setTempValues((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }));
    }
  };

  const handleSave = (field) => {
    if (field === "password") {
      if (validatePassword()) {
        setEditStates((prev) => ({ ...prev, [field]: false }));
      }
    } else {
      setVendorData((prev) => ({
        ...prev,
        [getDataField(field)]: tempValues[field],
      }));
      setEditStates((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleCancel = (field) => {
    if (field === "password") {
      setTempValues((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }));
      setPasswordErrors({});
    } else {
      setTempValues((prev) => ({
        ...prev,
        [field]: vendorData[getDataField(field)] || "",
      }));
    }
    setEditStates((prev) => ({ ...prev, [field]: false }));
  };

  const getDataField = (field) => {
    const fieldMap = {
      username: "username",
      organizationContact: "organisationContact",
      organizationMail: "organisationMail",
    };
    return fieldMap[field];
  };

  // Password validation
  const validatePassword = () => {
    const errors = {};

    if (tempValues.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters long";
    }

    if (tempValues.newPassword !== tempValues.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle key press
  const handleKeyPress = (e, field) => {
    if (e.key === "Enter") {
      handleSave(field);
    } else if (e.key === "Escape") {
      handleCancel(field);
    }
  };

  // Save changes to backend
  const handleSaveChanges = async () => {
    setSaveLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const updateData = {
        username: vendorData.username,
        organisationContact: vendorData.organisationContact,
        organisationMail: vendorData.organisationMail,
        email: vendorData.email, // Add email
      };

      if (tempValues.newPassword.trim()) {
        if (!validatePassword()) {
          setSaveLoading(false);
          return;
        }
        updateData.newPassword = tempValues.newPassword;
      }

      const response = await axios.put(
        `${API_BASE_URL}/api/vendor/update/${vendorId}`,
        updateData
      );
      setMessage({ type: "success", text: "Profile updated successfully!" });
      setOriginalData({ ...vendorData });
      setTempValues((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }));
      setEditStates({
        username: false,
        organizationContact: false,
        organizationMail: false,
        password: false,
      });
    } catch (err) {
      console.error("Error updating vendor data:", err);
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to update profile. Please try again.",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const sidebarItems = [
    {
      name: "Profile",
      icon: <AccountCircleIcon />,
      active: true,
      path: `/vendorprofile/vendorprofile/${vendorId}`,
    },
    {
      name: "Documents",
      icon: <EditDocumentIcon />,
      active: false,
      path: `/vendorprofile/vendordocuments/${vendorId}`,
    },
    {
      name: "Organization details",
      icon: <CorporateFareIcon />,
      active: false,
      path: `/vendorprofile/vendororganization/${vendorId}`,
    },
    {
      name: "Scanner",
      icon: <QrCodeScannerOutlinedIcon />,
      active: false,
      path: `/vendorprofile/vendorscanner/${vendorId}`,
    },
  ];

  const isMobileScreen = useMediaQuery("(max-width:768px)");

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      {isVendorIdReady && vendorId ? (
        <VendorProfileHeader vendorId={vendorId} />
      ) : (
        <p>Loading header...</p>
      )}
      <Box display="flex" flex={1} sx={{ minHeight: "100vh" }}>
        {!isMobileScreen ? (
          <Box
            width={276}
            flexShrink={0}
            bgcolor="white"
            py={10}
            px={3}
            boxShadow={3}
            sx={{
              minheight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              pt: "8%",
            }}
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
                  fontSize: "18px",
                  fontFamily: "albert sans",
                }}
                startIcon={item.icon}
              >
                {item.name}
              </Button>
            ))}
          </Box>
        ) : (
          <>
            <AppBar
              position="fixed"
              elevation={0}
              sx={{
                width: "fit-content",
                bgcolor: "transparent",
                boxShadow: "none",
                zIndex: 20,
                top: 60,
                left: 16,
              }}
            >
              <Toolbar sx={{ minHeight: "auto", padding: 0 }}>
                <IconButton
                  onClick={() => setDrawerOpen(true)}
                  sx={{
                    backgroundColor: "#fff",
                    width: 90,
                    height: 30,
                    borderRadius: 5,
                    boxShadow: 2,
                    zIndex: 0,
                    "&:hover": {
                      backgroundColor: "#f0f0f0",
                    },
                  }}
                >
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: "albert sans",
                      fontWeight: "bold",
                      color: "rgb(25, 174, 220)",
                    }}
                  >
                    Menu
                  </Typography>
                  <ArrowForwardIcon
                    sx={{ color: "rgb(25, 174, 220)", fontSize: 18, ml: 1 }}
                  />
                </IconButton>
              </Toolbar>
            </AppBar>

            <Drawer
              anchor="left"
              open={drawerOpen}
              onClose={() => setDrawerOpen(false)}
            >
              <Box
                sx={{ width: 250, p: 2, mt: 8 }}
                role="presentation"
                onClick={() => setDrawerOpen(false)}
                onKeyDown={() => setDrawerOpen(false)}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "albert sans",
                    fontWeight: "bold",
                    mb: 2,
                    color: "rgb(25, 174, 220)",
                  }}
                >
                  Vendor Menu
                </Typography>
                {sidebarItems.map((item) => (
                  <Button
                    key={item.name}
                    onClick={() => (window.location.href = item.path)}
                    variant={item.active ? "contained" : "outlined"}
                    fullWidth
                    sx={{
                      justifyContent: "flex-start",
                      my: 1,
                      paddingY: 1.5,
                      borderRadius: "10px",
                      borderColor: item.active ? "#19aedc" : "#ddd",
                      bgcolor: item.active ? "#e3f2fd" : "white",
                      color: item.active ? "#19aedc" : "black",
                      textTransform: "none",
                      fontWeight: item.active ? "bold" : "normal",
                      gap: 2,
                      fontSize: "16px",
                      fontFamily: "albert sans",
                    }}
                    startIcon={item.icon}
                  >
                    {item.name}
                  </Button>
                ))}
              </Box>
            </Drawer>
          </>
        )}

        <Box
          sx={{
            bgcolor: "#f9fafb",
            minheight: "100vh",
            width: "100%",
            pt: "6%",
            pl: "5%",
            display: "flex",
            flexDirection: "column",
            pr: "5%",
            pb: "5%",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontWeight: "600",
              fontSize: isMobileScreen ? "20px" : "26px",
              mt: isMobileScreen ? 5 : "0%",
            }}
          >
            Profile Management
          </Typography>
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: isMobileScreen ? "14px" : "18px",
            }}
          >
            Manage your profile details
          </Typography>

          {message.text && (
            <Alert severity={message.type} sx={{ mt: 2, mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <Box
            sx={{
              width: isMobileScreen ? "90%" : "80%",
              bgcolor: "white",
              mt: "4%",
              padding: "2% 5%",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            {/*Email field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Email ID
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "55%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.email}
                disabled={true}
                size="small"
                sx={{
                  flex: 1,
                  width: isMobileScreen ? 300 : null,
                  "& .MuiInputBase-input": {
                    fontFamily: "Albert Sans",
                    cursor: editStates.username ? "text" : "default",
                  },
                  "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />
            </Box>

            {/* Username Field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Username
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "60%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={
                  editStates.username
                    ? tempValues.username
                    : vendorData?.username || ""
                }
                onChange={(e) => {
                  if (editStates.username) {
                    setTempValues((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }));
                  }
                }}
                onKeyDown={(e) => handleKeyPress(e, "username")}
                placeholder="Enter username"
                disabled={!editStates.username}
                size="small"
                sx={{
                  flex: 1,
                  "& .MuiInputBase-input": {
                    fontFamily: "Albert Sans",
                    cursor: editStates.username ? "text" : "default",
                  },
                  "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />

              {!editStates.username ? (
                <IconButton onClick={() => handleEdit("username")} size="small">
                  <EditIcon />
                </IconButton>
              ) : (
                <Box sx={{ display: "flex" }}>
                  <IconButton
                    onClick={() => handleSave("username")}
                    size="small"
                    color="primary"
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleCancel("username")}
                    size="small"
                    color="secondary"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Current Password Field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Current Password
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "60%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                type={showPassword ? "text" : "password"}
                value="••••••••••••"
                disabled
                size="small"
                sx={{
                  flex: 1,
                  "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />
              <IconButton onClick={() => handleEdit("password")} size="small">
                <EditIcon />
              </IconButton>
            </Box>

            {/* New Password Fields */}
            {editStates.password && (
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
                >
                  Set New Password
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "60%",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <TextField
                    type="password"
                    value={tempValues.newPassword}
                    onChange={(e) =>
                      setTempValues((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password (min 8 characters)"
                    size="small"
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword}
                    sx={{
                      flex: 1,
                      "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#ccc" },
                        "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                      },
                    }}
                  />
                </Box>

                <Typography
                  sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
                >
                  Confirm New Password
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    width: "60%",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <TextField
                    type="password"
                    value={tempValues.confirmPassword}
                    onChange={(e) =>
                      setTempValues((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    size="small"
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword}
                    sx={{
                      flex: 1,
                      "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
                      "& .MuiOutlinedInput-root": {
                        "& fieldset": { borderColor: "#ccc" },
                        "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => handleSave("password")}
                    size="small"
                    color="primary"
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleCancel("password")}
                    size="small"
                    color="secondary"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>
            )}

            {/* Organization Contact Field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Organization Contact
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "60%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={
                  editStates.organizationContact
                    ? tempValues.organizationContact
                    : vendorData?.organisationContact || ""
                }
                onChange={(e) => {
                  if (editStates.organizationContact) {
                    setTempValues((prev) => ({
                      ...prev,
                      organizationContact: e.target.value,
                    }));
                  }
                }}
                onKeyDown={(e) => handleKeyPress(e, "organizationContact")}
                placeholder="Enter organization contact"
                disabled={!editStates.organizationContact}
                size="small"
                sx={{
                  flex: 1,
                  "& .MuiInputBase-input": {
                    fontFamily: "Albert Sans",
                    cursor: editStates.organizationContact ? "text" : "default",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />

              {!editStates.organizationContact ? (
                <IconButton
                  onClick={() => handleEdit("organizationContact")}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              ) : (
                <Box sx={{ display: "flex" }}>
                  <IconButton
                    onClick={() => handleSave("organizationContact")}
                    size="small"
                    color="primary"
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleCancel("organizationContact")}
                    size="small"
                    color="secondary"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            {/* Organization Email Field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Organization Email
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "60%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={
                  editStates.organizationMail
                    ? tempValues.organizationMail
                    : vendorData?.organisationMail || ""
                }
                onChange={(e) => {
                  if (editStates.organizationMail) {
                    setTempValues((prev) => ({
                      ...prev,
                      organizationMail: e.target.value,
                    }));
                  }
                }}
                onKeyDown={(e) => handleKeyPress(e, "organizationMail")}
                placeholder="Enter organization email"
                disabled={!editStates.organizationMail}
                size="small"
                type="email"
                sx={{
                  flex: 1,
                  "& .MuiInputBase-input": {
                    fontFamily: "Albert Sans",
                    cursor: editStates.organizationMail ? "text" : "default",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />

              {!editStates.organizationMail ? (
                <IconButton
                  onClick={() => handleEdit("organizationMail")}
                  size="small"
                >
                  <EditIcon />
                </IconButton>
              ) : (
                <Box sx={{ display: "flex" }}>
                  <IconButton
                    onClick={() => handleSave("organizationMail")}
                    size="small"
                    color="primary"
                  >
                    <CheckIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleCancel("organizationMail")}
                    size="small"
                    color="secondary"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              )}
            </Box>

            {hasChanges() && (
              <Box
                sx={{
                  mt: 4,
                  mb: 4,
                  display: "flex",
                  justifyContent: "flex-start",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleSaveChanges}
                  disabled={saveLoading}
                  sx={{
                    backgroundColor: "#19AEDC",
                    "&:hover": { backgroundColor: "#1489B8" },
                    textTransform: "none",
                    fontFamily: "albert sans",
                    fontWeight: "600",
                    px: 4,
                    py: 1.5,
                  }}
                >
                  {saveLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default VendorProfile;
