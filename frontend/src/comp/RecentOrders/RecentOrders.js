import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Container,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QrCodeIcon from "@mui/icons-material/QrCode";
import { auth, db, storage } from "../../firebase_config"; // Added storage import
import { collection, query, where, getDocs, orderBy, doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage"; // Added these imports for Firebase Storage
import { onAuthStateChanged } from "firebase/auth";
import MainHeader from "../Header/MainHeader";
import { QRCodeCanvas as QRCode } from "qrcode.react";

const RecentOrders = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedQR, setSelectedQR] = useState(null);

  // Authenticate and get current user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
      } else {
        navigate("/login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch user data first
  useEffect(() => {
    const fetchUserData = async () => {
      if (!currentUser) return;

      try {
        const targetUserId = userId || currentUser.uid;
        const userDocRef = doc(db, "users", targetUserId);
        const userDocSnapshot = await getDoc(userDocRef);

        if (userDocSnapshot.exists()) {
          setUserData(userDocSnapshot.data());
        } else {
          setError("User not found");
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      }
    };

    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser, userId]);

  // Function to fetch event image from Firebase Storage
  const fetchEventImage = async (eventId) => {
    try {
      // Construct the path to the event image in Firebase Storage
      const imageRef = ref(storage, `events/${eventId}/image`);
      const url = await getDownloadURL(imageRef);
      return url;
    } catch (error) {
      console.log(`No image found for event ${eventId}:`, error);
      return null;
    }
  };

  // Fetch tickets after user data is loaded
  useEffect(() => {
    const fetchTickets = async () => {
      if (!userData) return;

      try {
        setLoading(true);

        // Get the user ID to query tickets
        const targetUserId = userId || currentUser.uid;

        // Query tickets collection
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("userId", "==", targetUserId),
          orderBy("createdAt", "desc")
        );

        // Get tickets
        const ticketsSnapshot = await getDocs(ticketsQuery);

        if (ticketsSnapshot.empty) {
          setTickets([]);
          setLoading(false);
          return;
        }

        // Process tickets data
        const ticketsPromises = ticketsSnapshot.docs.map(async (doc) => {
          const ticketData = doc.data();

          // Format created date
          let formattedOrderDate = "Date not available";
          try {
            const createdAtDate = new Date(ticketData.createdAt);

            formattedOrderDate = createdAtDate.toLocaleDateString('en-US', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }) + ' at ' + createdAtDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });
          } catch (dateError) {
            console.warn("Failed to format date:", dateError);
          }

          // Determine event status
          const eventStatus = determineEventStatus(ticketData.eventDate);

          // Fetch event image from Firebase Storage
          let eventImageUrl = null;
          if (ticketData.eventId) {
            eventImageUrl = await fetchEventImage(ticketData.eventId);
          }

          return {
            id: doc.id,
            bookingId: ticketData.bookingId || "#" + doc.id.substring(0, 8).toUpperCase(),
            orderedOn: formattedOrderDate,
            event: {
              id: ticketData.eventId || doc.id,
              title: ticketData.eventName || "Untitled Event",
              date: ticketData.eventDate || "Date not available",
              time: ticketData.eventTime || "Time not available",
              venue: ticketData.location || "Venue not specified",
              imageUrl: eventImageUrl, // Set the fetched image URL
              tickets: ticketData.ticketSummary || [],
              status: eventStatus,
              isFreeEvent: ticketData.financial?.isFreeEvent || false,
              totalAmount: ticketData.financial?.totalAmount || 0
            },
            foodItems: ticketData.foodSummary || []
          };
        });

        // Wait for all image fetching to complete
        const ticketsData = await Promise.all(ticketsPromises);
        setTickets(ticketsData);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError("Failed to load your recent orders. Please try again later.");
        setLoading(false);
      }
    };

    if (userData) {
      fetchTickets();
    }
  }, [userData, currentUser, userId]);

  // Function to determine if an event is upcoming or finished
  const determineEventStatus = (eventDateStr) => {
    if (!eventDateStr) return "Unknown";

    try {
      // Parse the date string (assuming format like "April 27, 2025")
      const eventDate = new Date(eventDateStr);
      const now = new Date();

      // Check if the date is valid
      if (isNaN(eventDate.getTime())) {
        return "Unknown";
      }

      return eventDate > now ? "Upcoming" : "Finished";
    } catch (error) {
      console.warn("Error parsing date:", error);
      return "Unknown";
    }
  };

  // Function to get image URL based on event type
  const getEventImage = (event) => {
    // If we have a direct imageUrl from Firebase Storage, use it
    if (event.imageUrl) {
      return event.imageUrl;
    }

    // Otherwise use our category-based fallback images
    if (event.title.toLowerCase().includes("concert") || event.title.toLowerCase().includes("music")) {
      return "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80";
    } else if (event.title.toLowerCase().includes("theatre") || event.title.toLowerCase().includes("show")) {
      return "https://images.unsplash.com/photo-1503095396549-807759245b35?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1471&q=80";
    } else if (event.title.toLowerCase().includes("benz") || event.title.toLowerCase().includes("car")) {
      return "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80";
    }
    // Default image
    return "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1474&q=80";
  };

  // Format tickets for display
  const formatTicketsText = (ticketSummary) => {
    if (!ticketSummary || ticketSummary.length === 0) return "No tickets";

    return ticketSummary.map(ticket =>
      `${ticket.quantity} ${ticket.type} ticket${ticket.quantity > 1 ? 's' : ''}`
    ).join(', ');
  };

  // Format price display
  const formatPrice = (event) => {
    if (event.isFreeEvent) {
      return "Free Event";
    }
    return `₹${event.totalAmount.toFixed(2)}`;
  };

  // Handle retry if loading fails
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (currentUser) {
      setCurrentUser({...currentUser}); // This will trigger the user data fetch again
    }
  };

  // Handle QR code dialog
  const handleOpenQR = (bookingId) => {
    setSelectedQR(bookingId);
  };

  const handleCloseQR = () => {
    setSelectedQR(null);
  };

 // Replace the final JSX return block with this updated responsive layout
