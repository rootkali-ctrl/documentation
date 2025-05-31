import React, { useContext, useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useMediaQuery
} from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import PeopleIcon from "@mui/icons-material/People";
import ShareIcon from "@mui/icons-material/Share";
import { useNavigate } from "react-router-dom";
import EventContext, { useEventContext } from "./EventContext.js";
import axios from "axios";
import Carousel from "react-material-ui-carousel";

const EventPage = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:900px)");
  //Event date
  const [submitting, setSubmitting] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);

  const { formData, shouldRedirectToStep1, stepCompletion } = useContext(EventContext);
  const rawDate = formData.eventDetails.eventDate;
  const { resetForm } = useEventContext();

  // Handle page reload and validation - redirect to step 1
  useEffect(() => { 
    // Redirect to step 1 if page was reloaded 
    if (shouldRedirectToStep1()) { 
      navigate(`/createevent/${formData.eventDetails.vendorId}/step1`); 
      return; 
    } 
 
    // Redirect to step 1 if previous steps are not completed or required data is missing 
    if (!stepCompletion.step1 || !stepCompletion.step2 ||  
        !formData.eventDetails?.name ||  
        !formData.pricing?.tickets?.length || 
        Object.keys(formData.eventDetails || {}).length === 0 ||
        !formData.eventDetails?.banner?.length) { 
      navigate(`/createevent/${formData.eventDetails.vendorId}/step1`); 
      return; 
    } 
  }, [shouldRedirectToStep1, stepCompletion, formData, navigate]);

  const formattedDate = new Date(rawDate).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  //total seats
  const totalAttendees = formData?.pricing?.tickets?.reduce((acc, ticket) => {
    return acc + Number(ticket.seats || 0);
  }, 0);

  //event location
  const location = formData?.eventDetails?.venueDetails?.venueName;

  // const handleSubmit = async () => {
  //   const { eventDetails, pricing, finalSetup } = formData;
  //   const form = new FormData();

  //   // Append banner images
  //   eventDetails.banner.forEach((file) => {
  //     form.append("bannerImages", file);
  //   });

  //   // Format payload according to backend expectations
  //   const payload = {
  //     name: eventDetails.name,
  //     description: eventDetails.description,
  //     category: eventDetails.category,
  //     eventDate: eventDetails.eventDate,
  //     eventHost: eventDetails.eventHost,
  //     mediaLink: eventDetails.mediaLink || "",
  //     vendorId: eventDetails.vendorId,

  //     speaker: (eventDetails.speaker || []).map((sp) => ({
  //       name: sp.name || "",
  //       role: sp.role || "",
  //     })),

  //     venueDetails: eventDetails.venueDetails,

  //     pricing: (pricing.tickets || []).map((ticket) => ({
  //       ticketType: ticket.ticketType || "",
  //       features: ticket.features || "",
  //       price: parseFloat(ticket.price) || 0,
  //       tax: !!ticket.tax,
  //       free: !!ticket.freeEvent,
  //       seats: parseInt(ticket.seats) || 0,
  //     })),

  //     perks: (pricing.addons || []).map((addon) => ({
  //       itemName: addon.itemName || "",
  //       price: parseFloat(addon.price) || 0,
  //       limit: parseInt(addon.limit) || 0,
  //     })),

  //     coupons: (pricing.coupons || []).map((coupon) => ({
  //       couponCode: coupon.couponCode || "",
  //       couponLimits: parseInt(coupon.couponLimits) || 0,
  //       reducePert: parseFloat(coupon.reducePert) || 0,
  //       startTime: coupon.startTime || "",
  //       endTime: coupon.endTime || "",
  //     })),

  //     contact: finalSetup.contact || "",
  //     FAQ: (finalSetup.FAQ || []).map((faq) => ({
  //       question: faq.ques || "",
  //       answer: faq.ans || "",
  //     })),

  //     ticketCount: finalSetup.ticketCount || "",
  //     tags: finalSetup.tags || "",
  //     cancellationAvailable: finalSetup.cancellationAvailable || false,
  //     cancellationDays: finalSetup.cancellationDays || "",
  //     deductionType: finalSetup.deductionType || "",
  //     deductionRate: finalSetup.deductionRate || "",
  //     createdAt: new Date().toISOString(),
  //   };

  //   // Append payload to formData
  //   Object.entries(payload).forEach(([key, value]) => {
  //     form.append(
  //       key,
  //       typeof value === "object" ? JSON.stringify(value) : value
  //     );
  //   });

  //   try {
  //     setSubmitting(true);
  //     const response = await axios.post(
  //       `${process.env.REACT_APP_API_BASE_URL}/api/event/`,
  //       form,
  //       {
  //         headers: {
  //           "Content-Type": "multipart/form-data",
  //         },
  //       }
  //     );
  //     console.log(response);
  //     setOpenDialog(true);

  //     // Navigate first, then reset form
  //     navigate(`/vendorhome/${formData.eventDetails.vendorId}`);

  //     // Reset form after navigation
  //     setTimeout(() => {
  //       resetForm();
  //     }, 100); // Small delay to ensure navigation completes
  //   } catch (error) {
  //     alert("Failed to create event.");
  //     setSubmitting(false);
  //   } finally {
  //     setSubmitting(false);
  //   }
  // };

  const handleSubmit = async () => {
  const { eventDetails, pricing, finalSetup } = formData;
  const form = new FormData();

  // Append banner images
  eventDetails.banner.forEach((file) => {
    form.append("bannerImages", file);
  });

  const perksWithImages = await Promise.all(
    (pricing.addons || []).map(async (addon) => {
      const itemName = addon.itemName || "snacks";
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
          imageUrl = results[0].urls.small; // or .regular for higher resolution
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

  // 2️⃣ Build full payload
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

    perks: perksWithImages, // ✅ with image URL now

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

  // 3️⃣ Append payload to FormData
  Object.entries(payload).forEach(([key, value]) => {
    form.append(key, typeof value === "object" ? JSON.stringify(value) : value);
  });

  // 4️⃣ Submit form
  try {
    setSubmitting(true);
    const response = await axios.post(
      `${process.env.REACT_APP_API_BASE_URL}/api/event/`,
      form,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    console.log(response);
    setOpenDialog(true);
    navigate(`/vendorhome/${formData.eventDetails.vendorId}`);
    setTimeout(() => resetForm(), 100);
  } catch (error) {
    alert("Failed to create event.");
    console.error(error);
    setSubmitting(false);
  } finally {
    setSubmitting(false);
  }
};

  const [previewUrls, setPreviewUrls] = useState([]);

  useEffect(() => {
    if (formData?.eventDetails?.banner?.length) {
      try {
        const urls = formData.eventDetails.banner.map((file) => {
          // Validate that file is actually a File or Blob object
          if (!(file instanceof File) && !(file instanceof Blob)) {
            throw new Error('Invalid file object');
          }
          return URL.createObjectURL(file);
        });
        setPreviewUrls(urls);

        // Cleanup on unmount
        return () => {
          urls.forEach((url) => URL.revokeObjectURL(url));
        };
      } catch (error) {
        console.error('Error creating object URLs:', error);
        // Redirect to step 1 if banner files are corrupted/invalid
        navigate(`/createevent/${formData.eventDetails.vendorId}/step1`);
      }
    }
  }, [formData.eventDetails.banner, navigate, formData.eventDetails.vendorId]);

  // Return early if redirecting due to page reload or missing data
  if (shouldRedirectToStep1() || 
      !stepCompletion.step1 || !stepCompletion.step2 ||  
      !formData.eventDetails?.name ||  
      !formData.pricing?.tickets?.length || 
      Object.keys(formData.eventDetails || {}).length === 0 ||
      !formData.eventDetails?.banner?.length) {
    return <div>Redirecting...</div>; // Optional loading state
  }
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#F9FAFB" }}>
      {/* Header */}
      {/* <Header/> */}
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
            fontSize:isMobile?"20px": "30px",
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
          backgroundColor: "#F9FAFB",
          padding: "20px 5%",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 3,
        }}
      >
        {/* Left Section */}
        <Box sx={{ flex: 2 }}>
          {/* Event Image */}
          <Box
            sx={{
              width: isMobile?"100%":"80%",
              maxWidth: 1200,
              height: isMobile?200:300,
              maxHeight: "400px",
              border: "2px dashed #ccc",
              borderRadius: 4,
              overflow: "hidden",
              backgroundColor: "#f9f9f9",
              mx: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            {previewUrls.length > 0 ? (
              <Carousel
                navButtonsAlwaysVisible
                autoPlay={false}
                animation="slide"
                indicators={false}
                sx={{
                  width: "100%",
                  height: "100%",
                }}
              >
                {previewUrls.map((img, index) => (
                  <Box
                    key={index}
                    sx={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#fff",
                    }}
                  >
                    <Box
                      component="img"
                      src={img}
                      alt={`preview-${index}`}
                      sx={{
                        maxWidth: "100%",
                        maxHeight: "100%",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                ))}
              </Carousel>
            ) : (
              <Typography
                variant="subtitle1"
                color="textSecondary"
                sx={{ fontFamily: "albert sans" }}
              >
                No image uploaded
              </Typography>
            )}
          </Box>

          {/*
            <BannerPreviewCarousel files={formData.eventDetails.banner} /> */}
          {/* Event Details */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontSize: isMobile?"24px":"30px",
                  fontFamily: "albert sans",
                }}
              >
                {/* Tech Innovation Summit 2025 */}
                {formData.eventDetails.name || "Event Title"}
              </Typography>
              {formData?.eventDetails?.category?.length > 0 && (
                <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap",mt:isMobile?1:0 }}>
                  {formData.eventDetails.category.map((cat, index) => (
                    <Chip
                      key={index}
                      label={cat}
                      sx={{ backgroundColor: "#DBEAFE", color: "#19AEDC" }}
                    />
                  ))}
                </Box>
              )}

              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontSize: "20px",
                  fontFamily: "albert sans",
                }}
              >
                About the Event
              </Typography>
              <Typography
                variant="body1"
                paragraph
                color="#4B5563"
                sx={{ fontFamily: "albert sans",width: isMobile?"100%":"100%",overflowX: "hidden", textOverflow: "ellipsis" }}
              >
                {formData.eventDetails.description}
              </Typography>

              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontSize: "20px",
                  fontFamily: "albert sans",
                }}
              >
                Event Comforts
              </Typography>

              <Box
                sx={{
                  width: "100%",
                  height: "70px",
                  border: 0.5,
                  borderColor: "#4B5563",
                  display: "flex",
                  gap: 2,
                  flexDirection: "column",
                }}
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  fontSize: "30px",
                  fontFamily: "albert sans",
                }}
              >
                Location
              </Typography>
              <iframe
                width="100%"
                height="300"
                frameBorder="0"
                style={{ border: 0, borderRadius: "8px" }}
                src="https://www.openstreetmap.org/export/embed.html?bbox=-122.431297%2C37.773972%2C-122.431297%2C37.773972&layer=mapnik&marker=37.773972%2C-122.431297"
                allowFullScreen
              ></iframe>
              <Typography
                variant="body2"
                color="text.secondary"
                mt={1}
                sx={{ fontFamily: "albert sans" }}
              >
                {formData?.eventDetails?.venueDetails?.venueName},{" "}
                {formData?.eventDetails?.venueDetails?.streetName},{" "}
                {formData?.eventDetails?.venueDetails?.area},{" "}
                {formData?.eventDetails?.venueDetails?.city} -{" "}
                {formData?.eventDetails?.venueDetails?.pincode}, <br />{" "}
                {formData?.eventDetails?.venueDetails?.state}
              </Typography>
            </CardContent>
          </Card>

          {/* FAQs */}
          {formData?.finalSetup?.FAQ?.some(
            (faq) => faq.ques.trim() || faq.ans.trim()
          ) && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "20px",
                    fontFamily: "albert sans",
                  }}
                >
                  FAQ's
                </Typography>
                <Box
                  sx={{
                    width: "95%",
                    display: "flex",
                    gap: 2,
                    flexDirection: "column",
                    p: 2,
                  }}
                >
                  {formData.finalSetup.FAQ.map((qans, index) => (
                    <Box key={index} sx={{ borderBottom: "1px solid #ccc" }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontFamily: "albert sans", fontSize: "18px" }}
                      >
                        {qans.ques}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontFamily: "albert sans" }}
                      >
                        {qans.ans}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Right Section */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <EventIcon color="#19AEDC" />
                <Box>
                  <Typography
                    variant="body2"
                    color="#4B5563"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Date & Time
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
                  >
                    {/* March 15, 2025 - 10:00 AM */}
                    {formattedDate}
                  </Typography>
                </Box>
              </Box>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}
              >
                <LocationOnIcon color="#19AEDC" />
                <Box>
                  <Typography
                    variant="body2"
                    color="#4B5563"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Location
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
                  >
                    {location}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PeopleIcon color="#19AEDC" />
                <Box>
                  <Typography
                    variant="body2"
                    color="#4B5563"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Capacity
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: "bold", fontFamily: "albert sans" }}
                  >
                    {totalAttendees}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          <Button
            variant="contained"
            fullWidth
            sx={{
              mt: 2,
              mb: 1,
              backgroundColor: "#19AEDC",
              color: "#fff",
              fontFamily: "albert sans",
            }}
          >
            Book Now
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShareIcon />}
            fullWidth
            sx={{
              mb: 1,
              borderColor: "#19AEDC",
              color: "#19AEDC",
              fontFamily: "albert sans",
            }}
          >
            Share Event
          </Button>

          {formData?.eventDetails?.speaker?.some(
            (s) => s.name.trim() || s.role.trim()
          ) && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "30px",
                    fontFamily: "albert sans",
                  }}
                >
                  Featured Speakers
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    flexDirection: "column",
                    gap: 4,
                    mt: 2,
                  }}
                >
                  {formData.eventDetails.speaker.map((speaker, index) => {
                    const hasContent =
                      speaker.name?.trim() || speaker.role?.trim();
                    if (!hasContent) return null;

                    return (
                      <Box
                        key={index}
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar />
                        <Typography
                          variant="body1"
                          sx={{ fontFamily: "albert sans" }}
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
                    );
                  })}
                </Box>
              </CardContent>
            </Card>
          )}

          <Card sx={{ mt: 2 }}>
            {formData?.finalSetup?.tags?.trim() && (
              <CardContent>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    fontSize: "20px",
                    fontFamily: "albert sans",
                  }}
                >
                  TAGs
                </Typography>
                <Box
                  sx={{
                    width: "90%",
                    minHeight: "auto",
                    display: "flex",
                    alignItems: "center",
                    padding: "8px",
                  }}
                >
                  <Typography sx={{ fontFamily: "albert sans" }}>
                    {formData.finalSetup.tags}
                  </Typography>
                </Box>
              </CardContent>
            )}
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default EventPage;
