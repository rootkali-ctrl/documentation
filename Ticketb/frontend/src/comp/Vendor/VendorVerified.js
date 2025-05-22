import { Box, Button, Typography } from "@mui/material";
import React from "react";
import HeaderVendor from "../Header/HeaderVendor";
import { useNavigate } from "react-router-dom";

const VendorVerified = () => {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate("/createevent");
  };
  return (
    <Box>
      <HeaderVendor />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "80%",
          margin: "8% auto",

          alignItems: "flex-start",
          fontFamily: "Albert Sans",
        }}
      >
        <Typography
          sx={{
            fontFamily: "Albert Sans",
            fontSize: "27px",
            lineHeight: "35px",
            mb: "2%",
          }}
        >
          <span style={{ fontWeight: "bold" }}>
            You have been successfully veified,
          </span>{" "}
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </Typography>
        <Typography sx={{ fontFamily: "Albert Sans", width: "90%", mb: "2%" }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.{" "}
        </Typography>
        <Button
          variant="contained"
          sx={{
            fontFamily: "Albert Sans",
            textTransform: "none",
            backgroundColor: "#19AEDC",
            fontSize: "20px",
            fontWeight: "800",
          }}
          onClick={handleClick}
        >
          List your events
        </Button>
      </Box>
    </Box>
  );
};

export default VendorVerified;
