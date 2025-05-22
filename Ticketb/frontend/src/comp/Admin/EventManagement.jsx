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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";

const sidebarItems = [
  { name: "Dashboard", icon: <TrendingUpIcon />, active: false, path: "/admin/dashboardupcoming" },
  { name: "Users", icon: <GroupIcon />, active: false, path: "/admin/userpage" },
  { name: "Posts", icon: <ArticleIcon />, active: false, path: "/admin/postpage" },
  { name: "Login Settings", icon: <SettingsIcon />, active: false, path: "/admin/loginsettings" },
  { name: "Contact", icon: <ContactPageIcon />, active: false, path: "/admin/contactpage" },
  { name: "Events", icon: <EventIcon />, active: true, path: "/admin/eventmanagement" },
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
    status: "Current",
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
    status: "Upcoming",
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
    status: "Current",
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
    status: "Past",
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
    status: "Past",
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
    status: "Upcoming",
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
    status: "Current",
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
    status: "Upcoming",
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
    status: "Current",
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
    status: "Past",
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
    status: "Past",
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
    status: "Upcoming",
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
    status: "Current",
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
    status: "Upcoming",
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
    status: "Current",
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
    status: "Past",
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
    status: "Past",
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
    status: "Upcoming",
  },
];

const statusColors = {
  Current: "#C6F6D5",
  "Upcoming": "#FEF3C7",
  "Past": "#FECACA",
};

const EventManagement = () => {
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const filteredEvents = recentEvents.filter(
    (event) => statusFilter === "All Status" || event.status === statusFilter
  );

  const totalPages = Math.ceil(filteredEvents.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentEvents = filteredEvents.slice(startIndex, startIndex + usersPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const getPaginationRange = () => {
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + 2);
    if (end - start < 2) {
      start = Math.max(1, end - 2);
    }
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

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
          <Typography variant="h5" fontWeight="bold" mb={9}>Event Management</Typography>

          <Card mt={5}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}  sx={{ paddingX: 2 }}>
                <Typography variant="h6" fontWeight="bold">Total Events</Typography>
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
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <MenuItem value="All Status">All Status</MenuItem>
                    {Object.keys(statusColors).map((status) => (
                      <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                  </Select>
                </Box>
              </Box>

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
                    {currentEvents.map((event, index) => (
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

              <Box display="flex" justifyContent="space-between" alignItems="center" mt={3} px={2}>
                <Typography variant="body2">
                  Showing {startIndex + 1} to {Math.min(startIndex + usersPerPage, filteredEvents.length)} of {filteredEvents.length}
                </Typography>
                <Box display="flex" gap={1}>
                  <Button variant="outlined" disabled={currentPage === 1} onClick={handlePrevPage} sx={{ borderColor: "#42A5F5", color: "#42A5F5" }}>Previous</Button>
                  {getPaginationRange().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "contained" : "outlined"}
                      sx={{
                        minWidth: 40,
                        borderColor: "#42A5F5",
                        backgroundColor: pageNum === currentPage ? "#42A5F5" : "white",
                        color: pageNum === currentPage ? "white" : "#42A5F5",
                        fontWeight: "bold",
                      }}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  <Button variant="outlined" disabled={currentPage === totalPages} onClick={handleNextPage} sx={{ borderColor: "#42A5F5", color: "#42A5F5" }}>Next</Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default EventManagement;
