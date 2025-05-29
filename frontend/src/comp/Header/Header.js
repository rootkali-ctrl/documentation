import React, { useState } from "react";
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";

// Dummy profile data
const profileData = [
  {
    name: "Sujan Raj",
    image: "https://randomuser.me/api/portraits/men/46.jpg",
  },
];

const MainHeader = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = (open) => (event) => {
    if (
      event &&
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }
    setDrawerOpen(open);
  };

  const renderSearchLocationBox = () => (
    <Box
      sx={{
        width: "100%",
        border: "1px solid rgb(170, 170, 170)",
        borderRadius: "40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        boxSizing: "border-box",
        marginX: isMobile ? "0" : "10%",
        marginTop: isMobile ? 2 : 0,
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
  );

  const drawerList = (
    <Box
      sx={{ width: 200, p: 1 }}
      role="presentation"
      onClick={toggleDrawer(false)}
      onKeyDown={toggleDrawer(false)}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
       <Box></Box>
        <IconButton onClick={toggleDrawer(false)}>
          <CloseIcon />
        </IconButton>
      </Box>
      <List>
        <ListItem button onClick={() => navigate("/")}>
          <ListItemText primary="Find my tickets" />
        </ListItem>
        <ListItem button>
          <ListItemText primary="Recent Orders" />
        </ListItem>
        <ListItem button onClick={() => navigate("/vendorregister")}>
          <ListItemText primary="Create Events" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ backgroundColor: "white" }}>
      <Box sx={{ padding: "1% 2% 0.5% 2%" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          {/* Logo/Title */}
          <Typography
            variant="h5"
            sx={{
              fontFamily: "'Albert Sans', sans-serif",
              fontWeight: "900",
              fontSize: !isMobile ? "30px" : "24px",
              p: 1,
              color: "rgb(25, 174, 220)",
              cursor: "pointer",
            }}
          >
            ticketb
          </Typography>

          {!isMobile && renderSearchLocationBox()}

          {isMobile ? (
            <>
              <IconButton onClick={toggleDrawer(true)}>
                <MenuIcon />
              </IconButton>
              <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={toggleDrawer(false)}
              >
                {drawerList}
              </Drawer>
            </>
          ) : (
            <Box
              sx={{
                display: "flex",
                gap: 3,
                alignItems: "center",
              }}
            >
              <Typography
                onClick={() => navigate("/")}
                sx={{
                  cursor: "pointer",
                  whiteSpace: "nowrap",
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
              <Avatar
                alt={profileData[0].name}
                src={profileData[0].image}
                sx={{
                  width: 36,
                  height: 36,
                  border: "2px solid rgb(25, 174, 220)",
                  ml: 2,
                }}
              />
            </Box>
          )}
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
