import { React, useEffect, useState } from "react";
import {
  Box,
  Typography,
  InputBase,
  Popover,
  Button,
  MenuItem,
  FormControl,
  Select,
  Card
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import CurrencyRupeeOutlinedIcon from "@mui/icons-material/CurrencyRupeeOutlined";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import axios from "axios";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase_config";
import { Snackbar, Alert ,useMediaQuery} from "@mui/material";
import HeaderVendorLogged from "../Header/HeaderVendorLogged";
import { onAuthStateChanged, signOut } from "firebase/auth";

const VendorHome = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const isMobile = useMediaQuery("(max-width:900px)");
  // Vendor and event data states
  const [vendorData, setVendorData] = useState(null);
  const [eventData, setEventData] = useState([]);
  const [status, setStatus] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Metrics states
  const [totalEvents, setTotalEvents] = useState(0);
  const [ticketsSold, setTicketsSold] = useState(0);
  const [grossSales, setGrossSales] = useState(0);
  const [activeEvents, setActiveEvents] = useState(0);

  // Growth metrics states
  const [eventsGrowth, setEventsGrowth] = useState(12);
  const [ticketsGrowth, setTicketsGrowth] = useState(8);
  const [salesGrowth, setSalesGrowth] = useState(15);

  const eventsPerPage = isMobile?4:8;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passvendorId, passsetVendorId] = useState(null);
  const [username, setUsername] = useState("");

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
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/user/post-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });

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
      alert("Failed to log out. Please try again.");
    }
  };

  const handleChange = (event) => {
    setStatus(event.target.value);
    setCurrentPage(1);
  };

  const handleClick = (event, selectedEventData) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedEvent(selectedEventData);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value.toLowerCase());
    setCurrentPage(1);
  };

  // Calculate maximum tickets for an event
  const getMaxTickets = (event) => {
    if (!event.pricing || !Array.isArray(event.pricing)) return 0;
    return event.pricing.reduce((total, item) => {
      return total + (parseInt(item.seats) || 0);
    }, 0);
  };

  // Calculate event status
  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = new Date(event.eventDate);
    const maxTickets = getMaxTickets(event);
    const ticketsSold = event.ticketsSold || 0;

    if (eventDate < now) {
      return "Event Done";
    }
    if (maxTickets > 0 && ticketsSold >= maxTickets) {
      return "Ticket Full";
    }
    if (maxTickets > 0 && ticketsSold >= maxTickets * 0.75) {
      return "Almost Full";
    }
    return "On Sale";
  };

  // Update event data with status
  const updateEventDataWithStatus = (events) => {
    return events.map((event) => ({
      ...event,
      status: getEventStatus(event),
    }));
  };

  // Filter events based on search term and status
  const filteredEvents = eventData.filter((event) => {
    const eventStatus = getEventStatus(event);
    return (
      (status === "" || eventStatus === status) &&
      (searchTerm === "" || event.name.toLowerCase().includes(searchTerm))
    );
  });

  const totalPages = Math.ceil(filteredEvents.length / eventsPerPage);
  const startIndex = (currentPage - 1) * eventsPerPage;
  const endIndex = startIndex + eventsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Fetch vendor details
  useEffect(() => {
    const fetchVendorDetails = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/vendor/${vendorId}`
        );
        setVendorData(res.data);
      } catch (err) {
        console.error("Error fetching vendor data:", err);
      }
    };

    if (vendorId) {
      fetchVendorDetails();
    }
  }, [vendorId]);

  // Fetch event data and calculate metrics
  useEffect(() => {
    const fetchVendorEvents = async () => {
      try {
        const res = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/event/vendor/${vendorId}`
        );

        const events = res.data;
        setTotalEvents(events.length);

        const now = new Date();
        const active = events.filter(
          (event) => new Date(event.eventDate) > now
        ).length;
        setActiveEvents(active);

        let cumulativeTicketsSold = 0;
        let cumulativeGrossSales = 0;

        for (let i = 0; i < events.length; i++) {
          const eventId = events[i].eventId;
          try {
            const ticketsQuery = query(
              collection(db, "tickets"),
              where("eventId", "==", eventId)
            );

            const ticketSnapshots = await getDocs(ticketsQuery);

            let eventTicketCount = 0;
            let eventGrossSales = 0;

            ticketSnapshots.forEach((doc) => {
              const ticketData = doc.data();
              if (
                ticketData.ticketSummary &&
                Array.isArray(ticketData.ticketSummary)
              ) {
                ticketData.ticketSummary.forEach((summary) => {
                  const quantity = Number(summary.quantity) || 0;
                  eventTicketCount += quantity;
                  const price = Number(summary.price) || 0;
                  eventGrossSales += price * quantity;
                });
              }
            });

            events[i].ticketsSold = eventTicketCount;
            events[i].gross = eventGrossSales;

            cumulativeTicketsSold += eventTicketCount;
            cumulativeGrossSales += eventGrossSales;
          } catch (err) {
            console.error(`Error fetching tickets for event ${eventId}:`, err);
            events[i].ticketsSold = 0;
            events[i].gross = 0;
          }
        }

        // Update events with status
        const updatedEvents = updateEventDataWithStatus(events);
        setEventData(updatedEvents);
        setTicketsSold(cumulativeTicketsSold);
        setGrossSales(cumulativeGrossSales);
      } catch (err) {
        console.error("Error fetching event data:", err);
      }
    };

    if (vendorId) {
      fetchVendorEvents();
    }
  }, [vendorId]);

  const handleCreateEvent = () => {
    navigate(`/createevent/${vendorId}/step1`);
  };

  const handleEventClick = (eventData) => {
    navigate(`/eventdashboard/${eventData.eventId}`, { state: { eventData } });
  };

  const handleUpdateEvent = (e) => {
    e.stopPropagation();
    if (selectedEvent) {
      navigate(`/editevent/${vendorId}/${selectedEvent.eventId}`, {
        state: { eventData: selectedEvent },
      });
      handleClose();
    }
  };

  const [showSuccess, setShowSuccess] = useState(false);

  const handleDeleteEvent = async (e) => {
    e.stopPropagation();
    if (selectedEvent) {
      try {
        if (
          window.confirm(
            "Are you sure you want to delete this event? This action cannot be undone."
          )
        ) {
          await axios.delete(
            `${process.env.REACT_APP_API_BASE_URL}/api/event/${selectedEvent.eventId}`
          );
          setEventData((prevEvents) =>
            prevEvents.filter(
              (event) => event.eventId !== selectedEvent.eventId
            )
          );
          setTotalEvents((prevTotal) => prevTotal - 1);
          if (new Date(selectedEvent.eventDate) > new Date()) {
            setActiveEvents((prevActive) => prevActive - 1);
          }
          setTicketsSold(
            (prevSold) => prevSold - (selectedEvent.ticketsSold || 0)
          );
          setGrossSales((prevSales) => prevSales - (selectedEvent.gross || 0));
          setShowSuccess(true); // 👈 show snackbar
          handleClose();
        }
      } catch (err) {
        console.error("Error deleting event:", err);
        alert("Failed to delete event. Please try again.");
      }
    }
  };

  if (!vendorData) return <p>Loading vendor dashboard...</p>;

  return (
    <div>
      <Snackbar
        open={showSuccess}
        autoHideDuration={3000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setShowSuccess(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Event deleted successfully!
        </Alert>
      </Snackbar>

      <HeaderVendorLogged
        vendorId={vendorId}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <Box
          sx={{
            width: !isMobile?"90%":"95%",
            margin: "0 auto",
            height: "auto",
            mt: "4%",
            alignItems: "center",
            boxSizing: "border-box",
            backgroundColor: "#fff",
            padding: "2%",
            border: "none",
            display: !isMobile?"flex":"block",
            justifyContent: "space-between",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
            
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: !isMobile?"28px":"20px",
                fontWeight: "800",
                mb:isMobile?1:0,
              }}
            >
              Welcome back,{" "}
              {vendorData?.username || vendorData?.name || "Vendor"}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: !isMobile?"18px":"14px",
                fontWeight: "300",
                mb:isMobile?3:0,
              }}
            >
              Here's what's happening with your events today.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: "2%",width: !isMobile?"30%":"100%",mb:isMobile?2:0,justifyContent: isMobile?null:"flex-end", }}>
          <Box>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#19AEDC",
                color: "white",
                padding: !isMobile?"8px 16px":"4px 4px",
                fontWeight: "600",
                fontFamily: "Albert Sans",
                textTransform: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={handleCreateEvent}
            >
              <AddIcon sx={{ fontSize: "20px" }} /> Create Event
            </Button>
          </Box>
          {/* <Box>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#19AEDC",
                color: "white",
                padding: !isMobile?"8px 16px":"4px 8px",
                fontWeight: "600",
                fontFamily: "Albert Sans",
                textTransform: "none",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onClick={() =>
                navigate(`/vendorprofile/vendorscanner/${vendorId}`)
              }
            >
              Scan tickets
            </Button>
          </Box> */}
          </Box>
        </Box>
        
        {!isMobile && (
        <Box
          sx={{
            display: "flex",
            width: "90%",
            margin: "0 auto",
            mt: "2%",
            gap: "2%",
          }}
        >
          <Box
            sx={{
              boxSizing: "border-box",
              backgroundColor: "white",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              height: "auto",
              width: "24%",
              display: "flex",
              flexDirection: "column",
              padding: "1.5%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontFamily: "albert sans", fontSize: "17px" }}>
                Total Events
              </Typography>
              <EventIcon />
            </Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontSize: "28px",
                fontWeight: "700",
                mt: "2%",
              }}
            >
              {totalEvents}
            </Typography>
            <Box sx={{ display: "flex", mt: "2%", ml: "-1%", gap: "2%" }}>
              {eventsGrowth >= 0 ? (
                <ArrowUpwardIcon sx={{ color: "#10B981" }} />
              ) : (
                <ArrowDownwardIcon sx={{ color: "#EF4444" }} />
              )}
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontSize: "17px",
                  color: eventsGrowth >= 0 ? "#10B981" : "#EF4444",
                }}
              >
                {Math.abs(eventsGrowth)}% from last month
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              boxSizing: "border-box",
              backgroundColor: "white",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              height: "auto",
              width: "24%",
              display: "flex",
              flexDirection: "column",
              padding: "1.5%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontFamily: "albert sans", fontSize: "17px" }}>
                Tickets Sold
              </Typography>
              <ConfirmationNumberIcon />
            </Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontSize: "28px",
                fontWeight: "700",
                mt: "2%",
              }}
            >
              {ticketsSold.toLocaleString()}
            </Typography>
            <Box sx={{ display: "flex", mt: "2%", ml: "-1%", gap: "2%" }}>
              {ticketsGrowth >= 0 ? (
                <ArrowUpwardIcon sx={{ color: "#10B981" }} />
              ) : (
                <ArrowDownwardIcon sx={{ color: "#EF4444" }} />
              )}
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontSize: "17px",
                  color: ticketsGrowth >= 0 ? "#10B981" : "#EF4444",
                }}
              >
                {Math.abs(ticketsGrowth)}% from last month
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              boxSizing: "border-box",
              backgroundColor: "white",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              height: "auto",
              width: "24%",
              display: "flex",
              flexDirection: "column",
              padding: "1.5%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontFamily: "albert sans", fontSize: "17px" }}>
                Gross Sales
              </Typography>
              <CurrencyRupeeOutlinedIcon />
            </Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontSize: "28px",
                fontWeight: "700",
                mt: "2%",
              }}
            >
              ₹{grossSales.toLocaleString()}
            </Typography>
            <Box sx={{ display: "flex", mt: "2%", ml: "-1%", gap: "2%" }}>
              {salesGrowth >= 0 ? (
                <ArrowUpwardIcon sx={{ color: "#10B981" }} />
              ) : (
                <ArrowDownwardIcon sx={{ color: "#EF4444" }} />
              )}
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontSize: "17px",
                  color: salesGrowth >= 0 ? "#10B981" : "#EF4444",
                }}
              >
                {Math.abs(salesGrowth)}% from last month
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              boxSizing: "border-box",
              backgroundColor: "white",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              height: "auto",
              width: "24%",
              display: "flex",
              flexDirection: "column",
              padding: "1.5%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontFamily: "albert sans", fontSize: "17px" }}>
                Active Events
              </Typography>
              <CheckCircleIcon />
            </Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontSize: "28px",
                fontWeight: "700",
                mt: "2%",
              }}
            >
              {activeEvents}
            </Typography>
            <Box sx={{ display: "flex", mt: "2%", ml: "-1%", gap: "2%" }}>
              <Typography sx={{ fontFamily: "albert sans", fontSize: "17px" }}>
                Currently live
              </Typography>
            </Box>
          </Box>
        </Box>
        )}
        {isMobile && (
        <Box sx={{display:"block",width:"95%",margin:"0 auto",mt:"2%",p:1}}>
        <Box
          sx={{
            display: "flex",
            width: "100%",
            margin: "0 auto",
            mt: "2%",
            gap: "2%",
          }}
        >
          <Box
            sx={{
              boxSizing: "border-box",
              backgroundColor: "white",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              height: 120,
              width: "50%",
              display: "flex",
              flexDirection: "column",
              padding: "2%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontFamily: "albert sans", fontSize: "14px" }}>
                Total Events
              </Typography>
              <EventIcon sx={{fontSize: "20px"}} />
            </Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontSize: "24px",
                fontWeight: "700",
                mt: "2%",
              }}
            >
              {totalEvents}
            </Typography>
            <Box sx={{ display: "flex", mt: "2%", ml: "-1%", gap: "2%" }}>
              {eventsGrowth >= 0 ? (
                <ArrowUpwardIcon sx={{ color: "#10B981" ,fontSize: "20px"}} />
              ) : (
                <ArrowDownwardIcon sx={{ color: "#EF4444" ,fontSize: "20px"}} />
              )}
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontSize: "14px",
                  color: eventsGrowth >= 0 ? "#10B981" : "#EF4444",
                }}
              >
                {Math.abs(eventsGrowth)}% from last month
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              boxSizing: "border-box",
              backgroundColor: "white",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              height: 120,
              width: "50%",
              display: "flex",
              flexDirection: "column",
              padding: "2%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontFamily: "albert sans", fontSize: "14px" }}>
                Tickets Sold
              </Typography>
              <ConfirmationNumberIcon  sx={{fontSize: "20px"}}/>
            </Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontSize: "24px",
                fontWeight: "700",
                mt: "2%",
              }}
            >
              {ticketsSold.toLocaleString()}
            </Typography>
            <Box sx={{ display: "flex", mt: "2%", ml: "-1%", gap: "2%" }}>
              {ticketsGrowth >= 0 ? (
                <ArrowUpwardIcon sx={{ color: "#10B981" ,fontSize:20}} />
              ) : (
                <ArrowDownwardIcon sx={{ color: "#EF4444" ,fontSize:20 }} />
              )}
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontSize: "14px",
                  color: ticketsGrowth >= 0 ? "#10B981" : "#EF4444",
                }}
              >
                {Math.abs(ticketsGrowth)}% from last month
              </Typography>
            </Box>
          </Box>
          </Box>
          <Box
          sx={{
            display: "flex",
            width: "100%",
            margin: "0 auto",
            mt: "2%",
            gap: "2%",
          }}
        >
          <Box
            sx={{
              boxSizing: "border-box",
              backgroundColor: "white",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              height: 120,
              width: "50%",
              display: "flex",
              flexDirection: "column",
              padding: "2%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontFamily: "albert sans", fontSize: "14px" }}>
                Gross Sales
              </Typography>
              <CurrencyRupeeOutlinedIcon sx={{fontSize: "20px"}}/>
            </Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontSize: "24px",
                fontWeight: "700",
                mt: "2%",
              }}
            >
              ₹{grossSales.toLocaleString()}
            </Typography>
            <Box sx={{ display: "flex", mt: "2%", ml: "-1%", gap: "2%" }}>
              {salesGrowth >= 0 ? (
                <ArrowUpwardIcon sx={{ color: "#10B981"  ,fontSize: "20px"}} />
              ) : (
                <ArrowDownwardIcon sx={{ color: "#EF4444"  ,fontSize: "20px"}} />
              )}
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontSize: "14px",
                  color: salesGrowth >= 0 ? "#10B981" : "#EF4444",
                }}
              >
                {Math.abs(salesGrowth)}% from last month
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              boxSizing: "border-box",
              backgroundColor: "white",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "10px",
              height: 120,
              width: "50%",
              display: "flex",
              flexDirection: "column",
              padding: "2%",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography sx={{ fontFamily: "albert sans", fontSize: "14px" }}>
                Active Events
              </Typography>
              <CheckCircleIcon  sx={{fontSize: "20px"}} />
            </Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontSize: "24px",
                fontWeight: "700",
                mt: "2%",
              }}
            >
              {activeEvents}
            </Typography>
            <Box sx={{ display: "flex", mt: "2%", ml: "-1%", gap: "2%" }}>
              <Typography sx={{ fontFamily: "albert sans", fontSize: "14px" }}>
                Currently live
              </Typography>
            </Box>
          </Box>
        </Box>
        </Box>
        
        )}
        <Box
          sx={{
            display: "flex",
            width: isMobile?"95%":"90%",
            margin: "0 auto",
            mt: "2%",
            mb: "2%",
            borderRadius: "10px",
            flexDirection: "column",
            boxSizing: "border-box",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            height: "auto",
          }}
        >
          <Box
            sx={{
              display: isMobile?"block":"flex",
              justifyContent: "space-between",
              padding: isMobile?2:"2% 2% 1% 2%",
              width: isMobile?"90%":"96%",
              alignItems:isMobile?"center":null
            }}
          >
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: isMobile?"20px":"25px",
                fontWeight: "800",
                width:"40%",
               
                
              }}
            >
              Your Events
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "2%",
                width: isMobile?"95%":"70%",
                justifyContent: isMobile?"flex-start":"flex-end",
                mt:isMobile?1.5:0,
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                sx={{
                  border: "1px solid #aaa",
                  borderRadius: "10px",
                  padding: "1%",
                  width: "50%",
                  transition: "border-color 0.3s ease",
                  "&:focus-within": {
                    borderColor: "#19AEDC",
                  },
                }}
              >
                <SearchIcon sx={{ color: "gray", fontSize: "20px" }} />
                <InputBase
                  onChange={handleSearchChange}
                  placeholder="Search events"
                  sx={{
                    fontSize: 14,
                    width: "100%",
                    fontFamily: "Albert Sans",
                    ml: 1,
                  }}
                />
              </Box>
              <FormControl
                sx={{
                  width:isMobile?"30%": "20%",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "10px",
                    transition: "border-color 0.3s ease",
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#19AEDC",
                    },
                  },
                }}
              >
                <Select
                  value={status}
                  onChange={handleChange}
                  displayEmpty
                  sx={{
                    height: "45px",
                    fontSize: "14px",
                    "&:focus": {
                      backgroundColor: "transparent",
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All status</em>
                  </MenuItem>
                  <MenuItem value="On Sale" sx={{ fontFamily: "albert sans" }}>
                    On Sale
                  </MenuItem>
                  <MenuItem
                    value="Almost Full"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Almost Full
                  </MenuItem>
                  <MenuItem
                    value="Event Done"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Event Done
                  </MenuItem>
                  <MenuItem
                    value="Ticket Full"
                    sx={{ fontFamily: "albert sans" }}
                  >
                    Ticket Full
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
          {isMobile ? (
            // ------------------ MOBILE CARD VIEW ------------------
            <Box sx={{ width: "93%", backgroundColor: "rgba(248, 247, 250, 1)", padding: 2, margin: "0 auto" }}>
  {paginatedEvents.length > 0 ? (
    paginatedEvents.map((event, index) => (
      <Card
        key={event.eventId || index}
        
        sx={{
          marginBottom: 2,
          borderRadius: 2,
          boxShadow: 1,
          padding: 2,
          cursor: "pointer",
          "&:hover": { backgroundColor: "#F9FAFB" },
        }}
      >
        {/* Top: Title and Status */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 1 }} onClick={() => handleEventClick(event)}>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            {event.name}
          </Typography>
          <Box
            sx={{
              backgroundColor: "#D1FAE5",
              color: "#059669",
              fontWeight: "bold",
              fontSize: "14px",
              padding: "4px 12px",
              borderRadius: "999px",
            }}
            onClick={() => handleEventClick(event)}
          >
            {getEventStatus(event)}
          </Box>
        </Box>

        {/* Bottom: Event Details */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }} onClick={() => handleEventClick(event)}>
          <Box sx={{ display: "flex", justifyContent: "space-between" }} onClick={() => handleEventClick(event)}>
            <Typography sx={{ color: "#6B7280" }}>Date</Typography>
            <Typography>
              {event.eventDate
                ? new Date(event.eventDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : "N/A"}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ color: "#6B7280" }}>Tickets Sold</Typography>
            <Typography>
              {event.ticketsSold || 0}/{getMaxTickets(event)}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ color: "#6B7280" }}>Revenue</Typography>
            <Typography sx={{ color: "#059669", fontWeight: "bold" }}>
              ₹{(event.gross || 0).toLocaleString()}
            </Typography>
          </Box>
        </Box>
        

        {/* Optional Edit Button (Keep if needed) */}
        <Box sx={{ mt: 1 }} onClick={(e) => handleClick(e, event)}>
          <Typography
              sx={{
                        color: "#19AEDC",
                        cursor: "pointer",
                        "&:hover": { textDecoration: "underline" },
                      }}
                      onClick={(e) => handleClick(e, event)}
                    >
                      Edit
                    </Typography>
                    <Popover
                                open={
                                  Boolean(anchorEl) &&
                                  selectedEvent?.eventId === event.eventId
                                }
                                anchorEl={anchorEl}
                                onClose={handleClose}
                                anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    p: 1,
                                    minWidth: "150px",
                                    bgcolor: "white",
                                    borderRadius: "5px",
                                    boxShadow: 1,
                                  }}
                                >
                                  <MenuItem onClick={handleUpdateEvent}>
                                    Update Event
                                  </MenuItem>
                                  <MenuItem
                                    onClick={handleDeleteEvent}
                                    sx={{ color: "red" }}
                                  >
                                    Delete Event
                                  </MenuItem>
                                </Box>
                              </Popover>
        </Box>
      </Card>
    ))
  ) : (
    <Typography sx={{ textAlign: "center", padding: 3, color: "#6B7280", width: "90%", margin: "0 auto" }}>
      No events found. Create your first event to get started!
    </Typography>
  )}
