import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Paper,
  Alert,
  CircularProgress,
  useMediaQuery,
  Card,
  CardContent,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../Header/MainHeaderWOS";
import Footer from "../Footer/Footer.js";
import { doc, getDoc, updateDoc, increment } from "firebase/firestore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ErrorIcon from "@mui/icons-material/Error";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { auth, db } from "../../firebase_config";

// Format date and time from ISO string to IST
const formatEventDateTime = (isoDateString) => {
  if (!isoDateString) return { formattedDate: "N/A", eventTime: "N/A" };

  try {
    const eventDateTime = new Date(isoDateString);
    const formattedDate = eventDateTime.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
    const eventTime = eventDateTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
    return { formattedDate, eventTime };
  } catch (error) {
    console.error("Error formatting date/time:", error);
    return { formattedDate: "N/A", eventTime: "N/A" };
  }
};

const TicketBookedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState({
    status: "pending",
    message: "",
  });
  const [eventImage, setEventImage] = useState(null);
  const [userProfileData, setUserProfileData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [ticketAvailability, setTicketAvailability] = useState(null);
  const [availabilityUpdated, setAvailabilityUpdated] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  const qrRef = useRef(null);
  const ticketRef = useRef(null);

  const {
    event = {},
    ticketSummary = [],
    foodSummary = [],
    financial = {
      subtotal: 0,
      convenienceFee: 0,
      discount: 0,
      gst: 0,
      totalAmount: 0,
      isFreeEvent: true,
    },
    bookingId: passedBookingId,
  } = location.state || {};

  const [bookingId] = useState(passedBookingId || (() => {
    const timestamp = new Date().getTime().toString(36).slice(-4);
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `#${randomChars}${timestamp}`;
  })());

  const { formattedDate, eventTime } = event.eventDate
    ? formatEventDateTime(event.eventDate)
    : event.date
    ? formatEventDateTime(event.date)
    : {
        formattedDate: event.date
          ? new Date(event.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "N/A",
        eventTime: event.time || "N/A",
      };

  const totalTickets = ticketSummary.reduce(
    (sum, ticket) => sum + ticket.quantity,
    0
  );

  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "₹0.00";
    }
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return "₹0.00";
    }
    return `₹${numValue.toFixed(2)}`;
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });

  const currentTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });

  const qrCodeData = bookingId;

  // Function to update ticket availability in the database
  const updateTicketAvailability = async (eventId, bookedTickets) => {
    try {
      if (!eventId || !bookedTickets || bookedTickets.length === 0) {
        console.log("No event ID or booked tickets to update");
        return;
      }

      console.log("Updating ticket availability for event:", eventId);
      console.log("Booked tickets:", bookedTickets);

      const eventDocRef = doc(db, "events", eventId);

      // Calculate total tickets booked
      const totalTicketsBooked = bookedTickets.reduce((sum, ticket) => sum + ticket.quantity, 0);

      // Update individual ticket types in pricing array first
      await updatePricingArray(eventId, bookedTickets);

      // Then update overall counts
      const updateData = {
        // Update total booked count
        ticketBookedCount: increment(totalTicketsBooked),
        // Update total available tickets (decrease by booked amount)
        totalAvailableTickets: increment(-totalTicketsBooked)
      };

      await updateDoc(eventDocRef, updateData);

      console.log("Ticket availability updated successfully");
      setAvailabilityUpdated(true);
    } catch (error) {
      console.error("Error updating ticket availability:", error);
      throw error;
    }
  };

  // Helper function to update the pricing array
  const updatePricingArray = async (eventId, bookedTickets) => {
    try {
      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const pricing = [...(eventData.pricing || [])];

        // Update each booked ticket type
        bookedTickets.forEach(bookedTicket => {
          const ticketIndex = pricing.findIndex(p => p.ticketType === bookedTicket.type);
          if (ticketIndex !== -1) {
            // Update booked count
            pricing[ticketIndex].booked = (pricing[ticketIndex].booked || 0) + bookedTicket.quantity;
            // Update available count
            const totalSeats = pricing[ticketIndex].seats || 0;
            const totalBooked = pricing[ticketIndex].booked;
            pricing[ticketIndex].available = Math.max(0, totalSeats - totalBooked);

            console.log(`Updated ${bookedTicket.type}: booked=${pricing[ticketIndex].booked}, available=${pricing[ticketIndex].available}`);
          }
        });

        // Write back the updated pricing array
        await updateDoc(eventDocRef, {
          pricing: pricing
        });

        console.log("Pricing array updated successfully");
      }
    } catch (error) {
      console.error("Error updating pricing array:", error);
      throw error;
    }
  };

  const fetchUserProfileData = async (userId) => {
    try {
      if (!userId) return null;
      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserProfileData(userData);
        return userData;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const fetchEventData = async () => {
    try {
      if (event.id) {
        const eventDocRef = doc(db, "events", event.id);
        const eventDoc = await getDoc(eventDocRef);
        if (eventDoc.exists()) {
          const data = eventDoc.data();
          setEventData(data);
          return data;
        }
      }
      setEventData(event);
      return event;
    } catch (error) {
      console.error("Error fetching event data:", error);
      setEventData(event);
      return event;
    }
  };

  const fetchTicketAvailability = async (eventId) => {
    try {
      if (!eventId) return;

      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const pricing = eventData.pricing || [];

        const availability = pricing.map(ticket => ({
          ticketType: ticket.ticketType,
          totalSeats: ticket.seats,
          bookedSeats: ticket.booked || 0,
          availableSeats: ticket.available !== undefined ? ticket.available : (ticket.seats - (ticket.booked || 0)),
          price: ticket.price,
          features: ticket.features,
          isSoldOut: (ticket.available !== undefined ? ticket.available : (ticket.seats - (ticket.booked || 0))) <= 0
        }));

        const totalSeats = pricing.reduce((sum, p) => sum + p.seats, 0);
        const totalBooked = eventData.ticketBookedCount || 0;
        const totalAvailable = eventData.totalAvailableTickets !== undefined
          ? eventData.totalAvailableTickets
          : totalSeats - totalBooked;

        setTicketAvailability({
          totalSeats,
          totalBookedTickets: totalBooked,
          totalAvailableTickets: totalAvailable,
          ticketTypes: availability,
          isEventSoldOut: totalAvailable <= 0
        });

        console.log("Current ticket availability:", {
          totalSeats,
          totalBooked,
          totalAvailable,
          ticketTypes: availability
        });
      }
    } catch (error) {
      console.error("Error fetching ticket availability:", error);
    }
  };

  const fetchEventImage = async (eventData) => {
    try {
      setEventImage(null);
      if (eventData?.bannerImages?.length > 0) {
        setEventImage(eventData.bannerImages[0]);
        return;
      }
      const possibleImageFields = ["imageUrl", "bannerImage", "thumbnail", "image"];
      for (const field of possibleImageFields) {
        if (eventData[field]) {
          setEventImage(eventData[field]);
          return;
        }
      }
      setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
    } catch (error) {
      console.error("Error in image fetching process:", error);
      setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
    }
  };

  useEffect(() => {
    const handleInitialSetup = async () => {
      try {
        setIsLoading(true);
        const currentUser = auth.currentUser;

        if (currentUser) {
          const profileData = await fetchUserProfileData(currentUser.uid);
          setUser({
            id: currentUser.uid,
            email: currentUser.email || "N/A",
            phone: profileData?.phoneNumber || profileData?.phone || currentUser.phoneNumber || "N/A",
          });

          const updatedEventData = await fetchEventData();
          await fetchEventImage(updatedEventData);

          // Fetch current ticket availability
          if (updatedEventData?.eventId || updatedEventData?.id || event.id) {
            await fetchTicketAvailability(updatedEventData?.eventId || updatedEventData?.id || event.id);
          }

          setBookingStatus({
            status: "success",
            message: "Ticket booked successfully!",
          });
        } else {
          setBookingStatus({
            status: "error",
            message: "No user authenticated. Please log in again.",
          });
        }
      } catch (error) {
        console.error("Error in initial setup:", error);
        setBookingStatus({
          status: "error",
          message: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    handleInitialSetup();
  }, []);

  // Update ticket availability after successful booking
  useEffect(() => {
    const handleBookingSuccess = async () => {
      if (bookingStatus.status === "success" && ticketSummary.length > 0 && !availabilityUpdated) {
        try {
          const eventId = eventData?.eventId || eventData?.id || event.id;
          if (eventId) {
            console.log("Booking successful, updating ticket availability...");
            await updateTicketAvailability(eventId, ticketSummary);
            // Refresh the availability data to show updated counts
            setTimeout(async () => {
              await fetchTicketAvailability(eventId);
            }, 1000);
          }
        } catch (error) {
          console.error("Error updating ticket availability after booking:", error);
          // Don't show error to user as booking was successful
        }
      }
    };

    handleBookingSuccess();
  }, [bookingStatus.status, eventData, availabilityUpdated]);

  const handleDownloadTicket = async () => {
    if (!ticketRef.current) {
      alert("Cannot find the ticket element to download.");
      return;
    }

    try {
      setBookingStatus({
        status: bookingStatus.status,
        message: "Preparing your ticket for download...",
      });

      const preloadImage = (src) => {
        return new Promise((resolve, reject) => {
          if (!src || src.includes("placeholder")) {
            resolve(null);
            return;
          }
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          img.src = src;
        });
      };

      const preloadedImage = await preloadImage(eventImage);

      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        removeContainer: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc, element) => {
          const images = clonedDoc.querySelectorAll("img");
          images.forEach((img) => {
            if (preloadedImage && img.src === eventImage) {
              const imgCanvas = clonedDoc.createElement("canvas");
              const ctx = imgCanvas.getContext("2d");
              const computedStyle = window.getComputedStyle(img);
              imgCanvas.width = parseInt(computedStyle.width) || img.offsetWidth;
              imgCanvas.height = parseInt(computedStyle.height) || img.offsetHeight;
              ctx.drawImage(preloadedImage, 0, 0, imgCanvas.width, imgCanvas.height);
              img.parentNode.replaceChild(imgCanvas, img);
            }
          });

          const buttons = clonedDoc.querySelectorAll("button");
          buttons.forEach((btn) => {
            btn.blur();
            btn.style.boxShadow = "none";
            btn.style.transform = "none";
          });
        },
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const scale = Math.min(
        (pdfWidth - 20) / (imgWidth * 0.264583),
        (pdfHeight - 20) / (imgHeight * 0.264583)
      );

      const scaledWidth = imgWidth * 0.264583 * scale;
      const scaledHeight = imgHeight * 0.264583 * scale;

      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;

      pdf.addImage(imgData, "PNG", x, y, scaledWidth, scaledHeight);

      const cleanBookingId = bookingId.replace("#", "");
      const eventName = (event.name || "Event").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`${eventName}_Ticket_${cleanBookingId}.pdf`);

      setBookingStatus({
        status: bookingStatus.status,
        message: "Ticket downloaded successfully!",
      });

      setTimeout(() => {
        if (bookingStatus.status === "success") {
          setBookingStatus({
            status: "success",
            message: "Ticket booked successfully!",
          });
        }
      }, 3000);
    } catch (error) {
      console.error("Error with download function:", error);
      alert("There was an error downloading your ticket. Please try taking a screenshot instead, or contact support if the issue persists.");
      setBookingStatus({
        status: bookingStatus.status,
        message: bookingStatus.status === "success" ? "Ticket booked successfully!" : bookingStatus.message,
      });
    }
  };

  const ticketTypes = ticketSummary.map((ticket) => ticket.type).join(", ");
  const foodNote = foodSummary.length > 0 ? "Grab a bite applied" : "";

  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          backgroundColor: "#f5f5f5",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress sx={{ color: "#19AEDC", mb: 2 }} />
          <Typography variant="h6">Loading your ticket...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        overflowX: "hidden",
      }}
    >
      <Header />

      {bookingStatus.status === "error" && (
        <Alert
          severity="error"
          sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}
        >
          <Typography>{bookingStatus.message}</Typography>
        </Alert>
      )}

      {bookingStatus.status === "success" && (
        <Box sx={{ textAlign: "center", mt: isMobile ? 2 : 5, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 1,
            }}
          >
            <CheckCircleIcon
              sx={{
                color: "white",
                fontSize: isMobile ? 20 : 28,
                backgroundColor: "#4CAF50",
                borderRadius: "50%",
                p: 0.8,
              }}
            />
          </Box>
          <Typography
            variant="h5"
            fontWeight="bold"
            sx={{ fontSize: isMobile ? 20 : 24 }}
          >
            Ticket Booked Successfully, Pal!
          </Typography>
          <Typography
            variant="body1"
            sx={{ mt: 0.5, fontSize: isMobile ? 14 : 16 }}
          >
            Get ready for an amazing experience! 🎉
          </Typography>

          {/* Display current availability status */}
          {ticketAvailability && (
            <Typography
              variant="body2"
              sx={{ mt: 1, fontSize: isMobile ? 12 : 14, color: "#666" }}
            >
              Tickets remaining: {ticketAvailability.totalAvailableTickets} / {ticketAvailability.totalSeats}
            </Typography>
          )}
        </Box>
      )}

      {bookingStatus.status === "error" && (
        <Box sx={{ textAlign: "center", mt: 5, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 1,
            }}
          >
            <ErrorIcon
              sx={{
                color: "white",
                fontSize: 28,
                backgroundColor: "#f44336",
                borderRadius: "50%",
                p: 0.8,
              }}
            />
          </Box>
          <Typography variant="h5" fontWeight="bold">
            Oops! We're having trouble saving your ticket
          </Typography>
          <Typography variant="body1" sx={{ mt: 0.5 }}>
            Don't worry, your ticket information is shown below
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          maxWidth: isMobile ? "100%" : 1000,
          mx: "auto",
          position: "relative",
        }}
      >
        {!isMobile && (
          <Box
            sx={{
              position: "absolute",
              width: 70,
              height: 30,
              backgroundColor: "#f5f5f5",
              borderRadius: "0 0 30px 30px",
              top: 0,
              left: "37%",
              transform: "translateX(-50%)",
              zIndex: 1,
            }}
          />
        )}

        {!isMobile && (
          <Paper
            elevation={3}
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              position: "relative",
              opacity: bookingStatus.status === "pending" ? 0.7 : 1,
              boxShadow: 0,
            }}
            ref={ticketRef}
            id="ticket-card"
          >
            <Box sx={{ display: "flex" }}>
              <Box
                sx={{
                  width: "35%",
                  pt: 2,
                  pb: 2,
                  pl: 5,
                  pr: 8,
                  borderRight: "1px dashed #ddd",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Box
                  component="img"
                  src={
                    eventImage ||
                    "https://via.placeholder.com/270x180?text=Event+Image"
                  }
                  alt={event.name || "Event"}
                  sx={{
                    width: "100%",
                    height: 270,
                    maxWidth: 270,
                    borderRadius: 1,
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/270x180?text=Event+Image";
                  }}
                />
              </Box>

              <Box
                sx={{
                  width: "35%",
                  p: 2,
                  borderRight: "1px dashed #ddd",
                  ml: 5,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ borderBottom: "1px solid #000", pb: 1, mb: 2 }}
                >
                  {event.name || "Event"}
                </Typography>

                <Box
                  mt={1}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <CalendarTodayIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">{formattedDate}</Typography>
                </Box>

                <Box
                  mt={1}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <AccessTimeIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">{eventTime}</Typography>
                </Box>

                <Box
                  mt={1}
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
                >
                  <LocationOnIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2">
                    {eventData?.venueDetails?.venueName || event.location || "N/A"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography variant="body2">
                    Number of Tickets: {totalTickets}
                  </Typography>
                  {ticketSummary.length > 0 && (
                    <Box
                      sx={{ ml: "auto", display: "flex", alignItems: "center" }}
                    >
                      <DirectionsCarIcon sx={{ mr: 0.5, fontSize: 18 }} />
                      <Typography variant="body2" fontWeight="bold">
                        {ticketSummary[0].type}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="body2">Ticket sent to</Typography>
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    {userProfileData?.phoneNumber ||
                      userProfileData?.phone ||
                      user?.phone ||
                      "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                  <Typography variant="body2">
                    {user?.email || "N/A"}
                  </Typography>
                </Box>

                {foodNote && (
                  <Typography
                    variant="body2"
                    sx={{ mt: 1, fontStyle: "italic", color: "#666" }}
                  >
                    {foodNote}
                  </Typography>
                )}
              </Box>

              <Box
                sx={{
                  width: "30%",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  ml: 5,
                }}
              >
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  sx={{ mb: 2, textAlign: "center" }}
                >
                  Booking ID
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ mb: 2, color: "#19AEDC", textAlign: "center" }}
                >
                  {bookingId}
                </Typography>

                <Box sx={{ mb: 2 }} ref={qrRef}>
                  <QRCode
                    value={qrCodeData}
                    size={100}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    includeMargin={true}
                  />
                </Box>

                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", mb: 1 }}
                >
                  Booked on: {currentDate}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", mb: 2 }}
                >
                  Time: {currentTime}
                </Typography>

                {!financial.isFreeEvent && (
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: "#4CAF50", textAlign: "center" }}
                  >
                    Total: {formatCurrency(financial.totalAmount)}
                  </Typography>
                )}
              </Box>
            </Box>

            <Box
              sx={{
                position: "absolute",
                width: 30,
                height: 30,
                backgroundColor: "#f5f5f5",
                borderRadius: "50%",
                top: "50%",
                left: -15,
                transform: "translateY(-50%)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                width: 30,
                height: 30,
                backgroundColor: "#f5f5f5",
                borderRadius: "50%",
                top: "50%",
                right: -15,
                transform: "translateY(-50%)",
              }}
            />
          </Paper>
        )}

        {isMobile && (
          <Card
            sx={{
              mx: 2,
              borderRadius: 2,
              overflow: "hidden",
              opacity: bookingStatus.status === "pending" ? 0.7 : 1,
            }}
            ref={ticketRef}
            id="ticket-card"
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                  {event.name || "Event"}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ color: "#19AEDC" }}
                >
                  {bookingId}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                <Box
                  component="img"
                  src={
                    eventImage ||
                    "https://via.placeholder.com/200x130?text=Event+Image"
                  }
                  alt={event.name || "Event"}
                  sx={{
                    width: 200,
                    height: 130,
                    borderRadius: 1,
                    objectFit: "cover",
                  }}
                  onError={(e) => {
                    e.target.src =
                      "https://via.placeholder.com/200x130?text=Event+Image";
                  }}
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <CalendarTodayIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{formattedDate}</Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <AccessTimeIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">{eventTime}</Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <LocationOnIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">
                    {eventData?.venueDetails?.venueName || event.location || "N/A"}
                  </Typography>
                </Box>

                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}
                >
                  <DirectionsCarIcon sx={{ fontSize: 16 }} />
                  <Typography variant="body2">
                    {ticketTypes} ({totalTickets} ticket{totalTickets !== 1 ? 's' : ''})
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Ticket sent to:
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                  <PhoneIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  <Typography variant="body2">
                    {userProfileData?.phoneNumber ||
                      userProfileData?.phone ||
                      user?.phone ||
                      "N/A"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <EmailIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  <Typography variant="body2">
                    {user?.email || "N/A"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ textAlign: "center", mb: 2 }}>
                <Box sx={{ mb: 1 }} ref={qrRef}>
                  <QRCode
                    value={qrCodeData}
                    size={80}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    includeMargin={true}
                  />
                </Box>
                <Typography variant="body2" sx={{ fontSize: 12 }}>
                  Booked on: {currentDate} at {currentTime}
                </Typography>
              </Box>

              {!financial.isFreeEvent && (
                <Box sx={{ textAlign: "center", mb: 2 }}>
                  <Typography
                    variant="h6"
                    fontWeight="bold"
                    sx={{ color: "#4CAF50" }}
                  >
                    Total: {formatCurrency(financial.totalAmount)}
                  </Typography>
                </Box>
              )}

              {foodNote && (
                <Typography
                  variant="body2"
                  sx={{ textAlign: "center", fontStyle: "italic", color: "#666" }}
                >
                  {foodNote}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}

        {/* Download Button */}
        <Box sx={{ textAlign: "center", mt: 3, mb: 3 }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadTicket}
            disabled={bookingStatus.status === "pending"}
            sx={{
              backgroundColor: "#19AEDC",
              color: "white",
              px: 4,
              py: 1.5,
              fontSize: isMobile ? 14 : 16,
              "&:hover": {
                backgroundColor: "#1591B8",
              },
              "&:disabled": {
                backgroundColor: "#ccc",
              },
            }}
          >
            Download Ticket
          </Button>
        </Box>

        {/* Status Message */}
        {bookingStatus.message && bookingStatus.status !== "error" && (
          <Alert
            severity={bookingStatus.status === "success" ? "success" : "info"}
            sx={{
              maxWidth: isMobile ? "calc(100% - 32px)" : 800,
              mx: "auto",
              mt: 2,
              mb: 2
            }}
          >
            <Typography>{bookingStatus.message}</Typography>
          </Alert>
        )}

        {/* Booking Summary for Non-Free Events */}
        {!financial.isFreeEvent && (
          <Paper
            elevation={1}
            sx={{
              mx: isMobile ? 2 : 0,
              mt: 3,
              p: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
              Booking Summary
            </Typography>

            {ticketSummary.map((ticket, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography variant="body2">
                  {ticket.type} x {ticket.quantity}
                </Typography>
                <Typography variant="body2">
                  {formatCurrency(ticket.price * ticket.quantity)}
                </Typography>
              </Box>
            ))}

            {foodSummary.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                {foodSummary.map((food, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2">
                      {food.name} x {food.quantity}
                    </Typography>
                    <Typography variant="body2">
                      {formatCurrency(food.price * food.quantity)}
                    </Typography>
                  </Box>
                ))}
              </>
            )}

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">Subtotal</Typography>
              <Typography variant="body2">
                {formatCurrency(financial.subtotal)}
              </Typography>
            </Box>

            {financial.discount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="body2">Discount</Typography>
                <Typography variant="body2" sx={{ color: "#4CAF50" }}>
                  -{formatCurrency(financial.discount)}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">Convenience Fee</Typography>
              <Typography variant="body2">
                {formatCurrency(financial.convenienceFee)}
              </Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="body2">GST</Typography>
              <Typography variant="body2">
                {formatCurrency(financial.gst)}
              </Typography>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" fontWeight="bold">
                Total Amount
              </Typography>
              <Typography variant="h6" fontWeight="bold" sx={{ color: "#4CAF50" }}>
                {formatCurrency(financial.totalAmount)}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Navigation Buttons */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            gap: 2,
            mt: 4,
            mb: 4,
            px: isMobile ? 2 : 0,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            sx={{
              borderColor: "#19AEDC",
              color: "#19AEDC",
              px: 3,
              py: 1,
              "&:hover": {
                borderColor: "#1591B8",
                backgroundColor: "rgba(25, 174, 220, 0.1)",
              },
            }}
          >
            Discover More Events
          </Button>

          <Button
            variant="contained"
            onClick={() => navigate("/profile")}
            sx={{
              backgroundColor: "#19AEDC",
              color: "white",
              px: 3,
              py: 1,
              "&:hover": {
                backgroundColor: "#1591B8",
              },
            }}
          >
            View My Bookings
          </Button>
        </Box>

        {/* Important Information */}
        <Paper
          elevation={1}
          sx={{
            mx: isMobile ? 2 : 0,
            p: 2,
            borderRadius: 2,
            backgroundColor: "#f8f9fa",
            mb: 4,
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
            Important Information
          </Typography>

          <Typography variant="body2" sx={{ mb: 1 }}>
            • Please carry a valid ID proof along with this ticket
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Entry is subject to availability and event guidelines
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • This ticket is non-transferable and non-refundable
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Please arrive at least 30 minutes before the event starts
          </Typography>
          <Typography variant="body2">
            • For any queries, contact event support or check your email
          </Typography>
        </Paper>
      </Box>

      <Footer />
    </Box>
  );
};

export default TicketBookedPage;