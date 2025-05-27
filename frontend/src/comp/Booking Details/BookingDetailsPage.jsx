import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebase_config";
import { CheckCircle, AlertCircle } from "lucide-react";
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Container,
  Divider,
} from "@mui/material";
import qrimage from "../QR image/QRimage.png";

const BookingDetailsPage = () => {
  const [bookingData, setBookingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { bookingId, vendorId } = useParams();

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId, vendorId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!bookingId) {
        throw new Error("No booking ID provided");
      }

      if (!vendorId) {
        throw new Error("No vendor ID provided");
      }

      const bookingDoc = await getDoc(doc(db, "tickets", bookingId));

      if (!bookingDoc.exists()) {
        throw new Error("Booking not found");
      }

      const data = bookingDoc.data();

      if (data.ownerId !== vendorId && data.vendorId !== vendorId) {
        throw new Error("Unauthorized access to this booking");
      }

      const formattedData = {
        ...data,
        bookingDate: data.createdAt
          ? new Date(data.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "N/A",
        eventDate: data.eventDate || "N/A",
        eventTime: data.eventTime || "N/A",
        phone: data.phone || "N/A",
        email: data.email || "N/A",
        eventName: data.eventName || "N/A",
        location: data.location || "N/A",
        financial: {
          convenienceFee: 0,
          discount: 0,
          isFreeEvent: false,
          subtotal: 0,
          tax: 0,
          totalAmount: 0,
          ...data.financial,
        },
        ticketSummary: data.ticketSummary || [],
        foodSummary: data.foodSummary || [],
        status: data.status || "active",
        checkedIn: data.checkedIn || false,
        checkedInTime: data.checkedInTime || null,
      };

      setBookingData(formattedData);
    } catch (error) {
      console.error("Error fetching booking:", error);
      setError(error.message || "Failed to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      console.log("Current user:", auth.currentUser?.uid);
      console.log("Vendor ID from URL:", vendorId);
      console.log("Ticket vendor ID:", bookingData.vendorId);
      setCheckingIn(true);

      await updateDoc(doc(db, "tickets", bookingId), {
        checkedIn: true,
        checkedInTime: new Date().toISOString(),
      });

      setBookingData((prev) => ({
        ...prev,
        checkedIn: true,
        checkedInTime: new Date().toISOString(),
      }));

      alert("Successfully checked in!");
      navigate(`/vendorprofile/vendorscanner/${vendorId}`)
    } catch (error) {
      console.error("Error checking in:", error);
      alert("Failed to check in. Please try again.");
    } finally {
      setCheckingIn(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ textAlign: "center" }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography color="text.secondary">
            Loading booking details...
          </Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "grey.50",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Paper sx={{ p: 3, maxWidth: 400, width: "100%", textAlign: "center" }}>
          <AlertCircle
            color="error"
            size={48}
            style={{ margin: "0 auto 16px" }}
          />
          <Typography
            variant="h5"
            fontWeight="bold"
            color="text.primary"
            gutterBottom
          >
            Error
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "grey.50", pb: 3 }}>
      {/* Header */}
      <Container
        maxWidth={false}
        disableGutters
        sx={{
          width: "90%",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
          borderRadius: "10px",
          display: "flex",
          margin: "2em auto",
          alignItems: "center",
          height: "auto",
          bgcolor: "white",
          padding: "2% 2% 0 2%",
          flexDirection: "column",
        }}
      >
        <Typography
          variant="h5"
          fontWeight="bold"
          color="text.primary"
          fontFamily="albert sans"
        >
          Booking Details
        </Typography>

        <img
          src={qrimage}
          style={{
            height: "150px",
            width: "150px",
            marginTop: "1em",
            marginBottom: "1em",
          }}
        />

        {bookingData.checkedIn && (
          <Box
            sx={{
              mt: 1,
              mb: 2,
              fontFamily: "albert sans",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "success.main",
            }}
          >
            <CheckCircle
              size={20}
              style={{ marginRight: 8, fontFamily: "albert sans" }}
            />
            <Typography fontWeight="medium" sx={{ fontFamily: "albert sans" }}>
              Checked in at{" "}
              {new Date(bookingData.checkedInTime).toLocaleString()}
            </Typography>
          </Box>
        )}

        <Typography
          sx={{
            fontFamily: "albert sans",
            fontSize: "20px",
            fontWeight: "600",
            alignSelf: "flex-start",
            width: "100%",
            textAlign: "left",
            pl: "1em",
            mb: "0.5em",
          }}
        >
          {bookingData.eventName}
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignSelf: "flex-start",
            width: "100%",
            gap: "1em",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: "20px",
              fontWeight: "600",
              textAlign: "left",
              color: "#4B5563",
              pl: "1em",
            }}
          >
            {bookingData.eventDate}
          </Typography>
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: "20px",
              fontWeight: "600",
              color: "#D1D5DB",
            }}
          >
            |
          </Typography>
          <Typography
            sx={{
              fontFamily: "albert sans",
              color: "#4B5563",
              fontSize: "20px",
              fontWeight: "600",
              textAlign: "left",
            }}
          >
            {bookingData.eventTime}
          </Typography>
        </Box>

        <Divider sx={{ width: "100%", m: "20px 0", borderColor: "#ADAEBC" }} />

        <Box
          sx={{
            display: "flex",
            width: "90%",
            mb: "1em",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: "18px",
              fontWeight: "600",
            }}
          >
            Booking ID:
          </Typography>
          <Typography sx={{ fontFamily: "albert sans", fontSize: "18px" }}>
            {bookingData.bookingId}
          </Typography>
        </Box>

        {bookingData.ticketSummary && bookingData.ticketSummary.length > 0 ? (
          bookingData.ticketSummary.map((ticket, index) => (
            <Box key={index} sx={{ width: "90%" }}>
              {" "}
              {/* Add width here to match other elements */}
              <Box
                sx={{
                  width: "100%",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1.5,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "18px",
                    fontWeight: "600",
                    textAlign: "left",
                  }}
                >
                  {ticket.type || "Ticket"}
                </Typography>

                <Typography
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "18px",
                    fontWeight: "600",
                    textAlign: "right",
                  }}
                >
                  {ticket.quantity || 0} tickets
                </Typography>
              </Box>
              {index < bookingData.ticketSummary.length - 1 && (
                <Divider sx={{ width: "100%" }} />
              )}
            </Box>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ textAlign: "center" }}>
            No tickets found
          </Typography>
        )}

        <Divider sx={{ width: "100%", m: "20px 0", borderColor: "#ADAEBC" }} />

        <Box
          sx={{
            mb: "0.5em",
            display: "flex",
            width: "90%",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: "18px",
              fontWeight: "500",
            }}
          >
            Ticket Amount
          </Typography>
          <Typography sx={{ fontFamily: "albert sans", fontSize: "18px" }}>
            ₹
            {bookingData.ticketSummary?.reduce(
              (total, item) => total + (item.subtotal || 0),
              0
            )}
          </Typography>
        </Box>

        <Box sx={{ width: "90%", marginBottom: "1em" }}>
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: "18px",
              fontWeight: "500",
            }}
          >
            Grab a bite
          </Typography>

          {bookingData.foodSummary && bookingData.foodSummary.length > 0 && (
            <>
              {bookingData.foodSummary.map((food, index) => (
                <Box
                  key={index}
                  sx={{
                    pl: "0.5em",
                    mb: "0.3em",
                    display: "flex",
                    width: "100%",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{ display: "flex", flexDirection: "column", flex: 1 }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "albert sans",
                        fontSize: "18px",
                        // fontWeight: "500",
                      }}
                    >
                      {food.name} x {food.quantity}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ fontFamily: "albert sans", fontSize: "18px" }}
                  >
                    ₹{food.food_total}
                  </Typography>
                </Box>
              ))}
            </>
          )}
        </Box>

        <Box
          sx={{
            mb: "0.5em",
            display: "flex",
            width: "90%",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: "18px",
              fontWeight: "500",
            }}
          >
            Tax
          </Typography>
          <Typography sx={{ fontFamily: "albert sans", fontSize: "18px" }}>
            ₹{bookingData.financial.tax}
          </Typography>
        </Box>

        <Box
          sx={{
            mb: "0.5em",
            display: "flex",
            width: "90%",
            justifyContent: "space-between",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: "18px",
              fontWeight: "500",
            }}
          >
            Convenience fee
          </Typography>
          <Typography sx={{ fontFamily: "albert sans", fontSize: "18px" }}>
            ₹{bookingData.financial.convenienceFee}
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: "rgba(209,213,219,0.3)",
            mt: "2em",
            width: "calc(100% - 4%)",
            overflow: "hidden",
            display: "flex",
            justifyContent: "space-between",
            padding: "1em",
            borderRadius: "0 0 10px 10px",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: "18px",
              fontWeight: "500",
            }}
          >
            Total amount Amount
          </Typography>
          <Typography sx={{ fontFamily: "albert sans", fontSize: "18px" }}>
            ₹
            {bookingData.financial.subtotal +
              bookingData.financial.tax +
              bookingData.financial.convenienceFee -
              bookingData.financial.discount}
          </Typography>
        </Box>
      </Container>

      <Container maxWidth="md">
        {/* Check-in Button */}
        {!bookingData.checkedIn && (
          <Button
            onClick={handleCheckIn}
            disabled={checkingIn}
            variant="contained"
            color="success"
            size="large"
            fullWidth
            sx={{ textTransform: "none", backgroundColor: "#19AEDC" }}
          >
            {checkingIn ? "Checking In..." : "Check In Customer"}
          </Button>
        )}
      </Container>
    </Box>
  );
};

export default BookingDetailsPage;
