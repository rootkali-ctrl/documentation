import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
import { v4 as uuidv4 } from 'uuid'; // Added for generating unique booking IDs

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
  const { eventId, generatedBookingId } = useParams();
  const [vendorIdHere, setVendorIdHere] = useState("");
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
    bookingId: passedBookingId,
  } = location.state || {};
  const [bookingId, setBookingId] = useState(passedBookingId || `BOOK-${Date.now()}-${uuidv4().slice(0, 8)}`);
  const HOME_REDIRECT_TIMEOUT_MS = 60 * 1000;
  const redirectTimerRef = useRef(null);

  const startRedirectTimer = useCallback(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
    }

    redirectTimerRef.current = setTimeout(() => {
      console.log("Redirecting to homepage...");
      navigate("/", { replace: true });
    }, HOME_REDIRECT_TIMEOUT_MS);
  }, [navigate]);

  const clearRedirectTimer = useCallback(() => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }, []);

  const formatEventDateTime = (isoDateInput) => {
    if (!isoDateInput) return { formattedDate: "N/A", eventTime: "N/A" };

    try {
      let eventDateTime;

      if (typeof isoDateInput?.toDate === "function") {
        eventDateTime = isoDateInput.toDate();
      } else if (
        typeof isoDateInput === "string" ||
        isoDateInput instanceof String
      ) {
        eventDateTime = new Date(isoDateInput);
      } else if (isoDateInput instanceof Date) {
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
      return { formattedDate: "N/A", eventTime: "N/A" };
    }
  };

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


const handleBackNavigation = useCallback(() => {
  // After successful booking, always go to home

  if (bookingStatus.status === "success" && ticketIsSaved) {
    navigate("/", { replace: true });
  } else {
    // If booking is still pending, also redirect to home
    navigate("/", { replace: true });
  }
}, [navigate, bookingStatus.status, ticketIsSaved]);


useEffect(() => {
  const handlePopState = (event) => {
    if (ticketIsSaved) {
      navigate("/", { replace: true });
    }
  };

  window.addEventListener("popstate", handlePopState);
  return () => window.removeEventListener("popstate", handlePopState);
}, [ticketIsSaved, navigate]);

  const totalTickets = useMemo(() => {
    return ticketSummary.reduce((sum, ticket) => sum + ticket.quantity, 0);
  }, [ticketSummary]);

  const ticketTypes = useMemo(() => {
    return ticketSummary
      .map((ticket) => `${ticket.type} x${ticket.quantity}`)
      .join(", ");
  }, [ticketSummary]);

  const foodNote = useMemo(() => {
    if (foodSummary && foodSummary.length > 0) {
      return `Includes food: ${foodSummary
        .map((food) => `${food.name} x${food.quantity}`)
        .join(", ")}`;
    }
    return "No food items included.";
  }, [foodSummary]);

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

  const fetchEventData = useCallback(async () => {
    try {
      const resolvedEventId = eventId;

      if (!resolvedEventId) {
        console.warn("No eventId available to fetch event data");
        if (event && Object.keys(event).length > 0) {
          setEventData(event);
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

        if (data.vendorId) {
          setVendorIdHere(data.vendorId);
        }

        return data;
      } else {
        console.warn("Event document not found for eventId:", resolvedEventId);
        if (event && Object.keys(event).length > 0) {
          const eventWithId = { ...event, id: resolvedEventId };
          setEventData(eventWithId);
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

  const fetchEventImage = useCallback(async (eventData) => {
    try {
      setEventImage(null);

      if (!eventData || Object.keys(eventData).length === 0) {
        console.warn("No event data provided to fetchEventImage");
        setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
        return;
      }

      if (eventData?.bannerImages?.length > 0) {
        setEventImage(eventData.bannerImages[5]);
        return;
      }

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

      setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
    } catch (error) {
      console.error("Error in fetchEventImage:", error);
      setEventImage("https://via.placeholder.com/270x180?text=Event+Image");
    }
  }, []);

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

      if (!bookingId) {
        console.error("bookingId is undefined, generating a fallback");
        setBookingId(`BOOK-${Date.now()}-${uuidv4().slice(0, 8)}`);
      }

      try {
        setBookingStatus({
          status: "pending",
          message: retryCount > 0 ? "Retrying..." : "Saving your ticket...",
        });

        if (retryCount === 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          try {
            await currentUser.getIdToken(true);
          } catch (tokenError) {
            console.warn("Token refresh warning:", tokenError);
          }
        }

        const ticketExists = await checkExistingTicket(bookingId);
        if (ticketExists) {
          setTicketIsSaved(true);
          setBookingStatus({
            status: "success",
            message: "Ticket already saved!",
          });
          startRedirectTimer();
          return;
        }

        const profileData = await fetchUserProfileData(currentUser.uid);
        const userPhone =
          profileData?.phoneNumber ||
          profileData?.phone ||
          currentUser.phoneNumber ||
          "N/A";
        const userEmail = currentUser.email || profileData?.email || "N/A";

        let currentEventData = eventData || event;
        if (!currentEventData || Object.keys(currentEventData).length === 0) {
          console.log("Fetching event data due to missing data...");
          currentEventData = await fetchEventData();
        }

        if (!currentEventData?.id) {
          throw new Error("Event ID is missing from event data");
        }

        const resolvedEventId = currentEventData.id;
        const resolvedVendorId =
          currentEventData.vendorId ||
          currentEventData.vendor_id ||
          currentEventData.organizerId ||
          vendorIdHere ||
          null;

        if (!resolvedVendorId) {
          console.warn("Vendor ID is missing, proceeding with null");
        }

        const eventDateRaw =
          currentEventData.eventDate ||
          currentEventData.date ||
          currentEventData.startDate ||
          currentEventData.dateTime ||
          null;

        const { formattedDate: eventFormattedDate, eventTime: eventFormattedTime } =
          formatEventDateTime(eventDateRaw);

        if (!eventFormattedDate || !eventFormattedTime) {
          console.warn("Event date or time formatting failed, using defaults");
        }

        const ticketData = {
          eventName: currentEventData.name || "Event",
          eventDate: eventFormattedDate,
          eventTime: eventFormattedTime,
          location:
            currentEventData.venueDetails?.venueName ||
            currentEventData.location ||
            "N/A",
          phone: userPhone,
          email: userEmail,
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
          cancelled: false,
        };

        console.log("Ticket data to save:", ticketData);

        const cleanTicketId = bookingId.replace("#", "");

        await runTransaction(db, async (transaction) => {
          const existingTicketRef = doc(db, "tickets", cleanTicketId);
          const eventDocRef = doc(db, "events", resolvedEventId);
          const existingTicket = await transaction.get(existingTicketRef);
          const eventDoc = await transaction.get(eventDocRef);

          if (existingTicket.exists()) {
            throw new Error("TICKET_ALREADY_EXISTS");
          }

          if (!eventDoc.exists()) {
            throw new Error("Event document not found for availability update");
          }

          transaction.set(existingTicketRef, ticketData);

          if (currentUser.uid && ticketData.userId === currentUser.uid) {
            const userTicketRef = doc(
              db,
              "users",
              currentUser.uid,
              "tickets",
              cleanTicketId
            );
            transaction.set(userTicketRef, {
              ticketId: cleanTicketId,
              eventName: currentEventData.name || "Event",
              bookingDate: new Date().toISOString(),
              status: "booked",
              eventId: resolvedEventId,
              vendorId: resolvedVendorId || "",
              userId: currentUser.uid,
            });
          }

          const eventData = eventDoc.data();
          const pricing = [...(eventData.pricing || [])];

          if (pricing.length === 0) {
            console.warn("No pricing data found in event document");
          }

          const bookedTicketsForUpdate = ticketSummary.map((ticket) => ({
            type: ticket.type,
            quantity: ticket.quantity,
          }));

          bookedTicketsForUpdate.forEach((bookedTicket) => {
            const ticketIndex = pricing.findIndex(
              (p) => p.ticketType === bookedTicket.type
            );
            if (ticketIndex !== -1) {
              const currentTicket = pricing[ticketIndex];
              const totalSeats = currentTicket.seats || 0;
              const currentBooked = currentTicket.booked || 0;
              const newBookedCount = currentBooked + bookedTicket.quantity;

              if (newBookedCount > totalSeats) {
                throw new Error(
                  `Insufficient seats for ${bookedTicket.type}: ${totalSeats} available, ${newBookedCount} requested`
                );
              }

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

          const totalSeats = pricing.reduce((sum, p) => sum + (p.seats || 0), 0);
          const totalBookedTickets = pricing.reduce(
            (sum, p) => sum + (p.booked || 0),
            0
          );
          const totalAvailableTickets = Math.max(0, totalSeats - totalBookedTickets);

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
        startRedirectTimer();
      } catch (error) {
        console.error("Error booking ticket:", error);

        if (error.message === "TICKET_ALREADY_EXISTS") {
          setTicketIsSaved(true);
          setBookingStatus({
            status: "success",
            message: "Ticket already saved!",
          });
          startRedirectTimer();
          return;
        }

        if (
          error.code === "permission-denied" ||
          error.message.includes("permissions")
        ) {
          if (retryCount < MAX_RETRY_ATTEMPTS) {
            console.log(
              `Permission denied, retrying... (${retryCount + 1}/${MAX_RETRY_ATTEMPTS})`
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
        } else if (error.message.includes("Insufficient seats")) {
          setBookingStatus({
            status: "error",
            message: "Not enough tickets available. Please try again.",
          });
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
      formatEventDateTime,
      startRedirectTimer,
    ]
  );

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

  useEffect(() => {
    const initializeEventData = async () => {
      try {
        if (!event || !event.id) {
          await fetchEventData();
        } else {
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
  }, [eventId, fetchEventData]);

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

  useEffect(() => {
    const handleInitialSetup = async () => {
      try {
        setIsLoading(true);
        setBookingStatus({ status: "pending", message: "Loading..." });

        await new Promise((resolve) => setTimeout(resolve, 500));

        const currentUser = auth.currentUser;
        if (!currentUser) {
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

        let currentEventData = eventData;
        if (!currentEventData || Object.keys(currentEventData).length === 0) {
          console.log("Waiting for event data...");
          currentEventData = await fetchEventData();
        }

        if (currentEventData && Object.keys(currentEventData).length > 0) {
          await fetchEventImage(currentEventData);

          const resolvedEventId =
            eventId || currentEventData.id || currentEventData.eventId;
          if (resolvedEventId) {
            await fetchTicketAvailability(resolvedEventId);
          }

          if (!ticketIsSaved) {
            await saveTicketToDatabase(user);
          } else {
            startRedirectTimer();
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

    if (!ticketIsSaved && !availabilityUpdateInProgress) {
      handleInitialSetup();
    }
  }, [ticketIsSaved, availabilityUpdateInProgress, startRedirectTimer]);

  useEffect(() => {
    return () => {
      clearRedirectTimer();
    };
  }, [clearRedirectTimer]);

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

  const handleDownloadTicket = async () => {
    try {
      setBookingStatus({
        status: bookingStatus.status,
        message: "Preparing your ticket for download...",
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;

      const colors = {
        primary: [25, 174, 220],
        primaryDark: [20, 139, 176],
        background: [248, 250, 252],
        cardBackground: [255, 255, 255],
        textPrimary: [31, 41, 55],
        textSecondary: [107, 114, 128],
        textLight: [156, 163, 175],
        border: [229, 231, 235],
        success: [16, 185, 129],
        accent: [245, 247, 250],
      };

      const setColor = (colorArray) => pdf.setTextColor(...colorArray);
      const setFillColor = (colorArray) => pdf.setFillColor(...colorArray);
      const setDrawColor = (colorArray) => pdf.setDrawColor(...colorArray);

      setFillColor(colors.background);
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

      for (let i = 0; i < 5; i++) {
        const alpha = 0.1 - (i * 0.02);
        const grayValue = 248 + i;
        pdf.setFillColor(grayValue, grayValue, grayValue);
        pdf.rect(0, i * 10, pdfWidth, 8, "F");
      }

      const ticketWidth = pdfWidth - 2 * margin;
      const ticketHeight = 280;
      const startY = 15;

      setFillColor([0, 0, 0, 0.1]);
      pdf.roundedRect(margin + 2, startY + 2, ticketWidth, ticketHeight, 8, 8, "F");

      setFillColor(colors.cardBackground);
      pdf.roundedRect(margin, startY, ticketWidth, ticketHeight, 8, 8, "F");

      setFillColor(colors.primary);
      pdf.roundedRect(margin, startY, ticketWidth, 8, 8, 8, "F");
      pdf.rect(margin, startY + 4, ticketWidth, 4, "F");

      const cutoutY = startY + ticketHeight * 0.35;
      const cutoutSize = 6;

      setDrawColor(colors.border);
      pdf.setLineWidth(0.5);
      pdf.setLineDashPattern([2, 2], 0);
      pdf.line(margin + 15, cutoutY, margin + ticketWidth - 15, cutoutY);
      pdf.setLineDashPattern([], 0);

      setFillColor(colors.background);
      pdf.circle(margin, cutoutY, cutoutSize, "F");
      pdf.circle(margin + ticketWidth, cutoutY, cutoutSize, "F");

      let yOffset = startY + 25;

      setColor(colors.textPrimary);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      const eventName = eventData?.name || "Event";
      pdf.text(eventName, margin + 15, yOffset);

      const eventNameWidth = pdf.getTextWidth(eventName);
      setDrawColor(colors.primary);
      pdf.setLineWidth(1);
      pdf.line(margin + 15, yOffset + 2, margin + 15 + eventNameWidth, yOffset + 2);

      yOffset += 20;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      setColor(colors.textSecondary);

      const detailsStartX = margin + 15;
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      setColor(colors.textPrimary);

      pdf.text("DATE", detailsStartX, yOffset);
      pdf.text("TIME", detailsStartX + 80, yOffset);
      pdf.text("VENUE", detailsStartX + 140, yOffset);

      yOffset += 6;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      setColor(colors.textSecondary);

      pdf.text(formattedDate, detailsStartX, yOffset);
      pdf.text(eventTime, detailsStartX + 80, yOffset);

      const venueText = eventData?.venueDetails?.venueName || event.location || "N/A";
      const venueLines = pdf.splitTextToSize(venueText, 35);
      pdf.text(venueLines, detailsStartX + 140, yOffset);

      yOffset += Math.max(8, venueLines.length * 4) + 15;

      const qrSectionY = yOffset;
      const qrSectionHeight = 70;

      setFillColor(colors.accent);
      setDrawColor(colors.border);
      pdf.setLineWidth(0.5);
      pdf.roundedRect(margin + 15, qrSectionY, ticketWidth - 30, qrSectionHeight, 4, 4, "FD");

      const qrCanvas = qrRef.current?.querySelector("canvas");
      if (qrCanvas) {
        const qrDataUrl = qrCanvas.toDataURL("image/png");
        const qrSize = 40;
        const qrX = margin + 25;
        const qrY = qrSectionY + 15;

        setFillColor(colors.cardBackground);
        setDrawColor(colors.border);
        pdf.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "FD");

        pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
      }

      const detailsX = margin + 80;
      let detailsY = qrSectionY + 20;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      setColor(colors.textPrimary);
      pdf.text("BOOKING ID", detailsX, detailsY);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      setColor(colors.primary);
      pdf.text(bookingId, detailsX, detailsY + 6);
      detailsY += 18;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      setColor(colors.textPrimary);
      pdf.text("TICKETS", detailsX, detailsY);

      const ticketSummaryText = `${totalTickets} Tickets (${ticketSummary
        .map((t) => `${t.type} x${t.quantity}`)
        .join(", ")})`;
      const ticketLines = pdf.splitTextToSize(ticketSummaryText, 90);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      setColor(colors.textSecondary);
      pdf.text(ticketLines, detailsX, detailsY + 6);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      setColor(colors.textLight);
      pdf.text("Present this QR code at", margin + 25, qrSectionY + qrSectionHeight - 8);
      pdf.text("the venue entrance for entry", margin + 25, qrSectionY + qrSectionHeight - 4);

      yOffset = qrSectionY + qrSectionHeight + 20;

      setFillColor(colors.primary);
      pdf.rect(margin + 15, yOffset - 5, ticketWidth - 30, 12, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      setColor(colors.cardBackground);
      pdf.text("ORDER SUMMARY", margin + 20, yOffset + 3);
      yOffset += 15;

      setFillColor(colors.accent);
      pdf.rect(margin + 15, yOffset, ticketWidth - 30, 8, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      setColor(colors.textPrimary);
      pdf.text("ITEM", margin + 20, yOffset + 5);
      pdf.text("QTY", margin + 120, yOffset + 5);
      pdf.text("AMOUNT", margin + 150, yOffset + 5);
      yOffset += 12;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      setColor(colors.textSecondary);

      let rowIndex = 0;
      ticketSummary.forEach((ticket) => {
        if (rowIndex % 2 === 0) {
          setFillColor([252, 252, 252]);
          pdf.rect(margin + 15, yOffset - 2, ticketWidth - 30, 8, "F");
        }

        const itemName = pdf.splitTextToSize(ticket.type, 85);
        pdf.text(itemName, margin + 20, yOffset + 3);
        pdf.text(ticket.quantity.toString(), margin + 120, yOffset + 3);

        const ticketAmount = ticket.price === 0 ? "FREE" : formatCurrency(ticket.price * ticket.quantity);
        pdf.text(ticketAmount, margin + 150, yOffset + 3);

        yOffset += Math.max(8, itemName.length * 4);
        rowIndex++;
      });

      if (foodSummary && foodSummary.length > 0) {
        foodSummary.forEach((food) => {
          if (rowIndex % 2 === 0) {
            setFillColor([252, 252, 252]);
            pdf.rect(margin + 15, yOffset - 2, ticketWidth - 30, 8, "F");
          }

          const itemName = pdf.splitTextToSize(food.name, 85);
          pdf.text(itemName, margin + 20, yOffset + 3);
          pdf.text(food.quantity.toString(), margin + 120, yOffset + 3);
          pdf.text(formatCurrency(food.price * food.quantity), margin + 150, yOffset + 3);

          yOffset += Math.max(8, itemName.length * 4);
          rowIndex++;
        });
      }

      yOffset += 8;

      if (!financial.isFreeEvent) {
        const financialItems = [
          { label: "Convenience Fee", amount: formatCurrency(financial.convenienceFee || 0) },
          ...(financial.discount > 0 ? [{
            label: "Discount",
            amount: `-${formatCurrency(financial.discount || 0)}`,
            isDiscount: true
          }] : []),
          { label: "Tax", amount: formatCurrency(financial.tax || 0) },
        ];

        financialItems.forEach((item) => {
          setColor(item.isDiscount ? colors.success : colors.textSecondary);
          pdf.text(item.label + ":", margin + 100, yOffset);
          pdf.text(item.amount, margin + 150, yOffset);
          yOffset += 5;
        });

        yOffset += 3;

        setDrawColor(colors.border);
        pdf.setLineWidth(1);
        pdf.line(margin + 95, yOffset, margin + ticketWidth - 15, yOffset);
        yOffset += 8;
      }

      setFillColor(colors.primary);
      pdf.roundedRect(margin + 15, yOffset - 3, ticketWidth - 30, 15, 3, 3, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      setColor(colors.cardBackground);
      pdf.text("TOTAL AMOUNT", margin + 20, yOffset + 6);

      const totalAmountText = financial.isFreeEvent ? "FREE" : formatCurrency(financial.totalAmount || 0);
      pdf.text(totalAmountText, margin + ticketWidth - 15, yOffset + 6, { align: "right" });

      yOffset += 25;

      setFillColor(colors.accent);
      pdf.rect(margin + 15, yOffset - 5, ticketWidth - 30, 8, "F");

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      setColor(colors.textPrimary);
      pdf.text("BOOKING INFORMATION", margin + 20, yOffset);
      yOffset += 12;

      const bookingInfo = [
        { label: "Booking Date:", value: `${currentDate} ${currentTime}` },
        { label: "Email:", value: user?.email || "N/A" },
        {
          label: "Phone:",
          value: userProfileData?.phoneNumber || userProfileData?.phone || user?.phone || "N/A",
        },
      ];

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      bookingInfo.forEach((info) => {
        setColor(colors.textPrimary);
        pdf.text(info.label, margin + 20, yOffset);
        setColor(colors.textSecondary);
        pdf.text(info.value, margin + 55, yOffset);
        yOffset += 7;
      });

      yOffset += 15;

      setFillColor([250, 250, 250]);
      pdf.rect(0, yOffset - 8, pdfWidth, 25, "F");

      setDrawColor(colors.border);
      pdf.setLineWidth(0.5);
      pdf.line(0, yOffset - 8, pdfWidth, yOffset - 8);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      setColor(colors.textLight);
      const centerX = pdfWidth / 2;

      pdf.text("🎫 Please present this ticket (digital or printed) at the venue entrance", centerX, yOffset, { align: "center" });
      pdf.text("📞 For support, contact us through the app or visit our website", centerX, yOffset + 5, { align: "center" });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8);
      setColor(colors.primary);
      pdf.text("Powered by Your Event Platform", centerX, yOffset + 12, { align: "center" });

      const cleanBookingId = bookingId.replace("#", "");
      const cleanEventName = (event.name || "Event")
        .replace(/[^a-zA-Z0-9\s]/g, "")
        .replace(/\s+/g, "_");

      pdf.save(`${cleanEventName}_Ticket_${cleanBookingId}.pdf`);

      setBookingStatus({
        status: bookingStatus.status,
        message: "Professional ticket downloaded successfully! ✨",
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
      console.error("Error generating professional ticket:", error);
      alert("There was an error downloading your ticket. Please try again or contact support.");

      setBookingStatus({
        status: bookingStatus.status,
        message: bookingStatus.status === "success" ? "Ticket booked successfully!" : bookingStatus.message,
      });
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        overflowX: "hidden",
      }}
    >
      <Header />

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
            <Button
              color="inherit"
              size="small"
              onClick={handleRetry}
              sx={{ fontFamily: "albert sans" }}
            >
              Retry
            </Button>
          }
        >
          <Typography fontFamily="albert sans">
            {bookingStatus.message}
          </Typography>
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

      <Box
        sx={{
          maxWidth: isMobile ? "100%" : 1000,
          mx: "auto",
          position: "relative",
        }}
      >
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
                <Box
                  sx={{
                    width: "35%",
                    height: "400px",
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
                      height: "90%",
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
                    fontFamily="albert sans"
                    variant="h6"
                    fontWeight="bold"
                    sx={{ borderBottom: "1px solid #000", pb: 1, mb: 2 }}
                  >
                    {eventData?.name || "N/A"}
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
                        fontFamily: "albert sans",
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
                            mb: 1,
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
                              mb: 1,
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
                            mb: 1,
                          }}
                        >
                          <Typography fontFamily="albert sans" variant="body2">
                            Tax
                          </Typography>
                          <Typography
                            fontFamily="albert sans"
                            fontWeight="bold"
                          >
                            {formatCurrency(financial.tax || 0)}
                          </Typography>
                        </Box>
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
                  <Typography
                    variant="body2"
                    fontWeight="medium"
                    fontFamily="albert sans"
                  >
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

        {isMobile && (
          <Box sx={{ width: "90%", mx: "auto", mt: 3 }}>
            <Card
              sx={{
                width: "100%",
                borderRadius: 6,
                height: "770px",
                p: 0,
                overflow: "hidden",
                position: "relative",
              }}
              ref={ticketRef}
            >
              <Box
                sx={{
                  height: "30%",
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
                      maxHeight: 240,
                      borderRadius: 1,
                      objectFit: "cover",
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
                      {eventData?.name || "N/A"}
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

              <Box
                sx={{
                  height: "10%",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
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

                <Divider sx={{ width: "100%", borderStyle: "dashed" }} />
              </Box>

              <Box
                sx={{
                  height: "50%",
                  p: 2,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Box
                  sx={{
                    bgcolor: "#d1d5db4c",
                    p: 1,
                    borderRadius: 2,
                    height: "40%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    mb: 3,
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
                          size={80}
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
                        fontFamily: "albert sans",
                      }}
                      onClick={handleDownloadTicket}
                      disabled={bookingStatus.status === "pending"}
                    >
                      Download Ticket
                    </Button>
                  </Box>
                </Box>

                <Box
                  sx={{
                    height: "55%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ overflow: "auto", height: "90%" }}>
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
                            (total, item) =>
                              total + item.price * item.quantity,
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

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        fontFamily="albert sans"
                        sx={{ fontWeight: 300, fontSize: 12 }}
                      >
                        Tax
                      </Typography>
                      <Typography
                        fontFamily="albert sans"
                        sx={{ fontWeight: 300, fontSize: 12 }}
                      >
                        {formatCurrency(financial.tax || 0)}
                      </Typography>
                    </Box>
                  </Box>

                  <Box
                    sx={{
                      bgcolor: "#d1d5db4c",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      p: 1.5,
                      borderRadius: 1,
                      height: "10%",
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
        )}
      </Box>

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
