import React, { useState, useEffect } from "react";
import { Box, Typography, IconButton, Menu, MenuItem, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Login from "../Login/Login";
import Signin from "../Signin/Signin";
import { auth } from "../../firebase_config";
import { onAuthStateChanged, signOut } from "firebase/auth";

const MainHeader = () => {
  const navigate = useNavigate();
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignin, setOpenSignin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  // Profile dropdown menu state
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  // Handle dropdown open/close
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

 useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      setIsAuthenticated(true);
      const derivedUsername = user.displayName || user.email.split('@')[0];
      setUsername(derivedUsername);

      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("loginType", "google"); // Set manually for now — can enhance later
    } else {
      setIsAuthenticated(false);
      setUsername("");

      // 🔄 Clear on logout
      localStorage.removeItem("userEmail");
      localStorage.removeItem("loginType");
    }
  });

  return () => unsubscribe();
}, []);

  // Function to handle successful login
  const handleLoginSuccess = () => {
    setOpenLogin(false);
    setOpenSignin(false);
  };

  // Function to handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      handleClose();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleSwitchToSignUp = () => {
    setOpenLogin(false);
    setOpenSignin(true);
  };

  const handleSwitchToLogin = () => {
    setOpenLogin(true);
    setOpenSignin(false);
  };

  const handleProfileClick = () => {
    navigate("/profile");
    handleClose();
  };

  const handleSettingsClick = () => {
    navigate("/settings");
    handleClose();
  };

  return (
    <Box>
      <Box sx={{ padding: "12px 24px", backgroundColor: "white", borderBottom: "1px solid rgb(238, 237, 242)" }}>
        <Box sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%"
        }}>
          {/* Logo/Title */}
          <Typography
            variant="h5"
            onClick={() => navigate("/")}
            sx={{
              fontFamily: "'Albert Sans', sans-serif",
              fontWeight: "900",
              fontSize: "30px",
              color: "rgb(25, 174, 220)",
              cursor: "pointer",
            }}
          >
            ticketb
          </Typography>

          {/* Navigation Links or Profile Icon - Moved to right side */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Typography sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
              Recent Orders
            </Typography>
            <Typography onClick={() => navigate("/vendor/register")} sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
              Create Events
            </Typography>

            {isAuthenticated ? (
              <IconButton
                onClick={handleClick}
                size="large"
                aria-controls={open ? "profile-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
              >
                <Avatar
                  sx={{
                    width: 35,
                    height: 35,
                    bgcolor: "rgb(25, 174, 220)",
                    "&:hover": { bgcolor: "rgb(20, 140, 180)" }
                  }}
                >
                  {username.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            ) : (
              <>
                <Typography onClick={() => setOpenLogin(true)} sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                  Log In
                </Typography>
                <Typography onClick={() => setOpenSignin(true)} sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}>
                  Sign Up
                </Typography>
              </>
            )}
          </Box>

          {/* Profile Dropdown Menu */}
          <Menu
            id="profile-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            MenuListProps={{
              'aria-labelledby': 'profile-button',
            }}
            PaperProps={{
              elevation: 3,
              sx: {
                mt: 1.5,
                minWidth: 180,
                borderRadius: 2,
              }
            }}
          >
            <MenuItem sx={{ fontFamily: "'Albert Sans', sans-serif", fontWeight: "bold", color: "rgb(25, 174, 220)" }}>
              {username}
            </MenuItem>
            <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
            <MenuItem onClick={handleSettingsClick}>Settings</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Login and Signin Modals */}
      <Login
        open={openLogin}
        handleClose={() => setOpenLogin(false)}
        handleSwitchToSignUp={handleSwitchToSignUp}
        onLoginSuccess={handleLoginSuccess}
      />
      <Signin
        open={openSignin}
        handleClose={() => setOpenSignin(false)}
        handleSwitchToLogin={handleSwitchToLogin}
        onSigninSuccess={handleLoginSuccess}
      />
    </Box>
  );
};

export default MainHeader;