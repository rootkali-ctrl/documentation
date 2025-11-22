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
  IconButton,
  InputAdornment,
  Fade,
  Card,
  CardContent,
} from "@mui/material";
import {
  ArrowBack,
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Email,
  Phone,
  Cake,
} from "@mui/icons-material";
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

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Box sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "70vh",
        flexDirection: "column",
        gap: 2
      }}>
        <CircularProgress sx={{ color: "rgb(25, 174, 220)" }} size={50} />
        <Typography variant="body1" color="text.secondary">Loading your settings...</Typography>
      </Box>
    );
  }

  if (!user || !userData) {
    return (
      <Box sx={{ padding: 4, textAlign: "center" }}>
        <Typography variant="h5">You need to log in to access settings.</Typography>
        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{
            mt: 3,
            bgcolor: "rgb(25, 174, 220)",
            "&:hover": { bgcolor: "rgb(21, 150, 190)" }
          }}
        >
          Go to Home
        </Button>
      </Box>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box sx={{
        padding: { xs: 2, md: 4 },
        maxWidth: "1400px",
        margin: "0 auto",
        backgroundColor: "#f5f7fa",
        minHeight: "100vh"
      }}>
        {/* Header with Back Button */}
        <Box sx={{
          display: "flex",
          alignItems: "center",
          mb: 4,
          gap: 2
        }}>
          <IconButton
            onClick={handleBack}
            sx={{
              bgcolor: "white",
              boxShadow: 2,
              "&:hover": {
                bgcolor: "rgb(25, 174, 220)",
                color: "white",
                transform: "scale(1.05)",
              },
              transition: "all 0.3s ease"
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography
              variant={isMobile ? "h5" : "h4"}
              sx={{
                fontWeight: "bold",
                color: "rgb(25, 174, 220)",
                mb: 0.5
              }}
            >
              Account Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your profile and security settings
            </Typography>
          </Box>
        </Box>

        {/* Account Summary Card */}
        <Card sx={{
          mb: 4,
          borderRadius: 3,
          boxShadow: 3,
          background: "linear-gradient(135deg, rgb(25, 174, 220) 0%, rgb(21, 150, 190) 100%)"
        }}>
          <CardContent sx={{ py: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <Box sx={{
                  width: 70,
                  height: 70,
                  borderRadius: "50%",
                  bgcolor: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "2rem",
                  fontWeight: "bold",
                  color: "rgb(25, 174, 220)"
                }}>
                  {firstName.charAt(0).toUpperCase()}{lastName.charAt(0).toUpperCase()}
                </Box>
              </Grid>
              <Grid item xs>
                <Typography variant="h6" sx={{ color: "white", fontWeight: "bold" }}>
                  {firstName} {lastName}
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.9)" }}>
                  {email}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Grid container spacing={3}>
          {/* Personal Information Section */}
          <Grid item xs={12} lg={6}>
            <Paper
              elevation={3}
              sx={{
                padding: 3,
                borderRadius: 3,
                height: "100%",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: 6,
                  transform: "translateY(-4px)"
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Person sx={{ color: "rgb(25, 174, 220)", mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Personal Information
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="First Name"
                    fullWidth
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: "rgb(25, 174, 220)" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Last Name"
                    fullWidth
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: "rgb(25, 174, 220)" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Phone Number"
                    fullWidth
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ color: "rgb(25, 174, 220)" }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Date of Birth"
                      value={dob}
                      onChange={(newValue) => setDob(newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          sx={{ mb: 2 }}
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <InputAdornment position="start">
                                <Cake sx={{ color: "rgb(25, 174, 220)" }} />
                              </InputAdornment>
                            ),
                          }}
                        />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    bgcolor: "#f5f7fa",
                    p: 2,
                    borderRadius: 2,
                    border: "1px solid #e0e0e0"
                  }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <Email sx={{ color: "rgb(25, 174, 220)", mr: 1 }} />
                      <Typography variant="body2" sx={{ color: "#666", fontWeight: "medium" }}>
                        Email Address
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                      {email}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpdateProfile}
                disabled={saving}
                sx={{
                  mt: 3,
                  py: 1.5,
                  bgcolor: "rgb(25, 174, 220)",
                  "&:hover": {
                    bgcolor: "rgb(21, 150, 190)",
                    transform: "scale(1.02)"
                  },
                  transition: "all 0.3s ease",
                  fontWeight: "bold",
                  fontSize: "1rem"
                }}
              >
                {saving ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </Paper>
          </Grid>

          {/* Password Settings Section */}
          <Grid item xs={12} lg={6}>
            <Paper
              elevation={3}
              sx={{
                padding: 3,
                borderRadius: 3,
                height: "100%",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: 6,
                  transform: "translateY(-4px)"
                }
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Lock sx={{ color: "rgb(25, 174, 220)", mr: 1, fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                  Password Settings
                </Typography>
              </Box>
              <Divider sx={{ mb: 3 }} />

              <TextField
                label="Current Password"
                fullWidth
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "rgb(25, 174, 220)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                label="New Password"
                fullWidth
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "rgb(25, 174, 220)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Confirm New Password"
                fullWidth
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: "rgb(25, 174, 220)" }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <Box sx={{
                bgcolor: "#fff3e0",
                p: 2,
                borderRadius: 2,
                mb: 3,
                border: "1px solid #ffb74d"
              }}>
                <Typography variant="caption" sx={{ color: "#e65100", fontWeight: "medium" }}>
                  Password Requirements:
                </Typography>
                <Typography variant="caption" sx={{ display: "block", color: "#666", mt: 0.5 }}>
                  • Minimum 6 characters<br/>
                  • Must match confirmation
                </Typography>
              </Box>

              <Button
                variant="contained"
                fullWidth
                onClick={handleUpdatePassword}
                disabled={saving}
                sx={{
                  py: 1.5,
                  bgcolor: "rgb(25, 174, 220)",
                  "&:hover": {
                    bgcolor: "rgb(21, 150, 190)",
                    transform: "scale(1.02)"
                  },
                  transition: "all 0.3s ease",
                  fontWeight: "bold",
                  fontSize: "1rem"
                }}
              >
                {saving ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Update Password"
                )}
              </Button>
            </Paper>
          </Grid>
        </Grid>

        <Snackbar
          open={alert.open}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseAlert}
            severity={alert.severity}
            sx={{
              width: "100%",
              boxShadow: 3,
              fontWeight: "medium"
            }}
            elevation={6}
          >
            {alert.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

export default Settings;
