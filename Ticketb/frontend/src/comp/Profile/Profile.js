import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  CircularProgress,
  TextField,
  Button,
  Divider,
  IconButton,
  Snackbar,
  Alert,
  useMediaQuery,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { auth, db } from "../../firebase_config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editedUserData, setEditedUserData] = useState({});
  const [editMode, setEditMode] = useState({
    firstName: false,
    lastName: false,
    email: false,
    phoneNumber: false,
    dob: false,
  });
  const [isSaving, setSaving] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData(data);
            setEditedUserData(data);
          } else {
            console.log("No user data found in Firestore");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        navigate("/");
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleEdit = (field) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (field, value) => {
    setEditedUserData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, editedUserData);
      setUserData(editedUserData);
      setEditMode({
        firstName: false,
        lastName: false,
        email: false,
        phoneNumber: false,
        dob: false,
      });
      setNotification({
        open: true,
        message: "Profile updated successfully!",
        severity: "success",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setNotification({
        open: true,
        message: "Failed to update profile. Please try again.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification((prev) => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
        <CircularProgress sx={{ color: "rgb(25, 174, 220)" }} />
      </Box>
    );
  }

  if (!user || !userData) {
    return (
      <Box sx={{ padding: 4, textAlign: "center" }}>
        <Typography variant="h5">You need to log in to view your profile.</Typography>
      </Box>
    );
  }

  const isAnyFieldInEditMode = Object.values(editMode).some((value) => value);
  const hasChanges = JSON.stringify(userData) !== JSON.stringify(editedUserData);

  return (
    <Box sx={{ padding: { xs: 2, md: 4 }, width: isMobile ? "90%" : "90%", margin: "0 auto", bgcolor: "#f9f9f9", minHeight: "calc(100vh - 64px)" ,boxShadow:0}}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 1 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: "600", color: "#333" }}>
          {userData.firstName}'s Profile
        </Typography>
      </Box>
      <Typography variant="body1" sx={{ mb: 3, color: "#666", fontWeight: "500", ml: isMobile ? 0 : 7 }}>
        Manage your profile Details
      </Typography>

      <Paper elevation={1} sx={{ padding: { xs: 2, md: 4 }, borderRadius: 2, mb: 4, width:isMobile ?"90%":"90%", margin: "0 auto" ,boxShadow:0 }}>
        <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row" }}>
          <Box sx={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", borderRight: isMobile ? "none" : "1px solid #eee", pb: { xs: 3, md: 0 } }}>
            <Avatar src={user.photoURL} sx={{ width: 120, height: 120, bgcolor: "rgb(25, 174, 220)", fontSize: "3rem", mb: 2 }}>
              {userData.firstName?.charAt(0)?.toUpperCase()}
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: "600" }}>{userData.firstName} {userData.lastName}</Typography>
            <Typography variant="body2" sx={{ color: "#666", mb: 2 }}>{userData.email}</Typography>
          </Box>

          <Box sx={{ flex: 2, pl: isMobile ? 0 : 4, mt: isMobile ? 3 : 0 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: "600" }}>Personal Information</Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
              {['firstName', 'lastName', 'email', 'phoneNumber', 'dob'].map((field, index) => (
                <Box key={field} sx={{ width: { xs: '100%', sm: '45%' } }}>
                  <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>{field.replace(/([A-Z])/, ' $1')}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {editMode[field] ? (
                      <TextField
                        fullWidth
                        size="small"
                        type={field === 'dob' ? 'date' : field === 'email' ? 'email' : 'text'}
                        value={editedUserData[field] || ""}
                        onChange={(e) => handleChange(field, e.target.value)}
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    ) : (
                      <Typography variant="body1" sx={{ mr: 1 }}>{userData[field] || "Not provided"}</Typography>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(field)}
                      sx={{
                        bgcolor: editMode[field] ? "rgb(25, 174, 220, 0.1)" : "transparent",
                        '&:hover': { bgcolor: "rgb(25, 174, 220, 0.2)" }
                      }}
                    >
                      {editMode[field] ? <CheckIcon fontSize="small" /> : <EditIcon fontSize="small" />}
                    </IconButton>
                  </Box>
                </Box>
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Account Settings</Typography>
              <Button
                variant="contained"
                color="primary"
                disabled={!(isAnyFieldInEditMode && hasChanges) || isSaving}
                onClick={handleSave}
                sx={{ textTransform: "none", bgcolor: "rgb(25, 174, 220)", '&:hover': { bgcolor: "rgb(20, 140, 180)" }, '&:disabled': { bgcolor: "rgba(0, 0, 0, 0.12)", color: "rgba(0, 0, 0, 0.26)" } }}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </Box>

            <Box sx={{ mt: 3 }}>
              {["/change-password", "/privacy-settings", "/notification-preferences"].map((path, index) => (
                <Box
                  key={path}
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid #eee",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    mb: 2,
                    '&:hover': { bgcolor: "#f9f9f9" }
                  }}
                  onClick={() => navigate(path)}
                >
                  <Typography variant="body1">{path.split("/")[1].replace("-", " ")}</Typography>
                  <Typography sx={{ color: "#999" }}>›</Typography>
                </Box>
              ))}
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>Account Status</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: "green" }}>
                <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "green" }} />
                <Typography variant="body2">Active</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification}>
        <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Profile;
