import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate } from "react-router-dom";
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
import { db, auth } from "../../firebase/firebase_config";
import { onAuthStateChanged } from "firebase/auth";

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
    name: "Vendors",
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

const EventManagement = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [searchTerm, setSearchTerm] = useState("");
  const [globalTaxPercentage, setGlobalTaxPercentage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editTaxDialog, setEditTaxDialog] = useState({
    open: false,
    eventId: null,
    taxPercentage: 0,
  });
  const eventsPerPage = 5;
  const [lastLogin, setLastLogin] = useState("");

  // CSV Export Function
  const exportToCSV = () => {
    // Define CSV headers
    const headers = [
      "Event Name",
      "Venue",
      "Vendor",
      "Created Date",
      "Booking Start",
      "Booking End",
      "Tickets Sold",
      "Capacity",
      "Gross Revenue",
      "Tax Percentage",
      "Status"
    ];

    // Convert filtered events to CSV rows
    const csvRows = filteredEvents.map(event => [
      `"${event.name || 'N/A'}"`,
      `"${event.venueDetails?.venueName || event.location || 'N/A'}"`,
      `"${event.vendorUsername || 'N/A'}"`,
      `"${formatDate(event.createdAt)}"`,
      `"${formatDate(event.eventHost)}"`,
      `"${formatDate(event.eventDate)}"`,
      event.ticketsSold || 0,
      event.capacity || 'Unlimited',
      event.gross || 0,
      `${event.taxPercentage}%`,
      event.status
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `events_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fetch global tax percentage from Firestore
  const fetchGlobalTax = async () => {
    try {
      const globalTaxRef = doc(db, "settings", "globalTax");
      const globalTaxDoc = await getDoc(globalTaxRef);
      if (globalTaxDoc.exists()) {
        return globalTaxDoc.data().taxPercentage || 0;
      }
      return 0;
    } catch (err) {
      console.error("Error fetching global tax:", err);
      return 0;
    }
  };

  // Fetch vendor username by vendorId
  const fetchVendorUsername = async (vendorId) => {
    if (!vendorId) return "N/A";
    try {
      const vendorDocRef = doc(db, "vendors", vendorId);
      const vendorDoc = await getDoc(vendorDocRef);
      if (vendorDoc.exists()) {
        return vendorDoc.data().username || vendorDoc.data().name || "N/A";
      }
      return "N/A";
    } catch (err) {
      console.error("Error fetching vendor username:", err);
      return "N/A";
    }
  };

  // Fetch events and their associated tickets from Firestore
  const fetchEventsWithTickets = async () => {
    setLoading(true);
    try {
      // Fetch global tax percentage
      const globalTax = await fetchGlobalTax();
      setGlobalTaxPercentage(globalTax.toString());

      // Fetch all events
      const eventsCollection = collection(db, "events");
      const eventSnapshot = await getDocs(eventsCollection);

      // Temporary array to store events with their data
      let eventsData = [];

      // Process each event document
      for (const docSnapshot of eventSnapshot.docs) {
        const eventData = docSnapshot.data();

        // Fetch vendor username
        const vendorUsername = await fetchVendorUsername(eventData.vendorId);

        // Calculate total seats from pricing data
        let totalSeats = 0;
        if (eventData.pricing && Array.isArray(eventData.pricing)) {
          eventData.pricing.forEach((price) => {
            totalSeats += price.seats || 0;
          });
        }

        // Calculate event status based on dates
        const currentDate = new Date();
        const hostDate = eventData.eventHost
          ? new Date(eventData.eventHost)
          : null;
        const eventDate = eventData.eventDate
          ? new Date(eventData.eventDate)
          : null;

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

        // Apply global tax if no taxPercentage is defined
        const taxPercentage =
          eventData.taxPercentage !== undefined
            ? eventData.taxPercentage
            : globalTax;

        // Add event to array with initial ticket counts as 0
        eventsData.push({
          ...eventData,
          id: docSnapshot.id,
          status,
          ticketsSold: 0,
          capacity: totalSeats > 0 ? totalSeats : "Unlimited",
          gross: 0,
          taxPercentage,
          tickets: [],
          vendorUsername,
        });
      }

      // Fetch tickets from all events
      const ticketsCollection = collection(db, "tickets");
      const ticketsSnapshot = await getDocs(ticketsCollection);

      // Process each ticket and associate with its event
      ticketsSnapshot.forEach((ticketDoc) => {
        const ticketData = ticketDoc.data();
        const eventId = ticketData.eventId;

        // Find the event this ticket belongs to
        const eventIndex = eventsData.findIndex(
          (event) => event.id === eventId
        );

        if (eventIndex !== -1) {
          // Add this ticket to the event's tickets array
          eventsData[eventIndex].tickets.push(ticketData);

          // Calculate ticket quantities and revenue
          if (
            ticketData.ticketSummary &&
            Array.isArray(ticketData.ticketSummary)
          ) {
            ticketData.ticketSummary.forEach((ticket) => {
              const quantity = ticket.quantity || 0;
              const price = ticket.price || 0;

              // Update event totals
              eventsData[eventIndex].ticketsSold += quantity;

              // Check if this is not a free event before adding to gross
              if (!ticketData.financial?.isFreeEvent) {
                eventsData[eventIndex].gross += quantity * price;
              }
            });
          }
        }
      });

      // Format final numbers and set state
      eventsData = eventsData.map((event) => ({
        ...event,
        gross: event.gross || 0,
        taxPercentage: event.taxPercentage || 0,
      }));

      setEvents(eventsData);
    } catch (err) {
      setError("Failed to load events. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Update tax percentage for a single event in Firestore
  const updateTaxPercentage = async (eventId, newTaxPercentage) => {
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, { taxPercentage: Number(newTaxPercentage) });

      // Update local state
      setEvents(
        events.map((event) =>
          event.id === eventId
            ? { ...event, taxPercentage: Number(newTaxPercentage) }
            : event
        )
      );

      setEditTaxDialog({ open: false, eventId: null, taxPercentage: 0 });
    } catch (err) {
      console.error("Error updating tax percentage:", err);
      setError("Failed to update tax percentage. Please try again.");
    }
  };

  // Apply global tax percentage to all events and save to settings
  const applyGlobalTax = async () => {
    const taxValue = Number(globalTaxPercentage);
    if (isNaN(taxValue) || taxValue < 0 || taxValue > 100) {
      setError("Please enter a valid tax percentage between 0 and 100.");
      return;
    }

    try {
      setLoading(true);

      // Save global tax percentage to Firestore
      const globalTaxRef = doc(db, "settings", "globalTax");
      await setDoc(globalTaxRef, { taxPercentage: taxValue });

      // Update all events in Firestore
      const updatePromises = events.map((event) => {
        const eventRef = doc(db, "events", event.id);
        return updateDoc(eventRef, { taxPercentage: taxValue });
      });
      await Promise.all(updatePromises);

      // Update local state
      setEvents(
        events.map((event) => ({
          ...event,
          taxPercentage: taxValue,
        }))
      );
    } catch (err) {
      console.error("Error applying global tax percentage:", err);
      setError("Failed to apply global tax percentage. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsWithTickets();
  }, []);

  // Filter events based on search term and status
  const filteredEvents = events.filter((event) => {
    const statusMatch =
      statusFilter === "All Status" || event.status === statusFilter;
    const searchMatch =
      searchTerm === "" ||
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.venueDetails?.venueName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      event.vendorUsername?.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Pagination logic
  const indexOfLastEvent = currentPage * eventsPerPage;
  const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
  const currentEvents = filteredEvents.slice(
    indexOfFirstEvent,
    indexOfLastEvent
  );
  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getPaginationRange = () => {
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + 2);
    if (end - start < 2) {
      start = Math.max(1, end - 2);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const navigateToEventDetails = (eventId) => {
    navigate(`/admin/event/${eventId}`);
  };

  const handleOpenTaxDialog = (eventId, currentTaxPercentage) => {
    setEditTaxDialog({
      open: true,
      eventId,
      taxPercentage: currentTaxPercentage,
    });
  };

  const handleCloseTaxDialog = () => {
    setEditTaxDialog({ open: false, eventId: null, taxPercentage: 0 });
  };

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

  const formatCurrency = (amount) => {
    if (amount === 0) return "₹0";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
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

  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
        <Typography ml={2}>Loading events...</Typography>
      </Box>
    );

  return (
    <Box height="100vh" display="flex" flexDirection="column" bgcolor="#faf9fb">
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

      <Box display="flex" flex={1}>
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

        <Box
          flex={1}
          px={5}
          py={4}
          overflow="auto"
          maxHeight="calc(100vh - 89px)"
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={9}>
            <Typography variant="h5" fontWeight="bold">
              Event Management
            </Typography>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
              disabled={filteredEvents.length === 0}
              sx={{
                bgcolor: "#19aedc",
                "&:hover": { bgcolor: "#0d8cbf" },
                textTransform: "none",
              }}
            >
              Export to CSV
            </Button>
          </Box>

          <Card mt={5}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                sx={{ paddingX: 2 }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Total Events ({events.length})
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Select
                    size="small"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <MenuItem value="All Status">All Status</MenuItem>
                    {Object.keys(statusColors).map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                  <TextField
                    variant="outlined"
                    size="small"
                    label="Global Tax %"
                    value={globalTaxPercentage}
                    onChange={(e) => setGlobalTaxPercentage(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">%</InputAdornment>
                      ),
                      inputProps: {
                        min: 0,
                        max: 100,
                        step: 0.1,
                        type: "number",
                      },
                    }}
                    sx={{ width: 120 }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={applyGlobalTax}
                    disabled={
                      !globalTaxPercentage ||
                      globalTaxPercentage < 0 ||
                      globalTaxPercentage > 100
                    }
                    sx={{
                      bgcolor: "#19aedc",
                      "&:hover": { bgcolor: "#0d8cbf" },
                    }}
                  >
                    Apply to All
                  </Button>
                </Box>
              </Box>

              {error ? (
                <Typography color="error" align="center" my={3}>
                  {error}
                </Typography>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          Event Name
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          Date
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          BOOKING START
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          BOOKING END
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          Tickets Sold
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          Gross
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          Tax Percentage
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          Status
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{ backgroundColor: "#f1f1f1" }}
                        >
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {currentEvents.length > 0 ? (
                        currentEvents.map((event) => (
                          <TableRow key={event.id || event.eventId}>
                            <TableCell align="left">
                              <Typography fontWeight="bold">
                                {event.name}
                              </Typography>
                              <Typography fontSize={12} color="textSecondary">
                                {event.venueDetails?.venueName ||
                                  event.location ||
                                  "Venue not specified"}
                              </Typography>
                              <Typography
                                fontSize={11}
                                color="primary"
                                fontWeight="500"
                                sx={{ mt: 0.5 }}
                              >
                                Vendor: {event.vendorUsername}
                              </Typography>
                            </TableCell>

                            <TableCell align="center">
                              {formatDate(event.createdAt)}
                            </TableCell>

                            <TableCell align="center">
                              {formatDate(event.eventHost)}
                            </TableCell>

                            <TableCell align="center">
                              {formatDate(event.eventDate)}
                            </TableCell>

                            <TableCell align="center">
                              {`${event.ticketsSold || 0}/${
                                event.capacity || "Unlimited"
                              }`}
                            </TableCell>

                            <TableCell align="center">
                              {formatCurrency(event.gross)}
                            </TableCell>

                            <TableCell align="center">
                              <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                gap={1}
                              >
                                <Typography>{`${event.taxPercentage}%`}</Typography>
                                <Button
                                  size="small"
                                  startIcon={<EditIcon />}
                                  onClick={() =>
                                    handleOpenTaxDialog(
                                      event.id,
                                      event.taxPercentage
                                    )
                                  }
                                  sx={{ minWidth: "auto", p: 0.5 }}
                                >
                                  Edit
                                </Button>
                              </Box>
                            </TableCell>

                            <TableCell align="center">
                              <Box
                                px={1.5}
                                py={0.5}
                                borderRadius={4}
                                bgcolor={statusColors[event.status]}
                                display="inline-block"
                              >
                                <Typography fontSize={12}>
                                  {event.status}
                                </Typography>
                              </Box>
                            </TableCell>

                            <TableCell align="center">
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<VisibilityIcon />}
                                onClick={() =>
                                  navigateToEventDetails(
                                    event.id || event.eventId
                                  )
                                }
                                sx={{
                                  bgcolor: "#19aedc",
                                  "&:hover": { bgcolor: "#0d8cbf" },
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} align="center">
                            No events found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={3}
                px={2}
              >
                <Typography variant="body2">
                  Showing{" "}
                  {filteredEvents.length > 0 ? indexOfFirstEvent + 1 : 0} to{" "}
                  {Math.min(indexOfLastEvent, filteredEvents.length)} of{" "}
                  {filteredEvents.length}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    disabled={currentPage === 1}
                    onClick={handlePrevPage}
                    sx={{ borderColor: "#42A5F5", color: "#42A5F5" }}
                  >
                    Previous
                  </Button>
                  {getPaginationRange().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === currentPage ? "contained" : "outlined"
                      }
                      sx={{
                        minWidth: 40,
                        borderColor: "#42A5F5",
                        backgroundColor:
                          pageNum === currentPage ? "#42A5F5" : "white",
                        color: pageNum === currentPage ? "white" : "#42A5F5",
                        fontWeight: "bold",
                      }}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  <Button
                    variant="outlined"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={handleNextPage}
                    sx={{ borderColor: "#42A5F5", color: "#42A5F5" }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Dialog open={editTaxDialog.open} onClose={handleCloseTaxDialog}>
            <DialogTitle>Edit Tax Percentage</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                label="Tax Percentage"
                type="number"
                fullWidth
                value={editTaxDialog.taxPercentage}
                onChange={(e) =>
                  setEditTaxDialog({
                    ...editTaxDialog,
                    taxPercentage: e.target.value,
                  })
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                  inputProps: { min: 0, max: 100, step: 0.1 },
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseTaxDialog}>Cancel</Button>
              <Button
                onClick={() =>
                  updateTaxPercentage(
                    editTaxDialog.eventId,
                    editTaxDialog.taxPercentage
                  )
                }
                variant="contained"
                disabled={
                  editTaxDialog.taxPercentage < 0 ||
                  editTaxDialog.taxPercentage > 100
                }
              >
                Save
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default EventManagement;