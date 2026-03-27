import { useEffect, useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Drawer from "@mui/material/Drawer";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";

import {
  Button,
  Typography,
  useMediaQuery,
  Box,
  TextField,
  CircularProgress,
  IconButton
} from "@mui/material";
import { useParams } from "react-router-dom";

import axios from "axios";
import VendorProfileHeader from "./VendorProfileHeader";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const VendorOrg = () => {
  const { vendorId } = useParams();
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const sidebarItems = [
    {
      name: "Profile",
      icon: <AccountCircleIcon />,
      active: false,
      path: `/vendorprofile/vendorprofile/${vendorId}`,
    },
    {
      name: "Documents",
      icon: <EditDocumentIcon />,
      active: false,
      path: `/vendorprofile/vendordocuments/${vendorId}`,
    },
    {
      name: "Organization details",
      icon: <CorporateFareIcon />,
      active: true,
      path: `/vendorprofile/vendororganization/${vendorId}`,
    },
    {
      name: "Scanner",
      icon: <QrCodeScannerOutlinedIcon />,
      active: false,
      path: `/vendorprofile/vendorscanner/${vendorId}`,
    },
  ];


  useEffect(() => {
    const fetchVendorDetails = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/vendor/vendorupdate/${vendorId}`
        );
        setVendorData(res.data);
      } catch (err) {
        // ...existing code...
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorDetails();
    }
  }, [vendorId]);

  const isMobileScreen = useMediaQuery("(max-width:768px)");
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  return (
    <div>

    {vendorId ? (
  <VendorProfileHeader vendorId={vendorId} />
) : (
  <p>Loading header...</p>
)}

      <Box display="flex" flex={1} sx={{ minHeight: "100vh" }}>
        {!isMobileScreen ? (
          <Box
            width={276}
            flexShrink={0}
            bgcolor="white"
            py={10}
            px={3}
            boxShadow={3}
            sx={{
              minheight: "80vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              pt: "8%",
            }}
          >
            {sidebarItems.map((item) => (
              <Button
                key={item.name}
                onClick={() => (window.location.href = item.path)}
                variant={item.active ? "contained" : "outlined"}
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  my: 2,
                  paddingY: 2,
                  borderRadius: "10px",
                  borderColor: item.active ? "#19aedc" : "#ddd",
                  bgcolor: item.active ? "#e3f2fd" : "white",
                  color: item.active ? "#19aedc" : "black",
                  textTransform: "none",
                  fontWeight: item.active ? "bold" : "normal",
                  gap: 2,
                  boxShadow: 1,
                  fontSize: "18px",
                  fontFamily: "albert sans",
                }}
                startIcon={item.icon}
              >
                {item.name}
              </Button>
            ))}
          </Box>
        ) : (
          <>
         <AppBar
  position="fixed"
  elevation={0}
  sx={{
    width: "fit-content",
    bgcolor: "transparent",
    boxShadow: "none",
    zIndex: 20,
    top: 60,
    left: 16,
  }}
>
  <Toolbar sx={{ minHeight: "auto", padding: 0 }}>
    <IconButton
      onClick={() => setDrawerOpen(true)}
      sx={{
        backgroundColor: "#fff",
        width: 90,
        height: 30,
        borderRadius: 5,
        boxShadow: 2,
        zIndex: 0,
        "&:hover": {
          backgroundColor: "#f0f0f0",
        },
      }}
    >
      <Typography variant="body1" sx={{ fontFamily: "albert sans", fontWeight: "bold", color: "rgb(25, 174, 220)" }}>
        Menu
      </Typography>
      <ArrowForwardIcon sx={{ color: "rgb(25, 174, 220)" ,fontSize:18,ml:1}} />
    </IconButton>
  </Toolbar>
</AppBar>


    <Drawer anchor="left" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
      <Box
        sx={{ width: 250, p: 2 ,mt: 8}}
        role="presentation"
        onClick={() => setDrawerOpen(false)}
        onKeyDown={() => setDrawerOpen(false)}
      >
        <Typography variant="h6" sx={{ fontFamily: "albert sans", fontWeight: "bold", mb: 2,color: "rgb(25, 174, 220)" }}>
          Vendor Menu
        </Typography>
        {sidebarItems.map((item) => (
          <Button
            key={item.name}
            onClick={() => (window.location.href = item.path)}
            variant={item.active ? "contained" : "outlined"}
            fullWidth
            sx={{
              justifyContent: "flex-start",
              my: 1,
              paddingY: 1.5,
              borderRadius: "10px",
              borderColor: item.active ? "#19aedc" : "#ddd",
              bgcolor: item.active ? "#e3f2fd" : "white",
              color: item.active ? "#19aedc" : "black",
              textTransform: "none",
              fontWeight: item.active ? "bold" : "normal",
              gap: 2,
              fontSize: "16px",
              fontFamily: "albert sans",
            }}
            startIcon={item.icon}
          >
            {item.name}
          </Button>
        ))}
      </Box>
    </Drawer>
          </>
        )}
        <Box
          sx={{
            bgcolor: "#f9fafb",
            minheight: "100vh",
            width: "100%",
            pt: "6%",
            pl: "5%",
            display: "flex",
            flexDirection: "column",
            pr: "5%",
            pb: "5%",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontWeight: "600",
              fontSize: isMobileScreen?"20px":"26px",
              mt:isMobileScreen ? 4: 0
            }}
          >
            Organization Details
          </Typography>

          <Box
            sx={{
              width: isMobileScreen?"90%":"80%",
              bgcolor: "white",
              mt: "4%",
              padding: "2% 5%",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            {/*Organization name field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1} }
            >
              Organization name
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "55%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.organisationName}
                disabled={true}
                size="small"
                sx={{
                  flex: 1,
                  "& .MuiInputBase-input": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />
            </Box>

            {/*Org type field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Organization Type
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "55%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.organisationType}
                disabled={true}
                size="small"
                sx={{
                  flex: 1,
                  "& .MuiInputBase-input": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />
            </Box>

            {/*Org mail field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Organization Email ID
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "55%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.organisationMail}
                disabled={true}
                size="small"
                sx={{
                  flex: 1,
                  "& .MuiInputBase-input": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />
            </Box>

            {/*Org contact field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Organization Contact
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "55%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.organisationContact}
                disabled={true}
                size="small"
                sx={{
                  flex: 1,
                  "& .MuiInputBase-input": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": { borderColor: "#19AEDC" },
                    "&.Mui-disabled": {
                      "& fieldset": { borderColor: "#e0e0e0" },
                    },
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default VendorOrg;
