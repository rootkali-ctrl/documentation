import React, { useEffect, useState } from "react";
import axios from "axios";
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
  Alert,
  CircularProgress,
  Select,
  MenuItem,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";
import { useNavigate } from "react-router-dom";

// Sidebar items
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
    active: true,
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
    active: false,
    path: "/admin/eventmanagement",
  },
];

// Updated status colors mapping to include all possible statuses
const statusColors = {
  active: "#C6F6D5",
  pending: "#FEF3C7",
  inactive: "#FECACA",
  accepted: "#C6F6D5",
  rejected: "#FECACA",
  removed: "#FECACA",
};

const statusTextColor = {
  active: "#047857",
  pending: "#B45309",
  inactive: "#B91C1C",
  accepted: "#047857",
  rejected: "#B91C1C",
  removed: "#B91C1C",
};

const Loginsettings = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All"); // New state for status filter
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const requestsPerPage = 5;
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

     
      const res = await axios.get(`${process.env.REACT_APP_API_BASE_URL}/api/admin/allrequests`);
      console.log("API Response:", res.data);

      if (res.data && res.data.registration_requests) {
        setRequests(res.data.registration_requests);
        setFilteredRequests(res.data.registration_requests);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError(err.message || "Failed to fetch registration requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Filter requests when search term or status filter changes
  useEffect(() => {
    let filtered = requests;

    // Apply search term filter
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter((request) => {
        const searchTermLower = searchTerm.toLowerCase();
        const { data } = request;

        return (
          (data.username &&
            data.username.toLowerCase().includes(searchTermLower)) ||
          (data.organisationMail &&
            data.organisationMail.toLowerCase().includes(searchTermLower)) ||
          (data.organisationContact &&
            data.organisationContact.includes(searchTerm)) ||
          (data.email && data.email.toLowerCase().includes(searchTermLower))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "All") {
      filtered = filtered.filter((request) => {
        const status = request.data.status?.toLowerCase() || "pending";
        if (statusFilter === "Approved") {
          return status === "active" || status === "accepted";
        }
        return status === statusFilter.toLowerCase();
      });
    }

    setFilteredRequests(filtered);
    setCurrentPage(1); // Reset to first page on new filter
  }, [searchTerm, statusFilter, requests]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);
  const startIndex = (currentPage - 1) * requestsPerPage;
  const currentRequests = filteredRequests.slice(
    startIndex,
    startIndex + requestsPerPage
  );

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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const handleViewMore = (requestId, data) => {
    console.log("Viewing details for:", requestId, data);
    if (data.status === "pending") {
      navigate(`/admin/vendorstatus/${requestId}`, {
        state: { requestId, data },
      });
    } else if (data.status === "rejected") {
      navigate(`/admin/vendorstatus/${requestId}`, {
        state: { requestId, data },
      });
    } else if (data.status === "accepted") {
      navigate(`/admin/vendordetails/${requestId}`, {
        state: { requestId, data },
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    } catch (err) {
      console.error("Error formatting date:", err);
      return dateString;
    }
  };

  const renderStatusBadge = (status) => {
    const lowerStatus = status?.toLowerCase() || "pending";
    return (
      <Box
        bgcolor={statusColors[lowerStatus] || statusColors.pending}
        px={2}
        py={0.5}
        borderRadius={2}
        width="fit-content"
        margin="auto"
        color={statusTextColor[lowerStatus] || statusTextColor.pending}
        fontWeight="medium"
        fontSize="13px"
        textAlign="center"
      >
        {status || "Pending"}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
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

          {error && (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
              <Button
                variant="outlined"
                size="small"
                sx={{ ml: 2 }}
                onClick={fetchRequests}
              >
                Retry
              </Button>
            </Alert>
          )}

          {requests.length === 0 && !loading && !error ? (
            <Alert severity="info">No registration requests available.</Alert>
          ) : (
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
                    <Select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      size="small"
                      sx={{
                        minWidth: 150,
                        backgroundColor: "#fff",
                        borderRadius: "4px",
                      }}
                    >
                      <MenuItem value="All">All Statuses</MenuItem>
                      <MenuItem value="Pending">Pending</MenuItem>
                      <MenuItem value="Approved">Approved</MenuItem>
                      <MenuItem value="Removed">Removed</MenuItem>
                    </Select>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Search vendors..."
                      value={searchTerm}
                      onChange={handleSearchChange}
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
                  <Table>
                    <TableHead>
                      <TableRow>
                        {[
                          "Vendor Name",
                          "Email",
                          "Phone",
                          "Account Created",
                          "Status",
                          "Edit",
                        ].map((header) => (
                          <TableCell
                            key={header}
                            align="center"
                            sx={{
                              backgroundColor: "#f1f1f1",
                              fontWeight: "bold",
                              padding: "12px 16px",
                              fontSize: "15px",
                            }}
                          >
                            {header}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {currentRequests.map(({ requestId, data }) => (
                        <TableRow key={requestId} hover>
                          <TableCell
                            align="center"
                            sx={{ padding: "12px 16px" }}
                          >
                            <Box
                              display="flex"
                              justifyContent="center"
                              alignItems="center"
                              gap={1.5}
                            >
                              {data.username || "N/A"}
                            </Box>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ padding: "12px 16px" }}
                          >
                            {data.organisationMail || data.email || "N/A"}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ padding: "12px 16px" }}
                          >
                            {data.organisationContact || "N/A"}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ padding: "12px 16px" }}
                          >
                            {formatDate(data.createdAt)}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ padding: "12px 16px" }}
                          >
                            {renderStatusBadge(data.status)}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              padding: "12px 16px",
                              cursor: "pointer",
                              color: "#42A5F5",
                            }}
                          >
                            <Box display="flex" justifyContent="center" gap={1}>
                              <Typography
                                onClick={() => {
                                  if (data.status !== "removed") {
                                    handleViewMore(requestId, data);
                                  }
                                }}
                                sx={{
                                  color:
                                    data.status === "removed"
                                      ? "gray"
                                      : "#19aedc",
                                  cursor:
                                    data.status === "removed"
                                      ? "not-allowed"
                                      : "pointer",
                                  textDecoration:
                                    data.status === "removed"
                                      ? "none"
                                      : "underline",
                                }}
                              >
                                View more...
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {filteredRequests.length > 0 && (
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mt={3}
                    px={2}
                  >
                    <Typography variant="body2">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(
                        startIndex + requestsPerPage,
                        filteredRequests.length
                      )}{" "}
                      of {filteredRequests.length} entries
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
                            color:
                              pageNum === currentPage ? "white" : "#42A5F5",
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
                )}
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Loginsettings;
