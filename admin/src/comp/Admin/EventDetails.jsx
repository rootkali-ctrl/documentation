import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase/firebase_config";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  IconButton,
  TextField,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Menu,
  MenuItem,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PeopleIcon from "@mui/icons-material/People";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";
import SaveIcon from "@mui/icons-material/Save";
import InfoIcon from "@mui/icons-material/Info";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import PhoneIcon from "@mui/icons-material/Phone";
import DownloadIcon from "@mui/icons-material/Download";
import { auth } from "../../firebase/firebase_config";
import { onAuthStateChanged } from "firebase/auth";

// TabPanel component for the tabbed interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const sidebarItems = [
  {
    name: "Dashboard",
    icon: <TrendingUpIcon />,
    active: false,
    path: "/admin/dashboardupcoming",
  },
  {
    name: "Users",
    icon: <GroupIcon />,
    active: false,
    path: "/admin/userpage",
  },
  {
    name: "Posts",
    icon: <ArticleIcon />,
    active: false,
    path: "/admin/postpage",
  },
  {
    name: "Login Settings",
    icon: <SettingsIcon />,
    active: false,
    path: "/admin/loginsettings",
  },
  {
    name: "Contact",
    icon: <ContactPageIcon />,
    active: false,
    path: "/admin/contactpage",
  },
  {
    name: "Events",
    icon: <EventIcon />,
    active: true,
    path: "/admin/eventmanagement",
  },
];

const statusColors = {
  Completed: "#E0E0E0",
  Upcoming: "#BBDEFB",
  Active: "#C8E6C9",
};

const EventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [vendorTax, setVendorTax] = useState(0);
  const [saveStatus, setSaveStatus] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [savingChanges, setSavingChanges] = useState(false);
  const [lastLogin, setLastLogin] = useState("");
  const [vendorUsername, setVendorUsername] = useState("Loading...");
  const [exportAnchorEl, setExportAnchorEl] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Please log in to access this page.");
        setLoading(false);
        return;
      }

      try {
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          setError("Admin profile not found.");
          setLoading(false);
          return;
        }

        const data = adminDoc.data();
        setLastLogin(data.lastlogin || "");
      } catch (err) {
        setError("Failed to load admin details: " + err.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatLastLogin = (timestamp) => {
    if (!timestamp) return "Never";
    try {
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } catch (err) {
      return "Invalid date";
    }
  };

  // Handler for tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Format date helper function for event dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "Invalid Date";

    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;

      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch (error) {
      console.error("Date formatting error:", error);
      return dateStr;
    }
  };

  // Format date for "Last login" with ordinal suffix
  const formatLoginDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return "Invalid Date";

      const day = date.getDate();
      const month = date.toLocaleString("en-GB", { month: "short" });
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");

      const getOrdinalSuffix = (day) => {
        if (day > 3 && day < 21) return "th";
        switch (day % 10) {
          case 1:
            return "st";
          case 2:
            return "nd";
          case 3:
            return "rd";
          default:
            return "th";
        }
      };

      return `${day}${getOrdinalSuffix(
        day
      )} ${month} ${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error("Login date formatting error:", error);
      return "Invalid Date";
    }
  };

  // Format currency helper function
  const formatCurrency = (amount) => {
    if (amount === 0) return "₹0";
    return `₹${Number(amount).toLocaleString("en-IN")}`;
  };

  // Fetch vendor username
  const fetchVendorUsername = async (vendorId) => {
    if (!vendorId) {
      setVendorUsername("Not available");
      return;
    }

    try {
      const vendorDocRef = doc(db, "vendors", vendorId);
      const vendorDoc = await getDoc(vendorDocRef);

      if (vendorDoc.exists()) {
        const vendorData = vendorDoc.data();
        setVendorUsername(vendorData.username || vendorData.name || "Not available");
      } else {
        setVendorUsername("Not available");
      }
    } catch (err) {
      console.error("Error fetching vendor username:", err);
      setVendorUsername("Error loading");
    }
  };

  // Calculate tax amounts and profit
  const calculateFinancials = (event) => {
    const gross = event.gross || 0;
    const userTaxPercent = event.taxPercentage || 0;
    const userTaxAmount = (userTaxPercent / 100) * gross;
    const vendorTaxAmount = (vendorTax / 100) * gross;
    const basePlatformTaxPercent = 2;
    const basePlatformTaxAmount = (basePlatformTaxPercent / 100) * gross;
    const additionalPlatformTax = basePlatformTaxAmount * (18 / 100);
    const platformTaxAmount = basePlatformTaxAmount + additionalPlatformTax;
    const profit = userTaxAmount + vendorTaxAmount - platformTaxAmount;

    return {
      userTaxAmount,
      vendorTaxAmount,
      platformTaxAmount,
      profit,
    };
  };

  // Handle vendor tax change
  const handleVendorTaxChange = (event) => {
    const value = parseFloat(event.target.value);
    if (value >= 0 && value <= 100) {
      setVendorTax(value);
    }
  };

  // Save tax settings
  const saveTaxSettings = async () => {
    if (!event || !eventId) return;

    setSavingChanges(true);
    try {
      const eventRef = doc(db, "events", eventId);
      await updateDoc(eventRef, {
        vendorTax: vendorTax,
      });

      setSaveStatus({
        open: true,
        message: "Vendor tax updated successfully",
        severity: "success",
      });

      setEvent({
        ...event,
        vendorTax: vendorTax,
      });
    } catch (err) {
      console.error("Error updating tax settings:", err);
      setSaveStatus({
        open: true,
        message: "Failed to update vendor tax",
        severity: "error",
      });
    } finally {
      setSavingChanges(false);
    }
  };

  // Handle confirmation dialog
  const handleConfirmSave = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleConfirmation = () => {
    setConfirmDialogOpen(false);
    saveTaxSettings();
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSaveStatus({
      ...saveStatus,
      open: false,
    });
  };

  // Export menu handlers
  const handleExportMenuOpen = (event) => {
    setExportAnchorEl(event.currentTarget);
  };

  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (!event || !event.tickets || event.tickets.length === 0) {
      setSaveStatus({
        open: true,
        message: "No ticket sales data to export",
        severity: "warning",
      });
      return;
    }

    const csvData = [];
    const headers = [
      "Ticket ID",
      "Buyer Name",
      "Buyer Email",
      "Booking Date",
      "Phone Number",
      "Ticket Type",
      "Quantity",
      "Total Amount"
    ];
    csvData.push(headers.join(","));

    event.tickets.forEach((ticket, idx) => {
      const totalQuantity = ticket.ticketSummary
        ? ticket.ticketSummary.reduce((sum, t) => sum + (t.quantity || 0), 0)
        : 0;

      let totalAmount = 0;
      if (ticket.ticketSummary) {
        ticket.ticketSummary.forEach((t) => {
          totalAmount += (t.price || 0) * (t.quantity || 0);
        });
      }

      const ticketTypes = ticket.ticketSummary && ticket.ticketSummary.length > 0
        ? ticket.ticketSummary.map(t => t.ticketType || t.type).join("; ")
        : "N/A";

      const row = [
        ticket.ticketId || `TKT-${idx + 1000}`,
        `"${ticket.buyer?.name || "Anonymous"}"`,
        `"${ticket.buyer?.email || ""}"`,
        ticket.bookingDate || "N/A",
        ticket.phone || "N/A",
        `"${ticketTypes}"`,
        totalQuantity,
        totalAmount
      ];
      csvData.push(row.join(","));
    });

    const csvContent = csvData.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${event.name}_ticket_sales_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    handleExportMenuClose();
    setSaveStatus({
      open: true,
      message: "Ticket sales exported successfully as CSV",
      severity: "success",
    });
  };

  // Export to Excel (XLSX format using HTML table method)
  const exportToExcel = () => {
    if (!event || !event.tickets || event.tickets.length === 0) {
      setSaveStatus({
        open: true,
        message: "No ticket sales data to export",
        severity: "warning",
      });
      return;
    }

    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th>Ticket ID</th>
            <th>Buyer Name</th>
            <th>Buyer Email</th>
            <th>Booking Date</th>
            <th>Phone Number</th>
            <th>Ticket Type</th>
            <th>Quantity</th>
            <th>Total Amount</th>
          </tr>
        </thead>
        <tbody>
    `;

    event.tickets.forEach((ticket, idx) => {
      const totalQuantity = ticket.ticketSummary
        ? ticket.ticketSummary.reduce((sum, t) => sum + (t.quantity || 0), 0)
        : 0;

      let totalAmount = 0;
      if (ticket.ticketSummary) {
        ticket.ticketSummary.forEach((t) => {
          totalAmount += (t.price || 0) * (t.quantity || 0);
        });
      }

      const ticketTypes = ticket.ticketSummary && ticket.ticketSummary.length > 0
        ? ticket.ticketSummary.map(t => t.ticketType || t.type).join(", ")
        : "N/A";

      tableHTML += `
        <tr>
          <td>${ticket.ticketId || `TKT-${idx + 1000}`}</td>
          <td>${ticket.buyer?.name || "Anonymous"}</td>
          <td>${ticket.buyer?.email || ""}</td>
          <td>${ticket.bookingDate || "N/A"}</td>
          <td>${ticket.phone || "N/A"}</td>
          <td>${ticketTypes}</td>
          <td>${totalQuantity}</td>
          <td>₹${totalAmount}</td>
        </tr>
      `;
    });

    tableHTML += `
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHTML], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${event.name}_ticket_sales_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    handleExportMenuClose();
    setSaveStatus({
      open: true,
      message: "Ticket sales exported successfully as Excel",
      severity: "success",
    });
  };

  // Export to PDF (simplified version)
  const exportToPDF = () => {
    if (!event || !event.tickets || event.tickets.length === 0) {
      setSaveStatus({
        open: true,
        message: "No ticket sales data to export",
        severity: "warning",
      });
      return;
    }

    const printWindow = window.open("", "_blank");

    let htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket Sales Report - ${event.name}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #19aedc; }
            h2 { color: #333; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #19aedc; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .summary { margin-top: 30px; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
            .summary-item { margin: 10px 0; }
            @media print {
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <h1>Ticket Sales Report</h1>
          <h2>${event.name}</h2>
          <p><strong>Event Date:</strong> ${formatDate(event.eventDate)}</p>
          <p><strong>Location:</strong> ${event.venueDetails?.city || "N/A"}</p>
          <p><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>

          <table>
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Buyer Name</th>
                <th>Buyer Email</th>
                <th>Booking Date</th>
                <th>Phone Number</th>
                <th>Ticket Type</th>
                <th>Quantity</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
    `;

    event.tickets.forEach((ticket, idx) => {
      const totalQuantity = ticket.ticketSummary
        ? ticket.ticketSummary.reduce((sum, t) => sum + (t.quantity || 0), 0)
        : 0;

      let totalAmount = 0;
      if (ticket.ticketSummary) {
        ticket.ticketSummary.forEach((t) => {
          totalAmount += (t.price || 0) * (t.quantity || 0);
        });
      }

      const ticketTypes = ticket.ticketSummary && ticket.ticketSummary.length > 0
        ? ticket.ticketSummary.map(t => t.ticketType || t.type).join(", ")
        : "N/A";

      htmlContent += `
        <tr>
          <td>${ticket.ticketId || `TKT-${idx + 1000}`}</td>
          <td>${ticket.buyer?.name || "Anonymous"}</td>
          <td>${ticket.buyer?.email || ""}</td>
          <td>${ticket.bookingDate || "N/A"}</td>
          <td>${ticket.phone || "N/A"}</td>
          <td>${ticketTypes}</td>
          <td>${totalQuantity}</td>
          <td>₹${totalAmount.toLocaleString("en-IN")}</td>
        </tr>
      `;
    });

    htmlContent += `
            </tbody>
          </table>

          <div class="summary">
            <h3>Financial Summary</h3>
            <div class="summary-item"><strong>Total Tickets Sold:</strong> ${event.ticketsSold || 0}</div>
            <div class="summary-item"><strong>Gross Revenue:</strong> ₹${(event.gross || 0).toLocaleString("en-IN")}</div>
            <div class="summary-item"><strong>Average Ticket Price:</strong> ${
              event.ticketsSold > 0
                ? `₹${Math.round(event.gross / event.ticketsSold).toLocaleString("en-IN")}`
                : "₹0"
            }</div>
          </div>

          <button onclick="window.print()" style="margin-top: 30px; padding: 10px 20px; background-color: #19aedc; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px;">Print / Save as PDF</button>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    handleExportMenuClose();
    setSaveStatus({
      open: true,
      message: "Opening print dialog for PDF export",
      severity: "success",
    });
  };

  // Fetch event data with tickets and user details
  useEffect(() => {
    const fetchEventWithTickets = async () => {
      if (!eventId) {
        setError("Event ID is missing");
        setLoading(false);
        return;
      }

      try {
        const eventRef = doc(db, "events", eventId);
        const eventDoc = await getDoc(eventRef);

        if (!eventDoc.exists()) {
          setError("Event not found");
          setLoading(false);
          return;
        }

        const eventData = eventDoc.data();

        setVendorTax(eventData.vendorTax || 0);

        if (eventData.vendorId) {
          fetchVendorUsername(eventData.vendorId);
        } else {
          setVendorUsername("Not available");
        }

        let totalSeats = 0;
        if (eventData.pricing && Array.isArray(eventData.pricing)) {
          eventData.pricing.forEach((price) => {
            totalSeats += price.seats || 0;
          });
        }

        const currentDate = new Date();
        const hostDate = eventData.eventHost
          ? new Date(eventData.eventHost)
          : null;
        const eventDate = eventData.eventDate
          ? new Date(eventData.eventDate)
          : null;

        let status = "Unknown";
        if (hostDate && eventDate) {
          currentDate.setHours(0, 0, 0, 0);
          hostDate.setHours(0, 0, 0, 0);
          eventDate.setHours(0, 0, 0, 0);

          if (currentDate < hostDate) {
            status = "Upcoming";
          } else if (currentDate > eventDate) {
            status = "Completed";
          } else {
            status = "Active";
          }
        }

        let eventWithTickets = {
          ...eventData,
          id: eventDoc.id,
          status,
          ticketsSold: 0,
          capacity: totalSeats > 0 ? totalSeats : "Unlimited",
          gross: 0,
          tickets: [],
        };

        const ticketsCollection = collection(db, "tickets");
        const eventTicketsQuery = query(
          ticketsCollection,
          where("eventId", "==", eventId)
        );
        const ticketsSnapshot = await getDocs(eventTicketsQuery);

        const ticketsWithUserDetails = await Promise.all(
          ticketsSnapshot.docs.map(async (ticketDoc) => {
            const ticketData = ticketDoc.data();

            let buyer = ticketData.buyer;
            if (!buyer && ticketData.userId) {
              const userRef = doc(db, "users", ticketData.userId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                buyer = {
                  name: userData.username || "Anonymous",
                  email: userData.email || "No email",
                };
              } else {
                buyer = { name: "Anonymous", email: "No email" };
              }
            }

            let ticketGross = 0;
            let ticketQuantity = 0;
            if (
              ticketData.ticketSummary &&
              Array.isArray(ticketData.ticketSummary)
            ) {
              ticketData.ticketSummary.forEach((ticket) => {
                const quantity = ticket.quantity || 0;
                const price = ticket.price || 0;
                ticketQuantity += quantity;
                if (!ticketData.financial?.isFreeEvent) {
                  ticketGross += quantity * price;
                }
              });
            }

            eventWithTickets.ticketsSold += ticketQuantity;
            eventWithTickets.gross += ticketGross;

            return {
              ...ticketData,
              buyer,
            };
          })
        );

        eventWithTickets.tickets = ticketsWithUserDetails;
        setEvent(eventWithTickets);
      } catch (err) {
        console.error("Error fetching event details:", err);
        setError("Failed to load event details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchEventWithTickets();
  }, [eventId]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
        <Typography ml={2}>Loading event details...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography color="error" variant="h6" mb={3}>
          {error}
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/eventmanagement")}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  if (!event) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <Typography variant="h6" mb={3}>
          Event not found
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin/eventmanagement")}
        >
          Back to Events
        </Button>
      </Box>
    );
  }

  const { userTaxAmount, vendorTaxAmount, platformTaxAmount, profit } =
    calculateFinancials(event);

  const lastLoginTimestamp = "2025-05-18T00:16:00+05:30";

  let ticketSalesTabIndex = 3;
  let faqTabIndex = 3;

  if (event.perks && event.perks.length > 0) {
    ticketSalesTabIndex++;
    faqTabIndex++;
  }

  if (event.FAQ && event.FAQ.length > 0) {
    ticketSalesTabIndex++;
  }

  return (
    <Box height="100vh" display="flex" flexDirection="column" bgcolor="#faf9fb">
      <Box
        height={89}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        px={5}
        py={2}
        borderBottom="1px solid #ddd"
        bgcolor="#f9fafb"
      >
        <Typography variant="h4">
          <Box component="span" fontWeight="bold" color="#19aedc">
            ticketb
          </Box>
          <Box component="span" fontWeight="bold" color="black">
            admin
          </Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>
          Last login at{" "}
          {lastLogin ? formatLastLogin(lastLogin) : "May 13, 2025 02:46 PM"}
        </Typography>
      </Box>

      <Box display="flex" flex={1}>
        <Box
          width={276}
          flexShrink={0}
          bgcolor="#f9fafb"
          py={10}
          px={3}
          boxShadow={3}
          position="sticky"
          top={0}
          height="90vh"
          overflow="auto"
        >
          {sidebarItems.map((item) => (
            <Button
              key={item.name}
              onClick={() => (window.location.href = item.path)}
              variant={item.active ? "contained" : "outlined"}
              fullWidth
              sx={{
                justifyContent: "flex-start",
                my: 2,
                paddingY: 2,
                borderRadius: "10px",
                borderColor: item.active ? "#19aedc" : "#ddd",
                bgcolor: item.active ? "#e3f2fd" : "white",
                color: item.active ? "#19aedc" : "black",
                textTransform: "none",
                fontWeight: item.active ? "bold" : "normal",
                gap: 2,
                boxShadow: 1,
              }}
              startIcon={item.icon}
            >
              {item.name}
            </Button>
          ))}
        </Box>

        <Box
          flex={1}
          px={5}
          py={4}
          overflow="auto"
          maxHeight="calc(100vh - 89px)"
        >
          <Box display="flex" alignItems="center" mb={4}>
            <IconButton
              onClick={() => navigate("/admin/eventmanagement")}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">
              Event Details
            </Typography>
          </Box>

          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {event.name}
                  </Typography>
                  <Box display="flex" alignItems="center" mt={1}>
                    <LocationOnIcon
                      fontSize="small"
                      sx={{ mr: 1, color: "text.secondary" }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {event.venueDetails?.venueName || "No venue specified"},{" "}
                      {event.venueDetails?.city || ""}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  px={2}
                  py={1}
                  borderRadius={2}
                  bgcolor={statusColors[event.status]}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {event.status}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Date & Time
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <CalendarTodayIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography>{formatDate(event.eventDate)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Booking Period
                  </Typography>
                  <Box display="flex" alignItems="center">
                    <CalendarTodayIcon sx={{ mr: 1, color: "primary.main" }} />
                    <Typography>
                      {formatDate(event.eventHost)} to{" "}
                      {formatDate(event.eventDate)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Grid container spacing={4} mb={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <PeopleIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Attendance
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {event.ticketsSold || 0}/{event.capacity || "Unlimited"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {event.capacity !== "Unlimited"
                      ? `${(
                          (event.ticketsSold / parseInt(event.capacity)) *
                          100
                        ).toFixed(1)}% of capacity`
                      : "Unlimited capacity"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <ConfirmationNumberIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Ticket Types
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {event.pricing?.length || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Different ticket categories
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AttachMoneyIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Gross Revenue
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(event.gross || 0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total sales amount
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccountBalanceIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      User Tax Amount
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(userTaxAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total user tax collected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccountBalanceIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Vendor Tax Amount
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(vendorTaxAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total vendor tax collected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccountBalanceIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Platform Tax Amount (2% + 18% of 2%)
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(platformTaxAmount)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total platform tax (2% + 18% of 2%)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box display="flex" alignItems="center" mb={2}>
                    <AttachMoneyIcon sx={{ color: "#19aedc", mr: 1 }} />
                    <Typography variant="h6" fontWeight="bold">
                      Profit (Admin)
                    </Typography>
                  </Box>
                  <Typography variant="h4" fontWeight="bold">
                    {formatCurrency(profit)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    User Tax + Vendor Tax - Platform Tax
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                aria-label="event details tabs"
              >
                <Tab label="Event Details" />
                <Tab label="Ticket Information" />
                <Tab label="Venue Details" />
                {event.perks && event.perks.length > 0 && <Tab label="Perks" />}
                {event.FAQ && event.FAQ.length > 0 && <Tab label="FAQs" />}
                <Tab label="Ticket Sales" />
              </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
              <Box>
                <Typography variant="h6" fontWeight="bold" mb={2}>
                  Description
                </Typography>
                <Typography paragraph>
                  {event.description || "No description available"}
                </Typography>

                <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>
                  Event Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Event ID
                      </Typography>
                      <Typography variant="body2">
                        {event.id || event.eventId}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Created On
                      </Typography>
                      <Typography variant="body2">
                        {formatDate(event.createdAt)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Vendor Username
                      </Typography>
                      <Typography variant="body2">
                        {vendorUsername}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" mb={1}>
                        Category
                      </Typography>
                      <Box display="flex" gap={1} flexWrap="wrap">
                        {event.category && event.category.length > 0 ? (
                          event.category.map((cat, idx) => (
                            <Chip
                              key={idx}
                              label={cat}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))
                        ) : (
                          <Typography variant="body2">No categories</Typography>
                        )}
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>

                {event.bannerImages && event.bannerImages.length > 0 && (
                  <>
                    <Typography variant="h6" fontWeight="bold" mt={4} mb={2}>
                      Event Banners
                    </Typography>
                    <Box
                      display="flex"
                      gap={2}
                      sx={{ overflowX: "auto", pb: 2 }}
                    >
                      {event.bannerImages.map((image, idx) => (
                        <Box
                          key={idx}
                          component="img"
                          src={image}
                          alt={`Event banner ${idx + 1}`}
                          sx={{
                            width: 280,
                            height: 160,
                            objectFit: "cover",
                            borderRadius: 1,
                            boxShadow: 1,
                          }}
                        />
                      ))}
                    </Box>
                  </>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={3}
              >
                <Typography variant="h6" fontWeight="bold">
                  Ticket Types and Pricing
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    bgcolor: "#f5f5f5",
                    borderRadius: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Vendor Tax (%)"
                    type="number"
                    value={vendorTax}
                    onChange={handleVendorTaxChange}
                    size="small"
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    sx={{ width: 120 }}
                    disabled={savingChanges}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleConfirmSave}
                    disabled={savingChanges}
                  >
                    {savingChanges ? "Saving..." : "Save Settings"}
                  </Button>
                  <IconButton
                    size="small"
                    color="info"
                    onClick={() => {
                      setSaveStatus({
                        open: true,
                        message:
                          "Vendor tax is an additional percentage applied to ticket sales. Platform tax is 2% plus 18% of that 2%, deducted from the total.",
                        severity: "info",
                      });
                    }}
                  >
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                Current settings: Vendor tax is set to {vendorTax}%. Platform
                tax is 2% plus 18% of that 2%.
              </Alert>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Ticket Type
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Price (₹)
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Features
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Capacity
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Available
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        User Tax (%)
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Vendor Tax (%)
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Platform Tax (%)
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Free</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {event.pricing && event.pricing.length > 0 ? (
                      event.pricing.map((ticket, idx) => {
                        const soldTickets = event.tickets.reduce((total, t) => {
                          if (t.ticketSummary) {
                            const matchingTicket = t.ticketSummary.find(
                              (ts) => ts.ticketType === ticket.ticketType
                            );
                            return (
                              total +
                              (matchingTicket ? matchingTicket.quantity : 0)
                            );
                          }
                          return total;
                        }, 0);

                        const remainingTickets = ticket.seats - soldTickets;

                        return (
                          <TableRow key={idx}>
                            <TableCell>{ticket.ticketType}</TableCell>
                            <TableCell>
                              {formatCurrency(ticket.price)}
                            </TableCell>
                            <TableCell>{ticket.features || "None"}</TableCell>
                            <TableCell>{ticket.seats || 0}</TableCell>
                            <TableCell>
                              {remainingTickets >= 0
                                ? remainingTickets
                                : ticket.seats || 0}
                            </TableCell>
                            <TableCell>{ticket.tax || 0}%</TableCell>
                            <TableCell>{vendorTax}%</TableCell>
                            <TableCell>2% + 18% of 2%</TableCell>
                            <TableCell>{ticket.free ? "Yes" : "No"}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          No ticket information available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box mt={4}>
                <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                  Cancellation Policy
                </Typography>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography>
                    {event.cancellationAvailable === "true"
                      ? `Cancellation available up to ${event.cancellationDays} days before the event`
                      : "Cancellation not available for this event"}
                  </Typography>
                </Paper>
              </Box>

              {event.coupons && event.coupons.length > 0 && (
                <Box mt={4}>
                  <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                    Available Coupons
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Coupon Code</TableCell>
                          <TableCell>Discount</TableCell>
                          <TableCell>Validity</TableCell>
                          <TableCell>Usage Limit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {event.coupons.map((coupon, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{coupon.couponCode || "N/A"}</TableCell>
                            <TableCell>{coupon.reducePert || 0}%</TableCell>
                            <TableCell>
                              {formatDate(coupon.startTime).split(",")[0]} -{" "}
                              {formatDate(coupon.endTime).split(",")[0]}
                            </TableCell>
                            <TableCell>
                              {coupon.couponLimits || "Unlimited"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" fontWeight="bold" mb={3}>
                Venue Information
              </Typography>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ padding: 3 }}>
                    <Box sx={{ p: 3 }}>
                      <Typography variant="body1" fontWeight="bold" mb={1}>
                        Venue Name
                      </Typography>
                      <Typography>
                        {event.venueDetails?.title || "None available."}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                      Address
                    </Typography>
                    <Typography>
                      {event.venueDetails?.streetName || ""},{" "}
                      {event.venueDetails?.area || ""},
                      {event.venueDetails?.city
                        ? ` ${event.venueDetails.city},`
                        : ""}
                      {event.venueDetails?.state
                        ? ` ${event.venueDetails.state}`
                        : ""}
                      {event.venueDetails?.pincode
                        ? ` - ${event.venueDetails.pincode}`
                        : ""}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              <Box
                mt={4}
                p={3}
                sx={{
                  height: 300,
                  bgcolor: "#f5f5f5",
                  borderRadius: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  Map view would be displayed here if coordinates were available
                </Typography>
              </Box>
            </TabPanel>

            {event.perks && event.perks.length > 0 && (
              <TabPanel value={tabValue} index={3}>
                <Typography variant="h6" fontWeight="bold" mb={3}>
                  Event Perks
                </Typography>

                {event.perks && event.perks.length > 0 ? (
                  <Grid container spacing={3}>
                    {event.perks.map((perk, index) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Paper sx={{ p: 3, height: "100%" }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            mb={1}
                          >
                            {perk.itemName || perk.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            paragraph
                          >
                            {perk.description ||
                              `Price: ${formatCurrency(perk.price)}, Limit: ${
                                perk.limit
                              }`}
                          </Typography>
                          {perk.availability && (
                            <Chip
                              label={`Available to: ${perk.availability}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No perks are available for this event.
                  </Typography>
                )}
              </TabPanel>
            )}

            {event.FAQ && event.FAQ.length > 0 && (
              <TabPanel value={tabValue} index={faqTabIndex}>
                <Typography variant="h6" fontWeight="bold" mb={3}>
                  Frequently Asked Questions
                </Typography>

                {event.FAQ && event.FAQ.length > 0 ? (
                  <Grid container spacing={3}>
                    {event.FAQ.map((faq, index) => (
                      <Grid item xs={12} key={index}>
                        <Paper sx={{ p: 3 }}>
                          <Box display="flex" alignItems="center" mb={1}>
                            <QuestionAnswerIcon
                              sx={{ color: "#19aedc", mr: 1 }}
                            />
                            <Typography variant="subtitle1" fontWeight="bold">
                              {faq.question}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {faq.answer}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No FAQs are available for this event.
                  </Typography>
                )}
              </TabPanel>
            )}

            <TabPanel value={tabValue} index={ticketSalesTabIndex}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold">
                  Ticket Sales Overview
                </Typography>

                {event.tickets && event.tickets.length > 0 && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<DownloadIcon />}
                      onClick={handleExportMenuOpen}
                    >
                      Export Ticket Sales
                    </Button>
                    <Menu
                      anchorEl={exportAnchorEl}
                      open={Boolean(exportAnchorEl)}
                      onClose={handleExportMenuClose}
                    >
                      <MenuItem onClick={exportToCSV}>
                        <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                        Export as CSV
                      </MenuItem>
                      <MenuItem onClick={exportToExcel}>
                        <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                        Export as Excel
                      </MenuItem>
                      <MenuItem onClick={exportToPDF}>
                        <DownloadIcon sx={{ mr: 1 }} fontSize="small" />
                        Export as PDF
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>

              {event.tickets && event.tickets.length > 0 ? (
                <>
                  <TableContainer
                    component={Paper}
                    variant="outlined"
                    sx={{ mb: 4 }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Ticket ID
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Buyer
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Booking Date
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Phone Number
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Ticket Type
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Quantity
                          </TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>
                            Total Amount
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {event.tickets.map((ticket, idx) => {
                          const totalQuantity = ticket.ticketSummary
                            ? ticket.ticketSummary.reduce(
                                (sum, t) => sum + (t.quantity || 0),
                                0
                              )
                            : 0;

                          let totalAmount = 0;
                          if (ticket.ticketSummary) {
                            ticket.ticketSummary.forEach((t) => {
                              totalAmount += (t.price || 0) * (t.quantity || 0);
                            });
                          }

                          return (
                            <TableRow key={idx}>
                              <TableCell>
                                {ticket.ticketId || `TKT-${idx + 1000}`}
                              </TableCell>
                              <TableCell>
                                {ticket.buyer?.name || "Anonymous"}
                                {ticket.buyer?.email && (
                                  <Typography
                                    variant="caption"
                                    display="block"
                                    color="text.secondary"
                                  >
                                    {ticket.buyer.email}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {ticket.bookingDate || "N/A"}
                              </TableCell>
                              <TableCell>{ticket.phone || "N/A"}</TableCell>
                              <TableCell>
                                {ticket.ticketSummary &&
                                ticket.ticketSummary.length > 0
                                  ? ticket.ticketSummary.map((t, i) => (
                                      <Typography key={i} variant="body2">
                                        {t.ticketType || t.type}
                                      </Typography>
                                    ))
                                  : "N/A"}
                              </TableCell>
                              <TableCell>{totalQuantity}</TableCell>
                              <TableCell>
                                {formatCurrency(totalAmount)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      Financial Summary
                    </Typography>
                  </Box>

                  <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 3 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1}
                        >
                          Total Tickets Sold
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {event.ticketsSold || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <Paper sx={{ p: 3 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1}
                        >
                          Average Ticket Price
                        </Typography>
                        <Typography variant="h5" fontWeight="bold">
                          {event.ticketsSold > 0
                            ? formatCurrency(event.gross / event.ticketsSold)
                            : formatCurrency(0)}
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              ) : (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  py={4}
                >
                  <Typography variant="body1" color="text.secondary" mb={2}>
                    No ticket sales have been recorded for this event yet.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => setTabValue(1)}
                  >
                    View Ticket Information
                  </Button>
                </Box>
              )}
            </TabPanel>
          </Card>
        </Box>
      </Box>

      <Snackbar
        open={saveStatus.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={saveStatus.severity}
          sx={{ width: "100%" }}
        >
          {saveStatus.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Confirm Vendor Tax Change"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to set the vendor tax to {vendorTax}%?
            Platform tax is 2% plus 18% of that 2%.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmation} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventDetails;