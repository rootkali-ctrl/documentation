import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Modal,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import Slider from "react-slick";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import img1 from "../QR image/Gemini_Generated_Image_ytw5d2ytw5d2ytw5.jpeg";
import img2 from "../QR image/ChatGPT Image Jun 5, 2025, 03_45_17 PM.png";
import img3 from "../QR image/Gemini_Generated_Image_70g27o70g27o70g2.jpeg";

axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL;

const VendorLogin = () => {
  const { vendorId } = useParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [showResetSuccessModal, setShowResetSuccessModal] = useState(false);
  const [handleError, setHandleError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [emailError, setEmailError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isFormValid = email.trim() !== "" &&
                     emailRegex.test(email) &&
                     password.trim() !== "";
  const isResetEmailValid = resetEmail.trim() !== "" && emailRegex.test(resetEmail);
  const isNewPasswordValid = newPassword.trim() !== "" &&
                           confirmPassword.trim() !== "" &&
                           newPassword === confirmPassword &&
                           newPassword.length >= 6;

  const images = [img1, img2, img3];

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
  };

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (token) {
      setShowResetPasswordModal(true);
    }
  }, [location]);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);

    if (value.trim() !== "" && !emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setHandleError("Please enter both email and password.");
      setOpenDialog(true);
      return;
    }

    if (!emailRegex.test(email)) {
      setHandleError("Please enter a valid email address.");
      setOpenDialog(true);
      return;
    }

    try {
      const response = await axios.post("/api/vendor/login", {
        email: email.toLowerCase(),
        password,
      });

      // Update last login
      await axios.post("/api/vendor/lastlogin", {
        email: email.toLowerCase(),
      });

      // Handle redirection based on status
      const { vendorId, status, redirectTo, Message } = response.data;

      if (redirectTo === "dashboard") {
        // Approved - go to dashboard
        navigate(`/vendorhome/${vendorId}`);
      } else if (redirectTo === "confirmation") {
        // Pending/Rejected/Removed - go to confirmation page
        navigate(`/vendor/confirmation`, {
          state: {
            status: status,
            message: Message,
            vendorId: vendorId
          }
        });
      } else {
        // Fallback for accepted status
        if (status === "accepted") {
          navigate(`/vendorhome/${vendorId}`);
        } else {
          setHandleError(Message);
          setOpenDialog(true);
        }
      }
    } catch (error) {
      console.error(error);
      setHandleError(
        error.response?.data?.Message || "Login failed. Please try again later."
      );
      setOpenDialog(true);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailRegex.test(resetEmail)) {
      setResetEmailError("Please enter a valid email address.");
      return;
    }

    setResetEmailError("");
    setResetMessage("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/forgot-password", {
        email: resetEmail
      });

      setResetMessage("Password reset email sent! Please check your inbox and spam folder.");
    } catch (error) {
      console.error("Password reset error:", error);

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || "Invalid request. Please try again.";
        setResetMessage(errorMessage);
      } else if (error.response?.status === 500) {
        setResetMessage("Server error. Please try again later.");
      } else {
        setResetMessage("Failed to send reset email. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (!token) {
      setResetError("Invalid reset link.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }

    setResetError("");
    setIsLoading(true);

    try {
      await axios.post("/api/auth/reset-password", {
        token,
        newPassword
      });

      setShowResetPasswordModal(false);
      setShowResetSuccessModal(true);
    } catch (error) {
      console.error("Password reset error:", error);

      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.error || "Invalid request. Please try again.";
        setResetError(errorMessage);
      } else if (error.response?.status === 500) {
        setResetError("Server error. Please try again later.");
      } else {
        setResetError("Failed to reset password. Please check your connection and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenForgotPassword = () => {
    setShowForgotPasswordModal(true);
    setResetEmail("");
    setResetMessage("");
    setResetEmailError("");
    setIsLoading(false);
  };

  const handleCloseForgotPassword = () => {
    setShowForgotPasswordModal(false);
    setResetEmail("");
    setResetMessage("");
    setResetEmailError("");
    setIsLoading(false);
  };

  const handleReturnToLogin = () => {
    setShowResetSuccessModal(false);
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    navigate("/vendor/login", { replace: true });
  };

  const handleContinueToLogin = () => {
    setShowForgotPasswordModal(false);
    setResetEmail("");
    setResetMessage("");
    setResetEmailError("");
  };

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#F9FAFB" }}>
      {/* Error Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle sx={{ fontFamily: "albert sans" }}>Error</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "albert sans" }}>
            {handleError}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setOpenDialog(false)}
            color="primary"
            sx={{ fontFamily: "albert sans" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Forgot Password Modal */}
      <Modal
        open={showForgotPasswordModal}
        onClose={handleCloseForgotPassword}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: "400px" },
            bgcolor: "white",
            borderRadius: 2,
            p: 4,
            boxShadow: 24,
            position: "relative",
          }}
        >
          <IconButton
            onClick={handleCloseForgotPassword}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <Close />
          </IconButton>

          <Typography
            variant="h5"
            sx={{
              fontFamily: "Albert Sans",
              fontWeight: "bold",
              mb: 3,
              textAlign: "center",
            }}
          >
            Reset Password
          </Typography>

          <TextField
            fullWidth
            label="Email Address"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            error={!!resetEmailError}
            helperText={resetEmailError}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
            }}
          />

          {resetMessage && (
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                mb: 2,
                p: 2,
                bgcolor: resetMessage.includes("sent") ? "#e8f5e8" : "#ffebee",
                color: resetMessage.includes("sent") ? "#2e7d32" : "#c62828",
                borderRadius: 1,
                fontSize: "14px",
              }}
            >
              {resetMessage}
            </Typography>
          )}

          <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleCloseForgotPassword}
              sx={{
                fontFamily: "Albert Sans",
              }}
            >
              Cancel
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleForgotPassword}
              disabled={!isResetEmailValid || isLoading}
              sx={{
                fontFamily: "Albert Sans",
                backgroundColor: "#53a8d8",
                "&:hover": { backgroundColor: "#4795c2" },
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : "Send Reset Link"}
            </Button>
          </Box>

          {resetMessage.includes("sent") && (
            <Button
              fullWidth
              variant="text"
              onClick={handleContinueToLogin}
              sx={{
                fontFamily: "Albert Sans",
                mt: 2,
                color: "#53a8d8",
              }}
            >
              Continue to Login
            </Button>
          )}
        </Box>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={showResetPasswordModal}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: "400px" },
            bgcolor: "white",
            borderRadius: 2,
            p: 4,
            boxShadow: 24,
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: "Albert Sans",
              fontWeight: "bold",
              mb: 3,
              textAlign: "center",
            }}
          >
            Set New Password
          </Typography>

          <TextField
            fullWidth
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
            }}
          />

          <TextField
            fullWidth
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
            }}
          />

          {resetError && (
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                mb: 2,
                p: 2,
                bgcolor: "#ffebee",
                color: "#c62828",
                borderRadius: 1,
                fontSize: "14px",
              }}
            >
              {resetError}
            </Typography>
          )}

          <Typography
            sx={{
              fontFamily: "Albert Sans",
              fontSize: "12px",
              color: "#666",
              mb: 3,
            }}
          >
            Password must be at least 6 characters long
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleResetPassword}
            disabled={!isNewPasswordValid || isLoading}
            sx={{
              fontFamily: "Albert Sans",
              backgroundColor: "#53a8d8",
              "&:hover": { backgroundColor: "#4795c2" },
            }}
          >
            {isLoading ? <CircularProgress size={24} /> : "Reset Password"}
          </Button>
        </Box>
      </Modal>

      {/* Success Modal */}
      <Modal
        open={showResetSuccessModal}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            width: { xs: "90%", sm: "400px" },
            bgcolor: "white",
            borderRadius: 2,
            p: 4,
            boxShadow: 24,
            textAlign: "center",
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontFamily: "Albert Sans",
              fontWeight: "bold",
              mb: 2,
              color: "#2e7d32",
            }}
          >
            Password Reset Successful!
          </Typography>

          <Typography
            sx={{
              fontFamily: "Albert Sans",
              mb: 3,
              color: "#666",
            }}
          >
            Your password has been successfully reset. You can now login with your new password.
          </Typography>

          <Button
            fullWidth
            variant="contained"
            onClick={handleReturnToLogin}
            sx={{
              fontFamily: "Albert Sans",
              backgroundColor: "#53a8d8",
              "&:hover": { backgroundColor: "#4795c2" },
            }}
          >
            Continue to Login
          </Button>
        </Box>
      </Modal>

      {/* Main Content */}
      <Box
        sx={{
          display: "flex",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: "90vh",
        }}
      >
        {/* Login Form */}
        <Box
          sx={{
            width: { xs: "100%", md: "45%" },
            textAlign: "left",
            boxSizing: "border-box",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            padding: { lg: "3% 2%", md: "3% 2%", sm: "10% 6%", xs: "10% 6%" },
            borderRadius: "10px",
            backgroundColor: "#fff",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              color: "#1a1033",
              fontFamily: "Albert Sans",
              fontSize: { xs: "2rem", md: "2.75rem" },
            }}
          >
            Log in
          </Typography>

          <TextField
            fullWidth
            value={email}
            onChange={handleEmailChange}
            variant="outlined"
            label="Email Address"
            type="email"
            error={!!emailError}
            helperText={emailError}
            sx={{
              marginTop: "1.5rem",
              backgroundColor: "#f8f7fc",
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: emailError ? "red" : "#ccc" },
              },
            }}
          />

          <TextField
            fullWidth
            variant="outlined"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{
              marginTop: "1rem",
              backgroundColor: "#f8f7fc",
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ccc" },
              },
            }}
          />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mt: "1rem",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: "16px",
                cursor: "pointer",
                color: "rgba(25, 174, 220, 1)",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={handleOpenForgotPassword}
            >
              Forgot password?
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            sx={{
              marginTop: "1.5rem",
              backgroundColor: "#53a8d8",
              color: "#fff",
              padding: "0.8rem",
              "&:hover": { backgroundColor: "#4795c2" },
              fontFamily: "Albert Sans",
            }}
            onClick={handleLogin}
            disabled={!isFormValid}
          >
            Log in
          </Button>

          <Box
            sx={{
              display: "flex",
              mt: "4%",
              gap: "2%",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: { xs: "16px", md: "18px" },
              }}
            >
              Don't have an account?
            </Typography>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: { xs: "16px", md: "18px" },
                cursor: "pointer",
                color: "rgba(25, 174, 220, 1)",
                fontWeight: "600",
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={() => navigate(`/vendor/register/${vendorId}`)}
            >
              Sign Up
            </Typography>
          </Box>
        </Box>

        {/* Carousel */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            textAlign: "center",
            display: { xs: "none", md: "flex" },
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              width: "100%",
              maxWidth: 600,
              borderRadius: 2,
              overflow: "hidden",
            }}
          >
            <Slider {...carouselSettings}>
              {images.map((img, index) => (
                <Box
                  key={index}
                  component="img"
                  src={img}
                  alt={`carousel-${index}`}
                  sx={{
                    width: "100%",
                    height: "360px",
                    display: "block",
                    objectFit: "cover",
                    borderRadius: 2,
                  }}
                />
              ))}
            </Slider>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default VendorLogin;