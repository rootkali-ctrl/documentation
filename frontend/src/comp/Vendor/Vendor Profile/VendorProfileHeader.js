import { Box, Typography } from "@mui/material";
import axios from "axios";
import React, { useEffect, useState } from "react";

const VendorProfileHeader = ({ vendorId }) => {
  const [DatalastLogin, setLastLogin] = useState(null);

  useEffect(() => {
    // More robust checking
    if (!vendorId || vendorId === "undefined" || vendorId === "null") {
      return;
    }

    const fetchLastLogin = async () => {
      try {
        const res = await axios.get(
          `http://localhost:8080/api/vendor/vendorLastLogin/${vendorId}`
        );
        setLastLogin(res.data);
        console.log("DatalastLogin:", DatalastLogin);
      } catch (err) {
        console.log("Error fetching last login:", err);
      }
    };

    fetchLastLogin();
  }, [vendorId]);

  return (
    <div>
      <Box sx={{ margin: "1% 2%" }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "95%",
            margin: "0 auto",
          }}
        >
          {/* Left Section */}
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 6, width: "55%" }}
          >
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

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "45%",
              justifyContent: "flex-end",
            }}
          >
            <Typography fontFamily="albert sans">Last Login:</Typography>
            <Typography fontFamily="albert sans">
              {DatalastLogin?.lastLogin
                ? new Date(
                    DatalastLogin.lastLogin._seconds * 1000
                  ).toLocaleString()
                : "Loading"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default VendorProfileHeader;
