import React, { useEffect, useState, useRef } from "react";
import { ref, getDownloadURL } from "firebase/storage";
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
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ErrorIcon from "@mui/icons-material/Error";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { auth, db, storage } from "../../firebase_config";

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
  const [ticketIsSaved, setTicketIsSaved] = useState(false);
  const [userProfileData, setUserProfileData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [ticketAvailability, setTicketAvailability] = useState(null);
  const [availabilityUpdated, setAvailabilityUpdated] = useState(false);
  const qrRef = useRef(null);
  const ticketRef = useRef(null);
  const isMobile = useMediaQuery("(max-width:600px)");

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

  const [bookingId] = useState(
    passedBookingId ||
      (() => {
        const timestamp = new Date().getTime().toString(36).slice(-4);
        const randomChars = Math.random()
          .toString(36)
          .substring(2, 6)
          .toUpperCase();
        return `#${randomChars}${timestamp}`;
      })()
  );

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

  // Fetch user profile data
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

  // Fetch event data
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

  // Fetch event image
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
    if (
      event.imageUrl &&
      typeof event.imageUrl === "string" &&
      event.imageUrl.trim() !== ""
    ) {
      setEventImage(event.imageUrl);
      return;
    }
    try {
      if (event.id) {
        const storagePath = `events/${event.id}/banner_174532844693`;
        const storageRef = ref(storage, storagePath); // Line 226: 'ref' is used here
        const url = await getDownloadURL(storageRef); // Line 227: 'getDownloadURL' is used here
        setEventImage(url);
        return;
      }
    } catch (storageError) {
      console.log("Storage path error:", storageError.message);
    }
    setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
  } catch (error) {
    console.error("Error in image fetching process:", error);
    setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
  }
};

  // Check if ticket exists
  const checkExistingTicket = async (ticketID) => {
    try {
      const cleanTicketId = ticketID.replace("#", "");
      const docRef = doc(db, "tickets", cleanTicketId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error("Error checking existing ticket:", error);
      return false;
    }
  };

  // Save ticket to database
  const saveTicketToDatabase = async (currentUser) => {
    if (!currentUser) {
      setBookingStatus({
        status: "error",
        message: "Authentication error. Please log in again.",
      });
      return;
    }

    try {
      setBookingStatus({ status: "pending", message: "Saving your ticket..." });

      const ticketExists = await checkExistingTicket(bookingId);
      if (ticketExists) {
        setTicketIsSaved(true);
        setBookingStatus({
          status: "success",
          message: "Ticket already saved!",
        });
        return;
      }

      const profileData = await fetchUserProfileData(currentUser.uid);
      const userPhone =
        profileData?.phoneNumber ||
        profileData?.phone ||
        currentUser.phoneNumber ||
        "N/A";
      const userEmail = currentUser.email || profileData?.email || "N/A";

      const ticketData = {
        eventName: event.name || "Event",
        eventDate: formattedDate,
        eventTime: eventTime,
        location: event.location || "N/A",
        phone: userPhone,
        email: userEmail,
        vendorId: event.vendorId || null,
        ticketSummary: ticketSummary,
        foodSummary: foodSummary || [],
        financial: financial,
        bookingId: bookingId,
        bookingDate: `${currentDate} ${currentTime}`,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        eventId: event.id || null,
        isPublic: true,
        ownerId: currentUser.uid,
        status: "active",
        checkedIn: false,
        checkedInTime: null,
      };

      const cleanTicketId = bookingId.replace("#", "");
      await setDoc(doc(db, "tickets", cleanTicketId), ticketData);

      if (currentUser.uid) {
        const userTicketRef = doc(
          db,
          "users",
          currentUser.uid,
          "tickets",
          cleanTicketId
        );
        await setDoc(userTicketRef, {
          ticketId: cleanTicketId,
          eventId: event.id || null,
          eventName: event.name || "Event",
          bookingDate: new Date().toISOString(),
          status: "active",
        });
      }

      setTicketIsSaved(true);
      setBookingStatus({
        status: "success",
        message: "Ticket booked successfully!",
      });
    } catch (error) {
      console.error("Error booking ticket:", error);
      setBookingStatus({
        status: "error",
        message: `Failed to save your ticket: ${error.message}. Please try again or contact support.`,
      });
    }
  };

  // Update ticket availability
  const updateTicketAvailability = async (eventId, bookedTickets) => {
    try {
      if (!eventId || !bookedTickets || bookedTickets.length === 0) {
        console.log("No event ID or booked tickets to update");
        return;
      }

      const eventDocRef = doc(db, "events", eventId);
      await updatePricingArray(eventId, bookedTickets);

      const totalTicketsBooked = bookedTickets.reduce(
        (sum, ticket) => sum + ticket.quantity,
        0
      );

      await updateDoc(eventDocRef, {
        ticketBookedCount: increment(totalTicketsBooked),
        totalAvailableTickets: increment(-totalTicketsBooked),
      });

      setAvailabilityUpdated(true);
    } catch (error) {
      console.error("Error updating ticket availability:", error);
      throw error;
    }
  };

  // Update pricing array
  const updatePricingArray = async (eventId, bookedTickets) => {
    try {
      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const pricing = [...(eventData.pricing || [])];

        bookedTickets.forEach((bookedTicket) => {
          const ticketIndex = pricing.findIndex(
            (p) => p.ticketType === bookedTicket.type
          );
          if (ticketIndex !== -1) {
            pricing[ticketIndex].booked =
              (pricing[ticketIndex].booked || 0) + bookedTicket.quantity;
            const totalSeats = pricing[ticketIndex].seats || 0;
            const totalBooked = pricing[ticketIndex].booked;
            pricing[ticketIndex].available = Math.max(0, totalSeats - totalBooked);
          }
        });

        await updateDoc(eventDocRef, { pricing: pricing });
      }
    } catch (error) {
      console.error("Error updating pricing array:", error);
      throw error;
    }
  };

  // Fetch ticket availability
  const fetchTicketAvailability = async (eventId) => {
    try {
      if (!eventId) return;

      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const pricing = eventData.pricing || [];

        const availability = pricing.map((ticket) => ({
          ticketType: ticket.ticketType,
          totalSeats: ticket.seats,
          bookedSeats: ticket.booked || 0,
          availableSeats:
            ticket.available !== undefined
              ? ticket.available
              : ticket.seats - (ticket.booked || 0),
          price: ticket.price,
          features: ticket.features,
          isSoldOut:
            (ticket.available !== undefined
              ? ticket.available
              : ticket.seats - (ticket.booked || 0)) <= 0,
        }));

        const totalSeats = pricing.reduce((sum, p) => sum + p.seats, 0);
        const totalBooked = eventData.ticketBookedCount || 0;
        const totalAvailable =
          eventData.totalAvailableTickets !== undefined
            ? eventData.totalAvailableTickets
            : totalSeats - totalBooked;

        setTicketAvailability({
          totalSeats,
          totalBookedTickets: totalBooked,
          totalAvailableTickets: totalAvailable,
          ticketTypes: availability,
          isEventSoldOut: totalAvailable <= 0,
        });
      }
    } catch (error) {
      console.error("Error fetching ticket availability:", error);
    }
  };

  // Initial setup
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
            phone:
              profileData?.phoneNumber ||
              profileData?.phone ||
              currentUser.phoneNumber ||
              "N/A",
          });

          const updatedEventData = await fetchEventData();
          await fetchEventImage(updatedEventData);
          await fetchTicketAvailability(
            updatedEventData?.eventId || updatedEventData?.id || event.id
          );
          await saveTicketToDatabase(currentUser);
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
      if (
        bookingStatus.status === "success" &&
        ticketSummary.length > 0 &&
        !availabilityUpdated
      ) {
        try {
          const eventId = eventData?.eventId || eventData?.id || event.id;
          if (eventId) {
            await updateTicketAvailability(eventId, ticketSummary);
            setTimeout(async () => {
              await fetchTicketAvailability(eventId);
            }, 1000);
          }
        } catch (error) {
          console.error(
            "Error updating ticket availability after booking:",
            error
          );
        }
      }
    };

    handleBookingSuccess();
  }, [bookingStatus.status, eventData, availabilityUpdated]);

  // Handle ticket download
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
              imgCanvas.width =
                parseInt(computedStyle.width) || img.offsetWidth;
              imgCanvas.height =
                parseInt(computedStyle.height) || img.offsetHeight;
              ctx.drawImage(
                preloadedImage,
                0,
                0,
                imgCanvas.width,
                imgCanvas.height
              );
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
      alert(
        "There was an error downloading your ticket. Please try taking a screenshot instead, or contact support if the issue persists."
      );
      setBookingStatus({
        status: bookingStatus.status,
        message:
          bookingStatus.status === "success"
            ? "Ticket booked successfully!"
            : bookingStatus.message,
      });
    }
  };

  const handleRetry = () => {
    if (auth.currentUser) {
      saveTicketToDatabase(auth.currentUser);
    } else {
      setBookingStatus({
        status: "error",
        message: "No user authenticated. Please log in again.",
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

      {/* Status alerts */}
      {bookingStatus.status === "pending" && (
        <Alert severity="info" sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}>
          <Typography>Saving your ticket. Please wait...</Typography>
        </Alert>
      )}

      {bookingStatus.status === "error" && (
        <Alert
          severity="error"
          sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry}>
              Retry
            </Button>
          }
        >
          <Typography>{bookingStatus.message}</Typography>
        </Alert>
      )}

      {/* Success Header */}
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
          {ticketAvailability && (
            <Typography
              variant="body2"
              sx={{ mt: 1, fontSize: isMobile ? 12 : 14, color: "#666" }}
            >
              Tickets remaining: {ticketAvailability.totalAvailableTickets} /{" "}
              {ticketAvailability.totalSeats}
            </Typography>
          )}
        </Box>
      )}

      {/* Error Header */}
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

      {/* Ticket Card */}
      <Box
        sx={{
          maxWidth: isMobile ? "100%" : 1000,
          mx: "auto",
          position: "relative",
        }}
      >
        {/* Desktop Ticket Notch */}
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

        {/* Desktop Ticket Body */}
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
              {/* Event Image */}
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

              {/* Event Details */}
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
                    {eventData?.venueDetails?.venueName ||
                      event.location ||
                      "N/A"}
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
                  <Typography variant="body2">{user?.email}</Typography>
                </Box>
              </Box>

              {/* Price Info and QR Code */}
              <Box sx={{ width: "34%", p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mb: 3,
                  }}
                >
                  <div ref={qrRef}>
                    <QRCode
                      value={qrCodeData}
                      size={120}
                      level="H"
                      includeMargin={true}
                      id="qrcode"
                    />
                  </div>
                  <Typography
                    variant="caption"
                    sx={{
                      textAlign: "center",
                      display: "block",
                      color: "#666",
                      mb: 1,
                      mt: 1,
                    }}
                  >
                    Present this QR code at the venue
                    <br />
                    entrance for validation
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    size="small"
                    sx={{
                      backgroundColor: "#19AEDC",
                      color: "#fff",
                      borderRadius: 4,
                      textTransform: "none",
                      px: 2,
                      py: 0.5,
                      fontSize: 14,
                    }}
                    onClick={handleDownloadTicket}
                    disabled={bookingStatus.status === "pending"}
                  >
                    Download Ticket
                  </Button>
                </Box>

                <Box>
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
                        {ticket.type || "Ticket"} ({ticket.quantity || 0}x)
                      </Typography>
                      <Typography fontWeight="bold">
                        {(ticket.price || 0) === 0
                          ? "FREE"
                          : formatCurrency(
                              (ticket.price || 0) * (ticket.quantity || 0)
                            )}
                      </Typography>
                    </Box>
                  ))}
                  {foodSummary && foodSummary.length > 0 && (
                    <>
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
                            {food.name || "Food Item"} ({food.quantity || 0}x)
                          </Typography>
                          <Typography fontWeight="bold">
                            {formatCurrency(
                              (food.price || 0) * (food.quantity || 0)
                            )}
                          </Typography>
                        </Box>
                      ))}
                    </>
                  )}
                  {!financial.isFreeEvent && (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2">Convenience fee</Typography>
                        <Typography fontWeight="bold">
                          {formatCurrency(financial.convenienceFee || 0)}
                        </Typography>
                      </Box>
                      {(financial.discount || 0) > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 0.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: "#19AEDC" }}
                          >
                            Discount
                          </Typography>
                          <Typography
                            fontWeight="bold"
                            sx={{ color: "#19AEDC" }}
                          >
                            -{formatCurrency(financial.discount || 0)}
                          </Typography>
                        </Box>
                      )}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2">GST (18%)</Typography>
                        <Typography fontWeight="bold">
                          {formatCurrency(financial.gst || 0)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="caption"
                        sx={{ color: "#666", display: "block", mb: 1 }}
                      >
                        Incl. of taxes
                      </Typography>
                    </>
                  )}
                  <Divider sx={{ my: 1 }} />
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Typography variant="body1" fontWeight="bold">
                      Total Amount
                    </Typography>
                    <Typography
                      variant="body1"
                      fontWeight="bold"
                      sx={{
                        color: financial.isFreeEvent ? "#19AEDC" : "inherit",
                      }}
                    >
                      {financial.isFreeEvent
                        ? "FREE"
                        : formatCurrency(financial.totalAmount || 0)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Bottom Notch */}
            <Box
              sx={{
                position: "absolute",
                width: 70,
                height: 30,
                backgroundColor: "#f5f5f5",
                borderRadius: "30px 30px 0 0",
                bottom: 0,
                left: "37%",
                transform: "translateX(-50%)",
                zIndex: 1,
              }}
            />

            {/* Booking Info Footer */}
            <Box
              sx={{
                backgroundColor: "#ffff",
                p: 2,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderTop: "1px solid #eee",
              }}
            >
              <Box>
                <Typography variant="caption" sx={{ color: "#777" }}>
                  Booking Date & Time
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {currentDate} {currentTime}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#777" }}>
                  Booking ID
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {bookingId}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: "#777" }}>
                  Booking Status
                </Typography>
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  sx={{ color: ticketIsSaved ? "#4CAF50" : "#f57c00" }}
                >
                  {ticketIsSaved ? "Confirmed" : "Pending Confirmation"}
                </Typography>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Mobile Ticket Notches */}
        {isMobile && (
          <>
            <Box
              sx={{
                position: "absolute",
                width: 40,
                height: 50,
                backgroundColor: "#f5f5f5",
                borderRadius: "0 30px 30px 0px",
                top: "30%",
                left: "10%",
                transform: "translateX(-60%)",
                zIndex: 1,
              }}
            />
            <Box
              sx={{
                position: "absolute",
                width: 40,
                height: 50,
                backgroundColor: "#f5f5f5",
                borderRadius: "30px 0px 0px 30px",
                top: "30%",
                left: "10%",
                transform: "translateX(750%)",
                zIndex: 1,
              }}
            />
          </>
        )}

        {/* Mobile Ticket Body */}
        {isMobile && (
          <Box sx={{ width: "90%", mx: "auto", mt: 3 }}>
            <Card
              sx={{
                width: "100%",
                borderRadius: 6,
                p: 0,
                overflow: "hidden",
              }}
              ref={ticketRef}
            >
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: "flex", gap: 3, mb: 3, p: 1 }}>
                  <Box
                    component="img"
                    src={
                      eventImage ||
                      "https://via.placeholder.com/270x180?text=Event+Image"
                    }
                    alt={event.name || "Event"}
                    sx={{
                      width: "50%",
                      height: 170,
                      borderRadius: 1,
                      objectFit: "cover",
                      border: "1px solid",
                      borderColor: "black",
                    }}
                    onError={(e) => {
                      e.target.src =
                        "https://via.placeholder.com/270x180?text=Event+Image";
                    }}
                  />
                  <Box>
                    <Typography
                      sx={{
                        fontFamily: "'Poppins', Helvetica",
                        fontWeight: 600,
                        fontSize: 14,
                        mb: 1,
                      }}
                    >
                      {event.name || "Event"}
                    </Typography>

                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CalendarTodayIcon
                        sx={{ fontSize: 11, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Poppins', Helvetica",
                          color: "text.secondary",
                          fontSize: 11,
                          pl: 0.2,
                        }}
                      >
                        {formattedDate}
                      </Typography>
                      <Divider
                        orientation="vertical"
                        sx={{ mx: 1, height: 16 }}
                      />
                      <AccessTimeIcon
                        sx={{ fontSize: 11, color: "text.secondary" }}
                      />
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "'Poppins', Helvetica",
                          color: "text.secondary",
                          fontSize: 11,
                          pl: 0.2,
                        }}
                      >
                        {eventTime}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                      <LocationOnIcon
                        sx={{ fontSize: 11, color: "text.secondary" }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "'Poppins', Helvetica",
                          color: "#adaebc",
                          fontSize: 11,
                          pl: 0.2,
                        }}
                      >
                        {eventData?.venueDetails?.venueName ||
                          event.location ||
                          "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                <Divider sx={{ my: 2, mb: 4 }} />

                <Box
                  sx={{ bgcolor: "#d1d5db4c", p: 1, borderRadius: 2, mt: 2 }}
                >
                  <Box sx={{ display: "flex" }}>
                    <Box
                      sx={{
                        bgcolor: "white",
                        p: 1,
                        width: 96,
                        height: 100,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <div ref={qrRef}>
                        <QRCode
                          value={qrCodeData}
                          size={120}
                          level="H"
                          includeMargin={true}
                          id="qrcode"
                        />
                      </div>
                    </Box>

                    <Box
                      sx={{
                        ml: 2,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        py: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "'Albert Sans', Helvetica",
                          color: "text.secondary",
                          fontSize: 12,
                        }}
                      >
                        {totalTickets} Tickets
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Albert Sans', Helvetica",
                          color: "text.secondary",
                          fontSize: 13,
                        }}
                      >
                        {ticketTypes}
                      </Typography>
                      <Box sx={{ display: "flex", mt: 1 }}>
                        <Typography
                          sx={{
                            fontFamily: "'Albert Sans', Helvetica",
                            fontWeight: 600,
                            fontSize: 10,
                          }}
                        >
                          Booking ID :
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "'Albert Sans', Helvetica",
                            fontWeight: 600,
                            fontSize: 10,
                            ml: 0.5,
                          }}
                        >
                          {bookingId}
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: "'Albert Sans', Helvetica",
                          color: "#6f7287",
                          fontSize: 10,
                        }}
                      >
                        {foodNote}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Poppins', Helvetica",
                        fontSize: 9,
                        textAlign: "center",
                      }}
                    >
                      Present this QR code at
                      <br />
                      the venue for validation
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<DownloadIcon sx={{ fontSize: 12 }} />}
                      sx={{
                        height: 21,
                        bgcolor: "#19aedc",
                        borderRadius: 4,
                        fontSize: 8,
                        fontFamily: "'Poppins', Helvetica",
                        fontWeight: 600,
                        textTransform: "none",
                        mr: 5,
                      }}
                      onClick={handleDownloadTicket}
                      disabled={bookingStatus.status === "pending"}
                    >
                      Download Ticket
                    </Button>
                  </Box>
                </Box>

                <Box sx={{ mt: 2.5 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: "'Albert Sans', Helvetica",
                          fontWeight: 300,
                          fontSize: 12,
                        }}
                      >
                        Price per Ticket
                      </Typography>
                      {ticketSummary?.map((ticket, idx) => (
                        <Typography
                          key={idx}
                          sx={{
                            fontFamily: "'Albert Sans', Helvetica",
                            fontWeight: 200,
                            fontSize: 10,
                            ml: 1,
                          }}
                        >
                          {ticket.type} x {ticket.quantity}
                        </Typography>
                      ))}
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "'Albert Sans', Helvetica",
                        fontWeight: 300,
                        fontSize: 12,
                      }}
                    >
                      ₹
                      {ticketSummary?.reduce(
                        (total, item) => total + (item.subtotal || 0),
                        0
                      )}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Albert Sans', Helvetica",
                        fontWeight: 300,
                        fontSize: 12,
                      }}
                    >
                      Discount
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "'Albert Sans', Helvetica",
                        fontWeight: 300,
                        fontSize: 12,
                      }}
                    >
                      ₹{financial?.discount || 0}
                    </Typography>
                  </Box>

                  {foodSummary?.length > 0 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontFamily: "'Albert Sans', Helvetica",
                            fontWeight: 300,
                            fontSize: 12,
                          }}
                        >
                          Grab a bite fees
                        </Typography>
                        {foodSummary.map((food, idx) => (
                          <Typography
                            key={idx}
                            sx={{
                              fontFamily: "'Albert Sans', Helvetica",
                              fontWeight: 200,
                              fontSize: 10,
                              ml: 1,
                            }}
                          >
                            {food.name} x {food.quantity}
                          </Typography>
                        ))}
                      </Box>
                      <Typography
                        sx={{
                          fontFamily: "'Albert Sans', Helvetica",
                          fontWeight: 300,
                          fontSize: 12,
                        }}
                      >
                        ₹
                        {foodSummary.reduce(
                          (total, item) => total + item.price * item.quantity,
                          0
                        )}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontFamily: "'Albert Sans', Helvetica",
                          fontWeight: 300,
                          fontSize: 12,
                        }}
                      >
                        Convenience fees
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Poppins', Helvetica",
                          fontWeight: 300,
                          fontSize: 9,
                          color: "#4b5563e6",
                        }}
                      >
                        Incl. of taxes
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "'Albert Sans', Helvetica",
                        fontWeight: 300,
                        fontSize: 12,
                      }}
                    >
                      ₹{financial?.convenienceFee || 0}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      bgcolor: "#d1d5db4c",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 2,
                      mt: 2,
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "'Albert Sans', Helvetica",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                    >
                      Total Amount
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "'Albert Sans', Helvetica",
                        fontWeight: 500,
                        fontSize: 13,
                      }}
                    >
                      ₹{financial.totalAmount}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}
      </Box>

      {/* Action Buttons */}
      <Box
        sx={{
          width: isMobile ? "90%" : "100%",
          mx: "auto",
          display: "flex",
          justifyContent: "center",
          mt: 4,
          mb: 5,
          gap: !isMobile ? 3 : 3,
        }}
      >
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#19AEDC",
            borderRadius: 2,
            px: !isMobile ? 4 : 2,
            py: 1,
            fontSize: !isMobile ? 16 : 10,
            "&:hover": { backgroundColor: "#0e8eb8" },
          }}
          onClick={() => navigate("/mytickets")}
        >
          View All My Tickets
        </Button>
        <Button
          variant="outlined"
          sx={{
            borderColor: "#19AEDC",
            color: "#19AEDC",
            borderRadius: 2,
            px: !isMobile ? 4 : 2,
            py: 1,
            fontSize: !isMobile ? 16 : 10,
            "&:hover": { borderColor: "#0e8eb8", color: "#0e8eb8" },
          }}
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </Box>

      {/* Important Information */}
      <Box
        sx={{
          width: isMobile ? "90%" : "70%",
          mx: "auto",
          mb: isMobile ? 9 : 5,
        }}
      >
        <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
            Important Information
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Please arrive at least 30 minutes before the event starts.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • Keep this ticket handy - you'll need to show it at the entrance.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • The QR code will be scanned at entry for verification.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            • This ticket cannot be transferred or resold.
          </Typography>
          <Typography variant="body2">
            • For any queries, please contact our support team at
            support@eventify.com
          </Typography>
        </Paper>
      </Box>

      {!isMobile && <Footer />}
    </Box>
  );
};

export default TicketBookedPage;