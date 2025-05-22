import { React, useEffect, useState } from "react";
import VendorBeforeLogin from "../Header/VendorBeforeLogin";
import {
  Box,
  Typography,
  InputBase,
  Popover,
  Button,
  MenuItem,
  FormControl,
  Select,
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
import { db } from "../../firebase_config";

const VendorHome = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();

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

  const eventsPerPage = 8;

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
    return events.map(event => ({
      ...event,
      status: getEventStatus(event)
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
          `http://localhost:8080/api/vendor/${vendorId}`
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
          `http://localhost:8080/api/event/vendor/${vendorId}`
        );

        const events = res.data;
        setTotalEvents(events.length);

        const now = new Date();
        const active = events.filter(event => new Date(event.eventDate) > now).length;
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

            ticketSnapshots.forEach(doc => {
              const ticketData = doc.data();
              if (ticketData.ticketSummary && Array.isArray(ticketData.ticketSummary)) {
                ticketData.ticketSummary.forEach(summary => {
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
      navigate(`/editevent/${vendorId}/${selectedEvent.eventId}`, { state: { eventData: selectedEvent } });
      handleClose();
    }
  };

  const handleDeleteEvent = async (e) => {
    e.stopPropagation();
    if (selectedEvent) {
      try {
        if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
          await axios.delete(`http://localhost:8080/api/event/${selectedEvent.eventId}`);
          setEventData(prevEvents => prevEvents.filter(event => event.eventId !== selectedEvent.eventId));
          setTotalEvents(prevTotal => prevTotal - 1);
          if (new Date(selectedEvent.eventDate) > new Date()) {
            setActiveEvents(prevActive => prevActive - 1);
          }
          setTicketsSold(prevSold => prevSold - (selectedEvent.ticketsSold || 0));
          setGrossSales(prevSales => prevSales - (selectedEvent.gross || 0));
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
      <VendorBeforeLogin />
      <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <Box
          sx={{
            width: "90%",
            margin: "0 auto",
            height: "auto",
            mt: "4%",
            alignItems: "center",
            boxSizing: "border-box",
            backgroundColor: "white",
            padding: "2%",
            border: "none",
            display: "flex",
            justifyContent: "space-between",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            borderRadius: "10px",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: "28px",
                fontWeight: "800",
              }}
            >
              Welcome back,{" "}
              {vendorData?.username || vendorData?.name || "Vendor"}
            </Typography>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: "18px",
                fontWeight: "300",
              }}
            >
              Here's what's happening with your events today.
            </Typography>
          </Box>
          <Box>
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#19AEDC",
                color: "white",
                padding: "8px 16px",
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
        </Box>

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

        <Box
          sx={{
            display: "flex",
            width: "90%",
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
              display: "flex",
              justifyContent: "space-between",
              padding: "2% 2% 1% 2%",
              width: "96%",
            }}
          >
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontSize: "25px",
                fontWeight: "800",
                width: "40%",
              }}
            >
              Your Events
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: "2%",
                width: "60%",
                justifyContent: "flex-end",
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
                  width: "20%",
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
                        {event.venueDetails?.area || event.venueDetails?.venueName || "Venue not specified"}
                      </Typography>
                    </Box>
                  </Box>

                  <Typography sx={{ width: "12%", textAlign: "center" }}>
                    {event.eventDate ? new Date(event.eventDate).toLocaleString("en-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }) : "N/A"}
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
                          getEventStatus(event) === "On Sale" ? "#DBEAFE" :
                          getEventStatus(event) === "Ticket Full" ? "#FEE2E2" :
                          getEventStatus(event) === "Almost Full" ? "#FEF3C7" :
                          "#F3F4F6",
                        color:
                          getEventStatus(event) === "On Sale" ? "#1E40AF" :
                          getEventStatus(event) === "Ticket Full" ? "#991B1B" :
                          getEventStatus(event) === "Almost Full" ? "#92400E" :
                          "#4B5563",
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
                      open={Boolean(anchorEl) && selectedEvent?.eventId === event.eventId}
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
                        <MenuItem onClick={handleDeleteEvent} sx={{ color: "red" }}>
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
                Showing {startIndex + 1} to {Math.min(endIndex, filteredEvents.length)}{" "}
                of {filteredEvents.length} entries
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
          )}
        </Box>
      </Box>
    </div>
  );
};

export default VendorHome;