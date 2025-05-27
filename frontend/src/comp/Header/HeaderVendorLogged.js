
import { Box, Typography, IconButton, Button, Menu, MenuItem, Avatar } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const HeaderVendorLogged = ({ vendorId, userProfile, onLogout }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);
  const navigate = useNavigate();

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(true);
  };

  const handleMenuClose = () => {
    setOpenMenu(false);
  };

  const handleProfileClick = () => {
    handleMenuClose();
    navigate(`/vendorprofile/vendorprofile/${vendorId}`);
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    // Navigate to vendor settings page - update this path as needed
    navigate(`/vendorprofile/vendorscanner/${vendorId}`);
  };

  const handleLogoutClick = () => {
    handleMenuClose();
    // Call the logout function passed from parent
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div>
      <Box sx={{ margin: "1% 2%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "95%",
            margin:'0 auto'
          }}
        >
          {/* Left Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 6, width: "55%" }}>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontWeight: 900,
                fontSize: 30,
                color: "rgb(25, 174, 220)",
              }}
            >
              ticketb
            </Typography>
          </Box>

          {/* Right Section */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "45%",
              justifyContent: "flex-end",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <IconButton onClick={handleMenuClick}>
                {userProfile && userProfile.photoURL ? (
                  <Avatar 
                    src={userProfile.photoURL} 
                    alt={userProfile.displayName || "Profile"}
                    sx={{ width: 40, height: 40 ,  bgcolor: "rgb(25, 174, 220)", }}
                  />
                ) : (
                  <AccountCircleOutlinedIcon sx={{ fontSize: 40,  }} />
                )}
              </IconButton>

              {/* Account Menu */}
              <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                MenuListProps={{
                  "aria-labelledby": "basic-button",
                }}
                sx={{
                  "& .MuiPaper-root": {
                    width: "150px", 
                  },
                }}
              >
                <MenuItem
                  onClick={handleProfileClick}
                  sx={{
                    fontFamily: "Albert Sans",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={handleSettingsClick}
                  sx={{
                    fontFamily: "Albert Sans",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  Scanner
                </MenuItem>
                <MenuItem
                  onClick={handleLogoutClick}
                  sx={{
                    fontFamily: "Albert Sans",
                    fontSize: "16px",
                    fontWeight: "500",
                  }}
                >
                  Log Out
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Box>
      </Box>
      <Box sx={{ mt: "1%", height: "1px", width: "100%", backgroundColor: "rgb(238, 237, 242)" }}></Box>
    </div>
  );
};

export default HeaderVendorLogged;