</Box>

          ) : (
            <Box
                      sx={{
                        borderTop: "1px solid #dcdcdc",
                        backgroundColor: "rgba(248, 247, 250, 1)",
                        width: "100%",
                      }}
                    >
                      <Box sx={{ display: "flex", width: "96%", padding: "1% 2%" }}>
                        <Typography
                          sx={{
                            width: "40%",
                            fontFamily: "Albert Sans",
                            color: "#6B7280",
                            fontWeight: "600",
                          }}
                        >
                          Event Name
                        </Typography>
                        <Typography
                          sx={{
                            width: "12%",
                            fontWeight: "600",
                            fontFamily: "Albert Sans",
                            color: "#6B7280",
                            textAlign: "center",
                          }}
                        >
                          Date
                        </Typography>
                        <Typography
                          sx={{
                            width: "12%",
                            fontWeight: "600",
                            fontFamily: "Albert Sans",
                            color: "#6B7280",
                            textAlign: "center",
                          }}
                        >
                          Tickets Sold
                        </Typography>
                        <Typography
                          sx={{
                            width: "12%",
                            fontWeight: "600",
                            fontFamily: "Albert Sans",
                            color: "#6B7280",
                            textAlign: "center",
                          }}
                        >
                          Gross
                        </Typography>
                        <Typography
                          sx={{
                            width: "12%",
                            fontWeight: "600",
                            fontFamily: "Albert Sans",
                            color: "#6B7280",
                            textAlign: "center",
                          }}
                        >
                          Status
                        </Typography>
                        <Typography
                          sx={{
                            width: "12%",
                            fontWeight: "600",
                            fontFamily: "Albert Sans",
                            color: "#6B7280",
                            textAlign: "center",
                          }}
                        >
                          Actions
                        </Typography>
                      </Box>

                      {paginatedEvents.length > 0 ? (
                        paginatedEvents.map((event, index) => (
                          <Box
                            key={event.eventId || index}
                            onClick={() => handleEventClick(event)}
                            sx={{
                              display: "flex",
                              cursor: "pointer",
                              "&:hover": { backgroundColor: "#E5E7EB" },
                              alignItems: "center",
                              width: "96%",
                              padding: "1% 2%",
                              borderTop: "1px solid #dcdcdc",
                              backgroundColor: "white",
                            }}
                          >
                            <Box
                              sx={{ display: "flex", width: "40%", alignItems: "center" }}
                            >
                              <Box sx={{ ml: 0 }}>
                                <Typography sx={{ fontWeight: "600" }}>
                                  {event.name}
                                </Typography>
                                <Typography sx={{ fontSize: "14px", color: "gray" }}>
                                  {event.venueDetails?.area ||
                                    event.venueDetails?.venueName ||
                                    "Venue not specified"}
                                </Typography>
                              </Box>
                            </Box>

                            <Typography sx={{ width: "12%", textAlign: "center" }}>
                              {event.eventDate
                                ? new Date(event.eventDate).toLocaleString("en-IN", {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })
                                : "N/A"}
                            </Typography>

                            <Typography sx={{ width: "12%", textAlign: "center" }}>
                              {event.ticketsSold || 0}/{getMaxTickets(event)}
                            </Typography>

                            <Typography sx={{ width: "12%", textAlign: "center" }}>
                              ₹{(event.gross || 0).toLocaleString()}
                            </Typography>

                            <Box
                              sx={{
                                width: "12%",
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <Typography
                                sx={{
                                  backgroundColor:
                                    getEventStatus(event) === "On Sale"
                                      ? "#DBEAFE"
                                      : getEventStatus(event) === "Ticket Full"
                                      ? "#FEE2E2"
                                      : getEventStatus(event) === "Almost Full"
                                      ? "#FEF3C7"
                                      : "#F3F4F6",
                                  color:
                                    getEventStatus(event) === "On Sale"
                                      ? "#1E40AF"
                                      : getEventStatus(event) === "Ticket Full"
                                      ? "#991B1B"
                                      : getEventStatus(event) === "Almost Full"
                                      ? "#92400E"
                                      : "#4B5563",
                                  ml: 1,
                                  px: 2,
                                  py: 0.5,
                                  borderRadius: "10px",
                                  fontSize: "14px",
                                  fontWeight: "bold",
                                  textAlign: "center",
                                }}
                              >
                                {getEventStatus(event)}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                width: "12%",
                                display: "flex",
                                justifyContent: "center",
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Typography
                                sx={{
                                  color: "#19AEDC",
                                  cursor: "pointer",
                                  "&:hover": { textDecoration: "underline" },
                                }}
                                onClick={(e) => handleClick(e, event)}
                              >
                                Edit
                              </Typography>
                              <Popover
                                open={
                                  Boolean(anchorEl) &&
                                  selectedEvent?.eventId === event.eventId
                                }
                                anchorEl={anchorEl}
                                onClose={handleClose}
                                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                                transformOrigin={{ vertical: "top", horizontal: "right" }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    flexDirection: "column",
                                    p: 1,
                                    minWidth: "150px",
                                    bgcolor: "white",
                                    borderRadius: "5px",
                                    boxShadow: 1,
                                  }}
                                >
                                  <MenuItem onClick={handleUpdateEvent}>
                                    Update Event
                                  </MenuItem>
                                  <MenuItem
                                    onClick={handleDeleteEvent}
                                    sx={{ color: "red" }}
                                  >
                                    Delete Event
                                  </MenuItem>
                                </Box>
                              </Popover>
                            </Box>
                          </Box>
                        ))
                      ) : (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "3% 0",
                            borderTop: "1px solid #dcdcdc",
                            backgroundColor: "white",
                          }}
                        >
                          <Typography sx={{ color: "#6B7280" }}>
                            No events found. Create your first event to get started!
                          </Typography>
                        </Box>
                      )}
                    </Box>
          )}

