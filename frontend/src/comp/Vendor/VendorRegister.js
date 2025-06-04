import React, { useState, useEffect, useCallback } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useVendor } from "./VendorContext";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebase/firebase_config";
import SettingsIcon from "@mui/icons-material/Settings";
import HandymanIcon from "@mui/icons-material/Handyman";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import BarChartIcon from "@mui/icons-material/BarChart";

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

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchVendor = async () => {
      setIsLoading(true);

      if (vendorId) {
        try {
          // Step 1: Fetch from users collection via backend
          const res = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/user/current-user/${vendorId}`
          );

          if (!isMounted) return;

          if (!res.ok) {
            console.log("User not found or error occurred");
            setLoginCase("new");
            return;
          }

          const userData = await res.json();
          const userEmail = userData.email;

          if (!isMounted) return;

          // Step 2: Firestore - Check if vendor exists by email
          const vendorsRef = collection(db, "vendors");
          const q = query(vendorsRef, where("email", "==", userEmail));
          const querySnapshot = await getDocs(q);

          if (!isMounted) return;

          if (!querySnapshot.empty) {
            // Vendor exists - use vendor data instead of user data
            const vendorDoc = querySnapshot.docs[0].data();
            console.log("Vendor data from Firestore:", vendorDoc);

            setFormData({
              email: vendorDoc.email || "",
              username: vendorDoc.username || "",
              password: "",
              confirmPassword: "",
            });

            setLoginCase(
              vendorDoc?.type === "google-signin" ? "google" : "manual"
            );

            setEmailExists(true);
            setErrors((prev) => ({
              ...prev,
              email: "Email already registered as vendor.  Please login",
            }));
          } else {
            // Vendor doesn't exist - fallback to user data
            setFormData({
              email: userData.email || "",
              username: userData.username || "",
              password: userData.password || "",
              confirmPassword: userData.password || "",
            });

            if (userData?.type === "google-signin") {
              setLoginCase("google");
            } else if (userData.email) {
              setLoginCase("manual");
            } else {
              setLoginCase("new");
            }
          }
        } catch (err) {
          console.error("Error fetching data:", err);
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

        showDialog("Something went wrong.  Please try again.");
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

  const leftSection = [
    {
      icon: <SettingsIcon sx={{ color: "#47536B" }} />,
      heading: "Seamless Control",
      content:
        "Effortlessly create, edit, and manage your events—all from one streamlined dashboard designed to save you time and effort.",
    },
    {
      icon: <HandymanIcon sx={{ color: "#47536B" }} />,
      heading: "Smart Tools,Smart Moves",
      content:
        "Leverage powerful features like real-time analytics, coupon controls, and category tagging to stay ahead and make data-driven decisions.",
    },
    {
      icon: <AutoFixHighIcon sx={{ color: "#47536B" }} />,
      heading: "Designed For Ease",
      content:
        "Navigate your vendor dashboard with a user-friendly interface that makes event setup and tracking feel natural—even for first-timers.",
    },
    {
      icon: <BarChartIcon sx={{ color: "#47536B" }} />,
      heading: "Built to Scale",
      content:
        "From small gatherings to grand events, our platform is built to grow with your business—ensuring dependable performance every step of the way.",
    },
  ];

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#F9FAFB" }}>
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
        {/* Left: Text/animaton */}
        <Box
          sx={{
            width: { xs: "0%", md: "45%" },
            display: { xs: "none", md: "flex" },
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              sx={{
                fontFamily: "albert sans",
                color: "#19AEDC",
                fontSize: "45px",
                fontWeight: "600",
                mb: "1rem",
              }}
            >
              Ticketb
            </Typography>

            {leftSection.map((item, index) => (
              <Box key={index} sx={{ margin: "0 0 0 3%" }}>
                <Box sx={{ display: "flex", gap: "3%", margin: "2% 0" }}>
                  <Box mt="0.5%"> {item.icon}</Box>
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "albert sans",
                        fontWeight: "600",
                        fontSize: "18px",
                        color: "#47536B",
                      }}
                    >
                      {item.heading}
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "albert sans",
                        fontSize: "14px",
                        color: "#47536B",
                      }}
                    >
                      {item.content}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Right: Registration*/}
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            width: { xs: "100%", md: "45%" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
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
              color: "#1e1e1e",
              fontFamily: "albert sans",
              fontSize: { xs: "30px", md: "38px" },
              marginBottom: { xs: "1rem", md: "2.5rem" },
            }}
          >
            Vendor Register {loginCase === "google" && "(Google Sign-in)"}
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
              onClick={() => navigate(`/vendorlogin/${vendorId}`)}
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
      </Box>

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
    </Box>
  );
};

export default VendorRegister;
