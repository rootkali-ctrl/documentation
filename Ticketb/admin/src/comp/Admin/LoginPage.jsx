import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase_config";

export const Body = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  const formFields = [
    {
      id: "email",
      label: "Email Address",
      placeholder: "Enter your email",
      type: "email",
    },
    {
      id: "password",
      label: "Password",
      placeholder: "Enter your password",
      type: "password",
    },
  ];

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Check if the user is an admin
      const adminDocRef = doc(db, "admins", user.uid);
      const adminDoc = await getDoc(adminDocRef);
      if (!adminDoc.exists()) {
        throw new Error("You do not have admin privileges.");
      }

      // Update last login timestamp
      await updateDoc(adminDocRef, {
        lastlogin: new Date().toISOString(),
      });

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/admin/dashboardupcoming");
      }, 2000);
    } catch (error) {
      console.error("Login error:", error);
      setError(error.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      position="relative"
      bgcolor="#f3f4f6"
    >
      {/* Header */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="89px"
        bgcolor="#f9fafb"
        borderBottom="1px solid #e0e0e0"
        display="flex"
        alignItems="center"
        paddingLeft={4}
      >
        <Typography variant="h4" component="div" fontWeight="900">
          <Box component="span" color="#19aedc">
            ticketb
          </Box>
          <Box component="span" color="black">
            admin
          </Box>
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        width="100%"
        maxWidth={534}
        margin="auto"
        paddingTop={12}
        paddingBottom={4}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography variant="h3" fontWeight={600} align="center" gutterBottom>
          IT'S YOU AGAIN..
        </Typography>

        <Card
          sx={{
            width: 448,
            borderRadius: "50px",
            boxShadow: "0px 25px 50px rgba(0,0,0,0.25)",
            mt: 8,
            bgcolor: "#ffffff",
          }}
        >
          <CardContent sx={{ px: 4, py: 6 }}>
            {/* Header */}
            <Box display="flex" flexDirection="column" alignItems="center" mb={6}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                Welcome Back!
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={2}>
                Log in to continue to ticketb
              </Typography>
            </Box>

            {/* Display Success/Error Messages */}
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

            {/* Login Form */}
            <Box component="form" noValidate autoComplete="off" onSubmit={handleLogin}>
              {formFields.map((field) => (
                <Box key={field.id} mb={3}>
                  <TextField
                    id={field.id}
                    label={field.label}
                    type={field.type}
                    placeholder={field.placeholder}
                    variant="outlined"
                    fullWidth
                    value={formData[field.id]}
                    onChange={handleInputChange}
                    InputProps={{ style: { borderRadius: 12, height: 50 } }}
                    disabled={loading}
                  />
                </Box>
              ))}

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <FormControlLabel
                  control={
                    <Checkbox
                      color="primary"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label="Remember me"
                />
                <Link
                  href="#"
                  underline="hover"
                  sx={{
                    background: "linear-gradient(to bottom, #0a9bfb, #0f0e14)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: 14,
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                variant="contained"
                fullWidth
                type="submit"
                sx={{
                  bgcolor: "#19aedc",
                  color: "#fff",
                  py: 1.5,
                  borderRadius: 4,
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "#19aedc",
                    opacity: 0.9,
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Log In"}
              </Button>

              <Box mt={4} textAlign="center">
                <Typography variant="body2">
                  <Box component="span" color="text.secondary">
                    Don't have an account?
                  </Box>
                  <Link
                    href="#"
                    fontWeight={500}
                    color="#19aedc"
                    underline="hover"
                    onClick={() => navigate("/admin/signin")}
                  >
                    {" "}
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default Body;