return (
  <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
    <MainHeader />

    <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1" sx={{ fontWeight: "bold", color: "rgb(25, 174, 220)" }}>
          Your Recent Orders
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress sx={{ color: "rgb(25, 174, 220)" }} />
        </Box>
      ) : error ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1" color="error" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <IconButton onClick={handleRetry} sx={{ color: "rgb(25, 174, 220)", '&:hover': { backgroundColor: 'rgba(25, 174, 220, 0.1)' } }}>
              <Box component="span" sx={{ display: "flex", alignItems: "center" }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                  <path d="M21 3v5h-5"></path>
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                  <path d="M3 21v-5h5"></path>
                </svg>
                <Typography variant="button" sx={{ ml: 1 }}>Retry</Typography>
              </Box>
            </IconButton>
          </Box>
        </Paper>
      ) : tickets.length === 0 ? (
        <Paper sx={{ p: 5, textAlign: "center" }}>
          <Typography variant="h6">You haven't made any bookings yet.</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Browse events and book your first ticket!
          </Typography>
        </Paper>
      ) : (
        tickets.map((ticket) => (
          <Box key={ticket.id} sx={{ mb: 4 }}>
            <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
              Ordered on: {ticket.orderedOn} | Booking ID: {ticket.bookingId}
            </Typography>

            <Paper
              elevation={2}
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                height: { xs: "auto", sm: 170 },
                position: "relative",
               
              }}
            >
              <Box
                sx={{
                  width: { xs: "100%", sm: 250 },
                  height: { xs: 160, sm: "100%" },
                  backgroundImage: `url(${getEventImage(ticket.event)})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />

              <Box sx={{
                p: 2,
                flexGrow: 1,
                position: "relative",
                display: "flex",
                flexDirection: "column"
              }}>
                <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {ticket.event.title}
                  </Typography>

                  <Chip
                    label={formatPrice(ticket.event)}
                    size="small"
                    sx={{
                      backgroundColor: ticket.event.isFreeEvent ? "#e3fcef" : "#eef8ff",
                      color: ticket.event.isFreeEvent ? "#0db864" : "#58a6ff",
                      borderRadius: 1,
                      mt: { xs: 1, sm: 0 }
                    }}
                  />
                </Box>

                <Typography variant="body2" sx={{ color: "#666", mb: 0.5 }}>
                  {ticket.event.date} {ticket.event.time !== "N/A" ? `| ${ticket.event.time}` : ""}
                </Typography>

                <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                  {ticket.event.venue}
                </Typography>

                <Typography variant="body2" sx={{ fontWeight: "bold", mb: 1 }}>
                  {formatTicketsText(ticket.event.tickets)}
                </Typography>

                <Box sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", sm: "center" },
                  mt: "auto",
                  gap: 1
                }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={ticket.event.status}
                      size="small"
                      sx={{
                        backgroundColor: ticket.event.status === "Upcoming" ? "#e3fcef" : "#f0f0f0",
                        color: ticket.event.status === "Upcoming" ? "#0db864" : "#666",
                        height: 24,
                        fontWeight: 500
                      }}
                    />
                    {ticket.event.status === "Upcoming" && (
                      <Tooltip title="Show QR Code">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenQR(ticket.bookingId)}
                          sx={{ color: "rgb(25, 174, 220)", p: 0.5 }}
                        >
                          <QrCodeIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>

                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {ticket.event.status === "Upcoming"
                      ? "Hope you enjoy the event!"
                      : "Hope you enjoyed the event!"}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        ))
      )}

      {/* QR Code Dialog */}
      <Dialog open={!!selectedQR} onClose={handleCloseQR} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ textAlign: "center", pb: 1 }}>
          Your Ticket QR Code
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", alignItems: "center", pt: 1 }}>
          <Box sx={{ p: 2, border: "1px solid #eee", borderRadius: 2, mb: 2 }}>
            <QRCode value={selectedQR || ""} size={200} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button variant="outlined" onClick={handleCloseQR} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  </Box>
);

};

export default RecentOrders;