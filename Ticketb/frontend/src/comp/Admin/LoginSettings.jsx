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
  Avatar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";

// Sidebar items
const sidebarItems = [
  { name: "Dashboard", icon: <TrendingUpIcon />, active: false, path: "/admin/dashboardupcoming" },
  { name: "Users", icon: <GroupIcon />, active: false, path: "/admin/userpage" },
  { name: "Posts", icon: <ArticleIcon />, active: false, path: "/admin/postpage" },
  { name: "Login Settings", icon: <SettingsIcon />, active: true, path: "/admin/loginsettings" },
  { name: "Contact", icon: <ContactPageIcon />, active: false, path: "/admin/contactpage" },
  { name: "Events", icon: <EventIcon />, active: false, path: "/admin/eventmanagement" },
];

// Sample vendor data
const vendorData = [
  {
    image: "https://randomuser.me/api/portraits/men/46.jpg",
    name: "John Cooper",
    email: "john.cooper@email.com",
    phone: "+1 (555) 123-4567",
    accountcreated: "Jan 15, 2025",
    lastlogin: "2 hours ago",
    status: "Active",
  },
  {
    image: "https://randomuser.me/api/portraits/women/47.jpg",
    name: "Sarah Wilson",
    email: "sarah.w@email.com",
    phone: "+1 (555) 987-6543",
    accountcreated: "Feb 3, 2025",
    lastlogin: "1 day ago",
    status: "Active",
  },
  {
    image: "https://randomuser.me/api/portraits/men/48.jpg",
    name: "Mike Johnson",
    email: "mike.j@email.com",
    phone: "+1 (555) 234-5678",
    accountcreated: "Mar 20, 2025",
    lastlogin: "5 days ago",
    status: "Pending",
  },
  {
    image: "https://randomuser.me/api/portraits/women/49.jpg",
    name: "Emma Davis",
    email: "emma.d@email.com",
    phone: "+1 (555) 345-6789",
    accountcreated: "Apr 5, 2025",
    lastlogin: "1 week ago",
    status: "Inactive",
  },
  {
     image: "https://randomuser.me/api/portraits/men/46.jpg",
     name: "John Cooper",
     email: "john.cooper@email.com",
     phone: "+1 (555) 123-4567",
     accountcreated: "Jan 15, 2025",
     lastlogin: "2 hours ago",
     status: "Active",
   },
   {
     image: "https://randomuser.me/api/portraits/women/47.jpg",
     name: "Sarah Wilson",
     email: "sarah.w@email.com",
     phone: "+1 (555) 987-6543",
     accountcreated: "Feb 3, 2025",
     lastlogin: "1 day ago",
     status: "Active",
   },
   {
     image: "https://randomuser.me/api/portraits/men/48.jpg",
     name: "Mike Johnson",
     email: "mike.j@email.com",
     phone: "+1 (555) 234-5678",
     accountcreated: "Mar 20, 2025",
     lastlogin: "5 days ago",
     status: "Pending",
   },
   {
     image: "https://randomuser.me/api/portraits/women/49.jpg",
     name: "Emma Davis",
     email: "emma.d@email.com",
     phone: "+1 (555) 345-6789",
     accountcreated: "Apr 5, 2025",
     lastlogin: "1 week ago",
     status: "Inactive",
   },
   {
     image: "https://randomuser.me/api/portraits/men/46.jpg",
     name: "John Cooper",
     email: "john.cooper@email.com",
     phone: "+1 (555) 123-4567",
     accountcreated: "Jan 15, 2025",
     lastlogin: "2 hours ago",
     status: "Active",
   },
   {
     image: "https://randomuser.me/api/portraits/women/47.jpg",
     name: "Sarah Wilson",
     email: "sarah.w@email.com",
     phone: "+1 (555) 987-6543",
     accountcreated: "Feb 3, 2025",
     lastlogin: "1 day ago",
     status: "Active",
   },
   {
     image: "https://randomuser.me/api/portraits/men/48.jpg",
     name: "Mike Johnson",
     email: "mike.j@email.com",
     phone: "+1 (555) 234-5678",
     accountcreated: "Mar 20, 2025",
     lastlogin: "5 days ago",
     status: "Pending",
   },
   {
     image: "https://randomuser.me/api/portraits/women/49.jpg",
     name: "Emma Davis",
     email: "emma.d@email.com",
     phone: "+1 (555) 345-6789",
     accountcreated: "Apr 5, 2025",
     lastlogin: "1 week ago",
     status: "Inactive",
   },
   {
     image: "https://randomuser.me/api/portraits/men/46.jpg",
     name: "John Cooper",
     email: "john.cooper@email.com",
     phone: "+1 (555) 123-4567",
     accountcreated: "Jan 15, 2025",
     lastlogin: "2 hours ago",
     status: "Active",
   },
   {
     image: "https://randomuser.me/api/portraits/women/47.jpg",
     name: "Sarah Wilson",
     email: "sarah.w@email.com",
     phone: "+1 (555) 987-6543",
     accountcreated: "Feb 3, 2025",
     lastlogin: "1 day ago",
     status: "Active",
   },
   {
     image: "https://randomuser.me/api/portraits/men/48.jpg",
     name: "Mike Johnson",
     email: "mike.j@email.com",
     phone: "+1 (555) 234-5678",
     accountcreated: "Mar 20, 2025",
     lastlogin: "5 days ago",
     status: "Pending",
   },
   {
     image: "https://randomuser.me/api/portraits/women/49.jpg",
     name: "Emma Davis",
     email: "emma.d@email.com",
     phone: "+1 (555) 345-6789",
     accountcreated: "Apr 5, 2025",
     lastlogin: "1 week ago",
     status: "Inactive",
   },
];

