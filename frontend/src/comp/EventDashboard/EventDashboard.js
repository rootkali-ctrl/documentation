import React, { useState, useEffect, useCallback } from "react";
import HeaderVendorLogged from "../Header/HeaderVendorLogged";
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  IconButton,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import EventIcon from "@mui/icons-material/Event";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase_config";
import { onAuthStateChanged, signOut } from "firebase/auth";

import axios from "axios";

const EventDashboard = () => {
  const { state } = useLocation();
  const { eventId, vendorId } = useParams();
  const [eventData, setEventData] = useState(state?.eventData || {});
  const [loading, setLoading] = useState(true);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [eventStats, setEventStats] = useState({
    grossSales: 0,
    ticketsSold: 0,
    totalEvents: 0,
    vendorTaxAmount: 0,
    userTaxAmount: 0,
    platformTaxAmount: 0,
    profits: 0,
  });
  const [bannerImage, setBannerImage] = useState("");
  const [usernames, setUsernames] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("90");
  const [allOrders, setAllOrders] = useState([]);
  const isMobile = useMediaQuery("(max-width:900px)");
  const COLORS = ["#19AEDC", "#4FC3F7", "#2196F3", "#1565C0", "#0D47A1"];
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passvendorId, passsetVendorId] = useState(null);
  const [username, setUsername] = useState("");
  const [csvData, setCsvData] = useState([]);
  const csvLink = React.createRef();
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

  const ordersPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedOrders, setDisplayedOrders] = useState([]);
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const derivedUsername = user.displayName || user.email.split("@")[0];
        setUsername(derivedUsername);

        // Add this userProfile setting
        setUserProfile({
          photoURL: user.photoURL,
          displayName: user.displayName,
          email: user.email,
          uid: user.uid,
        });

        try {
          const res = await fetch(
            `${process.env.REACT_APP_API_BASE_URL}/api/user/post-email`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: user.email }),
            }
          );

          const data = await res.json();
          if (res.ok) {
            localStorage.setItem("vendorId", data.vendorId);
            passsetVendorId(data.vendorId); // Make sure you set this in state
          } else {
            console.error("Vendor not found:", data.message);
          }
        } catch (error) {
          console.error("Error fetching vendor data:", error);
        }
      } else {
        setIsAuthenticated(false);
        setUsername("");
        setUserProfile(null); // Add this
        passsetVendorId(null); // Add this
      }
    });

    return () => unsubscribe();
  }, []);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("vendorId"); // Add this line
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);

      showDialog("Failed to log out. Please try again.");
    }
  };

  useEffect(() => {
    const fetchEventData = async () => {
      if (!state?.eventData && eventId) {
        try {
          const response = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/event/${eventId}`
          );
          setEventData(response.data);
        } catch (err) {
          console.error("Error fetching event data:", err);
        }
      }
    };

    fetchEventData();
  }, [eventId, state]);

  const fetchUsername = async (userId) => {
    if (usernames[userId]) return usernames[userId];

    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const name =
          userData.displayName ||
          userData.name ||
          userData.username ||
          "Unknown User";
        setUsernames((prev) => ({ ...prev, [userId]: name }));
        return name;
      }
      return "User Not Found";
    } catch (err) {
      console.error("Error fetching user data:", err);
      return "Error Loading User";
    }
  };

  console.log(displayedOrders);
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId || !eventData) return;

      setLoading(true);

      try {
        const ticketTypeData =
          eventData.pricing?.map((ticket, index) => ({
            type: ticket.ticketType || "Standard",
            price: Number(ticket.price),
            seats: Math.max(1, Number(ticket.seats) || 0),
            sold: 0,
            revenue: 0,
            isFree: ticket.free || ticket.price === 0 || ticket.price === "0",
            color: COLORS[index % COLORS.length],
          })) || [];

        if (ticketTypeData.length === 0) {
          ticketTypeData.push({
            type: "Standard",
            price: 0,
            seats: 100,
            sold: 0,
            revenue: 0,
            isFree: true,
            color: COLORS[0],
          });
        }

        if (eventData.bannerImages && eventData.bannerImages.length > 0) {
          setBannerImage(eventData.bannerImages[0]);
        }

        const ticketsQuery = query(
          collection(db, "tickets"),
          where("eventId", "==", eventId)
        );

        const ticketSnapshots = await getDocs(ticketsQuery);

        let totalTicketsSold = 0;
        let totalRevenue = 0;
        const orders = [];
        const typeSales = {};
        const csvDataArray = [];

        ticketTypeData.forEach((ticket) => {
          typeSales[ticket.type] = { sold: 0, revenue: 0 };
        });

        // Replace the ticket processing section with this grouped approach
        for (const docSnapshot of ticketSnapshots.docs) {
          const ticketData = docSnapshot.data();

          // Check if ticket is cancelled
          const isCancelled = ticketData.cancelled || false;
          const cancelledAt = ticketData.cancelledAt || null;
          const refundAmount = ticketData.refundAmount || null;

          if (
            ticketData.ticketSummary &&
            Array.isArray(ticketData.ticketSummary)
          ) {
            let customerName = ticketData.userName || "Guest User";

            if (ticketData.userId) {
              customerName = await fetchUsername(ticketData.userId);
            }

            const isFreeEvent = ticketData.financial?.isFreeEvent || false;

            const purchaseDate = new Date(
              ticketData.purchaseDate?.toDate() ||
                ticketData.createdAt ||
                Date.now()
            );
            const formattedDate = purchaseDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            });

            // Get total amount from financial data
            const totalAmount = isFreeEvent
              ? 0
              : ticketData.financial?.totalAmount || 0;
            const revenue = isCancelled ? 0 : totalAmount;

            // Process all ticket types and combine them
            const ticketTypeDetails = [];
            let totalQuantity = 0;

            ticketData.ticketSummary.forEach((ticketSummary) => {
              const ticketType =
                ticketSummary.type || ticketSummary.name || "Standard";
              const quantity = Number(ticketSummary.quantity) || 0;
              const price = isFreeEvent
                ? 0
                : Number(ticketSummary.price || ticketSummary.base_price) || 0;
              const subtotal = isFreeEvent
                ? 0
                : Number(
                    ticketSummary.subtotal || ticketSummary.ticket_total
                  ) || price * quantity;

              ticketTypeDetails.push({
                type: ticketType,
                quantity: quantity,
                price: price,
                subtotal: subtotal,
              });

              totalQuantity += quantity;

              // Update individual ticket type sales for analytics
              if (!isCancelled) {
                if (!typeSales[ticketType]) {
                  typeSales[ticketType] = { sold: 0, revenue: 0 };
                }
                typeSales[ticketType].sold += quantity;
                typeSales[ticketType].revenue += subtotal;
              }
            });

            // Create single order entry with all ticket types
            const orderObj = {
              id: docSnapshot.id,
              custID: `#ORD-${docSnapshot.id.substring(0, 6).toUpperCase()}`,
              custName: customerName,
              userId: ticketData.userId || "",
              email: ticketData.email || ticketData.userEmail || "",
              phone: ticketData.phone || ticketData.userPhone || "",
              ticketTypes: ticketTypeDetails, // Array of all ticket types
              ticketTypeDisplay: ticketTypeDetails
                .map((t) => `${t.type} (${t.quantity})`)
                .join(", "), // For display
              date: formattedDate,
              purchaseDate: purchaseDate,
              amt: revenue,
              isFree: isFreeEvent,
              cancelled: isCancelled,
              cancelledAt: cancelledAt,
              refundAmount: refundAmount,
              quantity: totalQuantity,
              originalAmount: totalAmount,
            };

            orders.push(orderObj);

            // CSV data - create separate rows for each ticket type in CSV
            ticketTypeDetails.forEach((ticketDetail, index) => {
              csvDataArray.push({
                Order_ID: `${orderObj.custID}${
                  index > 0 ? `-${index + 1}` : ""
                }`,
                Customer_Name: customerName,
                Customer_Email: orderObj.email,
                Customer_Phone: orderObj.phone,
                Ticket_Type: isFreeEvent ? "Free" : ticketDetail.type,
                Purchase_Date: formattedDate,
                Amount: isCancelled
                  ? "0 (Cancelled)"
                  : isFreeEvent
                  ? "0"
                  : ticketDetail.subtotal.toFixed(2),
                Quantity: ticketDetail.quantity,
                Status: isCancelled ? "Cancelled" : "Booked",
                Refund_Amount: isCancelled
                  ? (refundAmount || 0).toString()
                  : "N/A",
              });
            });

            // Only count towards totals if not cancelled
            if (!isCancelled) {
              totalTicketsSold += totalQuantity;
              totalRevenue += revenue;
            }
          }
        }

        const updatedTicketTypes = ticketTypeData.map((ticket) => {
          const salesData = typeSales[ticket.type] || { sold: 0, revenue: 0 };
          return {
            ...ticket,
            sold: salesData.sold,
            revenue: salesData.revenue,
          };
        });

        const chartDataEntry = { name: "Ticket Sales" };
        updatedTicketTypes
          .filter((ticket) => ticket.sold > 0)
          .forEach((ticket) => {
            const sanitizedKey = ticket.type.replace(/\s+/g, "_");
            chartDataEntry[sanitizedKey] = ticket.sold;
            chartDataEntry[`${sanitizedKey}Color`] = ticket.color;
          });
        const chartData = [chartDataEntry];

        // Calculate taxes and profits
        const vendorTaxRate = Number(eventData.vendorTax) || 0;
        const userTaxRate = Number(eventData.taxPercentage) || 0;
        const vendorTaxAmount = totalRevenue * (vendorTaxRate / 100);
        const userTaxAmount = totalRevenue * (userTaxRate / 100);
        const basePlatformTaxPercent = 2; // Base platform tax of 2%
        const basePlatformTaxAmount =
          (basePlatformTaxPercent / 100) * totalRevenue;
        const additionalPlatformTax = basePlatformTaxAmount * (18 / 100); // 18% of the 2% tax
        const platformTaxAmount = basePlatformTaxAmount + additionalPlatformTax;
        const combinedVendorTaxAmount =
          vendorTaxAmount + userTaxAmount + platformTaxAmount;
        const profits =
          totalRevenue - vendorTaxAmount - userTaxAmount - platformTaxAmount;

        setCsvData([
          [
            "Order ID",
            "Customer Name",
            "Email",
            "Phone",
            "Ticket Type",
            "Purchase Date",
            "Amount",
            "Vendor Tax",
          ],
          ...csvDataArray.map((item) => [
            item.Order_ID,
            item.Customer_Name,
            item.Customer_Email,
            item.Customer_Phone,
            item.Ticket_Type,
            item.Purchase_Date,
            item.Amount,
            (
              Number(item.Amount) *
              (vendorTaxRate / 100 +
                userTaxRate / 100 +
                (basePlatformTaxPercent + basePlatformTaxPercent * (18 / 100)) /
                  100)
            ).toFixed(2),
          ]),
        ]);

        setTicketTypes(updatedTicketTypes);
        setRecentOrders(orders);
        setAllOrders(orders);
        setSalesData(chartData);
        setEventStats({
          grossSales: totalRevenue,
          ticketsSold: totalTicketsSold,
          totalEvents: eventData.organizerEvents || 1,
          vendorTaxAmount: combinedVendorTaxAmount,
          userTaxAmount: 0,
          platformTaxAmount: 0,
          profits: profits,
        });

        setTotalPages(Math.ceil(orders.length / ordersPerPage));
        updateDisplayedOrders(orders, 1);
      } catch (err) {
        console.error("Error fetching event details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, eventData]);

  useEffect(() => {
    updateDisplayedOrders(recentOrders, currentPage);
  }, [currentPage, recentOrders]);

  const updateDisplayedOrders = (orders, page) => {
    const startIndex = (page - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    setDisplayedOrders(orders.slice(startIndex, endIndex));
  };

  useEffect(() => {
    if (allOrders.length === 0) return;

    const filterOrdersByTime = () => {
      const currentDate = new Date();
      let filteredOrders = [...allOrders];

      if (timeFilter !== "all") {
        const daysToFilter = parseInt(timeFilter);
        const filterDate = new Date();
        filterDate.setDate(currentDate.getDate() - daysToFilter);

        filteredOrders = allOrders.filter(
          (order) => order.purchaseDate >= filterDate
        );
      }

      setRecentOrders(filteredOrders);
      setTotalPages(Math.ceil(filteredOrders.length / ordersPerPage));
      updateDisplayedOrders(filteredOrders, 1);
      setCurrentPage(1);

      const typeSales = {};

      ticketTypes.forEach((ticket) => {
        typeSales[ticket.type] = { sold: 0, color: ticket.color };
      });

      filteredOrders.forEach((order) => {
        const type = order.ticketType;
        if (typeSales[type]) {
          typeSales[type].sold += 1;
        } else {
          if (typeSales["Other"]) {
            typeSales["Other"].sold += 1;
          } else {
            typeSales["Other"] = {
              sold: 1,
              color: COLORS[Object.keys(typeSales).length % COLORS.length],
            };
          }
        }
      });

      const chartDataEntry = { name: "Ticket Sales" };
      ticketTypes
        .filter((ticket) => typeSales[ticket.type]?.sold > 0)
        .forEach((ticket) => {
          const sanitizedKey = ticket.type.replace(/\s+/g, "_");
          chartDataEntry[sanitizedKey] = typeSales[ticket.type].sold;
          chartDataEntry[`${sanitizedKey}Color`] = ticket.color;
        });
      const chartData = [chartDataEntry];

      setSalesData(chartData);
    };

    filterOrdersByTime();
  }, [timeFilter, allOrders, ticketTypes]);

  const downloadSalesReport = () => {
    csvLink.current.link.click();
  };

  const formatEventDate = () => {
    if (!eventData.eventDate) return "Date not set";

    const eventDate = new Date(eventData.eventDate);
    return eventDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateProgress = (ticket) => {
    const sold = Number(ticket.sold ?? 0);
    const seats = Number(ticket.seats ?? 0);

    if (seats <= 0) return 0;

    const percentage = (sold / seats) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress sx={{ color: "#19AEDC" }} />
      </Box>
    );
  }

  const handleanalytics = () => {
    navigate(`/eventanalytics/${eventId}`, {
      state: {
        eventId: eventId,
        eventData: eventData,
      },
    });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        >
          <Typography sx={{ fontFamily: "Albert Sans", fontWeight: 600 }}>
            {payload[0].name}
          </Typography>
          <Typography sx={{ fontFamily: "Albert Sans" }}>
            Tickets Sold: {payload[0].value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <div sx={{ overflowX: "hidden" }}>
      <HeaderVendorLogged
        vendorId={vendorId}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
      <Box
        sx={{
          display: "flex",
          width: isMobile ? "92%" : "80%",
          margin: "0 auto",
          flexDirection: isMobile ? "column" : "row",
          gap: "24px",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              width: "100%",
              display: isMobile ? "block" : "flex",
              padding: "24px 0",
              justifyContent: "space-between",
              alignItems: "center",
              width: isMobile ? "90%" : null,
            }}
          >
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: isMobile ? "24px" : "32px",
                fontWeight: "700",
              }}
            >
              {eventData.name}
            </Typography>
            <Box
              sx={{
                display: "flex",
                gap: "12px",
                marginLeft: "auto",
                mt: isMobile ? "16px" : "0",
              }}
            >
              <Button
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontFamily: "Albert Sans",
                  backgroundColor: "#fff",
                  color: "#333",
                  border: "1px solid #ddd",
                  boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
                  "&:hover": {
                    backgroundColor: "#f8f8f8",
                    boxShadow: "0px 2px 5px rgba(0,0,0,0.15)",
                    p: isMobile ? "1% 2%" : null,
                  },
                }}
                onClick={downloadSalesReport}
              >
                <DownloadIcon sx={{ fontSize: "18px", mr: "8px" }} />
                Download Report
              </Button>
              <Button
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontFamily: "Albert Sans",
                  backgroundColor: "#19AEDC",
                  "&:hover": {
                    backgroundColor: "#1793B8",
                  },
                  p: isMobile ? "1% 2%" : null,
                }}
                onClick={() => {
                  handleanalytics();
                }}
              >
                <InsertChartIcon sx={{ fontSize: "18px", mr: "8px" }} />
                View Analytics
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        width: "40px",
                        height: isMobile ? "40px" : "40px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(25, 174, 220, 0.1)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mr: 2,
                      }}
                    >
                      <CurrencyRupeeOutlinedIcon sx={{ color: "#19AEDC" }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Gross Sales
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: "Albert Sans",
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    ₹{eventStats.grossSales.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(25, 174, 220, 0.1)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mr: 2,
                      }}
                    >
                      <CurrencyRupeeOutlinedIcon sx={{ color: "#19AEDC" }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Vendor Tax
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: "Albert Sans",
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    ₹{eventStats.vendorTaxAmount.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(25, 174, 220, 0.1)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mr: 2,
                      }}
                    >
                      <CurrencyRupeeOutlinedIcon sx={{ color: "#19AEDC" }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Profits
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: "Albert Sans",
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    ₹{eventStats.profits.toLocaleString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(25, 174, 220, 0.1)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mr: 2,
                      }}
                    >
                      <ConfirmationNumberIcon sx={{ color: "#19AEDC" }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Tickets Sold
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: "Albert Sans",
                      fontSize: "28px",
                      fontWeight: "700",
                    }}
                  >
                    {eventStats.ticketsSold}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Box
                      sx={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "rgba(25, 174, 220, 0.1)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        mr: 2,
                      }}
                    >
                      <EventIcon sx={{ color: "#19AEDC" }} />
                    </Box>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      Event Date
                    </Typography>
                  </Box>
                  <Typography
                    sx={{
                      fontFamily: "Albert Sans",
                      fontSize: "20px",
                      fontWeight: "600",
                    }}
                  >
                    {formatEventDate()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: "20px",
                fontWeight: "700",
                mb: 2,
              }}
            >
              Ticket Sales Overview
            </Typography>
            <Grid container spacing={3}>
              {ticketTypes.map((ticket, idx) => (
                <Grid
                  item
                  xs={12}
                  md={6}
                  key={idx}
                  sx={{ width: isMobile ? "80%" : "20%" }}
                >
                  <Card
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
                      width: "100%",
                    }}
                  >
                    <CardContent>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mb: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "18px",
                            fontWeight: "600",
                          }}
                        >
                          {ticket.type}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "16px",
                            fontWeight: "600",
                            color: ticket.isFree ? "#4CAF50" : "#333",
                          }}
                        >
                          {ticket.isFree ? "Free" : `₹${ticket.price}`}
                        </Typography>
                      </Box>

                      {/* Fixed Progress Bar Section */}
                      <Box sx={{ mb: 1 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            mb: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: "Albert Sans",
                              fontSize: "14px",
                              color: "#666",
                            }}
                          >
                            {ticket.sold || 0} sold
                            {ticket.seats > 0 ? ` out of ${ticket.seats}` : ""}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={calculateProgress(ticket)}
                          sx={{
                            height: "8px",
                            borderRadius: "4px",
                            backgroundColor: "#e0e0e0",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: ticket.color || "#19AEDC",
                              borderRadius: "4px",
                            },
                          }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          mt: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "14px",
                            color: "#666",
                          }}
                        >
                          Revenue
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "16px",
                            fontWeight: "600",
                          }}
                        >
                          ₹{ticket.revenue.toLocaleString()}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: "20px",
                fontWeight: "700",
                mb: 2,
              }}
            >
              Recent Orders
            </Typography>

            <Card
              elevation={0}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <Box sx={{ overflowX: "auto" }}>
                <Box
                  sx={{
                    minWidth: 650,
                    "& .MuiTableCell-root": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 24px",
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    <FormControl size="small">
                      <Select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        sx={{
                          height: "36px",
                          minWidth: "150px",
                          fontFamily: "Albert Sans",
                        }}
                      >
                        <MenuItem value="7">Last 7 days</MenuItem>
                        <MenuItem value="30">Last 30 days</MenuItem>
                        <MenuItem value="90">Last 90 days</MenuItem>
                        <MenuItem value="all">All time</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        color: "#666",
                      }}
                    >
                      {recentOrders.length} orders found
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "2fr 2fr 2fr 1.5fr 1fr 1fr",
                      padding: "12px 24px",
                      backgroundColor: "#f9f9f9",
                      borderBottom: "1px solid #e0e0e0",
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#666",
                      }}
                    >
                      Order ID
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#666",
                      }}
                    >
                      Customer
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#666",
                      }}
                    >
                      Ticket Type
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#666",
                      }}
                    >
                      Date
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#666",
                      }}
                    >
                      Amount
                    </Typography>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#666",
                        pl: "5%",
                      }}
                    >
                      Status
                    </Typography>
                  </Box>

                  {displayedOrders.length > 0 ? (
                    displayedOrders.map((order, idx) => (
                      <Box
                        key={order.id || idx}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "2fr 2fr 2fr 1.5fr 1fr 1fr",
                          padding: "16px 24px",
                          borderBottom: "1px solid #e0e0e0",
                          "&:hover": {
                            backgroundColor: "#f5f5f5",
                          },
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "14px",
                            color: "#19AEDC",
                            fontWeight: "500",
                          }}
                        >
                          {order.custID}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "14px",
                            fontWeight: "500",
                          }}
                        >
                          {order.custName}
                        </Typography>

                        {/* Enhanced Ticket Types Display */}
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          {order.ticketTypes ? (
                            order.ticketTypes.map((ticketType, ticketIdx) => (
                              <Box key={ticketIdx}>
                                <Typography
                                  sx={{
                                    fontFamily: "Albert Sans",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                  }}
                                >
                                  {ticketType.type}
                                </Typography>
                              </Box>
                            ))
                          ) : (
                            <Typography
                              sx={{
                                fontFamily: "Albert Sans",
                                fontSize: "14px",
                              }}
                            >
                              {order.ticketTypeDisplay || "Standard"}
                            </Typography>
                          )}
                        </Box>

                        <Typography
                          sx={{ fontFamily: "Albert Sans", fontSize: "14px" }}
                        >
                          {order.date}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "14px",
                            fontWeight: "600",
                          }}
                        >
                          {order.isFree ? (
                            <span style={{ color: "#4CAF50" }}>Free</span>
                          ) : (
                            `₹${Math.round(order.amt).toLocaleString()}`
                          )}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "14px",
                            fontWeight: "600",
                            pl: "5%",
                          }}
                        >
                          {order.cancelled ? (
                            <Button
                              variant="contained"
                              disabled
                              sx={{
                                textTransform: "none",
                                bgcolor: "#D1FAE5",
                                color: "#047857",
                                fontFamily: "albert sans",
                                "&.Mui-disabled": {
                                  bgcolor: "#D1FAE5",
                                  color: "#047857",
                                  cursor: "not-allowed",
                                },
                              }}
                            >
                              Booked
                            </Button>
                          ) : (
                            <Button
                              variant="contained"
                              disabled
                              sx={{
                                fontFamily: "albert sans",
                                textTransform: "none",
                                bgcolor: "#FEE2E2",
                                color: "#B91C1C",
                                "&.Mui-disabled": {
                                  bgcolor: "#FEE2E2",
                                  color: "#B91C1C",
                                  cursor: "not-allowed",
                                },
                              }}
                            >
                              Cancelled
                            </Button>
                          )}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Box sx={{ padding: "30px", textAlign: "center" }}>
                      <Typography
                        sx={{
                          fontFamily: "Albert Sans",
                          fontSize: "16px",
                          color: "#666",
                        }}
                      >
                        No orders found for the selected period
                      </Typography>
                    </Box>
                  )}

                  {totalPages > 1 && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        padding: "16px",
                        borderTop: "1px solid #e0e0e0",
                      }}
                    >
                      <Box sx={{ display: "flex", gap: "8px" }}>
                        <Button
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage(currentPage - 1)}
                          sx={{
                            minWidth: "32px",
                            height: "32px",
                            padding: 0,
                            color: "#666",
                            borderColor: "#e0e0e0",
                            "&.Mui-disabled": {
                              color: "#ccc",
                            },
                          }}
                          variant="outlined"
                        >
                          {"<"}
                        </Button>

                        {[...Array(totalPages).keys()].map((page) => (
                          <Button
                            key={page}
                            onClick={() => setCurrentPage(page + 1)}
                            sx={{
                              minWidth: "32px",
                              height: "32px",
                              padding: 0,
                              backgroundColor:
                                currentPage === page + 1
                                  ? "#19AEDC"
                                  : "transparent",
                              color: currentPage === page + 1 ? "#fff" : "#666",
                              border:
                                currentPage === page + 1
                                  ? "none"
                                  : "1px solid #e0e0e0",
                              "&:hover": {
                                backgroundColor:
                                  currentPage === page + 1
                                    ? "#1793B8"
                                    : "#f5f5f5",
                              },
                            }}
                            variant={
                              currentPage === page + 1
                                ? "contained"
                                : "outlined"
                            }
                          >
                            {page + 1}
                          </Button>
                        ))}

                        <Button
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage(currentPage + 1)}
                          sx={{
                            minWidth: "32px",
                            height: "32px",
                            padding: 0,
                            color: "#666",
                            borderColor: "#e0e0e0",
                            "&.Mui-disabled": {
                              color: "#ccc",
                            },
                          }}
                          variant="outlined"
                        >
                          {">"}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
        <Dialog
          open={dialogState.open}
          onClose={closeDialog}
          sx={{ zIndex: 9999 }} // Ensure it appears above everything
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
    </div>
  );
};

export default EventDashboard;
