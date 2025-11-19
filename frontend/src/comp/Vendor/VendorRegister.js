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
import { db } from "../../firebase_config";
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
  const [loginCase, setLoginCase] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogState, setDialogState] = useState({
    open: false,
    message: "",
  });

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

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!password) return "Password is required";
    if (password.length < minLength) return "Password must be at least 8 characters long";
    if (!hasUpperCase) return "Password must contain at least one uppercase letter";
    if (!hasLowerCase) return "Password must contain at least one lowercase letter";
    if (!hasNumbers) return "Password must contain at least one number";
    if (!hasSpecialChar) return "Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>)";
    return "";
  };

  const PasswordRequirements = ({ password }) => {
    const requirements = [
      { test: password.length >= 8, text: "At least 8 characters" },
      { test: /[A-Z]/.test(password), text: "One uppercase letter" },
      { test: /[a-z]/.test(password), text: "One lowercase letter" },
      { test: /\d/.test(password), text: "One number" },
      { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), text: "One special character" }
    ];

    return (
      <Box sx={{ mt: 1, mb: 1 }}>
        <Typography variant="caption" sx={{ fontFamily: "Albert Sans", color: "#666", fontSize: "12px" }}>
          Password requirements:
        </Typography>
        {requirements.map((req, index) => (
          <Typography
            key={index}
            variant="caption"
            sx={{
              display: "block",
              fontFamily: "Albert Sans",
              color: req.test ? "#4caf50" : "#f44336",
              fontSize: "11px",
              ml: 1
            }}
          >
            {req.test ? "✓" : "✗"} {req.text}
          </Typography>
        ))}
      </Box>
    );
  };

  useEffect(() => {
    let isMounted = true;

    const fetchVendor = async () => {
      console.log("🔍 Starting vendor check for vendorId:", vendorId);
      setIsLoading(true);

      if (!vendorId) {
        console.log("No vendorId provided, showing new registration form");
        if (isMounted) {
          setLoginCase("new");
          setIsLoading(false);
        }
        return;
      }

      try {
        // Step 1: Fetch user data
        console.log("📡 Fetching user data from backend...");
        const res = await fetch(
          `${process.env.REACT_APP_API_BASE_URL}/api/user/current-user/${vendorId}`
        );

        if (!isMounted) return;

        if (!res.ok) {
          console.log("❌ User not found, showing new registration form");
          setLoginCase("new");
          setIsLoading(false);
          return;
        }

        const userData = await res.json();
        const userEmail = userData.email;
        console.log("✅ User data fetched, email:", userEmail);

        if (!isMounted) return;

        // Step 2: Check Firestore for vendor
        console.log("🔍 Checking Firestore for existing vendor...");
        const vendorsRef = collection(db, "vendors");
        const q = query(vendorsRef, where("email", "==", userEmail));
        const querySnapshot = await getDocs(q);

        if (!isMounted) return;

        if (!querySnapshot.empty) {
          const vendorDoc = querySnapshot.docs[0].data();
          console.log("📋 Vendor document found:", {
            email: vendorDoc.email,
            username: vendorDoc.username,
            status: vendorDoc.status,
            statusType: typeof vendorDoc.status
          });

          // Check if vendor is verified/approved
          // The status field in vendors collection should be true (Boolean) or "accepted" (string)
          const isVendorVerified =
            vendorDoc.status === true ||
            vendorDoc.status === "true" ||
            (typeof vendorDoc.status === "string" && vendorDoc.status.toLowerCase() === "accepted");

          console.log("🔐 Is vendor verified/approved?", isVendorVerified);

          if (isVendorVerified) {
            console.log("✅ VERIFIED VENDOR - Redirecting to login...");
            // Show a brief message before redirecting
            if (isMounted) {
              setDialogState({
                open: true,
                message: "Your account is already registered and verified. Redirecting to login..."
              });

              // Redirect after a short delay
              setTimeout(() => {
                navigate(`/vendorlogin/${vendorId}`, { replace: true });
              }, 1500);
            }
            return; // Exit early
          }

          // Step 3: If not verified in vendors collection, check registration_request
          console.log("🔍 Checking registration_request for approval status...");
          const registrationRef = collection(db, "registration_request");
          const regQuery = query(registrationRef, where("email", "==", userEmail));
          const regSnapshot = await getDocs(regQuery);

          let isRegistrationApproved = false;

          if (!regSnapshot.empty) {
            const regDoc = regSnapshot.docs[0].data();
            console.log("📋 Registration request found:", {
              email: regDoc.email,
              status: regDoc.status,
              statusType: typeof regDoc.status
            });

            // Check if status is "accepted" or "approved" (case-insensitive)
            isRegistrationApproved = regDoc.status &&
              (regDoc.status.toString().toLowerCase() === "approved" ||
               regDoc.status.toString().toLowerCase() === "accepted");

            console.log("🔐 Is registration approved?", isRegistrationApproved);
          } else {
            console.log("⚠️ No registration request found for this email");
          }

          if (isRegistrationApproved) {
            console.log("✅ APPROVED REGISTRATION - Redirecting to login...");
            if (isMounted) {
              setDialogState({
                open: true,
                message: "Your registration has been approved. Redirecting to login..."
              });

              setTimeout(() => {
                navigate(`/vendorlogin/${vendorId}`, { replace: true });
              }, 1500);
            }
            return; // Exit early
          }

          // Vendor exists but not approved
          console.log("⚠️ Vendor exists but NOT approved");
          if (isMounted) {
            setFormData({
              email: vendorDoc.email || "",
              username: vendorDoc.username || "",
              password: "",
              confirmPassword: "",
            });

            setLoginCase(vendorDoc?.type === "google-signin" ? "google" : "manual");
            setEmailExists(true);
            setErrors((prev) => ({
              ...prev,
              email: "Your registration is pending approval. Please wait for admin verification.",
            }));
          }
        } else {
          // No vendor found - use user data
          console.log("🆕 No vendor found, using user data for registration");
          if (isMounted) {
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
        }
      } catch (err) {
        console.error("❌ Error during vendor check:", err);
        if (isMounted) {
          setLoginCase("new");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVendor();

    return () => {
      isMounted = false;
    };
  }, [vendorId, navigate]);

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
      newErrors.email = "Your registration is pending approval";
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      newErrors.password = passwordError;
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
        showDialog("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

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
          Checking vendor status...
        </Typography>
      </Box>
    );
  }

  const leftSection = [
    {
      icon: <SettingsIcon sx={{ color: "#47536B" }} />,
      heading: "Seamless Control",
      content: "Effortlessly create, edit, and manage your events—all from one streamlined dashboard designed to save you time and effort.",
    },
    {
      icon: <HandymanIcon sx={{ color: "#47536B" }} />,
      heading: "Smart Tools,Smart Moves",
      content: "Leverage powerful features like real-time analytics, coupon controls, and category tagging to stay ahead and make data-driven decisions.",
    },
    {
      icon: <AutoFixHighIcon sx={{ color: "#47536B" }} />,
      heading: "Designed For Ease",
      content: "Navigate your vendor dashboard with a user-friendly interface that makes event setup and tracking feel natural—even for first-timers.",
    },
    {
      icon: <BarChartIcon sx={{ color: "#47536B" }} />,
      heading: "Built to Scale",
      content: "From small gatherings to grand events, our platform is built to grow with your business—ensuring dependable performance every step of the way.",
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
                  <Box mt="0.5%">{item.icon}</Box>
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
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": {
                fontFamily: "Albert Sans",
                "&.Mui-focused": { color: "#19AEDC" },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontFamily: "Albert Sans",
                "& fieldset": { borderColor: "#ccc" },
                "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                "&.Mui-error fieldset": { borderColor: "#d32f2f" },
              },
              "& .MuiFormHelperText-root": { fontFamily: "Albert Sans" },
            }}
            error={!!errors.username}
            helperText={errors.username}
          />

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
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": {
                fontFamily: "Albert Sans",
                "&.Mui-focused": { color: "#19AEDC" },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontFamily: "Albert Sans",
                "& fieldset": { borderColor: "#ccc" },
                "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                "&.Mui-error fieldset": { borderColor: "#d32f2f" },
              },
              "& .MuiFormHelperText-root": { fontFamily: "Albert Sans" },
            }}
            error={!!errors.email}
            helperText={errors.email}
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? "text" : "password"}
            name="password"
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            sx={{
              mb: 1,
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": {
                fontFamily: "Albert Sans",
                "&.Mui-focused": { color: "#19AEDC" },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontFamily: "Albert Sans",
                "& fieldset": { borderColor: "#ccc" },
                "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                "&.Mui-error fieldset": { borderColor: "#d32f2f" },
              },
              "& .MuiFormHelperText-root": { fontFamily: "Albert Sans" },
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

          {formData.password && (
            <PasswordRequirements password={formData.password} />
          )}

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
              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": {
                fontFamily: "Albert Sans",
                "&.Mui-focused": { color: "#19AEDC" },
              },
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
                fontFamily: "Albert Sans",
                "& fieldset": { borderColor: "#ccc" },
                "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                "&.Mui-error fieldset": { borderColor: "#d32f2f" },
              },
              "& .MuiFormHelperText-root": { fontFamily: "Albert Sans" },
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

          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={loading || emailExists}
            sx={{
              fontFamily: "albert sans",
              py: 1.5,
              backgroundColor: (loading || emailExists) ? "#ccc" : "#53a8d8",
              "&:hover": {
                backgroundColor: (loading || emailExists) ? "#ccc" : "#4795c2",
              },
              textTransform: "uppercase",
              borderRadius: "4px",
              boxShadow: "none",
            }}
          >
            {loading ? "Registering..." : "REGISTER"}
          </Button>

          <Box sx={{ display: "flex", mt: 2 }}>
            <Typography sx={{ fontFamily: "albert sans", color: "#333", mr: 1 }}>
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
        sx={{ zIndex: 9999 }}
        disableEscapeKeyDown={dialogState.message.includes("Redirecting")}
      >
        <DialogTitle sx={{ fontFamily: "albert sans" }}>Notice</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "albert sans" }}>
            {dialogState.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} color="primary" sx={{ fontFamily: "albert sans" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VendorRegister;