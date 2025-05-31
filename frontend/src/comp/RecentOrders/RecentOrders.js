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
  Alert,
  Snackbar,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import QrCodeIcon from "@mui/icons-material/QrCode";
import CancelIcon from "@mui/icons-material/Cancel";
import { auth, db } from "../../firebase_config";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
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
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  // Fetch user data
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
        setError("Failed to load user data");
        console.error(`Error fetching user data: ${err.message}`);
      }
    };
    if (currentUser) {
      fetchUserData();
    }
  }, [currentUser, userId]);

  // Fetch first event image from Firestore document
  const fetchEventImage = async (eventId) => {
    try {
      if (!eventId) {
        console.warn("No eventId provided");
        return null;
      }

      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (!eventDoc.exists()) {
        console.warn(`No event document found for eventId: ${eventId}`);
        return null;
      }

      const eventData = eventDoc.data();
      const images = eventData.images || eventData.bannerImages || [];

      if (images.length === 0) {
        console.warn(`No images found in event document for eventId: ${eventId}`);
        return null;
      }

      const firstImageUrl = images[0];
      if (typeof firstImageUrl !== "string" || !firstImageUrl.trim()) {
        console.warn(`Invalid image URL format for eventId: ${eventId}`);
        return null;
      }

      return firstImageUrl;
    } catch (error) {
      console.error(`Error fetching event image for eventId ${eventId}: ${error.message}`);
      return null;
    }
  };

  // Fetch event details for cancellation info
  const fetchEventDetails = async (eventId) => {
    try {
      const eventDocRef = doc(db, "events", eventId);
      const eventDocSnapshot = await getDoc(eventDocRef);
      if (eventDocSnapshot.exists()) {
        const eventData = eventDocSnapshot.data();
        return {
          cancellationAvailable:
            eventData.cancellationAvailable === "true" ||
            eventData.cancellationAvailable === true,
          cancellationDays: parseInt(eventData.cancellationDays) || 0,
          deductionRate: parseFloat(eventData.deductionRate) || 0,
          deductionType: eventData.deductionType || "price",
          eventDate: eventData.eventDate || null,
        };
      }
      return {
        cancellationAvailable: false,
        cancellationDays: 0,
        deductionRate: 0,
        deductionType: "price",
        eventDate: null,
      };
    } catch (error) {
      console.error(`Error fetching event details for eventId ${eventId}: ${error.message}`);
      return {
        cancellationAvailable: false,
        cancellationDays: 0,
        deductionRate: 0,
        deductionType: "price",
        eventDate: null,
      };
    }
  };

  // Check if cancellation is allowed
  const isCancellationAllowed = (
    eventDateStr,
    cancellationAvailable,
    cancellationDays
  ) => {
    if (!cancellationAvailable || !eventDateStr) return false;
    try {
      const eventDate = new Date(eventDateStr);
      const currentDate = new Date();
      const daysDifference = Math.ceil(
        (eventDate - currentDate) / (1000 * 60 * 60 * 24)
      );
      return daysDifference >= cancellationDays;
    } catch (error) {
      console.error(`Error checking cancellation for event: ${error.message}`);
      return false;
    }
  };

  // Fetch tickets
  useEffect(() => {
    const fetchTicketsEnhanced = async () => {
      if (!userData) return;
      try {
        setLoading(true);
        const targetUserId = userId || currentUser.uid;
        const ticketsQuery = query(
          collection(db, "tickets"),
          where("userId", "==", targetUserId),
          orderBy("createdAt", "desc")
        );
        const ticketsSnapshot = await getDocs(ticketsQuery);

        if (ticketsSnapshot.empty) {
          setTickets([]);
          setLoading(false);
          return;
        }

        const ticketsPromises = ticketsSnapshot.docs.map(async (doc) => {
          const ticketData = doc.data();
          if (!ticketData) {
            console.warn(`No data found for ticket ${doc.id}`);
            return null;
          }

          let formattedOrderDate = "Date not available";
          try {
            const createdAtDate = new Date(ticketData.createdAt);
            if (!isNaN(createdAtDate.getTime())) {
              formattedOrderDate = `${createdAtDate.toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })} at ${createdAtDate.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}`;
            }
          } catch (dateError) {
            console.warn(`Failed to format date for ticket ${doc.id}: ${dateError.message}`);
          }

          const eventStatus = determineEventStatus(ticketData.eventDate);
          let eventImageUrl = null;
          if (ticketData.eventId) {
            eventImageUrl = await fetchEventImage(ticketData.eventId);
          }

          let cancellationInfo = {
            cancellationAvailable: false,
            cancellationDays: 0,
            deductionRate: 0,
            deductionType: "price",
            eventDate: null,
          };
          if (ticketData.eventId) {
            cancellationInfo = await fetchEventDetails(ticketData.eventId);
          }

          const canCancel =
            eventStatus === "Upcoming" &&
            !ticketData.cancelled &&
            isCancellationAllowed(
              cancellationInfo.eventDate || ticketData.eventDate,
              cancellationInfo.cancellationAvailable,
              cancellationInfo.cancellationDays
            );

          return {
            id: doc.id,
            bookingId:
              ticketData.bookingId ||
              "#" + doc.id.substring(0, 8).toUpperCase(),
            orderedOn: formattedOrderDate,
            cancelled: ticketData.cancelled || false,
            cancelledAt: ticketData.cancelledAt || null,
            refundAmount: ticketData.refundAmount || null,
            event: {
              id: ticketData.eventId || doc.id,
              title: ticketData.eventName || "Untitled Event",
              date: ticketData.eventDate || "Date not available",
              formattedDate: ticketData.eventDate
                ? new Date(ticketData.eventDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Date not available",
              time: ticketData.eventTime || "Time not available",
              venue: ticketData.location || "Venue not specified",
              imageUrl: eventImageUrl,
              tickets: ticketData.ticketSummary || [],
              status: eventStatus,
              isFreeEvent: ticketData.financial?.isFreeEvent || false,
              totalAmount: ticketData.financial?.totalAmount || 0,
              cancellationAvailable: cancellationInfo.cancellationAvailable,
              cancellationDays: cancellationInfo.cancellationDays,
              deductionRate: cancellationInfo.deductionRate,
              deductionType: cancellationInfo.deductionType,
              canCancel: canCancel,
            },
            foodItems: ticketData.foodSummary || [],
          };
        });

        const ticketsData = (await Promise.all(ticketsPromises)).filter(
          (ticket) => ticket !== null
        );
        setTickets(ticketsData);
        setLoading(false);
      } catch (err) {
        console.error(`Error in fetchTickets: ${err.message}`);
        setError("Failed to load your recent orders. Please try again later.");
        setLoading(false);
      }
    };

    if (userData) {
      fetchTicketsEnhanced();
    }
  }, [userData, currentUser, userId]);

  // Determine event status
  const determineEventStatus = (eventDateStr) => {
    if (!eventDateStr) return "Unknown";
    try {
      const eventDate = new Date(eventDateStr);
      const now = new Date();
      if (isNaN(eventDate.getTime())) {
        return "Unknown";
      }
      return eventDate > now ? "Upcoming" : "Finished";
    } catch (error) {
      console.error(`Error determining event status: ${error.message}`);
      return "Unknown";
    }
  };

  // Format tickets for display
  const formatTicketsText = (ticketSummary) => {
    if (!ticketSummary || ticketSummary.length === 0) return "No tickets";
    return ticketSummary
      .map(
        (ticket) =>
          `${ticket.quantity} ${ticket.type} ticket${
            ticket.quantity > 1 ? "s" : ""
          }`
      )
      .join(", ");
  };

  // Format price
  const formatPrice = (event) => {
    if (event.isFreeEvent) {
      return "Free Event";
    }
    return `₹${event.totalAmount.toFixed(2)}`;
  };

  // Handle retry
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    if (currentUser) {
      setCurrentUser({ ...currentUser });
    }
  };

  // Handle QR code dialog
  const handleOpenQR = (bookingId) => {
    setSelectedQR(bookingId);
  };

  const handleCloseQR = () => {
    setSelectedQR(null);
  };

  // Handle ticket cancellation
  const handleCancelTicket = async (ticketId, eventTitle, ticket) => {
    if (!window.confirm(`Are you sure you want to cancel your ticket for "${eventTitle}"?`)) {
      return;
    }
    setCancellationLoading(true);
    try {
      let refundAmount = ticket.event.totalAmount;
      let cancellationFee = 0;
      const ticketCount = ticket.event.tickets.reduce(
        (total, t) => total + t.quantity,
        0
      );

      if (ticket.event.deductionType === "percentage") {
        refundAmount =
          (ticket.event.totalAmount * (100 - ticket.event.deductionRate)) / 100;
        cancellationFee = ticket.event.totalAmount - refundAmount;
      } else if (ticket.event.deductionType === "price") {
        cancellationFee = ticket.event.deductionRate * ticketCount;
        refundAmount = ticket.event.totalAmount - cancellationFee;
      }

      refundAmount = Math.max(0, Math.round(refundAmount * 100) / 100);
      cancellationFee = Math.round(cancellationFee * 100) / 100;

      const ticketDocRef = doc(db, "tickets", ticketId);
      const cancellationTime = new Date().toISOString();
      await updateDoc(ticketDocRef, {
        cancelled: true,
        cancelledAt: cancellationTime,
        refundAmount: refundAmount,
      });

      // Update tickets state to reflect cancellation
      setTickets((prevTickets) =>
        prevTickets.map((t) =>
          t.id === ticketId
            ? { ...t, cancelled: true, refundAmount, cancelledAt: cancellationTime }
            : t
        )
      );

      setSnackbar({
        open: true,
        message: `Ticket for "${eventTitle}" cancelled successfully. Refund of ₹${refundAmount.toFixed(2)} will be processed.`,
        severity: "success",
      });
    } catch (error) {
      console.error(`Error cancelling ticket ${ticketId}: ${error.message}`);
      setSnackbar({
        open: true,
        message: `Failed to cancel ticket: ${error.message}`,
        severity: "error",
      });
    } finally {
      setCancellationLoading(false);
    }
  };

  // Get cancellation message
  const getCancellationMessage = (event) => {
    if (!event.cancellationAvailable) {
      return "Cancellation not available";
    }
    if (event.status !== "Upcoming") {
      return "Event finished";
    }
    if (!event.canCancel) {
      return `Cancellation available until ${event.cancellationDays} days before event`;
    }
    return "";
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ backgroundColor: "#f9f9f9", minHeight: "100vh" }}>
      <MainHeader />
      <Container maxWidth="lg" sx={{ pt: 4, pb: 8 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h5"
            component="h1"
            sx={{ fontWeight: "bold", color: "rgb(25, 174, 220)", fontFamily: "Albert Sans, sans-serif" }}
          >
            Your Recent Orders
          </Typography>
        </Box>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
            <CircularProgress sx={{ color: "rgb(25, 174, 220)" }} />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="body1" color="error" sx={{ mb: 2, fontFamily: "Albert Sans, sans-serif" }}>
              {error}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <IconButton
                onClick={handleRetry}
                sx={{
                  color: "rgb(25, 174, 220)",
                  "&:hover": { backgroundColor: "rgba(25, 174, 220, 0.1)" },
                }}
              >
                <Box
                  component="span"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                    <path d="M21 3v5h-5"></path>
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                    <path d="M3 21v-5h5"></path>
                  </svg>
                  <Typography variant="button" sx={{ ml: 1, fontFamily: "Albert Sans, sans-serif" }}>
                    Retry
                  </Typography>
                </Box>
              </IconButton>
            </Box>
          </Paper>
        ) : tickets.length === 0 ? (
          <Paper sx={{ p: 5, textAlign: "center" }}>
            <Typography variant="h6" sx={{ fontFamily: "Albert Sans, sans-serif" }}>
              You haven't made any bookings yet.
            </Typography>
            <Typography variant="body1" sx={{ mt: 2, fontFamily: "Albert Sans, sans-serif" }}>
              Browse events and book your first ticket!
            </Typography>
          </Paper>
        ) : (
          tickets.map((ticket) => (
            <Box key={ticket.id} sx={{ mb: 4 }}>
              <Typography variant="body2" sx={{ color: "#666", mb: 1, fontFamily: "Albert Sans, sans-serif" }}>
                Ordered on: {ticket.orderedOn} | Booking ID: {ticket.bookingId}
                {ticket.cancelled && (
                  <span style={{ color: "#ff6b6b", fontWeight: "bold" }}>
                    {" "}
                    | CANCELLED
                    {ticket.refundAmount !== null &&
                      ` | Refund: ₹${ticket.refundAmount.toFixed(2)}`}
                  </span>
                )}
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
                  opacity: ticket.cancelled ? 0.7 : 1,
                  border: ticket.cancelled ? "2px solid #ff6b6b" : "none",
                }}
              >
                <Box
                  sx={{
                    width: { xs: "100%", sm: 250 },
                    height: { xs: 160, sm: "100%" },
                    position: "relative",
                    backgroundColor: "#f5f5f5",
                    filter: ticket.cancelled ? "grayscale(50%)" : "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {ticket.event.imageUrl ? (
                    <img
                      src={ticket.event.imageUrl}
                      alt={`${ticket.event.title} event image`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: ticket.event.imageUrl ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#f5f5f5",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "Albert Sans, sans-serif" }}>
                      {ticket.event.imageUrl ? "Image Failed to Load" : "No Image Available"}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  sx={{
                    p: 2,
                    flexGrow: 1,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                      mb: 1,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: "bold", fontFamily: "Albert Sans, sans-serif" }}>
                      {ticket.event.title}
                    </Typography>
                    <Chip
                      label={formatPrice(ticket.event)}
                      size="small"
                      sx={{
                        backgroundColor: ticket.event.isFreeEvent
                          ? "#e3fcef"
                          : "#eef8ff",
                        color: ticket.event.isFreeEvent ? "#0db864" : "#58a6ff",
                        borderRadius: 1,
                        mt: { xs: 1, sm: 0 },
                        fontFamily: "Albert Sans, sans-serif",
                      }}
                    />
                  </Box>
                  <Typography variant="body2" sx={{ color: "#666", mb: 0.5, fontFamily: "Albert Sans, sans-serif" }}>
                    {ticket.event.formattedDate}{" "}
                    {ticket.event.time !== "Time not available" ? `| ${ticket.event.time}` : ""}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#666", mb: 1, fontFamily: "Albert Sans, sans-serif" }}>
                    {ticket.event.venue}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", mb: 1, fontFamily: "Albert Sans, sans-serif" }}
                  >
                    {formatTicketsText(ticket.event.tickets)}
                  </Typography>
                  {ticket.cancelled && ticket.refundAmount !== null && (
                    <Alert severity="info" sx={{ mb: 1, fontSize: "0.8rem", fontFamily: "Albert Sans, sans-serif" }}>
                      Ticket cancelled. Refund of ₹
                      {ticket.refundAmount.toFixed(2)} will be processed within
                      3-5 business days.
                    </Alert>
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", sm: "row" },
                      justifyContent: "space-between",
                      alignItems: { xs: "flex-start", sm: "center" },
                      mt: "auto",
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <Chip
                        label={ticket.cancelled ? "Cancelled" : ticket.event.status}
                        size="small"
                        sx={{
                          backgroundColor: ticket.cancelled
                            ? "#ffe6e6"
                            : ticket.event.status === "Upcoming"
                            ? "#e3fcef"
                            : "#f0f0f0",
                          color: ticket.cancelled
                            ? "#ff6b6b"
                            : ticket.event.status === "Upcoming"
                            ? "#0db864"
                            : "#666",
                          height: 24,
                          fontWeight: 500,
                          fontFamily: "Albert Sans, sans-serif",
                        }}
                      />
                      {ticket.event.status === "Upcoming" && !ticket.cancelled && (
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
                      {ticket.event.status === "Upcoming" &&
                        !ticket.cancelled &&
                        (ticket.event.canCancel ? (
                          <Tooltip title="Cancel Ticket">
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleCancelTicket(
                                  ticket.id,
                                  ticket.event.title,
                                  ticket
                                )
                              }
                              disabled={cancellationLoading}
                              sx={{ color: "#ff6b6b", p: 0.5 }}
                            >
                              {cancellationLoading ? (
                                <CircularProgress
                                  size={16}
                                  sx={{ color: "#ff6b6b" }}
                                />
                              ) : (
                                <CancelIcon fontSize="small" />
                              )}
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              color: "#ff6b6b",
                              fontSize: "0.7rem",
                              backgroundColor: "#ffe6e6",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              whiteSpace: "nowrap",
                              fontFamily: "Albert Sans, sans-serif",
                            }}
                          >
                            {getCancellationMessage(ticket.event)}
                          </Typography>
                        ))}
                    </Box>
                    <Typography variant="body2" sx={{ color: "#666", fontFamily: "Albert Sans, sans-serif" }}>
                      {ticket.cancelled
                        ? "Ticket has been cancelled"
                        : ticket.event.status === "Upcoming"
                        ? "Hope you enjoy the event!"
                        : "Hope you enjoyed the event!"}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          ))
        )}
        <Dialog
          open={!!selectedQR}
          onClose={handleCloseQR}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ textAlign: "center", pb: 1, fontFamily: "Albert Sans, sans-serif" }}>
            Your Ticket QR Code
          </DialogTitle>
          <DialogContent
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              pt: 1,
            }}
          >
            <Box
              sx={{ p: 2, border: "1px solid #eee", borderRadius: 2, mb: 2 }}
            >
              <QRCode value={selectedQR || ""} size={200} />
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
            <Button
              variant="outlined"
              onClick={handleCloseQR}
              sx={{ textTransform: "none", fontFamily: "Albert Sans, sans-serif" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={handleSnackbarClose}
            severity={snackbar.severity}
            sx={{ width: "100%", fontFamily: "Albert Sans, sans-serif" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default RecentOrders;