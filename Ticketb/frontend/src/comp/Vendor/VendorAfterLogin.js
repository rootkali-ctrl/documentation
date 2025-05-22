import React from "react";
import { Box, Typography, InputBase, IconButton } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

const VendorAfterLogin = () => {
  return (
    <Box sx={{ margin: "1% 2%" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          marginTop: "1%",
        }}
      >
        {/* Left Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: "6%", width: "80%" }}>
          <Typography sx={{ fontFamily: "Albert Sans, sans-serif", fontWeight: 900, fontSize: 30, color: "rgb(25, 174, 220)" }}>
            ticketb
          </Typography>
          
          {/* Search Box */}
          <Box
            sx={{
              display: "flex",
              border: "1px solid rgb(170, 170, 170)",
              borderRadius: "25px",
              backgroundColor: "rgba(219, 218, 227, 0.3)",
              alignItems: "center",
              padding: "0.5% 1%",
              minWidth: "40%",
            }}
          >
            <IconButton>
              <SearchIcon sx={{ color: "gray" }} />
            </IconButton>
            <InputBase
              placeholder="Search events"
              sx={{ flex: 1, fontSize: 16, fontFamily: "Albert Sans, sans-serif", outline: "none", border: "none" }}
            />
            <Box sx={{ height: 30, borderLeft: "2px solid rgb(170, 170, 170)", marginX: "8px" }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOnIcon sx={{ color: "gray" }} />
              <Typography sx={{ fontFamily: "Albert Sans, sans-serif", fontSize: 16 }}>Coimbatore</Typography>
              <IconButton sx={{ backgroundColor: "rgb(25, 174, 220)", borderRadius: "50%", padding: "6px" }}>
                <SearchIcon sx={{ color: "white" }} />
              </IconButton>
            </Box>
          </Box>
        </Box>

        {/* Right Section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <AccountCircleOutlinedIcon sx={{ fontSize: 30 }} />
          <Typography sx={{ fontFamily: "Albert Sans", fontSize: 16 }}>Vendor Name</Typography>
        </Box>
      </Box>

      {/* Bottom Line */}
      <Box sx={{ marginTop: "1%", height: 1, width: "100%", backgroundColor: "rgb(238, 237, 242)" }} />
    </Box>
  );
};

export default VendorAfterLogin;