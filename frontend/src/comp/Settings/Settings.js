import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { auth, db } from "../../firebase_config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState(null);
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success"
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

            // Initialize form fields
            setFirstName(data.firstName || "");
            setLastName(data.lastName || "");
            setPhoneNumber(data.phoneNumber || "");
            setDob(data.dob ? new Date(data.dob) : null);
            setEmail(currentUser.email);
          } else {
            console.log("No user data found in Firestore");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        // Redirect to home if not logged in
        navigate("/");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);

      // Update Firestore document
      await updateDoc(userDocRef, {
        firstName,
        lastName,
        phoneNumber,
        dob: dob ? dob.toISOString().split('T')[0] : null,
      });

      setAlert({
        open: true,
        message: "Profile updated successfully!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      setAlert({
        open: true,
        message: "Failed to update profile. Please try again.",
        severity: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user || !currentPassword) {
      setAlert({
        open: true,
        message: "Please enter your current password",
        severity: "warning"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({
        open: true,
        message: "New passwords don't match",
        severity: "warning"
      });
      return;
    }

    if (newPassword.length < 6) {
      setAlert({
        open: true,
        message: "Password must be at least 6 characters",
        severity: "warning"
      });
      return;
    }

    setSaving(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase Auth
      await updatePassword(user, newPassword);

      setAlert({
        open: true,
        message: "Password updated successfully!",
        severity: "success"
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      let errorMessage = "Failed to update password. ";

      if (error.code === "auth/wrong-password") {
        errorMessage += "Incorrect current password.";
      } else {
        errorMessage += "Please try again.";
      }

      setAlert({
        open: true,
        message: errorMessage,
        severity: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false
    });
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
        <Typography variant="h5">You need to log in to access settings.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: { xs: 2, md: 4 }, width: isMobile ? "90%" : "90%", margin: "0 auto", backgroundColor: "#f9f9f9" }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold", color: "rgb(25, 174, 220)" }}>
        Account Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 2, borderRadius: 5, mb: 1, boxShadow: 0 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", fontSize: isMobile ? "1rem" : "1.2rem" }}>
              Personal Information
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  sx={{ mb: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  sx={{ mb: 1 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  fullWidth
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  sx={{ mb: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date of Birth"
                    value={dob}
                    onChange={(newValue) => setDob(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 1 }} />}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>Email Address</Typography>
                <Typography variant="body1">{email}</Typography>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={() => handleUpdateProfile()}
              disabled={saving}
              sx={{
                mt: 2,
                bgcolor: "rgb(25, 174, 220)",
                "&:hover": { bgcolor: "rgb(21, 150, 190)" }
              }}
            >
              {saving ? <CircularProgress size={24} sx={{ color: "white", fontSize: isMobile ? "1rem" : "1.2rem" }} /> : "Save Changes"}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3, borderRadius: 5, boxShadow: 0 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold", fontSize: isMobile ? "1rem" : "1.2rem" }}>
              Password Settings
            </Typography>
            <Divider sx={{ mb: 2 }} />

            <TextField
              label="Current Password"
              fullWidth
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              sx={{ mb: 1 }}
            />

            <TextField
              label="New Password"
              fullWidth
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 1 }}
            />

            <TextField
              label="Confirm New Password"
              fullWidth
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 1 }}
            />

            <Button
              variant="contained"
              onClick={handleUpdatePassword}
              disabled={saving}
              sx={{
                mt: 2,
                bgcolor: "rgb(25, 174, 220)",
                "&:hover": { bgcolor: "rgb(21, 150, 190)" }
              }}
            >
              {saving ? <CircularProgress size={24} sx={{ color: "white", fontSize: isMobile ? "1rem" : "1.2rem" }} /> : "Update Password"}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
