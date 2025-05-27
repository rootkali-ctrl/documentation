import { useEffect, useState } from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";

import {
  Button,
  Typography,
  useMediaQuery,
  Box,
  TextField,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";
import VendorProfileHeader from "./VendorProfileHeader";

const VendorDoc = () => {
  const { vendorId } = useParams();
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState(null);

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
      active: true,
      path: `/vendorprofile/vendordocuments/${vendorId}`,
    },
    {
      name: "Organization details",
      icon: <CorporateFareIcon />,
      active: false,
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
          `http://localhost:8080/api/vendor/vendorupdate/${vendorId}`
        );
        setVendorData(res.data);
        console.log("Vendor Data:", res.data);
      } catch (err) {
        console.error("Error fetching vendor data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorDetails();
    }
  }, [vendorId]);

  const handleViewPDF = (url, documentType) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      alert(`${documentType} document not available`);
    }
  };

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
            bgcolor="#f9fafb"
            py={10}
            px={3}
            boxShadow={3}
            sx={{
              minHeight: "100vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              bgcolor: "white",
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
          <></>
        )}

        <Box
          sx={{
            bgcolor: "#f9fafb",
            minHeight: "100vh",
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
              fontSize: "26px",
            }}
          >
           Document Details
          </Typography>

          <Box
            sx={{
              width: "80%",
              bgcolor: "white",
              mt: "4%",
              padding: "2% 5%",
              borderRadius: 2,
              boxShadow: 1,
            }}
          >
            {/* Pan card field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Pan Card
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "90%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.panNumber || ''}
                disabled={true}
                size="small"
                sx={{
                  width: "500px", // Fixed width for consistent alignment
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
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
               onClick={() => handleViewPDF(vendorData?.documents?.panUpload, 'PAN Card')}
                disabled={!vendorData?.documents?.panUpload}
                sx={{
                  textTransform: "none",
                  fontFamily: "albert sans",
                  borderColor: "#19aedc",
                  color: "#19aedc",
                  "&:hover": {
                    borderColor: "#19aedc",
                    bgcolor: "#e3f2fd",
                  },
                  "&.Mui-disabled": {
                    borderColor: "#ccc",
                    color: "#ccc",
                  },
                }}
              >
                View PDF
              </Button>
            </Box>

            {/* Aadhar card field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Aadhar Number
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "90%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.aadharNumber || ''}
                disabled={true}
                size="small"
                sx={{
                  width: "500px", // Fixed width for consistent alignment
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
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => handleViewPDF(vendorData?.documents?.aadharUpload, 'Aadhar Card')}
                disabled={!vendorData?.documents?.aadharUpload}
                sx={{
                  textTransform: "none",
                  fontFamily: "albert sans",
                  borderColor: "#19aedc",
                  color: "#19aedc",
                  "&:hover": {
                    borderColor: "#19aedc",
                    bgcolor: "#e3f2fd",
                  },
                  "&.Mui-disabled": {
                    borderColor: "#ccc",
                    color: "#ccc",
                  },
                }}
              >
                View PDF
              </Button>
            </Box>

            {/* GSTIN field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              GSTIN
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "90%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.GSTIN || 'None'}
                disabled={true}
                size="small"
                sx={{
                  width: "500px", // Fixed width for consistent alignment
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

            {/* Bank account field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              Bank Details
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "90%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.AccountNumber || ''}
                disabled={true}
                size="small"
                sx={{
                  width: "500px", // Fixed width for consistent alignment
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
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => handleViewPDF(vendorData?.documents?.bankUpload, 'Bank Statement')}
                disabled={!vendorData?.documents?.bankUpload}
                sx={{
                  textTransform: "none",
                  fontFamily: "albert sans",
                  borderColor: "#19aedc",
                  color: "#19aedc",
                  "&:hover": {
                    borderColor: "#19aedc",
                    bgcolor: "#e3f2fd",
                  },
                  "&.Mui-disabled": {
                    borderColor: "#ccc",
                    color: "#ccc",
                  },
                }}
              >
                View PDF
              </Button>
            </Box>

            {/* IFSC field */}
            <Typography
              sx={{ fontFamily: "albert sans", fontWeight: "500", mb: 1 }}
            >
              IFSC Number
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "90%",
                gap: 1,
                mb: 3,
              }}
            >
              <TextField
                value={vendorData?.IFSCNumber || ''}
                disabled={true}
                size="small"
                sx={{
                  width: "500px", // Fixed width for consistent alignment
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

export default VendorDoc;