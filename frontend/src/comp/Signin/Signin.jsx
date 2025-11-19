import React, { useState, useCallback } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Modal,
  IconButton,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { auth, db, googleProvider } from "../../firebase_config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const SignIn = ({
  open,
  handleClose,
  handleSwitchToLogin,
  onSigninSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkPass, setCheckPassword] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  const isFormValid =
    email.trim() !== "" &&
    password.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    password === confirmPassword;

  const [isLoading, setIsLoading] = useState(false);
  const [dialogState, setDialogState] = useState({
    open: false,
    message: "",
  });

  // Optimized dialog handler
  const showDialog = useCallback((message) => {
    setDialogState({ open: true, message });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({ open: false, message: "" });
  }, []);

  const handleEmailSignIn = async () => {
    if (isLoading) return;

    const username = email.split("@")[0];
    setIsLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setCheckPassword(true);

      // Send verification email
      await sendEmailVerification(user);

      // Save user data to Firestore with account creation timestamp
      await setDoc(doc(db, "users", user.uid), {
        authId: user.uid,
        username,
        firstName: username,
        lastName: "",
        email,
        type: "manual",
        password, // ⚠️ Security Warning: Consider removing this field
        accountcreated: new Date(), // Added account creation timestamp
      });

      // IMPORTANT: Sign out the user so they remain logged out until email verification
      await auth.signOut();

      handleClose(); // Close modal first
      showDialog(
        "Verification email sent! Please verify your email before logging in."
      );
    } catch (err) {
      console.error("Error during sign-in:", err);

      handleClose(); // Close modal first

      if (err.code === "auth/email-already-in-use") {
        showDialog("This email is already registered. Please log in.");
      } else {
        showDialog("Sign-in failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const email = user.email;
      const username = email.split("@")[0];
      const authId = user.uid;
      const displayName = user.displayName || "";
      const [firstName, lastName] = displayName.split(" ");

      // Check if user exists and if they're suspended
      const userRef = doc(db, "users", authId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        // User exists, check if suspended
        if (userSnap.data().suspended === true) {
          showDialog("Your account has been suspended. Please contact support at bubaln@ticketb.in");
          await auth.signOut();
          return;
        }
      } else {
        // New user, create document
        await setDoc(userRef, {
          authId,
          username,
          firstName: firstName || username,
          lastName: lastName || "",
          email,
          suspended: false,
          type: "google-signin",
          accountcreated: new Date(), // Added account creation timestamp
        });
      }

      // If everything is good, proceed with sign-in
      if (onSigninSuccess) {
        onSigninSuccess();
      }

      handleClose(); // Close modal
      // REMOVED: navigate("/") - Don't navigate, stay on current page

    } catch (err) {
      console.error("Google Sign-in error:", err);
      handleClose(); // Close modal first

      let errorMessage = "Failed to sign in with Google";
      if (err.code === "auth/popup-closed-by-user") {
        errorMessage = "Sign-in cancelled. Please try again.";
      } else if (err.code === "auth/popup-blocked") {
        errorMessage = "Pop-up blocked. Please allow pop-ups and try again.";
      }

      showDialog(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={handleClose}>
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(5px)",
          }}
        >
          <Box
            sx={{
              width: isMobile ? "80%" : "400px",
              backgroundColor: "#fff",
              padding: isMobile ? "1rem" : "2rem",
              borderRadius: "24px",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
              position: "relative",
            }}
          >
            <IconButton
              sx={{
                position: "absolute",
                top: "10px",
                left: "10px",
              }}
              onClick={handleClose}
            >
              <ArrowBack />
            </IconButton>

            <Typography
              variant="h5"
              fontWeight="bold"
              mb={1}
              sx={{ fontSize: "24px", fontFamily: "albert sans" }}
            >
              ROLL THE CARPET!
            </Typography>
            <Typography
              variant="body2"
              color="gray"
              mb={2}
              fontFamily="albert sans"
            >
              Sign in to continue to TicketB
            </Typography>

            <Typography
              variant="body2"
              sx={{
                textAlign: "left",
                color: "black",
                mb: 0.5,
                fontFamily: "albert sans",
              }}
            >
              Email Address
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your email"
              fontFamily="albert sans"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                sx: {
                  borderRadius: "12px",
                  backgroundColor: "#F8F8F8",
                  fontFamily: "albert sans",
                },
              }}
            />

            <Typography
              variant="body2"
              sx={{
                textAlign: "left",
                color: "black",
                mb: 0.5,
                fontFamily: "albert sans",
              }}
            >
              Password
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                sx: {
                  borderRadius: "12px",
                  backgroundColor: "#F8F8F8",
                  fontFamily: "albert sans",
                },
              }}
            />
            <Typography
              variant="body2"
              sx={{
                textAlign: "left",
                color: "black",
                mb: 0.5,
                fontFamily: "albert sans",
              }}
            >
              Confirm Password
            </Typography>
            <TextField
              fullWidth
              placeholder="Confirm your password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                sx: {
                  borderRadius: "12px",
                  backgroundColor: "#F8F8F8",
                  fontFamily: "albert sans",
                },
              }}
              error={checkPass && password !== confirmPassword}
              helperText={
                checkPass && password !== confirmPassword
                  ? "Passwords do not match"
                  : ""
              }
            />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
            >
              <Typography variant="body2" color="gray" fontFamily="albert sans">
                Remember me
              </Typography>
              <Typography
                variant="body2"
                color="#19AEDC"
                sx={{ cursor: "pointer", fontFamily: "albert sans" }}
              >
                Forgot password?
              </Typography>
            </Box>

            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: isFormValid ? "#19AEDC" : "#ccc",
                color: "#fff",
                py: 1.5,
                mb: 1,
                borderRadius: "10px",
                fontWeight: "bold",
                fontFamily: "albert sans",
                cursor: isFormValid ? "pointer" : "not-allowed",
                boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              }}
              disabled={!isFormValid || isLoading}
              onClick={handleEmailSignIn}
            >
              {isLoading ? "Please wait..." : "Sign Up"}
            </Button>

            <Typography variant="body2" color="gray" fontFamily="albert sans">
              Or continue with
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              sx={{
                backgroundColor: !isLoading ? "#19AEDC" : "#ccc",
                color: "#FFFFFF",
                py: 1,
                mt: 1,
                borderRadius: "10px",
                fontFamily: "albert sans",
              }}
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {isLoading ? "Please wait..." : "Google"}
            </Button>

            <Typography variant="body2" mt={1} fontFamily="albert sans">
              I have an account?{" "}
              <Button
                sx={{
                  textTransform: "none",
                  color: "#19AEDC",
                  fontFamily: "albert sans",
                }}
                onClick={handleSwitchToLogin}
              >
                Login
              </Button>
            </Typography>
          </Box>
        </Box>
      </Modal>

      {/* Dialog moved outside Modal for better performance */}
      <Dialog
        open={dialogState.open}
        onClose={closeDialog}
        sx={{ zIndex: 9999 }} // Ensure it appears above everything
      >
        <DialogTitle sx={{ fontFamily: "albert sans" }}>Notice</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "albert sans" }}>
            {dialogState.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDialog}
            color="primary"
            sx={{ fontFamily: "albert sans" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SignIn;