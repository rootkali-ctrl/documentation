import { Box, Button, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useNavigate } from "react-router-dom";

const VendorConfirmation = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // small screen

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isMobile ? "92%" : "80%",
          margin: isMobile ? "20% auto" : "8% auto",
          alignItems: "flex-start",
          fontFamily: "Albert Sans",
          // border: "1px solid #19AEDC",
        }}
      >
        <Typography
          sx={{
            fontFamily: "Albert Sans",
            fontSize: isMobile ? "18px" : "27px",
            fontWeight: "700",
            lineHeight: isMobile ? "28px" : "30px",
            mb: isMobile ? 4 : "2%",
            textAlign:"justify",
          }}
        >
          Thank you for choosing ticketB and you have successfully registered your account!
          <br /> Our admin will verify your credentials and you will receive a confirmation mail within 24 to 48 hours
        </Typography>

        <Typography
          sx={{
            fontFamily: "Albert Sans",
            width: "100%",
            fontSize: isMobile ? "12px" : "18px",
            mb: isMobile ? 6 : "2%",
            textAlign:"justify",
          }}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et
          dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip
          ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore
          eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia
          deserunt mollit anim id est laborum.
        </Typography>

        <Button
          variant="contained"
          sx={{
            fontFamily: "Albert Sans",
            textTransform: "lowercase",
            backgroundColor: "#19AEDC",
            fontSize: isMobile ? "16px" : "20px",
            fontWeight: "800",
            px: isMobile ? 2 : 3,
            py: isMobile ? 1 : 1,
            
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
