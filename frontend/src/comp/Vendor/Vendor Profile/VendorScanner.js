import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Alert,
  AlertTitle,
  IconButton,
  Card,
  CardContent,
  AppBar,
  Toolbar,
  Container,
  Chip,
  CircularProgress,
  Backdrop,
  Divider,
} from "@mui/material";
import React, { useState, useEffect, useRef } from "react";
import { Camera, AlertCircle, Smartphone, CheckCircle, X } from "lucide-react";
import { useMediaQuery } from "@mui/material";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode"; // Changed from Html5QrcodeScanner
import { db } from "../../../firebase/firebase_config";
import { doc, getDoc } from "firebase/firestore";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GppGoodIcon from "@mui/icons-material/GppGood";
import EditDocumentIcon from "@mui/icons-material/EditDocument";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import QrCodeScannerOutlinedIcon from "@mui/icons-material/QrCodeScannerOutlined";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import VendorProfileHeader from "./VendorProfileHeader";

const VendorScanner = () => {
  const { vendorId } = useParams();
  const isMobileScreen = useMediaQuery("(max-width:768px)");
  const [scanResult, setScanResult] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

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
      active: false,
      path: `/vendorprofile/vendororganization/${vendorId}`,
    },
    {
      name: "Scanner",
      icon: <QrCodeScannerOutlinedIcon />,
      active: true,
      path: `/vendorprofile/vendorscanner/${vendorId}`,
    },
  ];

  // Cleanup scanner on unmount
  useEffect(() => {
    console.log(vendorId);
    return () => {
      stopScanner();
    };
  }, []);

  const startCamera = async () => {
    try {
      setError("");
      setIsScanning(true);
      setCameraStarted(true);

      // Wait for the DOM element to be rendered
      setTimeout(async () => {
        try {
          const scannerElement = document.getElementById("qr-scanner");
          if (!scannerElement) {
            throw new Error("Scanner element not found in DOM");
          }

          // Create new scanner instance
          const scanner = new Html5Qrcode("qr-scanner");
          scannerRef.current = scanner;

          // Configuration for camera
          const config = {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: false,
          };

          // Start scanning with camera directly (no file upload option)
          await scanner.start(
            { facingMode: "environment" }, // Use back camera
            config,
            onScanSuccess,
            onScanFailure
          );
        } catch (error) {
          console.error("Camera start error:", error);
          setError("Failed to start camera. Please check camera permissions.");
          setIsScanning(false);
          setCameraStarted(false);
        }
      }, 100); // Small delay to ensure DOM is updated
    } catch (error) {
      console.error("Camera initialization error:", error);
      setError("Failed to initialize camera.");
      setIsScanning(false);
      setCameraStarted(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error("Error stopping scanner:", error);
      }
    }
    setIsScanning(false);
    setCameraStarted(false);
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log("Raw QR Code scanned:", decodedText);

    // Stop scanning immediately after successful scan
    await stopScanner();

    // Clean the scanned text (remove # and trim)
    const cleanedText = decodedText.replace(/^#+|#+$/g, "").trim();
    console.log("Cleaned QR text:", cleanedText);

    setScanResult(cleanedText);

    // Try to parse the data
    let parsedData;
    try {
      // Try to parse as JSON first
      parsedData = JSON.parse(cleanedText);
      console.log("Parsed as JSON:", parsedData);
    } catch (error) {
      // If not JSON, treat as booking ID
      parsedData = { bookingId: cleanedText };
      console.log("Treated as booking ID:", parsedData);
    }

    setScannedData(parsedData);
  };

  const onScanFailure = (error) => {
    // Handle scan failure silently - this fires frequently during scanning
    console.debug("QR scan failed:", error);
  };

  const resetScanner = async () => {
    await stopScanner();
    setScanResult(null);
    setScannedData(null);
    setIsVerifying(false);
    setVerificationStatus(null);
    setError("");
  };

  const proceedWithBooking = async () => {
    if (!scannedData || !scannedData.bookingId) {
      setError("No booking ID found");
      return;
    }

    try {
      setIsVerifying(true);
      setError("");
      setVerificationStatus(null);

      const bookingId = scannedData.bookingId;
      console.log("Verifying booking ID:", bookingId);
      console.log("Expected vendor ID:", vendorId);

      // Get ticket document from Firestore
      const ticketRef = doc(db, "tickets", bookingId);
      const ticketSnap = await getDoc(ticketRef);

      if (!ticketSnap.exists()) {
        throw new Error("Ticket not found in database");
      }

      const ticketData = ticketSnap.data();
      const firestoreVendorId = ticketData.vendorId;

      console.log("Firestore vendor ID:", firestoreVendorId);
      console.log("URL vendor ID:", vendorId);

      // Check if vendor IDs match
      if (firestoreVendorId === vendorId) {
        setVerificationStatus("success");

        // Wait a moment to show success, then navigate
        setTimeout(() => {
          navigate(`/vendorprofile/${vendorId}/booking/${bookingId}`);
        }, 2000);
      } else {
        setVerificationStatus("mismatch");
        setError(
          `This ticket belongs to a different venue. Only authorized vendor can scan the tickets.`
        );
      }
    } catch (error) {
      console.error("Firestore verification error:", error);
      setVerificationStatus("error");
      setError(error.message || "Failed to verify ticket. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div>
      {vendorId ? (
        <VendorProfileHeader vendorId={vendorId} />
      ) : (
        <p>Loading header...</p>
      )}
      <Box display="flex" flex={1} sx={{ height: "100vh" }}>
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
        <Box flex={1}>
          <Box sx={{ minHeight: "100vh", bgcolor: "#f9fafb" }}>
            <Container
              maxWidth={isMobileScreen ? "sm" : "lg"}
              sx={{
                py: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                minHeight: "calc(100vh - 200px)",
              }}
            >
              {/* Error Display */}
              {error && (
                <Alert
                  severity="error"
                  sx={{ width: "100%", mb: 2 }}
                  action={
                    <IconButton
                      size="small"
                      onClick={() => setError("")}
                      color="inherit"
                    >
                      <X size={16} />
                    </IconButton>
                  }
                >
                  {error}
                </Alert>
              )}

              {!isMobileScreen ? (
                <Box sx={{ mt: "5em" }}>
                  {/* <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "35px",
                      mb: "1em",
                    }}
                  >
                    {" "}
                    Oh No..!
                  </Typography> */}
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: { lg: "35px", md: "30px" },
                      mb: "1em",
                    }}
                  >
                    The QR scanning feature is specifically designed for use on
                    mobile devices.{" "}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: { lg: "35px", md: "30px" },
                      mb: "1em",
                    }}
                  >
                    To proceed with scanning, please open this page on your
                    smartphone.
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: { lg: "35px", md: "30px" },
                      mb: "1em",
                    }}
                  >
                    {" "}
                    This ensures proper access to your device's camera and
                    delivers a seamless scanning experience.{" "}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: { lg: "35px", md: "30px" },
                      mb: "1em",
                    }}
                  >
                    Simply scan the event QR code using your mobile device to
                    continue.
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ width: "100%", height: "auto", mt: "200px" }}>
                    <Box
                      sx={{ display: "flex", gap: "2%", alignItems: "center" }}
                    >
                      <CameraAltOutlinedIcon sx={{ fontSize: "35px" }} />
                      <Typography
                        sx={{
                          color: "black",
                          fontFamily: "albert sans",
                          fontSize: "26px",
                          fontWeight: "700",
                        }}
                      >
                        Scanner
                      </Typography>
                    </Box>
                    <Divider
                      sx={{ width: "100%", m: "20px 0", borderColor: "#ccc" }}
                    />

                    {!scanResult ? (
                      <Box sx={{ width: "100%" }}>
                        {/* Camera Scanner Container */}
                        <Box
                          sx={{
                            borderRadius: 2,
                            overflow: "hidden",
                            minHeight: "300px",
                            bgcolor: "grey.100",
                            mb: 2,
                            position: "relative",
                          }}
                        >
                          {!cameraStarted ? (
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "300px",
                                gap: 2,
                              }}
                            >
                              <Button
                                onClick={startCamera}
                                variant="contained"
                                size="large"
                                disabled={isScanning}
                                startIcon={
                                  isScanning ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <Camera />
                                  )
                                }
                                sx={{
                                  backgroundColor: "#19AEDC",
                                  color: "white",
                                  padding: "12px 24px",
                                  fontWeight: "600",
                                  fontSize: "18px",
                                  fontFamily: "Albert Sans",
                                  textTransform: "none",
                                }}
                              >
                                {isScanning
                                  ? "Starting Camera..."
                                  : "Start Camera"}
                              </Button>
                              <Typography
                                sx={{
                                  color: "black",
                                  fontFamily: "albert sans",
                                  fontSize: "16px",
                                  textAlign: "center",
                                  px: 2,
                                }}
                              >
                                Point your camera at the QR code on the ticket
                                to scan it.
                              </Typography>
                            </Box>
                          ) : (
                            <>
                              {/* QR Scanner Element - Always render when camera is started */}
                              <div
                                id="qr-scanner"
                                style={{
                                  width: "100%",
                                  minHeight: "250px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                }}
                              ></div>

                              {/* Stop Scanner Button */}
                              <Box
                                sx={{
                                  position: "absolute",
                                  bottom: 10,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  zIndex: 10,
                                }}
                              >
                                <Button
                                  onClick={stopScanner}
                                  variant="contained"
                                  color="error"
                                  size="small"
                                >
                                  Stop Scanner
                                </Button>
                              </Box>
                            </>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ width: "100%" }}>
                        <Card sx={{ bgcolor: "rgba(209,213,219,0.3)" }}>
                          <CardContent sx={{ textAlign: "center" }}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "center",
                                mb: 2,
                              }}
                            >
                              <CheckCircle size={48} color="#4caf50" />
                            </Box>
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              gutterBottom
                            >
                              QR Code Scanned!
                            </Typography>

                            {/* Display scanned data */}
                            <CardContent>
                              <Typography
                                variant="subtitle1"
                                fontWeight="bold"
                                gutterBottom
                              >
                                Booking ID Retrieved:
                              </Typography>

                              <Typography
                                variant="h6"
                                sx={{
                                  wordBreak: "break-all",
                                  color: "#4caf50",
                                }}
                              >
                                {scannedData?.bookingId || scanResult}
                              </Typography>

                              {scannedData &&
                                Object.keys(scannedData).length > 1 && (
                                  <>
                                    <Typography
                                      variant="body2"
                                      color="grey.300"
                                      gutterBottom
                                    >
                                      Additional Data:
                                    </Typography>
                                    <Paper sx={{ bgcolor: "grey.600", p: 1 }}>
                                      {Object.entries(scannedData)
                                        .filter(([key]) => key !== "bookingId")
                                        .map(([key, value]) => (
                                          <Typography
                                            key={key}
                                            variant="body2"
                                            sx={{ mb: 0.5 }}
                                          >
                                            <Typography
                                              component="span"
                                              color="lightblue"
                                            >
                                              {key}:
                                            </Typography>{" "}
                                            {value}
                                          </Typography>
                                        ))}
                                    </Paper>
                                  </>
                                )}
                            </CardContent>

                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 1,
                              }}
                            >
                              <Button
                                onClick={proceedWithBooking}
                                variant="contained"
                                sx={{
                                  bgcolor: "#19AEDC",
                                  width: "70%",
                                  textTransform: "none",
                                  margin: "0 auto 1em auto",
                                }}
                                disabled={
                                  !scannedData?.bookingId || isVerifying
                                }
                                startIcon={
                                  isVerifying && <CircularProgress size={16} />
                                }
                              >
                                {isVerifying
                                  ? "Verifying..."
                                  : "Proceed with Booking"}
                              </Button>

                              {/* Status Display */}
                              {verificationStatus === "success" && (
                                <Alert
                                  severity="success"
                                  icon={<CheckCircle size={16} />}
                                >
                                  Verified! Redirecting...
                                </Alert>
                              )}

                              {verificationStatus === "mismatch" && (
                                <Alert
                                  severity="warning"
                                  icon={<AlertCircle size={16} />}
                                >
                                  Venue Mismatch
                                </Alert>
                              )}

                              {verificationStatus === "error" && (
                                <Alert severity="error" icon={<X size={16} />}>
                                  Verification Failed
                                </Alert>
                              )}

                              <Button
                                onClick={resetScanner}
                                variant="contained"
                                disabled={isVerifying}
                                sx={{
                                  bgcolor: "#19AEDC",
                                  width: "70%",
                                  textTransform: "none",
                                  margin: "0 auto",
                                }}
                              >
                                Scan Another QR Code
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    )}

                    <Box
                      sx={{ textAlign: "center", color: "white", px: 2, mt: 2 }}
                    >
                      {!scanResult && cameraStarted && (
                        <>
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            gutterBottom
                            sx={{ color: "black" }}
                          >
                            Position QR Code in the Frame
                          </Typography>
                          <Typography sx={{ color: "grey.600" }}>
                            Make sure the QR code is clearly visible within the
                            scanning area
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>
                </>
              )}
            </Container>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default VendorScanner;
