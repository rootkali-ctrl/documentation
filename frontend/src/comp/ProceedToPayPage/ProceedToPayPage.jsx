import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
} from "@mui/material";
import Header from "../Header/MainHeaderWOS";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Stepper, Step, StepLabel } from "@mui/material";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import EventIcon from "@mui/icons-material/Event";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { doc, getDoc, runTransaction } from "firebase/firestore";
import { getStorage, ref, getDownloadURL, listAll } from "firebase/storage";
import { db } from "../../firebase_config";

// Default fallback image if loading fails
const DEFAULT_EVENT_IMAGE = "https://via.placeholder.com/800x400";

const steps = ["Select Tickets", "Details", "Payment"];

const ProceedToPayPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventId, userUID } = useParams();
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [event, setEvent] = useState(null);
  const [eventCoupons, setEventCoupons] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponSuccess, setCouponSuccess] = useState(null);
  const [ticketData, setTicketData] = useState([]);
  const [foodData, setFoodData] = useState([]);
  const [financialData, setFinancialData] = useState({
    subtotal: 0,
    convenienceFee: 40,
    totalAmount: 0,
  });
  const [eventImage, setEventImage] = useState(DEFAULT_EVENT_IMAGE);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [paddingBottom, setPaddingBottom] = useState(10);

  // Get the data passed from the TicketPricePage
  useEffect(() => {
    if (location.state) {
      const {
        event: eventData,
        ticketSummary = [],
        foodSummary = [],
        financial = { subtotal: 0, convenienceFee: 40, totalAmount: 0 },
      } = location.state;

      // Create a Map to store unique ticket types based on BOTH type and price
      const uniqueTickets = new Map();

      if (ticketSummary && ticketSummary.length > 0) {
        ticketSummary.forEach((ticket) => {
          if (ticket.quantity > 0) {
            // Only include tickets that are explicitly part of the event's ticket types
            if (
              ticket.type !== "Free Admission" ||
              eventData?.ticket?.some((t) => t.ticketType === "Free Admission")
            ) {
              const uniqueKey = `${ticket.type}_${ticket.price}`;
              if (uniqueTickets.has(uniqueKey)) {
                const existingTicket = uniqueTickets.get(uniqueKey);
                existingTicket.quantity += ticket.quantity;
                uniqueTickets.set(uniqueKey, existingTicket);
              } else {
                uniqueTickets.set(uniqueKey, { ...ticket });
              }
            }
          }
        });
      }

      const selectedTickets = Array.from(uniqueTickets.values());
      setTicketData(selectedTickets);
      setFoodData(foodSummary);
      setFinancialData(financial);

      if (eventData) {
        setEvent(eventData);
      }
    }

    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      setPaddingBottom(isScrollingDown ? 30 : 10);
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.state]);

  // Check if this is a free event (all tickets are free)
  const isFreeEvent =
    ticketData.length > 0 && ticketData.every((ticket) => ticket.price === 0);

  // Fetch event details and coupons
  useEffect(() => {
    if (!location.state || !location.state.event) {
      const fetchEventDetails = async () => {
        try {
          setIsLoading(true);
          if (!eventId) {
            setError("No event ID provided");
            return;
          }

          const eventDoc = await getDoc(doc(db, "events", eventId));

          if (eventDoc.exists()) {
            const fetchedEventData = eventDoc.data();
            setEvent({
              id: eventDoc.id,
              vendorId: fetchedEventData.vendorId,
              name: fetchedEventData.name,
              date: fetchedEventData.eventDate,
              location:
                fetchedEventData.venueDetails?.city || "Unknown Location",
              description:
                fetchedEventData.description || "No description available",
              ticket: fetchedEventData.pricing || [],
            });
            // Extract coupon information with timesUsed
            if (
              fetchedEventData.coupons &&
              Array.isArray(fetchedEventData.coupons)
            ) {
              const updatedCoupons = fetchedEventData.coupons.map((coupon) => ({
                ...coupon,
                timesUsed: coupon.timesUsed || 0, // Default to 0 if not set
              }));
              setEventCoupons(updatedCoupons);
            }

            setError("No tickets selected. Please select tickets first.");
          } else {
            setError("Event not found");
          }
        } catch (err) {
          console.error("Error fetching event details:", err);
          setError("Failed to load event data");
        } finally {
          setIsLoading(false);
        }
      };

      fetchEventDetails();
    } else {
      setEvent(location.state.event);

      const fetchEventCoupons = async () => {
        try {
          if (location.state.event.id || eventId) {
            const eventDoc = await getDoc(doc(db, "events", eventId));
            if (eventDoc.exists()) {
              const fullEventData = eventDoc.data();
              if (
                fullEventData.coupons &&
                Array.isArray(fullEventData.coupons)
              ) {
                const updatedCoupons = fullEventData.coupons.map((coupon) => ({
                  ...coupon,
                  timesUsed: coupon.timesUsed || 0, // Default to 0 if not set
                }));
                setEventCoupons(updatedCoupons);
              }
            }
          }
        } catch (err) {
          console.error("Error fetching event coupons:", err);
        }
      };

      fetchEventCoupons();

      if (
        (!ticketData || ticketData.length === 0) &&
        (!foodData || foodData.length === 0)
      ) {
        setError("No items selected");
      } else {
        setIsLoading(false);
        setError(null);
      }
    }
  }, [eventId, location.state, ticketData, foodData]);

  // Fetch event banner images from Firestore
  useEffect(() => {
    const fetchEventImages = async () => {
      setImageLoading(true);
      try {
        if (eventId) {
          const eventDocRef = doc(db, "events", eventId);
          const eventDoc = await getDoc(eventDocRef);

          if (eventDoc.exists()) {
            const eventData = eventDoc.data();
            const images = eventData.images || eventData.bannerImages || [];

            if (images.length > 0) {
              setEventImage(images[4] || images[0]); // Show 5th image, fallback to 1st
            } else {
              setEventImage(DEFAULT_EVENT_IMAGE);
            }
          } else {
            console.log("No event document found");
            setEventImage(DEFAULT_EVENT_IMAGE);
          }
        }
      } catch (error) {
        console.error("Error fetching event images:", error);
        setEventImage(DEFAULT_EVENT_IMAGE);
      } finally {
        setImageLoading(false);
      }
    };

    if (event?.id || eventId) {
      fetchEventImages();
    }
  }, [event, eventId]);

  // Log vendor ID for debugging
  useEffect(() => {
    if (event) {
      console.log("Vendor ID:", event);
    }
  }, [event]);

  // Handler to go back to ticket selection
  const handleBackToTickets = () => {
    if (eventId) {
      navigate(`/ticketpricepage/${eventId}/${userUID}`);
    } else if (event && event.id) {
      navigate(`/ticketpricepage/${event.id}/${userUID}`);
    } else {
      navigate("/");
    }
  };

  // Calculate ticket subtotal only (for coupon discounts)
  const calculateTicketSubtotal = () => {
    return ticketData.reduce((total, ticket) => {
      return total + ticket.quantity * ticket.price;
    }, 0);
  };

  // Handler for promo code application
  const handleApplyPromoCode = async () => {
    // Clear previous coupon results
    setDiscount(0);
    setAppliedCoupon(null);
    setCouponSuccess(null);

    if (!promoCode) {
      setError("Please enter a promo code");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Find the coupon
    const coupon = eventCoupons.find(
      (c) => c.couponCode === promoCode.toUpperCase()
    );

    if (!coupon) {
      setError("Invalid promo code");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check if coupon is within valid date range
    const currentDate = new Date();
    const startDate = new Date(coupon.startTime);
    const endDate = new Date(coupon.endTime);

    if (currentDate < startDate || currentDate > endDate) {
      setError("Coupon is not valid at this time");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check coupon usage limit using a transaction
    try {
      const eventRef = doc(db, "events", eventId);
      await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }

        const eventData = eventDoc.data();
        const coupons = eventData.coupons || [];
        const couponIndex = coupons.findIndex(
          (c) => c.couponCode === promoCode.toUpperCase()
        );

        if (couponIndex === -1) {
          throw new Error("Coupon not found");
        }

        const selectedCoupon = coupons[couponIndex];
        const timesUsed = selectedCoupon.timesUsed || 0;

        if (timesUsed >= selectedCoupon.couponLimits) {
          throw new Error("Coupon usage limit reached");
        }

        // Calculate discount
        const discountAmount = Math.min(
          selectedCoupon.reducePert || 0,
          calculateTicketSubtotal()
        );
        const roundedDiscount = Math.round(discountAmount * 100) / 100;

        // Update timesUsed in Firestore
        coupons[couponIndex].timesUsed = timesUsed + 1;
        transaction.update(eventRef, { coupons });

        // Update state
        setDiscount(roundedDiscount);
        setAppliedCoupon(selectedCoupon);
        setCouponSuccess(
          `Coupon successfully applied! You saved ₹${roundedDiscount.toFixed(2)}`
        );
        setTimeout(() => setCouponSuccess(null), 5000);
      });
    } catch (err) {
      console.error("Error applying coupon:", err);
      setError(err.message || "Failed to apply coupon");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Function to apply coupon directly from the available coupons section
  const applyDirectCoupon = async (coupon) => {
    // Check if coupon is currently valid
    const currentDate = new Date();
    const startDate = new Date(coupon.startTime);
    const endDate = new Date(coupon.endTime);
    const isValid = currentDate >= startDate && currentDate <= endDate;

    if (!isValid) {
      setError("This coupon is not currently active");
      setTimeout(() => setError(null), 3000);
      return;
    }

    // Check coupon usage limit using a transaction
    try {
      const eventRef = doc(db, "events", eventId);
      await runTransaction(db, async (transaction) => {
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }

        const eventData = eventDoc.data();
        const coupons = eventData.coupons || [];
        const couponIndex = coupons.findIndex(
          (c) => c.couponCode === coupon.couponCode
        );

        if (couponIndex === -1) {
          throw new Error("Coupon not found");
        }

        const selectedCoupon = coupons[couponIndex];
        const timesUsed = selectedCoupon.timesUsed || 0;

        if (timesUsed >= selectedCoupon.couponLimits) {
          throw new Error("Coupon usage limit reached");
        }

        // Calculate discount
        const discountAmount = Math.min(
          selectedCoupon.reducePert || 0,
          calculateTicketSubtotal()
        );
        const roundedDiscount = Math.round(discountAmount * 100) / 100;

        // Update timesUsed in Firestore
        coupons[couponIndex].timesUsed = timesUsed + 1;
        transaction.update(eventRef, { coupons });

        // Update state
        setPromoCode(coupon.couponCode);
        setDiscount(roundedDiscount);
        setAppliedCoupon(selectedCoupon);
        setCouponSuccess(
          `Coupon successfully applied! You saved ₹${roundedDiscount.toFixed(2)}`
        );
        setTimeout(() => setCouponSuccess(null), 5000);
      });
    } catch (err) {
      console.error("Error applying coupon:", err);
      setError(err.message || "Failed to apply coupon");
      setTimeout(() => setError(null), 3000);
    }
  };

  // Calculate total with discount
  const calculatedConvenienceFee = isFreeEvent
    ? 0
    : financialData.convenienceFee;
  const calculatedTotal = Math.max(
    0,
    financialData.subtotal + calculatedConvenienceFee - discount
  );

  // If loading, show loading indicator
  if (isLoading) {
    return (
      <Box sx={{ minHeight: "100vh", overflow: "hidden" }}>
        <Header />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "70vh",
          }}
        >
          <CircularProgress sx={{ color: "#19AEDC" }} />
        </Box>
      </Box>
    );
  }

  // List of FAQs about coupons
  const couponFAQs = [
    {
      question: "How do I apply a coupon code?",
      answer:
        "Enter your coupon code in the promo code field and click 'Apply'. The discount will be automatically calculated if the code is valid.",
    },
    {
      question: "Why isn't my coupon code working?",
      answer:
        "Coupon codes may be limited by time period, maximum usage, or may only apply to specific tickets. Check that your coupon is valid for this event, hasn't expired, and hasn't reached its usage limit.",
    },
    {
      question: "Can I use multiple coupon codes?",
      answer: "No, only one coupon code can be applied per order.",
    },
    {
      question: "Do coupons apply to convenience fees?",
      answer:
        "No, coupons only apply to the ticket price, not to convenience fees or food items.",
    },
  ];

  // Function to display ticket price (handle free tickets)
  const displayTicketPrice = (price) => {
    return price === 0 ? "Free" : `₹${price}`;
  };

  return (
    <Box sx={{ minHeight: "100vh", overflow: "hidden" }}>
      <Header />
      <Box sx={{ backgroundColor: "#F9FAFB" }} />

      {/* Stepper */}
      <Stepper
        activeStep={1}
        alternativeLabel
        sx={{
          padding: "20px 5%",
          width: isMobile ? "90%" : "50%",
          margin: "0 auto",
        }}
      >
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label": {
                  color: index === 1 ? "#19AEDC" : "#ccc",
                  fontWeight: index === 1 ? "bold" : "normal",
                  fontSize: isMobile ? "12px" : "inherit",
                },
                "& .MuiStepIcon-root": {
                  color: index === 1 ? "rgb(25, 174, 220)" : "#ccc",
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Error and Success messages */}
      {error && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Alert severity="error" sx={{ width: "80%", maxWidth: "600px" }}>
            {error}
          </Alert>
        </Box>
      )}
      {couponSuccess && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Alert severity="success" sx={{ width: "80%", maxWidth: "600px" }}>
            {couponSuccess}
          </Alert>
        </Box>
      )}

      {/* Main Content */}
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "center",
          gap: isMobile ? "24px" : "3%",
          margin: isMobile ? "16px" : "3% 10%",
        }}
      >
        {/* Left Section */}
        <Box
          sx={{
            width: isMobile ? "100%" : "55%",
            backgroundColor: "#fff",
            borderRadius: "8px",
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Event Image with Loading State */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: isMobile ? "200px" : "300px",
              backgroundColor: "#f0f0f0",
            }}
          >
            {imageLoading ? (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <CircularProgress sx={{ color: "#19AEDC" }} />
              </Box>
            ) : (
              <img
                src={eventImage}
                alt="Event"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "opacity 0.5s ease-in-out",
                }}
                onError={(e) => {
                  console.error("Image failed to load:", e);
                  setEventImage(DEFAULT_EVENT_IMAGE);
                }}
              />
            )}
          </Box>

          <Box sx={{ padding: "16px" }}>
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{ fontSize: "30px" }}
            >
              {event?.name || "Event Name"}
            </Typography>
            <Box
              mt={isMobile ? 1 : 2}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <EventIcon sx={{ color: "#19AEDC" }} />
              <Typography variant="body2" sx={{ color: "#4B5563" }}>
                {event?.date
                  ? new Date(event.date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Date not specified"}
              </Typography>
            </Box>
            <Box
              mt={isMobile ? 1 : 2}
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              <LocationOnIcon sx={{ color: "#19AEDC" }} />
              <Typography variant="body2" sx={{ color: "#4B5563" }}>
                {event?.location || "Location not specified"}
              </Typography>
            </Box>
            <Box mt={isMobile ? 1 : 2}>
              <Typography
                variant="body2"
                sx={{ marginTop: "8px", color: "#555" }}
              >
                {event?.description || "No description available"}
              </Typography>
            </Box>

            {/* Coupon FAQ Section */}
            {!isMobile && (
              <Box mt={isMobile ? 2 : 4}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                  Coupon & Discount FAQs
                </Typography>

                {couponFAQs.map((faq, index) => (
                  <Accordion
                    key={index}
                    sx={{ mb: 1, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        backgroundColor: "#f9fafb",
                        "&:hover": { backgroundColor: "#f0f4f8" },
                      }}
                    >
                      <Typography fontWeight="medium">
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" color="text.secondary">
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}

                {/* Available Coupons Section */}
                {eventCoupons.length > 0 && (
                  <Box mt={3}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                      Available Coupons
                    </Typography>
                    {eventCoupons.map((coupon, index) => {
                      const startDate = new Date(
                        coupon.startTime
                      ).toLocaleDateString();
                      const endDate = new Date(
                        coupon.endTime
                      ).toLocaleDateString();
                      const isValid =
                        new Date() >= new Date(coupon.startTime) &&
                        new Date() <= new Date(coupon.endTime);
                      const timesUsed = coupon.timesUsed || 0;
                      const remainingUses = coupon.couponLimits - timesUsed;

                      return (
                        <Box
                          key={index}
                          sx={{
                            border: "1px dashed #19AEDC",
                            borderRadius: "8px",
                            p: 2,
                            mb: 2,
                            backgroundColor: isValid && remainingUses > 0
                              ? "rgba(25, 174, 220, 0.05)"
                              : "#f5f5f5",
                            position: "relative",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              position: "absolute",
                              top: 0,
                              right: 0,
                              backgroundColor: isValid && remainingUses > 0 ? "#19AEDC" : "#9e9e9e",
                              color: "white",
                              px: 2,
                              py: 0.5,
                              borderBottomLeftRadius: "8px",
                            }}
                          >
                            <Typography variant="caption" fontWeight="bold">
                              {isValid && remainingUses > 0 ? "ACTIVE" : "INACTIVE"}
                            </Typography>
                          </Box>

                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            sx={{ color: "#19AEDC" }}
                          >
                            {coupon.couponCode}
                          </Typography>

                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" fontWeight="medium">
                              ₹{coupon.reducePert} off
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 0.5 }}
                            >
                              Valid: {startDate} - {endDate}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              Uses remaining: {remainingUses}/{coupon.couponLimits}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              *Applies to ticket prices only
                            </Typography>
                          </Box>

                          <Button
                            size="small"
                            sx={{
                              mt: 1,
                              color: "#19AEDC",
                              "&:hover": {
                                backgroundColor: "rgba(25, 174, 220, 0.1)",
                              },
                            }}
                            onClick={() => applyDirectCoupon(coupon)}
                            disabled={!isValid || remainingUses <= 0}
                          >
                            Apply
                          </Button>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            )}
            {/* Back to tickets button */}
            {!isMobile && (
              <Button
                variant="outlined"
                sx={{
                  marginTop: "20px",
                  color: "#19AEDC",
                  borderColor: "#19AEDC",
                  "&:hover": {
                    borderColor: "#0d8daf",
                    backgroundColor: "rgba(25, 174, 220, 0.04)",
                  },
                }}
                onClick={handleBackToTickets}
              >
                Back to Tickets
              </Button>
            )}
          </Box>
        </Box>

        {/* Right Section - Order Summary */}
        <Box
          sx={{
            width: isMobile ? "93%" : "25%",
            height: "fit-content",
            backgroundColor: "#fff",
            padding: isMobile ? "16px" : "2%",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography variant="h6" fontWeight="bold">
              Order Summary
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />

          {/* Ticket Items - Only show tickets from ticketData */}
          {ticketData && ticketData.length > 0 ? (
            <>
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", paddingTop: "3%" }}
              >
                Tickets
              </Typography>
              {ticketData.map((ticket, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "3%",
                  }}
                >
                  <Typography variant="body2">{ticket.type}</Typography>
                  <Typography variant="body2" textAlign="right">
                    {ticket.quantity}x{displayTicketPrice(ticket.price)}
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            <Typography
              variant="body2"
              sx={{ color: "#4B5563", paddingTop: "3%" }}
            >
              No tickets selected
            </Typography>
          )}

          {/* Food Items (if any) */}
          {foodData && foodData.length > 0 && (
            <>
              <Divider sx={{ my: 1 }} />
              <Typography
                variant="body2"
                sx={{ fontWeight: "bold", paddingTop: "3%" }}
              >
                Food & Beverages
              </Typography>
              {foodData.map((food, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "3%",
                  }}
                >
                  <Typography variant="body2">{food.name}</Typography>
                  <Typography variant="body2" textAlign="right">
                    {food.quantity}x₹{food.price}
                  </Typography>
                </Box>
              ))}
            </>
          )}

          <Divider sx={{ my: 1 }} />

          {/* Price Breakdown */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "3%",
            }}
          >
            <Typography variant="body2">Sub-total</Typography>
            <Typography variant="body2" textAlign="right" fontWeight="bold">
              ₹{financialData.subtotal.toFixed(2)}
            </Typography>
          </Box>

          {/* Only show convenience fee if not a free event */}
          {!isFreeEvent && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "5%",
              }}
            >
              <Typography variant="body2">Convenience Fee</Typography>
              <Typography variant="body2" textAlign="right" fontWeight="bold">
                ₹{financialData.convenienceFee.toFixed(2)}
              </Typography>
            </Box>
          )}

          {/* Discount row (appears only when discount is applied) */}
          {discount > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                paddingTop: "5%",
              }}
            >
              <Typography variant="body2" sx={{ color: "#19AEDC" }}>
                Discount
              </Typography>
              <Typography
                variant="body2"
                textAlign="right"
                fontWeight="bold"
                sx={{ color: "#19AEDC" }}
              >
                -₹{discount.toFixed(2)}
              </Typography>
            </Box>
          )}

          <Divider sx={{ my: 1 }} />
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              paddingTop: "5%",
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Total Amount
            </Typography>
            <Typography variant="h6" textAlign="right" fontWeight="bold">
              ₹{calculatedTotal.toFixed(2)}
            </Typography>
          </Box>

          {/* Promo Code Input */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              padding: "8px",
              borderRadius: "5px",
              marginTop: "4%",
              border: "1px solid #E5E7EB",
              borderColor: appliedCoupon ? "#19AEDC" : "#E5E7EB",
              mb: isMobile ? "1" : 0,
            }}
          >
            <TextField
              placeholder="PROMO CODE"
              variant="standard"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              disabled={appliedCoupon !== null}
              InputProps={{
                disableUnderline: true,
                sx: {
                  fontSize: "14px",
                  width: "100%",
                  padding: "8px",
                  borderRadius: "5px",
                },
              }}
            />
            {appliedCoupon ? (
              <Button
                sx={{
                  textTransform: "none",
                  fontSize: "14px",
                  color: "error.main",
                  fontWeight: "bold",
                }}
                onClick={() => {
                  setAppliedCoupon(null);
                  setPromoCode("");
                  setDiscount(0);
                }}
              >
                Remove
              </Button>
            ) : (
              <Button
                sx={{
                  textTransform: "none",
                  fontSize: "14px",
                  color: "#19AEDC",
                  fontWeight: "bold",
                }}
                onClick={handleApplyPromoCode}
              >
                Apply
              </Button>
            )}
          </Box>
          {isMobile && (
            <Box mt={isMobile ? 2 : 4} mb={isMobile ? 15 : 0}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                Coupon & Discount FAQs
              </Typography>

              {couponFAQs.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{ mb: 1, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    sx={{
                      backgroundColor: "#f9fafb",
                      "&:hover": { backgroundColor: "#f0f4f8" },
                    }}
                  >
                    <Typography fontWeight="medium">{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}

              {/* Available Coupons Section */}
              {eventCoupons.length > 0 && (
                <Box mt={3}>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                    Available Coupons
                  </Typography>
                  {eventCoupons.map((coupon, index) => {
                    const startDate = new Date(
                      coupon.startTime
                    ).toLocaleDateString();
                    const endDate = new Date(
                      coupon.endTime
                    ).toLocaleDateString();
                    const isValid =
                      new Date() >= new Date(coupon.startTime) &&
                      new Date() <= new Date(coupon.endTime);
                    const timesUsed = coupon.timesUsed || 0;
                    const remainingUses = coupon.couponLimits - timesUsed;

                    return (
                      <Box
                        key={index}
                        sx={{
                          border: "1px dashed #19AEDC",
                          borderRadius: "8px",
                          p: 2,
                          mb: 2,
                          backgroundColor: isValid && remainingUses > 0
                            ? "rgba(25, 174, 220, 0.05)"
                            : "#f5f5f5",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <Box
                          sx={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            backgroundColor: isValid && remainingUses > 0 ? "#19AEDC" : "#9e9e9e",
                            color: "white",
                            px: 2,
                            py: 0.5,
                            borderBottomLeftRadius: "8px",
                          }}
                        >
                          <Typography variant="caption" fontWeight="bold">
                            {isValid && remainingUses > 0 ? "ACTIVE" : "INACTIVE"}
                          </Typography>
                        </Box>

                        <Typography
                          variant="h6"
                          fontWeight="bold"
                          sx={{ color: "#19AEDC" }}
                        >
                          {coupon.couponCode}
                        </Typography>

                        <Box sx={{ mt: 1 }}>
                          <Typography variant="body2" fontWeight="medium">
                            ₹{coupon.reducePert} off
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5 }}
                          >
                            Valid: {startDate} - {endDate}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                          >
                            Uses remaining: {remainingUses}/{coupon.couponLimits}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            *Applies to ticket prices only
                          </Typography>
                        </Box>

                        <Button
                          size="small"
                          sx={{
                            mt: 1,
                            color: "#19AEDC",
                            "&:hover": {
                              backgroundColor: "rgba(25, 174, 220, 0.1)",
                            },
                          }}
                          onClick={() => applyDirectCoupon(coupon)}
                          disabled={!isValid || remainingUses <= 0}
                        >
                          Apply
                        </Button>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          {/* Proceed Button */}
          {!isMobile && (
            <Button
              fullWidth
              variant="contained"
              sx={{
                backgroundColor: "#19AEDC",
                color: "#fff",
                marginTop: "5%",
                borderRadius: "8px",
                padding: "4%",
                fontSize: "18px",
                "&:hover": { backgroundColor: "#0c8baf" },
              }}
              onClick={() =>
                navigate(`/paymentportalpage/${eventId}/${userUID}`, {
                  state: {
                    event,
                    ticketSummary: ticketData,
                    foodSummary: foodData,
                    financial: {
                      ...financialData,
                      discount,
                      totalAmount: calculatedTotal,
                      appliedCoupon: appliedCoupon
                        ? {
                            couponCode: appliedCoupon.couponCode,
                            reducePert: appliedCoupon.reducePert,
                            startTime: appliedCoupon.startTime,
                            endTime: appliedCoupon.endTime,
                            timesUsed: appliedCoupon.timesUsed,
                          }
                        : null,
                    },
                  },
                })
              }
            >
              Proceed to Payment
            </Button>
          )}
        </Box>
      </Box>
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
            padding: `10px 0 ${paddingBottom}px 0`,
            transition: "padding 0.5s ease-in-out",
            justifyContent: "center",
          }}
        >
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#19AEDC",
              color: "#fff",
              width: "60%",
              borderRadius: "25px",
              padding: "3%",
              fontSize: "14px",
              "&:hover": { backgroundColor: "#0c8baf" },
            }}
            onClick={() =>
              navigate(`/paymentportalpage/${eventId}/${userUID}`, {
                state: {
                  event,
                  ticketSummary: ticketData,
                  foodSummary: foodData,
                  financial: {
                    ...financialData,
                    discount,
                    totalAmount: calculatedTotal,
                    appliedCoupon: appliedCoupon
                      ? {
                          couponCode: appliedCoupon.couponCode,
                          reducePert: appliedCoupon.reducePert,
                          startTime: appliedCoupon.startTime,
                          endTime: appliedCoupon.endTime,
                          timesUsed: appliedCoupon.timesUsed,
                        }
                      : null,
                  },
                },
              })
            }
          >
            Proceed to Payment
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default ProceedToPayPage;