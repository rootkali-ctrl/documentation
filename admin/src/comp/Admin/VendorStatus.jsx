import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Typography,
} from "@mui/material";
import { CheckCircle, Cancel } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { db, auth } from "../../firebase/firebase_config";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";

const VendorDetails = () => {
  const { state } = useLocation();
  const request = state?.data;
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Please log in to access this page.");
        setLoading(false);
        return;
      }

      try {
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          setError("Admin profile not found.");
          setLoading(false);
          return;
        }

        const data = adminDoc.data();
        setLastLogin(data.lastlogin || "");
      } catch (err) {
        setError("Failed to load admin details: " + err.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatLastLogin = (timestamp) => {
    if (!timestamp) return "Never";
    try {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch (err) {
      return "Invalid date";
    }
  };

  const viewDocument = (documentUrl) => {
    if (!documentUrl) {
      setDialogContent("Document URL is missing or invalid.");
      setDialogOpen(true);
      return;
    }

    console.log("Opening document URL:", documentUrl);

    if (documentUrl && typeof documentUrl === "string") {
      window.open(documentUrl, "_blank");
    } else {
      setDialogContent("Invalid document URL format.");
      setDialogOpen(true);
    }
  };

  const sendVendorEmail = async (email, vendorName, status) => {
    try {
      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      const payload = {
        to: email,
        vendorName: vendorName || "Vendor",
        status: status,
      };

      console.log(
        "Sending email notification to:",
        `${baseUrl}/api/admin/send-email`,
        payload
      );
      const response = await axios.post(
        `${baseUrl}/api/admin/send-email`,
        payload
      );
      console.log("Email notification response:", response.data);
      return response.data;
    } catch (err) {
      console.error("Error sending email notification:", err);
      throw new Error(
        `Failed to send email notification: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  const handleAction = async (action, request) => {
    try {
      setIsLoading(true); // disable buttons
      if (!request || !request.email) {
        setDialogContent("Vendor data is missing or invalid.");
        setDialogOpen(true);
        return;
      }

      const payload = {
        email: request.email,
        vendorName: request.username || "Vendor",
      };
      console.log("Payload being sent for action:", payload);

      const baseUrl = process.env.REACT_APP_API_BASE_URL;
      console.log("Using API base URL:", baseUrl);

      let response;

      switch (action) {
        case "accepted":
          console.log(
            "Sending approval request to:",
            `${baseUrl}/api/admin/requests`
          );
          response = await axios.put(`${baseUrl}/api/admin/requests`, payload);
          console.log("Approval response:", response.data);
          await sendVendorEmail(request.email, request.username, "accepted");
          break;

        case "rejected":
          console.log(
            "Sending rejection request to:",
            `${baseUrl}/api/admin/rejectvendor`
          );
          response = await axios.delete(`${baseUrl}/api/admin/rejectvendor`, {
            data: payload,
          });
          console.log("Rejection response:", response.data);
          await sendVendorEmail(request.email, request.username, "rejected");
          break;

        default:
          throw new Error(`Unknown action type: ${action}`);
      }

      setDialogContent(`Vendor ${action} successfully.`);
      setDialogOpen(true);
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      setDialogContent(
        `Failed to ${action} vendor: ${
          err.response?.data?.message || err.message
        }. Please check if the vendor is already ${
          action === "accepted" ? "approved" : "rejected"
        } or contact support.`
      );
      setDialogOpen(true);
    } finally {
      setIsLoading(false); // re-enable buttons
    }
  };

  const askForConfirmation = (action, request) => {
    setPendingAction(action);
    setPendingRequest(request);
    setConfirmDialogOpen(true);
  };

  const confirmAction = () => {
    if (pendingAction && pendingRequest) {
      handleAction(pendingAction, pendingRequest);
    }
    setConfirmDialogOpen(false);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    navigate("/admin/loginsettings");
  };

  return (
    <Box height="auto" display="flex" flexDirection="column" bgcolor="#faf9fb">
      <Box
        height={49}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={5}
        py={2}
        borderBottom="1px solid #ddd"
        bgcolor="#f9fafb"
      >
        <Typography variant="h4">
          <Box component="span" fontWeight="bold" color="#19aedc">
            ticketb
          </Box>
          <Box component="span" fontWeight="bold" color="black">
            admin
          </Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>
          Last login at{" "}
          {lastLogin ? formatLastLogin(lastLogin) : "May 13, 2025 02:46 PM"}
        </Typography>
      </Box>

      <Container maxWidth={false} sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h4" fontWeight="bold">
              Vendor Details
            </Typography>
            {request.status === "pending" ? (
              <Box display="flex" gap={2}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "green",
                    color: "white",
                    "&:hover": { backgroundColor: "#00BC01" },
                  }}
                  startIcon={<CheckCircle />}
                  onClick={() => askForConfirmation("accepted", request)}
                  disabled={isLoading}
                >
                  Accept Vendor
                </Button>

                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => askForConfirmation("rejected", request)}
                  disabled={isLoading}
                >
                  Reject Vendor
                </Button>
              </Box>
            ) : (
              <></>
            )}
          </Box>
          <Dialog
            open={confirmDialogOpen}
            onClose={() => setConfirmDialogOpen(false)}
          >
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Are you sure you want to <strong>{pendingAction}</strong> this
                vendor?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={confirmAction} color="error" variant="contained">
                Confirm
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog open={dialogOpen} onClose={handleDialogClose}>
            <DialogTitle>Action Result</DialogTitle>
            <DialogContent>
              <DialogContentText>{dialogContent}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleDialogClose}>OK</Button>
            </DialogActions>
          </Dialog>
        </Box>

        <Card sx={{ mb: 4, boxShadow: 0 }}>
          <CardContent>
            <Box display="flex" gap={3} margin={3}>
              <Box flex={1}>
                <Typography mt={1} variant="h5" fontWeight="bold" gutterBottom>
                  Personal Information
                </Typography>
                <Grid container spacing={2} gap={10}>
                  <Grid item xs={12} sm={6}>
                    <Typography mt={2} color="text.secondary">
                      Username
                    </Typography>
                    <Typography>{request?.username || "N/A"}</Typography>
                    <Typography mt={1} color="text.secondary">
                      Email ID
                    </Typography>
                    <Typography>{request?.email || "N/A"}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography mt={2} color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography>
                      {request?.organisationContact || "N/A"}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card
          sx={{
            p: 3,
            mb: 4,
            boxShadow: 0,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              fontWeight="bold"
              mb={2}
              sx={{}}
            >
              Documents
            </Typography>
            <Box
              spacing={4}
              display="flex"
              flexWrap="wrap"
              sx={{ justifyContent: "center", gap: 10 }}
            >
              <Box>
                <Box
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    p: 2,
                    height: "100%",
                    width: "100%",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                    gap={20}
                  >
                    <Typography fontWeight="600">PAN Card</Typography>
                    <Box sx={{ color: "#19AEDC" }}>
                      <Typography
                        onClick={() =>
                          viewDocument(request?.documents?.panUpload)
                        }
                        sx={{
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        View pdf
                      </Typography>
                    </Box>
                  </Box>
                  <Typography color="text.primary" variant="body1">
                    {request?.panNumber || "N/A"}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Box
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    p: 2,
                    height: "100%",
                    width: "100%",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                    gap={20}
                  >
                    <Typography fontWeight="600">Aadhar Card</Typography>
                    <Box sx={{ color: "#19AEDC" }}>
                      <Typography
                        sx={{
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={() =>
                          viewDocument(request?.documents?.aadharUpload)
                        }
                      >
                        View pdf
                      </Typography>
                    </Box>
                  </Box>
                  <Typography color="text.primary" variant="body1">
                    {request?.aadharNumber || "N/A"}
                  </Typography>
                </Box>
              </Box>

              <Box>
                <Box
                  sx={{
                    border: "1px solid #e0e0e0",
                    borderRadius: 2,
                    p: 2,
                    height: "100%",
                    width: "100%",
                    backgroundColor: "background.paper",
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                    gap={20}
                  >
                    <Typography fontWeight="600">Bank Details</Typography>
                    <Box sx={{ color: "#19AEDC" }}>
                      <Typography
                        sx={{
                          cursor: "pointer",
                          "&:hover": { textDecoration: "underline" },
                        }}
                        onClick={() =>
                          viewDocument(request?.documents?.bankUpload)
                        }
                      >
                        View pdf
                      </Typography>
                    </Box>
                  </Box>
                  <Typography color="text.primary" variant="body1">
                    A/C: {request?.AccountNumber || "N/A"}
                  </Typography>
                  <Typography color="text.primary" variant="body1">
                    IFSC: {request?.IFSCNumber || "N/A"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Paper
          sx={{
            p: 3,
            mb: 4,
            boxShadow: 0,
            borderRadius: 3,
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Organization Details
          </Typography>
          <Box
            display="flex"
            flexWrap="wrap"
            justifyContent="space-between"
            gap={2}
            mt={3}
          >
            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Organization Name</Typography>
              <Typography fontWeight={500}>
                {request?.organisationName || "N/A"}
              </Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Type</Typography>
              <Typography fontWeight={500}>
                {request?.organisationType || "N/A"}
              </Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">GSTIN</Typography>
              <Typography fontWeight={500}>
                {request?.GSTIN || "N/A"}
              </Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Organization Email</Typography>
              <Typography fontWeight={500}>
                {request?.organisationMail || "N/A"}
              </Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Contact Number</Typography>
              <Typography fontWeight={500}>
                {request?.organisationContact || "N/A"}
              </Typography>
            </Box>
            <Box width={{ xs: "100%", md: "30%" }} mb={3}></Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default VendorDetails;
