import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  InputBase,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  Paper,
  Popper,
  ClickAwayListener,
  CircularProgress,
  Divider
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import EventIcon from "@mui/icons-material/Event";
import { useNavigate } from "react-router-dom";
import Login from "../Login/Login";
import Signin from "../Signin/Signin";
import { auth, db } from "../../firebase_config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import axios from "axios";

const MainHeader = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:700px)");
  const searchBoxRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const [openLogin, setOpenLogin] = useState(false);
  const [openSignin, setOpenSignin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayName, setDisplayName] = useState(""); // This will hold the display name
  const [userEmail, setUserEmail] = useState(""); // Store user email for vendor lookup
  const [userId, setUserId] = useState(""); // Store user ID
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isEventLive = (eventDate) => {
    const now = new Date();
    const eventDateTime = new Date(eventDate);
    return eventDateTime > now; // Event is in the future
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const apiEndpoints = [
        `${process.env.REACT_APP_API_BASE_URL}/api/events/search?q=${encodeURIComponent(query)}`,
        `${process.env.REACT_APP_API_BASE_URL}/api/events?search=${encodeURIComponent(query)}`,
        `${process.env.REACT_APP_API_BASE_URL}/events/search?query=${encodeURIComponent(query)}`
      ];

      let searchSuccess = false;

      for (const apiUrl of apiEndpoints) {
        try {

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          });


          if (response.ok) {
            const data = await response.json();

            let events = [];
            if (Array.isArray(data)) {
              events = data;
            } else if (data.events && Array.isArray(data.events)) {
              events = data.events;
            } else if (data.data && Array.isArray(data.data)) {
              events = data.data;
            } else if (data.results && Array.isArray(data.results)) {
              events = data.results;
            } else if (data.success && data.events) {
              events = data.events;
            }


            const liveEvents = events.filter(event => {
              const eventDate = event.eventDate || event.date;
              return eventDate && isEventLive(eventDate);
            });


            const transformedEvents = liveEvents.map(event => ({
              id: event.eventId || event.id || event._id,
              name: event.name || event.title || event.eventName || 'Unnamed Event',
              location: formatLocation(event),
              date: event.eventDate || event.date,
              category: formatCategory(event),
              description: event.description || '',
              price: formatPrice(event),
              venue: event.venueDetails?.venueName || event.venue || '',
              city: event.venueDetails?.city || event.city || '',
              area: event.venueDetails?.area || event.area || ''
            })).slice(0, 8); // Limit to 8 results


            setSearchResults(transformedEvents);
            setShowSearchDropdown(true);
            setSearchAnchorEl(searchBoxRef.current);
            searchSuccess = true;
            break;
          }
        } catch (error) {
          console.error(`Error with API ${apiUrl}:`, error);
          continue;
        }
      }

      if (!searchSuccess) {
        const mockResults = generateRealisticMockResults(query);
        setSearchResults(mockResults);
        setShowSearchDropdown(true);
        setSearchAnchorEl(searchBoxRef.current);
      }

    } catch (error) {
      console.error("Search error:", error);
      const mockResults = generateRealisticMockResults(query);
      setSearchResults(mockResults);
      setShowSearchDropdown(true);
      setSearchAnchorEl(searchBoxRef.current);
    } finally {
      setIsSearching(false);
    }
  };

  const formatLocation = (event) => {
    if (event.venueDetails) {
      const { city, area, venueName } = event.venueDetails;
      const parts = [area, city].filter(Boolean);
      return parts.length > 0 ? parts.join(', ') : venueName || 'Location TBD';
    }
    return event.location || event.venue || event.city || 'Location TBD';
  };

  // Helper function to format category
  const formatCategory = (event) => {
    if (Array.isArray(event.category) && event.category.length > 0) {
      return event.category[0];
    }
    if (typeof event.category === 'string') {
      return event.category;
    }
    if (event.tags) {
      return event.tags.split(',')[0].trim();
    }
    return 'Event';
  };

  // Helper function to format price
  const formatPrice = (event) => {
    if (event.pricing && Array.isArray(event.pricing) && event.pricing.length > 0) {
      const minPrice = Math.min(...event.pricing.map(p => p.price || 0));
      return minPrice;
    }
    return event.price || null;
  };

  // Generate realistic mock results for demonstration
  const generateRealisticMockResults = (query) => {
    const now = new Date();
    const mockEvents = [
      {
        id: "d8fc7c1a-a533-4c27-a850-12b57b244af6",
        name: "Mercedes Benz Workshop",
        location: "PSG, Neelambur",
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        category: "Workshop",
        description: "Premium automotive workshop experience",
        price: 150,
        venue: "PSG iTech",
        city: "Coimbatore",
        area: "Neelambur"
      },
      {
        id: "event-tech-2025",
        name: "Tech Innovation Conference 2025",
        location: "Coimbatore Tech Park",
        date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
        category: "Conference",
        description: "Latest trends in technology and innovation",
        price: 500,
        venue: "Tech Park Convention Center",
        city: "Coimbatore",
        area: "Saravanampatti"
      },
      {
        id: "business-summit-2025",
        name: "Business Leadership Summit",
        location: "Convention Center, Chennai",
        date: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString(), // 20 days from now
        category: "Business",
        description: "Learn from industry leaders",
        price: 750,
        venue: "Chennai Convention Center",
        city: "Chennai",
        area: "T. Nagar"
      },
      {
        id: "digital-marketing-2025",
        name: "Digital Marketing Masterclass",
        location: "Online",
        date: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000).toISOString(), // 25 days from now
        category: "Workshop",
        description: "Master digital marketing strategies",
        price: 299,
        venue: "Virtual Event",
        city: "Online",
        area: "Virtual"
      },
      {
        id: "startup-pitch-2025",
        name: "Startup Pitch Competition",
        location: "Innovation Hub, Bangalore",
        date: new Date(now.getTime() + 32 * 24 * 60 * 60 * 1000).toISOString(), // 32 days from now
        category: "Competition",
        description: "Showcase your startup idea",
        price: 0,
        venue: "Innovation Hub",
        city: "Bangalore",
        area: "Koramangala"
      }
    ];

    // Filter based on search query
    return mockEvents.filter(event => {
      const searchTerm = query.toLowerCase();
      return (
        event.name.toLowerCase().includes(searchTerm) ||
        event.location.toLowerCase().includes(searchTerm) ||
        event.category.toLowerCase().includes(searchTerm) ||
        event.description.toLowerCase().includes(searchTerm) ||
        event.venue.toLowerCase().includes(searchTerm) ||
        event.city.toLowerCase().includes(searchTerm) ||
        event.area.toLowerCase().includes(searchTerm)
      );
    }).slice(0, 6);
  };

  // Debounced search function
  const debouncedSearch = useCallback((query) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
  }, []);

  // Handle search input change
  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      debouncedSearch(value);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
    }
  };

  // Handle search result click - Navigate to event details page
  const handleSearchResultClick = (event) => {
    setSearchQuery(event.name);
    setShowSearchDropdown(false);

    // Navigate to event details page with the correct event ID
    if (event.id) {
      navigate(`/event/${event.id}`);
    } else {
      console.error('Event ID not found:', event);
      // Fallback navigation or show error
      navigate(`/search?q=${encodeURIComponent(event.name)}`);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle click away from search dropdown
  const handleSearchClickAway = () => {
    if (!searchFocused) {
      setShowSearchDropdown(false);
    }
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    setSearchFocused(true);
    if (searchResults.length > 0 && searchQuery.trim()) {
      setShowSearchDropdown(true);
      setSearchAnchorEl(searchBoxRef.current);
    }
  };

  // Handle search input blur
  const handleSearchBlur = () => {
    setTimeout(() => {
      setSearchFocused(false);
    }, 200);
  };

  // Handle key press in search input
  const handleSearchKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearchSubmit();
    }
    if (event.key === 'Escape') {
      setShowSearchDropdown(false);
      event.target.blur();
    }
  };

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  // Format date for display
  const formatEventDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `In ${diffDays} days`;

      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: diffDays > 365 ? 'numeric' : undefined
      });
    } catch (error) {
      return 'Date TBD';
    }
  };

  // Format price for display
  const formatPriceDisplay = (price) => {
    if (price === null || price === undefined) return '';
    if (price === 0) return 'Free';
    return `₹${price}`;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setIsAuthenticated(true);
        const derivedUsername = user.displayName || user.email.split("@")[0];
        setUsername(derivedUsername);
        setUserEmail(user.email); // Store user email
        setUserId(user.uid); // Store user ID

        // Fetch user's firstName and lastName from Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const fetchedFirstName = userData.firstName || "";
            const fetchedLastName = userData.lastName || "";

            setFirstName(fetchedFirstName);
            setLastName(fetchedLastName);

            // Set display name logic: if firstName or lastName exists, use them; otherwise use username
            if (fetchedFirstName || fetchedLastName) {
              setDisplayName(`${fetchedFirstName} ${fetchedLastName}`.trim());
            } else {
              setDisplayName(derivedUsername);
            }
          } else {
            // If no Firestore document, use username
            setDisplayName(derivedUsername);
          }
        } catch (error) {
          console.error("Error fetching user data from Firestore:", error);
          setDisplayName(derivedUsername);
        }

        // Existing vendor API call
        try {
          const res = await fetch(`${process.env.REACT_APP_API_BASE_URL}/api/user/post-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email }),
          });

          const data = await res.json();
          if (res.ok) {
            localStorage.setItem("vendorId", data.vendorId);
            setUserId(data.vendorId); // Use vendorId from backend
          } else {
            console.error("Vendor not found:", data.message);
            // Store Firebase UID as fallback
            localStorage.setItem("vendorId", user.uid);
          }
        } catch (error) {
          console.error("Error fetching vendor data:", error);
          // Store Firebase UID as fallback
          localStorage.setItem("vendorId", user.uid);
        }
      } else {
        setIsAuthenticated(false);
        setUsername("");
        setFirstName("");
        setLastName("");
        setDisplayName("");
        setUserEmail(""); // Clear email on logout
        setUserId(""); // Clear user ID
        localStorage.removeItem("vendorId");
      }
    });

    return () => unsubscribe();
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleLoginSuccess = () => {
    setOpenLogin(false);
    setOpenSignin(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("vendorId");
      navigate("/");
      handleClose();
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to log out. Please try again.");
    }
  };

  const handleSwitchToSignUp = () => {
    setOpenLogin(false);
    setOpenSignin(true);
  };

  const handleSwitchToLogin = () => {
    setOpenLogin(true);
    setOpenSignin(false);
  };

  const handleProfileClick = () => {
    navigate("/profile");
    handleClose();
  };

  const handleSettingsClick = () => {
    navigate("/settings");
    handleClose();
  };

  const handleRecentOrdersClick = () => {
    if (isAuthenticated) {
      navigate("/recentorders");
    } else {
      setOpenLogin(true);
    }
  };

  // **UPDATED** Function to handle Create Events click with vendor verification
  const handleCreateEventClick = async () => {

    // If not authenticated, show login
    if (!isAuthenticated) {
      setOpenLogin(true);
      return;
    }

    try {
      // Get vendorId from localStorage or state
      const vendorId = localStorage.getItem("vendorId") || userId;
    

      if (!vendorId || !userEmail) {
        navigate(`/vendor/register/${vendorId || "new"}`);
        return;
      }

      // **NEW LOGIC**: Check vendor status from backend API
      const response = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/vendor/status/${vendorId}`
      );


      if (response.data.success && response.data.exists) {
        const { status, vendorId: returnedVendorId } = response.data.vendor;

        // Handle different statuses
        if (status === "accepted" || status === "approved") {
          // Vendor is approved, show alert and redirect to login
          alert("Your vendor account already exists and is approved! Please login to continue.");
          navigate(`/vendor/login/${returnedVendorId}`);
        } else if (status === "pending") {
          // Vendor is pending approval
          navigate("/vendor/confirmation", {
            state: {
              status: "pending",
              message: "Your registration is still pending approval. Please wait for admin verification.",
              vendorId: returnedVendorId
            }
          });
        } else if (status === "rejected") {
          // Vendor was rejected
          navigate("/vendor/confirmation", {
            state: {
              status: "rejected",
              message: "Your registration was rejected. Please contact support for more details.",
              vendorId: returnedVendorId
            }
          });
        } else if (status === "removed") {
          // Vendor was removed
          navigate("/vendor/confirmation", {
            state: {
              status: "removed",
              message: "Your account has been removed. Please contact support for assistance.",
              vendorId: returnedVendorId
            }
          });
        } else {
          // Unknown status, redirect to registration
          navigate(`/vendor/register/${vendorId}`);
        }
      } else {
        // Vendor doesn't exist in backend, proceed to registration
        navigate(`/vendor/register/${vendorId}`);
      }
    } catch (error) {
      console.error("Error checking vendor status:", error);

      if (error.response?.status === 404) {
        // Vendor not found (404), proceed to registration
        const vendorId = localStorage.getItem("vendorId") || userId;
        navigate(`/vendor/register/${vendorId}`);
      } else {
        // Other errors, show error message
        console.error("Unexpected error:", error);
        alert("Something went wrong while checking your vendor status. Please try again later.");
      }
    }
  };

  const renderSearchDropdown = () => (
    <Popper
      open={showSearchDropdown}
      anchorEl={searchAnchorEl}
      placement="bottom-start"
      style={{ zIndex: 1300, width: searchBoxRef.current?.offsetWidth || 300 }}
      modifiers={[
        {
          name: 'offset',
          options: {
            offset: [0, 8],
          },
        },
      ]}
    >
      <Paper
        elevation={8}
        sx={{
          maxHeight: 400,
          overflow: 'auto',
          width: '100%',
          borderRadius: 2,
          border: '1px solid #e0e0e0',
        }}
      >
        {isSearching ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
            <CircularProgress size={24} sx={{ color: 'rgb(25, 174, 220)' }} />
            <Typography sx={{ ml: 2, fontFamily: 'albert sans', color: '#666' }}>
              Searching live events...
            </Typography>
          </Box>
        ) : searchResults.length > 0 ? (
          <>
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'albert sans',
                  color: '#666',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}
              >
                Live Events ({searchResults.length})
              </Typography>
            </Box>
            <Divider />
            {searchResults.map((event, index) => (
              <MenuItem
                key={event.id || index}
                onClick={() => handleSearchResultClick(event)}
                sx={{
                  fontFamily: 'albert sans',
                  py: 1.5,
                  px: 2,
                  borderBottom: index < searchResults.length - 1 ? '1px solid #f5f5f5' : 'none',
                  '&:hover': {
                    backgroundColor: '#f8f9fa',
                  },
                  '&:last-child': {
                    borderBottom: 'none'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <EventIcon sx={{ color: 'rgb(25, 174, 220)', mr: 1.5, fontSize: '1.2rem' }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: 'albert sans',
                        fontWeight: '600',
                        color: '#333',
                        fontSize: '0.95rem',
                        mb: 0.5
                      }}
                    >
                      {event.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {event.location && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'albert sans',
                            color: '#666',
                            fontSize: '0.8rem',
                          }}
                        >
                          📍 {event.location}
                        </Typography>
                      )}
                      {event.date && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'albert sans',
                            color: isEventLive(event.date) ? '#28a745' : '#dc3545',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}
                        >
                          • {formatEventDate(event.date)}
                        </Typography>
                      )}
                      {event.price !== null && event.price !== undefined && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'albert sans',
                            color: event.price === 0 ? '#28a745' : '#666',
                            fontSize: '0.8rem',
                            fontWeight: event.price === 0 ? 'bold' : 'normal'
                          }}
                        >
                          • {formatPriceDisplay(event.price)}
                        </Typography>
                      )}
                      {event.category && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'albert sans',
                            color: 'rgb(25, 174, 220)',
                            fontSize: '0.75rem',
                            bgcolor: 'rgba(25, 174, 220, 0.1)',
                            px: 1,
                            py: 0.25,
                            borderRadius: 1,
                            ml: 'auto'
                          }}
                        >
                          {event.category}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>
              </MenuItem>
            ))}
            {searchQuery && (
              <>
                <Divider />
                <MenuItem
                  onClick={handleSearchSubmit}
                  sx={{
                    fontFamily: 'albert sans',
                    py: 1.5,
                    px: 2,
                    backgroundColor: '#f8f9fa',
                    '&:hover': {
                      backgroundColor: '#e9ecef',
                    }
                  }}
                >
                  <SearchIcon sx={{ color: 'rgb(25, 174, 220)', mr: 1.5 }} />
                  <Typography sx={{ fontFamily: 'albert sans', color: 'rgb(25, 174, 220)', fontWeight: '500' }}>
                    View all results for "{searchQuery}"
                  </Typography>
                </MenuItem>
              </>
            )}
          </>
        ) : searchQuery ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography sx={{ fontFamily: 'albert sans', color: '#666', mb: 1 }}>
              No live events found for "{searchQuery}"
            </Typography>
            <Typography sx={{ fontFamily: 'albert sans', color: '#999', fontSize: '0.9rem' }}>
              Try searching with different keywords or check back later
            </Typography>
          </Box>
        ) : null}
      </Paper>
    </Popper>
  );

  const renderDrawerMenu = () => (
    <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
      <Box sx={{ width: 200, padding: 1 }}>
        <Box mb={4} sx={{zIndex:10}}>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ float: "right" }}>
            <CloseIcon onClick={() => setDrawerOpen(false)} />
          </IconButton>
        </Box>
        <Box>
          <List>
            {isAuthenticated ? (
              <>
                <ListItem>
                  <ListItemText
                    primary={displayName}
                    sx={{
                      color:"rgb(25, 174, 220)",
                      fontFamily:'albert sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'albert sans'
                      }
                    }}
                  />
                </ListItem>
                <ListItem button onClick={handleProfileClick}>
                  <ListItemText
                    sx={{
                      fontFamily:'albert sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'albert sans'
                      }
                    }}
                    primary="Profile"
                  />
                </ListItem>
                <ListItem button onClick={handleSettingsClick}>
                  <ListItemText
                    sx={{
                      fontFamily:'albert sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'albert sans'
                      }
                    }}
                    primary="Settings"
                  />
                </ListItem>
              </>
            ) : (
              <>
                <ListItem button onClick={() => setOpenLogin(true)}>
                  <ListItemText
                    primary="Log In"
                    sx={{
                      fontFamily:'albert sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'albert sans'
                      }
                    }}
                  />
                </ListItem>
                <ListItem button onClick={() => setOpenSignin(true)}>
                  <ListItemText
                    primary="Sign Up"
                    sx={{
                      fontFamily:'albert sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'albert sans'
                      }
                    }}
                  />
                </ListItem>
              </>
            )}
            <ListItem button onClick={handleRecentOrdersClick}>
              <ListItemText
                primary="Recent Orders"
                sx={{
                  fontFamily:'albert sans',
                  '& .MuiListItemText-primary': {
                    fontFamily: 'albert sans'
                  }
                }}
              />
            </ListItem>
            <ListItem button onClick={handleCreateEventClick}>
              <ListItemText
                primary="Create Events"
                sx={{
                  fontFamily:'albert sans',
                  '& .MuiListItemText-primary': {
                    fontFamily: 'albert sans'
                  }
                }}
              />
            </ListItem>
            {isAuthenticated ? (
              <>
                <ListItem button onClick={handleLogout}>
                  <ListItemText
                    primary="Logout"
                    sx={{
                      fontFamily:'albert sans',
                      '& .MuiListItemText-primary': {
                        fontFamily: 'albert sans'
                      }
                    }}
                  />
                </ListItem>
              </>
            ) : null}
          </List>
        </Box>
      </Box>
    </Drawer>
  );

  return (
    <Box>
      <Box
        sx={{
          margin: "0% 0% 0% 0%",
          backgroundColor: "white",
          paddingBottom: "6px",
          paddingTop: "11px",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            width: "95%",
            margin: "0 auto",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          {/* Logo */}
          <Typography
            variant="h5"
            onClick={() => navigate("/")}
            sx={{
              fontFamily: 'albert sans',
              fontWeight: "900",
              fontSize: "30px",
              color: "rgb(25, 174, 220)",
              cursor: "pointer",
            }}
          >
            ticketb
          </Typography>

          {/* Search + Location */}
          {!isMobile && (
            <ClickAwayListener onClickAway={handleSearchClickAway}>
              <Box
                ref={searchBoxRef}
                sx={{
                  width: "36%",
                  minWidth: "30%",
                  maxWidth: "36%",
                  border: searchFocused ? "2px solid rgb(25, 174, 220)" : "1px solid rgb(170, 170, 170)",
                  borderRadius: "40px",
                  display: "flex",
                  justifyContent: "space-between",
                  position: "relative",
                  transition: "border-color 0.2s ease",
                  backgroundColor: searchFocused ? "rgba(25, 174, 220, 0.02)" : "white",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", padding: "1% 2%", width: "100%" }}>
                  <SearchIcon sx={{ color: searchFocused ? "rgb(25, 174, 220)" : "gray", marginRight: "4%" }} />
                  <InputBase
                    placeholder="Search for Events, Movies, Sports, Activities"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleSearchFocus}
                    onBlur={handleSearchBlur}
                    onKeyDown={handleSearchKeyPress}
                    sx={{
                      fontFamily: 'albert sans',
                      fontSize: "16px",
                      flex: 1,
                      border: "none",
                      outline: "none",
                      '&::placeholder': {
                        color: '#999',
                        opacity: 1,
                      }
                    }}
                  />
                  {searchQuery && (
                    <IconButton
                      size="small"
                      onClick={handleClearSearch}
                      sx={{
                        color: '#999',
                        '&:hover': {
                          color: '#666',
                          backgroundColor: 'rgba(0,0,0,0.04)'
                        }
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ height: "40px", borderLeft: "2px solid rgb(170, 170, 170)", display: "flex", alignItems: "center" }} />
                <Box sx={{ display: "flex", alignItems: "center", padding: "0.5% 2%", width: "100%" }}>
                  <LocationOnIcon sx={{ color: "gray", marginRight: "4%" }} />
                  <Typography
                    variant="body1"
                    sx={{ fontFamily: 'albert sans', fontSize: "16px", flex: 1 }}
                  >
                    Coimbatore
                  </Typography>
                  <IconButton
                    onClick={handleSearchSubmit}
                    sx={{
                      backgroundColor: "rgb(25, 174, 220)",
                      color: "white",
                      marginX: "2%",
                      borderRadius: "60%",
                      width: "32px",
                      height: "32px",
                      "&:hover": { backgroundColor: "rgb(20, 140, 180)" },
                    }}
                  >
                    <SearchIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </ClickAwayListener>
          )}

          {/* Nav Items */}
          {!isMobile ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 3 }}>
              <Typography
                onClick={handleRecentOrdersClick}
                sx={{
                  cursor: "pointer",
                  fontFamily:'albert sans',
                  "&:hover": {
                    textDecoration: "underline",
                    fontFamily:'albert sans'
                  }
                }}
              >
                Recent Orders
              </Typography>
              <Typography
                onClick={handleCreateEventClick}
                sx={{
                  cursor: "pointer",
                  fontFamily:'albert sans',
                  "&:hover": {
                    textDecoration: "underline",
                    fontFamily:'albert sans'
                  }
                }}
              >
                Create Events
              </Typography>
              {isAuthenticated ? (
                <IconButton
                  onClick={handleClick}
                  size="large"
                  aria-controls={open ? "profile-menu" : undefined}
                  aria-haspopup="true"
                  aria-expanded={open ? "true" : undefined}
                >
                  <Avatar
                    sx={{
                      width: 35,
                      height: 35,
                      bgcolor: "rgb(25, 174, 220)",
                      "&:hover": { bgcolor: "rgb(20, 140, 180)" },
                    }}
                  >
                    {(firstName || username).charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              ) : (
                <>
                  <Typography
                    onClick={() => setOpenLogin(true)}
                    sx={{
                      cursor: "pointer",
                      fontFamily:'albert sans',
                      "&:hover": {
                        textDecoration: "underline",
                        fontFamily:'albert sans'
                      }
                    }}
                  >
                    Log In
                  </Typography>
                  <Typography
                    onClick={() => setOpenSignin(true)}
                    sx={{
                      cursor: "pointer",
                      fontFamily:'albert sans',
                      "&:hover": {
                        textDecoration: "underline",
                        fontFamily:'albert sans'
                      }
                    }}
                  >
                    Sign Up
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            <IconButton onClick={() => setDrawerOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Bottom line */}
      <Box sx={{ height: "1px", width: "100%", backgroundColor: "rgb(238, 237, 242)", marginTop: "8px" }} />

      {/* Search Dropdown */}
      {renderSearchDropdown()}

      {/* Profile Dropdown Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 180,
            borderRadius: 2,
          },
        }}
      >
        <MenuItem
          sx={{
            fontFamily: 'albert sans',
            fontWeight: "bold",
            color: "rgb(25, 174, 220)"
          }}
        >
          {displayName}
        </MenuItem>
        <MenuItem onClick={handleProfileClick} sx={{fontFamily:'albert sans'}}>Profile</MenuItem>
        <MenuItem onClick={handleSettingsClick} sx={{fontFamily:'albert sans'}}>Settings</MenuItem>
        <MenuItem onClick={handleLogout} sx={{fontFamily:'albert sans'}}>Logout</MenuItem>
      </Menu>

      {/* Drawer menu for mobile */}
      {renderDrawerMenu()}

      {/* Login & Signin Modals */}
      <Login
        open={openLogin}
        handleClose={() => setOpenLogin(false)}
        handleSwitchToSignUp={handleSwitchToSignUp}
        onLoginSuccess={handleLoginSuccess}
      />
      <Signin
        open={openSignin}
        handleClose={() => setOpenSignin(false)}
        handleSwitchToLogin={handleSwitchToLogin}
        onSigninSuccess={handleLoginSuccess}
      />
    </Box>
  );
};

export default MainHeader;
