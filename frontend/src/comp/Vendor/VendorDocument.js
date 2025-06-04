import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  useMediaQuery,
} from "@mui/material";

import { useNavigate } from "react-router-dom";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { useVendor } from "./VendorContext";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CachedIcon from "@mui/icons-material/Cached";
import DoneIcon from "@mui/icons-material/Done";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { getAuth } from "firebase/auth";

const VendorDocument = () => {
  const navigate = useNavigate();
  const { vendorData } = useVendor();
  const isTab = useMediaQuery("(max-width:900px)");
  const isMobile = useMediaQuery("(max-width:600px)");
  const auth = getAuth();
  const user = auth.currentUser;
  useEffect(() => {
    if (!vendorData) {
      navigate("/vendor/register");
    }
  }, []);

  const [docData, setdocData] = useState({
    panNumber: "",
    aadharNumber: "",
    AccountNumber: "",
    IFSCNumber: "",
    panUpload: null,
    aadharUpload: null,
    bankUpload: null,
  });

  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState({
    pan: false,
    aadhar: false,
    bank: false,
  });
  const [uploadErrors, setUploadErrors] = useState({
    pan: "",
    aadhar: "",
    bank: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setdocData({ ...docData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    let newErrors = {};
    let uploadErrors = {};

    Object.keys(docData).forEach((key) => {
      if (!docData[key]) {
        newErrors[key] = "This field is required";
      }
    });

    if (!docData.panUpload) {
      uploadErrors.pan = !isMobile
        ? "PAN Card is required"
        : "Please upload Pan card";
    }
    if (!docData.aadharUpload) {
      uploadErrors.aadhar = !isMobile
        ? "Aadhar Card is required"
        : "Please upload Aadhar card";
    }
    if (!docData.bankUpload) {
      uploadErrors.bank = !isMobile
        ? "Bank Document is required"
        : "Please upload Bank Document";
    }

    setErrors(newErrors);
    setUploadErrors(uploadErrors);

    if (
      Object.keys(newErrors).length === 0 &&
      Object.keys(uploadErrors).length === 0
    ) {
      setSubmitting(true);

      const formData = new FormData();

      const mergedData = {
        ...vendorData,
        firebaseUid: user.uid,
        lastLogin: null,
        panNumber: docData.panNumber,
        aadharNumber: docData.aadharNumber,
        AccountNumber: docData.AccountNumber,
        IFSCNumber: docData.IFSCNumber,
        createdAt: new Date().toISOString(),
      };

      console.log("Merged Data before submission:", mergedData);

      // Append merged text data to FormData
      Object.keys(mergedData).forEach((key) => {
        formData.append(key, mergedData[key]);
      });

      formData.append("panUpload", docData.panUpload);
      formData.append("aadharUpload", docData.aadharUpload);
      formData.append("bankUpload", docData.bankUpload);

      try {
        console.log([...formData.entries()]);
        const response = await axios.post(
          `${process.env.REACT_APP_API_BASE_URL}/api/vendor/signin`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        navigate("/vendor/confirmation");
      } catch (error) {
        console.error(error);
        alert("Error loading vendor details");
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleFileUpload = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      setUploadErrors((prev) => ({
        ...prev,
        [field]: "Only PDF files are allowed",
      }));
      return;
    }

    // Validate file size
    if (file.size > 2 * 1024 * 1024) {
      setUploadErrors((prev) => ({
        ...prev,
        [field]: "File size must be less than 2MB",
      }));
      return;
    }

    // Show loader immediately
    setUploading((prev) => ({ ...prev, [field]: true }));
    setUploadErrors((prev) => ({ ...prev, [field]: "" }));

    const startTime = Date.now();

    // Simulate async processing delay (e.g., FileReader or preview generation)
    await new Promise((resolve) => setTimeout(resolve, 300)); // fake delay

    const duration = Date.now() - startTime;
    console.log(`${field} file handled in ${duration}ms`);

    // Save the file
    setdocData((prev) => ({ ...prev, [`${field}Upload`]: file }));
    setUploading((prev) => ({ ...prev, [field]: false }));
  };

  return (
    <Box
      sx={{
        backgroundColor: "#F9FAFB",
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      <Typography
        sx={{
          fontSize: { lg: "40px", md: "36px", sm: "32px", xs: "26px" },
          fontWeight: "bold",
          pt: "3%",
          color: "#1a1033",
          textAlign: "center",
          width: "95%",
          margin: "0 auto",
          fontFamily: "Albert Sans",
        }}
      >
        Vendor Documentation Details
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
          width: { lg: "90%", md: "90%", sm: "100%" },
          gap: "4%",
          backgroundColor: "#F9FAFB",
          margin: "0 auto",
          padding: "2% 0",
        }}
      >
        {/*Left side box */}
        {!isMobile ? (
          <Box
            sx={{
              width: "68%",
              borderRadius: "10px",
              alignItems: "center",
              boxShadow: 3,
              padding: "2rem",
            }}
          >
            {/* PAN Card Upload */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "4%",
                marginTop: "1.5rem",
              }}
            >
              <TextField
                name="panNumber"
                variant="outlined"
                label="Pan Card Number"
                value={docData.panNumber}
                onChange={handleChange}
                sx={{
                  width: "80%",
                  borderRadius: "10px",
                  backgroundColor: "#f8f7fc",
                  "& .MuiInputBase-input": {
                    maxHeight: "20px",
                    fontSize: "16px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": {
                    maxHeight: "20px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc", borderRadius: "10px" },
                  },
                }}
              />

              <Box>
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  id="pan-upload"
                  onChange={(e) => handleFileUpload(e, "pan")}
                />

                <label htmlFor="pan-upload">
                  <Box
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.2em",
                      maxWidth: "90%",
                      backgroundColor: "#F3F4F6",
                      borderRadius: "10px",
                      border: "1px solid #ccc",
                      padding: "0.8em 0.5em",
                    }}
                  >
                    {uploading.pan ? (
                      <CircularProgress size={20} />
                    ) : docData.panUpload ? (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            gap: "0.5em",
                          }}
                        >
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography
                            sx={{
                              fontSize: "14px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {docData.panUpload.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          sx={{ padding: "4px" }}
                          onClick={() =>
                            setdocData((prev) => ({
                              ...prev,
                              panUpload: null,
                            }))
                          }
                        >
                          <CancelOutlinedIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <UploadFileOutlinedIcon sx={{ fontSize: "20px" }} />
                        <Typography
                          sx={{ fontSize: "16px", fontFamily: "Albert Sans" }}
                        >
                          Upload
                        </Typography>
                      </>
                    )}
                  </Box>
                </label>
              </Box>
              {uploadErrors.pan && (
                <Typography
                  sx={{ color: "red", fontSize: "14px", minWidth: "25%" }}
                >
                  {uploadErrors.pan}
                </Typography>
              )}
            </Box>

            {errors.panNumber && (
              <Typography
                sx={{ color: "red", fontSize: "14px", marginTop: "5px" }}
              >
                {errors.panNumber}
              </Typography>
            )}

            {/* Aadhar Card Upload */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "4%",
                marginTop: "1.5rem",
              }}
            >
              <TextField
                name="aadharNumber"
                variant="outlined"
                label="Aadhar Card Number"
                value={docData.aadharNumber}
                onChange={handleChange}
                sx={{
                  width: "80%",
                  borderRadius: "10px",
                  backgroundColor: "#f8f7fc",
                  "& .MuiInputBase-input": {
                    maxHeight: "20px",
                    fontSize: "16px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": {
                    maxHeight: "20px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc", borderRadius: "10px" },
                  },
                }}
              />

              <Box>
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  id="aadhar-upload"
                  onChange={(e) => handleFileUpload(e, "aadhar")}
                />

                <label htmlFor="aadhar-upload">
                  <Box
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.2em",
                      maxWidth: "90%",
                      backgroundColor: "#F3F4F6",
                      borderRadius: "10px",
                      border: "1px solid #ccc",
                      padding: "0.8em 0.5em",
                    }}
                  >
                    {uploading.aadhar ? (
                      <CircularProgress size={20} />
                    ) : docData.aadharUpload ? (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            gap: "0.5em",
                          }}
                        >
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography
                            sx={{
                              fontSize: "14px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {docData.aadharUpload.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          sx={{ padding: "4px" }}
                          onClick={() =>
                            setdocData((prev) => ({
                              ...prev,
                              aadharUpload: null,
                            }))
                          }
                        >
                          <CancelOutlinedIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <UploadFileOutlinedIcon sx={{ fontSize: "20px" }} />
                        <Typography
                          sx={{ fontSize: "16px", fontFamily: "Albert Sans" }}
                        >
                          Upload
                        </Typography>
                      </>
                    )}
                  </Box>
                </label>
              </Box>
              {uploadErrors.aadhar && (
                <Typography
                  sx={{ color: "red", fontSize: "14px", minWidth: "25%" }}
                >
                  {uploadErrors.aadhar}
                </Typography>
              )}
            </Box>
            {errors.aadharNumber && (
              <Typography
                sx={{ color: "red", fontSize: "14px", marginTop: "5px" }}
              >
                {errors.aadharNumber}
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "4%",
                marginTop: "1.5rem",
              }}
            >
              <TextField
                name="AccountNumber"
                variant="outlined"
                label="Bank Account Number"
                value={docData.AccountNumber}
                onChange={handleChange}
                sx={{
                  width: "80%",
                  borderRadius: "10px",
                  backgroundColor: "#f8f7fc",
                  "& .MuiInputBase-input": {
                    maxHeight: "20px",
                    fontSize: "16px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": {
                    maxHeight: "20px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc", borderRadius: "10px" },
                  },
                }}
              />
              <Box>
                <input
                  type="file"
                  accept="application/pdf"
                  style={{ display: "none" }}
                  id="bank-upload"
                  onChange={(e) => handleFileUpload(e, "bank")}
                />

                <label htmlFor="bank-upload">
                  <Box
                    sx={{
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.2em",
                      maxWidth: "90%",
                      backgroundColor: "#F3F4F6",
                      borderRadius: "10px",
                      border: "1px solid #ccc",
                      padding: "0.8em 0.5em",
                    }}
                  >
                    {uploading.bank ? (
                      <CircularProgress size={20} />
                    ) : docData.bankUpload ? (
                      <>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flex: 1,
                            gap: "0.5em",
                          }}
                        >
                          <CheckCircleIcon color="success" fontSize="small" />
                          <Typography
                            sx={{
                              fontSize: "14px",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {docData.bankUpload.name}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          sx={{ padding: "4px" }}
                          onClick={() =>
                            setdocData((prev) => ({
                              ...prev,
                              bankUpload: null,
                            }))
                          }
                        >
                          <CancelOutlinedIcon fontSize="small" />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <UploadFileOutlinedIcon sx={{ fontSize: "20px" }} />
                        <Typography
                          sx={{ fontSize: "16px", fontFamily: "Albert Sans" }}
                        >
                          Upload
                        </Typography>
                      </>
                    )}
                  </Box>
                </label>
              </Box>
              {uploadErrors.bank && (
                <Typography
                  sx={{ color: "red", fontSize: "14px", minWidth: "25%" }}
                >
                  {uploadErrors.bank}
                </Typography>
              )}
            </Box>

            {errors.AccountNumber && (
              <Typography
                sx={{ color: "red", fontSize: "14px", marginTop: "5px" }}
              >
                {errors.AccountNumber}
              </Typography>
            )}

            <TextField
              name="IFSCNumber"
              variant="outlined"
              label="IFSC Code"
              value={docData.IFSCNumber}
              onChange={handleChange}
              sx={{
                width: "80%",
                borderRadius: "10px",
                marginTop: "1.5rem",
                backgroundColor: "#f8f7fc",
                "& .MuiInputBase-input": {
                  maxHeight: "20px",
                  fontSize: "16px",
                  fontFamily: "Albert Sans",
                },
                "& .MuiInputLabel-root": {
                  maxHeight: "20px",
                  fontFamily: "Albert Sans",
                },
                "& .MuiOutlinedInput-root": {
                  "& fieldset": { borderColor: "#ccc", borderRadius: "10px" },
                },
              }}
            />
            {errors.IFSCNumber && (
              <Typography
                sx={{ color: "red", fontSize: "14px", marginTop: "5px" }}
              >
                {errors.IFSCNumber}
              </Typography>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                margin: "1.5rem 0 0 0",
              }}
            >
              <Button
                variant="contained"
                disabled={submitting}
                sx={{
                  width: "100%",
                  backgroundColor: "#53a8d8",
                  color: "#fff",
                  fontSize: "16px",
                  padding: "1% 0",
                  "&:disabled": {
                    backgroundColor: "#a0c4dd",
                  },
                }}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Proceed"
                )}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              width: "100%",
              alignItems: "center",
            }}
          >
            {/* PAN Card Upload */}
            <Box
              sx={{
                width: "75%",
                margin: "0 auto",
                borderRadius: "10px",
                alignItems: "center",
                boxShadow: 3,
                justifyContent: "center",
                padding: "2rem",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "18px",
                      mb: "8%",
                    }}
                  >
                    Pan card
                  </Typography>
                  <Typography
                    sx={{ fontFamily: "albert sans", fontSize: "14px" }}
                  >
                    Enter your PAN card details
                  </Typography>
                </Box>

                <Box>
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    id="pan-upload"
                    onChange={(e) => handleFileUpload(e, "pan")}
                  />

                  <label htmlFor="pan-upload">
                    <Box
                      sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        gap: "0.5em",
                        width: "90px",
                        maxWidth: "100%",
                        backgroundColor: "#EFF6FF",
                        borderRadius: "10px",
                        padding: "0.5em",
                        overflow: "hidden",
                      }}
                    >
                      {uploading.pan ? (
                        <CircularProgress size={20} />
                      ) : docData.panUpload ? (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flex: 1,
                              gap: "0.5em",
                              width: "0",
                              flexGrow: 1,
                              minWidth: 0,
                            }}
                          >
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography
                              sx={{
                                fontSize: "14px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {docData.panUpload.name}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            sx={{ padding: "4px" }}
                            onClick={() =>
                              setdocData((prev) => ({
                                ...prev,
                                panUpload: null,
                              }))
                            }
                          >
                            <CancelOutlinedIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <UploadFileOutlinedIcon
                            sx={{ fontSize: "20px", color: "#19AEDC" }}
                          />
                          <Typography
                            sx={{
                              fontSize: "16px",
                              fontFamily: "Albert Sans",
                              color: "#19AEDC",
                            }}
                          >
                            Upload
                          </Typography>
                        </>
                      )}
                    </Box>
                  </label>
                </Box>
              </Box>

              <TextField
                name="panNumber"
                variant="outlined"
                placeholder="Pan Card Number"
                value={docData.panNumber}
                onChange={handleChange}
                sx={{
                  width: "100%",
                  borderRadius: "10px",
                  mt: "3%",
                  backgroundColor: "#f8f7fc",
                  "& .MuiInputBase-input": {
                    maxHeight: "16px",
                    fontSize: "16px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc", borderRadius: "10px" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#19AEDC",
                    },
                  },
                }}
              />

              {errors.panNumber && (
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "14px",
                    marginTop: "5px",
                    fontFamily: "albert sans",
                    ml: "2%",
                  }}
                >
                  {errors.panNumber}
                </Typography>
              )}
            </Box>

            {uploadErrors.pan && (
              <Box
                sx={{
                  display: "flex",
                  gap: "2%",
                  mt: "2%",
                  ml: "10%",
                  mb: "2%",
                }}
              >
                <ErrorOutlineIcon sx={{ color: "red" }} />
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "14px",
                    minWidth: "25%",
                    fontFamily: "albert sans",
                  }}
                >
                  {uploadErrors.pan}
                </Typography>
              </Box>
            )}

            {/* Aadhar Card Upload */}
            <Box
              sx={{
                width: "75%",
                margin: "6% auto 0 auto",
                borderRadius: "10px",
                alignItems: "center",
                boxShadow: 3,
                justifyContent: "center",
                padding: "2rem",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "18px",
                      mb: "8%",
                    }}
                  >
                    Aadhar card
                  </Typography>
                  <Typography
                    sx={{ fontFamily: "albert sans", fontSize: "14px" }}
                  >
                    Enter your Aadhar card details
                  </Typography>
                </Box>
                <Box>
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    id="aadhar-upload"
                    onChange={(e) => handleFileUpload(e, "aadhar")}
                  />

                  <label htmlFor="aadhar-upload">
                    <Box
                      sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        gap: "0.5em",
                        width: "90px",
                        maxWidth: "100%",
                        backgroundColor: "#EFF6FF",
                        borderRadius: "10px",
                        padding: "0.5em",
                        overflow: "hidden",
                      }}
                    >
                      {uploading.aadhar ? (
                        <CircularProgress size={20} />
                      ) : docData.aadharUpload ? (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flex: 1,
                              gap: "0.5em",
                              width: "0",
                              flexGrow: 1,
                              minWidth: 0,
                            }}
                          >
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography
                              sx={{
                                fontSize: "14px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {docData.aadharUpload.name}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            sx={{ padding: "4px" }}
                            onClick={() =>
                              setdocData((prev) => ({
                                ...prev,
                                aadharUpload: null,
                              }))
                            }
                          >
                            <CancelOutlinedIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <UploadFileOutlinedIcon
                            sx={{ fontSize: "20px", color: "#19AEDC" }}
                          />
                          <Typography
                            sx={{
                              fontSize: "16px",
                              fontFamily: "Albert Sans",
                              color: "#19AEDC",
                            }}
                          >
                            Upload
                          </Typography>
                        </>
                      )}
                    </Box>
                  </label>
                </Box>
              </Box>

              <TextField
                name="aadharNumber"
                variant="outlined"
                placeholder="Aadhar Card Number"
                value={docData.aadharNumber}
                onChange={handleChange}
                sx={{
                  width: "100%",
                  borderRadius: "10px",
                  mt: "3%",
                  backgroundColor: "#f8f7fc",
                  "& .MuiInputBase-input": {
                    maxHeight: "16px",
                    fontSize: "16px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc", borderRadius: "10px" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#19AEDC",
                    },
                  },
                }}
              />

              {errors.aadharNumber && (
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "14px",
                    marginTop: "5px",
                    fontFamily: "albert sans",
                    ml: "2%",
                  }}
                >
                  {errors.aadharNumber}
                </Typography>
              )}
            </Box>

            {uploadErrors.aadhar && (
              <Box
                sx={{
                  display: "flex",
                  gap: "2%",
                  mt: "2%",
                  ml: "10%",
                  mb: "2%",
                }}
              >
                <ErrorOutlineIcon sx={{ color: "red" }} />
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "14px",
                    minWidth: "25%",
                    fontFamily: "albert sans",
                  }}
                >
                  {uploadErrors.aadhar}
                </Typography>
              </Box>
            )}

            {/*Enter your bank account details */}
            <Box
              sx={{
                width: "75%",
                margin: "6% auto 0 auto",
                borderRadius: "10px",
                alignItems: "center",
                boxShadow: 3,
                justifyContent: "center",
                padding: "2rem",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  width: "100%",
                  justifyContent: "space-between",
                }}
              >
                <Box>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "18px",
                      mb: "8%",
                    }}
                  >
                    Bank Account
                  </Typography>
                  <Typography
                    sx={{ fontFamily: "albert sans", fontSize: "14px" }}
                  >
                    Enter your Bank Account details
                  </Typography>
                </Box>
                <Box>
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    id="bank-upload"
                    onChange={(e) => handleFileUpload(e, "bank")}
                  />

                  <label htmlFor="bank-upload">
                    <Box
                      sx={{
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-around",
                        gap: "0.5em",
                        width: "90px",
                        maxWidth: "100%",
                        backgroundColor: "#EFF6FF",
                        borderRadius: "10px",
                        padding: "0.5em",
                        overflow: "hidden",
                      }}
                    >
                      {uploading.bank ? (
                        <CircularProgress size={20} />
                      ) : docData.bankUpload ? (
                        <>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              flex: 1,
                              gap: "0.5em",
                              width: "0",
                              flexGrow: 1,
                              minWidth: 0,
                            }}
                          >
                            <CheckCircleIcon color="success" fontSize="small" />
                            <Typography
                              sx={{
                                fontSize: "14px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {docData.bankUpload.name}
                            </Typography>
                          </Box>
                          <IconButton
                            size="small"
                            sx={{ padding: "4px" }}
                            onClick={() =>
                              setdocData((prev) => ({
                                ...prev,
                                bankUpload: null,
                              }))
                            }
                          >
                            <CancelOutlinedIcon fontSize="small" />
                          </IconButton>
                        </>
                      ) : (
                        <>
                          <UploadFileOutlinedIcon
                            sx={{ fontSize: "20px", color: "#19AEDC" }}
                          />
                          <Typography
                            sx={{
                              fontSize: "16px",
                              fontFamily: "Albert Sans",
                              color: "#19AEDC",
                            }}
                          >
                            Upload
                          </Typography>
                        </>
                      )}
                    </Box>
                  </label>
                </Box>
              </Box>

              <TextField
                name="AccountNumber"
                variant="outlined"
                placeholder="Bank Account Number"
                value={docData.AccountNumber}
                onChange={handleChange}
                sx={{
                  width: "100%",
                  borderRadius: "10px",
                  mt: "3%",
                  backgroundColor: "#f8f7fc",
                  "& .MuiInputBase-input": {
                    maxHeight: "16px",
                    fontSize: "16px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc", borderRadius: "10px" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#19AEDC",
                    },
                  },
                }}
              />

              {errors.AccountNumber && (
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "14px",
                    marginTop: "5px",
                    fontFamily: "albert sans",
                    ml: "2%",
                  }}
                >
                  {errors.AccountNumber}
                </Typography>
              )}

              <TextField
                name="IFSCNumber"
                variant="outlined"
                placeholder="IFSC Code"
                value={docData.IFSCNumber}
                onChange={handleChange}
                sx={{
                  width: "100%",
                  borderRadius: "10px",
                  mt: "3%",
                  backgroundColor: "#f8f7fc",
                  "& .MuiInputBase-input": {
                    maxHeight: "16px",
                    fontSize: "16px",
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiOutlinedInput-root": {
                    "& fieldset": { borderColor: "#ccc", borderRadius: "10px" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#19AEDC",
                    },
                  },
                }}
              />
              {errors.IFSCNumber && (
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "14px",
                    marginTop: "5px",
                    fontFamily: "albert sans",
                    ml: "2%",
                  }}
                >
                  {errors.IFSCNumber}
                </Typography>
              )}
            </Box>

            {uploadErrors.bank && (
              <Box
                sx={{
                  display: "flex",
                  gap: "2%",
                  mt: "2%",
                  ml: "10%",
                  mb: "2%",
                }}
              >
                <ErrorOutlineIcon sx={{ color: "red" }} />
                <Typography
                  sx={{
                    color: "red",
                    fontSize: "14px",
                    minWidth: "25%",
                    fontFamily: "albert sans",
                  }}
                >
                  {uploadErrors.bank}
                </Typography>
              </Box>
            )}

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                margin: "1.5rem 0 2rem 0",
              }}
            >
              <Button
                variant="contained"
                disabled={submitting}
                sx={{
                  width: "85%",
                  backgroundColor: "#53a8d8",
                  color: "#fff",
                  fontSize: "16px",
                  padding: "1% 0",
                  "&:disabled": {
                    backgroundColor: "#a0c4dd",
                  },
                }}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <CircularProgress size={22} sx={{ color: "#fff" }} />
                ) : (
                  "Proceed"
                )}
              </Button>
            </Box>
          </Box>
        )}

        {/*Right side box */}

        {!isTab ? (
          <Box
            sx={{
              width: "28%",
              borderRadius: "10px",
              alignItems: "center",
              boxShadow: 3,
              padding: "2rem",
              display: "block",
            }}
          >
            <Typography
              sx={{
                fontFamily: "albert sans",
                textAlign: "center",
                fontSize: "22px",
                mb: "6%",
                fontWeight: "700",
              }}
            >
              Document Verification Process
            </Typography>

            <Box sx={{ display: "flex", gap: "5%", mb: "5%", mt: "2%" }}>
              <Box
                sx={{
                  backgroundColor: "#DBEAFE",
                  borderRadius: "50%",
                  width: 45,
                  height: 45,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UploadFileOutlinedIcon sx={{ fontSize: 25 }} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "20px",
                    fontWeight: "500",
                  }}
                >
                  Upload Documents
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "16px",
                    color: "#6B7280",
                    fontWeight: "400",
                    mt: "-1%",
                  }}
                >
                  Secure file upload
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: "5%", mb: "5%" }}>
              <Box
                sx={{
                  backgroundColor: "#D1FAE5",
                  borderRadius: "50%",
                  width: 45,
                  height: 45,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CachedIcon sx={{ fontSize: 25 }} />
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "20px",
                    fontWeight: "500",
                  }}
                >
                  Processing
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "16px",
                    color: "#6B7280",
                    fontWeight: "400",
                    mt: "-1%",
                  }}
                >
                  Automated verification
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: "5%", mb: "5%" }}>
              <Box
                sx={{
                  backgroundColor: "#EDE9FE",
                  borderRadius: "50%",
                  width: 45,
                  height: 45,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DoneIcon sx={{ fontSize: 25 }} />
              </Box>
              <Box>
                <Typography
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "20px",
                    fontWeight: "500",
                  }}
                >
                  Verification Complete
                </Typography>
                <Typography
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "16px",
                    color: "#6B7280",
                    fontWeight: "400",
                    mt: "-1%",
                  }}
                >
                  Ready to proceed
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : (
          <></>
        )}
      </Box>
    </Box>
  );
};

export default VendorDocument;
