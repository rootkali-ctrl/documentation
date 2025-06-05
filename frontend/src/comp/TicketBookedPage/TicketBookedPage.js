import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Header from "../Header/MainHeaderWOS";
import Footer from "../Footer/Footer.js";
import { doc, setDoc, getDoc, runTransaction } from "firebase/firestore";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ErrorIcon from "@mui/icons-material/Error";
import { QRCodeCanvas as QRCode } from "qrcode.react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { auth, db, storage } from "../../firebase_config";


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
  const { eventId } = useParams();
  const [vendorIdHere, setVendorIdHere] = useState("");
  const bookingIdRef = useRef(null);
  const [availabilityUpdateInProgress, setAvailabilityUpdateInProgress] =
    useState(false);

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
  } = location.state || {};

  // Format date and time from ISO string to IST
const formatEventDateTime = (isoDateInput) => {
  if (!isoDateInput) return { formattedDate: "N/A", eventTime: "N/A" };

  try {
    // Convert Firestore Timestamp or string to JS Date
    let eventDateTime;

    if (typeof isoDateInput?.toDate === "function") {
      // Firestore Timestamp
      eventDateTime = isoDateInput.toDate();
    } else if (
      typeof isoDateInput === "string" ||
      isoDateInput instanceof String
    ) {
      // ISO string
      eventDateTime = new Date(isoDateInput);
    } else if (isoDateInput instanceof Date) {
      // JS Date
      eventDateTime = isoDateInput;
    } else {
      console.warn("Unsupported date format:", isoDateInput);
      return { formattedDate: "N/A", eventTime: "N/A" };
    }

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
    //console.error("Error formatting date/time:", error);
    return { formattedDate: "N/A", eventTime: "N/A" };
  }
};


  // Fixed: Use useMemo to prevent regeneration on every render

  if (!bookingIdRef.current) {
    const timestamp = new Date().getTime().toString(36).slice(-4);
    const randomChars = Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase();
    bookingIdRef.current = `#${randomChars}${timestamp}`;
  }

  const bookingId = bookingIdRef.current;

  // Fixed: Memoize expensive calculations
  const { formattedDate, eventTime } = useMemo(() => {
    const currentEventData = eventData || event;

    if (currentEventData.eventDate) {
      return formatEventDateTime(currentEventData.eventDate);
    } else if (currentEventData.date) {
      return formatEventDateTime(currentEventData.date);
    } else {
      return {
        formattedDate: currentEventData.date
          ? new Date(currentEventData.date).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "N/A",
        eventTime: currentEventData.time || "N/A",
      };
    }
  }, [eventData, event]);

  const totalTickets = useMemo(() => {
    return ticketSummary.reduce((sum, ticket) => sum + ticket.quantity, 0);
  }, [ticketSummary]);

  const formatCurrency = useCallback((value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return "₹0.00";
    }
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(numValue)) {
      return "₹0.00";
    }
    return `₹${numValue.toFixed(2)}`;
  }, []);

  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    });
  }, []);

  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    });
  }, []);

  const qrCodeData = bookingId;

  // Fixed: Fetch user profile data with proper error handling
  const fetchUserProfileData = useCallback(async (userId) => {
    try {
      if (!userId) {
        console.warn("No userId provided to fetchUserProfileData");
        return null;
      }

      const userDocRef = doc(db, "users", userId);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        setUserProfileData(userData);
        return userData;
      } else {
        console.warn("User document not found for userId:", userId);
        return null;
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      setBookingStatus({
        status: "error",
        message: "Failed to fetch user profile. Please try again.",
      });
      return null;
    }
  }, []);

  // Fixed: Fetch event data with proper error handling and eventId resolution
  const fetchEventData = useCallback(async () => {
    try {
      const resolvedEventId = eventId;

      if (!resolvedEventId) {
        console.warn("No eventId available to fetch event data");
        if (event && Object.keys(event).length > 0) {
          setEventData(event);
          // Fix: Set vendorId from event data
          if (event.vendorId) {
            setVendorIdHere(event.vendorId);
          }
          return event;
        }
        throw new Error("No event ID or event data available");
      }

      const eventDocRef = doc(db, "events", resolvedEventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const data = { ...eventDoc.data(), id: resolvedEventId };
        setEventData(data);

        // Fix: Set vendorId immediately after fetching event data
        if (data.vendorId) {
          setVendorIdHere(data.vendorId);
        }

        return data;
      } else {
        console.warn("Event document not found for eventId:", resolvedEventId);
        if (event && Object.keys(event).length > 0) {
          const eventWithId = { ...event, id: resolvedEventId };
          setEventData(eventWithId);
          // Fix: Set vendorId from fallback event data
          if (event.vendorId) {
            setVendorIdHere(event.vendorId);
          }
          return eventWithId;
        }
        throw new Error("Event not found");
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      setBookingStatus({
        status: "error",
        message: "Failed to load event data. Please try again.",
      });
      return event || {};
    }
  }, [eventId, event]);

  // Fixed: Fetch event image with proper error handling
  const fetchEventImage = useCallback(async (eventData) => {
    try {
      setEventImage(null);

      if (!eventData || Object.keys(eventData).length === 0) {
        console.warn("No event data provided to fetchEventImage");
        setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
        return;
      }

      // Check banner images first
      if (eventData?.bannerImages?.length > 0) {
        setEventImage(eventData.bannerImages[5]);
        return;
      }

      // Check other possible image fields
      const possibleImageFields = [
        "imageUrl",
        "bannerImage",
        "thumbnail",
        "image",
      ];
      for (const field of possibleImageFields) {
        if (
          eventData[field] &&
          typeof eventData[field] === "string" &&
          eventData[field].trim() !== ""
        ) {
          setEventImage(eventData[field]);
          return;
        }
      }

      // Fallback to placeholder
      setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
    } catch (error) {
      console.error("Error in fetchEventImage:", error);
      setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
    }
  }, []);

  // Fixed: Check existing ticket with proper error handling
  const checkExistingTicket = useCallback(async (ticketID) => {
    try {
      if (!ticketID) {
        console.warn("No ticketID provided to checkExistingTicket");
        return false;
      }

      const cleanTicketId = ticketID.replace("#", "");
      const docRef = doc(db, "tickets", cleanTicketId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error("Error checking existing ticket:", error);
      return false;
    }
  }, []);

  // Fixed: Save ticket to database with proper authentication and retry logic
 const saveTicketToDatabase = useCallback(
  async (currentUser, retryCount = 0) => {
    const MAX_RETRY_ATTEMPTS = 2;

    if (!currentUser) {
      setBookingStatus({
        status: "error",
        message: "Authentication error. Please log in again.",
      });
      return;
    }

    try {
      setBookingStatus({
        status: "pending",
        message: retryCount > 0 ? "Retrying..." : "Saving your ticket...",
      });

      // Wait for authentication to settle on first attempt
      if (retryCount === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        try {
          await currentUser.getIdToken(true);
        } catch (tokenError) {
          console.warn("Token refresh warning:", tokenError);
        }
      }

      // CRITICAL FIX: Check if ticket already exists first
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

      // Get the current event data and ensure vendorId is resolved
      let currentEventData = eventData || event;

      if (!currentEventData || Object.keys(currentEventData).length === 0) {
        currentEventData = await fetchEventData();
      }

      const resolvedEventId =
        eventId || currentEventData.id || currentEventData.eventId || null;
      const resolvedVendorId =
        currentEventData.vendorId ||
        currentEventData.vendor_id ||
        currentEventData.organizerId ||
        vendorIdHere ||
        null;

      console.log(
        "Saving ticket with eventId:",
        resolvedEventId,
        "vendorId:",
        resolvedVendorId
      );

      if (!resolvedEventId) {
        throw new Error("Event ID is required but not found");
      }

      // **FIX: Format the event date and time properly**
      const eventDateRaw = currentEventData.date || 
                          currentEventData.eventDate || 
                          currentEventData.startDate ||
                          currentEventData.dateTime ||
                          null;
      
      console.log("Raw event date from data:", eventDateRaw);
      
      // Format the date using your existing function
      const { formattedDate: eventFormattedDate, eventTime: eventFormattedTime } = 
        formatEventDateTime(eventDateRaw);
      
      console.log("Formatted date:", eventFormattedDate, "Formatted time:", eventFormattedTime);

      // Create ticket data object
      const ticketData = {
        eventName: currentEventData.name || currentEventData.title || "Event",
        eventDate: eventFormattedDate, // Use the properly formatted date
        eventTime: eventFormattedTime, // Use the properly formatted time
        location:
          currentEventData.venueDetails.venueName || "N/A",
        phone: userPhone || "N/A",
        email: userEmail || "N/A",
        ticketSummary: ticketSummary || [],
        foodSummary: foodSummary || [],
        financial: financial || {
          subtotal: 0,
          convenienceFee: 0,
          discount: 0,
          gst: 0,
          totalAmount: 0,
          isFreeEvent: true,
        },
        bookingId: bookingId,
        bookingDate: `${currentDate} ${currentTime}`,
        userId: currentUser.uid,
        createdAt: new Date().toISOString(),
        eventId: resolvedEventId,
        isPublic: true,
        ownerId: currentUser.uid,
        status: "booked",
        checkedIn: false,
        checkedInTime: null,
        vendorId: resolvedVendorId || "",
        cancelled: false
      };

      console.log("Ticket data to save:", ticketData);

      const cleanTicketId = bookingId.replace("#", "");

      // CRITICAL FIX: Use transaction to save ticket AND update availability together
      await runTransaction(db, async (transaction) => {
        // PHASE 1: ALL READS FIRST
        const existingTicketRef = doc(db, "tickets", cleanTicketId);
        const eventDocRef = doc(db, "events", resolvedEventId);

        // Read existing ticket and event data
        const existingTicket = await transaction.get(existingTicketRef);
        const eventDoc = await transaction.get(eventDocRef);

        // Check if ticket already exists
        if (existingTicket.exists()) {
          throw new Error("TICKET_ALREADY_EXISTS");
        }

        // Check if event exists
        if (!eventDoc.exists()) {
          throw new Error("Event document not found for availability update");
        }

        // PHASE 2: ALL WRITES AFTER READS
        // Save the main ticket document
        transaction.set(existingTicketRef, ticketData);

        // IMPORTANT: Only save to user's subcollection if user is authenticated
        if (currentUser.uid && ticketData.userId === currentUser.uid) {
          const userTicketRef = doc(
            db,
            "users",
            currentUser.uid,
            "tickets",
            cleanTicketId
          );

          const userTicketData = {
            ticketId: cleanTicketId,
            eventName:
              currentEventData.name || currentEventData.title || "Event",
            bookingDate: new Date().toISOString(),
            status: "booked",
            eventId: resolvedEventId,
            vendorId: resolvedVendorId || "",
            // CRITICAL: Ensure userId matches authenticated user
            userId: currentUser.uid,
          };

          transaction.set(userTicketRef, userTicketData);
        }

        // Update event availability with only the allowed fields
        const eventData = eventDoc.data();
        const pricing = [...(eventData.pricing || [])];

        console.log("Current pricing before update:", pricing);

        // Convert ticketSummary to the format needed for update
        const bookedTicketsForUpdate = ticketSummary.map((ticket) => ({
          type: ticket.type,
          quantity: ticket.quantity,
        }));

        // Update each ticket type
        bookedTicketsForUpdate.forEach((bookedTicket) => {
          const ticketIndex = pricing.findIndex(
            (p) => p.ticketType === bookedTicket.type
          );

          if (ticketIndex !== -1) {
            const currentTicket = pricing[ticketIndex];
            const totalSeats = currentTicket.seats || 0;

            // Initialize booked count if it doesn't exist
            const currentBooked = currentTicket.booked || 0;
            const newBookedCount = currentBooked + bookedTicket.quantity;

            // Update the ticket type
            pricing[ticketIndex] = {
              ...currentTicket,
              booked: newBookedCount,
              available: Math.max(0, totalSeats - newBookedCount),
            };

            console.log(
              `Updated ${bookedTicket.type}: booked ${currentBooked} -> ${newBookedCount}, available: ${pricing[ticketIndex].available}`
            );
          } else {
            console.warn(
              `Ticket type ${bookedTicket.type} not found in pricing array`
            );
          }
        });

        // Calculate totals from pricing array
        const totalSeats = pricing.reduce(
          (sum, p) => sum + (p.seats || 0),
          0
        );
        const totalBookedTickets = pricing.reduce(
          (sum, p) => sum + (p.booked || 0),
          0
        );
        const totalAvailableTickets = Math.max(
          0,
          totalSeats - totalBookedTickets
        );

        console.log("Calculated totals:", {
          totalSeats,
          totalBookedTickets,
          totalAvailableTickets,
        });

        // Update the event document with calculated values
        const updateData = {
          pricing: pricing,
          ticketBookedCount: totalBookedTickets,
          totalAvailableTickets: totalAvailableTickets,
        };

        transaction.update(eventDocRef, updateData);
      });

      console.log(
        "Transaction completed successfully - ticket saved and availability updated"
      );

      setAvailabilityUpdated(true);
      setTicketIsSaved(true);
      setBookingStatus({
        status: "success",
        message: "Ticket booked successfully!",
      });
    } catch (error) {
      console.error("Error booking ticket:", error);

      // Handle the case where ticket already exists
      if (error.message === "TICKET_ALREADY_EXISTS") {
        setTicketIsSaved(true);
        setBookingStatus({
          status: "success",
          message: "Ticket already saved!",
        });
        return;
      }

      // Handle permission errors with retry logic
      if (
        error.code === "permission-denied" ||
        error.message.includes("permissions")
      ) {
        if (retryCount < MAX_RETRY_ATTEMPTS) {
          console.log(
            `Permission denied, retrying... (${
              retryCount + 1
            }/${MAX_RETRY_ATTEMPTS})`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return saveTicketToDatabase(currentUser, retryCount + 1);
        } else {
          setBookingStatus({
            status: "error",
            message:
              "Permission denied. Please check your account permissions or contact support.",
          });
        }
      } else {
        setBookingStatus({
          status: "error",
          message: `Failed to save your ticket: ${error.message}. Please try again or contact support.`,
        });
      }
    }
  },
  [
    eventData,
    event,
    eventId,
    currentDate,
    currentTime,
    ticketSummary,
    foodSummary,
    financial,
    checkExistingTicket,
    fetchUserProfileData,
    vendorIdHere,
    fetchEventData,
    bookingId,
    formatEventDateTime, // Added this dependency
  ]
);

  // Fixed: Fetch ticket availability with proper error handling
  const fetchTicketAvailability = useCallback(async (eventId) => {
    try {
      if (!eventId) {
        console.warn("No eventId provided to fetchTicketAvailability");
        return;
      }

      const eventDocRef = doc(db, "events", eventId);
      const eventDoc = await getDoc(eventDocRef);

      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        const pricing = eventData.pricing || [];

        const availability = pricing.map((ticket) => {
          const totalSeats = ticket.seats || 0;
          const bookedSeats = ticket.booked || 0;
          const availableSeats = Math.max(0, totalSeats - bookedSeats);

          return {
            ticketType: ticket.ticketType,
            totalSeats: totalSeats,
            bookedSeats: bookedSeats,
            availableSeats: availableSeats,
            price: ticket.price,
            features: ticket.features,
            isSoldOut: availableSeats <= 0,
          };
        });

        // Fix: Calculate totals from pricing array, not from event-level counters
        const totalSeats = pricing.reduce((sum, p) => sum + (p.seats || 0), 0);
        const totalBooked = pricing.reduce(
          (sum, p) => sum + (p.booked || 0),
          0
        );
        const totalAvailable = Math.max(0, totalSeats - totalBooked);

        setTicketAvailability({
          totalSeats,
          totalBookedTickets: totalBooked,
          totalAvailableTickets: totalAvailable,
          ticketTypes: availability,
          isEventSoldOut: totalAvailable <= 0,
        });
      } else {
        console.warn("Event document not found for availability check");
      }
    } catch (error) {
      console.error("Error fetching ticket availability:", error);
    }
  }, []);

  // Fixed: Initial event data fetch with proper dependency
  useEffect(() => {
    const initializeEventData = async () => {
      try {
        // If we don't have event data in state, fetch it
        if (!event || !event.id) {
          await fetchEventData();
        } else {
          // Use provided event data but ensure it has the correct ID
          const eventWithId = {
            ...event,
            id: eventId || event.id || event.eventId,
          };
          setEventData(eventWithId);
        }
      } catch (error) {
        console.error("Error initializing event data:", error);
      }
    };

    initializeEventData();
  }, [eventId, fetchEventData]); // Added proper dependencies

  // Fixed: Event data fetch by ID
  useEffect(() => {
    const fetchEventById = async () => {
      try {
        if (!eventId) {
          console.warn("No eventId in URL.");
          return;
        }

        console.log("Fetching event by ID:", eventId);
        const eventDocRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventDocRef);

        if (eventSnap.exists()) {
          const fetchedEventData = { ...eventSnap.data(), id: eventId };
          console.log("Event fetched by ID:", fetchedEventData);
          setEventData(fetchedEventData);
        } else {
          console.error("Event not found in Firestore for eventId:", eventId);
          setBookingStatus({
            status: "error",
            message: "Event not found. Please check the event link.",
          });
        }
      } catch (error) {
        console.error("Error fetching event by ID:", error);
        setBookingStatus({
          status: "error",
          message: "Failed to load event. Please try again.",
        });
      }
    };

    if (eventId && !eventData) {
      fetchEventById();
    }
  }, [eventId, eventData]);

  // Fixed: Initial setup with better authentication handling
  useEffect(() => {
    const handleInitialSetup = async () => {
      try {
        setIsLoading(true);
        setBookingStatus({ status: "pending", message: "Loading..." });

        // Wait for auth state to stabilize
        await new Promise((resolve) => setTimeout(resolve, 500));

        const currentUser = auth.currentUser;
        if (!currentUser) {
          // Wait a bit more for auth to settle
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const retryUser = auth.currentUser;

          if (!retryUser) {
            setBookingStatus({
              status: "error",
              message: "No user authenticated. Please log in again.",
            });
            return;
          }
        }

        const user = auth.currentUser;
        console.log("Current user in initial setup:", {
          uid: user?.uid,
          email: user?.email,
        });

        // Set user data
        const profileData = await fetchUserProfileData(user.uid);
        setUser({
          id: user.uid,
          email: user.email || "N/A",
          phone:
            profileData?.phoneNumber ||
            profileData?.phone ||
            user.phoneNumber ||
            "N/A",
        });

        // Wait for event data to be available
        let currentEventData = eventData;
        if (!currentEventData || Object.keys(currentEventData).length === 0) {
          console.log("Waiting for event data...");
          currentEventData = await fetchEventData();
        }

        if (currentEventData && Object.keys(currentEventData).length > 0) {
          // Fetch event image
          await fetchEventImage(currentEventData);

          // Get event ID for availability check
          const resolvedEventId =
            eventId || currentEventData.id || currentEventData.eventId;
          if (resolvedEventId) {
            await fetchTicketAvailability(resolvedEventId);
          }

          // CRITICAL FIX: Only save ticket if not already saved
          if (!ticketIsSaved) {
            await saveTicketToDatabase(user);
          }
        } else {
          throw new Error("Failed to load event data");
        }
      } catch (error) {
        console.error("Error in initial setup:", error);
        setBookingStatus({
          status: "error",
          message: "Failed to initialize. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    // CRITICAL FIX: Only run initial setup once when component mounts and ticket is not saved
    if (!ticketIsSaved && !availabilityUpdateInProgress) {
      handleInitialSetup();
    }
  }, [ticketIsSaved, availabilityUpdateInProgress]); // Added proper dependencies

  // Add retry function for manual retry
  const handleRetry = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setBookingStatus({
        status: "error",
        message: "Please log in again to retry.",
      });
      return;
    }

    await saveTicketToDatabase(currentUser);
  }, [saveTicketToDatabase]);

  // Handle ticket download
  // const handleDownloadTicket = async () => {
  //   try {
  //     setBookingStatus({
  //       status: bookingStatus.status,
  //       message: "Preparing your ticket for download...",
  //     });

  //     const pdf = new jsPDF({
  //       orientation: "portrait",
  //       unit: "mm",
  //       format: "a4",
  //     });

  //     const pdfWidth = pdf.internal.pageSize.getWidth();
  //     const pdfHeight = pdf.internal.pageSize.getHeight();
  //     const margin = 15;
  //     const centerX = pdfWidth / 2;
  //     let yOffset = 20;

  //     // Add border
  //     pdf.setDrawColor(0, 0, 0);
  //     pdf.setLineWidth(0.5);
  //     pdf.rect(margin - 5, 10, pdfWidth - 2 * (margin - 5), pdfHeight - 20);

  //     // Header Section
  //     pdf.setFont("helvetica", "bold");
  //     pdf.setFontSize(24);
  //     pdf.setTextColor(0, 51, 102); // Dark blue
  //     pdf.text("EVENT TICKET", centerX, yOffset, { align: "center" });
  //     yOffset += 15;

  //     // Event Name - Top Right Style (but centered for better design)
  //     pdf.setFont("helvetica", "bold");
  //     pdf.setFontSize(18);
  //     pdf.setTextColor(0, 0, 0);
  //     const eventName = event.name || "Event Name";
  //     pdf.text(eventName.toUpperCase(), centerX, yOffset, { align: "center" });
  //     yOffset += 12;

  //     // Divider Line
  //     pdf.setDrawColor(0, 51, 102);
  //     pdf.setLineWidth(1);
  //     pdf.line(margin, yOffset, pdfWidth - margin, yOffset);
  //     yOffset += 15;

  //     // Two Column Layout
  //     const leftColumnX = margin;
  //     const rightColumnX = centerX + 10;
  //     const columnWidth = (pdfWidth - 3 * margin - 10) / 2;

  //     // Left Column - Event Details
  //     pdf.setFont("helvetica", "bold");
  //     pdf.setFontSize(14);
  //     pdf.setTextColor(0, 51, 102);
  //     pdf.text("EVENT DETAILS", leftColumnX, yOffset);
  //     yOffset += 8;

  //     pdf.setFont("helvetica", "normal");
  //     pdf.setFontSize(10);
  //     pdf.setTextColor(0, 0, 0);

  //     const eventDetails = [
  //       { label: "Date:", value: formattedDate },
  //       { label: "Time:", value: eventTime },
  //       { label: "Venue:", value: eventData?.venueDetails?.venueName || event.location || "N/A" },
  //       { label: "Tickets:", value: `${totalTickets} (${ticketSummary.map((t) => `${t.type} x${t.quantity}`).join(", ")})` }
  //     ];

  //     eventDetails.forEach((detail) => {
  //       pdf.setFont("helvetica", "bold");
  //       pdf.text(detail.label, leftColumnX, yOffset);
  //       pdf.setFont("helvetica", "normal");
  //       // Split long text if needed
  //       const textLines = pdf.splitTextToSize(detail.value, columnWidth - 20);
  //       pdf.text(textLines, leftColumnX + 20, yOffset);
  //       yOffset += textLines.length * 5 + 2;
  //     });

  //     // Reset yOffset for right column
  //     let rightYOffset = yOffset - (eventDetails.length * 7) - 8;

  //     // Right Column - QR Code
  //     pdf.setFont("helvetica", "bold");
  //     pdf.setFontSize(14);
  //     pdf.setTextColor(0, 51, 102);
  //     pdf.text("ENTRY QR CODE", rightColumnX, rightYOffset);
  //     rightYOffset += 8;

  //     // QR Code
  //     const qrCanvas = qrRef.current.querySelector("canvas");
  //     if (qrCanvas) {
  //       const qrDataUrl = qrCanvas.toDataURL("image/png");
  //       const qrSize = 50; // Size in mm
  //       const qrX = rightColumnX + (columnWidth - qrSize) / 2; // Center QR in right column
  //       pdf.addImage(qrDataUrl, "PNG", qrX, rightYOffset, qrSize, qrSize);
  //       rightYOffset += qrSize + 5;

  //       pdf.setFontSize(9);
  //       pdf.setFont("helvetica", "italic");
  //       pdf.setTextColor(102, 102, 102);
  //       pdf.text("Scan at venue for entry", rightColumnX + columnWidth / 2, rightYOffset, { align: "center" });
  //     }

  //     // Move to next section
  //     yOffset += 20;

  //     // Order Summary Section
  //     pdf.setFont("helvetica", "bold");
  //     pdf.setFontSize(14);
  //     pdf.setTextColor(0, 51, 102);
  //     pdf.text("ORDER SUMMARY", leftColumnX, yOffset);
  //     yOffset += 8;

  //     // Create table-like structure for order items
  //     pdf.setFont("helvetica", "bold");
  //     pdf.setFontSize(9);
  //     pdf.setTextColor(0, 0, 0);
  //     pdf.text("ITEM", leftColumnX, yOffset);
  //     pdf.text("QTY", leftColumnX + 100, yOffset);
  //     pdf.text("AMOUNT", leftColumnX + 130, yOffset);
  //     yOffset += 5;

  //     // Line under headers
  //     pdf.setDrawColor(200, 200, 200);
  //     pdf.setLineWidth(0.3);
  //     pdf.line(leftColumnX, yOffset, pdfWidth - margin, yOffset);
  //     yOffset += 5;

  //     pdf.setFont("helvetica", "normal");
  //     pdf.setFontSize(9);

  //     // Ticket items
  //     ticketSummary.forEach((ticket) => {
  //       const itemName = pdf.splitTextToSize(ticket.type, 90);
  //       pdf.text(itemName, leftColumnX, yOffset);
  //       pdf.text(ticket.quantity.toString(), leftColumnX + 100, yOffset);
  //       pdf.text(ticket.price === 0 ? "FREE" : formatCurrency(ticket.price * ticket.quantity), leftColumnX + 130, yOffset);
  //       yOffset += itemName.length * 4 + 2;
  //     });

  //     // Food items
  //     if (foodSummary && foodSummary.length > 0) {
  //       foodSummary.forEach((food) => {
  //         const itemName = pdf.splitTextToSize(food.name, 90);
  //         pdf.text(itemName, leftColumnX, yOffset);
  //         pdf.text(food.quantity.toString(), leftColumnX + 100, yOffset);
  //         pdf.text(formatCurrency(food.price * food.quantity), leftColumnX + 130, yOffset);
  //         yOffset += itemName.length * 4 + 2;
  //       });
  //     }

  //     yOffset += 5;

  //     // Financial breakdown
  //     if (!financial.isFreeEvent) {
  //       const financialItems = [
  //         { label: "Convenience Fee:", amount: formatCurrency(financial.convenienceFee || 0) },
  //         ...(financial.discount > 0 ? [{ label: "Discount:", amount: `-${formatCurrency(financial.discount || 0)}` }] : []),
  //         { label: "GST (18%):", amount: formatCurrency(financial.gst || 0) }
  //       ];

  //       financialItems.forEach((item) => {
  //         pdf.text(item.label, leftColumnX + 80, yOffset);
  //         pdf.text(item.amount, leftColumnX + 130, yOffset);
  //         yOffset += 4;
  //       });

  //       yOffset += 3;

  //       // Total line
  //       pdf.setDrawColor(0, 0, 0);
  //       pdf.setLineWidth(0.5);
  //       pdf.line(leftColumnX + 75, yOffset, pdfWidth - margin, yOffset);
  //       yOffset += 5;
  //     }

  //     // Total Amount
  //     pdf.setFont("helvetica", "bold");
  //     pdf.setFontSize(12);
  //     pdf.text("TOTAL AMOUNT:", leftColumnX + 80, yOffset);
  //     pdf.text(
  //       financial.isFreeEvent ? "FREE" : formatCurrency(financial.totalAmount || 0),
  //       leftColumnX + 130,
  //       yOffset
  //     );
  //     yOffset += 15;

  //     // Booking Information Section
  //     pdf.setFont("helvetica", "bold");
  //     pdf.setFontSize(14);
  //     pdf.setTextColor(0, 51, 102);
  //     pdf.text("BOOKING INFORMATION", leftColumnX, yOffset);
  //     yOffset += 8;

  //     pdf.setFont("helvetica", "normal");
  //     pdf.setFontSize(10);
  //     pdf.setTextColor(0, 0, 0);

  //     const bookingInfo = [
  //       { label: "Booking ID:", value: bookingId },
  //       { label: "Booking Date:", value: `${currentDate} ${currentTime}` },
  //       { label: "Email:", value: user?.email || "N/A" },
  //       { label: "Phone:", value: userProfileData?.phoneNumber || userProfileData?.phone || user?.phone || "N/A" }
  //     ];

  //     bookingInfo.forEach((info) => {
  //       pdf.setFont("helvetica", "bold");
  //       pdf.text(info.label, leftColumnX, yOffset);
  //       pdf.setFont("helvetica", "normal");
  //       pdf.text(info.value, leftColumnX + 35, yOffset);
  //       yOffset += 6;
  //     });

  //     // Footer
  //     yOffset = pdfHeight - 25;
  //     pdf.setFont("helvetica", "italic");
  //     pdf.setFontSize(8);
  //     pdf.setTextColor(102, 102, 102);
  //     pdf.text("Please present this ticket (digital or printed) at the venue entrance.", centerX, yOffset, { align: "center" });
  //     yOffset += 4;
  //     pdf.text("For support, contact us through the app or website.", centerX, yOffset, { align: "center" });

  //     // Save PDF
  //     const cleanBookingId = bookingId.replace("#", "");
  //     const cleanEventName = (event.name || "Event").replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_");
  //     pdf.save(`${cleanEventName}_Ticket_${cleanBookingId}.pdf`);

  //     setBookingStatus({
  //       status: bookingStatus.status,
  //       message: "Ticket downloaded successfully!",
  //     });

  //     setTimeout(() => {
  //       if (bookingStatus.status === "success") {
  //         setBookingStatus({
  //           status: "success",
  //           message: "Ticket booked successfully!",
  //         });
  //       }
  //     }, 3000);
  //   } catch (error) {
  //     //console.error("Error with download function:", error);
  //     alert(
  //       "There was an error downloading your ticket. Please try again or contact support."
  //     );
  //     setBookingStatus({
  //       status: bookingStatus.status,
  //       message:
  //         bookingStatus.status === "success"
  //           ? "Ticket booked successfully!"
  //           : bookingStatus.message,
  //     });
  //   }
  // };
  const handleDownloadTicket = async () => {
    try {
      // Notify the user that ticket preparation has started
      setBookingStatus({
        status: bookingStatus.status,
        message: "Preparing your ticket for download...",
      });

      // Initialize jsPDF with A4 portrait layout
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // PDF page dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;

      // Ticket card dimensions
      const ticketWidth = pdfWidth - 2 * margin;
      const ticketHeight = 250;
      const startY = 10;

      // Light gray background for the entire page
      pdf.setFillColor(245, 245, 245);
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

      // White background for the ticket section
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(margin, startY, ticketWidth, ticketHeight, 6, 6, "F");

      // Simulate left and right rounded notches
      const cutoutY = startY + ticketHeight * 0.32;
      const cutoutSize = 8;
      pdf.setFillColor(245, 245, 245);
      pdf.circle(margin, cutoutY + 12, cutoutSize, "F");
      pdf.circle(margin + ticketWidth, cutoutY + 12, cutoutSize, "F");

      let yOffset = startY + 15;

      // Title: Event Name
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      const eventName = event.name || "Event";
      pdf.text(eventName, margin + 10, yOffset);
      yOffset += 12;

      // Event Date & Time
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor(102, 102, 102);
      pdf.text(`Date: ${formattedDate}`, margin + 10, yOffset);
      pdf.text(`Time: ${eventTime}`, margin + 100, yOffset);
      yOffset += 8;

      // Event Venue
      const venueText =
        eventData?.venueDetails?.venueName || event.location || "N/A";
      pdf.text(`Venue: ${venueText}`, margin + 10, yOffset);
      yOffset += 8;

      // Ticket Summary
      const ticketSummaryText = `${totalTickets} Tickets (${ticketSummary
        .map((t) => `${t.type} x${t.quantity}`)
        .join(", ")})`;
      const ticketLines = pdf.splitTextToSize(
        ticketSummaryText,
        ticketWidth - 20
      );
      pdf.text(`Tickets: ${ticketLines.join(" ")}`, margin + 10, yOffset);
      yOffset += 15;

      // Divider Line
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 10, yOffset, margin + ticketWidth - 10, yOffset);
      yOffset += 15;

      // QR Code Section Background
      const qrSectionY = yOffset;
      const qrSectionHeight = 55;
      pdf.setFillColor(245, 245, 245);
      pdf.roundedRect(
        margin + 10,
        qrSectionY,
        ticketWidth - 20,
        qrSectionHeight,
        2,
        2,
        "F"
      );

      // Embed QR Code if available
      const qrCanvas = qrRef.current.querySelector("canvas");
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL("image/png");
        const qrSize = 30;

        // White background for QR code
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin + 15, qrSectionY + 5, qrSize + 4, qrSize + 4, "F");

        // Insert QR image
        pdf.addImage(
          qrDataUrl,
          "PNG",
          margin + 17,
          qrSectionY + 7,
          qrSize,
          qrSize
        );
      }

      // Booking ID and Ticket Details
      const detailsX = margin + 60;
      let detailsY = qrSectionY + 12;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.text(`Booking ID: ${bookingId}`, detailsX, detailsY);
      pdf.text(`Tickets: ${ticketLines.join(" ")}`, detailsX, detailsY + 10);
      detailsY += 8;

      // QR Scan Instructions
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(
        "Present this QR code at",
        margin + 15,
        qrSectionY + qrSectionHeight - 8
      );
      pdf.text(
        "the venue for validation",
        margin + 15,
        qrSectionY + qrSectionHeight - 4
      );

      // Food note (if applicable)
      if (foodNote) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(111, 114, 135);
        const foodNoteLines = pdf.splitTextToSize(foodNote, 100);
        pdf.text(foodNoteLines, detailsX, detailsY);
      }

      yOffset = qrSectionY + qrSectionHeight + 15;

      // Order Summary Section
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.setTextColor(0, 0, 0);
      pdf.text("ORDER SUMMARY", margin + 10, yOffset);
      yOffset += 8;

      // Table Headers
      pdf.setFontSize(9);
      pdf.text("ITEM", margin + 10, yOffset);
      pdf.text("QTY", margin + 110, yOffset);
      pdf.text("AMOUNT", margin + 140, yOffset);
      yOffset += 5;

      // Underline headers
      pdf.setDrawColor(220, 220, 220);
      pdf.setLineWidth(0.5);
      pdf.line(margin + 10, yOffset, margin + ticketWidth - 10, yOffset);
      yOffset += 10;

      // Ticket Items Loop
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      ticketSummary.forEach((ticket) => {
        const itemName = pdf.splitTextToSize(ticket.type, 90);
        pdf.text(itemName, margin + 10, yOffset);
        pdf.text(ticket.quantity.toString(), margin + 110, yOffset);
        const ticketAmount =
          ticket.price === 0
            ? "FREE"
            : formatCurrency(ticket.price * ticket.quantity);
        pdf.text(ticketAmount, margin + 140, yOffset);
        yOffset += itemName.length * 4 + 2;
      });

      // Food Items Loop
      if (foodSummary && foodSummary.length > 0) {
        foodSummary.forEach((food) => {
          const itemName = pdf.splitTextToSize(food.name, 90);
          pdf.text(itemName, margin + 10, yOffset);
          pdf.text(food.quantity.toString(), margin + 110, yOffset);
          pdf.text(
            formatCurrency(food.price * food.quantity),
            margin + 140,
            yOffset
          );
          yOffset += itemName.length * 4 + 2;
        });
      }

      yOffset += 5;

      // Fees, Discounts, Taxes
      if (!financial.isFreeEvent) {
        const financialItems = [
          {
            label: "Convenience Fee:",
            amount: formatCurrency(financial.convenienceFee || 0),
          },
          ...(financial.discount > 0
            ? [
                {
                  label: "Discount:",
                  amount: `-${formatCurrency(financial.discount || 0)}`,
                },
              ]
            : []),
          { label: "GST (18%):", amount: formatCurrency(financial.gst || 0) },
        ];

        financialItems.forEach((item) => {
          pdf.text(item.label, margin + 90, yOffset);
          pdf.text(item.amount, margin + 140, yOffset);
          yOffset += 4;
        });

        yOffset += 3;

        // Divider above total
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(margin + 85, yOffset, margin + ticketWidth - 10, yOffset);
        yOffset += 5;
      }

      // Final Total Section
      const totalSectionHeight = 15;
      pdf.setFillColor(255, 255, 255); // Light gray background
      pdf.rect(margin + 10, yOffset, ticketWidth - 20, totalSectionHeight, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.text("TOTAL AMOUNT:", margin + 90, yOffset + 10);
      const totalAmountText = financial.isFreeEvent
        ? "FREE"
        : formatCurrency(financial.totalAmount || 0);
      pdf.text(totalAmountText, margin + 140, yOffset + 10);

      yOffset += totalSectionHeight + 15;

      // Booking Information
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("BOOKING INFORMATION", margin + 10, yOffset);
      yOffset += 8;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const bookingInfo = [
        { label: "Booking Date:", value: `${currentDate} ${currentTime}` },
        { label: "Email:", value: user?.email || "N/A" },
        {
          label: "Phone:",
          value:
            userProfileData?.phoneNumber ||
            userProfileData?.phone ||
            user?.phone ||
            "N/A",
        },
      ];

      bookingInfo.forEach((info) => {
        pdf.setFont("helvetica", "bold");
        pdf.text(info.label, margin + 10, yOffset);
        pdf.setFont("helvetica", "normal");
        pdf.text(info.value, margin + 45, yOffset);
        yOffset += 6;
      });

      // Footer Notes
      yOffset += 15;
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8);
      pdf.setTextColor(102, 102, 102);
      const centerX = pdfWidth / 2;
      pdf.text(
        "Please present this ticket (digital or printed) at the venue entrance.",
        centerX,
        yOffset,
        { align: "center" }
      );
      pdf.text(
        "For support, contact us through the app or website.",
        centerX,
        yOffset + 4,
        { align: "center" }
      );

      // Generate filename and save PDF
      const cleanBookingId = bookingId.replace("#", "");
      const cleanEventName = (event.name || "Event")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");
      pdf.save(`${cleanEventName}_Ticket_${cleanBookingId}.pdf`);

      // Notify user on successful download
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
      //console.error("Error with download function:", error);
      alert(
        "There was an error downloading your ticket. Please try again or contact support."
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
          <Typography variant="h6" fontFamily="albert sans">
            Loading your ticket...
          </Typography>
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
          <Typography fontFamily="albert sans">
            Saving your ticket. Please wait...
          </Typography>
        </Alert>
      )}

      {bookingStatus.status === "error" && (
        <Alert
          severity="error"
          sx={{ maxWidth: 1000, mx: "auto", mt: 3 }}
          action={
            <Button color="inherit" size="small" onClick={handleRetry} sx={{fontFamily:'albert sans'}}>
              Retry
            </Button>
          }
        >
          <Typography fontFamily="albert sans">
            {bookingStatus.message}
          </Typography>
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
            fontFamily="albert sans"
            sx={{ fontSize: isMobile ? 20 : 24 }}
          >
            Ticket Booked Successfully, Pal!
          </Typography>
          <Typography
            variant="body1"
            fontFamily="albert sans"
            sx={{ mt: 0.5, fontSize: isMobile ? 14 : 16 }}
          >
            Get ready for an amazing experience! 🎉
          </Typography>
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
          <Typography variant="h5" fontFamily="albert sans" fontWeight="bold">
            Oops! We're having trouble saving your ticket
          </Typography>
          <Typography variant="body1" fontFamily="albert sans" sx={{ mt: 0.5 }}>
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

        {/* Desktop Ticket Body */}
        {!isMobile && (
          <>
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
                    height:'400px',
                    pt: 2,
                    pb: 4,
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
                    height: '90%',
                    // maxWidth: 150,
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
                    fontFamily="albert sans"
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
                    <Typography fontFamily="albert sans" variant="body2">
                      {formattedDate}
                    </Typography>
                  </Box>

                  <Box
                    mt={1}
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <AccessTimeIcon sx={{ fontSize: 18 }} />
                    <Typography fontFamily="albert sans" variant="body2">
                      {eventTime}
                    </Typography>
                  </Box>

                  <Box
                    mt={1}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <LocationOnIcon sx={{ fontSize: 18 }} />
                    <Typography fontFamily="albert sans" variant="body2">
                      {eventData?.venueDetails?.venueName ||
                        event.location ||
                        "N/A"}
                    </Typography>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Typography fontFamily="albert sans" variant="body2">
                      Number of Tickets: {totalTickets}
                    </Typography>
                    {ticketSummary.length > 0 && (
                      <Box
                        sx={{
                          ml: "auto",
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <DirectionsCarIcon sx={{ mr: 0.5, fontSize: 18 }} />
                        <Typography
                          fontFamily="albert sans"
                          variant="body2"
                          fontWeight="bold"
                        >
                          {ticketSummary[0].type}
                        </Typography>
                      </Box>
                    )}
                  </Box>

                  <Typography fontFamily="albert sans" variant="body2">
                    Ticket sent to
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography fontFamily="albert sans" variant="body2">
                      {userProfileData?.phoneNumber ||
                        userProfileData?.phone ||
                        user?.phone ||
                        "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    <EmailIcon sx={{ fontSize: 16, mr: 0.5 }} />
                    <Typography fontFamily="albert sans" variant="body2">
                      {user?.email}
                    </Typography>
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
                      fontFamily="albert sans"
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
                      fontFamily="albert sans"
                      sx={{
                        backgroundColor: "#19AEDC",
                        color: "#fff",
                        borderRadius: 4,
                        textTransform: "none",
                        px: 2,
                        py: 0.5,
                        fontSize: 13,
                        fontFamily:'albert sans'
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
                        <Typography fontFamily="albert sans" variant="body2">
                          {ticket.type || "Ticket"} ({ticket.quantity || 0}x)
                        </Typography>
                        <Typography fontFamily="albert sans" fontWeight="bold">
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
                            <Typography
                              fontFamily="albert sans"
                              variant="body2"
                            >
                              {food.name || "Food Item"} ({food.quantity || 0}x)
                            </Typography>
                            <Typography
                              fontFamily="albert sans"
                              fontWeight="bold"
                            >
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
                          <Typography fontFamily="albert sans" variant="body2">
                            Convenience fee
                          </Typography>
                          <Typography
                            fontFamily="albert sans"
                            fontWeight="bold"
                          >
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
                              fontFamily="albert sans"
                              variant="body2"
                              sx={{ color: "#19AEDC" }}
                            >
                              Discount
                            </Typography>
                            <Typography
                              fontFamily="albert sans"
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
                          <Typography fontFamily="albert sans" variant="body2">
                            GST (18%)
                          </Typography>
                          <Typography
                            fontFamily="albert sans"
                            fontWeight="bold"
                          >
                            {formatCurrency(financial.gst || 0)}
                          </Typography>
                        </Box>
                        <Typography
                          fontFamily="albert sans"
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
                      <Typography
                        fontFamily="albert sans"
                        variant="body1"
                        fontWeight="bold"
                      >
                        Total Amount
                      </Typography>
                      <Typography
                        fontFamily="albert sans"
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
                  <Typography
                    fontFamily="albert sans"
                    variant="caption"
                    sx={{ color: "#777" }}
                  >
                    Booking Date & Time
                  </Typography>
                  <Typography
                    fontFamily="albert sans"
                    variant="body2"
                    fontWeight="medium"
                  >
                    {currentDate} {currentTime}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    fontFamily="albert sans"
                    variant="caption"
                    sx={{ color: "#777" }}
                  >
                    Booking ID
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {bookingId}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    fontFamily="albert sans"
                    variant="caption"
                    sx={{ color: "#777" }}
                  >
                    Booking Status
                  </Typography>
                  <Typography
                    fontFamily="albert sans"
                    variant="body2"
                    fontWeight="medium"
                    sx={{ color: ticketIsSaved ? "#4CAF50" : "#f57c00" }}
                  >
                    {ticketIsSaved ? "Confirmed" : "Pending Confirmation"}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </>
        )}

        {/* Mobile Ticket Notches */}
        {isMobile && (
  <>
    <Box sx={{ width: "90%", mx: "auto", mt: 3 }}>
      <Card
        sx={{
          width: "100%",
          borderRadius: 6,
          height: '770px' , // Fixed height for proper proportion control
          p: 0,
          overflow: "hidden",
          position: "relative",
        }}
        ref={ticketRef}
      >
        {/* Top Section - 30% of total height */}
        <Box
          sx={{
            height: "30%", // 30% of 720px = 216px
            position: "relative",
            p: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", gap: 3, flex: 1 }}>
            <Box
              component="img"
              src={
                eventImage ||
                "https://via.placeholder.com/270x180?text=Event+Image"
              }
              alt={event.name || "Event"}
              sx={{
                width: "50%",
                height: "90%",
                maxHeight:240,
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
            <Box sx={{ flex: 1.5 }}>
              <Typography
                fontFamily="albert sans"
                sx={{
                  fontWeight: 600,
                  fontSize: 16,
                  mb: 1,
                }}
              >
                {event.name || "Event"}
              </Typography>

              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <CalendarTodayIcon
                  sx={{ fontSize: 13, color: "text.secondary" }}
                />
                <Typography
                  fontFamily="albert sans"
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontSize: 13,
                    pl: 0.2,
                  }}
                >
                  {formattedDate}
                </Typography>
                </Box>
               <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <AccessTimeIcon
                  sx={{ fontSize: 11, color: "text.secondary" }}
                />
                <Typography
                  fontFamily="albert sans"
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    fontSize: 13,
                    pl: 0.2,
                  }}
                >
                  {eventTime}
                </Typography>
              </Box>
              
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <LocationOnIcon
                  sx={{ fontSize: 13, color: "text.secondary" }}
                />
                <Typography
                  fontFamily="albert sans"
                  sx={{
                    color: "#adaebc",
                    fontSize: 13,
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
        </Box>

        {/* Middle Section - 10% of total height with curves */}
        <Box
          sx={{
            height: "10%", // 10% of 720px = 72px
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Left curve */}
          <Box
            sx={{
              position: "absolute",
              width: 40,
              height: 50,
              backgroundColor: "#f5f5f5",
              borderRadius: "0 30px 30px 0px",
              left: 0,
              transform: "translateX(-50%)",
              zIndex: 1,
            }}
          />
          
          {/* Right curve */}
          <Box
            sx={{
              position: "absolute",
              width: 40,
              height: 50,
              backgroundColor: "#f5f5f5",
              borderRadius: "30px 0px 0px 30px",
              right: 0,
              transform: "translateX(50%)",
              zIndex: 1,
            }}
          />
          
          {/* Divider line */}
          <Divider sx={{ width: "100%", borderStyle: "dashed" }} />
        </Box>

        {/* Bottom Section - 60% of total height */}
        <Box
          sx={{
            height: "50%", // 60% of 720px = 432px
            p: 2,
            display: "flex",
            flexDirection: "column",
        
          }}
        >
          {/* QR Code Section */}
          <Box
            sx={{ 
              bgcolor: "#d1d5db4c", 
              p: 1, 
              borderRadius: 2,
              height: "40%", // Take 45% of bottom section
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              mb:3
            }}
          >
            <Box sx={{ display: "flex", flex: 1 }}>
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
                    size={80} // Reduced size to fit better
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
                  flex: 1,
                }}
              >
                <Typography
                  fontFamily="albert sans"
                  sx={{
                    color: "text.secondary",
                    fontSize: 12,
                  }}
                >
                  {totalTickets} Tickets
                </Typography>
                <Typography
                  fontFamily="albert sans"
                  sx={{
                    color: "text.secondary",
                    fontSize: 13,
                  }}
                >
                  {ticketTypes}
                </Typography>
                <Box sx={{ display: "flex" }}>
                  <Typography
                    fontFamily="albert sans"
                    sx={{
                      fontWeight: 600,
                      fontSize: 10,
                    }}
                  >
                    Booking ID :
                  </Typography>
                  <Typography
                    fontFamily="albert sans"
                    sx={{
                      fontWeight: 600,
                      fontSize: 10,
                      ml: 0.5,
                    }}
                  >
                    {bookingId}
                  </Typography>
                </Box>
                <Typography
                  fontFamily="albert sans"
                  sx={{
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
                fontFamily="albert sans"
                sx={{
                  fontSize: 9,
                  textAlign: "center",
                }}
              >
                Present this QR code at
                <br />
                the venue for validation
              </Typography>
              <Button
                fontFamily="albert sans"
                variant="contained"
                size="small"
                startIcon={<DownloadIcon sx={{ fontSize: 12 }} />}
                sx={{
                  height: 21,
                  bgcolor: "#19aedc",
                  borderRadius: 4,
                  fontSize: 8,
                  fontWeight: 600,
                  textTransform: "none",
                  fontFamily:'albert sans'
                }}
                onClick={handleDownloadTicket}
                disabled={bookingStatus.status === "pending"}
              >
                Download Ticket
              </Button>
            </Box>
          </Box>

          {/* Pricing Section */}
          <Box sx={{ height: "55%", display: "flex", flexDirection: "column",justifyContent:'space-between' }}>
            <Box sx={{  overflow: "auto", height:'90%' }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Box>
                  <Typography
                    fontFamily="albert sans"
                    sx={{
                      fontWeight: 300,
                      fontSize: 12,
                    }}
                  >
                    Price per Ticket
                  </Typography>
                  {ticketSummary?.map((ticket, idx) => (
                    <Typography
                      fontFamily="albert sans"
                      key={idx}
                      sx={{
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
                  fontFamily="albert sans"
                  sx={{
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
                  fontFamily="albert sans"
                  sx={{
                    fontWeight: 300,
                    fontSize: 12,
                  }}
                >
                  Discount
                </Typography>
                <Typography
                  fontFamily="albert sans"
                  sx={{
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
                      fontFamily="albert sans"
                      sx={{
                        fontWeight: 300,
                        fontSize: 12,
                      }}
                    >
                      Grab a bite fees
                    </Typography>
                    {foodSummary.map((food, idx) => (
                      <Typography
                        fontFamily="albert sans"
                        key={idx}
                        sx={{
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
                    fontFamily="albert sans"
                    sx={{
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
                    fontFamily="albert sans"
                    sx={{
                      fontWeight: 300,
                      fontSize: 12,
                    }}
                  >
                    Convenience fees
                  </Typography>
                  <Typography
                    fontFamily="albert sans"
                    sx={{
                      fontWeight: 300,
                      fontSize: 9,
                      color: "#4b5563e6",
                    }}
                  >
                    Incl. of taxes
                  </Typography>
                </Box>
                <Typography
                  fontFamily="albert sans"
                  sx={{
                    fontWeight: 300,
                    fontSize: 12,
                  }}
                >
                  ₹{financial?.convenienceFee || 0}
                </Typography>
              </Box>
            </Box>

            {/* Total Amount - Fixed at bottom */}
            <Box
              sx={{
                
                bgcolor: "#d1d5db4c",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1.5,
                borderRadius: 1,
                height:'10%'
              }}
            >
              <Typography
                fontFamily="albert sans"
                sx={{
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                Total Amount
              </Typography>
              <Typography
                fontFamily="albert sans"
                sx={{
                  fontWeight: 500,
                  fontSize: 13,
                }}
              >
                ₹{financial.totalAmount}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Card>
    </Box>
  </>
)}

        {/* Mobile Ticket Body */}
        {/* {isMobile && (
          
        )} */}
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
          fontFamily="albert sans"
          sx={{
            backgroundColor: "#19AEDC",
            borderRadius: 2,
            px: !isMobile ? 4 : 2,
            py: 1,
            fontSize: !isMobile ? 16 : 10,
            fontFamily: "albert sans",
            "&:hover": { backgroundColor: "#0e8eb8" },
          }}
          onClick={() => navigate("/recentorders")}
        >
          View All My Tickets
        </Button>
        <Button
          fontFamily="albert sans"
          variant="outlined"
          sx={{
            borderColor: "#19AEDC",
            color: "#19AEDC",
            borderRadius: 2,
            px: !isMobile ? 4 : 2,
            py: 1,
            fontSize: !isMobile ? 16 : 10,
            fontFamily: "albert sans",

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
          <Typography
            fontFamily="albert sans"
            variant="h6"
            sx={{ mb: 2, fontWeight: "bold" }}
          >
            Important Information
          </Typography>
          <Typography fontFamily="albert sans" variant="body2" sx={{ mb: 1 }}>
            • Please arrive at least 30 minutes before the event starts.
          </Typography>
          <Typography fontFamily="albert sans" variant="body2" sx={{ mb: 1 }}>
            • Keep this ticket handy - you'll need to show it at the entrance.
          </Typography>
          <Typography fontFamily="albert sans" variant="body2" sx={{ mb: 1 }}>
            • The QR code will be scanned at entry for verification.
          </Typography>
          <Typography fontFamily="albert sans" variant="body2" sx={{ mb: 1 }}>
            • This ticket cannot be transferred or resold.
          </Typography>
          <Typography fontFamily="albert sans" variant="body2">
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
