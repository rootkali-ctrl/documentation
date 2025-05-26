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
  Tooltip,
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
import Header from "../Header/MainHeader.js";
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

const EventPage = () => {
  const navigate = useNavigate();
  const { eventId } = useParams(); // Get the event ID from URL params
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarEvents, setSimilarEvents] = useState([]);
  const isMobile = useMediaQuery("(max-width:600px)");
  // Share menu state
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const shareTextRef = useRef(null);

  // Extract YouTube video ID from URL
  // const extractYoutubeId = (url) => {
  //   if (!url) return null;

  //   // Match YouTube URL patterns
  //   const regExp =
  //     /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  //   const match = url.match(regExp);

  //   return match && match[2].length === 11 ? match[2] : null;
  // };

  // Fetch event details when component mounts
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        const eventDoc = await getDoc(doc(db, "events", eventId));

        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          console.log(eventData);
          setEvent({
            id: eventDoc.id,
            ...eventData,
          });

          // Extract YouTube video ID if mediaLink exists
          // if (eventData.mediaLink) {
          //   const videoId = extractYoutubeId(eventData.mediaLink);
          //   setYoutubeVideoId(videoId);
          // }

          // Fetch similar events based on category
          if (eventData.category && eventData.category.length > 0) {
            fetchSimilarEvents(eventData.category[0], eventDoc.id);
          }
        } else {
          console.error("Event not found");
          // Redirect to main page if event doesn't exist
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventDetails();
    }
  }, [eventId, navigate]);

  // Fetch similar events based on category
  const fetchSimilarEvents = async (category, currentEventId) => {
    try {
      const eventsRef = collection(db, "events");
      const q = query(
        eventsRef,
        where("category", "array-contains", category),
        limit(3)
      );

      const querySnapshot = await getDocs(q);
      const eventsData = [];

      querySnapshot.forEach((doc) => {
        // Don't include the current event in similar events
        if (doc.id !== currentEventId) {
          const data = doc.data();

          // Format date for display
          let formattedDate = "Date not specified";
          if (data.eventDate) {
            const dateObj = new Date(data.eventDate);
            if (!isNaN(dateObj.getTime())) {
              formattedDate = dateObj.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });
            }
          }

          eventsData.push({
            id: doc.id,
            title: data.name || "Event Title",
            date: formattedDate,
            location: data.venueDetails?.city || "Location not specified",
            img: data.bannerImages?.[0] || eventImg,
          });
        }
      });

      setSimilarEvents(eventsData);
    } catch (error) {
      console.error("Error fetching similar events:", error);
    }
  };

  // Format date and time
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

  // Find the lowest ticket price or return "FREE" if all tickets are free
  const getTicketPrice = (pricing) => {
    if (!pricing || pricing.length === 0) return "FREE";

    const paidTickets = pricing.filter(
      (ticket) => ticket.free === false && ticket.price
    );
    if (paidTickets.length === 0) return "FREE";

    const lowestPrice = Math.min(...paidTickets.map((ticket) => ticket.price));
    return `₹${lowestPrice}`;
  };

  // Get event capacity (total number of tickets available)
  const getEventCapacity = (pricing) => {
    if (!pricing || pricing.length === 0) return "Not specified";

    const totalCapacity = pricing.reduce(
      (sum, ticket) => sum + (ticket.seats || 0),
      0
    );
    return `${totalCapacity} Attendees`;
  };

  // Get speakers list
  const getSpeakers = (speakersData) => {
    if (!speakersData || speakersData.length === 0) {
      return [
        {
          name: "No speakers listed",
          title: "",
          img: "",
        },
      ];
    }

    return speakersData.map((speaker) => ({
      name: speaker.name || "Speaker",
      title: speaker.role || "Speaker",
      img: speaker.imageUrl || "",
    }));
  };

  // Parse FAQ data
  const getFAQs = (faqData) => {
    if (!faqData || faqData.length === 0) return [];

    return faqData.map((faq) => ({
      question: faq.question || "",
      answer: faq.answer || "",
    }));
  };

  // Play YouTube video in a new tab/window
  // const handlePlayVideo = () => {
  //   if (event?.mediaLink) {
  //     window.open(event.mediaLink, "_blank");
  //   }
  // };

  // Share functionality
  const handleShareClick = (event) => {
    setShareAnchorEl(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
  };

  const handleDialogClose = () => {
    setShowShareDialog(false);
  };

  // Generate the current URL for sharing
  const getShareUrl = () => {
    return window.location.href;
  };

  // Copy link to clipboard
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
        // Fallback method for copying using a text field
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

  // Share via social media platforms
  const shareVia = (platform) => {
    const shareUrl = encodeURIComponent(getShareUrl());
    const eventTitle = encodeURIComponent(
      event?.name || "Check out this event"
    );
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
        <Typography variant="h5">Event not found</Typography>
      </Box>
    );
  }

  const speakers = getSpeakers(event.speaker || []);
  const faqs = getFAQs(event.FAQ || []);
  const tagsList = event.tags
    ? event.tags.split(",").map((tag) => tag.trim())
    : [];

  return (
    // minHeight: "100vh"
    <Box sx={{ margin:0 }}>
      <Header />

      <Box
        sx={{
          display: "flex",
          gap: 3,
          padding: "20px 2%",
          flexDirection: { xs: "column", md: "row" },
          mt:0,
          pt:isMobile ? 1 : 4 ,
          backgroundColor: "#f9f9f9"
        }}
      >
        {/* Left Section */}
        <Box sx={{ flex: 2 }}>
        <Card sx={{ borderRadius: "20px", boxShadow: "none", position: "relative" }}>
              <Box sx={{ position: "relative" }}>
                <CardMedia
                  component="img"
                  image={event.bannerImages?.[0] || eventImg}
                  alt={event.name}
                  sx={{ width: "100%", height: "400px", objectFit: "cover" }}
                />
                
               {isMobile && <Box
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
                  onClick={handleShareClick} // optional: add your handler
                >
                  <ShareIcon fontSize="small" sx={{ color: "rgb(25, 174, 220)" }} />
                </Box>}
                
              </Box>
            </Card>


          <Card sx={{ mt: isMobile ? 1 : 3 , borderRadius: "20px", boxShadow: "none" }}>
            <CardContent>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", fontSize: isMobile ? "20px" : "24px" }}
              >
                {event.name || "Event Title"}
              </Typography>

              <Box sx={{ display: "flex", gap: isMobile ? 0.5 : 1 , my: isMobile ? 1 : 2 , flexWrap: "wrap" }}>
                {event.category &&
                  event.category.map((cat, index) => (
                    <Chip
                      key={index}
                      label={cat}
                      sx={{ backgroundColor: "#DBEAFE", color: "#19AEDC", fontSize: isMobile ? "12px" : "14px" }}
                    />
                  ))}
              </Box>

              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                About the Event
              </Typography>
              <Typography
                color="text.secondary"
                sx={{ mb:isMobile ? 0.5 : 1, whiteSpace: "pre-line" }}
              >
                {event.description ||
                  "No description available for this event."}
              </Typography>

              {event.perks && event.perks.length > 0 && (
                <>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mt:isMobile ? 1 : 2 }}
                  >
                    Event Perks
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}
                  >
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

          <Card sx={{ mt: isMobile ? 1 : 3, borderRadius: "20px", boxShadow: "none" }}>
            <CardContent>
              <Typography
                variant="h5"
                sx={{ fontWeight: "bold", fontSize:isMobile ? "20px" : "24px" }}
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
                  <Typography>Map not available</Typography>
                </Box>
              )}
              <Typography color="text.secondary" sx={{ fontSize: isMobile ? "14px" : "18px",mt:isMobile ? 1 : 2 }}>
                {event.venueDetails
                  ? `${event.venueDetails.streetName || ""}, ${
                      event.venueDetails.area || ""
                    }, ${event.venueDetails.city || ""}, ${
                      event.venueDetails.state || ""
                    }, ${event.venueDetails.pincode || ""}`
                  : "Address not provided"}
              </Typography>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card sx={{ mt: isMobile ? 1 : 3, borderRadius: "20px", boxShadow: "none" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold",fontSize:isMobile ? "20px" : "24px" }}>
                FAQs
              </Typography>
              {faqs.length > 0 ? (
                faqs.map((faq, index) => (
                  <Box key={index} sx={{ mt: 2 }}>
                    <Typography sx={{ fontWeight: "bold",fontSize:isMobile ? "16px" : "18px" }}>
                      {faq.question}
                    </Typography>
                    <Typography color="text.secondary" mt={1} sx={{fontSize:isMobile ? "14px" : "16px"}}>
                      {faq.answer}
                    </Typography>
                    {index < faqs.length - 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))
              ) : (
                <Typography color="text.secondary" mt={1}>
                  No FAQs available for this event
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right Section */}
        <Box sx={{ flex: 1 ,mt: isMobile ? -2 : 0}}>
          <Card sx={{ borderRadius: "20px", boxShadow: "none" }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <EventIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Date & Time
                  </Typography>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {formatDateTime(event.eventDate)}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <LocationOnIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {event.venueDetails?.venueName || "Venue not specified"}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PeopleIcon />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Capacity
                  </Typography>
                  <Typography sx={{ fontWeight: "bold" }}>
                    {getEventCapacity(event.pricing)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
          {!isMobile && 
          <Button
            variant="contained"
            fullWidth
            onClick={() => navigate(`/ticketpricepage/${eventId}`)}
            sx={{
              mt: 3,
              backgroundColor: "#19AEDC",
              color: "#FFFFFF",
              borderRadius: "8px",
              padding: "12px",
              textTransform: "none",
              fontSize: "16px",
              "&:hover": {
                backgroundColor: "#1789AE",
              },
            }}
          >
            Get Tickets
          </Button>
        }
        {!isMobile && 
          <Button
            variant="outlined"
            fullWidth
            startIcon={<ShareIcon />}
            onClick={handleShareClick}
            sx={{
              mt: 2,
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
}
          {/* Share Menu */}
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
                <Typography>Copy Link</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("facebook")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FacebookIcon fontSize="small" sx={{ color: "#1877F2" }} />
                <Typography>Facebook</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("twitter")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TwitterIcon fontSize="small" sx={{ color: "#1DA1F2" }} />
                <Typography>Twitter</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("linkedin")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LinkedInIcon fontSize="small" sx={{ color: "#0A66C2" }} />
                <Typography>LinkedIn</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("whatsapp")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WhatsAppIcon fontSize="small" sx={{ color: "#25D366" }} />
                <Typography>WhatsApp</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => shareVia("email")}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmailIcon fontSize="small" sx={{ color: "#EA4335" }} />
                <Typography>Email</Typography>
              </Box>
            </MenuItem>
          </Menu>

          {/* Speakers Section */}
          <Card sx={{ mt: isMobile ? 1 : 3, borderRadius: "20px", boxShadow: "none" }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Speakers
              </Typography>
              {speakers.map((speaker, index) => (
                <Box
                  key={index}
                  sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
                >
                  <Avatar
                    src={speaker.img}
                    sx={{ width: 50, height: 50 }}
                    alt={speaker.name}
                  />
                  <Box>
                    <Typography sx={{ fontWeight: "bold" }}>
                      {speaker.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {speaker.title}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>

          {/* Tags Section */}
          {tagsList.length > 0 && (
            <Card sx={{ mt: isMobile ? 1 : 3, borderRadius: "20px", boxShadow: "none" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Tags
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {tagsList.map((tag, index) => (
                    <Chip
                      key={`tag-${index}`}
                      label={tag}
                      sx={{ backgroundColor: "#E0F2FE", color: "#19AEDC" }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

         {event?.bannerImages?.length >= 6 && (
  <Card sx={{ mt: isMobile ? 1 : 3, borderRadius: "20px", boxShadow: "none" }}>
    <CardContent>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
        Previous event 
      </Typography>

      <Box
        sx={{
          position: "relative",
          borderRadius: "10px",
          overflow: "hidden",
          width:'500px'
        }}
      >
        <Slider
          dots
          infinite
          speed={500}
          slidesToShow={1}
          slidesToScroll={1}
          arrows
          adaptiveHeight={false}
          className="event-carousel"
          autoplay={true}
          autoplaySpeed={5000}
        >
          {event.bannerImages.slice(3, 6).map((imgUrl, index) => (
            <div key={index}>
              <img
                src={imgUrl}
                alt={`Event Slide ${index + 4}`}
                style={{
                  width: "100%",
                  height: "180px",
                  objectFit: "cover",
                  objectPosition: "center",
                  display: "block",
                  borderRadius: "10px"
                }}
              />
            </div>
          ))}
        </Slider>
      </Box>
    </CardContent>
  </Card>
)}
          {/* {youtubeVideoId && (
            <Card sx={{ mt: 3, borderRadius: "20px", boxShadow: "none" }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Event Video
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    cursor: "pointer",
                    "&:hover .play-overlay": {
                      opacity: 1
                    }
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
                      borderRadius: "10px"
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
                      borderRadius: "10px"
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
                        justifyContent: "center"
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
          )} */}

          {/* Similar Events Section */}
          {similarEvents.length > 0 && (
            <Card sx={{ mt: isMobile ? 1 : 3, borderRadius: "20px", boxShadow: "none" ,mb: isMobile ? 3: 0}}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Similar Events
                </Typography>
                {similarEvents.map((similarEvent, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      gap: 2,
                      mb: 2,
                      cursor: "pointer",
                    }}
                    onClick={() => navigate(`/eventpage/${similarEvent.id}`)}
                  >
                    <CardMedia
                      component="img"
                      image={similarEvent.img || eventImg}
                      alt={similarEvent.title}
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: "8px",
                        objectFit: "cover",
                      }}
                    />
                    <Box>
                      <Typography sx={{ fontWeight: "bold" }}>
                        {similarEvent.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {similarEvent.date}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {similarEvent.location}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
      
      {!isMobile && <Footer />}
      {isMobile && (
      <Box
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          backgroundColor: "#ffffff",
          boxShadow: "0 -2px 6px rgba(0,0,0,0.1)",
          py: 1,
          zIndex: 1000,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "90%",
            margin: "0 auto",
            maxWidth: "500px",
          }}
        >
          {/* Price Info - Left Side */}
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography
              variant="body2"
              sx={{ fontSize: "14px", color: "#4B5563" }}
            >
              Price
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "16px",
                color: "#19AEDC",
              }}
            >
              {getTicketPrice(event.pricing)}
            </Typography>
          </Box>

          {/* Get Tickets Button - Right Side */}
          <Button
            variant="contained"
            onClick={() => navigate(`/ticketpricepage/${eventId}`)}
            sx={{
              backgroundColor: "#19AEDC",
              color: "#FFFFFF",
              borderRadius: "25px",
              padding: "10px 20px",
              fontSize: "16px",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#1789AE",
              },
            }}
          >
            Get Tickets
          </Button>
        </Box>
      </Box>
    )}



      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />

      {/* Fallback Copy Dialog (for browsers where clipboard API is not available) */}
      <Dialog open={showShareDialog} onClose={handleDialogClose}>
        <DialogTitle>Share Event</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
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
          <Button onClick={handleDialogClose} color="primary">
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
          >
            Copy
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventPage;
