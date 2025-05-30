import { useState, useEffect } from "react";
import { TextField, Button, Box, Typography, Modal, IconButton, CircularProgress } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Header from "../Header/MainHeader";
import axios from "axios";

// Set the base URL for Axios (adjust if your backend runs on a different port)
axios.defaults.baseURL = `${process.env.REACT_APP_API_BASE_URL}`;

const VendorLogin = () => {
  const {vendorId} = useParams();
  const [username, setUsername] = useState("");
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
  const navigate = useNavigate();
  const location = useLocation();
  const isFormValid = username.trim() !== "" && password.trim() !== "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isResetEmailValid = resetEmail.trim() !== "" && emailRegex.test(resetEmail);
  const isNewPasswordValid = newPassword.trim() !== "" && confirmPassword.trim() !== "" && newPassword === confirmPassword;

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const token = query.get("token");

    if (token) {
      setShowResetPasswordModal(true);
    }
  }, [location]);


const handleLogin = async () => {
  if (!username || !password) {
    alert("Please enter both username and password.");
    return;
  }

  try {
    const response = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/vendor/login`, {
      username, password
    });

    if (response.data.Message === "Login successful") {
      navigate(`/vendorhome/${response.data.vendorId}`);
    } else {
      alert(response.data.Message);
    }
  } catch (error) {
    console.error(error);
    alert(
      "Login failed. " +
      (error.response?.data?.Message || "Please try again later.")
    );
  }
};

  const handleForgotPassword = async () => {
    if (!emailRegex.test(resetEmail)) {
      setResetEmailError("Please enter a valid email address.");
      return;
    }

    setResetEmailError("");
    setIsLoading(true);

    try {
      await axios.post("/api/auth/forgot-password", { email: resetEmail });
      setResetMessage("Password reset email sent! Please check your inbox.");
    } catch (error) {
      console.error("Password reset error:", error);
      if (error.response?.status === 404) {
        setResetMessage("Password reset endpoint not found. Please contact support.");
      } else {
        setResetMessage(
          error.response?.data?.Message || "Failed to send reset email. Please try again."
        );
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

    try {
      await axios.post("/api/auth/reset-password", { token, newPassword });
      setShowResetPasswordModal(false);
      setShowResetSuccessModal(true);
    } catch (error) {
      console.error("Password reset error:", error);
      if (error.response?.status === 404) {
        setResetError("Password reset endpoint not found. Please contact support.");
      } else {
        setResetError(
          error.response?.data?.Message || "Failed to reset password. Please try again."
        );
      }
    }
  };

  const handleReturnToLogin = () => {
    setShowResetSuccessModal(false);
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    navigate("/vendor/login");
  };

  const handleContinueToLogin = () => {
    setShowForgotPasswordModal(false);
    setResetEmail("");
    setResetMessage("");
    setResetEmailError("");
  };

  return (
    <Box>
      <Header />
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "center",
          alignItems: "center",
          height: { xs: "auto", md: "70vh" },
          width: { xs: "90%", md: "80%" },
          margin: "2% auto",
          backgroundColor: "#fff",
          padding: { xs: "2rem 1rem", md: "0" },
          gap: { xs: 4, md: 0 },
          mt: { xs: 8, md: 3 },
        }}
      >
        <Box
          sx={{
            width: { xs: "100%", md: "30%" },
            textAlign: "left",
            padding: { xs: "1rem", md: "2rem" },
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
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            variant="outlined"
            label="Username"
            sx={{
              marginTop: "1.5rem",
              backgroundColor: "#f8f7fc",
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ccc" },
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
  
        <Box
          sx={{
            width: { xs: "100%", md: "40%" },
            textAlign: "center",
            display:{xs:"none",md:"flex"},
            justifyContent: "center",

          }}
        >
          <DotLottieReact
            src="https://lottie.host/406de304-1af8-4a76-8a1a-32e373c0f5c7/H3sA86OQbV.lottie"
            loop
            autoplay
            style={{
              width: "100%",
              maxWidth: "400px",
              
            }}
          />
        </Box>
      </Box>
      {/* <Footer /> */}
      {/* Modal code continues here (unchanged) */}
    </Box>
  );
  
};

export default VendorLogin;