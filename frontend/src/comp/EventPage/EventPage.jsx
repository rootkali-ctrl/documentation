import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  CardMedia,
  CircularProgress,
  Divider,
  Menu,
  MenuItem,
  IconButton,
  Snackbar,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useMediaQuery,
} from "@mui/material";
import Footer from "../Footer/Footer.js";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import ShareIcon from "@mui/icons-material/Share";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailIcon from "@mui/icons-material/Email";
import eventImg from "./assets/event.jpg"; // Fallback image
import Header from "../Header/MainHeaderWOS";
import { useNavigate, useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";
import { db } from "../../firebase_config";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Custom Arrow Components for Slider
const PrevArrow = ({ className, style, onClick }) => (
  <Box
    className={className}
    sx={{
      ...style,
      display: "block",
      background: "#19AEDC",
      borderRadius: "50%",
      width: "30px",
      height: "30px",
      zIndex: 1,
      left: "10px",
      "&:before": { display: "none" },
      "&:hover": { background: "#1789AE" },
    }}
    onClick={onClick}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M15 18L9 12L15 6"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  </Box>
);

const NextArrow = ({ className, style, onClick }) => (
  <Box
    className={className}
    sx={{
      ...style,
      display: "block",
      background: "#19AEDC",
      borderRadius: "50%",
      width: "30px",
      height: "30px",
      zIndex: 1,
      right: "10px",
      "&:before": { display: "none" },
      "&:hover": { background: "#1789AE" },
    }}
    onClick={onClick}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M9 18L15 12L9 6"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Box>
  </Box>
);

const EventPage = () => {
  const navigate = useNavigate();
  const { eventId, userUID } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const shareTextRef = useRef(null);
  const [paddingBottom, setPaddingBottom] = useState(10);
  const [youtubeVideoId, setYoutubeVideoId] = useState("");

  const extractYoutubeId = (url) => {
    if (!url) return null;
    const regExp =
      /^.*(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11}).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };

  // Function to check if event should be shown based on eventHost date
  const shouldShowEvent = (eventHostDate) => {
    if (!eventHostDate) {
      return true; // If no eventHost date, show the event (backward compatibility)
    }

    try {
      const currentDate = new Date();
      const hostDate = new Date(eventHostDate);
      return currentDate >= hostDate; // Show event only after host date has passed
    } catch (error) {
      console.error("Error checking eventHost date:", error);
      return true; // If error in parsing, show the event
    }
  };

  // Function to check if event is still active (not expired)
  const isEventActive = (eventDate, endDate) => {
    if (!eventDate) return false;

    try {
      const currentDate = new Date();

      // If endDate is provided, use it (for multi-day events)
      if (endDate) {
        const eventEndDate = new Date(endDate);
        return currentDate <= eventEndDate;
      }

      // For single events, check against the exact start time
      const eventStartDate = new Date(eventDate);
      return currentDate <= eventStartDate;
    } catch (error) {
      console.error("Error checking if event is active:", error);
      return false;
    }
  };

  // Process events function (same logic as DesktopMainPage)
  const processEvents = (querySnapshot, excludeEventId = null) => {
    const eventsData = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Skip the current event
      if (excludeEventId && doc.id === excludeEventId) {
        return;
      }

      // First check if event should be shown based on eventHost date
      const shouldShow = shouldShowEvent(data.eventHost);
      if (!shouldShow) {
        return; // Skip events that haven't reached their host date
      }

      // Then check if event is still active (not expired)
      const isActive = isEventActive(data.eventDate, data.endDate);
      if (!isActive) {
        return; // Skip inactive events
      }

      // Format date
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
          }
        } catch (error) {
          console.error("Error formatting date:", error);
        }
      }

      // Image URL processing
      let imageUrl = null;
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

      // Process location
      let locationStr = "Location not specified";
      if (data.venueDetails) {
        const locationParts = [];
        const isOnline =
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

      const eventObj = {
        id: doc.id,
        title: data.name || "Event Title",
        date: formattedDate,
        location: locationStr,
        img: imageUrl || eventImg,
        eventDate: data.eventDate,
        endDate: data.endDate,
        eventHost: data.eventHost,
        venueDetails: data.venueDetails || {},
        category: data.category || [],
      };

      eventsData.push(eventObj);
    });

    // Sort events by date
    eventsData.sort((a, b) => {
      if (!a.eventDate) return 1;
      if (!b.eventDate) return -1;
      return new Date(a.eventDate) - new Date(b.eventDate);
    });

    return eventsData;
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const eventDoc = await getDoc(doc(db, "events", eventId));

        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          console.log("Fetching event details for:", eventDoc.id);
          setEvent({
            id: eventDoc.id,
            ...eventData,
          });

          if (eventData.mediaLink) {
            const videoId = extractYoutubeId(eventData.mediaLink);
            setYoutubeVideoId(videoId);
          }

          // Fetch live events using the same logic as DesktopMainPage
          await fetchLiveEvents();
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveEvents = async () => {
      try {
        console.log("Fetching live events for 'Events You May Like'");

        const eventsRef = collection(db, "events");
        // Get more events initially to have options after filtering
        const q = query(eventsRef, limit(10));

        const querySnapshot = await getDocs(q);
        console.log("Live events query returned events:", querySnapshot.size);

        if (querySnapshot.empty) {
          console.log("No events found in live events query");
          setLiveEvents([]);
          return;
        }

        // Process events with the same logic as DesktopMainPage
        const eventsData = processEvents(querySnapshot, eventId);
        console.log("Active live events processed:", eventsData.length);

        // Take only first 3 events for display
        const limitedEvents = eventsData.slice(0, 3);
        setLiveEvents(limitedEvents);

        console.log("Final live events to display:", limitedEvents.length);
        console.log("Live events:", limitedEvents.map(e => ({ id: e.id, title: e.title })));
      } catch (error) {
        console.error("Error fetching live events:", error);
        setLiveEvents([]);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;
      setPaddingBottom(isScrollingDown ? 20 : 2);
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [eventId, navigate]);

  const formatDateTime = (dateString) => {
    if (!dateString) return "Date and time not specified";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const getTicketPrice = (pricing) => {
    if (!pricing || pricing.length === 0) return "FREE";
    const paidTickets = pricing.filter((ticket) => ticket.free === false && ticket.price);
    if (paidTickets.length === 0) return "FREE";
    const lowestPrice = Math.min(...paidTickets.map((ticket) => ticket.price));
    return `₹${lowestPrice}`;
  };

  const getEventCapacity = (pricing) => {
    if (!pricing || pricing.length === 0) return "Not specified";
    const totalCapacity = pricing.reduce((sum, ticket) => sum + (ticket.seats || 0), 0);
    return `${totalCapacity} Attendees`;
  };

  const getSpeakers = (speakersData) => {
    if (!speakersData || speakersData.length === 0) return [];
    return speakersData.map((speaker) => ({
      name: speaker.name || "Speaker",
      title: speaker.role || "Speaker",
      img: speaker.imageUrl || "",
    }));
  };

  const getFAQs = (faqData) => {
    if (!faqData || faqData.length === 0) return [];
    return faqData.map((faq) => ({
      question: faq.question || "",
      answer: faq.answer || "",
    }));
  };

  const handlePlayVideo = () => {
    if (event?.mediaLink) {
      window.open(event.mediaLink, "_blank");
    }
  };

  const handleShareClick = (event) => {
    setShareAnchorEl(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
  };

  const handleDialogClose = () => {
    setShowShareDialog(false);
  };

  const getShareUrl = () => {
    return window.location.href;
  };

  const copyToClipboard = () => {
    const shareUrl = getShareUrl();
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        setSnackbarMessage("Link copied to clipboard!");
        setSnackbarOpen(true);
        handleShareClose();
      })
      .catch((err) => {
        console.error("Failed to copy text: ", err);
        setShowShareDialog(true);
        handleShareClose();
        setTimeout(() => {
          if (shareTextRef.current) {
            shareTextRef.current.select();
            document.execCommand("copy");
            setSnackbarMessage("Link copied to clipboard!");
            setSnackbarOpen(true);
          }
        }, 100);
      });
  };

  const shareVia = (platform) => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const eventTitle = encodeURIComponent(event?.name || "Check out this event");
    let shareLink = "";
    switch (platform) {
      case "facebook":
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`;
        break;
      case "twitter":
        shareLink = `https://twitter.com/intent/tweet?text=${eventTitle}&url=${shareUrl}`;
        break;
      case "linkedin":
        shareLink = `https://www.linkedin.com/shareArticle?mini=true&url=${shareUrl}&title=${eventTitle}`;
        break;
      case "whatsapp":
        shareLink = `https://api.whatsapp.com/send?text=${eventTitle}%20${shareUrl}`;
        break;
      case "email":
        shareLink = `mailto:?subject=${eventTitle}&body=Check%20out%20this%20event:%20${shareUrl}`;
        break;
      default:
        break;
    }
    if (shareLink) {
      window.open(shareLink, "_blank");
    }
    handleShareClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    adaptiveHeight: false,
    autoplay: true,
    autoplaySpeed: 5000,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f9f9f9",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!event) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="h5" sx={{ fontFamily: "albert sans" }}>
          Event not found
        </Typography>
      </Box>
    );
  }

  const speakers = getSpeakers(event.speaker || []);
  const faqs = getFAQs(event.FAQ || []);
  const tagsList = event.tags ? event.tags.split(",").map((tag) => tag.trim()) : [];

  return (
    <Box sx={{ margin: 0 }}>
      <Header />
      <Box
        sx={{
          display: "flex",
          gap: 3,
          padding: "20px 2%",
          flexDirection: { xs: "column", md: "row" },
          mt: 0,
          pt: isMobile ? 1 : 4,
          backgroundColor: "#f9f9f9",
          width: "96%",
        }}
      >
        <Box sx={{ flex: 2, width: { lg: "80%", md: "70%", sm: "100%" } }}>
          <Card
            sx={{
              borderRadius: "20px",
              boxShadow: "none",
              position: "relative",
              width: { lg: "800px", md: "100%", xs: "100%", sm: "100%" },
              margin: "0 auto",
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: { lg: "800px", md: "100%", xs: "100%", sm: "100%" },
              }}
            >
              <CardMedia
                component="img"
                image={event.bannerImages?.[1] || eventImg}
                alt={event.name}
                sx={{
                  width: { lg: "800px", md: "100%", xs: "100%", sm: "100%" },
                  height: isMobile ? "150px" : "300px",
                  objectFit: { lg: "cover", md: "cover", sm: "cover", xs: "cover" },
                }}
              />
              {isMobile && (
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 10,
                    right: 10,
                    backgroundColor: "white",
                    borderRadius: "50%",
                    width: 36,
                    height: 36,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    cursor: "pointer",
                    border: "1px solid",
                    borderColor: "rgb(25, 174, 220)",
                  }}
                  onClick={handleShareClick}
                >
                  <ShareIcon fontSize="small" sx={{ color: "rgb(25, 174, 220)" }} />
                </Box>
              )}
            </Box>
          </Card>
          <Card
            sx={{
              mt: isMobile ? 1 : 3,
              borderRadius: "20px",
              boxShadow: "none",
              width: isMobile ? "100%" : null,
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "20px" : "24px",
                  fontFamily: "albert sans",
                }}
              >
                {event.name || "Event Title"}
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: isMobile ? 0.5 : 1,
                  my: isMobile ? 1 : 2,
                  flexWrap: "wrap",
                }}
              >
                {event.category &&
                  event.category.map((cat, index) => (
                    <Chip
                      key={index}
                      label={cat}
                      sx={{
                        backgroundColor: "#DBEAFE",
                        color: "#19AEDC",
                        fontSize: isMobile ? "12px" : "14px",
                        fontFamily: "albert sans",
                      }}
                    />
                  ))}
              </Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
              >
                About the Event
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mb: isMobile ? 0.5 : 1,
                  whiteSpace: "pre-line",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  fontFamily: "albert sans",
                }}
              >
                {event.description || "No description available for this event."}
              </Typography>
              {event.perks && event.perks.length > 0 && (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      mt: isMobile ? 1 : 2,
                      fontFamily: "albert sans",
                    }}
                  >
                    Event Perks
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                    {event.perks.map((perk, index) => (
                      <Chip
                        key={index}
                        label={`${perk.itemName} (${perk.limit})`}
                        sx={{ backgroundColor: "#F0F9FF", color: "#475569" }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
          <Card
            sx={{
              mt: isMobile ? 1 : 3,
              borderRadius: "20px",
              boxShadow: "none",
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "20px" : "24px",
                  fontFamily: "albert sans",
                }}
              >
                Location
              </Typography>
              {event.venueDetails?.gmapLink ? (
                <iframe
                  width="100%"
                  height="300"
                  frameBorder="0"
                  style={{ border: 0, borderRadius: "10px", marginTop: "15px" }}
                  src={event.venueDetails.gmapLink}
                  allowFullScreen
                ></iframe>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "300px",
                    backgroundColor: "#E5E7EB",
                    borderRadius: "10px",
                    marginTop: "15px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography sx={{ fontFamily: "albert sans" }}>
                    Map not available
                  </Typography>
                </Box>
              )}
              <Typography
                color="text.secondary"
                sx={{
                  fontSize: isMobile ? "14px" : "18px",
                  mt: isMobile ? 1 : 2,
                  fontFamily: "albert sans",
                }}
              >
                {event.venueDetails
                  ? (() => {
                      const { streetName, area, city, state, pincode } = event.venueDetails;
                      const parts = [];
                      if (streetName) parts.push(streetName);
                      if (area) parts.push(area);
                      if (city && pincode) {
                        parts.push(`${city} - ${pincode}`);
                      } else if (city) {
                        parts.push(city);
                      } else if (pincode) {
                        parts.push(pincode);
                      }
                      if (state) parts.push(state);
                      return parts.length > 0 ? parts.join(", ") : "Address not provided";
                    })()
                  : "Address not provided"}
              </Typography>
            </CardContent>
          </Card>
          <Card
            sx={{
              mt: isMobile ? 1 : 3,
              borderRadius: "20px",
              boxShadow: "none",
              width: "100%",
            }}
          >
            <CardContent
              sx={{
                maxWidth: !isMobile ? "900px" : "400px",
                width: !isMobile ? "100%" : "90%",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile ? "20px" : "24px",
                  fontFamily: "albert sans",
                }}
              >
                FAQs
              </Typography>
              {faqs.length > 0 ? (
                faqs.map((faq, index) => (
                  <Box key={index} sx={{ mt: 2 }}>
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: isMobile ? "16px" : "18px",
                        fontFamily: "albert sans",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                      }}
                    >
                      {faq.question}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      mt={1}
                      sx={{
                        fontSize: isMobile ? "14px" : "16px",
                        fontFamily: "albert sans",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        lineHeight: 1.6,
                      }}
                    >
                      {faq.answer}
                    </Typography>
                    {index < faqs.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))
              ) : (
                <Typography
                  color="text.secondary"
                  mt={1}
                  sx={{ fontFamily: "albert sans" }}
                >
                  No FAQs available for this event
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: 1, mt: isMobile ? -2 : 0, width: { lg: "20%", md: "30%", sm: "100%" } }}>
          <Card sx={{ borderRadius: "20px", boxShadow: "none" }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <EventIcon />
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Date & Time
                  </Typography>
                  <Typography sx={{ fontWeight: "bold", fontFamily: "albert sans" }}>
                    {formatDateTime(event.eventDate)}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                <LocationOnIcon />
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Location
                  </Typography>
                  <Typography sx={{ fontWeight: "bold", fontFamily: "albert sans" }}>
                    {event.venueDetails?.venueName || "Venue not specified"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PeopleIcon />
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Capacity
                  </Typography>
                  <Typography sx={{ fontWeight: "bold", fontFamily: "albert sans" }}>
                    {getEventCapacity(event.pricing)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          {!isMobile && (
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate(`/ticketpricepage/${eventId}/${userUID}`)}
              sx={{
                mt: 3,
                backgroundColor: "#19AEDC",
                color: "#FFFFFF",
                borderRadius: "8px",
                padding: "12px",
                textTransform: "none",
                fontSize: "16px",
                fontFamily: "albert sans",
                "&:hover": {
                  backgroundColor: "#1789AE",
                },
              }}
            >
              Get Tickets
            </Button>
          )}
          {!isMobile && (
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ShareIcon />}
              onClick={handleShareClick}
              sx={{
                mt: 2,
                fontFamily: "albert sans",
                borderColor: "#19AEDC",
                color: "#19AEDC",
                borderRadius: "8px",
                padding: "12px",
                textTransform: "none",
                fontSize: "16px",
                "&:hover": {
                  borderColor: "#1789AE",
                  backgroundColor: "rgba(25, 174, 220, 0.04)",
                },
              }}
            >
              Share Event
            </Button>
          )}
          <Menu
            anchorEl={shareAnchorEl}
            open={Boolean(shareAnchorEl)}
            onClose={handleShareClose}
            sx={{
              "& .MuiList-root": {
                padding: "8px",
              },
            }}
          >
            <MenuItem onClick={copyToClipboard} sx={{ minWidth: "180px" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <ContentCopyIcon fontSize="small" />
                <Typography sx={{ fontFamily: "albert sans" }}>Copy Link</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("facebook")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FacebookIcon fontSize="small" sx={{ color: "#1877F2" }} />
                <Typography sx={{ fontFamily: "albert sans" }}>Facebook</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("twitter")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TwitterIcon fontSize="small" sx={{ color: "#1DA1F2" }} />
                <Typography sx={{ fontFamily: "albert sans" }}>Twitter</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("linkedin")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinkedInIcon fontSize="small" sx={{ color: "#0A66C2" }} />
                <Typography sx={{ fontFamily: "albert sans" }}>LinkedIn</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("whatsapp")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WhatsAppIcon fontSize="small" sx={{ color: "#25D366" }} />
                <Typography sx={{ fontFamily: "albert sans" }}>WhatsApp</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("email")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" sx={{ color: "#EA4335" }} />
                <Typography sx={{ fontFamily: "albert sans" }}>Email</Typography>
              </Box>
            </MenuItem>
          </Menu>
          {speakers && speakers.length > 0 && (
            <Card
              sx={{
                mt: isMobile ? 1 : 3,
                borderRadius: "20px",
                boxShadow: "none",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, fontFamily: "albert sans" }}
                >
                  Speakers
                </Typography>
                {speakers.map((speaker, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Avatar
                      src={speaker.img}
                      sx={{ width: 50, height: 50 }}
                      alt={speaker.name}
                    />
                    <Box>
                      <Typography
                        sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
                      >
                        {speaker.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "albert sans" }}
                      >
                        {speaker.title}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
          {tagsList.length > 0 && (
            <Card
              sx={{
                mt: isMobile ? 1 : 3,
                borderRadius: "20px",
                boxShadow: "none",
                width: "100%",
                maxWidth: "100%",
                overflow: "hidden",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, fontFamily: "albert sans" }}
                >
                  Tags
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    maxWidth: "100%",
                  }}
                >
                  {tagsList.map((tag, index) => (
                    <Chip
                      key={`tag-${index}`}
                      label={tag}
                      sx={{
                        backgroundColor: "#E0F2FE",
                        color: "#19AEDC",
                        maxWidth: "100%",
                        overflow: "hidden",
                        whiteSpace: "pre-line",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                        fontFamily: "albert sans",
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
          {youtubeVideoId && (
            <Card
              sx={{
                mt: 3,
                borderRadius: "20px",
                boxShadow: "none",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, fontFamily: "albert sans" }}
                >
                  Event Video
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    "&:hover .play-overlay": {
                      opacity: 1,
                    },
                  }}
                  onClick={handlePlayVideo}
                >
                  <CardMedia
                    component="img"
                    image={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
                    onError={(e) => {
                      e.target.src = `https://img.youtube.com/vi/${youtubeVideoId}/mqdefault.jpg`;
                    }}
                    alt="Video Thumbnail"
                    sx={{
                      width: "100%",
                      height: "180px",
                      objectFit: "cover",
                      borderRadius: "10px",
                    }}
                  />
                  <Box
                    className="play-overlay"
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.3)",
                      opacity: 0.7,
                      transition: "opacity 0.3s",
                      borderRadius: "10px",
                    }}
                  >
                    <Box
                      sx={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "50%",
                        backgroundColor: "#19AEDC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PlayArrowIcon sx={{ color: "#fff", fontSize: "32px" }} />
                    </Box>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, textAlign: "center", fontStyle: "italic" }}
                >
                  Click to watch event video
                </Typography>
              </CardContent>
            </Card>
          )}
          {event?.bannerImages?.length >= 6 && (
            <Card
              sx={{
                mt: isMobile ? 1 : 3,
                borderRadius: "20px",
                boxShadow: "none",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, fontFamily: "albert sans" }}
                >
                  Previous Event
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    borderRadius: "10px",
                    overflow: "hidden",
                    width: "100%",
                    height: "200px",
                  }}
                >
                  <Slider {...sliderSettings} className="event-carousel">
                    {event.bannerImages.slice(2, 5).map((imgUrl, index) => (
                      <div key={index} style={{ height: "200px" }}>
                        <img
                          src={imgUrl}
                          alt={`Event Slide ${index + 4}`}
                          style={{
                            width: "100%",
                            height: "200px",
                            objectFit: "cover",
                            objectPosition: "center",
                            display: "block",
                            borderRadius: "10px",
                          }}
                        />
                      </div>
                    ))}
                  </Slider>
                </Box>
              </CardContent>
            </Card>
          )}
          {liveEvents.length > 0 ? (
            <Card
              sx={{
                mt: isMobile ? 1 : 3,
                borderRadius: "20px",
                boxShadow: "none",
                mb: isMobile ? 9 : 0,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, fontFamily: "albert sans" }}
                >
                  Events You May Like
                </Typography>
                {liveEvents.map((liveEvent, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 2,
                      cursor: "pointer",
                      bgcolor: "#F9FAFB",
                      borderRadius: "10px",
                      padding: "1%",
                    }}
                    onClick={() =>
                      navigate(`/eventpage/${liveEvent.id}/${userUID}`)
                    }
                  >
                    <CardMedia
                      component="img"
                      image={liveEvent.img || eventImg}
                      alt={liveEvent.title}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                    <Box>
                      <Typography
                        sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
                      >
                        {liveEvent.title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "albert sans" }}
                      >
                        {liveEvent.date}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "albert sans" }}
                      >
                        {liveEvent.location}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card
              sx={{
                mt: isMobile ? 1 : 3,
                borderRadius: "20px",
                boxShadow: "none",
                mb: isMobile ? 9 : 0,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, fontFamily: "albert sans" }}
                >
                  Events You May Like
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ fontFamily: "albert sans" }}
                >
                  No live events found at this time.
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
      {isMobile && (
        <Box
          sx={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            width: "100%",
            backgroundColor: "#fff",
            boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
            padding: `10px 0 ${paddingBottom}px 0`,
            zIndex: 1300,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            transition: "padding 0.3s ease-in-out",
          }}
        >
          <Button
            variant="contained"
            onClick={() => navigate(`/ticketpricepage/${eventId}/${userUID}`)}
            sx={{
              backgroundColor: "#19AEDC",
              color: "#FFFFFF",
              fontFamily: "albert sans",
              borderRadius: "15px",
              width: "60%",
              padding: 1,
              textTransform: "none",
              fontSize: "16px",
              "&:hover": {
                backgroundColor: "#1789AE",
              },
            }}
          >
            Get Tickets
          </Button>
        </Box>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
      <Dialog open={showShareDialog} onClose={handleDialogClose}>
        <DialogTitle>Share Event</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, fontFamily: "albert sans" }}>
            Copy the link below to share this event:
          </Typography>
          <TextField
            fullWidth
            variant="outlined"
            value={getShareUrl()}
            inputRef={shareTextRef}
            InputProps={{
              readOnly: true,
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDialogClose}
            color="primary"
            sx={{ fontFamily: "albert sans" }}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              if (shareTextRef.current) {
                shareTextRef.current.select();
                document.execCommand("copy");
                setSnackbarMessage("Link copied to clipboard!");
                setSnackbarOpen(true);
                handleDialogClose();
              }
            }}
            color="primary"
            variant="contained"
            sx={{ fontFamily: "albert sans" }}
          >
            Copy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventPage;