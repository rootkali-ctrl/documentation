import React, { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  MenuItem,
  Select,
  IconButton,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const sidebarItems = [
  { name: "Dashboard", icon: <TrendingUpIcon />, active: true, path: "/admin/dashboardupcoming" },
  { name: "Users", icon: <GroupIcon />, active: false, path: "/admin/userpage" },
  { name: "Posts", icon: <ArticleIcon />, active: false, path: "/admin/postpage" },
  { name: "Login Settings", icon: <SettingsIcon />, active: false, path: "/admin/loginsettings" },
  { name: "Contact", icon: <ContactPageIcon />, active: false, path: "/admin/contactpage" },
  { name: "Events", icon: <EventIcon />, active: false, path: "/admin/eventmanagement" },
];


const upcomingEvents = [
  {
    name: "Summer Music Festival",
    bookingStart: "Mar 15, 2025",
    eventDate: "Apr 20, 2025",
    capacity: "5000",
  },
  {
    name: "Tech Conference 2025",
    bookingStart: "Apr 1, 2025",
    eventDate: "May 15, 2025",
    capacity: "2000",
  },
  {
    name: "Food & Wine Festival",
    bookingStart: "May 1, 2025",
    eventDate: "Jun 10, 2025",
    capacity: "3000",
  },
  {
     name: "Summer Music Festival",
     bookingStart: "Mar 15, 2025",
     eventDate: "Apr 20, 2025",
     capacity: "5000",
   },
   {
     name: "Tech Conference 2025",
     bookingStart: "Apr 1, 2025",
     eventDate: "May 15, 2025",
     capacity: "2000",
   },
   {
     name: "Food & Wine Festival",
     bookingStart: "May 1, 2025",
     eventDate: "Jun 10, 2025",
     capacity: "3000",
   },
   {
     name: "Summer Music Festival",
     bookingStart: "Mar 15, 2025",
     eventDate: "Apr 20, 2025",
     capacity: "5000",
   },
   {
     name: "Tech Conference 2025",
     bookingStart: "Apr 1, 2025",
     eventDate: "May 15, 2025",
     capacity: "2000",
   },
   {
     name: "Food & Wine Festival",
     bookingStart: "May 1, 2025",
     eventDate: "Jun 10, 2025",
     capacity: "3000",
   },

    {
    name: "Summer Music Festival",
    bookingStart: "Mar 15, 2025",
    eventDate: "Apr 20, 2025",
    capacity: "5000",
  },
  {
    name: "Tech Conference 2025",
    bookingStart: "Apr 1, 2025",
    eventDate: "May 15, 2025",
    capacity: "2000",
  },
  {
    name: "Food & Wine Festival",
    bookingStart: "May 1, 2025",
    eventDate: "Jun 10, 2025",
    capacity: "3000",
  },
  {
     name: "Summer Music Festival",
     bookingStart: "Mar 15, 2025",
     eventDate: "Apr 20, 2025",
     capacity: "5000",
   },
   {
     name: "Tech Conference 2025",
     bookingStart: "Apr 1, 2025",
     eventDate: "May 15, 2025",
     capacity: "2000",
   },
   {
     name: "Food & Wine Festival",
     bookingStart: "May 1, 2025",
     eventDate: "Jun 10, 2025",
     capacity: "3000",
   },
   {
      name: "Summer Music Festival",
      bookingStart: "Mar 15, 2025",
      eventDate: "Apr 20, 2025",
      capacity: "5000",
    },
    {
      name: "Tech Conference 2025",
      bookingStart: "Apr 1, 2025",
      eventDate: "May 15, 2025",
      capacity: "2000",
    },
    {
      name: "Food & Wine Festival",
      bookingStart: "May 1, 2025",
      eventDate: "Jun 10, 2025",
      capacity: "3000",
    },
    {
      name: "Summer Music Festival",
      bookingStart: "Mar 15, 2025",
      eventDate: "Apr 20, 2025",
      capacity: "5000",
    },
    {
      name: "Tech Conference 2025",
      bookingStart: "Apr 1, 2025",
      eventDate: "May 15, 2025",
      capacity: "2000",
    },
    {
      name: "Food & Wine Festival",
      bookingStart: "May 1, 2025",
      eventDate: "Jun 10, 2025",
      capacity: "3000",
    },
 
     {
     name: "Summer Music Festival",
     bookingStart: "Mar 15, 2025",
     eventDate: "Apr 20, 2025",
     capacity: "5000",
   },
   {
     name: "Tech Conference 2025",
     bookingStart: "Apr 1, 2025",
     eventDate: "May 15, 2025",
     capacity: "2000",
   },
   {
     name: "Food & Wine Festival",
     bookingStart: "May 1, 2025",
     eventDate: "Jun 10, 2025",
     capacity: "3000",
   },
   {
     name: "Summer Music Festival",
     bookingStart: "Mar 15, 2025",
     eventDate: "Apr 20, 2025",
     capacity: "5000",
   },
   {
     name: "Tech Conference 2025",
     bookingStart: "Apr 1, 2025",
     eventDate: "May 15, 2025",
     capacity: "2000",
   },
   {
     name: "Food & Wine Festival",
     bookingStart: "May 1, 2025",
     eventDate: "Jun 10, 2025",
     capacity: "3000",
   },
   {
      name: "Summer Music Festival",
      bookingStart: "Mar 15, 2025",
      eventDate: "Apr 20, 2025",
      capacity: "5000",
    },
    {
      name: "Tech Conference 2025",
      bookingStart: "Apr 1, 2025",
      eventDate: "May 15, 2025",
      capacity: "2000",
    },
    {
      name: "Food & Wine Festival",
      bookingStart: "May 1, 2025",
      eventDate: "Jun 10, 2025",
      capacity: "3000",
    },
    {
      name: "Summer Music Festival",
      bookingStart: "Mar 15, 2025",
      eventDate: "Apr 20, 2025",
      capacity: "5000",
    },
    {
      name: "Tech Conference 2025",
      bookingStart: "Apr 1, 2025",
      eventDate: "May 15, 2025",
      capacity: "2000",
    },
    {
      name: "Food & Wine Festival",
      bookingStart: "May 1, 2025",
      eventDate: "Jun 10, 2025",
      capacity: "3000",
    },
 
     {
     name: "Summer Music Festival",
     bookingStart: "Mar 15, 2025",
     eventDate: "Apr 20, 2025",
     capacity: "5000",
   },
   {
     name: "Tech Conference 2025",
     bookingStart: "Apr 1, 2025",
     eventDate: "May 15, 2025",
     capacity: "2000",
   },
   {
     name: "Food & Wine Festival",
     bookingStart: "May 1, 2025",
     eventDate: "Jun 10, 2025",
     capacity: "3000",
   },
   {
     name: "Summer Music Festival",
     bookingStart: "Mar 15, 2025",
     eventDate: "Apr 20, 2025",
     capacity: "5000",
   },
   {
     name: "Tech Conference 2025",
     bookingStart: "Apr 1, 2025",
     eventDate: "May 15, 2025",
     capacity: "2000",
   },
   {
     name: "Food & Wine Festival",
     bookingStart: "May 1, 2025",
     eventDate: "Jun 10, 2025",
     capacity: "3000",
   },
   {
      name: "Summer Music Festival",
      bookingStart: "Mar 15, 2025",
      eventDate: "Apr 20, 2025",
      capacity: "5000",
    },
    {
      name: "Tech Conference 2025",
      bookingStart: "Apr 1, 2025",
      eventDate: "May 15, 2025",
      capacity: "2000",
    },
    {
      name: "Food & Wine Festival",
      bookingStart: "May 1, 2025",
      eventDate: "Jun 10, 2025",
      capacity: "3000",
    },
    {
      name: "Summer Music Festival",
      bookingStart: "Mar 15, 2025",
      eventDate: "Apr 20, 2025",
      capacity: "5000",
    },
    {
      name: "Tech Conference 2025",
      bookingStart: "Apr 1, 2025",
      eventDate: "May 15, 2025",
      capacity: "2000",
    },
    {
      name: "Food & Wine Festival",
      bookingStart: "May 1, 2025",
      eventDate: "Jun 10, 2025",
      capacity: "3000",
    },
 
     {
     name: "Summer Music Festival",
     bookingStart: "Mar 15, 2025",
     eventDate: "Apr 20, 2025",
     capacity: "5000",
   },
   {
     name: "Tech Conference 2025",
     bookingStart: "Apr 1, 2025",
     eventDate: "May 15, 2025",
     capacity: "2000",
   },
   {
     name: "Food & Wine Festival",
     bookingStart: "May 1, 2025",
     eventDate: "Jun 10, 2025",
     capacity: "3000",
   },

  
];

const recentEvents = [
  {
    name: "Summer Music Festival",
    location: "Los Angeles, CA",
    date: "Aug 15, 2025",
    bookingStart: "Jan 10, 2025",
    bookingEnd: "June 10, 2025",
    ticketsSold: 450,
    capacity: 500,
    gross: 22500,
    status: "Active",
  },
  {
    name: "Tech Conference 2025",
    location: "San Francisco, CA",
    date: "Sep 20, 2025",
    bookingStart: "Jan 10, 2025",
    bookingEnd: "June 10, 2025",
    ticketsSold: 280,
    capacity: 300,
    gross: 14000,
    status: "Almost Full",
  },
  {
    name: "Wedding Expo",
    location: "Miami, FL",
    date: "Oct 5, 2025",
    bookingStart: "Jan 10, 2025",
    bookingEnd: "June 10, 2025",
    ticketsSold: 150,
    capacity: 600,
    gross: 7500,
    status: "On Sale",
  },
  {
    name: "Wedding Expo",
    location: "Miami, FL",
    date: "Oct 5, 2025",
    bookingStart: "Jan 10, 2025",
    bookingEnd: "June 10, 2025",
    ticketsSold: 150,
    capacity: 600,
    gross: 7500,
    status: "Ticket Full",
  },
  {
     name: "Summer Music Festival",
     location: "Los Angeles, CA",
     date: "Aug 15, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 450,
     capacity: 500,
     gross: 22500,
     status: "Active",
   },
   {
     name: "Tech Conference 2025",
     location: "San Francisco, CA",
     date: "Sep 20, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 280,
     capacity: 300,
     gross: 14000,
     status: "Almost Full",
   },
   {
     name: "Wedding Expo",
     location: "Miami, FL",
     date: "Oct 5, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 150,
     capacity: 600,
     gross: 7500,
     status: "On Sale",
   },
   {
     name: "Wedding Expo",
     location: "Miami, FL",
     date: "Oct 5, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 150,
     capacity: 600,
     gross: 7500,
     status: "Ticket Full",
   },
   {
     name: "Summer Music Festival",
     location: "Los Angeles, CA",
     date: "Aug 15, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 450,
     capacity: 500,
     gross: 22500,
     status: "Active",
   },
   {
     name: "Tech Conference 2025",
     location: "San Francisco, CA",
     date: "Sep 20, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 280,
     capacity: 300,
     gross: 14000,
     status: "Almost Full",
   },
   {
     name: "Wedding Expo",
     location: "Miami, FL",
     date: "Oct 5, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 150,
     capacity: 600,
     gross: 7500,
     status: "On Sale",
   },
   {
     name: "Wedding Expo",
     location: "Miami, FL",
     date: "Oct 5, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 150,
     capacity: 600,
     gross: 7500,
     status: "Ticket Full",
   },
   {
     name: "Summer Music Festival",
     location: "Los Angeles, CA",
     date: "Aug 15, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 450,
     capacity: 500,
     gross: 22500,
     status: "Active",
   },
   {
     name: "Tech Conference 2025",
     location: "San Francisco, CA",
     date: "Sep 20, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 280,
     capacity: 300,
     gross: 14000,
     status: "Almost Full",
   },
   {
     name: "Wedding Expo",
     location: "Miami, FL",
     date: "Oct 5, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 150,
     capacity: 600,
     gross: 7500,
     status: "On Sale",
   },
   {
     name: "Wedding Expo",
     location: "Miami, FL",
     date: "Oct 5, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 150,
     capacity: 600,
     gross: 7500,
     status: "Ticket Full",
   },
   {
     name: "Summer Music Festival",
     location: "Los Angeles, CA",
     date: "Aug 15, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 450,
     capacity: 500,
     gross: 22500,
     status: "Active",
   },
   {
     name: "Tech Conference 2025",
     location: "San Francisco, CA",
     date: "Sep 20, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 280,
     capacity: 300,
     gross: 14000,
     status: "Almost Full",
   },
   {
     name: "Wedding Expo",
     location: "Miami, FL",
     date: "Oct 5, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 150,
     capacity: 600,
     gross: 7500,
     status: "On Sale",
   },
   {
     name: "Wedding Expo",
     location: "Miami, FL",
     date: "Oct 5, 2025",
     bookingStart: "Jan 10, 2025",
     bookingEnd: "June 10, 2025",
     ticketsSold: 150,
     capacity: 600,
     gross: 7500,
     status: "Ticket Full",
   },
   {
      name: "Summer Music Festival",
      location: "Los Angeles, CA",
      date: "Aug 15, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 450,
      capacity: 500,
      gross: 22500,
      status: "Active",
    },
    {
      name: "Tech Conference 2025",
      location: "San Francisco, CA",
      date: "Sep 20, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 280,
      capacity: 300,
      gross: 14000,
      status: "Almost Full",
    },
    {
      name: "Wedding Expo",
      location: "Miami, FL",
      date: "Oct 5, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 150,
      capacity: 600,
      gross: 7500,
      status: "On Sale",
    },
    {
      name: "Wedding Expo",
      location: "Miami, FL",
      date: "Oct 5, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 150,
      capacity: 600,
      gross: 7500,
      status: "Ticket Full",
    },
    {
      name: "Summer Music Festival",
      location: "Los Angeles, CA",
      date: "Aug 15, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 450,
      capacity: 500,
      gross: 22500,
      status: "Active",
    },
    {
      name: "Tech Conference 2025",
      location: "San Francisco, CA",
      date: "Sep 20, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 280,
      capacity: 300,
      gross: 14000,
      status: "Almost Full",
    },
    {
      name: "Wedding Expo",
      location: "Miami, FL",
      date: "Oct 5, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 150,
      capacity: 600,
      gross: 7500,
      status: "On Sale",
    },
    {
      name: "Wedding Expo",
      location: "Miami, FL",
      date: "Oct 5, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 150,
      capacity: 600,
      gross: 7500,
      status: "Ticket Full",
    },
    {
      name: "Summer Music Festival",
      location: "Los Angeles, CA",
      date: "Aug 15, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 450,
      capacity: 500,
      gross: 22500,
      status: "Active",
    },
    {
      name: "Tech Conference 2025",
      location: "San Francisco, CA",
      date: "Sep 20, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 280,
      capacity: 300,
      gross: 14000,
      status: "Almost Full",
    },
    {
      name: "Wedding Expo",
      location: "Miami, FL",
      date: "Oct 5, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 150,
      capacity: 600,
      gross: 7500,
      status: "On Sale",
    },
    {
      name: "Wedding Expo",
      location: "Miami, FL",
      date: "Oct 5, 2025",
      bookingStart: "Jan 10, 2025",
      bookingEnd: "June 10, 2025",
      ticketsSold: 150,
      capacity: 600,
      gross: 7500,
      status: "Ticket Full",
    },
];

const statusColors = {
  Active: "#C6F6D5",
  "Almost Full": "#FEF3C7",
  "On Sale": "#E0E7FF",
  "Ticket Full": "#FECACA",
};

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const eventsToDisplay = activeTab === "upcoming" ? upcomingEvents : recentEvents;

  const filteredEvents = recentEvents.filter(
    (event) => statusFilter === "All Status" || event.status === statusFilter
  );

  return (
    <Box height="100vh" display="flex" flexDirection="column" bgcolor="#faf9fb">
      <Box height={89} display="flex" justifyContent="space-between" alignItems="center" px={5} py={2} borderBottom="1px solid #ddd" bgcolor="#f9fafb">
        <Typography variant="h4">
          <Box component="span" fontWeight="bold" color="#19aedc">ticketb</Box>
          <Box component="span" fontWeight="bold" color="black"> admin</Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>Last login at 7th Oct 2025 13:00</Typography>
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
            onClick={() => window.location.href = item.path}
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

        <Box flex={1} px={5} py={4} overflow="auto" maxHeight="calc(100vh - 89px)">
          <Typography variant="h5" fontWeight="bold" mb={4}>Dashboard Overview</Typography>

          <Box display="flex" mb={6} justifyContent="center" gap={10}>
            <Button
              variant={activeTab === "upcoming" ? "contained" : "outlined"}
              sx={{ bgcolor: activeTab === "upcoming" ? "#19aedc" : "#D1D5DB", color: activeTab === "upcoming" ? "white" : "#4B5563", textTransform: "none",border:"none", padding: 1.5 }}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming Events
            </Button>
            <Button
              variant={activeTab === "recent" ? "contained" : "outlined"}
              sx={{ bgcolor: activeTab === "recent" ? "#19aedc" : "#D1D5DB", color: activeTab === "recent" ? "white" : "#4B5563", textTransform: "none", border:"none",padding: 1.5 }}
              onClick={() => setActiveTab("recent")}
            >
              Recent Events
            </Button>
          </Box>

          {activeTab === "recent" && (
            <Card sx={{height:"auto"}}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ paddingX: 2 }}>
                  <Typography variant="h6" fontWeight="bold">Your Events</Typography>
                  <Box display="flex" gap={2}>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Search events..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Select
                      size="small"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <MenuItem value="All Status">All Status</MenuItem>
                      {Object.keys(statusColors).map((status) => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                      ))}
                    </Select>
                  </Box>
                </Box>

                <Box>
                  <TableContainer component={Paper} elevation={0}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Event Name</TableCell>
                          <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Date</TableCell>
                          <TableCell sx={{ backgroundColor: "#f1f1f1" }}>BOOKING START</TableCell>
                          <TableCell sx={{ backgroundColor: "#f1f1f1" }}>BOOKING END</TableCell>
                          <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Tickets Sold</TableCell>
                          <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Gross</TableCell>
                          <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredEvents.map((event, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Typography fontWeight="bold">{event.name}</Typography>
                              <Typography fontSize={12} color="textSecondary">{event.location}</Typography>
                            </TableCell>
                            <TableCell>{event.date}</TableCell>
                            <TableCell>{event.bookingStart}</TableCell>
                            <TableCell>{event.bookingEnd}</TableCell>
                            <TableCell>{`${event.ticketsSold}/${event.capacity}`}</TableCell>
                            <TableCell>${event.gross.toLocaleString()}</TableCell>
                            <TableCell>
                              <Box
                                px={1.5}
                                py={0.5}
                                borderRadius={4}
                                bgcolor={statusColors[event.status] || "#E5E7EB"}
                                display="inline-block"
                              >
                                <Typography fontSize={12}>{event.status}</Typography>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeTab === "upcoming" && (
            <Card x={{height:500}}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} sx={{ paddingX: 2 }}>
                  <Typography variant="h6" fontWeight="bold">Your Events</Typography>
                  <Box display="flex" gap={2}>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Search events..."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Box>

                <TableContainer component={Paper} elevation={0}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Event Name</TableCell>
                        <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Booking Start</TableCell>
                        <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Event Date</TableCell>
                        <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Total Capacity</TableCell>
                        <TableCell sx={{ backgroundColor: "#f1f1f1" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {eventsToDisplay.map((event, index) => (
                        <TableRow key={index}>
                          <TableCell>{event.name}</TableCell>
                          <TableCell>{event.bookingStart}</TableCell>
                          <TableCell>{event.eventDate}</TableCell>
                          <TableCell>{event.capacity}</TableCell>
                          <TableCell>
                            <IconButton size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <DeleteIcon fontSize="small" color="error" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