const statusColors = {
  Active: "#C6F6D5",
  Pending: "#FEF3C7",
  Inactive: "#FECACA",
};

const Loginsettings = () => {
  const toDisplay = vendorData;
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  const totalPages = Math.ceil(toDisplay.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = toDisplay.slice(startIndex, startIndex + usersPerPage);

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
            {" "}
            admin
          </Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>
          Last login at 7th Oct 2025 13:00
        </Typography>
      </Box>

      <Box display="flex" flex={1}>
        {/* Sidebar */}
        <Box
          width={276}
          flexShrink={0}
          bgcolor="#f9fafb"
          py={10}
          px={3}
          boxShadow={3}
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

        {/* Main Content */}
        <Box
          flex={1}
          px={5}
          py={4}
          overflow="auto"
          maxHeight="calc(100vh - 89px)"
        >
          <Typography variant="h5" fontWeight="bold" mb={4}>
            Login Settings
          </Typography>

          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
                sx={{ paddingX: 2 }}
              >
                <Box></Box>
                <Box display="flex" gap={2}>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search vendors..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    sx={{ bgcolor: "#19aedc", textTransform: "none" }}
                  >
                    + Add Vendor
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                        Vendor Name
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                        Email
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                        Phone
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                        Account Created
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                        Last Login
                      </TableCell>
                      <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                        Status
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar src={user.image} alt={user.name} />
                            {user.name}
                          </Box>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell>{user.accountcreated}</TableCell>
                        <TableCell>{user.lastlogin}</TableCell>
                        <TableCell>
                          <Box
                            bgcolor={statusColors[user.status]}
                            px={2}
                            py={0.5}
                            borderRadius={2}
                            width="fit-content"
                          >
                            {user.status}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={3}
                px={2}
              >
                <Typography variant="body2">
                  Showing {startIndex + 1} to{" "}
                  {Math.min(startIndex + usersPerPage, toDisplay.length)} of{" "}
                  {toDisplay.length} entries
                </Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    disabled={currentPage === 1}
                    onClick={handlePrevPage}
                    sx={{ borderColor: "#42A5F5", color: "#42A5F5" }}
                  >
                    Previous
                  </Button>
                  {getPaginationRange().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={
                        pageNum === currentPage ? "contained" : "outlined"
                      }
                      sx={{
                        minWidth: 40,
                        borderColor: "#42A5F5",
                        backgroundColor:
                          pageNum === currentPage ? "#42A5F5" : "white",
                        color: pageNum === currentPage ? "white" : "#42A5F5",
                        fontWeight: "bold",
                      }}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  <Button
                    variant="outlined"
                    disabled={currentPage === totalPages}
                    onClick={handleNextPage}
                    sx={{ borderColor: "#42A5F5", color: "#42A5F5" }}
                  >
                    Next
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Loginsettings;
