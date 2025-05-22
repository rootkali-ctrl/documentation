import { Box, Button, Typography } from "@mui/material";
import React from "react";
import HeaderVendor from "../Header/HeaderVendor";
import { useNavigate } from "react-router-dom";

const VendorConfirmation = () => {
  const navigate = useNavigate();
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
            fontWeight: "700",
            lineHeight: "35px",
            mb: "2%",
          }}
        >
          Thank you for choosing ticketB and you have been successfully
          registered your account!
          <br /> Our admin will verify your credentials and you will receive a
          conformation mail within 24 to 48 hours
        </Typography>
        <Typography sx={{ fontFamily: "Albert Sans", width: "90%", mb: "2%" }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
          minim veniam, quis nostrud exercitation ullamco laboris nisi ut
          aliquip ex ea commodo consequat. Duis aute irure dolor in
          reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa qui officia deserunt mollit anim id est laborum.
        </Typography>
        <Button
          variant="contained"
          sx={{
            fontFamily: "Albert Sans",
            textTransform: "lowercase",
            backgroundColor: "#19AEDC",
            fontSize: "20px",
            fontWeight: "800",
          }}
          onClick={() => {
            navigate("/");
          }}
        >
          explore ticketb
        </Button>
      </Box>
    </Box>
  );
};

export default VendorConfirmation;