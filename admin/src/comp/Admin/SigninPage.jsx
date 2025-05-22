import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Link,
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase_config";

export const Signin = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

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
    {
      id: "confirmPassword",
      label: "Confirm Password",
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

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      // Create user with Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Save user details to Firestore (admins collection)
      const adminDocRef = doc(db, "admins", user.uid);
      await setDoc(adminDocRef, {
        email: formData.email,
        accountcreated: new Date().toISOString(),
        lastlogin: new Date().toISOString(),
        isAdmin: true,
      });

      setSuccess("Sign-up successful! Redirecting...");
      setTimeout(() => {
        navigate("/admin/dashboardupcoming");
      }, 2000);
    } catch (error) {
      console.error("Sign-up error:", error);
      setError(error.message || "Failed to sign up. Please try again.");
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
          HELLO ADMIN!
        </Typography>

        <Card
          sx={{
            width: 448,
            borderRadius: "40px",
            boxShadow: "0px 25px 50px rgba(0,0,0,0.25)",
            mt: 4,
            bgcolor: "#ffffff",
          }}
        >
          <CardContent sx={{ px: 4, py: 6 }}>
            {/* Header */}
            <Box display="flex" flexDirection="column" alignItems="center" mb={5}>
              <Typography
                variant="h6"
                fontWeight="900"
                align="center"
                color="text.primary"
                sx={{ textTransform: "uppercase", lineHeight: 1.2 }}
              >
                ROLL THE <br /> CARPET!
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={2}>
                Sign up to continue to ticketb
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

            {/* Signup Form */}
            <Box component="form" noValidate autoComplete="off" onSubmit={handleSignUp}>
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

              <Button
                variant="contained"
                fullWidth
                type="submit"
                sx={{
                  bgcolor: "#19aedc",
                  color: "#fff",
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  fontSize: 16,
                  mt: 1,
                  "&:hover": {
                    bgcolor: "#19aedc",
                    opacity: 0.9,
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : "Sign Up"}
              </Button>

              <Box mt={4} textAlign="center">
                <Typography variant="body2">
                  <Box component="span" color="text.secondary">
                    Already have an account?
                  </Box>
                  <Link
                    href="#"
                    fontWeight={500}
                    color="#19aedc"
                    underline="hover"
                    onClick={() => navigate("/admin/login")}
                  >
                    {" "}
                    Log in
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

export default Signin;