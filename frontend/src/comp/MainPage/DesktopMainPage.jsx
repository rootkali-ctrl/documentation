import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Box,
  Select,
  MenuItem,
  Menu,
  Divider,
  Skeleton,
  Modal,
  useEventCallback,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import gsap from "gsap";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import Header from "../Header/MainHeader.js";
import Footer from "../Footer/Footer.js";
import Img from "../photo/baner.png";
import Scroller from "./Scroller/Scroller";
import TextReveal from "./TextReveal/TextReveal";
import Work from "./WhyWorkWithMe/WhyWorkWithMe.js";

import {
  collection,
  getDocs,
  query,
  where,
  limit,
  doc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase_config";
import axios from "axios";
import Slider from "react-slick";
import { useVendor } from "../Vendor/VendorContext";
import { is } from "date-fns/locale";

const EventCard = ({ event, userUID }) => {
  const isMobile = useMediaQuery("(max-width:600px)");
  const navigate = useNavigate();

  const renderPrice = () => {
    if (!event.pricing || event.pricing.length === 0) return "FREE";

    const allFree = event.pricing.every((ticket) => ticket.free === true);
    if (allFree) return "FREE";

    const nonFreeTickets = event.pricing.filter(
      (ticket) => !ticket.free && ticket.price
    );
    if (nonFreeTickets.length > 0) {
      const lowestPrice = Math.min(
        ...nonFreeTickets.map((ticket) => Number(ticket.price) || 0)
      );
      return `₹${lowestPrice}`;
    }

    return "FREE";
  };

  const formatEventDate = (dateString) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;

      const months = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC",
      ];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();

      return { day, month, year };
    } catch (error) {
      console.error("Error formatting event date:", error);
      return null;
    }
  };

  const dateObj = formatEventDate(event.eventDate);

  const formatLocation = () => {
    if (!event.venueDetails) return "Location not specified";

    if (event.venueDetails.isOnline === true) {
      return "Online Event";
    }

    const locationParts = [];
    if (event.venueDetails.venueName)
      locationParts.push(event.venueDetails.venueName);
    if (event.venueDetails.city) locationParts.push(event.venueDetails.city);
    if (
      event.venueDetails.state &&
      event.venueDetails.city !== event.venueDetails.state
    ) {
      locationParts.push(event.venueDetails.state);
    }

    return locationParts.length > 0
      ? locationParts.join(", ")
      : "Location not specified";
  };

  return (
    <Card
      sx={{
        width: isMobile ? "280px" : "320px",
        minHeight: isMobile ? "320px" : "360px", // Add minimum height
        borderRadius: "12px",
        overflow: "hidden",
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        cursor: "pointer",
        transition: "transform 0.2s",
        flexShrink: 0,
        display: "flex", // Add flex display
        flexDirection: "column", // Stack content vertically
        "&:hover": !isMobile
          ? {
              transform: "translateY(-4px)",
              boxShadow: "0 6px 12px rgba(0,0,0,0.1)",
            }
          : null,
      }}
      onClick={() => navigate(`/eventpage/${event.id}/${userUID}`)}
    >
      <Box sx={{ position: "relative" }}>
        <CardMedia
          component="img"
          height={isMobile ? "160" : "180"}
          image={event.imageUrl || Img}
          alt={event.name || "Event"}
          sx={{
            objectFit: "contain",
            width: "100%",
            backgroundColor: "#f5f5f5",
          }}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = Img;
          }}
        />
        {dateObj && (
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              backgroundColor: "#F9C646",
              padding: isMobile ? "4px 8px" : "6px 12px",
              borderTopRightRadius: "8px",
            }}
          >
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{
                fontSize: isMobile ? "10px" : "12px",
                fontFamily: "albert sans",
              }}
            >
              {dateObj.day}
              <sup>
                {dateObj.day === 1
                  ? "st"
                  : dateObj.day === 2
                  ? "nd"
                  : dateObj.day === 3
                  ? "rd"
                  : "th"}
              </sup>{" "}
              {dateObj.month}
              <br />
              {dateObj.year}
            </Typography>
          </Box>
        )}
      </Box>

      <CardContent
        sx={{
          padding: isMobile ? "12px" : "16px",
          flex: 1, // Take remaining space
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <Box sx={{ flex: 1 }}>
          {" "}
          {/* Content section takes available space */}
          <Typography
            variant="body1"
            fontWeight="600"
            sx={{
              maxWidth: "100%",
              overflow: "hidden",
              textOverflow: "ellipsis",
              height: isMobile ? "36px" : "40px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              mb: 1,
              fontSize: isMobile ? "13px" : "15px",
              fontFamily: "albert sans",
            }}
          >
            {event.name || "Event Title"}
          </Typography>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
          >
            <CalendarTodayIcon
              sx={{ fontSize: isMobile ? 12 : 14, color: "text.secondary" }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: isMobile ? "11px" : "12px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                fontFamily: "albert sans",
                whiteSpace: "nowrap",
              }}
            >
              {event.formattedDate || "Date not specified"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
            <LocationOnIcon
              sx={{ fontSize: isMobile ? 12 : 14, color: "text.secondary" }}
            />
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                maxWidth: "100%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: isMobile ? "11px" : "12px",
                fontFamily: "albert sans",
              }}
            >
              {formatLocation()}
            </Typography>
          </Box>
        </Box>

        {/* Button section - always at bottom */}
        <Button
          sx={{
            backgroundColor: "#F5FCFE",
            color: "rgb(25, 174, 220)",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            borderRadius: "8px",
            padding: isMobile ? "6px 10px" : "8px 12px",
            minHeight: isMobile ? "32px" : "36px",
            marginTop: "auto", // Push button to bottom
            "&:hover": {
              backgroundColor: "#E0F5FD",
            },
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: "600",
              fontSize: isMobile ? "11px" : "12px",
              fontFamily: "albert sans",
            }}
          >
            BOOK TICKETS
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontWeight: "600",
              fontSize: isMobile ? "11px" : "12px",
              fontFamily: "albert sans",
            }}
          >
            {renderPrice()}
          </Typography>
        </Button>
      </CardContent>
    </Card>
  );
};