{paginatedEvents.length > 0 && (
  <Box
    sx={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      mt: 2,
      padding: "1% 2%",
      width: "96%",
      margin: "0 auto",
      borderTop: "1px solid #dcdcdc",
    }}
  >
    <Typography sx={{ fontSize: "14px", color: "#6B7280" }}>
      Showing {startIndex + 1} to {Math.min(endIndex, filteredEvents.length)} of {filteredEvents.length} entries
    </Typography>
    <Box>
      <Button
        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        disabled={currentPage === 1}
        sx={{
          mr: 1,
          color: currentPage === 1 ? "#BDBDBD" : "#19AEDC",
          fontFamily: "albert sans",
          textTransform: "none",
          fontSize: "16px",
        }}
      >
        Previous
      </Button>
      <Button
        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        disabled={currentPage === totalPages}
        sx={{
          color: currentPage === totalPages ? "#BDBDBD" : "#19AEDC",
          fontFamily: "albert sans",
          textTransform: "none",
          fontSize: "16px",
        }}
      >
        Next
      </Button>
    </Box>
  </Box>
)}

         
          {/* {paginatedEvents.length > 0 && (
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mt: 2,
                padding: "1% 2%",
                width: "96%",
                margin: "0 auto",
                borderTop: "1px solid #dcdcdc",
              }}
            >
              <Typography sx={{ fontSize: "14px", color: "#6B7280" }}>
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, filteredEvents.length)} of{" "}
                {filteredEvents.length} entries
              </Typography>
              <Box>
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  sx={{
                    mr: 1,
                    color: currentPage === 1 ? "#BDBDBD" : "#19AEDC",
                    fontFamily: "albert sans",
                    textTransform: "none",
                    fontSize: "16px",
                  }}
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  sx={{
                    color: currentPage === totalPages ? "#BDBDBD" : "#19AEDC",
                    fontFamily: "albert sans",
                    textTransform: "none",
                    fontSize: "16px",
                  }}
                >
                  Next
                </Button>
              </Box>
            </Box>
          )} */}
        </Box>
      </Box>
    </div>
  );
};

export default VendorHome;
