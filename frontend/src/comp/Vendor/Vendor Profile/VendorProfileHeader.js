import { Box, Typography, useTheme, useMediaQuery } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";

const VendorProfileHeader = ({ vendorId }) => {
  const [DatalastLogin, setLastLogin] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // true if screen width is <600px

  useEffect(() => {
    if (!vendorId || vendorId === "undefined" || vendorId === "null") return;

    const fetchLastLogin = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/vendor/vendorLastLogin/${vendorId}`
        );
        setLastLogin(res.data);
        console.log("DatalastLogin:", res.data);
      } catch (err) {
        console.log("Error fetching last login:", err);
      }
    };

    fetchLastLogin();
  }, [vendorId]);

  return (
    <Box sx={{ margin: "1% 2%" }}>
      <Box
        sx={{
          display: "flex",
          flexDirection:"row",
          justifyContent: "space-between",
          alignItems: "center",
          width: "95%",
          margin: "0 auto",
          gap: { xs:2, sm: 0 },
        }}
      >
        {/* Left Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            width: { xs: "100%", sm: "55%" },
          }}
        >
          <Typography
            sx={{
              fontFamily: "Albert Sans",
              fontWeight: 900,
              fontSize: { xs: 24, sm: 30 },
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
            flexDirection: "row",
            gap: "5px",
            width: { xs: "100%", sm: "45%" },
            justifyContent:"flex-end",
            ml:{ xs: 15, sm: 0}
          }}
        >
          <Typography fontFamily="Albert Sans" fontSize={{ xs: 14, sm: 16 }}>
            Last Login:
          </Typography>
          <Typography fontFamily="Albert Sans" fontSize={{ xs: 14, sm: 16 }}>
            {DatalastLogin?.lastLogin
              ? new Date(
                  DatalastLogin.lastLogin._seconds * 1000
                ).toLocaleString()
              : "Loading"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default VendorProfileHeader;
