// Desktop before login header

import React from "react";
import { Box, Typography, InputBase, IconButton, Avatar } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { useNavigate } from "react-router-dom";

// Dummy profile data for testing
const profileData = [
  {
    name: "Sujan Raj",
    image: "https://randomuser.me/api/portraits/men/46.jpg",
  },
];

const MainHeader = () => {
  const navigate = useNavigate();

  return (
    <Box>
      <Box sx={{ margin: "1% 2% 0.5% 2%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "95%",
            margin: "0 auto",
          }}
        >
          {/* Logo/Title */}
          <Typography
            variant="h5"
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

          {/* Search and Location Container */}
          <Box
            sx={{
              width: "36%",
              minWidth: "30%",
              maxWidth: "36%",
              border: "1px solid rgb(170, 170, 170)",
              borderRadius: "40px",
              display: "flex",
              justifyContent: "space-between",
              boxSizing: "border-box",
              marginX: "10%",
            }}
          >
            {/* Search Box */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "1% 2%",
                width: "100%",
              }}
            >
              <SearchIcon sx={{ color: "gray", marginRight: "4%" }} />
              <InputBase
                placeholder="Search events"
                sx={{
                  fontFamily: "'Albert Sans', sans-serif",
                  fontSize: "16px",
                  flex: 1,
                  border: "none",
                  outline: "none",
                }}
              />
            </Box>

            {/* Vertical Separator */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "40px",
                borderLeft: "2px solid rgb(170, 170, 170)",
              }}
            />

            {/* Location Box */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                padding: "0.5% 0.5% 0.5% 2%",
                width: "100%",
              }}
            >
              <LocationOnIcon sx={{ color: "gray", marginRight: "4%" }} />
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Albert Sans', sans-serif",
                  width: "60%",
                  fontSize: "16px",
                  flex: 1,
                }}
              >
                Coimbatore
              </Typography>
              <IconButton
                sx={{
                  backgroundColor: "rgb(25, 174, 220)",
                  color: "white",
                  marginX: "2%",
                  borderRadius: "60%",
                  fontSize: "20px",
                  width: "32px",
                  height: "32px",
                  "&:hover": { backgroundColor: "rgb(20, 140, 180)" },
                }}
              >
                <SearchIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Navigation Links */}
          <Box
            sx={{
              display: "flex",
              gap: 3, // Ensures proper spacing between items
              ml: "auto", // Pushes links to the right
              alignItems: "center",
            }}
          >
            <Typography
              onClick={() => navigate("/")}
              sx={{
                cursor: "pointer",
                whiteSpace: "nowrap", // Prevents wrapping
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Find my tickets
            </Typography>

            <Typography
              sx={{
                cursor: "pointer",
                whiteSpace: "nowrap",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Recent Orders
            </Typography>

            <Typography
              onClick={() => navigate("/vendorregister")}
              sx={{
                cursor: "pointer",
                whiteSpace: "nowrap",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              Create Events
            </Typography>

            {/* Profile Section */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                marginLeft: "5%",
                cursor: "pointer",
              }}
            >
              <Avatar
                alt={profileData[0].name}
                src={profileData[0].image}
                sx={{
                  width: 36,
                  height: 36,
                  border: "2px solid rgb(25, 174, 220)",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Line */}
      <Box
        sx={{
          height: "1px",
          width: "100%",
          backgroundColor: "rgb(238, 237, 242)",
          marginTop: "8px",
        }}
      />
    </Box>
  );
};

export default MainHeader;