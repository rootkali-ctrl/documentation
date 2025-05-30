import React, { useState, useEffect } from "react";
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
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  startAfter,
  endBefore,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebase_config";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";

// Sidebar items
const sidebarItems = [
  {
    name: "Dashboard",
    icon: <TrendingUpIcon />,
    active: false,
    path: "/admin/dashboardupcoming",
  },
  { name: "Users", icon: <GroupIcon />, active: true, path: "/admin/userpage" },
  {
    name: "Posts",
    icon: <ArticleIcon />,
    active: false,
    path: "/admin/postpage",
  },
  {
    name: "Login Settings",
    icon: <SettingsIcon />,
    active: false,
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

const statusColors = {
  Active: "#C6F6D5",
  Suspended: "#FECACA",
  Pending: "#FEF3C7",
};

const UserPage = () => {
  const [activeTab, setActiveTab] = useState("recuser");
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastVisibleDoc, setLastVisibleDoc] = useState(null);
  const [firstVisibleDoc, setFirstVisibleDoc] = useState(null);
  const [pageCache, setPageCache] = useState({});
  const [authChecked, setAuthChecked] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [error, setError] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: "",
    message: "",
    id: null,
    isUser: true,
    action: null,
  });
  const [actionSuccess, setActionSuccess] = useState(null);
  const usersPerPage = 5;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthChecked(true);
      if (!user) {
        setError("Please log in to access user and vendor details.");
        setIsAdminUser(false);
      } else {
        const adminDocRef = doc(db, "admins", user.uid);
        const adminDoc = await getDoc(adminDocRef);
        setIsAdminUser(adminDoc.exists());
        if (!adminDoc.exists()) {
          setError(
            "You do not have admin privileges to perform actions like suspending accounts."
          );
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return "Never";
    try {
      if (timestamp && typeof timestamp.toDate === "function") {
        return timestamp.toDate().toLocaleDateString();
      }
      if (typeof timestamp === "string") {
        return timestamp;
      }
      if (timestamp instanceof Date) {
        return timestamp.toLocaleDateString();
      }
      return "Invalid date";
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date error";
    }
  };

  const fetchUsers = async (direction = "next") => {
    setError(null);
    setLoading(true);
    try {
      const usersCollection = collection(db, "users");
      let usersQuery;

      const cacheKey = `users_${searchTerm}_${currentPage}`;
      if (pageCache[cacheKey] && direction !== "search") {
        setUsers(pageCache[cacheKey].data);
        setLastVisibleDoc(pageCache[cacheKey].lastDoc);
        setFirstVisibleDoc(pageCache[cacheKey].firstDoc);
        setHasMoreData(pageCache[cacheKey].hasMore);
        setLoading(false);
        return;
      }

      if (searchTerm) {
        usersQuery = query(
          usersCollection,
          where("name", ">=", searchTerm),
          where("name", "<=", searchTerm + "\uf8ff"),
          orderBy("name"),
          limit(usersPerPage + 1)
        );
      } else {
        if (direction === "next" && lastVisibleDoc) {
          usersQuery = query(
            usersCollection,
            orderBy("firstName", "desc"),
            startAfter(lastVisibleDoc),
            limit(usersPerPage + 1)
          );
        } else if (direction === "prev" && firstVisibleDoc) {
          usersQuery = query(
            usersCollection,
            orderBy("firstName", "desc"),
            endBefore(firstVisibleDoc),
            limit(usersPerPage + 1)
          );
        } else {
          usersQuery = query(
            usersCollection,
            orderBy("firstName", "desc"),
            limit(usersPerPage + 1)
          );
        }
      }

      const querySnapshot = await getDocs(usersQuery);

      if (querySnapshot.empty) {
        setUsers([]);
        setHasMoreData(false);
        setLoading(false);
        return;
      }

      const hasMore = querySnapshot.docs.length > usersPerPage;
      const docs = hasMore
        ? querySnapshot.docs.slice(0, usersPerPage)
        : querySnapshot.docs;

      const lastDoc = docs[docs.length - 1];
      const firstDoc = docs[0];
      setLastVisibleDoc(lastDoc);
      setFirstVisibleDoc(firstDoc);
      setHasMoreData(hasMore);

      const fetchedUsers = docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        image: doc.data().image || "/api/placeholder/40/40",
        status: doc.data().suspended ? "Suspended" : "Active",
        lastLogin: doc.data().lastLogin || "Never",
        accountcreated: doc.data().accountcreated || new Date(),
      }));

      setPageCache((prev) => ({
        ...prev,
        [cacheKey]: {
          data: fetchedUsers,
          lastDoc,
          firstDoc,
          hasMore,
        },
      }));

      setUsers(fetchedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users: " + error.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async (direction = "next") => {
    setError(null);
    setLoading(true);
    try {
      const vendorsCollection = collection(db, "vendors");
      let vendorsQuery;

      const cacheKey = `vendors_${searchTerm}_${currentPage}`;
      if (pageCache[cacheKey] && direction !== "search") {
        setVendors(pageCache[cacheKey].data);
        setLastVisibleDoc(pageCache[cacheKey].lastDoc);
        setFirstVisibleDoc(pageCache[cacheKey].firstDoc);
        setHasMoreData(pageCache[cacheKey].hasMore);
        setLoading(false);
        return;
      }

      if (searchTerm) {
        vendorsQuery = query(
          vendorsCollection,
          where("name", ">=", searchTerm),
          where("name", "<=", searchTerm + "\uf8ff"),
          orderBy("name"),
          limit(usersPerPage + 1)
        );
      } else {
        if (direction === "next" && lastVisibleDoc) {
          vendorsQuery = query(
            vendorsCollection,
            orderBy("username", "desc"),
            startAfter(lastVisibleDoc),
            limit(usersPerPage + 1)
          );
        } else if (direction === "prev" && firstVisibleDoc) {
          vendorsQuery = query(
            vendorsCollection,
            orderBy("username", "desc"),
            endBefore(firstVisibleDoc),
            limit(usersPerPage + 1)
          );
        } else {
          vendorsQuery = query(
            vendorsCollection,
            orderBy("username", "desc"),
            limit(usersPerPage + 1)
          );
        }
      }

      const querySnapshot = await getDocs(vendorsQuery);

      if (querySnapshot.empty) {
        setVendors([]);
        setHasMoreData(false);
        setLoading(false);
        return;
      }

      const hasMore = querySnapshot.docs.length > usersPerPage;
      const docs = hasMore
        ? querySnapshot.docs.slice(0, usersPerPage)
        : querySnapshot.docs;

      const lastDoc = docs[docs.length - 1];
      const firstDoc = docs[0];
      setLastVisibleDoc(lastDoc);
      setFirstVisibleDoc(firstDoc);
      setHasMoreData(hasMore);

      const fetchedVendors = docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        image: doc.data().image || "/api/placeholder/40/40",
        status: doc.data().suspended ? "Suspended" : "Active",
        lastLogin: doc.data().lastLogin || "Never",
        accountcreated: doc.data().accountcreated || new Date(),
      }));

      setPageCache((prev) => ({
        ...prev,
        [cacheKey]: {
          data: fetchedVendors,
          lastDoc,
          firstDoc,
          hasMore,
        },
      }));

      setVendors(fetchedVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setError("Failed to fetch vendors: " + error.message);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const sendStatusEmail = async (email, action, isUser) => {
    try {
      const subject =
        action === "suspend"
          ? "Your TicketB Account Has Been Suspended"
          : "Your TicketB Account Has Been Activated";
      const text =
        action === "suspend"
          ? `Dear ${
              isUser ? "User" : "Vendor"
            },\n\nYour TicketB account has been suspended by the admin. To reactivate your account, please contact the admin at sharveshraj@snippetscript.com .\n\nBest regards,\nTicketB Team`
          : `Dear ${
              isUser ? "User" : "Vendor"
            },\n\nYour TicketB account has been successfully activated by the admin. You can now access your account.\n\nBest regards,\nTicketB Team`;

      await axios.post("http://localhost:8080/api/send-email", {
        to: email,
        subject,
        text,
      });
      console.log(`Email sent to ${email} for ${action}`);
    } catch (error) {
      console.error("Error sending email:", error);
      setError(`Failed to send ${action} email: ${error.message}`);
    }
  };

  const handleToggleStatus = async (id, currentStatus, isUser = true) => {
    if (!isAdminUser) {
      setError("Only admins can suspend or activate accounts.");
      return;
    }

    setConfirmDialog({
      open: true,
      title:
        currentStatus === "Active" ? "Suspend Account" : "Activate Account",
      message: `Are you sure you want to ${
        currentStatus === "Active" ? "suspend" : "activate"
      } this ${isUser ? "user" : "vendor"} account?`,
      id: id,
      isUser: isUser,
      action: currentStatus === "Active" ? "suspend" : "activate",
    });
  };

  const handleConfirmAction = async () => {
    setActionLoading(true);
    const { id, isUser, action } = confirmDialog;
    try {
      const collectionName = isUser ? "users" : "vendors";
      const docRef = doc(db, collectionName, id);

      await updateDoc(docRef, {
        suspended: action === "suspend",
      });

      const currentData = isUser ? users : vendors;
      const account = currentData.find((item) => item.id === id);
      if (account && account.email) {
        await sendStatusEmail(account.email, action, isUser);
      } else {
        console.warn("No email found for account:", id);
        setError(
          "Account status updated, but no email address found to notify."
        );
      }

      if (isUser) {
        setUsers((prev) =>
          prev.map((user) =>
            user.id === id
              ? {
                  ...user,
                  status: action === "suspend" ? "Suspended" : "Active",
                }
              : user
          )
        );
      } else {
        setVendors((prev) =>
          prev.map((vendor) =>
            vendor.id === id
              ? {
                  ...vendor,
                  status: action === "suspend" ? "Suspended" : "Active",
                }
              : vendor
          )
        );
      }

      setPageCache({});

      setActionSuccess(
        `Account ${
          action === "suspend" ? "suspended" : "activated"
        } successfully!`
      );
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (error) {
      console.error(`Error ${action}ing account:`, error);
      setError(`Failed to ${action} account: ${error.message}`);
    } finally {
      setActionLoading(false);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  const handleCancelAction = () => {
    setConfirmDialog((prev) => ({ ...prev, open: false }));
  };

  useEffect(() => {
    if (!authChecked) return;

    const fetchData = async () => {
      if (activeTab === "recuser") {
        await fetchUsers();
      } else {
        await fetchVendors();
      }
    };

    fetchData();
  }, [activeTab, currentPage, authChecked]);

  useEffect(() => {
    if (!authChecked) return;

    if (searchTerm !== "") {
      const delayDebounce = setTimeout(() => {
        setCurrentPage(1);
        if (activeTab === "recuser") {
          fetchUsers("search");
        } else {
          fetchVendors("search");
        }
      }, 500);

      return () => clearTimeout(delayDebounce);
    } else {
      setCurrentPage(1);
      if (activeTab === "recuser") {
        fetchUsers("search");
      } else {
        fetchVendors("search");
      }
    }
  }, [searchTerm, authChecked]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setLastVisibleDoc(null);
    setFirstVisibleDoc(null);
    setSearchTerm("");
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
      if (activeTab === "recuser") {
        fetchUsers("prev");
      } else {
        fetchVendors("prev");
      }
    }
  };

  const handleNextPage = () => {
    if (hasMoreData) {
      setCurrentPage((prev) => prev + 1);
      if (activeTab === "recuser") {
        fetchUsers("next");
      } else {
        fetchVendors("next");
      }
    }
  };

  const getPaginationRange = () => {
    let start = Math.max(1, currentPage - 1);
    let end = start + 2;
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const currentData = activeTab === "recuser" ? users : vendors;

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
          Last login at {new Date().toLocaleDateString()}{" "}
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Box>

      <Box display="flex" flex={1}>
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

        <Box
          flex={1}
          px={5}
          py={4}
          overflow="auto"
          maxHeight="calc(100vh - 89px)"
        >
          <Typography variant="h5" fontWeight="bold" mb={4}>
            User Management
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {actionSuccess && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {actionSuccess}
            </Alert>
          )}

          <Box display="flex" mb={6} justifyContent="center" gap={10}>
            <Button
              variant={activeTab === "recuser" ? "contained" : "outlined"}
              sx={{
                bgcolor: activeTab === "recuser" ? "#19aedc" : "#D1D5DB",
                color: activeTab === "recuser" ? "white" : "#4B5563",
                textTransform: "none",
                border: "none",
                padding: 1.5,
              }}
              onClick={() => handleTabChange("recuser")}
            >
              Recent Users
            </Button>
            <Button
              variant={activeTab === "recvendor" ? "contained" : "outlined"}
              sx={{
                bgcolor: activeTab === "recvendor" ? "#19aedc" : "#D1D5DB",
                color: activeTab === "recvendor" ? "white" : "#4B5563",
                textTransform: "none",
                border: "none",
                padding: 1.5,
              }}
              onClick={() => handleTabChange("recvendor")}
            >
              Recent Vendors
            </Button>
          </Box>

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
                    placeholder="Search ..."
                    value={searchTerm}
                    onChange={handleSearch}
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
                    onClick={() => {
                      alert(
                        `Add ${
                          activeTab === "recuser" ? "User" : "Vendor"
                        } functionality coming soon!`
                      );
                    }}
                  >
                    + Add {activeTab === "recuser" ? "User" : "Vendor"}
                  </Button>
                </Box>
              </Box>

              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                        User Name
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
                      <TableCell sx={{ backgroundColor: "#f1f1f1" }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          <CircularProgress
                            size={40}
                            sx={{ color: "#19aedc" }}
                          />
                        </TableCell>
                      </TableRow>
                    ) : currentData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                          No {activeTab === "recuser" ? "users" : "vendors"}{" "}
                          found
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentData.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.username}</TableCell>

                          <TableCell>{item.email}</TableCell>
                          <TableCell>{item.phone}</TableCell>
                          <TableCell>
                            {formatDate(item.accountcreated)}
                          </TableCell>
                          <TableCell>{formatDate(item.lastLogin)}</TableCell>
                          <TableCell>
                            <Box
                              bgcolor={statusColors[item.status] || "#E5E7EB"}
                              px={2}
                              py={0.5}
                              borderRadius={2}
                              width="fit-content"
                              display="flex"
                              alignItems="center"
                              gap={1}
                            >
                              {item.status === "Active" ? (
                                <CheckCircleIcon
                                  fontSize="small"
                                  sx={{ color: "green" }}
                                />
                              ) : (
                                <BlockIcon
                                  fontSize="small"
                                  sx={{ color: "red" }}
                                />
                              )}
                              {item.status}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Tooltip
                              title={
                                item.status === "Active"
                                  ? "Suspend Account"
                                  : "Activate Account"
                              }
                            >
                              <span>
                                <IconButton
                                  color={
                                    item.status === "Active"
                                      ? "error"
                                      : "success"
                                  }
                                  onClick={() =>
                                    handleToggleStatus(
                                      item.id,
                                      item.status,
                                      activeTab === "recuser"
                                    )
                                  }
                                  disabled={actionLoading || !isAdminUser}
                                >
                                  {item.status === "Active" ? (
                                    <BlockIcon />
                                  ) : (
                                    <CheckCircleIcon />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mt={3}
                px={2}
              >
                <Typography variant="body2">Page {currentPage}</Typography>
                <Box display="flex" gap={1}>
                  <Button
                    variant="outlined"
                    disabled={currentPage === 1 || loading}
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
                      disabled={
                        (pageNum > currentPage && !hasMoreData) || loading
                      }
                    >
                      {pageNum}
                    </Button>
                  ))}

                  <Button
                    variant="outlined"
                    disabled={!hasMoreData || loading}
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

      <Dialog
        open={confirmDialog.open}
        onClose={handleCancelAction}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{confirmDialog.title}</DialogTitle>
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

export default UserPage;
