import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  styled,
} from "@mui/material";
import { Delete, Description, AccountBalance } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase_config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const events = [];

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
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastLogin, setLastLogin] = useState("");
  const [error, setError] = useState(null);

  // Function to mask sensitive data showing only last 4 characters
  const maskSensitiveData = (data) => {
    if (!data || typeof data !== 'string') return 'N/A';
    if (data.length <= 4) return data; // If 4 or fewer characters, show all
    const maskedPart = '*'.repeat(data.length - 4);
    const lastFour = data.slice(-4);
    return maskedPart + lastFour;
  };

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

  useEffect(() => {
    const fetchVendorEvents = async () => {
      if (!request?.email) return;

      try {
        // Step 1: Fetch vendor ID using email
        const vendorQuery = query(
          collection(db, "vendors"),
          where("email", "==", request.email)
        );
        const vendorSnapshot = await getDocs(vendorQuery);

        if (vendorSnapshot.empty) {
          console.warn("No vendor found with the given email.");
          setEvents([]); // or handle gracefully
          return;
        }

        const vendorDoc = vendorSnapshot.docs[0];
        const vendorId = vendorDoc.id;

        // Step 2: Fetch events by vendorId
        const eventsQuery = query(
          collection(db, "events"),
          where("vendorId", "==", vendorId)
        );
        const eventsSnapshot = await getDocs(eventsQuery);

        const fetchedEvents = eventsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setEvents(fetchedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchVendorEvents();
  }, [request]);

  const handleAction = async (action, request) => {
    try {
      setIsLoading(true);

      if (!request || !request.email) {
        setDialogContent("Vendor data is missing or invalid.");
        setDialogOpen(true);
        return;
      }

      const payload = { email: request.email };

      if (action === "removed") {
        await axios.delete(
          `${process.env.REACT_APP_API_BASE_URL}/api/admin/removevendor`,
          { data: payload }
        );
      } else {
        setDialogContent("Unsupported action");
        setDialogOpen(true);
        return;
      }

      setDialogContent(`Vendor ${action} successfully`);
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      setDialogContent(`Failed to ${action} vendor`);
    } finally {
      setDialogOpen(true);
      setIsLoading(false);
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

  const getStatusChip = (status) => {
    const chipStyles = {
      Active: { bg: "#C6F6D5", text: "#22543D" },
      Upcoming: { bg: "#FEF3C7", text: "#92400E" },
      Completed: { bg: "#E2E8F0", text: "#1A202C" },
    };

    const { bg, text } = chipStyles[status] || chipStyles["Completed"];

    return (
      <Chip
        label={status}
        size="small"
        sx={{
          backgroundColor: bg,
          color: text,
          fontWeight: "bold",
          borderRadius: "4px",
        }}
      />
    );
  };

  return (
    <Box height="auto" display="flex" flexDirection="column" bgcolor="#faf9fb">
      <Box
        height={89}
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
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={() => askForConfirmation("removed", request)}
              disabled={isLoading}
            >
              {isLoading ? "Removing..." : "Remove Vendor"}
            </Button>
          </Box>
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
            <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmAction} color="error" variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle>Vendor Action</DialogTitle>
          <DialogContent>
            <Typography>{dialogContent}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDialogClose} autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>

        <Card sx={{ mb: 4, boxShadow: 0 }}>
          <CardContent>
            <Box display="flex" gap={3} margin={3}>
              {/* <Avatar  mt={1} sx={{ width: 120, height: 120 }} src={userData.profileImage} alt={userData.username} /> */}
              <Box flex={1}>
                <Typography mt={1} variant="h5" fontWeight="bold" gutterBottom>
                  Personal Information
                </Typography>
                <Grid container spacing={2} gap={10}>
                  <Grid item xs={12} sm={6}>
                    <Typography mt={2} color="text.secondary">
                      Username
                    </Typography>
                    <Typography>{request.username}</Typography>
                    <Typography mt={1} color="text.secondary">
                      Email ID
                    </Typography>
                    <Typography>{request.email}</Typography>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography mt={2} color="text.secondary">
                      Phone Number
                    </Typography>
                    <Typography>{request.organisationContact}</Typography>
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
              {/* PAN Card Box */}
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
                        onClick={() => {
                          if (request?.documents?.panUpload)
                            window.open(request.documents.panUpload, "_blank");
                        }}
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
                    {maskSensitiveData(request.panNumber)}
                  </Typography>
                </Box>
              </Box>

              {/* Aadhar Card Box */}
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
                        onClick={() => {
                          if (request?.documents?.aadharUpload) {
                            window.open(
                              request.documents.aadharUpload,
                              "_blank"
                            );
                          }
                        }}
                      >
                        View pdf
                      </Typography>
                    </Box>
                  </Box>
                  <Typography color="text.primary" variant="body1">
                    {maskSensitiveData(request.aadharNumber)}
                  </Typography>
                </Box>
              </Box>

              {/* Bank Details Box */}
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
                        onClick={() => {
                          if (request?.documents?.bankUpload) {
                            window.open(request.documents.bankUpload, "_blank");
                          }
                        }}
                      >
                        View pdf
                      </Typography>
                    </Box>
                  </Box>
                  <Typography color="text.primary" variant="body1">
                    A/C: {maskSensitiveData(request.AccountNumber)}
                  </Typography>
                  <Typography color="text.primary" variant="body1">
                    IFSC: {maskSensitiveData(request.IFSCNumber)}
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
                {request.organisationName}
              </Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Type</Typography>
              <Typography fontWeight={500}>
                {request.organisationType}
              </Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">GSTIN</Typography>
              <Typography fontWeight={500}>
                {request.GSTIN === "" ? "none" : request.GSTIN}
              </Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Organization Email</Typography>
              <Typography fontWeight={500}>
                {request.organisationMail}
              </Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Contact Number</Typography>
              <Typography fontWeight={500}>
                {request.organisationContact}
              </Typography>
            </Box>
            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              {" "}
            </Box>
          </Box>
        </Paper>

        <Card
          sx={{ border: "1px solid #e0e0e0", borderRadius: 3, boxShadow: 0 }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Events Conducted
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Event Name</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Tickets Sold</TableCell>
                    <TableCell>Gross</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {events.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No events conducted yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    events.map((event) => {
                      const eventDate = new Date(event.eventDate);
                      const isPast = eventDate < new Date();
                      const status = isPast ? "Done" : "Upcoming";

                      return (
                        <TableRow key={event.id}>
                          <TableCell>{event.name || "Untitled"}</TableCell>
                          <TableCell>
                            {event.eventDate
                              ? new Date(event.eventDate).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>{event.ticketCount || 0}</TableCell>
                          <TableCell>
                            ₹
                            {Array.isArray(event.pricing)
                              ? event.pricing.reduce(
                                  (sum, p) =>
                                    sum +
                                    parseFloat(p.price || 0) *
                                      parseInt(p.quantity || 0),
                                  0
                                )
                              : "0.00"}
                          </TableCell>
                          <TableCell>{getStatusChip(status)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default VendorDetails;