import React, { useState, useEffect, useRef } from "react";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { auth, db } from "../../firebase_config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber
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

  // OTP verification states
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationId, setVerificationId] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [tempPhoneNumber, setTempPhoneNumber] = useState("");

  // Alert state
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success"
  });

  // Create ref to store recaptchaVerifier
  const recaptchaVerifierRef = useRef(null);
  // Create ref for recaptcha container
  const recaptchaContainerRef = useRef(null);

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

            // Set phone verified status based on existing data
            setPhoneVerified(data.phoneVerified || false);
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

    return () => {
      unsubscribe();
      // Clean up recaptcha when component unmounts
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [navigate]);

  const setupRecaptcha = () => {
    // Clear existing recaptcha if it exists
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
    }

    // Generate a unique ID for the recaptcha container
    const containerId = `recaptcha-container-${Date.now()}`;

    // Create a new div element for the recaptcha
    const newContainer = document.createElement('div');
    newContainer.id = containerId;

    // Remove any existing containers
    if (recaptchaContainerRef.current) {
      recaptchaContainerRef.current.innerHTML = '';
      recaptchaContainerRef.current.appendChild(newContainer);
    }

    // Create new recaptcha verifier with the unique container ID
    recaptchaVerifierRef.current = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible',
      'callback': () => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log("reCAPTCHA verified");
      },
      'expired-callback': () => {
        // Response expired. Ask user to solve reCAPTCHA again.
        setAlert({
          open: true,
          message: "reCAPTCHA expired. Please try again.",
          severity: "error"
        });
      }
    });

    return recaptchaVerifierRef.current;
  };

  const handleSendOTP = async () => {
    // Clean and validate phone number
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');

    if (!phoneNumber || cleanedPhoneNumber.length < 10) {
      setAlert({
        open: true,
        message: "Please enter a valid phone number with at least 10 digits",
        severity: "warning"
      });
      return;
    }

    setOtpLoading(true);

    try {
      const appVerifier = setupRecaptcha();

      // Format phone number with country code
      // Replace +1 with your country code if needed
      const formattedPhoneNumber = phoneNumber.startsWith('+')
        ? phoneNumber
        : `+1${cleanedPhoneNumber}`;

      console.log("Sending OTP to:", formattedPhoneNumber);
      setTempPhoneNumber(formattedPhoneNumber);

      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, appVerifier);

      setVerificationId(confirmationResult);
      setOtpSent(true);
      setOtpDialogOpen(true);

      setAlert({
        open: true,
        message: "OTP sent to your phone number!",
        severity: "success"
      });
    } catch (error) {
      console.error("Error sending OTP:", error);

      let errorMessage = "Failed to send OTP. ";
      if (error.code === "auth/invalid-phone-number") {
        errorMessage += "Please check the phone number format (e.g. +1XXXXXXXXXX).";
      } else if (error.code === "auth/quota-exceeded") {
        errorMessage += "Too many attempts. Please try again later.";
      } else {
        errorMessage += error.message;
      }

      setAlert({
        open: true,
        message: errorMessage,
        severity: "error"
      });

      // Reset reCAPTCHA
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      setAlert({
        open: true,
        message: "Please enter a valid 6-digit OTP",
        severity: "warning"
      });
      return;
    }

    setOtpLoading(true);

    try {
      await verificationId.confirm(verificationCode);

      setPhoneVerified(true);
      setOtpDialogOpen(false);

      setAlert({
        open: true,
        message: "Phone number verified successfully!",
        severity: "success"
      });

      // Phone is now verified, proceed with saving profile
      await handleUpdateProfile(true);
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setAlert({
        open: true,
        message: "Invalid OTP. Please try again.",
        severity: "error"
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleUpdateProfile = async (skipPhoneCheck = false) => {
    if (!user) return;

    // If phone number is changed and not verified yet, trigger OTP flow
    if (userData && userData.phoneNumber !== phoneNumber && !skipPhoneCheck && !phoneVerified) {
      handleSendOTP();
      return;
    }

    setSaving(true);
    try {
      const userDocRef = doc(db, "users", user.uid);

      // Update Firestore document
      await updateDoc(userDocRef, {
        firstName,
        lastName,
        phoneNumber: tempPhoneNumber || phoneNumber, // Use verified phone number if available
        dob: dob ? dob.toISOString().split('T')[0] : null,
        phoneVerified: true // Mark as verified after successful update
      });

      setAlert({
        open: true,
        message: "Profile updated successfully!",
        severity: "success"
      });

      // Update local state to reflect that this phone is now verified
      if (tempPhoneNumber) {
        setPhoneNumber(tempPhoneNumber);
      }
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

  const handleUpdateEmail = async () => {
    if (!user || !currentPassword) {
      setAlert({
        open: true,
        message: "Please enter your current password",
        severity: "warning"
      });
      return;
    }

    setSaving(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update email in Firebase Auth
      await updateEmail(user, email);

      // Update email in Firestore
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { email });

      setAlert({
        open: true,
        message: "Email updated successfully!",
        severity: "success"
      });
      setCurrentPassword("");
    } catch (error) {
      console.error("Error updating email:", error);
      let errorMessage = "Failed to update email. ";

      if (error.code === "auth/wrong-password") {
        errorMessage += "Incorrect password.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage += "Email already in use.";
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

  const handleCloseOtpDialog = () => {
    setOtpDialogOpen(false);
    // Reset OTP state when dialog is closed
    setVerificationCode("");
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
    <Box sx={{ padding: { xs: 2, md: 4 }, width: isMobile ? "90%" : "90%", margin: "0 auto",backgroundColor:"#f9f9f9"}}>
      {/* Hidden reCAPTCHA container */}
      <div ref={recaptchaContainerRef}></div>

      <Typography variant="h4" sx={{ mb: 4, fontWeight: "bold", color: "rgb(25, 174, 220)" }}>
        Account Settings
      </Typography>

      <Grid container spacing={3} >
        <Grid item xs={12} md={6} >
          <Paper elevation={3} sx={{ padding: 2, borderRadius: 5, mb: 1 ,boxShadow:0}}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold",fontSize:isMobile?"1rem":"1.2rem"}}>
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
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    // Reset verification status when phone number changes
                    if (e.target.value !== userData.phoneNumber) {
                      setPhoneVerified(false);
                    } else {
                      setPhoneVerified(userData.phoneVerified || false);
                    }
                  }}
                  helperText={phoneVerified ? "Verified" : "Format: +XXXXXXXXXXX or enter digits only"}
                  FormHelperTextProps={{
                    sx: { color: phoneVerified ? "green" : "orange" }
                  }}
                  sx={{ mb: 0 }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date of Birth"
                    value={dob}
                    onChange={(newValue) => setDob(newValue)}
                    renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 1}} />}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>

            <Button
              variant="contained"
              onClick={() => handleUpdateProfile()}
              disabled={saving || otpLoading}
              sx={{
                mt: 2,
                bgcolor: "rgb(25, 174, 220)",
                "&:hover": { bgcolor: "rgb(21, 150, 190)" }
              }}
            >
              {saving || otpLoading ? <CircularProgress size={24} sx={{ color: "white" ,fontSize:isMobile?"1rem":"1.2rem"}} /> : "Save Changes"}
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ padding: 3, borderRadius: 5, mb: 3 ,boxShadow:0}}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" ,fontSize:isMobile?"1rem":"1.2rem"}}>
              Email Settings
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TextField
              label="Email Address"
              fullWidth
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 1 }}
            />

            <TextField
              label="Current Password"
              fullWidth
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              sx={{ mb: 1 }}
            />

            <Button
              variant="contained"
              onClick={handleUpdateEmail}
              disabled={saving}
              sx={{
                mt: 2,
                bgcolor: "rgb(25, 174, 220)",
                "&:hover": { bgcolor: "rgb(21, 150, 190)" }
              }}
            >
              {saving ? <CircularProgress size={24} sx={{ color: "white" ,fontSize:isMobile?"1rem":"1.2rem"}} /> : "Update Email"}
            </Button>
          </Paper>

          <Paper elevation={3} sx={{ padding: 3, borderRadius: 5,boxShadow:0 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: "bold" ,fontSize:isMobile?"1rem":"1.2rem"}}>
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
              {saving ? <CircularProgress size={24} sx={{ color: "white" ,fontSize:isMobile?"1rem":"1.2rem"}} /> : "Update Password"}
            </Button>
          </Paper>
        </Grid>
      </Grid>

      {/* OTP Verification Dialog */}
      <Dialog open={otpDialogOpen} onClose={handleCloseOtpDialog}>
        <DialogTitle>Phone Verification</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            We've sent a verification code to {tempPhoneNumber}.
          </Typography>
          <TextField
            label="Enter 6-digit OTP"
            fullWidth
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
            sx={{ mt: 1 }}
            inputProps={{ maxLength: 6 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseOtpDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleVerifyOTP}
            color="primary"
            disabled={otpLoading || verificationCode.length !== 6}
          >
            {otpLoading ? <CircularProgress size={24} /> : "Verify"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={alert.open} autoHideDuration={6000} onClose={handleCloseAlert}>
        <Alert onClose={handleCloseAlert} severity={alert.severity} sx={{ width: "100%" }}>
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
