import React, { useState } from "react";
import {
  Avatar,
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

const events = [
  {
    name: "Tech Conference 2025",
    date: "Mar 15, 2025",
    ticketsSold: "450",
    gross: "₹4,50,000",
    status: "Active",
  },
  {
    name: "Digital Summit",
    date: "Apr 20, 2025",
    ticketsSold: "300",
    gross: "₹3,00,000",
    status: "Upcoming",
  },
  {
    name: "AI Workshop",
    date: "Feb 10, 2025",
    ticketsSold: "200",
    gross: "₹2,00,000",
    status: "Completed",
  },
];


const VendorDetails = () => {
  const { state } = useLocation();
  const request = state?.data;
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);




  const handleAction = async (action, request) => {
    try {
      if (!request || !request.email) {
        setDialogContent("Vendor data is missing or invalid.");
        setDialogOpen(true);
        return;
      }

      const payload = {
        email: request.email,
      };
      console.log("Payload being sent:", payload);

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
      setDialogOpen(true);
    } catch (err) {
      console.error(`Error during ${action}:`, err);
      setDialogContent(`Failed to ${action} vendor`);
      setDialogOpen(true);
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
            {" "}
            admin
          </Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>
          Last login at 7th Oct 2025 13:00
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
            <Button variant="contained" color="error" startIcon={<Delete />} onClick={() => askForConfirmation("removed", request)}
            >
              Remove Vendor
            </Button>
          </Box>
        </Box>

        <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
  <DialogTitle>Confirm Action</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Are you sure you want to <strong>{pendingAction}</strong> this vendor?
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
                    {request.panNumber}
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
                    {request.aadharNumber}
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
                    A/C: {request.AccountNumber}
                  </Typography>
                  <Typography color="text.primary" variant="body1">
                    IFSC: {request.IFSCNumber}
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
              <Typography fontWeight={500}>{request.organisationName}</Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Type</Typography>
              <Typography fontWeight={500}>{request.organisationType}</Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">GSTIN</Typography>
              <Typography fontWeight={500}>{request.GSTIN}</Typography>
            </Box>

            <Box width={{ xs: "100%", md: "30%" }} mb={3}>
              <Typography color="text.secondary">Organization Email</Typography>
              <Typography fontWeight={500}>{request.organisationMail}</Typography>
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
                  {events.map((event, index) => (
                    <TableRow key={index}>
                      <TableCell>{event.name}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>{event.ticketsSold}</TableCell>
                      <TableCell>{event.gross}</TableCell>
                      <TableCell>{getStatusChip(event.status)}</TableCell>
                    </TableRow>
                  ))}
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
