import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Alert, Divider } from "@mui/material";
import Header from "../Header/MainHeaderWOS";
import axios from "axios";

const RazorPayPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [fetchingData, setFetchingData] = useState(false);
  const {eventId, userUID} = useParams();
  // Extract query parameters
  const queryParams = new URLSearchParams(location.search);
  const orderIdFromUrl = queryParams.get("orderId");
  const eventIdFromUrl = queryParams.get("eventId");

  // Function to fetch payment details from backend
  const fetchPaymentDetails = async (orderId) => {
    setFetchingData(true);
    try {
      // Replace with your actual API endpoint
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

  // On component mount, check for payment data
  useEffect(() => {
    if (location.state) {
      // Use data from location state
      setPaymentData(location.state);
    } else if (orderIdFromUrl) {
      fetchPaymentDetails(orderIdFromUrl);
    } else {
      console.error("Missing payment data. Redirecting back to payment portal.");
      setError("Payment information is missing. Redirecting back to payment portal.");

      const timer = setTimeout(() => {
        navigate(`/paymentportalpage/${eventId}/${userUID}`);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [location.state, orderIdFromUrl, navigate]);

  // Extract data from payment data
  const {
    event = {},
    ticketSummary = [],
    foodSummary = [],
    financial = {}
  } = paymentData || {};

  // Format date for display
  const formattedDate = event?.date ?
    (typeof event.date === 'string' ? event.date :
      new Date(event.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    ) : "Date not available";

  // Calculate total amount in paise (Razorpay requires amount in smallest currency unit)
  const amountInPaise = Math.round((financial?.totalAmount || 0) * 100);

  // Generate an order reference ID if we don't have one from URL
  const orderId = orderIdFromUrl || `ORDER_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

  // Function to save payment record to backend
  const savePaymentRecord = async (paymentRecord) => {
    try {
      // If your API exists
      await axios.post('/api/payment-records', paymentRecord);
      console.log("Payment record saved successfully");
    } catch (err) {
      console.error("Error saving payment record:", err);
      // We still continue with the flow as payment was successful
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

      // Razorpay configuration options using client-side approach
      // Note: In production, you should generate the order on the server side
      const options = {
        key: "rzp_test_Hq1wOkaE1A9FW3", // Replace with your actual Razorpay key
        amount: amountInPaise,
        currency: "INR",
        name: "World of Show",
        description: `Payment for ${event?.name || 'Event Booking'}`,
        // We're using a client-side reference instead of an actual Razorpay order ID
        // In production, you should generate this from your backend
        receipt: orderId,
        prefill: {
          name: "",
          email: "",
          contact: ""
        },
        notes: {
          eventName: event?.name,
          eventDate: formattedDate,
          eventTime: event?.time,
          eventLocation: event?.location,
          ticketQuantity: ticketSummary?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0
        },
        theme: {
          color: "#19AEDC"
        },
        handler: function(response) {
          // This handler will be called when payment is successful
          console.log("Payment successful:", response);

          // Create a complete payment record with all information
          const paymentRecord = {
            paymentId: response.razorpay_payment_id,
            // Note: Without server-side order creation, we don't get a razorpay_order_id
            clientOrderId: orderId,
            signature: response.razorpay_signature,
            event: event,
            ticketSummary: ticketSummary,
            foodSummary: foodSummary,
            financial: financial,
            paymentDate: new Date().toISOString()
          };

          // Save payment record to backend if the API exists
          savePaymentRecord(paymentRecord);

          // Navigate to success page with all payment details
          navigate(`/ticketbookedpage/${eventId}/${userUID}`, {
            state: paymentRecord
          });
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            console.log("Payment modal closed without completing payment");
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.open();
      setLoading(false);
    } catch (err) {
      console.error("Error initializing Razorpay:", err);
      setError("Failed to initialize payment gateway. Please try again.");
      setLoading(false);
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
      setError("Failed to load payment gateway. Please check your internet connection and try again.");
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Show loading state when fetching data
  if (fetchingData) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Render nothing if no data available and still loading
  if (!paymentData && loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Helper function to format currency in INR
  const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Header />

      <Typography variant="h6" sx={{ textAlign: "center", marginTop: "20px", fontWeight: "bold", fontSize: "30px" }}>
        Complete Your Payment
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
          <Alert severity="error" sx={{ width: { xs: "90%", sm: "70%", md: "50%", lg: "30%" }, mb: 2 }}>
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
                  <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
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
                  <Box key={index} sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
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
                <Typography variant="body2" sx={{ color: "#19AEDC" }}>Discount</Typography>
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
              <Typography variant="body1" fontWeight="bold">Amount to Pay</Typography>
              <Typography variant="body1" fontWeight="bold" sx={{ color: "#19AEDC" }}>
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
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Pay Now"
            )}
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
            onClick={() => navigate(`/paymentportalpage/${eventId}/${userUID}`, { state: paymentData })}
          >
            Cancel
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default RazorPayPage;