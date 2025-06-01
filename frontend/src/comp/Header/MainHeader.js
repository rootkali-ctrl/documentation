import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useNavigate } from "react-router-dom";
import Login from "../Login/Login";
import Signin from "../Signin/Signin";
import { auth } from "../../firebase_config";
import { onAuthStateChanged, signOut } from "firebase/auth";

const MainHeader = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:700px)");

  const [openLogin, setOpenLogin] = useState(false);
  const [openSignin, setOpenSignin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const derivedUsername = user.displayName || user.email.split("@")[0];
        setUsername(derivedUsername);

        try {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/user/post-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });

          const data = await res.json();
          if (res.ok) {
            localStorage.setItem("vendorId", data.vendorId);
          } else {
            console.error("Vendor not found:", data.message);
          }
        } catch (error) {
          console.error("Error fetching vendor data:", error);
        }
      } else {
        setIsAuthenticated(false);
        setUsername("");
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
      navigate("/");
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

  const handleRecentOrdersClick = () => {
    if (isAuthenticated) {
      navigate("/recentorders");
    } else {
      setOpenLogin(true);
    }
  };

  const renderDrawerMenu = () => (
    <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
      <Box sx={{ width: 200, padding: 1 }}>
      <Box mb={4} sx={{zIndex:10}}>
        <IconButton onClick={() => setDrawerOpen(false)} sx={{ float: "right" }}>
          <CloseIcon onClick={() => setDrawerOpen(false)} />   
        </IconButton>
      </Box>
      <Box>
        <List>
        {isAuthenticated ? (
            <>
              <ListItem>
                <ListItemText primary={username} sx={{color:"rgb(25, 174, 220)",fontFamily:'albert sans'}}/>
              </ListItem>
              <ListItem button onClick={handleProfileClick}>
                <ListItemText sx={{fontFamily:'albert sans'}} primary="Profile" />
              </ListItem>
              <ListItem button onClick={handleSettingsClick}>
                <ListItemText sx={{fontFamily:'albert sans'}} primary="Settings" />
              </ListItem>
              {/* <ListItem button onClick={handleLogout}>
                <ListItemText primary="Logout" />
              </ListItem> */}
            </>
          ) : (
            <>
              <ListItem button onClick={() => setOpenLogin(true)}>
                <ListItemText primary="Log In" sx={{fontFamily:'albert sans'}} />
              </ListItem>
              <ListItem button onClick={() => setOpenSignin(true)}>
                <ListItemText primary="Sign Up" sx={{fontFamily:'albert sans'}}  />
              </ListItem>
            </>
          )}
          <ListItem button onClick={handleRecentOrdersClick}>
            <ListItemText primary="Recent Orders" sx={{fontFamily:'albert sans'}}  />
          </ListItem>
          <ListItem
            button
            onClick={() => {
              if (!isAuthenticated) {
                setOpenLogin(true);
              } else {
                const vendorId = localStorage.getItem("vendorId");
                navigate(`/vendor/register/${vendorId}`);
              }
            }}
            
          >
            <ListItemText primary="Create Events" sx={{fontFamily:'albert sans'}}  />
          </ListItem>
          {isAuthenticated ? (
            <>
              <ListItem button onClick={handleLogout}>
                <ListItemText primary="Logout" sx={{fontFamily:'albert sans'}}  />
              </ListItem>
            </>
          ) : null}
        </List>
      </Box>
      </Box>
    </Drawer>
  );

  return (
    <Box>
      <Box
        sx={{
          margin: "0% 0% 0% 0%",
          backgroundColor: "white",
          paddingBottom: "6px",
          paddingTop: "11px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "95%",
            margin: "0 auto",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          {/* Logo */}
          <Typography
            variant="h5"
            onClick={() => navigate("/")}
            sx={{
              fontFamily: 'albert sans',
              fontWeight: "900",
              fontSize: "30px",
              color: "rgb(25, 174, 220)",
              cursor: "pointer",
            }}
          >
            ticketb
          </Typography>

          {/* Search + Location */}
          {!isMobile && (
            <Box
              sx={{
                width: "36%",
                minWidth: "30%",
                maxWidth: "36%",
                border: "1px solid rgb(170, 170, 170)",
                borderRadius: "40px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", padding: "1% 2%", width: "100%" }}>
                <SearchIcon sx={{ color: "gray", marginRight: "4%" }} />
                <InputBase
                  placeholder="Search events"
                  sx={{
                    fontFamily: 'albert sans',
                    fontSize: "16px",
                    flex: 1,
                    border: "none",
                    outline: "none",
                  }}
                />
              </Box>
              <Box sx={{ height: "40px", borderLeft: "2px solid rgb(170, 170, 170)", display: "flex", alignItems: "center" }} />
              <Box sx={{ display: "flex", alignItems: "center", padding: "0.5% 2%", width: "100%" }}>
                <LocationOnIcon sx={{ color: "gray", marginRight: "4%" }} />
                <Typography
                  variant="body1"
                  sx={{ fontFamily: 'albert sans', fontSize: "16px", flex: 1 }}
                >
                  Coimbatore
                </Typography>
                <IconButton
                  sx={{
                    backgroundColor: "rgb(25, 174, 220)",
                    color: "white",
                    marginX: "2%",
                    borderRadius: "60%",
                    width: "32px",
                    height: "32px",
                    "&:hover": { backgroundColor: "rgb(20, 140, 180)" },
                  }}
                >
                  <SearchIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          )}

          {/* Nav Items */}
          {!isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Typography
                onClick={handleRecentOrdersClick}
                sx={{ cursor: "pointer", fontFamily:'albert sans', "&:hover": { textDecoration: "underline", fontFamily:'albert sans' } }}
              >
                Recent Orders
              </Typography>
              <Typography
                onClick={() => {
                  if (!isAuthenticated) {
                    setOpenLogin(true);
                  } else {
                    const vendorId = localStorage.getItem("vendorId");
                    navigate(`/vendor/register/${vendorId}`);
                  }
                }}
                sx={{ cursor: "pointer",fontFamily:'albert sans', "&:hover": { textDecoration: "underline" ,fontFamily:'albert sans'} }}
              >
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
                      "&:hover": { bgcolor: "rgb(20, 140, 180)" },
                    }}
                  >
                    {username.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              ) : (
                <>
                  <Typography
                    onClick={() => setOpenLogin(true)}
                    sx={{ cursor: "pointer", fontFamily:'albert sans', "&:hover": { textDecoration: "underline", fontFamily:'albert sans' } }}
                  >
                    Log In
                  </Typography>
                  <Typography
                    onClick={() => setOpenSignin(true)}
                    sx={{ cursor: "pointer", fontFamily:'albert sans', "&:hover": { textDecoration: "underline", fontFamily:'albert sans' } }}
                  >
                    Sign Up
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Bottom line */}
      <Box sx={{ height: "1px", width: "100%", backgroundColor: "rgb(238, 237, 242)", marginTop: "8px" }} />

      {/* Profile Dropdown Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 180,
            borderRadius: 2,
          },
        }}
      >
        <MenuItem
          sx={{ fontFamily: 'albert sans', fontWeight: "bold", color: "rgb(25, 174, 220)" }}
        >
          {username}
        </MenuItem>
        <MenuItem onClick={handleProfileClick} sx={{fontFamily:'albert sans'}}>Profile</MenuItem>
        <MenuItem onClick={handleSettingsClick} sx={{fontFamily:'albert sans'}}>Settings</MenuItem>
        <MenuItem onClick={handleLogout} sx={{fontFamily:'albert sans'}}>Logout</MenuItem>
      </Menu>

      {/* Drawer menu for mobile */}
      {renderDrawerMenu()}

      {/* Login & Signin Modals */}
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

