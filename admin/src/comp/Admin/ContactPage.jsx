import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  InputAdornment,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Article as ArticleIcon,
  Settings as SettingsIcon,
  ContactPage as ContactPageIcon,
  Event as EventIcon,
  Edit as EditIcon,
  VisibilityOff,
} from "@mui/icons-material";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase_config";

const sidebarItems = [
  { name: "Dashboard", icon: <TrendingUpIcon />, active: false, path: "/admin/dashboardupcoming" },
  { name: "Users", icon: <GroupIcon />, active: false, path: "/admin/userpage" },
  { name: "Posts", icon: <ArticleIcon />, active: false, path: "/admin/postpage" },
  { name: "Login Settings", icon: <SettingsIcon />, active: false, path: "/admin/loginsettings" },
  { name: "Contact", icon: <ContactPageIcon />, active: true, path: "/admin/contactpage" },
  { name: "Events", icon: <EventIcon />, active: false, path: "/admin/eventmanagement" },
];

const ContactPage = () => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    contact: "",
    address: "",
    email: "",
  });
  const [editMode, setEditMode] = useState({
    username: false,
    password: false,
    contact: false,
    address: false,
    email: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastLogin, setLastLogin] = useState("");

  // Fetch admin details on component mount
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
        setFormData({
          username: data.username || "admin_user",
          password: data.password || "password123", // Note: Password should not be stored in Firestore in a real app
          contact: data.contact || "+1 234 567 890",
          address: data.address || "123 Event Street, Suite 456, Event City, EC 12345",
          email: data.email || "ticketb@gmail.com",
        });
        setLastLogin(data.lastlogin || "");
      } catch (err) {
        setError("Failed to load admin details: " + err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleEdit = (field) => {
    setEditMode((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated.");
      }

      const adminDocRef = doc(db, "admins", user.uid);
      await updateDoc(adminDocRef, {
        username: formData.username,
        password: formData.password, // Note: Avoid storing passwords in Firestore in production
        contact: formData.contact,
        address: formData.address,
        email: formData.email,
      });

      setSuccess("Changes saved successfully!");
      // Disable edit mode for all fields after saving
      setEditMode({
        username: false,
        password: false,
        contact: false,
        address: false,
        email: false,
      });
    } catch (err) {
      setError("Failed to save changes: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Format the last login timestamp
  const formatLastLogin = (timestamp) => {
    if (!timestamp) return "Never";
    try {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (err) {
      return "Invalid date";
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
            admin
          </Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>
          Last login at {lastLogin ? formatLastLogin(lastLogin) : "May 13, 2025 02:46 PM"}
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
        <Box flex={1} px={5} py={4} overflow="auto" maxHeight="calc(100vh - 89px)">
          <Typography variant="h5" fontWeight="bold" mb={1}>
            Contact Management
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Manage your admin contact details
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress size={40} sx={{ color: "#19aedc" }} />
            </Box>
          ) : (
            <Box
              bgcolor="white"
              p={4}
              borderRadius={2}
              boxShadow={2}
              width="100%"
              maxWidth="700px"
            >
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <Stack spacing={3}>
                {/* Username */}
                <TextField
                  label="Username"
                  variant="outlined"
                  value={formData.username}
                  onChange={(e) => handleChange("username", e.target.value)}
                  disabled={!editMode.username}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleEdit("username")} disabled={saving}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Password */}
                <TextField
                  label="Password"
                  variant="outlined"
                  type={editMode.password ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  disabled={!editMode.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleEdit("password")} disabled={saving}>
                          <VisibilityOff fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Contact Number */}
                <TextField
                  label="Contact Number"
                  variant="outlined"
                  value={formData.contact}
                  onChange={(e) => handleChange("contact", e.target.value)}
                  disabled={!editMode.contact}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleEdit("contact")} disabled={saving}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Address */}
                <TextField
                  label="Address"
                  variant="outlined"
                  multiline
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  disabled={!editMode.address}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleEdit("address")} disabled={saving}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* Email */}
                <TextField
                  label="Email Address"
                  variant="outlined"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  disabled={!editMode.email}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => toggleEdit("email")} disabled={saving}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>

              <Box mt={4} textAlign="left">
                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#19aedc", px: 4 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? <CircularProgress size={24} color="inherit" /> : "Save Changes"}
                </Button>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default ContactPage;