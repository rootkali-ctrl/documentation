import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { motion } from "framer-motion";
import HeaderVendor from "../Header/HeaderVendor";
import { useNavigate } from "react-router-dom";
import UploadFileOutlinedIcon from "@mui/icons-material/UploadFileOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import axios from "axios";
import { useVendor } from "./VendorContext";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

const VendorDocument = () => {
  const navigate = useNavigate();
  const { vendorData } = useVendor();

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
      uploadErrors.pan = "PAN Card is required";
    }
    if (!docData.aadharUpload) {
      uploadErrors.aadhar = "Aadhar Card is required";
    }
    if (!docData.bankUpload) {
      uploadErrors.bank = "Bank Document is required";
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
          "http://localhost:8080/api/vendor/signin",
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
        alert("Error submitting vendor details");
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
    <Box>
      <HeaderVendor />
      <Typography
        variant="h4"
        sx={{
          fontWeight: "bold",
          mt: "3%",
          color: "#1a1033",
          textAlign: "center",
          width: "100%",
          fontFamily: "Albert Sans",
        }}
      >
        Vendor Documentation Details
      </Typography>
      <Typography
        variant="h6"
        sx={{
          fontWeight: "light",
          color: "#1a1033",
          textAlign: "center",
          width: "100%",
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
          width: "90%",
          backgroundColor: "#fff",
          margin: "2% auto",
        }}
      >
        <Box
          sx={{
            width: "55%",
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

        {/* <Box
          sx={{
            width: "40%",
            textAlign: "center",
            alignItems: "center",
            justifyItems: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                color: "#000",
                textTransform: "uppercase",
                fontFamily: "Albert Sans",
              }}
            >
              Some <br />
              Animation/
              <br />
              Words <br />
              Goes Here
            </Typography>
          </motion.div>
        </Box> */}
      </Box>
    </Box>
  );
};

export default VendorDocument;