const cityMappings = {
  Coimbatore: ["CBE", "Coimbatore"],
  Chennai: ["Chennai", "CHN"],
  Bangalore: ["Bangalore", "BLR", "Bengaluru"],
  "Tamil Nadu": ["Tamil Nadu", "TN"],
};

const DesktopMainPage = () => {
  const [eventData, setEventData] = useState([]);
  const [unfilteredEventData, setUnfilteredEventData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState("All");
  const [anchorEl, setAnchorEl] = useState(null);
  const [category, setCategory] = useState("All");
  const [error, setError] = useState(null);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  const { setVendorData } = useVendor();
  const isMobile = useMediaQuery("(max-width:600px)");
  const [banners, setBanners] = useState([]);
  const [inlineBanner, setInlineBanner] = useState({ imageUrl: "", link: "" });
  const [userUID, setUserUID] = useState(null);
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const userData = userSnap.data();
            setVendorData({
              username: userData.username || "",
              email: user.email || "",
              password: userData.password || "",
            });

            if (userData.suspended === true) {
              setShowSuspensionModal(true);
            }
            if (window.location.pathname === "/") {
              navigate(`/${user.uid}`, { replace: true });
            }
          }
        } catch (error) {
          console.error("Error checking user data:", error);
        }
      } else {
        setVendorData(null);
      }
    });

    return () => unsubscribe();
  }, [navigate, setVendorData]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setShowSuspensionModal(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  // useEffect(() => {
  //   const fetchBanners = async () => {
  //     try {
  //       const res = await axios.get("http://localhost:8080/api/admin/banners/recent");
  //       setBanners(res.data.banners);

  //       const inlineResponse = await axios.get("http://localhost:8080/api/admin/banners/recent-inline");
  //       const firstInlineBanner = inlineResponse.data.banners[0];
  //       console.log("Inline banner data:", firstInlineBanner);

  //       if (typeof firstInlineBanner === 'object' && firstInlineBanner !== null) {
  //         setInlineBanner(firstInlineBanner);
  //       } else if (typeof firstInlineBanner === 'string') {
  //         setInlineBanner({ imageUrl: firstInlineBanner, link:  });
  //       }

  //     } catch (err) {
  //       console.error("Failed to fetch banners", err);
  //     }
  //   };

  //   fetchBanners();
  // }, []);

  // const handleInlineBannerClick = () => {
  //   if (inlineBanner.link) {
  //     if (inlineBanner.link.startsWith('http://') || inlineBanner.link.startsWith('https://')) {
  //       window.open(inlineBanner.link, '_blank', 'noopener,noreferrer');
  //     } else {
  //       navigate(inlineBanner.link);
  //     }
  //   }
  // };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserUID(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        // Fetch hero banners
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/admin/banners/recent`
        );
        setBanners(res.data.banners);

        // Fetch inline banner
        const inlineResponse = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/admin/banners/recent-inline`
        );
        console.log("Inline response data:", inlineResponse.data);

        // Check if banners array exists and has items
        if (
          inlineResponse.data.banners &&
          inlineResponse.data.banners.length > 0
        ) {
          const firstInlineBanner = inlineResponse.data.banners[0];
          console.log("First inline banner:", firstInlineBanner);

          // Handle different response formats
          if (
            typeof firstInlineBanner === "object" &&
            firstInlineBanner !== null
          ) {
            // New format with imageUrl and redirectUrl
            setInlineBanner({
              imageUrl:
                firstInlineBanner.imageUrl || firstInlineBanner.url || "",
              link: firstInlineBanner.redirectUrl || "",
            });
          } else if (typeof firstInlineBanner === "string") {
            // Old format with just URL string
            setInlineBanner({
              imageUrl: firstInlineBanner,
              link: "#", // Default link
            });
          }
        } else {
          console.log("No inline banners found");
          // Reset to empty state when no banners exist
          setInlineBanner({ imageUrl: "", link: "" });
        }
      } catch (err) {
        console.error("Failed to fetch banners", err);
        // Reset to empty state on error
        setInlineBanner({ imageUrl: "", link: "" });
      }
    };

    fetchBanners();
  }, []);

  // Improved click handler for inline banner
  const handleInlineBannerClick = () => {
    if (!inlineBanner.link || inlineBanner.link === "#") {
      console.log("No valid link for this banner");
      return;
    }

    try {
      // Properly format the URL if it doesn't have a protocol
      let url = inlineBanner.link;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        // Check if it's an internal route or external URL
        if (url.startsWith("/")) {
          // It's an internal route, navigate directly
          navigate(url);
          return;
        } else {
          // It's likely an external URL without protocol, add https
          url = "https://" + url;
        }
      }

      // Open external links in a new tab
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Error handling banner click:", error);
    }
  };

  const debugEventData = async (eventId) => {
    try {
      const eventRef = doc(db, "events", eventId);
      const eventSnap = await getDoc(eventRef);

      if (eventSnap.exists()) {
        const data = eventSnap.data();
        console.log("Direct event data fetch:", data);
        console.log("Event date:", data.eventDate);
        console.log("Event date type:", typeof data.eventDate);
        console.log("Is active:", isEventActive(data.eventDate, data.endDate));

        // Check if it's a Firestore timestamp
        if (
          data.eventDate &&
          typeof data.eventDate === "object" &&
          data.eventDate.toDate
        ) {
          console.log("Firestore timestamp detected:", data.eventDate.toDate());
        }
      } else {
        console.log("Event not found:", eventId);
      }
    } catch (error) {
      console.error("Error debugging event:", error);
    }
  };
  const debugDB = async () => {
    try {
      const eventsRef = collection(db, "events");
      const snapshot = await getDocs(eventsRef);
      console.log("Total events in DB:", snapshot.size);
    } catch (err) {
      console.error("Debug DB error:", err);
    }
  };

  useEffect(() => {
    debugDB();
  }, []);

  const isEventActive = (eventDate, endDate) => {
    if (!eventDate) return false;

    try {
      const currentDate = new Date();
      const eventStartDate = new Date(eventDate);

      // Debug: Log the dates being compared
      console.log("Current Date:", currentDate);
      console.log("Event Start Date:", eventStartDate);
      console.log("Event Date String:", eventDate);

      if (endDate) {
        const eventEndDate = new Date(endDate);
        console.log("Event End Date:", eventEndDate);
        return currentDate <= eventEndDate;
      }

      const eventEndOfDay = new Date(eventStartDate);
      eventEndOfDay.setHours(23, 59, 59, 999);

      console.log("Event End of Day:", eventEndOfDay);
      console.log("Is Active:", currentDate <= eventEndOfDay);

      return currentDate <= eventEndOfDay;
    } catch (error) {
      console.error("Error checking if event is active:", error);
      return false;
    }
  };

  const processEvents = useCallback((querySnapshot) => {
    const eventsData = [];

    console.log("Processing events, total docs:", querySnapshot.size);

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Processing event:", doc.id, data.name);

      // Check if event is active BEFORE processing
      const isActive = isEventActive(data.eventDate, data.endDate);
      console.log(`Event ${doc.id} active status:`, isActive);

      if (!isActive) {
        console.log(`Skipping inactive event: ${doc.id}`);
        return; // Skip inactive events
      }

      // Rest of your event processing logic...
      let formattedDate = "Date not specified";
      if (data.eventDate) {
        try {
          const dateObj = new Date(data.eventDate);
          if (!isNaN(dateObj.getTime())) {
            formattedDate = dateObj.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
          } else {
            console.warn("Invalid date format in DB:", data.eventDate);
          }
        } catch (error) {
          console.error("Error formatting date:", error);
        }
      }

      // Image URL processing with debugging
      let imageUrl = null;
      console.log("Image processing for event:", doc.id);
      console.log("bannerImage:", data.bannerImage);
      console.log("bannerImages:", data.bannerImages);
      console.log("mediaLink:", data.mediaLink);

      if (
        data.bannerImage &&
        typeof data.bannerImage === "string" &&
        data.bannerImage.trim() !== ""
      ) {
        imageUrl = data.bannerImage;
      } else if (
        data.bannerImages &&
        Array.isArray(data.bannerImages) &&
        data.bannerImages.length > 0
      ) {
        const validImages = data.bannerImages.filter(
          (img) => img && typeof img === "string" && img.trim() !== ""
        );
        if (validImages.length > 0) {
          imageUrl = validImages[0];
        }
      } else if (
        data.mediaLink &&
        typeof data.mediaLink === "string" &&
        data.mediaLink.trim() !== ""
      ) {
        imageUrl = data.mediaLink;
      }

      console.log("Final imageUrl for event:", doc.id, imageUrl);

      // Process pricing
      let isFree = true;
      let lowestPrice = 0;

      if (data.pricing && data.pricing.length > 0) {
        const pricingArray = Array.isArray(data.pricing)
          ? data.pricing
          : Object.values(data.pricing);

        const validPricing = pricingArray.filter(
          (option) =>
            option &&
            typeof option === "object" &&
            "free" in option &&
            "price" in option
        );

        if (validPricing.length > 0) {
          const paidOptions = validPricing.filter((option) => {
            const isFreeOption = option.free === true || option.free === "true";
            return !isFreeOption && option.price;
          });

          isFree = paidOptions.length === 0;

          if (!isFree && paidOptions.length > 0) {
            const prices = paidOptions
              .map((option) => Number(option.price) || 0)
              .filter((price) => price > 0);
            lowestPrice = prices.length > 0 ? Math.min(...prices) : 0;
          }
        }
      }

      // Process location
      let locationStr = "Location not specified";
      let isOnline = false;

      if (data.venueDetails) {
        const locationParts = [];

        isOnline =
          data.venueDetails.isOnline === true ||
          data.venueDetails.isOnline === "true";

        if (isOnline) {
          locationStr = "Online Event";
        } else {
          if (data.venueDetails.venueName)
            locationParts.push(data.venueDetails.venueName);
          if (data.venueDetails.city)
            locationParts.push(data.venueDetails.city);
          if (
            data.venueDetails.state &&
            data.venueDetails.city !== data.venueDetails.state
          ) {
            locationParts.push(data.venueDetails.state);
          }

          locationStr =
            locationParts.length > 0
              ? locationParts.join(", ")
              : "Location not specified";
        }
      }

      // Process categories
      let categories = [];
      if (data.category) {
        if (Array.isArray(data.category)) {
          categories = data.category;
        } else if (typeof data.category === "object") {
          categories = Object.values(data.category);
        } else if (typeof data.category === "string") {
          categories = [data.category];
        }
      }

      const eventObj = {
        id: doc.id,
        name: data.name || "Event Title",
        formattedDate: formattedDate,
        eventDate: data.eventDate || "",
        endDate: data.endDate || "",
        location: locationStr,
        imageUrl: imageUrl,
        pricing: Array.isArray(data.pricing)
          ? data.pricing
          : typeof data.pricing === "object"
          ? Object.values(data.pricing)
          : [],
        free: isFree,
        price: lowestPrice,
        description: data.description || "",
        category: categories,
        isOnline: isOnline,
        venueDetails: data.venueDetails || {},
        speaker: Array.isArray(data.speaker)
          ? data.speaker
          : typeof data.speaker === "object"
          ? Object.values(data.speaker)
          : [],
        perks: Array.isArray(data.perks)
          ? data.perks
          : typeof data.perks === "object"
          ? Object.values(data.perks)
          : [],
      };

      console.log("Adding event to array:", eventObj);
      eventsData.push(eventObj);
    });

    // Sort events by date
    eventsData.sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate) - new Date(b.eventDate);
    });

    console.log("Final processed events:", eventsData.length);
    console.log(
      "Event IDs:",
      eventsData.map((e) => e.id)
    );

    return eventsData;
  }, []);

  useEffect(() => {
    const fetchUnfilteredEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching unfiltered events for 'Events made for Youu!!'");

        const baseCollection = collection(db, "events");
        let eventsQuery = query(baseCollection, limit(50));

        const querySnapshot = await getDocs(eventsQuery);
        console.log("Unfiltered query returned events:", querySnapshot.size);

        if (querySnapshot.empty) {
          console.log("No unfiltered events found");
        }

        const eventsData = processEvents(querySnapshot);
        console.log("Active unfiltered events processed:", eventsData.length);

        setUnfilteredEventData(eventsData);
      } catch (error) {
        console.error("Error fetching unfiltered events:", error);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnfilteredEvents();
  }, [processEvents]); // Add processEvents to the dependency array

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching events with filters:", { location, category });

        const baseCollection = collection(db, "events");
        let eventsQuery = baseCollection;

        if (location && location !== "All") {
          const locationValues = cityMappings[location] || [location];

          if (locationValues.length === 1) {
            eventsQuery = query(
              baseCollection,
              where("venueDetails.city", "==", locationValues[0])
            );
          } else {
            eventsQuery = query(
              baseCollection,
              where("venueDetails.city", "in", locationValues)
            );
          }

          console.log("Location filter values:", locationValues);
        }

        if (
          category !== "All" &&
          category !== "For you" &&
          category !== "Today" &&
          category !== "This weekend" &&
          category !== "This month" &&
          category !== "Free" &&
          category !== "Paid" &&
          category !== "Online"
        ) {
          eventsQuery = query(
            eventsQuery,
            where("category", "array-contains", category)
          );
          console.log("Applied category filter:", category);
        }

        if (category === "Online") {
          eventsQuery = query(
            eventsQuery,
            where("venueDetails.isOnline", "==", true)
          );
          console.log("Applied Online filter in query");
        }

        eventsQuery = query(eventsQuery, limit(50));

        const querySnapshot = await getDocs(eventsQuery);
        console.log("Filtered query returned events:", querySnapshot.size);

        if (querySnapshot.empty) {
          console.log("No events found with current filters");
        }

        let eventsData = processEvents(querySnapshot);
        console.log("Active filtered events processed:", eventsData.length);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let filteredEvents = [...eventsData];

        if (category === "Today") {
          filteredEvents = filteredEvents.filter((event) => {
            if (!event.eventDate) return false;
            try {
              const eventDate = new Date(event.eventDate);
              return eventDate.toDateString() === today.toDateString();
            } catch (err) {
              console.error("Date filtering error:", err);
              return false;
            }
          });
          console.log("After Today filter:", filteredEvents.length);
        } else if (category === "This weekend") {
          const friday = new Date(today);
          friday.setDate(today.getDate() + ((5 - today.getDay() + 7) % 7));
          friday.setHours(0, 0, 0, 0);

          const sunday = new Date(friday);
          sunday.setDate(friday.getDate() + 2);
          sunday.setHours(23, 59, 59, 999);

          filteredEvents = filteredEvents.filter((event) => {
            if (!event.eventDate) return false;
            try {
              const eventDate = new Date(event.eventDate);
              return eventDate >= friday && eventDate <= sunday;
            } catch (err) {
              console.error("Weekend filtering error:", err);
              return false;
            }
          });
          console.log("After Weekend filter:", filteredEvents.length);
        } else if (category === "This month") {
          const firstDayOfMonth = new Date(
            today.getFullYear(),
            today.getMonth(),
            1
          );
          const lastDayOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
            23,
            59,
            59,
            999
          );

          filteredEvents = filteredEvents.filter((event) => {
            if (!event.eventDate) return false;
            try {
              const eventDate = new Date(event.eventDate);
              return (
                eventDate >= firstDayOfMonth && eventDate <= lastDayOfMonth
              );
            } catch (err) {
              console.error("Month filtering error:", err);
              return false;
            }
          });
          console.log("After Month filter:", filteredEvents.length);
        }

        if (category === "Free") {
          filteredEvents = filteredEvents.filter((event) => event.free);
          console.log("After Free filter:", filteredEvents.length);
        } else if (category === "Paid") {
          filteredEvents = filteredEvents.filter((event) => !event.free);
          console.log("After Paid filter:", filteredEvents.length);
        }

        if (category === "Online") {
          filteredEvents = filteredEvents.filter((event) => event.isOnline);
          console.log("After Online filter (fallback):", filteredEvents.length);
        }

        setEventData(filteredEvents);
      } catch (error) {
        console.error("Error fetching filtered events:", error);
        setError("Failed to load events. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [location, category, processEvents]); // Add processEvents to the dependency array

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    handleClose();
  };

  const handleRefresh = () => {
    setLoading(true);
    setLocation("All");
    setCategory("All");
  };

  const EventSkeleton = () => (
    <Box>
      <Skeleton
        variant="rectangular"
        width="100%"
        height={180}
        sx={{ borderRadius: "12px 12px 0 0" }}
      />
      <Box sx={{ p: 2 }}>
        <Skeleton variant="text" width="100%" height={24} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton variant="text" width="100%" height={20} />
        <Skeleton
          variant="rectangular"
          width="100%"
          height={36}
          sx={{ mt: 1, borderRadius: "8px" }}
        />
      </Box>
    </Box>
  );

  const settings = {
    dots: true,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
    arrows: true,
    centerMode: false,
    centerPadding: "0px",
  };

  return (
    <Box sx={{ overflowX: "hidden", overflowY: "hidden" }}>
      <Header />
      <Box sx={{ overflowX: "hidden" }}>
        <Box sx={{ padding: isMobile ? 1.5 : 3 }}>
          <Box
            sx={{
              width: "100%",
              overflowX: "hidden",
              overflowY: "hidden",
              height: isMobile ? "auto" : "auto",
            }}
          >
            <Slider {...settings}>
              {banners.map((url, idx) => (
                <Card
                  key={idx}
                  sx={{
                    borderRadius: "12px",
                    overflow: "hidden",
                    height: !isMobile ? "500px" : "200px",
                    width: "100vw",
                  }}
                >
                  <CardMedia
                    component="div"
                    sx={{
                      //height: isMobile ? "30vh" : "60vh",
                      backgroundImage: `url(${url})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      position: "relative",
                      height: !isMobile ? "500px" : "200px",
                      objectFit: "cover",
                      width: "100vw",
                    }}
                  />
                </Card>
              ))}
            </Slider>
          </Box>

          <Typography
            variant="h5"
            sx={{
              mt: 5,
              mb: 2,
              fontWeight: "600",
              fontSize: { xs: 20, md: 24 },
              fontFamily: "albert sans",
            }}
          >
            Events made for Youu!!
          </Typography>
        </Box>

        {/* Event Section */}
        <Box sx={{ px: isMobile ? 2 : 4 }}>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                overflowX: "auto",
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
                gap: 2,
                pb: 3,
              }}
            >
              {[1, 2, 3, 4, 5].map((item) => (
                <Box
                  key={`filter-${item}`}
                  sx={{ minWidth: { xs: 250, sm: 320 } }}
                >
                  <EventSkeleton />
                </Box>
              ))}
            </Box>
          ) : error ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                variant="h6"
                color="error"
                sx={{ fontFamily: "albert sans" }}
              >
                {error}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2, fontFamily: "albert sans" }}
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </Box>
          ) : unfilteredEventData.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontFamily: "albert sans" }}
              >
                No active events found
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mb: 2, fontFamily: "albert sans" }}
              >
                Check back later for more events
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                overflowX: "auto",
                scrollbarWidth: "none", // Firefox
                "&::-webkit-scrollbar": {
                  display: "none", // Chrome, Safari, Edge
                },
                gap: 2,
                pb: 3,
              }}
            >
              {unfilteredEventData.map((event, index) => (
                <EventCard key={index} event={event} userUID={userUID} />
              ))}
            </Box>
          )}
        </Box>

        {/* Inline Banner */}
         <Box sx={{
      width: "100%",
      maxWidth: "100vw",
      margin: '4em auto',
      padding: '0 8px',
      boxSizing: 'border-box'
    }}>
      {inlineBanner?.imageUrl ? (
        <Card
          sx={{
            width: '100%',
            aspectRatio: '8/1',
            height: {lg:'120px',md:'95px',sm:'80px',xs:'35px'}, 
            maxHeight: '200px',
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'pointer',
            backgroundImage: `url(${inlineBanner.imageUrl})`,
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: {md:'cover',sm:'contain',xs:'contain'},
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease'
          }}
          onClick={handleInlineBannerClick}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.01)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        />
      ) : (
        <hr style={{ 
          marginTop: '2rem', 
          border: 'none', 
          borderTop: '1px solid #e0e0e0' 
        }} />
      )}
    </Box>
          

        {/* Filter Section */}
        <Box sx={{ px: isMobile ? 2 : 4 }}>
          <Box display="flex" alignItems="center" mb={0} mt={2} flexWrap="wrap">
            <Typography
              variant="h6"
              sx={{
                fontWeight: "bold",
                mr: 1,
                fontFamily: "albert sans",
                color: "#2E2E3A",
                fontSize: { xs: 18, md: 22 },
              }}
            >
              Filter Active Events in
            </Typography>

            <Select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              displayEmpty
              sx={{
                fontWeight: "bold",
                fontFamily: "albert sans",
                color: "rgb(25, 174, 220)",
                "& .MuiSelect-icon": { color: "rgb(25, 174, 220)" },
                "& .MuiOutlinedInput-notchedOutline": { border: "none" },
              }}
              IconComponent={ExpandMoreIcon}
            >
              {["All", "Coimbatore", "Chennai", "Bangalore", "Tamil Nadu"].map(
                (loc) => (
                  <MenuItem
                    key={loc}
                    value={loc}
                    sx={{ fontFamily: "albert sans" }}
                  >
                    {loc === "All" ? "All Locations" : loc}
                  </MenuItem>
                )
              )}
            </Select>
          </Box>

          <Box
            sx={{
              mb: 3,
              overflowX: "auto",
              whiteSpace: "nowrap",
              display: "flex",
            }}
          >
            <Button
              onClick={handleClick}
              variant="contained"
              endIcon={<ExpandMoreIcon />}
              sx={{
                mr: 1,
                mb: 1,
                backgroundColor:
                  category === "All" ? "rgb(25, 174, 220)" : "#F5F5F5",
                color: category === "All" ? "white" : "#333",
                "&:hover": {
                  backgroundColor: category === "All" ? "#4AA0D5" : "#E5E5E5",
                },
                fontFamily: "albert sans",
              }}
            >
              {category}
            </Button>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleClose}
              PaperProps={{
                style: {
                  maxHeight: 300,
                  width: 200,
                },
              }}
            >
              {[
                "All",
                "Today",
                "This weekend",
                "This month",
                "Free",
                "Paid",
                "Online",
                "Comedy",
                "Music",
                "Food & Drinks",
                "Sports",
                "Festive",
                "Business",
                "Technology",
                "Dance",
                "Health",
                "Educational",
              ].map((cat) => (
                <MenuItem
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  sx={{ fontFamily: "albert sans" }}
                >
                  {cat}
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Filtered Events */}
          {loading ? (
            <Box
              sx={{
                display: { xs: "flex", sm: "grid" },
                flexDirection: "row",
                overflowX: { xs: "auto", sm: "unset" },
                gap: 2,
                gridTemplateColumns: {
                  sm: "repeat(auto-fill, minmax(250px, 1fr))",
                },
                mb: 3,
              }}
            >
              {[1, 2, 3, 4].map((item) => (
                <Box
                  key={`filter-${item}`}
                  sx={{ minWidth: { xs: 250, sm: "unset" } }}
                >
                  <EventSkeleton />
                </Box>
              ))}
            </Box>
          ) : error ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                variant="h6"
                color="error"
                sx={{ fontFamily: "albert sans" }}
              >
                {error}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                sx={{ mt: 2, fontFamily: "albert sans" }}
                onClick={handleRefresh}
              >
                Try Again
              </Button>
            </Box>
          ) : eventData.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{ fontFamily: "albert sans" }}
              >
                No events found with the selected filters
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mb: 2, fontFamily: "albert sans" }}
              >
                Try adjusting your filters or check back later
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setLocation("All");
                  setCategory("All");
                }}
                sx={{ fontFamily: "albert sans", bgcolor: "#19AEDC" }}
              >
                View All Events
              </Button>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "row",
                overflowX: "auto",
                scrollbarWidth: "none", // Firefox
                "&::-webkit-scrollbar": {
                  display: "none", // Chrome, Safari, Edge
                },
                gap: 2,
                pb: 3,
              }}
            >
              {eventData.map((event, index) => (
                <Box
                  key={`filtered-${index}`}
                  sx={{
                    minWidth: { xs: 280, sm: "unset" }, // Ensure minimum width on mobile
                    flexShrink: 0, // Prevent shrinking on mobile
                  }}
                >
                  <EventCard event={event} userUID={userUID} />
                </Box>
              ))}
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 0 }} />
      </Box>
      {!isMobile && <Footer />}

      {/* Suspension Modal */}
      <Modal open={showSuspensionModal} onClose={() => {}}>
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            backdropFilter: "blur(5px)",
          }}
        >
          <Box
            sx={{
              width: "90%",
              maxWidth: 400,
              backgroundColor: "#fff",
              padding: "2rem",
              borderRadius: "12px",
              boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
              textAlign: "center",
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              mb={2}
              color="error"
              sx={{ fontSize: "24px", fontFamily: "albert sans" }}
            >
              Account Suspended
            </Typography>

            <Typography
              variant="body1"
              mb={3}
              sx={{ fontFamily: "albert sans" }}
            >
              Your account has been suspended by the admin. To reactivate your
              account, please contact the admin via email at:
            </Typography>

            <Typography
              variant="body1"
              fontWeight="bold"
              mb={3}
              sx={{ color: "#19AEDC", fontFamily: "albert sans" }}
            >
              sharveshraj@snippetscript.com
            </Typography>

            <Button
              fullWidth
              variant="contained"
              sx={{
                bgcolor: "#19AEDC",
                color: "#fff",
                py: 1.5,
                borderRadius: "10px",
                fontFamily: "albert sans",
              }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};

export default DesktopMainPage;
