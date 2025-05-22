import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase_config";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  FormControlLabel,
  Checkbox,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";
import SaveIcon from "@mui/icons-material/Save";
import InfoIcon from "@mui/icons-material/Info";

// TabPanel component for the tabbed interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const sidebarItems = [
  {
    name: "Dashboard",
    icon: <TrendingUpIcon />,
    active: false,
    path: "/admin/dashboardupcoming",
  },
  {
    name: "Users",
    icon: <GroupIcon />,
    active: false,
    path: "/admin/userpage",
  },
  {
    name: "Posts",
    icon: <ArticleIcon />,
    active: false,
    path: "/admin/postpage",
  },
  {
    name: "Login Settings",
    icon: <SettingsIcon />,
    active: false,
    path: "/admin/loginsettings",
  },
  {
    name: "Contact",
    icon: <ContactPageIcon />,
    active: false,
    path: "/admin/contactpage",
  },
  {
    name: "Events",
    icon: <EventIcon />,
    active: true,
    path: "/admin/eventmanagement",
  },
];

const statusColors = {
  Completed: "#E0E0E0",
  Upcoming: "#BBDEFB",
  Active: "#C8E6C9",
};

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [taxIncluded, setTaxIncluded] = useState(false);
  const [saveStatus, setSaveStatus] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date helper function
  const formatDate = (dateStr) => {
    if (!dateStr) return "Invalid Date";

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";

      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return "Invalid Date";
    }
  };

  // Format currency helper function
  const formatCurrency = (amount) => {
    if (amount === 0) return "₹0";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  // Handle tax inclusion change
  const handleTaxInclusionChange = (event) => {
    setTaxIncluded(event.target.checked);
  };

  // Save tax inclusion settings
  const saveTaxSettings = async () => {
    if (!event || !eventId) return;

    setSavingChanges(true);
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        taxIncluded: taxIncluded,
      });

      setSaveStatus({
        open: true,
        message: "Tax settings updated successfully",
        severity: "success",
      });

      setEvent({
        ...event,
        taxIncluded: taxIncluded,
      });
    } catch (err) {
      console.error("Error updating tax settings:", err);
      setSaveStatus({
        open: true,
        message: "Failed to update tax settings",
        severity: "error",
      });
    } finally {
      setSavingChanges(false);
    }
  };

  // Handle confirmation dialog
  const handleConfirmSave = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleConfirmation = () => {
    setConfirmDialogOpen(false);
    saveTaxSettings();
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSaveStatus({
      ...saveStatus,
      open: false,
    });
  };

  // Fetch event data with tickets
  useEffect(() => {
    const fetchEventWithTickets = async () => {
      if (!eventId) {
        setError("Event ID is missing");
        setLoading(false);
        return;
      }

      try {
        const eventRef = doc(db, "events", eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
          setError("Event not found");
          setLoading(false);
          return;
        }

        const eventData = eventDoc.data();

        setTaxIncluded(eventData.taxIncluded || false);

        let totalSeats = 0;
        if (eventData.pricing && Array.isArray(eventData.pricing)) {
          eventData.pricing.forEach((price) => {
            totalSeats += price.seats || 0;
          });
        }

        const currentDate = new Date();
        const hostDate = eventData.eventHost ? new Date(eventData.eventHost) : null;
        const eventDate = eventData.eventDate ? new Date(eventData.eventDate) : null;

        let status = "Unknown";
        if (hostDate && eventDate) {
          currentDate.setHours(0, 0, 0, 0);
          hostDate.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);

          if (currentDate < hostDate) {
            status = "Upcoming";
          } else if (currentDate > eventDate) {
            status = "Completed";
          } else {
            status = "Active";
          }
        }

        let eventWithTickets = {
          ...eventData,
          id: eventDoc.id,
          status,
          ticketsSold: 0,
          capacity: totalSeats > 0 ? totalSeats : "Unlimited",
          gross: 0,
          tickets: [],
        };

        const ticketsCollection = collection(db, "tickets");
        const eventTicketsQuery = query(ticketsCollection, where("eventId", "==", eventId));
        const ticketsSnapshot = await getDocs(eventTicketsQuery);

        ticketsSnapshot.forEach((ticketDoc) => {
          const ticketData = ticketDoc.data();

          eventWithTickets.tickets.push(ticketData);

          if (ticketData.ticketSummary && Array.isArray(ticketData.ticketSummary)) {
            ticketData.ticketSummary.forEach((ticket) => {
              const quantity = ticket.quantity || 0;
              const price = ticket.price || 0;

              eventWithTickets.ticketsSold += quantity;

              if (!ticketData.financial?.isFreeEvent) {
                eventWithTickets.gross += quantity * price;
              }
            });
          }
        });

        setEvent(eventWithTickets);
        console.log("Event data with tickets:", eventWithTickets);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventWithTickets();
  }, [eventId]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
        <Typography ml={2}>Loading event details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error" variant="h6" mb={3}>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/eventmanagement")}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
        <Typography variant="h6" mb={3}>
          Event not found
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/eventmanagement")}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  // Determine the index for the Ticket Sales tab based on whether Perks tab is present
  const ticketSalesTabIndex = event.perks && event.perks.length > 0 ? 4 : 3;

  return (
    <Box height="100vh" display="flex" flexDirection="column" bgcolor="#faf9fb">
      {/* Header */}
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
            {" "}
            admin
          </Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>
          Last login at 7th Oct 2025 13:00
        </Typography>
      </Box>

      <Box display="flex" flex={1}>
        {/* Sidebar */}
        <Box
          width={276}
          flexShrink={0}
          bgcolor="#f9fafb"
          py={10}
          px={3}
          boxShadow={3}
          position="sticky"
          top={0}
          height="90vh"
          overflow="auto"
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
              }}
              startIcon={item.icon}
            >
              {item.name}
            </Button>
          ))}
        </Box>

        {/* Main Content */}
        <Box
          flex={1}
          px={5}
          py={4}
          overflow="auto"
          maxHeight="calc(100vh - 89px)"
        >
          {/* Page Header with Back Button */}
          <Box display="flex" alignItems="center" mb={4}>
            <IconButton
              onClick={() => navigate("/admin/eventmanagement")}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              Event Details
            </Typography>
          </Box>

          {/* Event Header Card */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {event.name}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <LocationOnIcon fontSize="small" sx={{ mr: 1, color: "text.secondary" }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.venueDetails?.venueName || "No venue specified"}, {event.venueDetails?.city || ""}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  px={2}
                  py={1}
                  borderRadius={2}
                  bgcolor={statusColors[event.status]}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {event.status}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Date & Time
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <CalendarTodayIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography>{formatDate(event.eventDate)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Booking Period
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <CalendarTodayIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography>
                      {formatDate(event.eventHost)} to {formatDate(event.eventDate)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <Grid container spacing={4} mb={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PeopleIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Attendance
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {event.ticketsSold || 0}/{event.capacity || "Unlimited"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.capacity !== "Unlimited"
                      ? `${((event.ticketsSold / parseInt(event.capacity)) * 100).toFixed(1)}% of capacity`
                      : "Unlimited capacity"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ConfirmationNumberIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Ticket Types
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {event.pricing?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Different ticket categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AttachMoneyIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Gross Revenue
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(event.gross || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total sales amount
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Tabs for detailed information */}
          <Card>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="event details tabs">
                <Tab label="Event Details" />
                <Tab label="Ticket Information" />
                <Tab label="Venue Details" />
                {event.perks && event.perks.length > 0 && <Tab label="Perks" />}
                <Tab label="Ticket Sales" />
              </Tabs>
            </Box>

            {/* Event Details Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Description
                </Typography>
                <Typography paragraph>{event.description || "No description available"}</Typography>

                <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>
                  Event Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Event ID
                      </Typography>
                      <Typography variant="body2">{event.id || event.eventId}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Created On
                      </Typography>
                      <Typography variant="body2">{formatDate(event.createdAt)}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Vendor ID
                      </Typography>
                      <Typography variant="body2">{event.vendorId || "Not available"}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Category
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {event.category && event.category.length > 0 ? (
                          event.category.map((cat, idx) => (
                            <Chip key={idx} label={cat} size="small" color="primary" variant="outlined" />
                          ))
                        ) : (
                          <Typography variant="body2">No categories</Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {event.bannerImages && event.bannerImages.length > 0 && (
                  <>
                    <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>
                      Event Banners
                    </Typography>
                    <Box display="flex" gap={2} sx={{ overflowX: "auto", pb: 2 }}>
                      {event.bannerImages.map((image, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={image}
                          alt={`Event banner ${idx + 1}`}
                          sx={{
                            width: 280,
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 1,
                            boxShadow: 1,
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </TabPanel>

            {/* Ticket Information Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Ticket Types and Pricing
                </Typography>

                {/* Tax Inclusion Setting */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "#f5f5f5",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={taxIncluded}
                        onChange={handleTaxInclusionChange}
                        color="primary"
                        disabled={savingChanges}
                      />
                    }
                    label="Tax included in ticket price"
                  />
                  <Button
                    variant="contained"
                    color="primary"
itudine                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleConfirmSave}
                    disabled={savingChanges}
                  >
                    {savingChanges ? "Saving..." : "Save Setting"}
                  </Button>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => {
                      setSaveStatus({
                        open: true,
                        message:
                          "This setting controls whether tax is included in the ticket price or charged separately at checkout.",
                        severity: "info",
                      });
                    }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Box>

              {/* Information Banner about current tax setting */}
              <Alert severity="info" sx={{ mb: 3 }}>
                Current setting: Tax is {taxIncluded ? "included in" : "charged separately from"} ticket prices.
                {!taxIncluded && " Customers will see tax as a separate line item during checkout."}
              </Alert>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Ticket Type</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Price (₹)</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Features</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Capacity</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Available</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Tax (%)</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Free</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {event.pricing && event.pricing.length > 0 ? (
                      event.pricing.map((ticket, idx) => {
                        const soldTickets = event.tickets.reduce((total, t) => {
                          if (t.ticketSummary) {
                            const matchingTicket = t.ticketSummary.find(
                              (ts) => ts.ticketType === ticket.ticketType
                            );
                            return total + (matchingTicket ? matchingTicket.quantity : 0);
                          }
                          return total;
                        }, 0);

                        const remainingTickets = ticket.seats - soldTickets;

                        return (
                          <TableRow key={idx}>
                            <TableCell>{ticket.ticketType}</TableCell>
                            <TableCell>
                              {formatCurrency(ticket.price)}
                              {taxIncluded && ticket.tax > 0 && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                  (Includes {ticket.tax}% tax)
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{ticket.features || "None"}</TableCell>
                            <TableCell>{ticket.seats || 0}</TableCell>
                            <TableCell>{remainingTickets >= 0 ? remainingTickets : ticket.seats || 0}</TableCell>
                            <TableCell>{ticket.tax || 0}%</TableCell>
                            <TableCell>{ticket.free ? "Yes" : "No"}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No ticket information available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={4}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Cancellation Policy
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography>
                    {event.cancellationAvailable === "true"
                      ? `Cancellation available up to ${event.cancellationDays} days before the event`
                      : "Cancellation not available for this event"}
                  </Typography>
                </Paper>
              </Box>

              {event.coupons && event.coupons.length > 0 && (
                <Box mt={4}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                    Available Coupons
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Coupon Code</TableCell>
                          <TableCell>Discount</TableCell>
                          <TableCell>Validity</TableCell>
                          <TableCell>Usage Limit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {event.coupons.map((coupon, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{coupon.couponCode || "N/A"}</TableCell>
                            <TableCell>{coupon.reducePert || 0}%</TableCell>
                            <TableCell>
                              {formatDate(coupon.startTime).split(",")[0]} -{" "}
                              {formatDate(coupon.endTime).split(",")[0]}
                            </TableCell>
                            <TableCell>{coupon.couponLimits || "Unlimited"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </TabPanel>

            {/* Venue Details Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Venue Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                      Venue Name
                    </Typography>
                    <Typography>{event.venueDetails?.venueName || "Not specified"}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                      Address
                    </Typography>
                    <Typography>
                      {event.venueDetails?.streetName || ""}, {event.venueDetails?.area || ""},
                      {event.venueDetails?.city ? ` ${event.venueDetails.city},` : ""}
                      {event.venueDetails?.state ? ` ${event.venueDetails.state}` : ""}
                      {event.venueDetails?.pincode ? ` - ${event.venueDetails.pincode}` : ""}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box
                mt={4}
                p={3}
                sx={{
                  height: 300,
                  bgcolor: "#f5f5f5",
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  Map view would be displayed here if coordinates were available
                </Typography>
              </Box>
            </TabPanel>

            {/* Perks Tab (Conditional) */}
            {event.perks && event.perks.length > 0 && (
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" fontWeight="bold" mb={3}>
                  Event Perks
                </Typography>

                {event.perks && event.perks.length > 0 ? (
                  <Grid container spacing={3}>
                    {event.perks.map((perk, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Paper sx={{ p: 3, height: "100%" }}>
                          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                            {perk.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" paragraph>
                            {perk.description}
                          </Typography>
                          {perk.availability && (
                            <Chip
                              label={`Available to: ${perk.availability}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No perks are available for this event.
                  </Typography>
                )}
              </TabPanel>
            )}

            {/* Ticket Sales Tab */}
            <TabPanel value={tabValue} index={ticketSalesTabIndex}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Ticket Sales Overview
              </Typography>

              {event.tickets && event.tickets.length > 0 ? (
                <>
                  <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>Ticket ID</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Buyer</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Purchase Date</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Ticket Type</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Quantity</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Total Amount</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {event.tickets.map((ticket, idx) => {
                          const totalQuantity = ticket.ticketSummary
                            ? ticket.ticketSummary.reduce((sum, t) => sum + (t.quantity || 0), 0)
                            : 0;

                          let totalAmount = 0;
                          if (ticket.ticketSummary) {
                            ticket.ticketSummary.forEach((t) => {
                              totalAmount += (t.price || 0) * (t.quantity || 0);
                            });
                          }

                          return (
                            <TableRow key={idx}>
                              <TableCell>{ticket.ticketId || `TKT-${idx + 1000}`}</TableCell>
                              <TableCell>
                                {ticket.buyer?.name || "Anonymous"}
                                {ticket.buyer?.email && (
                                  <Typography variant="caption" display="block" color="text.secondary">
                                    {ticket.buyer.email}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>{formatDate(ticket.purchaseDate || ticket.createdAt)}</TableCell>
                              <TableCell>
                                {ticket.ticketSummary && ticket.ticketSummary.length > 0 ? (
                                  ticket.ticketSummary.map((t, i) => (
                                    <Typography key={i} variant="body2">
                                      {t.ticketType}
                                    </Typography>
                                  ))
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell>{totalQuantity}</TableCell>
                              <TableCell>{formatCurrency(totalAmount)}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Sales Summary
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          Total Tickets Sold
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {event.ticketsSold || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          Gross Revenue
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {formatCurrency(event.gross || 0)}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3 }}>
                        <Typography variant="body2" color="text.secondary" mb={1}>
                          Average Ticket Price
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {event.ticketsSold > 0
                            ? formatCurrency(event.gross / event.ticketsSold)
                            : formatCurrency(0)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <Box display="flex" flexDirection="column" alignItems="center" py={4}>
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    No ticket sales have been recorded for this event yet.
                  </Typography>
                  <Button variant="outlined" color="primary" onClick={() => setTabValue(1)}>
                    View Ticket Information
                  </Button>
                </Box>
              )}
            </TabPanel>
          </Card>
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={saveStatus.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={saveStatus.severity} sx={{ width: "100%" }}>
          {saveStatus.message}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Tax Setting Change"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {taxIncluded
              ? "Are you sure you want to set ticket prices to include tax? This will affect how prices are displayed to customers."
              : "Are you sure you want to separate tax from ticket prices? Tax will be added during checkout."}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmation} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventDetails;