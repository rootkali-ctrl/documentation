import React from "react";
import { Box, Button, Typography, useMediaQuery, useTheme, Alert } from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";

const VendorConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  // Get status from location state
  const { status, message, vendorId } = location.state || {};

  // Determine content based on status
  const getStatusContent = () => {
    switch (status) {
      case "pending":
        return {
          icon: <HourglassEmptyIcon sx={{ fontSize: 80, color: "#ff9800" }} />,
          title: "Registration Pending Approval",
          description: "Thank you for choosing ticketB! Your account has been successfully registered. Our admin team will verify your credentials within 24 to 48 hours. You will receive a confirmation email once your account is approved.",
          color: "#ff9800"
        };
      case "rejected":
        return {
          icon: <CancelOutlinedIcon sx={{ fontSize: 80, color: "#f44336" }} />,
          title: "Registration Rejected",
          description: "Unfortunately, your vendor registration has been rejected. Please contact our support team for more details and guidance on how to proceed.",
          color: "#f44336"
        };
      case "removed":
        return {
          icon: <CancelOutlinedIcon sx={{ fontSize: 80, color: "#f44336" }} />,
          title: "Account Removed",
          description: "Your vendor account has been removed from our system. If you believe this is an error, please contact our support team immediately.",
          color: "#f44336"
        };
      default:
        return {
          icon: <CheckCircleOutlineIcon sx={{ fontSize: 80, color: "#4caf50" }} />,
          title: "Registration Successful!",
          description: "Thank you for choosing ticketB and you have successfully registered your account! Our admin will verify your credentials and you will receive a confirmation mail within 24 to 48 hours.",
          color: "#4caf50"
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <Box sx={{ width: "100%", minHeight: "100vh", bgcolor: "#F9FAFB", py: 4 }}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: isMobile ? "92%" : "80%",
          maxWidth: "900px",
          margin: "0 auto",
          alignItems: "center",
          fontFamily: "Albert Sans",
          bgcolor: "white",
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          p: isMobile ? 3 : 5,
        }}
      >
        {/* Status Icon */}
        <Box sx={{ mb: 3 }}>
          {statusContent.icon}
        </Box>

        {/* Title */}
        <Typography
          sx={{
            fontFamily: "Albert Sans",
            fontSize: isMobile ? "24px" : "32px",
            fontWeight: "700",
            mb: 2,
            textAlign: "center",
            color: statusContent.color,
          }}
        >
          {statusContent.title}
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            fontFamily: "Albert Sans",
            fontSize: isMobile ? "16px" : "18px",
            mb: 4,
            textAlign: "center",
            color: "#666",
            lineHeight: 1.6,
          }}
        >
          {statusContent.description}
        </Typography>

        {/* Show custom message if available */}
        {message && (
          <Alert
            severity={status === "accepted" ? "success" : status === "pending" ? "info" : "warning"}
            sx={{ mb: 3, width: "100%", fontFamily: "Albert Sans" }}
          >
            {message}
          </Alert>
        )}

        {/* Additional Information Box */}
        <Box
          sx={{
            width: "100%",
            bgcolor: "#f5f5f5",
            borderRadius: 2,
            p: isMobile ? 2 : 3,
            mb: 4,
          }}
        >
          <Typography
            sx={{
              fontFamily: "Albert Sans",
              fontSize: isMobile ? "14px" : "16px",
              color: "#333",
              textAlign: "center",
              lineHeight: 1.6,
            }}
          >
            {status === "pending" && (
              <>
                While you wait for approval, feel free to explore ticketB and discover the amazing events happening near you.
                Once approved, you'll be able to create and manage your own events seamlessly.
              </>
            )}
            {status === "rejected" && (
              <>
                If you have questions about your rejection, please reach out to our support team at support@ticketb.com
                or call us at +1 (XXX) XXX-XXXX. We're here to help!
              </>
            )}
            {status === "removed" && (
              <>
                For account restoration or inquiries, please contact our support team immediately at support@ticketb.com
                or call us at +1 (XXX) XXX-XXXX.
              </>
            )}
            {!status && (
              <>
                We appreciate your patience during the verification process. Our team carefully reviews each application
                to ensure the best experience for all users. You'll hear from us soon!
              </>
            )}
          </Typography>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 2,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Button
            variant="contained"
            sx={{
              fontFamily: "Albert Sans",
              textTransform: "capitalize",
              backgroundColor: "#19AEDC",
              fontSize: isMobile ? "16px" : "18px",
              fontWeight: "600",
              px: 4,
              py: 1.5,
              "&:hover": {
                backgroundColor: "#1595c2",
              },
            }}
            onClick={() => navigate("/")}
          >
            Explore ticketB
          </Button>

          {(status === "rejected" || status === "removed") && (
            <Button
              variant="outlined"
              sx={{
                fontFamily: "Albert Sans",
                textTransform: "capitalize",
                borderColor: "#19AEDC",
                color: "#19AEDC",
                fontSize: isMobile ? "16px" : "18px",
                fontWeight: "600",
                px: 4,
                py: 1.5,
                "&:hover": {
                  borderColor: "#1595c2",
                  color: "#1595c2",
                  bgcolor: "rgba(25, 174, 220, 0.04)",
                },
              }}
              onClick={() => window.location.href = "mailto:support@ticketb.com"}
            >
              Contact Support
            </Button>
          )}

          {status === "pending" && vendorId && (
            <Button
              variant="outlined"
              sx={{
                fontFamily: "Albert Sans",
                textTransform: "capitalize",
                borderColor: "#19AEDC",
                color: "#19AEDC",
                fontSize: isMobile ? "16px" : "18px",
                fontWeight: "600",
                px: 4,
                py: 1.5,
                "&:hover": {
                  borderColor: "#1595c2",
                  color: "#1595c2",
                  bgcolor: "rgba(25, 174, 220, 0.04)",
                },
              }}
              onClick={() => navigate(`/vendor/login/${vendorId}`)}
            >
              Back to Login
            </Button>
          )}
        </Box>

        {/* Help Text */}
        <Typography
          sx={{
            fontFamily: "Albert Sans",
            fontSize: "14px",
            color: "#999",
            mt: 4,
            textAlign: "center",
          }}
        >
          Need immediate assistance? Contact us at support@ticketb.com
        </Typography>
      </Box>
    </Box>
  );
};

export default VendorConfirmation;