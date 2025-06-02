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
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";
import DeleteIcon from "@mui/icons-material/Delete";
import InfoIcon from "@mui/icons-material/Info";

import { db, auth } from "../../firebase_config";
import {
  collection,
  getDocs,
  getDoc,
  query,
  orderBy,
  deleteDoc,
  doc,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
const sidebarItems = [
  {
    name: "Dashboard",
    icon: <TrendingUpIcon />,
    active: true,
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
    active: false,
    path: "/admin/eventmanagement",
  },
];

// Status color mapping
const statusColors = {
  Active: "#C6F6D5",
  "Almost Full": "#FEF3C7",
  "On Sale": "#E0E7FF",
  "Ticket Full": "#FECACA",
  Completed: "#D1D5DB",
};

const DashboardUpcoming = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [lastLogin, setLastLogin] = useState("");
const [dialogOpen, setDialogOpen] = useState(false);
const [dialogContent, setDialogContent] = useState("");
const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
const [selectedEventId, setSelectedEventId] = useState(null);

  useEffect(() => {
    fetchEvents(activeTab);
  }, [activeTab]);

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
  const fetchEvents = async (tab) => {
    try {
      setLoading(true);
      setError(null);

      // Reference to the events collection
      const eventsCollectionRef = collection(db, "events");

      // Create the appropriate query based on the active tab
      let eventsQuery;
      const currentDate = new Date().toISOString();

      if (tab === "upcoming") {
        // Query for upcoming events (eventDate >= current date)
        eventsQuery = query(
          eventsCollectionRef,
          where("eventDate", ">=", currentDate),
          orderBy("eventDate", "asc") // Sort by date ascending (soonest first)
        );
      } else {
        // Query for recent/past events (eventDate < current date)
        eventsQuery = query(
          eventsCollectionRef,
          where("eventDate", "<", currentDate),
          orderBy("eventDate", "desc") // Sort by date descending (most recent first)
        );
      }

      // Execute the query
      const querySnapshot = await getDocs(eventsQuery);

      // Process the query results
      const eventsList = [];
      querySnapshot.forEach((doc) => {
        eventsList.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      setEvents(eventsList);
    } catch (err) {
      console.error("Error fetching events:", err);
      setError("Failed to load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Format date string to readable format
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Calculate event status based on dates and seats
  const calculateStatus = (event) => {
    const eventDate = new Date(event.eventDate);
    const currentDate = new Date();

    // Check if the event has pricing with seats info
    const totalSeats =
      event.pricing?.reduce((acc, tier) => acc + (tier.seats || 0), 0) || 0;

    // In a real app, you would fetch booked seats from your database
    // For this example, we'll simulate booked seats
    const bookedSeats = Math.floor(Math.random() * totalSeats);

    if (eventDate < currentDate) {
      return { text: "Completed", color: statusColors["Completed"] };
    } else if (bookedSeats >= totalSeats) {
      return { text: "Ticket Full", color: statusColors["Ticket Full"] };
    } else if (bookedSeats >= totalSeats * 0.8) {
      return { text: "Almost Full", color: statusColors["Almost Full"] };
    } else {
      return { text: "Active", color: statusColors["Active"] };
    }
  };

  // Filter events based on search term and status
  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const status = calculateStatus(event).text;
    const matchesStatus =
      statusFilter === "All Status" || status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handler for edit event
  const handleEditEvent = (eventId) => {
    console.log("Edit event:", eventId);
    window.location.href = `/admin/edit-event/${eventId}`;
  };

  const handleDeleteClick = (eventId) => {
  setSelectedEventId(eventId);
  setOpenDeleteDialog(true);
};
const handleDeleteEvent = async () => {
  if (!selectedEventId) return;

  try {
    await deleteDoc(doc(db, "events", selectedEventId));
    setEvents(events.filter((event) => event.id !== selectedEventId));
    setDialogContent("Event deleted successfully!");
  } catch (error) {
    console.error("Error deleting event:", error);
    setDialogContent("Failed to delete event. Please try again.");
  } finally {
    setDialogOpen(true);
    setOpenDeleteDialog(false);
    setSelectedEventId(null);
  }
};

const handleDeleteConfirmed = async (eventId) => {
  if (!eventId) return;

  try {
    await deleteDoc(doc(db, "events", eventId));
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));

    setDialogContent("Event deleted successfully!");
  } catch (error) {
    console.error("Error deleting event:", error);
    setDialogContent("Failed to delete event. Please try again.");
  } finally {
    setDialogOpen(true); // Show feedback dialog
    setSelectedEventId(null); // Clear selected event
  }
};


  // Handler for view event details
  const handleViewEventDetails = (eventId) => {
    console.log("View event details:", eventId);
    window.location.href = `/admin/event/${eventId}`;
  };

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
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
  <DialogTitle>Confirm Delete</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Are you sure you want to delete this event? This action cannot be undone.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">
      Cancel
    </Button>
    <Button
      onClick={() => {
        handleDeleteConfirmed(selectedEventId);
        setOpenDeleteDialog(false);
      }}
      color="error"
    >
      Delete
    </Button>
  </DialogActions>
</Dialog>


        
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
        </Typography>{" "}
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
          <Typography variant="h5" fontWeight="bold" mb={4}>
            Events Dashboard
          </Typography>

          <Box display="flex" mb={6} justifyContent="center" gap={10}>
            <Button
              variant={activeTab === "upcoming" ? "contained" : "outlined"}
              sx={{
                bgcolor: activeTab === "upcoming" ? "#19aedc" : "#D1D5DB",
                color: activeTab === "upcoming" ? "white" : "#4B5563",
                textTransform: "none",
                border: "none",
                padding: 1.5,
              }}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming Events
            </Button>
            <Button
              variant={activeTab === "recent" ? "contained" : "outlined"}
              sx={{
                bgcolor: activeTab === "recent" ? "#19aedc" : "#D1D5DB",
                color: activeTab === "recent" ? "white" : "#4B5563",
                textTransform: "none",
                border: "none",
                padding: 1.5,
              }}
              onClick={() => setActiveTab("recent")}
            >
              Recent Events
            </Button>
          </Box>

          <Card sx={{ height: "auto" }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                sx={{ paddingX: 2 }}
              >
                <Typography variant="h6" fontWeight="bold">
                  Your Events
                </Typography>
                <Box display="flex" gap={2}>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search events..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  {activeTab === "recent" && (
                    <Select
                      size="small"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="All Status">All Status</MenuItem>
                      <MenuItem value="Active">Active</MenuItem>
                      <MenuItem value="Almost Full">Almost Full</MenuItem>
                      <MenuItem value="Ticket Full">Ticket Full</MenuItem>
                      <MenuItem value="Completed">Completed</MenuItem>
                    </Select>
                  )}
                </Box>
              </Box>

              {loading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="300px"
                >
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="300px"
                >
                  <Typography color="error">{error}</Typography>
                </Box>
              ) : filteredEvents.length === 0 ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="300px"
                >
                  <Typography>No events found</Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                          Event Name
                        </TableCell>
                        {activeTab === "upcoming" ? (
                          <>
                            <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                              Event Date
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                              Category
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                              Venue
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                              Capacity
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                              Date
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                              Host
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                              Venue
                            </TableCell>
                            <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                              Status
                            </TableCell>
                          </>
                        )}
                        <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredEvents.map((event) => {
                        const status = calculateStatus(event);
                        const totalCapacity =
                          event.pricing?.reduce(
                            (acc, tier) => acc + (tier.seats || 0),
                            0
                          ) || 0;

                        return (
                          <TableRow key={event.id}>
                            <TableCell>
                              <Typography fontWeight="bold">
                                {event.name}
                              </Typography>
                              {event.description && (
                                <Typography
                                  fontSize={12}
                                  color="textSecondary"
                                  sx={{
                                    textOverflow: "ellipsis",
                                    overflow: "hidden",
                                    whiteSpace: "nowrap",
                                    maxWidth: "200px",
                                  }}
                                >
                                  {event.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(event.eventDate)}</TableCell>
                            {activeTab === "upcoming" ? (
                              <>
                                <TableCell>
                                  {event.category?.slice(0, 2).map((cat, idx) => (
  <Chip
    key={idx}
    label={cat}
    size="small"
    sx={{ mr: 0.5, mb: 0.5 }}
  />
))}

                                </TableCell>
                                <TableCell>
                                  {event.venueDetails?.venueName || "N/A"}
                                </TableCell>
                                <TableCell>{totalCapacity}</TableCell>
                              </>
                            ) : (
                              <>
                                <TableCell>
                                  {event.eventHost
                                    ? formatDate(event.eventHost)
                                    : "N/A"}
                                </TableCell>
                                <TableCell>
                                  {event.venueDetails?.venueName ? (
                                    <Tooltip
                                      title={`${event.venueDetails.city}, ${event.venueDetails.state}`}
                                    >
                                      <Typography>
                                        {event.venueDetails.venueName}
                                      </Typography>
                                    </Tooltip>
                                  ) : (
                                    "N/A"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Box
                                    px={1.5}
                                    py={0.5}
                                    borderRadius={4}
                                    bgcolor={status.color}
                                    display="inline-block"
                                  >
                                    <Typography fontSize={12}>
                                      {status.text}
                                    </Typography>
                                  </Box>
                                </TableCell>
                              </>
                            )}
                            <TableCell>
                              <IconButton
                                size="small"
                                title="Delete"
                               onClick={() => handleDeleteClick(event.id)}
                              >
                                <DeleteIcon fontSize="small" color="error" />
                              </IconButton>
                              <IconButton
                                size="small"
                                title="View Details"
                                onClick={() => handleViewEventDetails(event.id)}
                              >
                                <InfoIcon fontSize="small" color="primary" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardUpcoming;
