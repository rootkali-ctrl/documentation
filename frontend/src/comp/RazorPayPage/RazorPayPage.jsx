import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Box, Typography, Button, CircularProgress, Alert, Divider } from "@mui/material";
import axios from "axios";
import { doc, getDoc, deleteDoc, runTransaction } from "firebase/firestore";
import { db } from "../../firebase_config";

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

  // State for the countdown timer (in seconds)
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutes = 600 seconds

  // State for tax percentage and tax inclusion
  const [taxPercentage, setTaxPercentage] = useState(18);
  const [taxIncluded, setTaxIncluded] = useState(false);

  // Fetch tax data from Firestore
  const fetchTaxData = async () => {
    try {
      let taxPercent = 18;
      if (paymentData?.event?.id) {
        const eventRef = doc(db, "events", paymentData.event.id);
        const eventDoc = await getDoc(eventRef);
        if (eventDoc.exists()) {
          const eventData = eventDoc.data();
          const taxBool = eventData.pricing?.[0]?.tax;
          setTaxIncluded(!!taxBool);
          if (eventData.taxPercentage) {
            taxPercent = eventData.taxPercentage;
          } else {
            const globalTaxRef = doc(db, "settings", "globalTax");
            const globalTaxDoc = await getDoc(globalTaxRef);
            if (globalTaxDoc.exists()) {
              taxPercent = globalTaxDoc.data().taxPercentage || 18;
            }
          }
        }
      }
      setTaxPercentage(taxPercent);
    } catch (err) {
      console.error("Error fetching tax data:", err);
      setError("Failed to fetch tax data. Please try again.");
    }
  };

  // Unlock tickets
  const unlockTickets = async (lockId) => {
    if (!lockId) return;

    try {
      await runTransaction(db, async (transaction) => {
        const lockRef = doc(db, "ticketLocks", lockId);
        const lockDoc = await transaction.get(lockRef);

        if (!lockDoc.exists()) {
          return; // Lock already removed
        }

        const lockData = lockDoc.data();
        const eventDocRef = doc(db, "events", eventId);
        const eventDoc = await transaction.get(eventDocRef);

        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }

        const eventData = eventDoc.data();
        const pricing = eventData.pricing || [];

        // Release locked tickets
        for (const ticketId of Object.keys(lockData.tickets)) {
          const ticket = pricing.find((t) => t.id === ticketId);
          if (ticket) {
            ticket.locked = Math.max(0, (ticket.locked || 0) - lockData.tickets[ticketId]);
          }
        }

        transaction.update(eventDocRef, { pricing });
        transaction.delete(lockRef);
      });
    } catch (error) {
      console.error("Error unlocking tickets:", error);
      setError("Failed to unlock tickets. Please try again.");
    }
  };

  // On component mount
  useEffect(() => {
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
    }, 10 * 60 * 1000);

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

    return () => {
      clearAllTimers();
      closeRazorpayModal();
    };
  }, [location.state, orderIdFromUrl, navigate, eventId, userUID]);

  // Fetch tax data once paymentData is available
  useEffect(() => {
    if (paymentData) {
      fetchTaxData();
    }
  }, [paymentData]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
      closeRazorpayModal();
      if (paymentData?.lockId) {
        unlockTickets(paymentData.lockId);
      }
    };
  }, [paymentData]);

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

  const handleTimeoutRedirect = () => {
    clearAllTimers();
    closeRazorpayModal();
    if (paymentData?.lockId) {
      unlockTickets(paymentData.lockId);
    }
    setError("Payment session timed out. Redirecting to the main page...");

    redirectTimerRef.current = setTimeout(() => {
      navigate("/", { replace: true });
    }, 2000);
  };

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

  const {
    ticketSummary = [],
    foodSummary = [],
    financial = {},
    lockId,
  } = paymentData || {};

  const isFreeEvent = ticketSummary.every((ticket) => ticket.price === 0);
  const hasFoodItems =
    foodSummary &&
    foodSummary.length > 0 &&
    foodSummary.some((food) => food.price * food.quantity > 0);

  const calculateSubtotalAndTax = () => {
    let subtotal = 0;
    let totalTax = 0;

    const ticketDetails = ticketSummary.map((ticket) => {
      const price = ticket.price || 0;
      const quantity = ticket.quantity || 0;
      const ticket_total = price * quantity;

      let tax_per_ticket = 0;
      let base_price = price;

      if (taxIncluded) {
        base_price = price / (1 + taxPercentage / 100);
        tax_per_ticket = price - base_price;

        subtotal += ticket_total;
      } else {
        base_price = price;
        tax_per_ticket = (price * taxPercentage) / 100;

        subtotal += ticket_total;

        const ticket_tax = tax_per_ticket * quantity;
        totalTax += ticket_tax;
      }

      return {
        ...ticket,
        ticket_total,
        tax_per_ticket: Math.round(tax_per_ticket * 100) / 100,
        base_price: Math.round(base_price * 100) / 100,
        taxIncluded,
      };
    });

    const foodDetails = foodSummary.map((food) => {
      const price = food.price || 0;
      const quantity = food.quantity || 0;
      const food_total = price * quantity;

      subtotal += food_total;

      const tax_per_food = (price * taxPercentage) / 100;
      const food_tax = tax_per_food * quantity;

      totalTax += food_tax;

      return {
        ...food,
        food_total,
        tax_per_food: Math.round(tax_per_food * 100) / 100,
        base_price: price,
        taxIncluded: false,
      };
    });

    return {
      ticketDetails,
      foodDetails,
      subtotal: Math.round(subtotal * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
    };
  };

  const { ticketDetails, foodDetails, subtotal, totalTax } = calculateSubtotalAndTax();

  const bookingFee = isFreeEvent ? 0 : financial.convenienceFee || 40.0;
  const discount = financial.discount || 0;
  const totalAmount = subtotal + totalTax + bookingFee - discount;

  const amountInPaise = Math.round(totalAmount * 100);

  const orderId =
    orderIdFromUrl || `ORDER_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;

  const savePaymentRecord = async (paymentRecord) => {
    try {
      await axios.post("/api/payment-records", paymentRecord);
      if (lockId) {
        await deleteDoc(doc(db, "ticketLocks", lockId));
      }
    } catch (err) {
      console.error("Error saving payment record:", err);
      setError("Failed to save payment record.");
    }
  };

  const initiatePayment = () => {
    setLoading(true);
    setError(null);

    try {
      if (!totalAmount) {
        setError("Payment information is missing. Please go back and try again.");
        setLoading(false);
        return;
      }

      if (!window.Razorpay) {
        setError("Payment gateway not loaded properly. Please refresh the page.");
        setLoading(false);
        return;
      }

      closeRazorpayModal();

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY,
        amount: amountInPaise,
        currency: "INR",
        name: "TicketB",
        description: `Payment for Event Booking`,
        receipt: orderId,
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        notes: {
          ticketQuantity:
            ticketSummary?.reduce((sum, ticket) => sum + ticket.quantity, 0) || 0,
          lockId,
        },
        theme: {
          color: "#19AEDC",
        },
        handler: function (response) {

          clearAllTimers();
          const timestamp = new Date().getTime().toString(36).slice(-4);
          const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
          const generatedBookingId = `#${randomChars}${timestamp}`;


          const paymentRecord = {
            paymentId: response.razorpay_payment_id,
            clientOrderId: orderId,
            signature: response.razorpay_signature,
            ticketSummary: ticketDetails,
            foodSummary: foodDetails,
            financial: {
              ...financial,
              subtotal,
              tax: totalTax,
              totalAmount,
            },
            paymentDate: new Date().toISOString(),
            lockId,
            bookingId: generatedBookingId
          };

          savePaymentRecord(paymentRecord);

          navigate(`/ticketbookedpage/${eventId}/${userUID}/${generatedBookingId}`, {
            state: {
              ...paymentRecord,
              paymentSuccess: true
            },
            replace: true,
          });
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            razorpayInstanceRef.current = null;
            unlockTickets(lockId);
          },
          onhidden: function () {
            razorpayInstanceRef.current = null;
          },
        },
      };

      razorpayInstanceRef.current = new window.Razorpay(options);

      razorpayInstanceRef.current.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        setError(`Payment failed: ${response.error.description || "Unknown error"}`);
        setLoading(false);
        razorpayInstanceRef.current = null;
        unlockTickets(lockId);
      });

      razorpayInstanceRef.current.open();
      setLoading(false);
    } catch (err) {
      console.error("Error initializing Razorpay:", err);
      setError("Failed to initialize payment gateway. Please try again.");
      setLoading(false);
      razorpayInstanceRef.current = null;
      unlockTickets(lockId);
    }
  };

  useEffect(() => {
    if (window.Razorpay) {
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

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      clearAllTimers();
      closeRazorpayModal();
      if (lockId) {
        unlockTickets(lockId);
      }
    };

    const handlePopState = (event) => {
      clearAllTimers();
      closeRazorpayModal();
      if (lockId) {
        unlockTickets(lockId);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [lockId]);

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

  const formatINR = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  const formatTimeLeft = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  };

  const handleCancel = () => {
    clearAllTimers();
    closeRazorpayModal();
    if (lockId) {
      unlockTickets(lockId);
    }
    navigate(`/paymentportalpage/${eventId}/${userUID}`, {
      state: paymentData,
      replace: true,
    });
  };

  return (
    <Box
      sx={{
        backgroundColor: "#FFFFFF",
        minHeight: "100vh",
      }}
    >
      <Typography
        fontFamily="albert sans"
        variant="h6"
        sx={{ textAlign: "center", marginTop: "20px", fontWeight: "bold", fontSize: "30px" }}
      >
        Complete Your Payment
      </Typography>

      <Typography
        fontFamily="albert sans"
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
          <Typography fontFamily="albert sans" variant="h6" fontWeight="bold">
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
            {/* Removed the Divider above ticket type */}
            {ticketDetails && ticketDetails.length > 0 ? (
              ticketDetails.map((ticket, index) => (
                <React.Fragment key={index}>
                  <Box
                    mt={0.5}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "3%",
                    }}
                  >
                    <Typography fontFamily="albert sans" variant="body2">
                      Ticket Type
                    </Typography>
                    <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
                      {ticket.type || "VIP Pass"}
                    </Typography>
                  </Box>
                  <Box
                    mt={0.5}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "3%",
                    }}
                  >
                    <Typography fontFamily="albert sans" variant="body2">
                      Number of Tickets
                    </Typography>
                    <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
                      {ticket.quantity || 2}
                    </Typography>
                  </Box>
                  <Box
                    mt={0.5}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "3%",
                    }}
                  >
                    <Typography fontFamily="albert sans" variant="body2">
                      Price per Ticket {ticket.taxIncluded ? "(Incl. Tax)" : ""}
                    </Typography>
                    <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
                      {formatINR(ticket.taxIncluded ? ticket.base_price : ticket.price)}
                    </Typography>
                  </Box>
                  <Box
                    mt={0.5}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      paddingTop: "3%",
                    }}
                  >
                    <Typography fontFamily="albert sans" variant="body2">
                      Tax per Ticket ({taxPercentage}%)
                    </Typography>
                    <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
                      {formatINR(ticket.tax_per_ticket)}
                    </Typography>
                  </Box>

                  {index < ticketDetails.length - 1 && (
                    <Divider sx={{ my: 1 }} />
                  )}
                </React.Fragment>
              ))
            ) : (
              <>
                <Box
                  mt={0.5}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "3%",
                  }}
                >
                  <Typography fontFamily="albert sans" variant="body2">
                    Ticket Type
                  </Typography>
                  <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
                    Free Admission
                  </Typography>
                </Box>
                <Box
                  mt={0.5}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "3%",
                  }}
                >
                  <Typography fontFamily="albert sans" variant="body2">
                    Number of Tickets
                  </Typography>
                  <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
                    1
                  </Typography>
                </Box>
                <Box
                  mt={0.5}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "3%",
                  }}
                >
                  <Typography fontFamily="albert sans" variant="body2">
                    Price per Ticket
                  </Typography>
                  <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
                    {formatINR(0)}
                  </Typography>
                </Box>
              </>
            )}
            {foodDetails && foodDetails.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography
                  fontFamily="albert sans"
                  variant="body2"
                  sx={{ fontWeight: "bold", paddingTop: "3%" }}
                >
                  Food & Beverages
                </Typography>
                {foodDetails.map((food, index) => (
                  <React.Fragment key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: "3%",
                      }}
                    >
                      <Typography fontFamily="albert sans" variant="body2">
                        {food.name}
                      </Typography>
                      <Typography fontFamily="albert sans" variant="body2">
                        {food.quantity}x {formatINR(food.price)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: "3%",
                      }}
                    >
                      <Typography fontFamily="albert sans" variant="body2">
                        Tax ({taxPercentage}%)
                      </Typography>
                      <Typography fontFamily="albert sans" variant="body2">
                        {food.quantity}x {formatINR(food.tax_per_food)}
                      </Typography>
                    </Box>
                  </React.Fragment>
                ))}
              </>
            )}
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography fontFamily="albert sans" variant="body2">
              Sub-total
            </Typography>
            <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
              {formatINR(subtotal)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography fontFamily="albert sans" variant="body2">
              Booking Fee
            </Typography>
            <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
              {formatINR(bookingFee)}
            </Typography>
          </Box>
          {discount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography fontFamily="albert sans" variant="body2" sx={{ color: "#19AEDC" }}>
                Discount
              </Typography>
              <Typography
                fontFamily="albert sans"
                variant="body2"
                fontWeight="bold"
                sx={{ color: "#19AEDC" }}
              >
                -{formatINR(discount)}
              </Typography>
            </Box>
          )}
          {totalTax > 0 && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography fontFamily="albert sans" variant="body2">
                Total Tax ({taxPercentage}%)
              </Typography>
              <Typography fontFamily="albert sans" variant="body2" fontWeight="bold">
                {formatINR(totalTax)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
            <Typography fontFamily="albert sans" variant="body1" fontWeight="bold">
              Amount to Pay
            </Typography>
            <Typography
              fontFamily="albert sans"
              variant="body1"
              fontWeight="bold"
              sx={{ color: "#19AEDC" }}
            >
              {totalAmount === 0 ? "FREE" : formatINR(totalAmount)}
            </Typography>
          </Box>
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
              mt: 2,
              fontFamily: "albert sans",
            }}
            onClick={initiatePayment}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Pay Now"}
          </Button>
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
              fontFamily: "albert sans",
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
