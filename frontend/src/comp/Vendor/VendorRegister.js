import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useNavigate } from "react-router-dom";
import { useVendor } from "./VendorContext";
import { useParams } from "react-router-dom";

const VendorRegister = () => {
  const navigate = useNavigate();
  const { setVendorData } = useVendor();
  const { vendorId } = useParams();

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [loginCase, setLoginCase] = useState(null); // null | 'new' | 'manual' | 'google'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Update in VendorRegister.js component
  // Update the fetch URL to match the backend route

  useEffect(() => {
    let isMounted = true;

    const fetchVendor = async () => {
      setIsLoading(true);

      if (vendorId) {
        try {
          const res = await fetch(
            `http://localhost:8080/api/user/current-user/${vendorId}`
          );

          // Check if component is still mounted before updating state
          if (!isMounted) return;

          if (!res.ok) {
            console.log("Vendor not found or error occurred");
            setLoginCase("new");
            return;
          }

          const data = await res.json();
          console.log("Fetched vendor:", data);

          // Only update if component is still mounted
          if (!isMounted) return;

          setFormData({
            email: data.email || "",
            username: data.username || "",
            password: data.password || "",
            confirmPassword: data.password || "",
          });

          // Set login case based on the data type
          if (data?.type === "google-signin") {
            setLoginCase("google");
          } else if (data.email) {
            setLoginCase("manual");
          } else {
            setLoginCase("new");
          }

          try {
            // Update the URL to match the backend route
            const emailRes = await fetch(
              `http://localhost:8080/api/vendor/check-email?email=${data.email}`
            );

            if (!isMounted) return;

            const emailData = await emailRes.json();
            if (emailData.exists) {
              setEmailExists(true);
              setErrors((prev) => ({
                ...prev,
                email: "Email already registered as vendor",
              }));
            }
          } catch (err) {
            console.error("Error checking email:", err);
          }
        } catch (err) {
          console.error("Error fetching vendor:", err);
          if (isMounted) {
            setLoginCase("new");
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
      } else {
        if (isMounted) {
          setLoginCase("new");
          setIsLoading(false);
        }
      }
    };

    fetchVendor();

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  }, [vendorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    setErrors({
      ...errors,
      [name]: "",
    });
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.username && loginCase !== "google") {
      newErrors.username = "Username is required";
    }

    if (!formData.email) {
      newErrors.email = "Email ID is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (emailExists) {
      newErrors.email = "Email already registered as vendor";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Enter password again";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);
      const { confirmPassword, ...dataToSend } = formData;

      try {
        setVendorData(dataToSend);
        navigate("/vendor/organization");
      } catch (error) {
        console.error("Error submitting form:", error.message);
        alert("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log("Current loginCase:", loginCase);
  }, [loginCase]);

  // Show loading state until we determine the login case
  if (isLoading) {
    return (
      <Box
        sx={{
          width: "100%",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
        <Typography variant="h5" sx={{ fontFamily: "albert sans", ml: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#fff" }}>
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
        {/* Left: Registration Form */}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: { xs: "100%", md: "45%" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              color: "#1e1e1e",
              fontFamily: "albert sans",
              fontSize: { xs: "2rem", md: "2.5rem" },
              marginBottom: "2rem",
            }}
          >
            Register {loginCase === "google" && "(Google Sign-in)"}
          </Typography>

          <TextField
            fullWidth
            label="Username"
            name="username"
            variant="outlined"
            value={formData.username}
            onChange={handleChange}
            disabled={loginCase === "google" || loginCase === "manual"}
           sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                fontFamily: "Albert Sans",
              },
              "& .MuiInputLabel-root": {
                fontFamily: "Albert Sans",
                "&.Mui-focused": {
                  color: "#19AEDC", 
                },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontFamily: "Albert Sans",
                "& fieldset": {
                  borderColor: "#ccc",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#19AEDC", 
                },

                "&.Mui-error fieldset": {
                  borderColor: "#d32f2f",
                },
              },
              "& .MuiFormHelperText-root": {
                fontFamily: "Albert Sans",
              },
            }}
            error={!!errors.username}
            helperText={errors.username}
          />

          {/* Email */}
          <TextField
            fullWidth
            label="Email ID"
            name="email"
            variant="outlined"
            disabled={loginCase === "google" || loginCase === "manual"}
            value={formData.email}
            onChange={handleChange}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                fontFamily: "Albert Sans",
              },
              "& .MuiInputLabel-root": {
                fontFamily: "Albert Sans",
                "&.Mui-focused": {
                  color: "#19AEDC", 
                },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontFamily: "Albert Sans",
                "& fieldset": {
                  borderColor: "#ccc",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#19AEDC", 
                },

                "&.Mui-error fieldset": {
                  borderColor: "#d32f2f",
                },
              },
              "& .MuiFormHelperText-root": {
                fontFamily: "Albert Sans",
              },
            }}
            error={!!errors.email}
            helperText={errors.email}
          />

          {/* Password */}
          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                fontFamily: "Albert Sans",
              },
              "& .MuiInputLabel-root": {
                fontFamily: "Albert Sans",
                "&.Mui-focused": {
                  color: "#19AEDC", 
                },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontFamily: "Albert Sans",
                "& fieldset": {
                  borderColor: "#ccc",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#19AEDC", 
                },

                "&.Mui-error fieldset": {
                  borderColor: "#d32f2f",
                },
              },
              "& .MuiFormHelperText-root": {
                fontFamily: "Albert Sans",
              },
            }}
            error={!!errors.password}
            helperText={errors.password}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Confirm Password */}
          <TextField
            fullWidth
            label="Confirm Password"
            type={showConfirmPassword ? "text" : "password"}
            name="confirmPassword"
            variant="outlined"
            value={formData.confirmPassword}
            onChange={handleChange}
           sx={{
              mb: 2,
              "& .MuiInputBase-input": {
                fontFamily: "Albert Sans",
              },
              "& .MuiInputLabel-root": {
                fontFamily: "Albert Sans",
                "&.Mui-focused": {
                  color: "#19AEDC", 
                },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontFamily: "Albert Sans",
                "& fieldset": {
                  borderColor: "#ccc",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#19AEDC", 
                },

                "&.Mui-error fieldset": {
                  borderColor: "#d32f2f",
                },
              },
              "& .MuiFormHelperText-root": {
                fontFamily: "Albert Sans",
              },
            }}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {/* Submit Button */}
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              fontFamily: "albert sans",
              py: 1.5,
              backgroundColor: loading ? "#ccc" : "#53a8d8",
              "&:hover": {
                backgroundColor: loading ? "#ccc" : "#4795c2",
              },
              textTransform: "uppercase",
              borderRadius: "4px",
              boxShadow: "none",
            }}
          >
            {loading ? "Registering..." : "REGISTER"}
          </Button>

          {/* Redirect to Login */}
          <Box sx={{ display: "flex", mt: 2 }}>
            <Typography
              sx={{ fontFamily: "albert sans", color: "#333", mr: 1 }}
            >
              Already have an account?
            </Typography>
            <Typography
              onClick={() => navigate("/vendorlogin")}
              sx={{
                fontFamily: "albert sans",
                color: "#53a8d8",
                cursor: "pointer",
              }}
            >
              Log in
            </Typography>
          </Box>
        </Box>

        {/* Right: Lottie Animation */}
        <Box
          sx={{
            width: { xs: "0%", md: "45%" },
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <DotLottieReact
            src="https://lottie.host/3f2a1b67-ce42-4f14-b422-96ec411f8dbb/XqSQAleGb4.lottie"
            loop
            autoplay
            style={{ width: "100%", height: "auto" }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default VendorRegister;
