// Loginsettings.jsx - Complete Modified Code
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
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import GroupIcon from "@mui/icons-material/Group";
import ArticleIcon from "@mui/icons-material/Article";
import SettingsIcon from "@mui/icons-material/Settings";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import EventIcon from "@mui/icons-material/Event";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase/firebase_config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

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
    name: "Vendors",
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

// Updated status colors mapping
const statusColors = {
  active: "#C6F6D5",
  pending: "#FEF3C7",
  inactive: "#FECACA",
  accepted: "#C6F6D5",
  rejected: "#FECACA",
  removed: "#FECACA",
  suspended: "#FECACA",
};

const statusTextColor = {
  active: "#047857",
  pending: "#B45309",
  inactive: "#B91C1C",
  accepted: "#047857",
  rejected: "#B91C1C",
  removed: "#B91C1C",
  suspended: "#B91C1C",
};

const Loginsettings = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const requestsPerPage = 5;
  const navigate = useNavigate();
  const [lastLogin, setLastLogin] = useState("");

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    requestId: null,
    action: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("Please log in to access this page.");
        setIsAdminUser(false);
        setLoading(false);
        return;
      }

      try {
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (!adminDoc.exists()) {
          setError("Admin profile not found.");
          setIsAdminUser(false);
          setLoading(false);
          return;
        }

        setIsAdminUser(true);
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

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/admin/allrequests`
      );

      if (res.data && res.data.registration_requests) {
        setRequests(res.data.registration_requests);
        setFilteredRequests(res.data.registration_requests);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
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

    if (statusFilter !== "All") {
      filtered = filtered.filter((request) => {
        const status = request.data.status?.toLowerCase() || "pending";
        if (statusFilter === "Approved") {
          return status === "active" || status === "accepted";
        }
        if (statusFilter === "Suspended") {
          return request.data.suspended === true;
        }
        return status === statusFilter.toLowerCase();
      });
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, requests]);

  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage);
  const startIndex = (currentPage - 1) * requestsPerPage;
  const endIndex = startIndex + requestsPerPage;
  const currentRequests = filteredRequests.slice(startIndex, endIndex);

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

  const sendStatusEmail = async (email, action, username) => {
    try {
      const subject =
        action === "suspend"
          ? "Your TicketB Vendor Account Has Been Suspended"
          : "Your TicketB Vendor Account Has Been Activated";
      const text =
        action === "suspend"
          ? `Dear ${username},\n\nYour TicketB vendor account has been suspended by the admin. To reactivate your account, please contact the admin at sharveshraj@snippetscript.com.\n\nBest regards,\nTicketB Team`
          : `Dear ${username},\n\nYour TicketB vendor account has been successfully activated by the admin. You can now access your account.\n\nBest regards,\nTicketB Team`;

      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/send-email`, {
        to: email,
        subject,
        text,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      setError(`Failed to send ${action} email: ${error.message}`);
    }
  };

  const handleToggleStatus = (requestId, data, currentSuspendedStatus) => {
    if (!isAdminUser) {
      setError("Only admins can suspend or activate vendor accounts.");
      return;
    }

    if (data.status === "removed") {
      setError("Cannot modify removed vendors.");
      return;
    }

    const action = currentSuspendedStatus ? "activate" : "suspend";

    setConfirmDialog({
      open: true,
      title: action === "suspend" ? "Suspend Vendor" : "Activate Vendor",
      message: `Are you sure you want to ${action} this vendor account?`,
      requestId: requestId,
      action: action,
      data: data,
    });
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    const { requestId, action, data } = confirmDialog;

    try {
      // Get email from request data
      const email = data.organisationMail || data.email;

      if (!email) {
        throw new Error("No email found for vendor");
      }

      // Query vendors collection - try multiple email fields
      const vendorsRef = collection(db, "vendors");

      // Try querying by organisationMail first
      let q = query(vendorsRef, where("organisationMail", "==", email));
      let querySnapshot = await getDocs(q);

      // If not found, try by email field
      if (querySnapshot.empty) {
        q = query(vendorsRef, where("email", "==", email));
        querySnapshot = await getDocs(q);
      }

      // If still not found, try using requestId as vendorId directly
      if (querySnapshot.empty) {
        const vendorDocRef = doc(db, "vendors", requestId);
        const vendorDocSnap = await getDoc(vendorDocRef);

        if (!vendorDocSnap.exists()) {
          throw new Error("Vendor document not found. Please ensure the vendor account has been properly created.");
        }

        // Update using requestId
        await updateDoc(vendorDocRef, {
          suspended: action === "suspend",
        });
      } else {
        // Get the actual vendor document ID from query result
        const vendorDoc = querySnapshot.docs[0];
        const vendorId = vendorDoc.id;

        // Update vendor document in Firestore with the correct ID
        const vendorDocRef = doc(db, "vendors", vendorId);
        await updateDoc(vendorDocRef, {
          suspended: action === "suspend",
        });
      }

      // Send email notification
      await sendStatusEmail(email, action, data.username);

      // Update local state
      setRequests((prev) =>
        prev.map((request) =>
          request.requestId === requestId
            ? {
                ...request,
                data: {
                  ...request.data,
                  suspended: action === "suspend",
                },
              }
            : request
        )
      );

      setActionSuccess(
        `Vendor account ${
          action === "suspend" ? "suspended" : "activated"
        } successfully!`
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error(`Error ${action}ing vendor:`, error);
      setError(`Failed to ${action} vendor account: ${error.message}`);
    } finally {
      setActionLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  const handleViewMore = (requestId, data) => {
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

  const renderStatusBadge = (request) => {
    const status = request.data.status?.toLowerCase() || "pending";
    const isSuspended = request.data.suspended === true;

    if (isSuspended) {
      return (
        <Box
          bgcolor={statusColors.suspended}
          px={2}
          py={0.5}
          borderRadius={2}
          width="fit-content"
          margin="auto"
          color={statusTextColor.suspended}
          fontWeight="medium"
          fontSize="13px"
          textAlign="center"
          display="flex"
          alignItems="center"
          gap={1}
        >
          <BlockIcon fontSize="small" />
          Suspended
        </Box>
      );
    }

    return (
      <Box
        bgcolor={statusColors[status] || statusColors.pending}
        px={2}
        py={0.5}
        borderRadius={2}
        width="fit-content"
        margin="auto"
        color={statusTextColor[status] || statusTextColor.pending}
        fontWeight="medium"
        fontSize="13px"
        textAlign="center"
      >
        {request.data.status || "Pending"}
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
            admin
          </Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>
          Last login at{" "}
          {lastLogin ? formatLastLogin(lastLogin) : "May 13, 2025 02:46 PM"}
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
            Vendor Management
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

          {actionSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {actionSuccess}
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
                      <MenuItem value="Suspended">Suspended</MenuItem>
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
                          "Actions",
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
                            {renderStatusBadge({ requestId, data })}
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{ padding: "12px 16px" }}
                          >
                            <Box
                              display="flex"
                              justifyContent="center"
                              gap={1}
                              alignItems="center"
                            >
                              {data.status === "accepted" &&
                                data.status !== "removed" && (
                                  <Tooltip
                                    title={
                                      data.suspended
                                        ? "Activate Vendor"
                                        : "Suspend Vendor"
                                    }
                                  >
                                    <span>
                                      <IconButton
                                        color={
                                          data.suspended ? "success" : "error"
                                        }
                                        onClick={() =>
                                          handleToggleStatus(
                                            requestId,
                                            data,
                                            data.suspended
                                          )
                                        }
                                        disabled={
                                          actionLoading || !isAdminUser
                                        }
                                      >
                                        {data.suspended ? (
                                          <CheckCircleIcon />
                                        ) : (
                                          <BlockIcon />
                                        )}
                                      </IconButton>
                                    </span>
                                  </Tooltip>
                                )}

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

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelAction}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {confirmDialog.title}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelAction} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmDialog.action === "suspend" ? "error" : "success"}
            variant="contained"
            autoFocus
            disabled={actionLoading}
          >
            {actionLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Loginsettings;