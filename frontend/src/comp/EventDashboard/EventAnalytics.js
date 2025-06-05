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
  useMediaQuery,
  LinearProgress,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
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
  Legend,
} from "recharts";
import { CSVLink } from "react-csv";

const EventAnalytics = () => {
  const { state } = useLocation();
  const { eventId } = useParams();
  const navigate = useNavigate();

  // Check if we have complete data from navigation state
  const hasCompleteData = state?.completeAnalyticsData;

  // Initialize with passed data or defaults
  const [eventData, setEventData] = useState(
    hasCompleteData
      ? state.completeAnalyticsData.eventData
      : state?.eventData || {}
  );
  const [loading, setLoading] = useState(!hasCompleteData);
  const [ticketTypes, setTicketTypes] = useState(
    hasCompleteData ? state.completeAnalyticsData.ticketTypes : []
  );
  const [recentOrders, setRecentOrders] = useState(
    hasCompleteData ? state.completeAnalyticsData.recentOrders : []
  );
  const [allOrders, setAllOrders] = useState(
    hasCompleteData ? state.completeAnalyticsData.allOrders : []
  );
  const [eventStats, setEventStats] = useState(
    hasCompleteData
      ? state.completeAnalyticsData.eventStats
      : {
          grossSales: 0,
          ticketsSold: 0,
          totalEvents: 0,
          vendorTaxAmount: 0,
          userTaxAmount: 0,
          platformTaxAmount: 0,
          profits: 0,
        }
  );
  const [bannerImage, setBannerImage] = useState(
    hasCompleteData ? state.completeAnalyticsData.bannerImage : ""
  );
  const [usernames, setUsernames] = useState(
    hasCompleteData ? state.completeAnalyticsData.usernames : {}
  );
  const [salesData, setSalesData] = useState(
    hasCompleteData ? state.completeAnalyticsData.salesData : []
  );
  const [timeFilter, setTimeFilter] = useState(
    hasCompleteData ? state.completeAnalyticsData.timeFilter : "90"
  );
  const [csvData, setCsvData] = useState(
    hasCompleteData ? state.completeAnalyticsData.csvData : []
  );
  const isMobile = useMediaQuery("(max-width:900px)");
  const COLORS = hasCompleteData
    ? state.completeAnalyticsData.COLORS
    : ["#19AEDC", "#4FC3F7", "#2196F3", "#1565C0", "#0D47A1"];

  const csvLink = React.createRef();
  const ordersPerPage = 10;

  // If we don't have complete data, fetch and process it
  useEffect(() => {
    if (!hasCompleteData && eventId) {
      fetchAndProcessEventData();
    } else if (hasCompleteData) {
      setLoading(false);
    }
  }, [eventId, hasCompleteData]);

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

  const fetchAndProcessEventData = async () => {
    if (!eventData?.eventId && eventId) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/event/${eventId}`
        );
        setEventData(response.data);
        await processEventData(response.data);
      } catch (err) {
        console.error("Error fetching event data:", err);
        setLoading(false);
      }
    } else if (eventData?.eventId) {
      await processEventData(eventData);
    }
  };

  const processEventData = async (eventDataToProcess) => {
    setLoading(true);

    try {
      // Process ticket types
      const ticketTypeData =
        eventDataToProcess.pricing?.map((ticket, index) => ({
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

      // Set banner image
      if (
        eventDataToProcess.bannerImages &&
        eventDataToProcess.bannerImages.length > 0
      ) {
        setBannerImage(eventDataToProcess.bannerImages[0]);
      }

      // Fetch tickets data
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

      // Process each ticket
      for (const docSnapshot of ticketSnapshots.docs) {
        const ticketData = docSnapshot.data();

        if (
          ticketData.ticketSummary &&
          Array.isArray(ticketData.ticketSummary)
        ) {
          let customerName = ticketData.userName || "Guest User";

          if (ticketData.userId) {
            customerName = await fetchUsername(ticketData.userId);
          }

          const isFreeEvent = ticketData.financial?.isFreeEvent || false;

          let ticketType = "Standard";
          if (ticketData.ticketSummary[0]) {
            ticketType =
              ticketData.ticketSummary[0].type ||
              ticketData.ticketSummary[0].name ||
              "Standard";
          }

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

          const amount =
            ticketData.financial?.totalAmount || ticketData.totalAmount || 0;

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
            isFree: isFreeEvent,
          };

          orders.push(orderObj);

          csvDataArray.push({
            Order_ID: orderObj.custID,
            Customer_Name: customerName,
            Customer_Email: orderObj.email,
            Customer_Phone: orderObj.phone,
            Ticket_Type: isFreeEvent ? "Free" : ticketType,
            Purchase_Date: formattedDate,
            Amount: isFreeEvent ? "0" : amount.toString(),
          });

          // Process ticket summary
          ticketData.ticketSummary.forEach((summary) => {
            const quantity = Number(summary.quantity) || 0;
            const price = isFreeEvent ? 0 : Number(summary.price) || 0;
            const revenue = price * quantity;
            const type = summary.type || summary.name || "Standard";

            totalTicketsSold += quantity;
            totalRevenue += revenue;

            if (typeSales[type]) {
              typeSales[type].sold += quantity;
              typeSales[type].revenue += revenue;
            } else {
              const existingTypeIndex = ticketTypeData.findIndex(
                (t) => t.type === type
              );
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
                    color: COLORS[ticketTypeData.length % COLORS.length],
                  });
                }
              }
            }
          });
        }
      }

      // Update ticket types with sales data
      const updatedTicketTypes = ticketTypeData.map((ticket) => {
        const salesData = typeSales[ticket.type] || { sold: 0, revenue: 0 };
        return {
          ...ticket,
          sold: salesData.sold,
          revenue: salesData.revenue,
        };
      });

      // Create chart data
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
      const vendorTaxRate = Number(eventDataToProcess.vendorTax) || 0;
      const userTaxRate = Number(eventDataToProcess.taxPercentage) || 0;
      const vendorTaxAmount = totalRevenue * (vendorTaxRate / 100);
      const userTaxAmount = totalRevenue * (userTaxRate / 100);
      const basePlatformTaxPercent = 2;
      const basePlatformTaxAmount =
        (basePlatformTaxPercent / 100) * totalRevenue;
      const additionalPlatformTax = basePlatformTaxAmount * (18 / 100);
      const platformTaxAmount = basePlatformTaxAmount + additionalPlatformTax;
      const combinedVendorTaxAmount =
        vendorTaxAmount + userTaxAmount + platformTaxAmount;
      const profits =
        totalRevenue - vendorTaxAmount - userTaxAmount - platformTaxAmount;
      // Set CSV data
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

      // Update all states
      setTicketTypes(updatedTicketTypes);
      setRecentOrders(orders);
      setAllOrders(orders);
      setSalesData(chartData);
      setEventStats({
        grossSales: totalRevenue,
        ticketsSold: totalTicketsSold,
        totalEvents: eventDataToProcess.organizerEvents || 1,
        vendorTaxAmount: combinedVendorTaxAmount,
        userTaxAmount: 0,
        platformTaxAmount: 0,
        profits: profits,
      });
    } catch (err) {
      console.error("Error processing event data:", err);
    } finally {
      setLoading(false);
    }
  };
  console.log("Event stats", eventData);

  const totalSeats =
    eventData?.pricing?.reduce(
      (acc, item) => acc + (Number(item.seats) || 0),
      0
    ) || 0;

  const ticketsSold = eventData?.ticketsSold || 0;
  const soldPercentage = totalSeats > 0 ? (ticketsSold / totalSeats) * 100 : 0;

  const maximumGrossSales =
    eventData?.pricing?.reduce(
      (acc, item) =>
        acc + (Number(item.price) || 0) * (Number(item.seats) || 0),
      0
    ) || 0;

  const grossSales = eventData?.gross || 0;
  const grossSalesPercentage =
    maximumGrossSales > 0 ? (grossSales / maximumGrossSales) * 100 : 0;

  const downloadSalesReport = () => {
    csvLink.current.link.click();
  };

  const pricing = eventData.pricing || [];

  // Create sales data for the graph - ensure we have the correct structure
  const salesDataGraph = pricing
    .filter((ticket) => ticket.booked > 0) // Only include tickets with sales
    .map((ticket, index) => ({
      name: ticket.ticketType || `Ticket ${index + 1}`, // Ensure name exists
      booked: Number(ticket.booked) || 0, // Ensure numeric value
      color: COLORS[index % COLORS.length], // Use consistent color indexing
    }));

  // Check if we have any sales data
  const hasSalesData =
    salesDataGraph.length > 0 && salesDataGraph.some((item) => item.booked > 0);

  // Custom Tooltip component (keep this as is - it's working fine)
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: "#fff",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "4px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          <Typography sx={{ fontFamily: "Albert Sans", fontWeight: 600 }}>
            {payload[0].payload.name}
          </Typography>
          <Typography sx={{ fontFamily: "Albert Sans" }}>
            Tickets Sold: {payload[0].value}
          </Typography>
        </Box>
      );
    }
    return null;
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

  return (
    <div>
      <Box
        sx={{
          width: "100%",
          bgcolor: isMobile ? "white" : "#F9FAFB",
          overflowX: "hidden",
        }}
      >
        <Box
          sx={{
            width: isMobile ? "90%" : "90%",
            borderRadius: "10px",
            padding: isMobile ? "20px" : "24px",
            minHeight: "95vh",
          }}
        >
          <Typography
            sx={{
              fontFamily: "albert sans",
              fontSize: isMobile ? "30px" : "40px",
              mb: "0.5em",
              fontWeight: "800",
            }}
          >
            Graph view
          </Typography>
          <Box
            sx={{
              display: !isMobile ? "flex" : "block",
              gap: "5%",
              width: "90%",
              margin: "0 auto",
            }}
          >
            {/*left content*/}
            <Box
              sx={{
                width: isMobile ? "100%" : "60%",
                bgcolor: "white",
                padding: "2% 3%",
                borderRadius: "10px",
                boxShadow: "4px 4px 12px rgba(0, 0, 0, 0.1)",
                mb: isMobile ? "2em" : 0,
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
                    fontSize: isMobile ? "20px" : "24px",
                    fontWeight: "700",
                  }}
                >
                  Ticket Sales Analytics
                </Typography>
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
                      fontFamily: "Albert Sans",
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
                    padding: isMobile ? "4px 8px" : "6px 16px",
                    borderRadius: "4px",
                    "&:hover": {
                      backgroundColor: "#1793B8",
                    },
                  }}
                  onClick={downloadSalesReport}
                >
                  Export
                </Button>
              </Box>

              <Card
                elevation={0}
                sx={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "8px",
                  overflow: "hidden",
                  marginBottom: "24px",
                  width: isMobile ? "100%" : null,
                }}
              >
                <CardContent sx={{ padding: isMobile ? "16px" : "24px" }}>
                  {hasSalesData ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={salesDataGraph}
                        barCategoryGap={isMobile ? "20%" : "30%"}
                        margin={{
                          top: 20,
                          right: 30,
                          left: 20,
                          bottom: 60, // Increased bottom margin for better label spacing
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="name"
                          tick={{
                            fill: "#666",
                            fontFamily: "Albert Sans",
                            fontSize: isMobile ? 10 : 12,
                          }}
                          axisLine={{ stroke: "#e0e0e0" }}
                          tickLine={{ stroke: "#e0e0e0" }}
                          angle={isMobile ? -45 : 0} // Rotate labels on mobile for better fit
                          textAnchor={isMobile ? "end" : "middle"}
                          height={isMobile ? 80 : 60}
                          label={{ value: "Ticket Types" }}
                        />
                        <YAxis
                          tick={{
                            fill: "#666",
                            fontFamily: "Albert Sans",
                            fontSize: isMobile ? 10 : 12,
                          }}
                          axisLine={{ stroke: "#e0e0e0" }}
                          tickLine={{ stroke: "#e0e0e0" }}
                          label={{
                            value: "Tickets Sold",
                            angle: -90,
                            position: "insideLeft",
                            fontFamily: "Albert Sans",
                            fill: "#666",
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar
                          dataKey="booked"
                          fill="#19AEDC"
                          radius={[4, 4, 0, 0]}
                          minPointSize={2} // Ensures small values are still visible
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <Box
                      sx={{
                        height: 300,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontFamily: "Albert Sans",
                        fontSize: "16px",
                        textAlign: "center",
                      }}
                    >
                      No tickets sold yet to display graph.
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            {/*right content*/}
            <Box sx={{ width: isMobile ? "100%" : "30%" }}>
              <Card
                elevation={0}
                sx={{
                  bgcolor: "white",
                  padding: "2% 3%",
                  borderRadius: "10px",
                  boxShadow: "4px 4px 12px rgba(0, 0, 0, 0.1)",
                  overflow: "hidden",
                }}
              >
                <CardContent sx={{ padding: "24px" }}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "24px",
                    }}
                  >
                    {!isMobile && bannerImage && (
                      <Box
                        sx={{
                          width: "100%",
                          height: "200px",
                          overflow: "hidden",
                          borderRadius: "8px",
                          mb: "1em",
                        }}
                      >
                        <img
                          src={bannerImage}
                          alt={eventData.name || "Event"}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        mt: "1em",
                      }}
                    >
                      <Typography
                        sx={{
                          fontFamily: "Albert Sans",
                          fontSize: "20px",
                          fontWeight: "700",
                          marginBottom: "8px",
                        }}
                      >
                        {eventData.name || "Event Details"}
                      </Typography>

                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        <CalendarTodayIcon
                          sx={{
                            color: "#666",
                            marginRight: "8px",
                            fontSize: "18px",
                          }}
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
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: { xs: "column", md: "column" },
                      gap: 3,
                      width: "100%",
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Card
                        elevation={1}
                        sx={{ height: "100%", bgcolor: "#F9FAFB" }}
                      >
                        <CardContent>
                          <Typography
                            sx={{
                              fontFamily: "Albert Sans",
                              fontSize: "14px",
                              color: "#666",
                              marginBottom: "8px",
                            }}
                          >
                            Total Tickets Sold
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Albert Sans",
                                fontSize: "16px",
                                fontWeight: "600",
                              }}
                            >
                              {ticketsSold.toLocaleString()} /{" "}
                              {totalSeats.toLocaleString()}
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: "Albert Sans",
                                fontSize: "14px",
                                color: "#888",
                              }}
                            >
                              {soldPercentage.toFixed(1)}%
                            </Typography>
                          </Box>

                          <LinearProgress
                            variant="determinate"
                            value={soldPercentage}
                            sx={{ height: 10, borderRadius: 5, marginTop: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Card
                        elevation={1}
                        sx={{ height: "100%", bgcolor: "#F9FAFB" }}
                      >
                        <CardContent>
                          <Typography
                            sx={{
                              fontFamily: "Albert Sans",
                              fontSize: "14px",
                              color: "#666",
                              marginBottom: "8px",
                            }}
                          >
                            Gross Sales
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: "Albert Sans",
                                fontSize: "16px",
                                fontWeight: "600",
                              }}
                            >
                              ₹{grossSales.toLocaleString()} / ₹
                              {maximumGrossSales.toLocaleString()}
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: "Albert Sans",
                                fontSize: "14px",
                                color: "#888",
                              }}
                            >
                              {grossSalesPercentage.toFixed(1)}%
                            </Typography>
                          </Box>

                          <LinearProgress
                            variant="determinate"
                            value={grossSalesPercentage}
                            sx={{ height: 10, borderRadius: 5, marginTop: 1 }}
                          />
                        </CardContent>
                      </Card>
                    </Box>

                    <Box>
                      {eventData.pricing.map((ticket, index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography sx={{ fontFamily: "albert sans" }}>
                            {ticket.ticketType} tickets
                          </Typography>
                          <Typography sx={{ fontFamily: "albert sans" }}>
                            {ticket.booked > 0 ? ticket.booked : 0} sold
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
        </Box>
      </Box>

      <CSVLink
        data={csvData}
        filename={`${eventData.name || "event"}_sales_report.csv`}
        className="hidden"
        ref={csvLink}
        target="_blank"
      />
    </div>
  );
};

export default EventAnalytics;
