import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, Button, Divider, Paper, Alert, CircularProgress } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";
import DownloadIcon from "@mui/icons-material/Download";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../Header/MainHeaderWOS";
import Footer from "../Footer/Footer.js";
import { doc, setDoc, getDoc, collection, getDocs, query, where, limit } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { ref, getDownloadURL } from "firebase/storage";
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ErrorIcon from "@mui/icons-material/Error";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Import Firebase from your existing configuration file
import { auth, db, storage } from "../../firebase_config";

// Format date and time from ISO string to IST
const formatEventDateTime = (isoDateString) => {
  if (!isoDateString) return { formattedDate: "N/A", eventTime: "N/A" };

  try {
    // Create Date object from ISO string
    const eventDateTime = new Date(isoDateString);

    // Format date in IST (UTC+5:30)
    const formattedDate = eventDateTime.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'Asia/Kolkata' // IST timezone
    });

    // Format time in IST (UTC+5:30)
    const eventTime = eventDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata' // IST timezone
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
    status: "pending", // pending, success, error
    message: ""
  });
  const [eventImage, setEventImage] = useState(null);
  const [ticketIsSaved, setTicketIsSaved] = useState(false);
  const qrRef = useRef(null);
  const ticketRef = useRef(null);
  const [userProfileData, setUserProfileData] = useState(null);

  // Extract data from location state (passed from PaymentPortalPage or RazorPayPage)
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
      isFreeEvent: true
    }
  } = location.state || {};

  // Generate a unique booking ID based on timestamp and random characters
  const [bookingId] = useState(() => {
    const timestamp = new Date().getTime().toString(36).slice(-4);
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `#${randomChars}${timestamp}`;
  });

  // Get formatted date and time using the new function
  const { formattedDate, eventTime } = event.eventDate
    ? formatEventDateTime(event.eventDate)
    : event.date
      ? formatEventDateTime(event.date)  // Fallback to event.date if available
      : {
          formattedDate: event.date ? new Date(event.date).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          }) : "N/A",
          eventTime: event.time || "N/A"
        };

  // Calculate total number of tickets (all ticket types)
  const totalTickets = ticketSummary.reduce((sum, ticket) => sum + ticket.quantity, 0);

  // Format currency values
  const formatCurrency = (value) => {
    return `₹${value.toFixed(2)}`;
  };

  // Generate current date and time for booking timestamp
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  // MODIFIED: QR code now simply contains the booking ID for easy scanning
  const qrCodeData = bookingId;

  // Fetch user profile data including phone number
  const fetchUserProfileData = async (userId) => {
    try {
      console.log("Fetching user profile data for:", userId);
      if (!userId) return;

      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        console.log("User data retrieved:", userData);
        setUserProfileData(userData);
        return userData;
      } else {
        console.log("No user document found!");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Improved function to fetch event image from Firebase Storage
  const fetchEventImage = async () => {
    try {
      console.log("Fetching event image for:", event.name, "with ID:", event.id);

      // Clear any previous errors
      setEventImage(null);

      // DIRECT APPROACH: Try to get bannerImages from the event document first
      if (event.id) {
        const eventDocRef = doc(db, "events", event.id);
        const eventDoc = await getDoc(eventDocRef);

        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          console.log("Event data retrieved:", eventData);

          // Check for bannerImages array in the retrieved document (based on your Firebase screenshot)
          if (Array.isArray(eventData.bannerImages) && eventData.bannerImages.length > 0) {
            console.log("Found bannerImages array:", eventData.bannerImages);
            const imageUrl = eventData.bannerImages[0]; // Get the first banner image
            console.log("Setting event image to:", imageUrl);
            setEventImage(imageUrl);
            return;
          }

          // Fallbacks - check other possible image fields
          const possibleImageFields = ['imageUrl', 'bannerImage', 'thumbnail', 'image'];
          for (const field of possibleImageFields) {
            if (eventData[field]) {
              console.log(`Found image in field ${field}:`, eventData[field]);
              setEventImage(eventData[field]);
              return;
            }
          }

          // Check for images array
          if (Array.isArray(eventData.images) && eventData.images.length > 0) {
            console.log("Found images array:", eventData.images[0]);
            setEventImage(eventData.images[0]);
            return;
          }

          // Check for eventImages array
          if (Array.isArray(eventData.eventImages) && eventData.eventImages.length > 0) {
            console.log("Found eventImages array:", eventData.eventImages[0]);
            setEventImage(eventData.eventImages[0]);
            return;
          }
        }
      }

      // If we've come this far, try using provided imageUrl
      if (event.imageUrl && typeof event.imageUrl === 'string' && event.imageUrl.trim() !== '') {
        console.log("Using provided image URL:", event.imageUrl);
        setEventImage(event.imageUrl);
        return;
      }

      // STORAGE PATH APPROACH: Try using storage path if available
      if (event.id) {
        try {
          // Construct path based on your Firebase screenshot structure
          const storagePath = `events/${event.id}/banner_174532844693`;
          console.log("Trying storage path:", storagePath);
          const storageRef = ref(storage, storagePath);
          const url = await getDownloadURL(storageRef);
          console.log("Successfully fetched from storage path:", url);
          setEventImage(url);
          return;
        } catch (storageError) {
          console.log("Storage path error:", storageError.message);
        }
      }

      // If all approaches failed, use placeholder
      console.log("All approaches failed, using placeholder image");
      setEventImage("https://via.placeholder.com/270x180?text=Event+Image");

    } catch (error) {
      console.error("Error in image fetching process:", error);
      setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
    }
  };

  // Check if ticket already exists in Firestore - more robust approach
  const checkExistingTicket = async (ticketID) => {
    try {
      const cleanTicketId = ticketID.replace("#", "");
      console.log("Checking if ticket exists with ID:", cleanTicketId);

      // Check in main tickets collection
      const docRef = doc(db, "tickets", cleanTicketId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log("Ticket found in main tickets collection");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking existing ticket:", error);
      return false;
    }
  };

  // Function to save ticket to Firestore - fixed for permissions
  const saveTicketToDatabase = async (currentUser) => {
    if (!currentUser) {
      console.error("No authenticated user found");
      setBookingStatus({
        status: "error",
        message: "Authentication error. Please log in again."
      });
      return;
    }

    try {
      setBookingStatus({ status: "pending", message: "Saving your ticket..." });

      // Check if ticket already exists to avoid duplicate writes
      const ticketExists = await checkExistingTicket(bookingId);
      if (ticketExists) {
        console.log("Ticket already exists in Firestore!");
        setTicketIsSaved(true);
        setBookingStatus({ status: "success", message: "Ticket already saved!" });
        return;
      }

      // Fetch user profile data to get the phone number
      const profileData = await fetchUserProfileData(currentUser.uid);

      // Get user's phone number from profile data or auth
      const userPhone = profileData?.phoneNumber ||
                       profileData?.phone ||
                       currentUser.phoneNumber ||
                       "N/A";

      console.log("Using phone number:", userPhone);

      // Email from the user object or profile or provide a fallback
      const userEmail = currentUser.email ||
                       profileData?.email ||
                       "N/A";

      // Create ticket data object with eventId
      const ticketData = {
        eventName: event.name || "Event",
        eventDate: formattedDate,
        eventTime: eventTime,
        location: event.location || "N/A",
        phone: userPhone,
        email: userEmail,
        ticketSummary: ticketSummary,
        foodSummary: foodSummary || [],
        financial: financial,
        bookingId: bookingId,
        bookingDate: `${currentDate} ${currentTime}`,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        // Store eventId for future reference
        eventId: event.id || null,
        // Add public field to allow reading by the ticket owner
        isPublic: true,
        // Store owner ID to use in security rules
        ownerId: currentUser.uid,
        // Additional ticket details
        status: "active",
        checkedIn: false,
        checkedInTime: null
      };

      // Save to main tickets collection with clean ID (without # prefix)
      const cleanTicketId = bookingId.replace("#", "");
      console.log("Saving ticket with clean ID:", cleanTicketId);

      try {
        await setDoc(doc(db, "tickets", cleanTicketId), ticketData);
        console.log("Ticket saved to main collection successfully!");
      } catch (error) {
        console.error("Error saving to main tickets collection:", error);
        throw new Error(`Failed to save to tickets collection: ${error.message}`);
      }

      // Also save in user's tickets subcollection for easy retrieval
      try {
        if (currentUser.uid) {
          const userTicketRef = doc(db, "users", currentUser.uid, "tickets", cleanTicketId);
          await setDoc(userTicketRef, {
            ticketId: cleanTicketId,
            eventId: event.id || null,
            eventName: event.name || "Event",
            bookingDate: new Date().toISOString(),
            status: "active"
          });
          console.log("Ticket saved to user's tickets subcollection!");
        }
      } catch (userTicketError) {
        console.error("Error saving to user's tickets subcollection:", userTicketError);
        // Don't throw here, as the main ticket was saved
      }

      console.log("Ticket booked successfully and saved to Firestore!");
      setTicketIsSaved(true);
      setBookingStatus({ status: "success", message: "Ticket booked successfully!" });
    } catch (error) {
      console.error("Error booking ticket:", error);
      setBookingStatus({
        status: "error",
        message: `Failed to save your ticket: ${error.message}. Please try again or contact support.`
      });
    }
  };

  useEffect(() => {
    const handleInitialSetup = async () => {
      try {
        setIsLoading(true);

        // Check for authenticated user
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
          if (currentUser) {
            try {
              console.log("User authenticated:", currentUser.uid);

              // Fetch user profile data
              const profileData = await fetchUserProfileData(currentUser.uid);

              // Set user state with proper data
              setUser({
                id: currentUser.uid,
                email: currentUser.email || "N/A",
                phone: profileData?.phoneNumber || profileData?.phone || currentUser.phoneNumber || "N/A"
              });

              // Fetch event image first (in parallel)
              fetchEventImage();

              // Then save ticket to database
              await saveTicketToDatabase(currentUser);
            } catch (error) {
              console.error("Error in user setup:", error);
              setBookingStatus({
                status: "error",
                message: `Error setting up user data: ${error.message}`
              });
            } finally {
              setIsLoading(false);
            }
          } else {
            // If no user is authenticated, redirect to login
            console.log("No authenticated user, redirecting to login");
            alert("Please sign in to book tickets");
            navigate("/login", {
              state: {
                returnPath: "/ticketbookedpage",
                ticketData: location.state
              }
            });
            setIsLoading(false);
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Fatal error in initial setup:", error);
        setBookingStatus({
          status: "error",
          message: "An unexpected error occurred. Please try again."
        });
        setIsLoading(false);
      }
    };

    handleInitialSetup();
  }, []);

  // Implementation for downloading the ticket as PDF
  const handleDownloadTicket = () => {
    if (!ticketRef.current) {
      alert("Cannot find the ticket element to download.");
      return;
    }

    try {
      // Show loading or progress message
      setBookingStatus({
        status: bookingStatus.status,
        message: "Preparing your ticket for download..."
      });

      // Use html2canvas to capture the ticket as an image
      html2canvas(ticketRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });

        // Calculate dimensions for PDF
        const imgWidth = 280;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Add image to PDF, centered
        pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);

        // Save PDF
        pdf.save(`ticket-${bookingId.replace('#', '')}.pdf`);

        // Show success message
        setBookingStatus({
          status: bookingStatus.status,
          message: "Ticket downloaded successfully!"
        });
      });
    } catch (error) {
      console.error("Error with download function:", error);
      alert("There was an error with the download feature. Please try taking a screenshot of your ticket instead.");
    }
  };

  // Fallback download function if html2canvas/jsPDF are not available
  const fallbackDownload = () => {
    try {
      alert("Ticket download initiated. In a production environment, this would save your ticket as a PDF file. For now, please take a screenshot of your ticket.");
      console.log("Download ticket feature triggered");
    } catch (error) {
      console.error("Error with download function:", error);
      alert("There was an error with the download feature. Please try taking a screenshot of your ticket instead.");
    }
  };

  const handleRetry = () => {
    if (auth.currentUser) {
      saveTicketToDatabase(auth.currentUser);
    } else {
      setBookingStatus({ status: "error", message: "No user authenticated. Please log in again." });
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress sx={{ color: "#19AEDC", mb: 2 }} />
          <Typography variant="h6">Loading your ticket...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
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

      {/* Success Header - Only show if booking was successful */}
      {bookingStatus.status === "success" && (
        <Box sx={{ textAlign: "center", mt: 5, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 1 }}>
            <CheckCircleIcon sx={{
              color: "white",
              fontSize: 28,
              backgroundColor: "#4CAF50",
              borderRadius: "50%",
              p: 0.8
            }} />
          </Box>
          <Typography variant="h5" fontWeight="bold">
            Ticket Booked Successfully, Pal!
          </Typography>
          <Typography variant="body1" sx={{ mt: 0.5 }}>
            Get ready for an amazing experience! 🎉
          </Typography>
        </Box>
      )}

      {/* Error Header - Show if booking failed */}
      {bookingStatus.status === "error" && (
        <Box sx={{ textAlign: "center", mt: 5, mb: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mb: 1 }}>
            <ErrorIcon sx={{
              color: "white",
              fontSize: 28,
              backgroundColor: "#f44336",
              borderRadius: "50%",
              p: 0.8
            }} />
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
      <Box sx={{
        maxWidth: 1000,
        mx: "auto",
        position: "relative",
    
      }}>
        {/* Ticket top notch */}
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

        {/* Ticket body */}
        <Paper
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            position: "relative",
            opacity: bookingStatus.status === "pending" ? 0.7 : 1,
            boxShadow:0,
          }}
          ref={ticketRef}
          id="ticket-card"
        >
          <Box sx={{ display: "flex" }}>
            {/* Left section - Event image */}
            <Box sx={{
              width: "35%",
              pt: 2,
              pb: 2,
              pl: 5,
              pr: 8,
              borderRight: "1px dashed #ddd",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Box
                component="img"
                src={eventImage || "https://via.placeholder.com/270x180?text=Event+Image"}
                alt={event.name || "Event"}
                sx={{
                  width: "100%",
                  height: "auto",
                  maxWidth: 270,
                  borderRadius: 1,
                  objectFit: "cover",
                  pr: 5,
                }}
                onError={(e) => {
                  console.error("Image failed to load:", e);
                  e.target.src = "https://via.placeholder.com/270x180?text=Event+Image";
                }}
              />
            </Box>

            {/* Middle - Event Details */}
            <Box sx={{ width: "35%", p: 2, borderRight: "1px dashed #ddd", ml: 5 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ borderBottom: "1px solid #000", pb: 1, mb: 2 }}>
                {event.name || "Event"}
              </Typography>

              <Box mt={1} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CalendarTodayIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">
                  {formattedDate}
                </Typography>
              </Box>

              <Box mt={1} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">
                  {eventTime}
                </Typography>
              </Box>

              <Box mt={1} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <LocationOnIcon sx={{ fontSize: 18 }} />
                <Typography variant="body2">
                  {event.location || "N/A"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Typography variant="body2">Number of Tickets: {totalTickets}</Typography>
                {ticketSummary.length > 0 && (
                  <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
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
                  {userProfileData?.phoneNumber || userProfileData?.phone || user?.phone || "N/A"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2">{user?.email}</Typography>
              </Box>
            </Box>

            {/* Right - Price info and QR code */}
            <Box sx={{ width: "34%", p: 2 }}>
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
                {/* MODIFIED: QR Code implementation with just the booking ID */}
                <div ref={qrRef}>
                  <QRCode
                    value={qrCodeData}
                    size={120}
                    level="H"
                    includeMargin={true}
                    id="qrcode"
                  />
                </div>
                <Typography variant="caption" sx={{ textAlign: "center", display: "block", color: "#666", mb: 1, mt: 1 }}>
                  Present this QR code at the venue<br />entrance for validation
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
                    fontSize: 14
                  }}
                  onClick={typeof html2canvas !== 'undefined' ? handleDownloadTicket : fallbackDownload}
                  disabled={bookingStatus.status === "pending"}
                >
                  Download Ticket
                </Button>
              </Box>

              <Box>
                {/* Display ticket prices */}
                {ticketSummary.map((ticket, index) => (
                  <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                    <Typography variant="body2">
                      {ticket.type} ({ticket.quantity}x)
                    </Typography>
                    <Typography fontWeight="bold">
                      {ticket.price === 0 ? "FREE" : formatCurrency(ticket.price * ticket.quantity)}
                    </Typography>
                  </Box>
                ))}

                {/* Food items */}
                {foodSummary && foodSummary.length > 0 && (
                  <>
                    {foodSummary.map((food, index) => (
                      <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2">
                          {food.name} ({food.quantity}x)
                        </Typography>
                        <Typography fontWeight="bold">
                          {formatCurrency(food.price * food.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </>
                )}

                {/* Only show these for paid events */}
                {!financial.isFreeEvent && (
                  <>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2">Convenience fee</Typography>
                      <Typography fontWeight="bold">{formatCurrency(financial.convenienceFee)}</Typography>
                    </Box>

                    {financial.discount > 0 && (
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                        <Typography variant="body2" sx={{ color: "#19AEDC" }}>Discount</Typography>
                        <Typography fontWeight="bold" sx={{ color: "#19AEDC" }}>
                          -{formatCurrency(financial.discount)}
                        </Typography>
                      </Box>
                    )}

                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2">GST (18%)</Typography>
                      <Typography fontWeight="bold">{formatCurrency(financial.gst)}</Typography>
                    </Box>

                    <Typography variant="caption" sx={{ color: "#666", display: "block", mb: 1 }}>
                      Incl. of taxes
                    </Typography>
                  </>
                )}

                <Divider sx={{ my: 1 }} />

                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
                  <Typography variant="body1" fontWeight="bold">Total Amount</Typography>
                  <Typography variant="body1" fontWeight="bold" sx={{ color: financial.isFreeEvent ? "#19AEDC" : "inherit" }}>
                    {financial.isFreeEvent ? "FREE" : formatCurrency(financial.totalAmount)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Bottom notch */}
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
              zIndex: 1
            }}
          />

          {/* Booking Info footer */}
          <Box sx={{
            backgroundColor: "#ffff",
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #eee"
          }}>
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
              <Typography variant="body2" fontWeight="medium" sx={{ color: ticketIsSaved ? "#4CAF50" : "#f57c00" }}>
                {ticketIsSaved ? "Confirmed" : "Pending Confirmation"}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Action buttons */}
      <Box sx={{ maxWidth: 1000, mx: "auto", display: "flex", justifyContent: "center", mt: 4, mb: 5, gap: 2 }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#19AEDC",
            borderRadius: 2,
            px: 4,
            py: 1,
            "&:hover": { backgroundColor: "#0e8eb8" }
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
            px: 4,
            py: 1,
            "&:hover": { borderColor: "#0e8eb8", color: "#0e8eb8" }
          }}
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>
      </Box>

      {/* Important Information */}
      <Box sx={{ maxWidth: 1000, mx: "auto", mb: 5 }}>
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
            • For any queries, please contact our support team at support@eventify.com
          </Typography>
        </Paper>
      </Box>

      <Footer />
    </Box>
  );
};

export default TicketBookedPage;