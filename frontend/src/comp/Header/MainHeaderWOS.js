import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Divider,
  useMediaQuery
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import Login from "../Login/Login";
import Signin from "../Signin/Signin";
import { auth } from "../../firebase_config";
import { onAuthStateChanged, signOut } from "firebase/auth";

const MainHeader = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [openLogin, setOpenLogin] = useState(false);
  const [openSignin, setOpenSignin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileDrawerOpen(!mobileDrawerOpen);
  };

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
        const derivedUsername = user.displayName || user.email.split("@")[0];
        setUsername(derivedUsername);

        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("loginType", "google");
      } else {
        setIsAuthenticated(false);
        setUsername("");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("loginType");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    setOpenLogin(false);
    setOpenSignin(false);
  };

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

  const navLinks = (
    <>
      <Typography
        onClick={() => navigate("/recentorders")}
        sx={{ 
          cursor: "pointer", 
          "&:hover": { 
            textDecoration: "underline", 
            fontFamily:'Albert Sans' 
          }, 
          fontFamily: 'Albert Sans' 
        }}
      >
        Recent Orders
      </Typography>
      <Typography
        onClick={() => navigate("/vendor/register")}
        sx={{ 
          cursor: "pointer", 
          "&:hover": { 
            textDecoration: "underline", 
            fontFamily: 'Albert Sans' 
          }, 
          fontFamily: 'Albert Sans' 
        }}
      >
        Create Events
      </Typography>
    </>
  );

  return (
    <Box sx={{ width: "100%", backgroundColor: "white", borderBottom: "1px solid rgb(238, 237, 242)" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "12px 10px" : "12px 24px",
          maxWidth: "100%",
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <Typography
          variant="h5"
          onClick={() => navigate("/")}
          sx={{
            fontFamily: 'Albert Sans',
            fontWeight: "900",
            fontSize: "30px",
            color: "rgb(25, 174, 220)",
            cursor: "pointer",
            paddingLeft: isMobile ? "10px" : "10",
          }}
        >
          ticketb
        </Typography>

        {/* Desktop Navigation */}
        {!isMobile && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
            {navLinks}
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
                    "&:hover": { bgcolor: "rgb(20, 140, 180)" },
                    fontSize: "1rem",
                    fontFamily: 'Albert Sans'
                  }}
                >
                  {username.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            ) : (
              <>
                <Typography
                  onClick={() => setOpenLogin(true)}
                  sx={{ 
                    cursor: "pointer", 
                    "&:hover": { 
                      textDecoration: "underline", 
                      fontFamily: 'Albert Sans' 
                    }, 
                    fontFamily: 'Albert Sans' 
                  }}
                >
                  Log In
                </Typography>
                <Typography
                  onClick={() => setOpenSignin(true)}
                  sx={{ 
                    cursor: "pointer", 
                    "&:hover": { 
                      textDecoration: "underline", 
                      fontFamily: 'Albert Sans' 
                    }, 
                    fontFamily: 'Albert Sans' 
                  }}
                >
                  Sign Up
                </Typography>
              </>
            )}
          </Box>
        )}

        {/* Mobile Menu Icon */}
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <MenuIcon />
          </IconButton>
        )}
      </Box>

      {/* Profile Dropdown Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{ 'aria-labelledby': 'profile-button' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 180,
            borderRadius: 2,
            paddingRight: "40px",
            fontFamily: 'Albert Sans'
          },
        }}
      >
        <MenuItem sx={{ fontFamily: 'Albert Sans', fontWeight: "bold", color: "rgb(25, 174, 220)" }}>
          {username}
        </MenuItem>
        <MenuItem onClick={handleProfileClick} sx={{ fontFamily: 'Albert Sans' }}>Profile</MenuItem>
        <MenuItem onClick={handleSettingsClick} sx={{ fontFamily: 'Albert Sans' }}>Settings</MenuItem>
        <MenuItem onClick={handleLogout} sx={{ fontFamily: 'Albert Sans' }}>Logout</MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer anchor="right" open={mobileDrawerOpen} onClose={handleDrawerToggle}>
        <Box sx={{ width: 250 }} role="presentation" onClick={handleDrawerToggle}>
          <List>
            {isAuthenticated && (
              <>
                <ListItem>
                  <ListItemText 
                    primary={`Hello, ${username}`} 
                    sx={{ 
                      fontFamily: 'Albert Sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'Albert Sans'
                      }
                    }} 
                  />
                </ListItem>
                <Divider />
              </>
            )}
            <ListItem button onClick={() => navigate("/recentorders")}>
              <ListItemText 
                primary="Recent Orders" 
                sx={{
                  fontFamily: 'Albert Sans',
                  '& .MuiListItemText-primary': {
                    fontFamily: 'Albert Sans'
                  }
                }}
              />
            </ListItem>
            <ListItem button onClick={() => navigate("/vendor/register")}>
              <ListItemText 
                primary="Create Events" 
                sx={{
                  fontFamily: 'Albert Sans',
                  '& .MuiListItemText-primary': {
                    fontFamily: 'Albert Sans'
                  }
                }}
              />
            </ListItem>
            {isAuthenticated ? (
              <>
                <ListItem button onClick={handleProfileClick}>
                  <ListItemText 
                    primary="Profile" 
                    sx={{
                      fontFamily: 'Albert Sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'Albert Sans'
                      }
                    }}
                  />
                </ListItem>
                <ListItem button onClick={handleSettingsClick}>
                  <ListItemText 
                    primary="Settings" 
                    sx={{
                      fontFamily: 'Albert Sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'Albert Sans'
                      }
                    }}
                  />
                </ListItem>
                <ListItem button onClick={handleLogout}>
                  <ListItemText 
                    primary="Logout" 
                    sx={{
                      fontFamily: 'Albert Sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'Albert Sans'
                      }
                    }}
                  />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem button onClick={() => setOpenLogin(true)}>
                  <ListItemText 
                    primary="Log In" 
                    sx={{
                      fontFamily: 'Albert Sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'Albert Sans'
                      }
                    }}
                  />
                </ListItem>
                <ListItem button onClick={() => setOpenSignin(true)}>
                  <ListItemText 
                    primary="Sign Up" 
                    sx={{
                      fontFamily: 'Albert Sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'Albert Sans'
                      }
                    }}
                  />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>

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