import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  useMediaQuery,
} from "@mui/material";
import { motion } from "framer-motion";
import Footer from "../Footer/Footer";
import Header from "../Header/Header";
import HeaderVendor1 from "../Header/HeaderVendor";
import { ErrorOutline } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useVendor } from "./VendorContext";

const VendorOrganization = () => {
  const navigate = useNavigate();
  const { vendorData, setVendorData } = useVendor();
  const isMobile = useMediaQuery("(max-width:900px)");
  const isRight = useMediaQuery("(max-width:1080px");

  useEffect(() => {
    if (!vendorData) {
      navigate("/vendor/register"); // Redirect if no previous data
    }
  }, []);

  const features = [
    { title: "Easy Event Planning", animation: "eventAnimation" },
    { title: "Track Performance", animation: "ticketAnimation" },
    { title: "Manage Attendees", animation: "promotionAnimation" },
    { title: "Get Reviews", animation: "analyticsAnimation" },
  ];

  const [orgData, setorgData] = useState({
    organisationName: "",
    organisationType: "",
    hasGSTIN: "no", // Default value for the yes/no radio selection
    GSTIN: "",
    organisationMail: "",
    organisationContact: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setorgData({
      ...orgData,
      [name]: value,
    });

    setErrors({
      ...errors,
      [name]: "",
    });
  };

  const validateForm = () => {
    let newErrors = {};

    if (!orgData.organisationName)
      newErrors.organisationName = "Organisation name is required";

    if (!orgData.organisationType)
      newErrors.organisationType = "Organisation type is required";

    if (orgData.hasGSTIN === "yes" && !orgData.GSTIN)
      newErrors.GSTIN = "GSTIN is required";

    if (!/^\d{10}$/.test(orgData.organisationContact)) {
      newErrors.organisationContact = "Invalid phone number";
    }

    if (!orgData.organisationMail) {
      newErrors.organisationMail = "Email ID is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(orgData.organisationMail)) {
      newErrors.organisationMail = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);

      try {
        // Create a clean version of the data, removing the hasGSTIN field
        // as it's just for UI control and setting GSTIN to empty if hasGSTIN was "no"
        const cleanedData = {
          ...orgData,
          GSTIN: orgData.hasGSTIN === "yes" ? orgData.GSTIN : "",
        };
        delete cleanedData.hasGSTIN;

        const mergedData = { ...vendorData, ...cleanedData };
        setVendorData(mergedData);
        console.log("Merged Data before navigating:", mergedData);
        navigate("/vendor/document");
      } catch (error) {
        console.error(
          "Error submitting form:",
          error.response ? error.response.data : error.message
        );
        alert("Something went wrong");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box sx={{ backgroundColor: "#F9FAFB", minHeight: "100vh" }}>
      {!isMobile ? <Header /> : <Typography>Hello world</Typography>}
      <Typography
        sx={{
          fontSize: { lg: "40px", md: "36px", sm: "32px", xs: "26px" },
          fontWeight: "bold",
          pt: "3%",
          color: "#1a1033",
          textAlign: "center",
          width: "95%",
          margin: '0 auto',
          fontFamily: "Albert Sans",
        }}
      >
        Vendor Organisation Details
      </Typography>
      <Typography
        sx={{
          fontWeight: "light",
          color: "#1a1033",
          textAlign: "center",
          width: "95%",
          margin: "0 auto",
          fontSize: { lg: "20px", md: "18px", sm: "18px", xs: "16px" },
          fontFamily: "Albert Sans",
        }}
      >
        Complete your profile to start managing events
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "auto",
          width: "90%",
          margin: "0 auto",
          padding:'2% 0',
          gap: { lg: "6%", md: "4%" },
          backgroundColor: "#F9FAFB",
        }}
      >
        {/* Left Side - Register Form */}
        <Box
          sx={{
            mt: { lg: "0", md: "0", sm: "2%", xs: "2%" },
            width: { lg: "50%", md: "60%", sm: "80%", xs: "80%" },
            borderRadius: "10px",
            alignItems: "center",
            boxShadow: 3,
            padding: { lg: "2rem", md: "2rem", sm: "2rem", xs: "2rem" },
          }}
        >
          <TextField
            fullWidth
            variant="outlined"
            label="Organization Name"
            name="organisationName"
            value={orgData.organisationName}
            onChange={handleChange}
            sx={{
              marginTop: {
                lg: "1.5rem",
                md: "1.5rem",
                sm: "1.5rem",
                xs: "0rem",
              },

              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ccc" },
                "&.Mui-focused fieldset": {
                  borderColor: "#19AEDC",
                },
              },
            }}
          />
          {errors.organisationName && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "2%",
                color: "red",
                marginTop: "2%",
                ml: "2%",
              }}
            >
              <ErrorOutline fontSize="small" />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "albert sans",
                  fontWeight: "400",
                }}
              >
                {errors.organisationName}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            variant="outlined"
            label="Organization Type"
            name="organisationType"
            value={orgData.organisationType}
            onChange={handleChange}
            sx={{
              marginTop: "1rem",

              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ccc" },
                "&.Mui-focused fieldset": {
                  borderColor: "#19AEDC",
                },
              },
            }}
          />
          {errors.organisationType && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "2%",
                color: "red",
                marginTop: "2%",
                ml: "2%",
              }}
            >
              <ErrorOutline fontSize="small" />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "albert sans",
                  fontWeight: "400",
                }}
              >
                {errors.organisationType}
              </Typography>
            </Box>
          )}

          {/* GSTIN Yes/No Radio Selection */}
          <Box sx={{ marginTop: "1rem" }}>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                marginBottom: "0.5rem",
              }}
            >
              Do you have a GSTIN number?
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row
                name="hasGSTIN"
                value={orgData.hasGSTIN}
                onChange={handleChange}
              >
                <FormControlLabel
                  value="yes"
                  control={
                    <Radio
                      sx={{
                        
                        "&.Mui-checked": {
                          color: "#19AEDC",
                        },
                      }}
                    />
                  }
                  label="Yes"
                  sx={{ fontFamily: "Albert Sans" }}
                />

                <FormControlLabel
                  value="no"
                  control={<Radio  sx={{
                        "&.Mui-checked": {
                          color: "#19AEDC",
                        },
                      }} />}
                  label="No"
                  sx={{ fontFamily: "Albert Sans" }}
                />
              </RadioGroup>
            </FormControl>
          </Box>

          {/* Conditional GSTIN Field */}
          {orgData.hasGSTIN === "yes" && (
            <>
              <TextField
                fullWidth
                variant="outlined"
                label="GSTIN"
                name="GSTIN"
                value={orgData.GSTIN}
                onChange={handleChange}
                sx={{
                  marginTop: "1rem",

                  "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
                  "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#19AEDC",
                    },
                  },
                }}
              />
              {errors.GSTIN && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2%",
                    color: "red",
                    marginTop: "2%",
                    ml: "2%",
                  }}
                >
                  <ErrorOutline fontSize="small" />
                  <Typography
                    sx={{
                      fontSize: "14px",
                      fontFamily: "albert sans",
                      fontWeight: "400",
                    }}
                  >
                    {errors.GSTIN}
                  </Typography>
                </Box>
              )}
            </>
          )}

          <TextField
            fullWidth
            variant="outlined"
            label="Organization Mail ID"
            name="organisationMail"
            value={orgData.organisationMail}
            onChange={handleChange}
            sx={{
              marginTop: "1rem",

              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ccc" },
                "&.Mui-focused fieldset": {
                  borderColor: "#19AEDC",
                },
              },
            }}
          />
          {errors.organisationMail && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "2%",
                color: "red",
                marginTop: "2%",
                ml: "2%",
              }}
            >
              <ErrorOutline fontSize="small" />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "albert sans",
                  fontWeight: "400",
                }}
              >
                {errors.organisationMail}
              </Typography>
            </Box>
          )}

          <TextField
            fullWidth
            variant="outlined"
            label="Organisation Contact Number"
            name="organisationContact"
            value={orgData.organisationContact}
            onChange={handleChange}
            type="text"
            sx={{
              marginTop: "1rem",

              "& .MuiInputBase-input": { fontFamily: "Albert Sans" },
              "& .MuiInputLabel-root": { fontFamily: "Albert Sans" },
              "& .MuiOutlinedInput-root": {
                "& fieldset": { borderColor: "#ccc" },
                "&.Mui-focused fieldset": {
                  borderColor: "#19AEDC",
                },
              },
            }}
          />
          {errors.organisationContact && (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "2%",
                color: "red",
                marginTop: "2%",
                ml: "2%",
              }}
            >
              <ErrorOutline fontSize="small" />
              <Typography
                sx={{
                  fontSize: "14px",
                  fontFamily: "albert sans",
                  fontWeight: "400",
                }}
              >
                {errors.organisationContact}
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{
              fontFamily: "albert sans",
              marginTop: "1.5rem",
              backgroundColor: "#53a8d8",
              color: "#fff",
              padding: "0.8rem",
              "&:hover": { backgroundColor: "#4795c2" },
            }}
            onClick={handleSubmit}
          >
            {loading ? "Proceeding..." : "Proceed"}
          </Button>
        </Box>

        {/* Right Side - Animated Text */}
        {!isMobile ? (
          <Box
            sx={{
              width: { lg: "44%", md: "36%" },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              px: { lg: 0, md: "1rem" },
            }}
          >
            <Typography
              sx={{
                fontSize: { lg: "35px", md: "30px" },
                fontWeight: "bold",
                color: "#19AEDC",
                lineHeight: "40px",
                fontFamily: "Albert Sans",
                pl: isRight ? "8%" : "0%",
              }}
            >
              Create Memorable Events
            </Typography>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: { lg: "18px", md: "16px" },
                mt: "3%",
                pl: isRight ? "8%" : "0%",
              }}
            >
              Join our platform to manage and organize spectacular events that
              leave lasting impressions
            </Typography>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: { lg: "20px", md: "15px" },
                width: "100%",
                mt: "5%",
              }}
            >
              {features.map((feature, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: "#EEF2FF",
                    padding: "20px",
                    borderRadius: "8px",
                    boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
                    fontFamily: "Albert Sans",
                    fontSize: "16px",
                    fontWeight: "500",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  <Typography>{feature.animation}</Typography>
                  <Typography sx={{ mt: "10px" }}>{feature.title}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
};

export default VendorOrganization;
