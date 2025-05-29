import React, { useState, useEffect } from "react";
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
  useMediaQuery
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import InsertChartIcon from "@mui/icons-material/InsertChart";
import EventIcon from "@mui/icons-material/Event";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useLocation, useParams } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase_config";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { CSVLink } from 'react-csv';

const EventDashboard = () => {
  const { state } = useLocation();
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(state?.eventData || {});
  const [loading, setLoading] = useState(true);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [eventStats, setEventStats] = useState({
    grossSales: 0,
    ticketsSold: 0,
    totalEvents: 0
  });
  const [bannerImage, setBannerImage] = useState("");
  const [usernames, setUsernames] = useState({});
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [salesData, setSalesData] = useState([]);
  const [timeFilter, setTimeFilter] = useState("90");
  const [allOrders, setAllOrders] = useState([]);
  const isMobile = useMediaQuery("(max-width:900px)");
  // Color palette for the chart
  const COLORS = ['#19AEDC', '#4FC3F7', '#2196F3', '#1565C0', '#0D47A1'];

  // CSV state
  const [csvData, setCsvData] = useState([]);
  const csvLink = React.createRef();

  const ordersPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [displayedOrders, setDisplayedOrders] = useState([]);

  // Fetch event data if not available in state
  useEffect(() => {
    const fetchEventData = async () => {
      if (!state?.eventData && eventId) {
        try {
          const response = await axios.get(`http://localhost:8080/api/event/${eventId}`);
          setEventData(response.data);
        } catch (err) {
          console.error("Error fetching event data:", err);
        }
      }
    };

    fetchEventData();
  }, [eventId, state]);

  // Function to fetch username by userId
  const fetchUsername = async (userId) => {
    if (usernames[userId]) return usernames[userId];

    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const name = userData.displayName || userData.name || userData.username || "Unknown User";
        setUsernames(prev => ({...prev, [userId]: name}));
        return name;
      }
      return "User Not Found";
    } catch (err) {
      console.error("Error fetching user data:", err);
      return "Error Loading User";
    }
  };

  // Fetch ticket data, orders, and banner image
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!eventId || !eventData) return;

      setLoading(true);

      try {
        // Get ticket types from the event pricing
        const ticketTypeData = eventData.pricing?.map((ticket, index) => ({
          type: ticket.ticketType || "Standard",
          price: Number(ticket.price),
          seats: Math.max(1, Number(ticket.seats) || 0), // Ensure seats is at least 1
          sold: 0,
          revenue: 0,
          isFree: ticket.freetrue || ticket.price === 0 || ticket.price === "0",
          color: COLORS[index % COLORS.length]
        })) || [];

        if (ticketTypeData.length === 0) {
          ticketTypeData.push({
            type: "Standard",
            price: 0,
            seats: 100,
            sold: 0,
            revenue: 0,
            isFree: true,
            color: COLORS[0]
          });
        }

        // Fetch banner image from bannerImages array
        if (eventData.bannerImages && eventData.bannerImages.length > 0) {
          setBannerImage(eventData.bannerImages[0]); // Use the first banner image
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

        ticketTypeData.forEach(ticket => {
          typeSales[ticket.type] = { sold: 0, revenue: 0 };
        });

        for (const docSnapshot of ticketSnapshots.docs) {
          const ticketData = docSnapshot.data();

          if (ticketData.ticketSummary && Array.isArray(ticketData.ticketSummary)) {
            let customerName = ticketData.userName || "Guest User";

            if (ticketData.userId) {
              customerName = await fetchUsername(ticketData.userId);
            }

            const isFreeEvent = ticketData.financial?.isFreeEvent || false;

            let ticketType = "Standard";
            if (ticketData.ticketSummary[0]) {
              ticketType = ticketData.ticketSummary[0].type || ticketData.ticketSummary[0].name || "Standard";
            }

            const purchaseDate = new Date(ticketData.purchaseDate?.toDate() || ticketData.createdAt || Date.now());
            const formattedDate = purchaseDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric"
            });

            const amount = ticketData.financial?.totalAmount || ticketData.totalAmount || 0;

            const orderObj = {
              id: docSnapshot.id,
              custID: `#ORD-${docSnapshot.id.substring(0, 3)}`,
              custName: customerName,
              userId: ticketData.userId || "",
              email: ticketData.email || ticketData.userEmail || "",
              phone: ticketData.phone || ticketData.userPhone || "",
              ticketType: isFreeEvent ? "Free" : ticketType,
              date: formattedDate,
              purchaseDate: purchaseDate,
              amt: amount,
              isFree: isFreeEvent
            };

            orders.push(orderObj);

            csvDataArray.push({
              Order_ID: orderObj.custID,
              Customer_Name: customerName,
              Customer_Email: orderObj.email,
              Customer_Phone: orderObj.phone,
              Ticket_Type: isFreeEvent ? "Free" : ticketType,
              Purchase_Date: formattedDate,
              Amount: isFreeEvent ? "0" : amount.toString()
            });

            ticketData.ticketSummary.forEach(summary => {
              const quantity = Number(summary.quantity) || 0;
              const price = isFreeEvent ? 0 : (Number(summary.price) || 0);
              const revenue = price * quantity;
              const type = summary.type || summary.name || "Standard";

              totalTicketsSold += quantity;
              totalRevenue += revenue;

              if (typeSales[type]) {
                typeSales[type].sold += quantity;
                typeSales[type].revenue += revenue;
              } else {
                const existingTypeIndex = ticketTypeData.findIndex(t => t.type === type);
                if (existingTypeIndex !== -1) {
                  typeSales[type] = { sold: quantity, revenue };
                } else {
                  if (typeSales["Other"]) {
                    typeSales["Other"].sold += quantity;
                    typeSales["Other"].revenue += revenue;
                  } else {
                    typeSales["Other"] = { sold: quantity, revenue };
                    ticketTypeData.push({
                      type: "Other",
                      price: price,
                      seats: 100,
                      sold: quantity,
                      revenue: revenue,
                      isFree: price === 0,
                      color: COLORS[ticketTypeData.length % COLORS.length]
                    });
                  }
                }
              }
            });
          }
        }

        const updatedTicketTypes = ticketTypeData.map(ticket => {
          const salesData = typeSales[ticket.type] || { sold: 0, revenue: 0 };
          return {
            ...ticket,
            sold: salesData.sold,
            revenue: salesData.revenue
          };
        });

        // Prepare chart data as a single entry with all ticket types
        const chartDataEntry = { name: "Ticket Sales" };
        updatedTicketTypes
          .filter(ticket => ticket.sold > 0)
          .forEach(ticket => {
            const sanitizedKey = ticket.type.replace(/\s+/g, '_');
            chartDataEntry[sanitizedKey] = ticket.sold;
            chartDataEntry[`${sanitizedKey}Color`] = ticket.color;
          });
        const chartData = [chartDataEntry];

        setCsvData([
          ["Order ID", "Customer Name", "Email", "Phone", "Ticket Type", "Purchase Date", "Amount"],
          ...csvDataArray.map(item => [
            item.Order_ID,
            item.Customer_Name,
            item.Customer_Email,
            item.Customer_Phone,
            item.Ticket_Type,
            item.Purchase_Date,
            item.Amount
          ])
        ]);

        setTicketTypes(updatedTicketTypes);
        setRecentOrders(orders);
        setAllOrders(orders);
        setSalesData(chartData);
        setEventStats({
          grossSales: totalRevenue,
          ticketsSold: totalTicketsSold,
          totalEvents: eventData.organizerEvents || 1
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

        filteredOrders = allOrders.filter(order =>
          order.purchaseDate >= filterDate
        );
      }

      setRecentOrders(filteredOrders);
      setTotalPages(Math.ceil(filteredOrders.length / ordersPerPage));
      updateDisplayedOrders(filteredOrders, 1);
      setCurrentPage(1);

      const typeSales = {};

      ticketTypes.forEach(ticket => {
        typeSales[ticket.type] = { sold: 0, color: ticket.color };
      });

      filteredOrders.forEach(order => {
        const type = order.ticketType;
        if (typeSales[type]) {
          typeSales[type].sold += 1;
        } else {
          if (typeSales["Other"]) {
            typeSales["Other"].sold += 1;
          } else {
            typeSales["Other"] = {
              sold: 1,
              color: COLORS[Object.keys(typeSales).length % COLORS.length]
            };
          }
        }
      });

      // Prepare chart data as a single entry with all ticket types
      const chartDataEntry = { name: "Ticket Sales" };
      ticketTypes
        .filter(ticket => typeSales[ticket.type]?.sold > 0)
        .forEach(ticket => {
          const sanitizedKey = ticket.type.replace(/\s+/g, '_');
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

  const toggleAnalytics = () => {
    setShowAnalytics(!showAnalytics);
  };

  const formatEventDate = () => {
    if (!eventData.eventDate) return "Date not set";

    const eventDate = new Date(eventData.eventDate);
    return eventDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  const calculateProgress = (ticket) => {
    const seats = ticket.seats && ticket.seats > 0 ? ticket.seats : 1; // Ensure seats is at least 1
    const percentage = (ticket.sold / seats) * 100;
    return Math.min(100, Math.max(0, percentage)); // Cap between 0% and 100%
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: "#19AEDC" }} />
      </Box>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{
          backgroundColor: '#fff',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <Typography sx={{ fontFamily: 'Albert Sans', fontWeight: 600 }}>
            {payload[0].name}
          </Typography>
          <Typography sx={{ fontFamily: 'Albert Sans' }}>
            Tickets Sold: {payload[0].value}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <div sx={{overflowX: "hidden"}}>
      <HeaderVendorLogged />
      <Box
        sx={{
          display: "flex",
          width: isMobile?"92%":"80%",
          margin: "0 auto",
          flexDirection: isMobile?"column":"row",
          gap: "24px",
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Box
            sx={{
              width: "100%",
              display: isMobile?"block":"flex",
              padding: "24px 0",
              justifyContent: "space-between",
              alignItems: "center",
              width:isMobile?"90%":null,
            }}
          >
            
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: isMobile?"24px":"32px",
                fontWeight: "700",
              }}
            >
              {eventData.name}
            </Typography>
            <Box sx={{ display: "flex", gap: "12px", marginLeft: "auto",mt:isMobile?"16px":"0" }}>
              <Button
                variant="contained"
                sx={{
                  textTransform: "none",
                  fontFamily: "Albert Sans",
                  backgroundColor: "#fff",
                  color: "#333",
                  border: "1px solid #ddd",
                  boxShadow: "0px 1px 3px rgba(0,0,0,0.1)",
                  '&:hover': {
                    backgroundColor: "#f8f8f8",
                    boxShadow: "0px 2px 5px rgba(0,0,0,0.15)",
                  p:isMobile?"1% 2%":null,
                  }
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
                  '&:hover': {
                    backgroundColor: "#1793B8"
                  },
                  p:isMobile?"1% 2%":null,
                }}
                onClick={toggleAnalytics}
              >
                <InsertChartIcon sx={{ fontSize: "18px", mr: "8px" }} />
                View Analytics
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3} sx={{ mt: 2, mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: "40px",
                        height: isMobile?"40px":"40px",
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

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
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

            <Grid item xs={12} sm={6} md={4}>
              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
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
                <Grid item xs={12} md={6} key={idx}>
                  <Card
                    elevation={0}
                    sx={{
                      border: "1px solid #e0e0e0",
                      borderRadius: "8px",
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
                            {ticket.sold} sold
                            {ticket.seats > 0 ? ` out of ${Math.floor(ticket.seats)}` : ""}
                          </Typography>
                          <Typography
                            sx={{
                              fontFamily: "Albert Sans",
                              fontSize: "14px",
                              color: "#666",
                            }}
                          >
                            {calculateProgress(ticket).toFixed(0)}%
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={calculateProgress(ticket)}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#e0e0e0",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: ticket.color || "#19AEDC",
                              borderRadius: 4,
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
                          fontFamily: "Albert Sans"
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
                      gridTemplateColumns: "1fr 2fr 1.5fr 1fr 1fr",
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
                        textAlign: "right",
                      }}
                    >
                      Amount
                    </Typography>
                  </Box>

                  {displayedOrders.length > 0 ? (
                    displayedOrders.map((order, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 2fr 1.5fr 1fr 1fr",
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
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "14px",
                          }}
                        >
                          {order.ticketType}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "14px",
                          }}
                        >
                          {order.date}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Albert Sans",
                            fontSize: "14px",
                            fontWeight: "600",
                            textAlign: "right",
                          }}
                        >
                          {order.isFree ? (
                            <span style={{ color: "#4CAF50" }}>Free</span>
                          ) : (
                            `₹${order.amt.toLocaleString()}`
                          )}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Box
                      sx={{
                        padding: "30px",
                        textAlign: "center",
                      }}
                    >
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
                            '&.Mui-disabled': {
                              color: '#ccc',
                            }
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
                              backgroundColor: currentPage === page + 1 ? "#19AEDC" : "transparent",
                              color: currentPage === page + 1 ? "#fff" : "#666",
                              border: currentPage === page + 1 ? "none" : "1px solid #e0e0e0",
                              "&:hover": {
                                backgroundColor: currentPage === page + 1 ? "#1793B8" : "#f5f5f5",
                              },
                            }}
                            variant={currentPage === page + 1 ? "contained" : "outlined"}
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
                            '&.Mui-disabled': {
                              color: '#ccc',
                            }
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

        {bannerImage && (
          <Box
            sx={{
              width: "300px",
              display: { xs: "none", md: "block" },
              mt: "24px",
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "400px",
                borderRadius: "10px",
                overflow: "hidden",
                position: "sticky",
                top: "24px",
              }}
            >
              <img
                src={bannerImage}
                alt="Event Banner"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>
          </Box>
        )}
      </Box>

      {showAnalytics && (
        <Box
  sx={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  }}
>
  <Box
    sx={{
      width: isMobile ? "80%" : "80%",
      maxWidth: "1000px",
      backgroundColor: "white",
      borderRadius: "10px",
      padding: isMobile?"20px":"24px",
      maxHeight: "90vh",
      overflowY: "auto",
    }}
  >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "Albert Sans",
                  fontSize: isMobile?"20px":"24px",
                  fontWeight: "700",
                }}
              >
                Ticket Sales Analytics
              </Typography>
              <IconButton
                onClick={toggleAnalytics}
                sx={{ color: "#666" }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "24px",
              }}
            >
              <FormControl size="small">
                <Select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  sx={{
                    height: "36px",
                    minWidth: "150px",
                    fontFamily: "Albert Sans"
                  }}
                >
                  <MenuItem value="7">Last 7 days</MenuItem>
                  <MenuItem value="30">Last 30 days</MenuItem>
                  <MenuItem value="90">Last 90 days</MenuItem>
                  <MenuItem value="all">All time</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#19AEDC",
                  textTransform: "none",
                  fontFamily: "Albert Sans",
                  padding: isMobile?"4px 8px":"6px 16px",
                  borderRadius: "4px",
                  '&:hover': {
                    backgroundColor: "#1793B8"
                  }
                }}
                onClick={downloadSalesReport}
              >
                Export
              </Button>
            </Box>

            <Card elevation={0} sx={{
              border: "1px solid #e0e0e0",
              borderRadius: "8px",
              overflow: "hidden",
              marginBottom: "24px",
              width:isMobile?"100%":null,
            }}>
              <CardContent sx={{ padding: isMobile?"1px":"24px" }}>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={salesData}
                    margin={{
                      top: isMobile?5:20,
                      right: isMobile?5:30,
                      left: isMobile?10: 20,
                      bottom: isMobile?0:5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      tick={{ fill: '#666', fontFamily: 'Albert Sans', fontSize: isMobile?10:12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                    />
                    <YAxis
                      tick={{ fill: '#666', fontFamily: 'Albert Sans', fontSize: isMobile?10:12 }}
                      axisLine={{ stroke: '#e0e0e0' }}
                      label={{ value: 'Tickets Sold', angle: -90, position: 'insideLeft', fontFamily: 'Albert Sans', fill: '#666',fontSize: isMobile?10:12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {ticketTypes
                      .filter(ticket => ticket.sold > 0)
                      .map((ticket, index) => {
                        const sanitizedKey = ticket.type.replace(/\s+/g, '_');
                        return (
                          <Bar
                            key={`bar-${index}`}
                            dataKey={sanitizedKey}
                            name={ticket.type}
                            fill={salesData[0][`${sanitizedKey}Color`] || COLORS[index % COLORS.length]}
                            radius={[4, 4, 0, 0]}
                          />
                        );
                      })}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{
              backgroundColor: "#f9f9f9",
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <CardContent sx={{ padding: "24px" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "24px",
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: "20px",
                        fontWeight: "700",
                        marginBottom: "8px",
                      }}
                    >
                      Event Details
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: "8px",
                      }}
                    >
                      <CalendarTodayIcon
                        sx={{ color: "#666", marginRight: "8px", fontSize: "18px" }}
                      />
                      <Typography
                        sx={{
                          fontFamily: "Albert Sans",
                          fontSize: "14px",
                          color: "#666",
                        }}
                      >
                        {formatEventDate()}
                      </Typography>
                    </Box>
                  </Box>
                  {!isMobile &&(
                  <Box
                    sx={{
                      width: "240px",
                      height: "120px",
                      overflow: "hidden",
                      borderRadius: "8px",
                    }}
                  >
                    <img
                      src={bannerImage || "/placeholder-event.jpg"}
                      alt={eventData.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                  )}
                </Box>

               <Box
  sx={{
    display: 'flex',
    flexDirection: { xs: 'column', md: 'row' },
    gap: 3,
    width: '100%',
  }}
>
  <Box sx={{ flex: 1 }}>
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Typography
          sx={{
            fontFamily: 'Albert Sans',
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px',
          }}
        >
          Total Tickets Sold
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Albert Sans',
            fontSize: '28px',
            fontWeight: '700',
          }}
        >
          {eventStats.ticketsSold.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  </Box>

  <Box sx={{ flex: 1 }}>
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Typography
          sx={{
            fontFamily: 'Albert Sans',
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px',
          }}
        >
          Revenue Generated
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Albert Sans',
            fontSize: '28px',
            fontWeight: '700',
          }}
        >
          ₹{eventStats.grossSales.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  </Box>

  <Box sx={{ flex: 1 }}>
    <Card elevation={1} sx={{ height: '100%' }}>
      <CardContent>
        <Typography
          sx={{
            fontFamily: 'Albert Sans',
            fontSize: '14px',
            color: '#666',
            marginBottom: '8px',
          }}
        >
          Ticket Types
        </Typography>
        <Typography
          sx={{
            fontFamily: 'Albert Sans',
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '8px',
          }}
        >
          {ticketTypes.length}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {ticketTypes
            .filter(ticket => ticket.sold > 0)
            .slice(0, 3)
            .map((ticket, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Typography sx={{ fontFamily: 'Albert Sans', fontSize: '12px' }}>
                  {ticket.type}
                </Typography>
                <Typography
                  sx={{
                    fontFamily: 'Albert Sans',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {ticket.sold} sold
                </Typography>
              </Box>
            ))}
          {ticketTypes.filter(t => t.sold > 0).length > 3 && (
            <Typography
              sx={{
                fontFamily: 'Albert Sans',
                fontSize: '12px',
                color: '#19AEDC',
                textAlign: 'center',
                cursor: 'pointer',
              }}
            >
              + {ticketTypes.filter(t => t.sold > 0).length - 3} more types
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  </Box>
</Box>

              </CardContent>
            </Card>
          </Box>
        </Box>
      )}

      <CSVLink
        data={csvData}
        filename={`${eventData.name || 'event'}_sales_report.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </div>
  );
};

export default EventDashboard;