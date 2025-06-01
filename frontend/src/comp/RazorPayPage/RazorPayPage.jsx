import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Alert, Divider } from "@mui/material";
import axios from "axios";

const RazorPayPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);
  const { eventId, userUID } = useParams();

  // Refs to store timer IDs for cleanup
  const timeoutTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const redirectTimerRef = useRef(null);
  const razorpayInstanceRef = useRef(null);

  // Extract query parameters
  const queryParams = new URLSearchParams(location.search);
  const orderIdFromUrl = queryParams.get("orderId");
  const eventIdFromUrl = queryParams.get("eventId");

  // State for the countdown timer (in seconds)
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes = 600 seconds

  // Function to clear all timers
  const clearAllTimers = () => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  };

  // Function to close Razorpay modal if open
  const closeRazorpayModal = () => {
    if (razorpayInstanceRef.current) {
      try {
        razorpayInstanceRef.current.close();
        razorpayInstanceRef.current = null;
      } catch (error) {
        console.log("Error closing Razorpay modal:", error);
      }
    }
  };

  // Function to handle timeout and redirect to main page
  const handleTimeoutRedirect = () => {
    clearAllTimers();
    closeRazorpayModal();
    setError("Payment session timed out. Redirecting to the main page...");

    redirectTimerRef.current = setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);
  };

  // Function to fetch payment details from backend
  const fetchPaymentDetails = async (orderId) => {
    setFetchingData(true);
    try {
      const response = await axios.get(`/api/payment-details/${orderId}`);
      if (response.data) {
        setPaymentData(response.data);
        setError(null);
      } else {
        throw new Error("Payment details not found");
      }
    } catch (err) {
      console.error("Error fetching payment details:", err);
      setError("Failed to load payment details. Please try returning to the payment portal.");
    } finally {
      setFetchingData(false);
    }
  };

  // On component mount, check for payment data and start the timeout timer
  useEffect(() => {
    // Handle payment data
    if (location.state) {
      setPaymentData(location.state);
    } else if (orderIdFromUrl) {
      fetchPaymentDetails(orderIdFromUrl);
    } else {
      console.error("Missing payment data. Redirecting back to payment portal.");
      setError("Payment information is missing. Redirecting back to payment portal.");

      redirectTimerRef.current = setTimeout(() => {
        navigate(`/paymentportalpage/${eventId}/${userUID}`, { replace: true });
      }, 3000);

      return () => clearAllTimers();
    }

    // Set up the 10-minute timeout
    timeoutTimerRef.current = setTimeout(() => {
      handleTimeoutRedirect();
    }, 10 * 60 * 1000); // 10 minutes in milliseconds

    // Update the countdown timer every second
    countdownIntervalRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          handleTimeoutRedirect();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup function
    return () => {
      clearAllTimers();
      closeRazorpayModal();
    };
  }, [location.state, orderIdFromUrl, navigate, eventId, userUID]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      closeRazorpayModal();
    };
  }, []);

  // Extract data from payment data
  const {
    event = {},
    ticketSummary = [],
    foodSummary = [],
    financial = {},
  } = paymentData || {};

  // Format date for display
  const formattedDate = event?.date
    ? typeof event.date === "string"
      ? event.date
      : new Date(event.date).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
    : "Date not available";

  // Calculate total amount in paise (Razorpay requires amount in smallest currency unit)
  const amountInPaise = Math.round((financial?.totalAmount || 0) * 100);

  // Generate an order reference ID if we don't have one from URL
  const orderId =
    orderIdFromUrl ||
    `ORDER_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

  // Function to save payment record to backend
  const savePaymentRecord = async (paymentRecord) => {
    try {
      await axios.post("/api/payment-records", paymentRecord);
      console.log("Payment record saved successfully");
    } catch (err) {
      console.error("Error saving payment record:", err);
    }
  };

  // Direct Razorpay checkout without server order creation
  const initiatePayment = () => {
    setLoading(true);
    setError(null);

    try {
      // Make sure data is available before proceeding
      if (!financial?.totalAmount) {
        setError("Payment information is missing. Please go back and try again.");
        setLoading(false);
        return;
      }

      if (!window.Razorpay) {
        setError("Payment gateway not loaded properly. Please refresh the page.");
        setLoading(false);
        return;
      }

      // Close any existing Razorpay instance
      closeRazorpayModal();

      // Razorpay configuration options
      const options = {
        key: "rzp_test_Hq1wOkaE1A9FW3", // Replace with your actual Razorpay key
        amount: amountInPaise,
        currency: "INR",
        name: "World of Show",
        description: `Payment for ${event?.name || "Event Booking"}`,
        receipt: orderId,
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          eventName: event?.name,
          eventDate: formattedDate,
          eventTime: event?.time,
          eventLocation: event?.location,
          ticketQuantity:
            ticketSummary?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0,
        },
        theme: {
          color: "#19AEDC",
        },
        handler: function (response) {
          // Payment successful
          console.log("Payment successful:", response);

          // Clear all timers since payment is successful
          clearAllTimers();

          // Create a complete payment record with all information
          const paymentRecord = {
            paymentId: response.razorpay_payment_id,
            clientOrderId: orderId,
            signature: response.razorpay_signature,
            event: event,
            ticketSummary: ticketSummary,
            foodSummary: foodSummary,
            financial: financial,
            paymentDate: new Date().toISOString(),
          };

          // Save payment record to backend
          savePaymentRecord(paymentRecord);

          // Navigate to success page with all payment details
          navigate(`/ticketbookedpage/${eventId}/${userUID}`, {
            state: paymentRecord,
            replace: true
          });
        },
        modal: {
          ondismiss: function () {
            // Modal dismissed without payment
            setLoading(false);
            razorpayInstanceRef.current = null;
            console.log("Payment modal closed without completing payment");
          },
          onhidden: function () {
            // Modal completely hidden
            razorpayInstanceRef.current = null;
          }
        }
      };

      // Create and store Razorpay instance
      razorpayInstanceRef.current = new window.Razorpay(options);

      // Add error handler for Razorpay instance
      razorpayInstanceRef.current.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setError(`Payment failed: ${response.error.description || 'Unknown error'}`);
        setLoading(false);
        razorpayInstanceRef.current = null;
      });

      // Open the payment modal
      razorpayInstanceRef.current.open();
      setLoading(false);

    } catch (err) {
      console.error("Error initializing Razorpay:", err);
      setError("Failed to initialize payment gateway. Please try again.");
      setLoading(false);
      razorpayInstanceRef.current = null;
    }
  };

  // Load the Razorpay script when component mounts
  useEffect(() => {
    // Check if script is already loaded
    if (window.Razorpay) {
      console.log("Razorpay SDK already loaded");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => console.log("Razorpay SDK loaded successfully");
    script.onerror = () => {
      console.error("Failed to load Razorpay SDK");
      setError(
        "Failed to load payment gateway. Please check your internet connection and try again."
      );
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Handle back navigation and page unload
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      clearAllTimers();
      closeRazorpayModal();
    };

    const handlePopState = (event) => {
      clearAllTimers();
      closeRazorpayModal();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Show loading state when fetching data
  if (fetchingData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Render nothing if no data available and still loading
  if (!paymentData && loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Helper function to format currency in INR
  const formatINR = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Helper function to format the remaining time
  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  // Handle cancel button click
  const handleCancel = () => {
    clearAllTimers();
    closeRazorpayModal();
    navigate(`/paymentportalpage/${eventId}/${userUID}`, {
      state: paymentData,
      replace: true
    });
  };

  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
      }}
    >
<<<<<<< Updated upstream
=======
      {/* Header */}

>>>>>>> Stashed changes

      <Typography
        variant="h6"
        sx={{ textAlign: "center", marginTop: "20px", fontWeight: "bold", fontSize: "30px" }}
      >
        Complete Your Payment
      </Typography>

      {/* Countdown Timer Display */}
      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          marginTop: "10px",
          color: timeLeft <= 60 ? "#f44336" : "#4B5563",
          fontWeight: "medium",
        }}
      >
        Time remaining to complete payment: {formatTimeLeft(timeLeft)}
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        {error && (
          <Alert
            severity="error"
            sx={{ width: { xs: "90%", sm: "70%", md: "50%", lg: "30%" }, mb: 2 }}
          >
            {error}
          </Alert>
        )}

        <Box
          sx={{
            width: { xs: "90%", sm: "70%", md: "50%", lg: "30%" },
            backgroundColor: "#FFFFFF",
            padding: "25px",
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Event Summary */}
          <Typography variant="h6" fontWeight="bold">
            Payment Summary
          </Typography>

          <Box
            sx={{
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #DDDDDD",
              marginTop: "15px",
              marginBottom: "15px",
            }}
          >
            <Typography fontWeight="bold" sx={{ color: "#19AEDC" }}>
              {event?.name || "Event Information Not Available"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#4B5563", marginTop: "5px" }}>
              {formattedDate} at {event?.time || "Time not available"}
            </Typography>
            <Typography variant="body2" sx={{ color: "#4B5563" }}>
              {event?.location || "Location not available"}
            </Typography>

            <Divider sx={{ my: 2 }} />

            {/* Ticket Summary */}
            {ticketSummary && ticketSummary.length > 0 ? (
              <>
                <Typography variant="body2" fontWeight="bold">
                  Tickets:
                </Typography>
                {ticketSummary.map((ticket, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
                  >
                    <Typography variant="body2">
                      {ticket.quantity}x {ticket.type}
                    </Typography>
                    <Typography variant="body2">
                      {formatINR(ticket.price * ticket.quantity)}
                    </Typography>
                  </Box>
                ))}
              </>
            ) : null}

            {/* Food Summary */}
            {foodSummary && foodSummary.length > 0 ? (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
                  Food & Beverages:
                </Typography>
                {foodSummary.map((food, index) => (
                  <Box
                    key={index}
                    sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}
                  >
                    <Typography variant="body2">
                      {food.quantity}x {food.name}
                    </Typography>
                    <Typography variant="body2">
                      {formatINR(food.price * food.quantity)}
                    </Typography>
                  </Box>
                ))}
              </>
            ) : null}

            <Divider sx={{ my: 2 }} />

            {/* Price Breakdown */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2">Subtotal</Typography>
              <Typography variant="body2">{formatINR(financial?.subtotal)}</Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2">Booking Fee</Typography>
              <Typography variant="body2">{formatINR(financial?.convenienceFee)}</Typography>
            </Box>

            {financial?.discount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" sx={{ color: "#19AEDC" }}>
                  Discount
                </Typography>
                <Typography variant="body2" sx={{ color: "#19AEDC" }}>
                  -{formatINR(financial.discount)}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2">GST (18%)</Typography>
              <Typography variant="body2">{formatINR(financial?.gst)}</Typography>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                Amount to Pay
              </Typography>
              <Typography
                variant="body1"
                fontWeight="bold"
                sx={{ color: "#19AEDC" }}
              >
                {formatINR(financial?.totalAmount)}
              </Typography>
            </Box>
          </Box>

          {/* Payment Button */}
          <Button
            fullWidth
            variant="contained"
            disabled={loading || !paymentData}
            sx={{
              backgroundColor: "#19AEDC",
              color: "#fff",
              borderRadius: "5px",
              padding: "12px",
              fontSize: "16px",
              "&:hover": { backgroundColor: "#1496C0" },
            }}
            onClick={initiatePayment}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Pay Now"}
          </Button>

          {/* Cancel Button */}
          <Button
            fullWidth
            variant="outlined"
            sx={{
              color: "#6B7280",
              borderColor: "#D1D5DB",
              borderRadius: "5px",
              padding: "12px",
              fontSize: "16px",
              marginTop: "10px",
            }}
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RazorPayPage;
