import { Box, Typography, IconButton, Button, Menu, MenuItem } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { useState } from "react";

const HeaderVendorLogged = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [openMenu, setOpenMenu] = useState(false);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpenMenu(true);
  };

  const handleMenuClose = () => {
    setOpenMenu(false);
  };

  return (
    <div>
      <Box sx={{ margin: "1% 2%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            mt: "1%",
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
            <Box sx={{ width: "25%" }}>
              <Button
                sx={{
                  fontFamily: "Albert Sans",
                  backgroundColor: "transparent",
                  border: "1px solid rgb(25, 174, 220)",
                  color: "rgb(25, 174, 220)",
                  fontSize: "17px",
                  borderRadius: "20px",
                  padding: "6px 20px",
                  textTransform: "none",
                  fontWeight: "600",
                  "&:hover": {
                    backgroundColor: "rgb(25, 174, 220)",
                    color: "white",
                  },
                }}
              >
                Create Event
              </Button>
            </Box>
            <Box sx={{ width: "25%", display: "flex", alignItems: "center" }}>
              <IconButton onClick={handleMenuClick}>
                <AccountCircleOutlinedIcon sx={{ fontSize: 30, color: "black" }} />
              </IconButton>
              <Typography sx={{ fontFamily: "Albert Sans", fontSize: 16, ml: "1%" }}>
                Vendor Name!
              </Typography>

              {/* Account Menu */}
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
                    onClick={handleMenuClose}
                    sx={{
                    fontFamily: "Albert Sans",
                    fontSize: "16px",
                    fontWeight: "500",
                    }}
                >
                    Profile
                </MenuItem>
                <MenuItem
                    onClick={handleMenuClose}
                    sx={{
                    fontFamily: "Albert Sans",
                    fontSize: "16px",
                    fontWeight: "500",
                    }}
                >
                    Settings
                </MenuItem>
                <MenuItem
                    onClick={handleMenuClose}
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
