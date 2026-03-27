import React, { useContext, useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  useMediaQuery,
  CardMedia,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import ShareIcon from "@mui/icons-material/Share";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { useNavigate, useParams } from "react-router-dom";
import EventContext, { useEventContext } from "./EventContext.js";
import axios from "axios";
import Slider from "react-slick";

const EventPage = () => {
  const navigate = useNavigate();
  const { eventId, userUID } = useParams();
  const isMobile = useMediaQuery("(max-width:900px)");

  // State management
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [previewUrls, setPreviewUrls] = useState([]);
  const [paddingBottom, setPaddingBottom] = useState(20);
  const [dialogState, setDialogState] = useState({
    open: false,
    message: "",
  });

  // Optimized dialog handler
  const showDialog = useCallback((message) => {
    setDialogState({ open: true, message });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({ open: false, message: "" });
  }, []);

  const { formData, shouldRedirectToStep1, stepCompletion } =
    useContext(EventContext);
  const { resetForm } = useEventContext();

  // Mock data - replace with actual data from your context/API
  const event = formData?.eventDetails || {};
  const speakers = formData?.eventDetails?.speaker || [];
  const faqs = formData?.finalSetup?.FAQ || [];
  const tagsList = formData?.finalSetup?.tags
    ? formData.finalSetup.tags.split(",").map((tag) => tag.trim())
    : [];
  const youtubeVideoId = extractYouTubeId(formData?.eventDetails?.mediaLink);

  // Helper functions
  const formatDateTime = (dateString) => {
    if (!dateString) return "Date not available";
    return new Date(dateString).toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const getEventCapacity = (pricing) => {
    if (!pricing?.tickets) return "N/A";
    return pricing.tickets.reduce(
      (acc, ticket) => acc + Number(ticket.seats || 0),
      0
    );
  };

  const getShareUrl = () => {
    return window.location.href;
  };

  function extractYouTubeId(url) {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    );
    return match ? match[1] : null;
  }

  // Event handlers
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDialogClose = () => {
    setShowShareDialog(false);
  };

  const handlePlayVideo = () => {
    if (youtubeVideoId) {
      window.open(
        `https://www.youtube.com/watch?v=${youtubeVideoId}`,
        "_blank"
      );
    }
  };

  // Page reload and validation
  useEffect(() => {
    if (shouldRedirectToStep1()) {
      navigate(`/createevent/${formData.eventDetails?.vendorId}/step1`);
      return;
    }

    if (
      !stepCompletion?.step1 ||
      !stepCompletion?.step2 ||
      !formData.eventDetails?.name ||
      !formData.pricing?.tickets?.length ||
      Object.keys(formData.eventDetails || {}).length === 0 ||
      !formData.eventDetails?.banner?.length
    ) {
      navigate(`/createevent/${formData.eventDetails?.vendorId}/step1`);
      return;
    }
  }, [shouldRedirectToStep1, stepCompletion, formData, navigate]);

  // Handle banner preview URLs
  useEffect(() => {
    if (formData?.eventDetails?.banner?.length) {
      try {
        const urls = formData.eventDetails.banner.map((file) => {
          if (!(file instanceof File) && !(file instanceof Blob)) {
            throw new Error("Invalid file object");
          }
          return URL.createObjectURL(file);
        });
        setPreviewUrls(urls);

        return () => {
          urls.forEach((url) => URL.revokeObjectURL(url));
        };
      } catch (error) {
        // ...existing code...
        navigate(`/createevent/${formData.eventDetails?.vendorId}/step1`);
      }
    }
  }, [
    formData.eventDetails?.banner,
    navigate,
    formData.eventDetails?.vendorId,
  ]);

  // Handle safe area for mobile devices
  useEffect(() => {
    if (isMobile) {
      const updatePadding = () => {
        const safeAreaBottom = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue(
            "--safe-area-inset-bottom"
          ) || "0"
        );
        setPaddingBottom(Math.max(20, safeAreaBottom));
      };

      updatePadding();
      window.addEventListener("resize", updatePadding);
      return () => window.removeEventListener("resize", updatePadding);
    }
  }, [isMobile]);

  // NEW handleSubmit from the new code
  const handleSubmit = async () => {
    const { eventDetails, pricing, finalSetup } = formData;

    try {
      setSubmitting(true);
      showDialog("Uploading images and creating event...");

      // Create FormData for multipart upload
      const form = new FormData();

      // Add all banner images to FormData (up to 9 images)
      if (eventDetails.banner && eventDetails.banner.length > 0) {
        const imagesToUpload = eventDetails.banner.slice(0, 9); // Limit to 9 images
        imagesToUpload.forEach((file, index) => {
          if (file instanceof File) {
            form.append("bannerImages", file);
          }
        });
        // ...existing code...
      }

      // Process perks with Unsplash images
      const perksWithImages = await Promise.all(
        (pricing.addons || []).map(async (addon) => {
          const itemName = addon.itemName || "";
          let imageUrl = "";

          try {
            const res = await axios.get(
              `https://api.unsplash.com/search/photos`,
              {
                params: {
                  query: itemName,
                  per_page: 1,
                  orientation: "landscape",
                },
                headers: {
                  Authorization: `Client-ID ${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}`,
                },
              }
            );

            const results = res.data.results;
            if (results.length > 0) {
              imageUrl = res.data.results[0].urls.small;
            }
          } catch (error) {
            console.warn(`Unsplash image fetch failed for "${itemName}"`, error);
          }

          return {
            itemName,
            price: parseFloat(addon.price) || 0,
            limit: parseInt(addon.limit) || 0,
            url: imageUrl,
          };
        })
      );

      // Prepare the payload (no file objects, only data)
      const payload = {
        name: eventDetails.name,
        description: eventDetails.description,
        category: eventDetails.category,
        eventDate: eventDetails.eventDate,
        eventHost: eventDetails.eventHost,
        mediaLink: eventDetails.mediaLink || "",
        vendorId: eventDetails.vendorId,

        speaker: (eventDetails.speaker || []).map((sp) => ({
          name: sp.name || "",
          role: sp.role || "",
        })),

        venueDetails: eventDetails.venueDetails,

        pricing: (pricing.tickets || []).map((ticket) => ({
          ticketType: ticket.ticketType || "",
          features: ticket.features || "",
          price: parseFloat(ticket.price) || 0,
          tax: !!ticket.tax,
          free: !!ticket.freeEvent,
          seats: parseInt(ticket.seats) || 0,
        })),

        perks: perksWithImages,

        coupons: (pricing.coupons || []).map((coupon) => ({
          couponCode: coupon.couponCode || "",
          couponLimits: parseInt(coupon.couponLimits) || 0,
          reducePert: parseFloat(coupon.reducePert) || 0,
          startTime: coupon.startTime || "",
          endTime: coupon.endTime || "",
        })),

        contact: finalSetup.contact || "",
        FAQ: (finalSetup.FAQ || []).map((faq) => ({
          question: faq.ques || "",
          answer: faq.ans || "",
        })),

        ticketCount: finalSetup.ticketCount || "",
        tags: finalSetup.tags || "",
        cancellationAvailable: finalSetup.cancellationAvailable || false,
        cancellationDays: finalSetup.cancellationDays || "",
        deductionType: finalSetup.deductionType || "",
        deductionRate: finalSetup.deductionRate || "",
        createdAt: new Date().toISOString(),
      };

      // Append all payload data to FormData
      Object.entries(payload).forEach(([key, value]) => {
        form.append(
          key,
          typeof value === "object" ? JSON.stringify(value) : value
        );
      });

      // Submit to backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/event/`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // ...existing code...

      // Show success message
      closeDialog();
      setOpenDialog(true);

      // Navigate to vendor home and reset form
      navigate(`/vendorhome/${formData.eventDetails.vendorId}`);
      setTimeout(() => resetForm(), 100);
    } catch (error) {
      // ...existing code...
      closeDialog();
      showDialog("Failed to create event. Please try again.");

      setTimeout(() => {
        closeDialog();
      }, 3000);
    } finally {
      setSubmitting(false);
    }
  };

  // Early return for redirects
  if (
    shouldRedirectToStep1() ||
    !stepCompletion?.step1 ||
    !stepCompletion?.step2 ||
    !formData.eventDetails?.name ||
    !formData.pricing?.tickets?.length ||
    Object.keys(formData.eventDetails || {}).length === 0 ||
    !formData.eventDetails?.banner?.length
  ) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F9FAFB" }}>
      {/* Header */}
      <Box
        sx={{
          width: "90%",
          margin: "0 auto 2% auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography
          sx={{
            fontFamily: "albert sans",
            fontSize: isMobile ? "20px" : "30px",
            fontWeight: "700",
          }}
        >
          Preview of your event
        </Typography>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            backgroundColor: "#19AEDC",
            padding: "0.5% 2%",
            textTransform: "none",
            fontSize: "16px",
            fontFamily: "albert sans",
            color: "white",
            "&:disabled": {
              backgroundColor: "#8dd6ec",
            },
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            "Host event"
          )}
        </Button>
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>Event Hosted</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Your event has been hosted successfully.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} autoFocus>
              OK
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      {/* Main Content */}
      <Box
        sx={{
          display: "flex",
          gap: 3,
          padding: "20px 2%",
          flexDirection: { xs: "column", md: "row" },
          mt: 0,
          pt: isMobile ? 1 : 4,
          backgroundColor: "#f9f9f9",
          maxWidth: "100%",
          width: "98%",
          boxSizing: "border-box",
        }}
      >
        {/* Left Section */}
        <Box
          sx={{
            flex: { md: 2, xs: 1 },
            width: { lg: "70%", md: "70%", xs: "100%" },
            maxWidth: "100%",
          }}
        >
          {/* Hero Image Card */}
          <Card
            sx={{
              borderRadius: "20px",
              boxShadow: "none",
              position: "relative",
              maxWidth: { lg: "800px", md: "100%" },
              margin: "0 auto",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: "relative" }}>
              <CardMedia
                component="img"
                image={previewUrls[0] || "/placeholder-event.jpg"}
                alt={formData.eventDetails?.name || "Event"}
                sx={{
                  width: "100%",
                  height: { xs: "200px", md: "300px" },
                  objectFit: "cover",
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
                    border: "1px solid #19AEDC",
                  }}
                  onClick={() => setShowShareDialog(true)}
                >
                  <ShareIcon fontSize="small" sx={{ color: "#19AEDC" }} />
                </Box>
              )}
            </Box>
          </Card>

          {/* Event Details Card */}
          <Card
            sx={{
              mt: { xs: 2, md: 3 },
              borderRadius: "20px",
              boxShadow: "none",
            }}
          >
            <CardContent>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "20px", md: "28px" },
                  fontFamily: "albert sans",
                  mb: 2,
                }}
              >
                {formData.eventDetails?.name || "Event Title"}
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  gap: 1,
                  my: 2,
                  flexWrap: "wrap",
                }}
              >
                {formData.eventDetails?.category &&
                  formData.eventDetails.category.map((cat, index) => (
                    <Chip
                      key={index}
                      label={cat}
                      sx={{
                        backgroundColor: "#DBEAFE",
                        color: "#19AEDC",
                        fontSize: { xs: "12px", md: "14px" },
                        fontFamily: "albert sans",
                      }}
                    />
                  ))}
              </Box>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontFamily: "albert sans",
                  mb: 1,
                  mt: 3,
                }}
              >
                About the Event
              </Typography>
              <Typography
                color="text.secondary"
                sx={{
                  mb: 2,
                  whiteSpace: "pre-line",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  fontFamily: "albert sans",
                  lineHeight: 1.6,
                }}
              >
                {formData.eventDetails?.description ||
                  "No description available for this event."}
              </Typography>

              {formData.pricing?.addons &&
                formData.pricing.addons.length > 0 && (
                  <>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        mt: 3,
                        mb: 1,
                        fontFamily: "albert sans",
                      }}
                    >
                      Event Perks
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                      {formData.pricing.addons.map((perk, index) => (
                        <Chip
                          key={index}
                          label={`${perk.itemName} (Limit: ${perk.limit})`}
                          sx={{
                            backgroundColor: "#F0F9FF",
                            color: "#475569",
                            fontFamily: "albert sans",
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
            </CardContent>
          </Card>

          {/* Location Card */}
          <Card
            sx={{
              mt: { xs: 2, md: 3 },
              borderRadius: "20px",
              boxShadow: "none",
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontSize: { xs: "20px", md: "24px" },
                  fontFamily: "albert sans",
                  mb: 2,
                }}
              >
                Location
              </Typography>

              {formData.eventDetails?.venueDetails?.gmapLink ? (
                <Box
                  sx={{
                    width: "100%",
                    height: "300px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    mb: 2,
                  }}
                >
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ border: 0 }}
                    src={formData.eventDetails.venueDetails.gmapLink}
                    allowFullScreen
                    title="Event Location"
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    width: "100%",
                    height: "300px",
                    backgroundColor: "#E5E7EB",
                    borderRadius: "10px",
                    mb: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    sx={{ fontFamily: "albert sans", color: "#6B7280" }}
                  >
                    Map not available
                  </Typography>
                </Box>
              )}

              <Typography
                color="text.secondary"
                sx={{
                  fontSize: { xs: "14px", md: "16px" },
                  fontFamily: "albert sans",
                  lineHeight: 1.5,
                }}
              >
                {formData.eventDetails?.venueDetails
                  ? (() => {
                      const { streetName, area, city, state, pincode } =
                        formData.eventDetails.venueDetails;
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

                      return parts.length > 0
                        ? parts.join(", ")
                        : "Address not provided";
                    })()
                  : "Address not provided"}
              </Typography>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <Card
              sx={{
                mt: { xs: 2, md: 3 },
                borderRadius: "20px",
                boxShadow: "none",
              }}
            >
              <CardContent>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    fontSize: { xs: "20px", md: "24px" },
                    fontFamily: "albert sans",
                    mb: 2,
                  }}
                >
                  FAQs
                </Typography>
                {faqs.map((faq, index) => (
                  <Box key={index} sx={{ mb: index < faqs.length - 1 ? 3 : 0 }}>
                    <Typography
                      sx={{
                        fontWeight: "bold",
                        fontSize: { xs: "16px", md: "18px" },
                        fontFamily: "albert sans",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        mb: 1,
                      }}
                    >
                      {faq.ques || faq.question}
                    </Typography>
                    <Typography
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: "14px", md: "16px" },
                        fontFamily: "albert sans",
                        wordWrap: "break-word",
                        overflowWrap: "break-word",
                        lineHeight: 1.6,
                      }}
                    >
                      {faq.ans || faq.answer}
                    </Typography>
                    {index < faqs.length - 1 && <Divider sx={{ mt: 2 }} />}
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Right Section */}
        <Box
          sx={{
            flex: { md: 1, xs: 1 },
            width: { lg: "30%", md: "30%", xs: "100%" },
            mt: { xs: 0, md: 0 },
          }}
        >
          {/* Event Info Card */}
          <Card sx={{ borderRadius: "20px", boxShadow: "none" }}>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <EventIcon sx={{ color: "#19AEDC" }} />
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Date & Time
                  </Typography>
                  <Typography
                    sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
                  >
                    {formatDateTime(formData.eventDetails?.eventDate)}
                  </Typography>
                </Box>
              </Box>

              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <LocationOnIcon sx={{ color: "#19AEDC" }} />
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Location
                  </Typography>
                  <Typography
                    sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
                  >
                    {formData.eventDetails?.venueDetails?.venueName ||
                      "Venue not specified"}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PeopleIcon sx={{ color: "#19AEDC" }} />
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Capacity
                  </Typography>
                  <Typography
                    sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
                  >
                    {getEventCapacity(formData.pricing)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Desktop Action Buttons */}
          {!isMobile && (
            <>
              <Button
                variant="contained"
                fullWidth
                sx={{
                  mt: 3,
                  backgroundColor: "#19AEDC",
                  color: "#FFFFFF",
                  borderRadius: "12px",
                  padding: "14px",
                  textTransform: "none",
                  fontSize: "16px",
                  fontFamily: "albert sans",
                  fontWeight: "600",
                  "&:hover": {
                    backgroundColor: "#1789AE",
                  },
                  "&:disabled": {
                    backgroundColor: "#B0BEC5",
                  },
                }}
                onClick={() => navigate(`/ticketpricepage/${eventId}/${userUID}`)}
              >
                Get Tickets
              </Button>

              <Button
                variant="outlined"
                fullWidth
                startIcon={<ShareIcon />}
                onClick={() => setShowShareDialog(true)}
                sx={{
                  mt: 2,
                  fontFamily: "albert sans",
                  borderColor: "#19AEDC",
                  color: "#19AEDC",
                  borderRadius: "12px",
                  padding: "14px",
                  textTransform: "none",
                  fontSize: "16px",
                  fontWeight: "600",
                  "&:hover": {
                    borderColor: "#1789AE",
                    backgroundColor: "rgba(25, 174, 220, 0.04)",
                  },
                }}
              >
                Share Event
              </Button>
            </>
          )}

          {/* Speakers Section */}
          {speakers.length > 0 && (
            <Card
              sx={{
                mt: { xs: 2, md: 3 },
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
                      mb: index < speakers.length - 1 ? 2 : 0,
                    }}
                  >
                    <Avatar
                      src={speaker.img}
                      sx={{ width: 50, height: 50 }}
                      alt={speaker.name}
                    >
                      {speaker.name?.charAt(0)}
                    </Avatar>
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
                        {speaker.role}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tags Section */}
          {tagsList.length > 0 && (
            <Card
              sx={{
                mt: { xs: 2, md: 3 },
                borderRadius: "20px",
                boxShadow: "none",
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, fontFamily: "albert sans" }}
                >
                  Tags
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {tagsList.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      sx={{
                        backgroundColor: "#E0F2FE",
                        color: "#19AEDC",
                        fontFamily: "albert sans",
                        wordBreak: "break-word",
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}

          {/* YouTube Video Section */}
          {youtubeVideoId && (
            <Card
              sx={{
                mt: { xs: 2, md: 3 },
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
                    borderRadius: "10px",
                    overflow: "hidden",
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
                  sx={{
                    mt: 1,
                    textAlign: "center",
                    fontStyle: "italic",
                    fontFamily: "albert sans",
                  }}
                >
                  Click to watch event video
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* Previous Events Carousel */}
          {previewUrls.length >= 3 && (
            <Card
              sx={{
                mt: { xs: 2, md: 3 },
                borderRadius: "20px",
                boxShadow: "none",
                mb: isMobile ? "5em" : 0,
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2, fontFamily: "albert sans" }}
                >
                  Previous Events
                </Typography>
                <Box
                  sx={{
                    borderRadius: "10px",
                    overflow: "hidden",
                    "& .slick-dots": {
                      bottom: "10px",
                    },
                    "& .slick-dots li button:before": {
                      color: "#19AEDC",
                    },
                  }}
                >
                  <Slider
                    dots
                    infinite
                    speed={500}
                    slidesToShow={1}
                    slidesToScroll={1}
                    autoplay
                    autoplaySpeed={5000}
                    adaptiveHeight={false}
                  >
                    {previewUrls.slice(2, 5).map((imgUrl, index) => (
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
        </Box>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
      />
      <Dialog
        open={dialogState.open}
        onClose={closeDialog}
        sx={{ zIndex: 9999 }}
      >
        <DialogTitle sx={{ fontFamily: "albert sans" }}>Notice</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ fontFamily: "albert sans" }}>
            {dialogState.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={closeDialog}
            color="primary"
            sx={{ fontFamily: "albert sans" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventPage;