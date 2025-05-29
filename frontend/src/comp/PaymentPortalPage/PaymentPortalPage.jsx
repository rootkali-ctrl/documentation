import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Divider ,useMediaQuery} from "@mui/material";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import Header from "../Header/MainHeaderWOS";
import { Stepper, Step, StepLabel } from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase_config";

const steps = ["Select Tickets", "Details", "Payment"];

const PaymentPortalPage = () => {
  
  const navigate = useNavigate();
  const {eventId, userUID} = useParams();
  const location = useLocation();
  const [taxPercentage, setTaxPercentage] = useState(18);
  const {
    event = {},
    ticketSummary = [],
    foodSummary = [],
    financial = {
      subtotal: 0,
      convenienceFee: 0,
      discount: 0,
      totalAmount: 0,
    },
  } = location.state || {};
  const [taxIncluded, setTaxIncluded] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");
  const [paddingBottom, setPaddingBottom] = useState(10);
  useEffect(() => {
    const fetchTaxData = async () => {
      try {
        let taxPercent = 18;
        if (event.id) {
          const eventRef = doc(db, "events", event.id);

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
      }
    };
    fetchTaxData();
     let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > lastScrollY;

      setPaddingBottom(isScrollingDown ? 30 : 10);
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [event.id]);

  const formattedDate = event.date
    ? new Date(event.date).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "March 15, 2025";

  const eventTime = event.time || "9:00 AM";
  const isFreeEvent = ticketSummary.every((ticket) => ticket.price === 0);

  const hasFoodItems =
    foodSummary &&
    foodSummary.length > 0 &&
    foodSummary.some((food) => food.price * food.quantity > 0);

  const calculateSubtotalAndTax = () => {
    let subtotal = 0;
    let totalTax = 0;

    // Tickets
    const ticketDetails = ticketSummary.map((ticket) => {
      const price = ticket.price;
      const quantity = ticket.quantity;
      const ticket_total = price * quantity;

      let tax_per_ticket = 0;
      let base_price = price;

      if (taxIncluded) {
        base_price = price / (1 + taxPercentage / 100);
        tax_per_ticket = price - base_price;

        subtotal += ticket_total;
      } else {
        // Tax is not included
        base_price = price;
        tax_per_ticket = (price * taxPercentage) / 100;

        subtotal += ticket_total;

        // Calculate total tax
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
      const price = food.price;
      const quantity = food.quantity;
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

  const { ticketDetails, foodDetails, subtotal, totalTax } =
    calculateSubtotalAndTax();
  console.log(ticketDetails);
  // Calculating the total amount...
  const bookingFee = isFreeEvent ? 0 : financial.convenienceFee || 40.0;
  const discount = financial.discount || 0;

  // Calculating the total here....
  const totalAmount = subtotal + totalTax + bookingFee - discount;

  const handleProceedToPayment = () => {
    if (isFreeEvent && !hasFoodItems) {
      navigate(`/ticketbookedpage/${eventId}/${userUID}`, {
        state: {
          event,
          ticketSummary: ticketDetails,
          financial: {
            subtotal: 0,
            convenienceFee: 0,
            discount: 0,
            tax: 0,
            totalAmount: 0,
            isFreeEvent: true,
          },
        },
      });
    } else {
      navigate(`/razorpaypage/${eventId}/${userUID}`, {
        state: {
          event,
          ticketSummary: ticketDetails,
          foodSummary: foodDetails,
          financial: {
            subtotal,
            convenienceFee: bookingFee,
            discount,
            tax: totalTax,
            totalAmount,
            isFreeEvent,
          },
        },
      });
    }
  };

  return (
    <Box sx={{ backgroundColor: "#FFFFFF", minHeight: "100vh",overflowX: "hidden", overflowY: "hidden",mb:isMobile?9:0 }}>
      <Header />
  
      <Stepper
        activeStep={2}
        alternativeLabel
        sx={{
          padding: { xs: "20px 0%", md: "20px 5%" },

          width: { xs: "100%", sm: "80%", md: "50%" },
          margin: "0 auto",
        }}
      >
        {steps.map((label, index) => (
          <Step key={index}>
            <StepLabel
              sx={{
                "& .MuiStepLabel-label": {
                  color: index === 2 ? "#19AEDC" : "#ccc",
                  fontWeight: index === 2 ? "bold" : "normal",
                  fontSize: { xs: "12px", sm: "14px", md: "16px" },
                },
                "& .MuiStepIcon-root": {
                  color: index === 2 ? "rgb(25, 174, 220)" : "#ccc",
                },
              }}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
  
      <Typography
        variant="h6"
        sx={{
          textAlign: "center",
          marginTop: "20px",
          fontWeight: "bold",
          fontSize: { xs: "20px", sm: "24px", md: "30px" },
        }}
      >
        Payment Details
      </Typography>
  
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          px: { xs: 2, sm: 4 },
        }}
      >
        <Box
          sx={{
            backgroundColor: "#FFFFFF",
            width: { xs: "100%", sm: "80%", md: "50%", lg: "30%" },
            padding: { xs: "15px", sm: "20px", md: "25px" },
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
            marginTop: "3%",
            marginBottom: "3%",
          }}
        >
          <Box
            sx={{
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #DDDDDD",
              marginBottom: "15px",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight="bold" sx={{ color: "#19AEDC" }}>
                {event.name || "Summer Music Festival 2025"}
              </Typography>
            </Box>
  
            <Divider sx={{ my: 1 }} />
  
            <Box mt={1} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <EventIcon color="#19AEDC" />
              <Typography variant="body2" sx={{ color: "#4B5563" }}>
                {formattedDate}
              </Typography>
            </Box>
  
            <Box mt={1} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AccessTimeIcon color="#19AEDC" />
              <Typography variant="body2" sx={{ color: "#4B5563" }}>
                {eventTime}
              </Typography>
            </Box>
  
            <Box mt={1} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOnIcon color="#19AEDC" />
              <Typography variant="body2" sx={{ color: "#4B5563" }}>
                {event.location || "Convention Center, Mumbai"}
              </Typography>
            </Box>
  
            <Divider sx={{ my: 1 }} />
  
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
                    <Typography variant="body2">Ticket Type</Typography>
                    <Typography variant="body2" fontWeight="bold">
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
                    <Typography variant="body2">Number of Tickets</Typography>
                    <Typography variant="body2" fontWeight="bold">
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
                    <Typography variant="body2">
                      Price per Ticket {ticket.taxIncluded ? "(Incl. Tax)" : ""}
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹
                      {(ticket.taxIncluded
                        ? ticket.base_price
                        : ticket.price
                      ).toFixed(2)}
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
                    <Typography variant="body2">
                      Tax per Ticket ({taxPercentage}%)
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ₹{ticket.tax_per_ticket.toFixed(2)}
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
                  <Typography variant="body2">Ticket Type</Typography>
                  <Typography variant="body2" fontWeight="bold">
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
                  <Typography variant="body2">Number of Tickets</Typography>
                  <Typography variant="body2" fontWeight="bold">
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
                  <Typography variant="body2">Price per Ticket</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ₹0.00
                  </Typography>
                </Box>
              </>
            )}
  
            {foodDetails && foodDetails.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography
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
                      <Typography variant="body2">{food.name}</Typography>
                      <Typography variant="body2">
                        {food.quantity}x ₹{food.price.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: "3%",
                      }}
                    >
                      <Typography variant="body2">
                        Tax ({taxPercentage}%)
                      </Typography>
                      <Typography variant="body2">
                        {food.quantity}x ₹{food.tax_per_food.toFixed(2)}
                      </Typography>
                    </Box>
                  </React.Fragment>
                ))}
              </>
            )}
          </Box>
  
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: "5px",
            }}
          >
            <Typography variant="body2">Sub-total</Typography>
            <Typography variant="body2" fontWeight="bold">
              ₹{subtotal.toFixed(2)}
            </Typography>
          </Box>
  
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: "5px",
            }}
          >
            <Typography variant="body2">Booking Fee</Typography>
            <Typography variant="body2" fontWeight="bold">
              ₹{bookingFee.toFixed(2)}
            </Typography>
          </Box>
  
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: "5px",
            }}
          >
            <Typography variant="body2" sx={{ color: "#19AEDC" }}>
              Discount
            </Typography>
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color: "#19AEDC" }}
            >
              -₹{discount.toFixed(2)}
            </Typography>
          </Box>
  
          {totalTax > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: "5px",
              }}
            >
              <Typography variant="body2">
                Total Tax ({taxPercentage}%)
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                ₹{totalTax.toFixed(2)}
              </Typography>
            </Box>
          )}
  
          <Divider sx={{ my: 1 }} />
  
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: "10px",
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Total Amount
            </Typography>
            <Typography variant="h6" fontWeight="bold" sx={{ color: "#19AEDC" }}>
              {totalAmount === 0 ? "FREE" : `₹${totalAmount.toFixed(2)}`}
            </Typography>
          </Box>
          {!isMobile && 
          <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "#4AA8E4",
              color: "#fff",
              borderRadius: "5px",
              padding: "10px",
              fontSize: { xs: "14px", md: "16px" },
              "&:hover": { backgroundColor: "#3995D1" },
            }}
            onClick={handleProceedToPayment}
          >
            {totalAmount === 0 ? "Complete Registration" : "Proceed to Pay"}
          </Button>
}
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
                       padding: `10px 0 ${paddingBottom}px 0`,
                    transition: "padding 0.5s ease-in-out",
                      zIndex: 1000,
                      display: "flex",
                      justifyContent: "center",
                    }}
                   >
                   
                   <Button
            fullWidth
            variant="contained"
            sx={{
              backgroundColor: "rgb(25, 174, 220)",
              color: "#fff",
              borderRadius: "25px",
              padding: "10px",
              width: "60%",
              fontSize: { xs: "14px", md: "20px" },
              "&:hover": { backgroundColor: "#3995D1" },
            }}
            onClick={handleProceedToPayment}
          >
            {totalAmount === 0 ? "Complete Registration" : "Proceed to Pay"}
          </Button> 
          </Box>)}
      </Box>
    </Box>
  );
  
};

export default PaymentPortalPage;
