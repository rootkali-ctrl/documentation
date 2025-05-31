import React, { useState, useEffect } from "react";
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
import { auth, googleProvider, db } from "../../firebase_config";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { useNavigate, useLocation } from "react-router-dom";

const Login = ({ open, handleClose, handleSwitchToSignUp, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isFormValid = email.trim() !== "" && password.trim() !== "";
  const isResetEmailValid = resetEmail.trim() !== "";
  const isNewPasswordValid =
    newPassword.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    newPassword === confirmPassword;
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const mode = query.get("mode");
    const oobCode = query.get("oobCode");

    if (mode === "resetPassword" && oobCode) {
      verifyPasswordResetCode(auth, oobCode)
        .then(() => {
          setShowResetPasswordModal(true);
        })
        .catch((error) => {
          console.error("Invalid or expired reset code:", error);
          setResetError("Invalid or expired reset link. Please try again.");
        });
    }
  }, [location]);

  const handleLogin = async () => {
     if (isManual) return;
    setIsManual(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);

      if (!result.user.emailVerified) {
        setDialogMessage("Please verify your email before logging in.");
        setDialogOpen(true);

        return;
      }

      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists() && userSnap.data().suspended === true) {
        setShowSuspensionModal(true);
        await auth.signOut();
        return;
      }
      localStorage.setItem("userEmail", result.user.email);
      localStorage.setItem("loginType", "manual");

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      setDialogMessage("Logged in successfully!");
      setDialogOpen(true);

      handleClose();
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      if (error.code === "auth/user-not-found") {
        setDialogMessage("Email not registered. Please Sign Up first.");
        setDialogOpen(true);
      } else if (error.code === "auth/wrong-password") {
        setDialogMessage("Incorrect password. Please try again.");
        setDialogOpen(true);
      } else if (error.code === "auth/invalid-email") {
        setDialogMessage("Invalid email format.");
        setDialogOpen(true);
      } else {
        setDialogMessage("User does not exist.  Please sign up");
        setDialogOpen(true);
      }
    } finally{
      setIsManual(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const email = user.email;
      const username = email.split("@")[0];
      const authId = user.uid;
      const displayName = user.displayName || "";
      const [firstName, lastName] = displayName.split(" ");

      const userRef = doc(db, "users", authId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        if (userSnap.data().suspended === true) {
          setShowSuspensionModal(true);
          await auth.signOut();
          return;
        }
      } else {
        await setDoc(userRef, {
          authId,
          username,
          firstName: firstName || username,
          lastName: lastName || "",
          email,
          suspended: false,
        });
      }

      if (onLoginSuccess) {
        onLoginSuccess();
      }

      setDialogMessage("Logged in with Google!");
      setDialogOpen(true);

      handleClose();
      navigate("/");
    } catch (error) {
      console.error("Google login error:", error);

      setDialogMessage("Google login failed");
      setDialogOpen(true);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setShowSuspensionModal(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);

      setDialogMessage("Failed to log out. Please try again.");
      setDialogOpen(true);
    }
  };

  const handleForgotPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetMessage("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error("Password reset error:", error);
      if (error.code === "auth/invalid-email") {
        setResetMessage("Invalid email format.");
      } else if (error.code === "auth/user-not-found") {
        setResetMessage("No user found with this email.");
      } else {
        setResetMessage("Failed to send reset email. Please try again.");
      }
    }
  };

  const handleOpenForgotPassword = () => {
    setShowForgotPasswordModal(true);
    setResetEmail("");
    setResetMessage("");
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPasswordModal(false);
    setResetEmail("");
    setResetMessage("");
  };

  const handleResetPassword = async () => {
    const query = new URLSearchParams(location.search);
    const oobCode = query.get("oobCode");

    if (!oobCode) {
      setResetError("Invalid reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setShowResetPasswordModal(false);
      setShowResetSuccessModal(true);
    } catch (error) {
      console.error("Password reset error:", error);
      setResetError("Failed to reset password. Please try again.");
    }
  };

  const handleReturnToLogin = () => {
    setShowResetSuccessModal(false);
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    navigate("/"); // Redirect to login route
    handleClose(); // Ensure login modal is closed and can be reopened
  };

  const handleContinueToLogin = () => {
    setShowForgotPasswordModal(false);
    setResetEmail("");
    setResetMessage("");
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
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
            <DialogTitle sx={{ fontFamily: "Albert Sans", fontWeight: "bold" }}>
              Notice
            </DialogTitle>
            <DialogContent sx={{ fontFamily: "Albert Sans" }}>
              <Typography sx={{ fontFamily: "Albert Sans" }}>
                {dialogMessage}
              </Typography>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
            <DialogTitle sx={{ fontFamily: "albert sans" }}>Error</DialogTitle>
            <DialogContent>
              <DialogContentText sx={{ fontFamily: "albert sans" }}>
                {dialogMessage}
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button
                onClick={() => setDialogOpen(false)}
                color="primary"
                sx={{ fontFamily: "albert sans" }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>
          <Box
            sx={{
              width: isMobile ? "70%" : "400px",
              backgroundColor: "#fff",
              padding: isMobile ? "2rem" : "2rem",
              borderRadius: "12px",
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
                mt: isMobile ? 2 : 0,
              }}
              onClick={handleClose}
            >
              <ArrowBack />
            </IconButton>

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={1}
              sx={{
                fontSize: isMobile ? "22px" : "30px",
                fontFamily: "albert sans",
              }}
            >
              Welcome Back!
            </Typography>
            <Typography
              variant="body2"
              color="gray"
              mb={2}
              sx={{
                fontSize: isMobile ? "12px" : "20px",
                fontFamily: "albert sans",
              }}
            >
              Login to continue to TicketB
            </Typography>

            <Typography
              variant="body2"
              sx={{
                textAlign: "left",
                color: "black",
                fontFamily: "albert sans",
              }}
            >
              Email Address
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2, mt: 1, fontFamily: "albert sans", }}
              InputProps={{
              sx: {
                borderRadius: "12px",
                backgroundColor: "#F8F8F8",
                fontFamily:'albert sans'
              },}}
            />

            <Typography
              variant="body2"
              sx={{
                textAlign: "left",
                color: "black",
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
              sx={{ mb: 2, mt: 1 }}
              InputProps={{
              sx: {
                borderRadius: "12px",
                backgroundColor: "#F8F8F8",
                fontFamily:'albert sans'
              },}}
            />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}
            >
              <Typography
                variant="body2"
                color="gray"
                sx={{ fontFamily: "albert sans" }}
              >
                Remember me
              </Typography>
              <Typography
                variant="body2"
                color="#19AEDC"
                sx={{ cursor: "pointer", fontFamily: "albert sans" }}
                onClick={handleOpenForgotPassword}
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
                mb: 2,
                borderRadius: "10px",
                cursor: isFormValid ? "pointer" : "not-allowed",
                fontFamily: "albert sans",
              }}
              disabled={!isFormValid || isManual}
              onClick={handleLogin}
            >
              {isManual ? "Please wait" : "Log In"}
            </Button>

            <Typography
              variant="body2"
              color="gray"
              sx={{ fontFamily: "albert sans" }}
            >
              Or continue with
            </Typography>

            <Button
              fullWidth
              variant="outlined"
              sx={{
                backgroundColor: !isLoggingIn ? "#19AEDC" : "#ccc",
                color: "#FFFFFF",
                py: 1,
                mt: 1,
                borderRadius: "10px",
                fontFamily: "albert sans",
              }}
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? "Please wait" : "Google"}
            </Button>

            <Typography
              variant="body2"
              mt={2}
              sx={{ fontFamily: "albert sans" }}
            >
              Don't have an account?{" "}
              <Button
                sx={{
                  textTransform: "none",
                  color: "#19AEDC",
                  fontFamily: "albert sans",
                }}
                onClick={handleSwitchToSignUp}
              >
                Sign up
              </Button>
            </Typography>
          </Box>
        </Box>
      </Modal>

      <Modal open={showSuspensionModal} onClose={() => {}}>
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
              width: "400px",
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
              color="error"
              sx={{ fontSize: "24px", fontFamily: "albert sans" }}
            >
              Account Suspended
            </Typography>

            <Typography
              variant="body1"
              mb={3}
              sx={{ fontFamily: "albert sans" }}
            >
              Your account has been suspended by the admin. To reactivate your
              account, please contact the admin via email at:
            </Typography>

            <Typography
              variant="body1"
              fontWeight="bold"
              mb={3}
              sx={{ color: "#19AEDC", fontFamily: "albert sans" }}
            >
              bubaln@ticketb.in
            </Typography>

            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: "#19AEDC",
                color: "#fff",
                py: 1.5,
                borderRadius: "10px",
                fontFamily: "albert sans",
              }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={showForgotPasswordModal} onClose={handleCloseForgotPassword}>
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
              width: "400px",
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
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
              onClick={handleCloseForgotPassword}
            >
              <ArrowBack />
            </IconButton>

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
              sx={{ fontSize: "24px", fontFamily: "albert sans" }}
            >
              Reset Password
            </Typography>

            <Typography
              variant="body1"
              mb={2}
              sx={{ fontFamily: "albert sans" }}
            >
              Enter your email address to receive a password reset link.
            </Typography>

            <TextField
              fullWidth
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
              sx: {
                borderRadius: "12px",
                backgroundColor: "#F8F8F8",
                fontFamily:'albert sans'
              },}}
            />

            {resetMessage && (
              <Typography
                variant="body2"
                color={resetMessage.includes("sent") ? "green" : "error"}
                mb={2}
                sx={{ fontFamily: "albert sans" }}
              >
                {resetMessage}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: isResetEmailValid ? "#19AEDC" : "#ccc",
                color: "#fff",
                py: 1.5,
                borderRadius: "10px",
                cursor: isResetEmailValid ? "pointer" : "not-allowed",
                fontFamily: "albert sans",
              }}
              disabled={!isResetEmailValid || resetMessage.includes("sent")} // Disable after sending
              onClick={handleForgotPassword}
            >
              Send Reset Link
            </Button>

            {resetMessage.includes("sent") && (
              <Button
                fullWidth
                variant="contained"
                sx={{
                  bgcolor: "#19AEDC",
                  color: "#fff",
                  py: 1.5,
                  mt: 1,
                  borderRadius: "10px",
                  fontFamily: "albert sans",
                }}
                onClick={handleContinueToLogin}
              >
                Continue to Login
              </Button>
            )}
          </Box>
        </Box>
      </Modal>

      <Modal
        open={showResetPasswordModal}
        onClose={() => setShowResetPasswordModal(false)}
      >
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
              width: "400px",
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
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
              onClick={() => setShowResetPasswordModal(false)}
            >
              <ArrowBack />
            </IconButton>

            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
              sx={{ fontSize: "24px", fontFamily: "albert sans" }}
            >
              Set New Password
            </Typography>

            <Typography
              variant="body1"
              mb={2}
              sx={{ fontFamily: "albert sans" }}
            >
              Enter your new password below.
            </Typography>

            <TextField
              fullWidth
              placeholder="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
              sx: {
                borderRadius: "12px",
                backgroundColor: "#F8F8F8",
                fontFamily:'albert sans'
              },}}
            />

            <TextField
              fullWidth
              placeholder="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
              sx: {
                borderRadius: "12px",
                backgroundColor: "#F8F8F8",
                fontFamily:'albert sans'
              },}}
            />

            {resetError && (
              <Typography
                variant="body2"
                color="error"
                mb={2}
                sx={{ fontFamily: "albert sans" }}
              >
                {resetError}
              </Typography>
            )}

            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: isNewPasswordValid ? "#19AEDC" : "#ccc",
                color: "#fff",
                py: 1.5,
                borderRadius: "10px",
                cursor: isNewPasswordValid ? "pointer" : "not-allowed",
                fontFamily: "albert sans",
              }}
              disabled={!isNewPasswordValid}
              onClick={handleResetPassword}
            >
              Reset Password
            </Button>
          </Box>
        </Box>
      </Modal>

      <Modal open={showResetSuccessModal} onClose={handleReturnToLogin}>
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
              width: "400px",
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
              sx={{ fontSize: "24px", fontFamily: "albert sans" }}
            >
              Password Changed
            </Typography>

            <Typography
              variant="body1"
              mb={3}
              sx={{ fontFamily: "albert sans" }}
            >
              You can now sign in with your new password.
            </Typography>

            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: "#19AEDC",
                color: "#fff",
                py: 1.5,
                borderRadius: "10px",
                fontFamily: "albert sans",
              }}
              onClick={handleReturnToLogin}
            >
              Return to Login
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
};

export default Login;
