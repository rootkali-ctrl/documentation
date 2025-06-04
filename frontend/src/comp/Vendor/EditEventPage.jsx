import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Grid,
  CircularProgress,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import { storage, db, auth } from "../../firebase_config";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore"; // Added setDoc
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import HeaderVendorLogged from "../Header/HeaderVendorLogged";
import { signOut } from "firebase/auth";

const EditEventPage = () => {
  const { vendorId, eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const isMobile = useMediaQuery("(max-width:900px)");
  // Form state
  const [eventData, setEventData] = useState({
    _id: eventId,
    name: "",
    description: "",
    category: [],
    tags: "",
    eventDate: null,
    eventHost: null,
    mediaLink: "",
    contact: "",
    cancellationAvailable: false, // was string, now boolean
    cancellationDays: 0,
    deductionRate: 0,
    deductionType: "",
    bannerImages: [],
    pricing: [
      {
        ticketType: "",
        price: 0,
        seats: 0,
        tax: 0,
        free: false,
        features: "",
      },
    ],
    speaker: [""],
    perks: [
      {
        itemName: "",
        price: 0,
        limit: 0,
      },
    ],
    FAQ: [
      {
        question: "",
        answer: "",
      },
    ],
    coupons: [
      {
        couponCode: "",
        couponLimits: 0,
        startTime: new Date(),
        endTime: new Date(),
        reducePert: 0,
      },
    ],
    vendorId: vendorId,
    venueDetails: {
      venueName: "",
      streetName: "",
      area: "",
      city: "",
      state: "",
      pincode: "",
    },
  });

  // File upload state
  const [newBannerImages, setNewBannerImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [dialogState, setDialogState] = useState({
    open: false,
    message: "",
  });

  // Optimized dialog handler
  const showDialog = useCallback((message) => {
    setDialogState({ open: true, message });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState({ open: false, message: "" });
  }, []);

  // Category options
  const categoryOptions = [
    "Music",
    "Sports",
    "Arts",
    "Food",
    "Technology",
    "Education",
    "Business",
    "Lifestyle",
    "Entertainment",
    "Community",
  ];

  // Fetch event data with vendorId validation
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        if (location.state && location.state.eventData) {
          // Validate vendorId from URL params against event data
          if (location.state.eventData.vendorId !== vendorId) {
            throw new Error("Unauthorized: You cannot edit this event");
          }
          formatEventData(location.state.eventData);
        } else {
          console.log(`Fetching event data for ID: ${eventId}`);

          // Using Firestore to fetch document directly
          const eventDocRef = doc(db, "events", eventId);
          const eventDoc = await getDoc(eventDocRef);

          if (eventDoc.exists()) {
            const eventDocData = eventDoc.data();
            console.log("Firestore Document Data:", eventDocData);

            // VENDOR ID VALIDATION - Main security check
            if (eventDocData.vendorId !== vendorId) {
              console.error("Vendor ID mismatch:");
              console.error("URL vendorId:", vendorId);
              console.error("Event vendorId:", eventDocData.vendorId);
              throw new Error("Unauthorized: You cannot edit this event");
            }

            formatEventData(eventDocData);
          } else {
            // Fallback to API if needed
            try {
              const response = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/event/${eventId}`
              );
              console.log("API Response:", response.data);

              // Validate vendorId from API response too
              if (response.data.vendorId !== vendorId) {
                throw new Error("Unauthorized: You cannot edit this event");
              }

              formatEventData(response.data);
            } catch (apiError) {
              console.error("API fetch failed:", apiError);
              throw new Error("Event not found");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching event data:", error);
        setSnackbar({
          open: true,
          message: error.message || "Failed to load event data",
          severity: "error",
        });

        // Redirect back if unauthorized
        if (error.message.includes("Unauthorized")) {
          setTimeout(() => {
            navigate(`/vendor/${vendorId}`);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, [eventId, location.state, vendorId, navigate]);
  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("vendorId"); // Add this line
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);

      showDialog("Failed to log out. Please try again.");
    }
  };

  const formatEventData = (data) => {
    const toDate = (d) => (d ? new Date(d) : null);

    setEventData({
      ...data,
      _id: data._id || eventId,
      eventDate: toDate(data.eventDate),
      eventHost: toDate(data.eventHost),
      category: Array.isArray(data.category) ? data.category : [],
      bannerImages: Array.isArray(data.bannerImages) ? data.bannerImages : [],
      pricing: Array.isArray(data.pricing) ? data.pricing : [],
      speaker: Array.isArray(data.speaker) ? data.speaker : [""],
      perks: Array.isArray(data.perks)
        ? data.perks
        : [{ itemName: "", price: 0, limit: 0 }],
      FAQ: Array.isArray(data.FAQ) ? data.FAQ : [{ question: "", answer: "" }],
      coupons: Array.isArray(data.coupons)
        ? data.coupons.map((c) => ({
            ...c,
            startTime: toDate(c.startTime),
            endTime: toDate(c.endTime),
          }))
        : [
            {
              couponCode: "",
              couponLimits: 0,
              startTime: new Date(),
              endTime: new Date(),
              reducePert: 0,
            },
          ],
      cancellationAvailable: !!data.cancellationAvailable,
      vendorId,
      venueDetails: data.venueDetails || {
        venueName: "",
        streetName: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
      },
    });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setEventData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setEventData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setEventData((prev) => ({
      ...prev,
      [name]: date,
    }));
  };

  // Handle category selection
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setEventData((prev) => ({
      ...prev,
      category: value,
    }));
  };

  // Handle banner image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewBannerImages((prev) => [...prev, ...files]);
  };

  // Remove banner image (existing ones)
  const handleRemoveImage = (index) => {
    const imageUrl = eventData.bannerImages[index];
    setRemovedImages((prev) => [...prev, imageUrl]);
    const updatedImages = [...eventData.bannerImages];
    updatedImages.splice(index, 1);
    setEventData((prev) => ({
      ...prev,
      bannerImages: updatedImages,
    }));
  };

  // Remove newly added image (not yet uploaded)
  const handleRemoveNewImage = (index) => {
    const updatedImages = [...newBannerImages];
    updatedImages.splice(index, 1);
    setNewBannerImages(updatedImages);
  };

  // Handle pricing changes
  const handlePricingChange = (index, field, value) => {
    const updatedPricing = [...eventData.pricing];
    if (field === "free") {
      updatedPricing[index] = {
        ...updatedPricing[index],
        [field]: value,
        price: value ? 0 : updatedPricing[index].price,
      };
    } else {
      updatedPricing[index] = {
        ...updatedPricing[index],
        [field]: value,
      };
    }
    setEventData((prev) => ({
      ...prev,
      pricing: updatedPricing,
    }));
  };

  // Add pricing tier
  const addPricingTier = () => {
    setEventData((prev) => ({
      ...prev,
      pricing: [
        ...prev.pricing,
        {
          ticketType: "",
          price: 0,
          seats: 0,
          tax: 0,
          free: false,
          features: "",
        },
      ],
    }));
  };

  // Remove pricing tier
  const removePricingTier = (index) => {
    const updatedPricing = [...eventData.pricing];
    updatedPricing.splice(index, 1);
    setEventData((prev) => ({
      ...prev,
      pricing: updatedPricing,
    }));
  };

  // Handle change in speaker name or role
  const handleSpeakerChange = (index, field, value) => {
    setEventData((prev) => {
      const updatedSpeakers = [...prev.speaker];
      updatedSpeakers[index] = {
        ...updatedSpeakers[index],
        [field]: value,
      };
      return {
        ...prev,
        speaker: updatedSpeakers,
      };
    });
  };

  // Add new speaker object
  const addSpeaker = () => {
    setEventData((prev) => ({
      ...prev,
      speaker: [...(prev.speaker || []), { name: "", role: "" }],
    }));
  };

  // Remove speaker
  const removeSpeaker = (index) => {
    setEventData((prev) => {
      const updatedSpeakers = [...prev.speaker];
      updatedSpeakers.splice(index, 1);
      return {
        ...prev,
        speaker: updatedSpeakers,
      };
    });
  };

  // Updated handlePerkChange function
  const handlePerkChange = async (index, field, value) => {
    setEventData((prev) => {
      const updatedPerks = [...prev.perks];
      updatedPerks[index] = {
        ...updatedPerks[index],
        [field]: value,
      };
      return {
        ...prev,
        perks: updatedPerks,
      };
    });

    // If itemName is changed, fetch new image
    if (field === "itemName" && value.trim()) {
      try {
        const imageUrl = await fetchUnsplashImage(value);
        setEventData((prev) => {
          const updatedPerks = [...prev.perks];
          updatedPerks[index] = {
            ...updatedPerks[index],
            url: imageUrl,
          };
          return {
            ...prev,
            perks: updatedPerks,
          };
        });
      } catch (error) {
        console.error("Error updating image:", error);
      }
    }
  };

  // Updated addPerk function
  const addPerk = () => {
    setEventData((prev) => ({
      ...prev,
      perks: [
        ...prev.perks,
        {
          itemName: "",
          price: 0,
          limit: 0,
          url: "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTgxODF8MHwxfHNlYXJjaHwxfHxzbmFja3N8ZW58MHwwfHx8MTc0ODY5OTI3OXww&ixlib=rb-4.1.0&q=80&w=400",
        },
      ],
    }));
  };

  // Updated removePerk function (this one was correct)
  const removePerk = (index) => {
    setEventData((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index),
    }));
  };

  // Handle changes in FAQ entries
  const handleFAQChange = (index, field, value) => {
    setEventData((prev) => {
      const updatedFAQs = [...prev.FAQ];
      if (!updatedFAQs[index])
        updatedFAQs[index] = { question: "", answer: "" };

      updatedFAQs[index][field] = value;

      return {
        ...prev,
        FAQ: updatedFAQs,
      };
    });
  };

  // Add new FAQ entry
  const addFAQ = () => {
    setEventData((prev) => ({
      ...prev,
      FAQ: [...prev.FAQ, { question: "", answer: "" }],
    }));
  };

  // Remove FAQ entry
  const removeFAQ = (index) => {
    setEventData((prev) => {
      const updatedFAQs = [...prev.FAQ];
      updatedFAQs.splice(index, 1);
      return {
        ...prev,
        FAQ: updatedFAQs,
      };
    });
  };

  // Simplified handleSubmit - removed complex auth checks
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Double-check vendorId before submitting
      if (eventData.vendorId !== vendorId) {
        throw new Error("Unauthorized: VendorId mismatch");
      }

      // First, upload new banner images if any
      let updatedBannerImages = [...eventData.bannerImages];

      // Delete removed images from storage
      for (const imageUrl of removedImages) {
        try {
          const fileNameMatch = imageUrl.match(/([^\/]+)$/);
          const fileName = fileNameMatch ? fileNameMatch[0] : null;
          if (fileName) {
            const storagePath = `events/${eventId}/${fileName}`;
            const imageRef = ref(storage, storagePath);
            await deleteObject(imageRef);
          }
        } catch (error) {
          console.error("Error deleting image:", error);
          // Continue even if deletion fails
        }
      }

      // Upload new images
      for (const file of newBannerImages) {
        const filename = `banner_${Date.now()}_${file.name.replace(
          /[^a-zA-Z0-9.]/g,
          "_"
        )}`;
        const storageRef = ref(storage, `events/${eventId}/${filename}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        updatedBannerImages.push(downloadURL);
      }

      // Prepare data for update - ensure vendorId is preserved
      const updatedEventData = {
        name: eventData.name,
        description: eventData.description,
        category: eventData.category,
        tags: eventData.tags,
        bannerImages: updatedBannerImages,
        vendorId: vendorId, // Always use vendorId from URL params
        eventDate: eventData.eventDate
          ? new Date(eventData.eventDate).toISOString()
          : null,
        eventHost: eventData.eventHost
          ? new Date(eventData.eventHost).toISOString()
          : null,
        mediaLink: eventData.mediaLink,
        contact: eventData.contact,
        cancellationAvailable:
          eventData.cancellationAvailable === "true" ||
          eventData.cancellationAvailable === true,
        cancellationDays: Number(eventData.cancellationDays),
        deductionRate: Number(eventData.deductionRate),
        deductionType: eventData.deductionType,
        venueDetails: eventData.venueDetails,
        speaker: eventData.speaker,
        perks: eventData.perks,
        FAQ: eventData.FAQ,
        lastUpdated: new Date(),
        pricing: eventData.pricing.map((tier) => ({
          ...tier,
          price: Number(tier.price),
          seats: Number(tier.seats),
          tax: Number(tier.tax),
          free: Boolean(tier.free),
        })),
      };

      console.log("Updating event document with data:", updatedEventData);

      // Use setDoc with merge option
      const eventDocRef = doc(db, "events", eventId);
      await setDoc(eventDocRef, updatedEventData, { merge: true });

      console.log("Event successfully updated in Firestore");

      setSnackbar({
        open: true,
        message: "Event updated successfully",
        severity: "success",
      });

      setTimeout(() => {
        navigate(`/vendorhome/${vendorId}`);
      }, 2000);
    } catch (error) {
      console.error("Error updating event:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to update event. Please try again.",
        severity: "error",
      });
    } finally {
      setSubmitting(false);

      showDialog("Updated successfully");
    }
  };

  const fetchUnsplashImage = async (itemName) => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
          itemName
        )}&per_page=1&client_id=${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        return data.results[0].urls.regular;
      }

      // Fallback image if no results found
      return "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTgxODF8MHwxfHNlYXJjaHwxfHxzbmFja3N8ZW58MHwwfHx8MTc0ODY5OTI3OXww&ixlib=rb-4.1.0&q=80&w=400";
    } catch (error) {
      console.error("Error fetching Unsplash image:", error);
      // Return fallback image on error
      return "https://images.unsplash.com/photo-1621939514649-280e2ee25f60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NTgxODF8MHwxfHNlYXJjaHwxfHxzbmFja3N8ZW58MHwwfHx8MTc0ODY5OTI3OXww&ixlib=rb-4.1.0&q=80&w=400";
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
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
      <HeaderVendorLogged
        vendorId={vendorId}
        userProfile={userProfile}
        onLogout={handleLogout}
      />
      <Box sx={{ width: "90%", margin: "0 auto", py: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontFamily: "Albert Sans",
            fontWeight: 800,
            mb: 3,
            fontSize: isMobile ? "1.5rem" : "2rem",
          }}
        >
          Update Event
        </Typography>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              p: 3,
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}
            >
              Basic Information
            </Typography>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                fullWidth
                label="Event Name"
                name="name"
                value={eventData.name}
                onChange={handleChange}
                required
                sx={{
                  width: isMobile ? "80%" : "50%",
                  "& .MuiInputBase-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiFormHelperText-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& input::placeholder": {
                    fontFamily: "Albert Sans",
                  },
                }}
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={eventData.description}
                onChange={handleChange}
                multiline
                rows={4}
                sx={{
                  width: isMobile ? "80%" : "50%",
                  "& .MuiInputBase-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiFormHelperText-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& input::placeholder": {
                    fontFamily: "Albert Sans",
                  },
                }}
                required
              />

              <Box sx={{ display: isMobile ? "block" : "flex", gap: 2 }}>
                <FormControl
                  fullWidth
                  sx={{ mb: isMobile ? 2 : 0, width: isMobile ? "80%" : "25%" }}
                >
                  <InputLabel>Category</InputLabel>
                  <Select
                    multiple
                    name="category"
                    value={eventData.category}
                    onChange={handleCategoryChange}
                    label="Category"
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {categoryOptions.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Tags (comma separated)"
                  name="tags"
                  value={eventData.tags}
                  onChange={handleChange}
                  sx={{
                    width: isMobile ? "80%" : "24%",
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />
              </Box>

              <Box sx={{ display: isMobile ? "block" : "flex", gap: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DateTimePicker
                    sx={{ width: isMobile ? "80%" : "25%" }}
                    label="Event Date & Time"
                    value={eventData.eventDate}
                    onChange={(date) => handleDateChange("eventDate", date)}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        fullWidth
                        required
                        sx={{
                          "& .MuiInputBase-root": {
                            fontFamily: "Albert Sans",
                          },
                          "& .MuiInputLabel-root": {
                            fontFamily: "Albert Sans",
                          },
                          "& .MuiFormHelperText-root": {
                            fontFamily: "Albert Sans",
                          },
                          "& input::placeholder": {
                            fontFamily: "Albert Sans",
                          },
                        }}
                      />
                    )}
                  />
                </LocalizationProvider>

                <TextField
                  fullWidth
                  label="Media Link (YouTube/Video)"
                  name="mediaLink"
                  value={eventData.mediaLink}
                  onChange={handleChange}
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                    width: isMobile ? "80%" : "24%",
                    mt: isMobile ? 1 : null,
                  }}
                />
              </Box>

              <TextField
                fullWidth
                label="Contact Email"
                name="contact"
                type="email"
                value={eventData.contact}
                onChange={handleChange}
                required
                sx={{
                  width: isMobile ? "80%" : "25%",
                  "& .MuiInputBase-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiInputLabel-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& .MuiFormHelperText-root": {
                    fontFamily: "Albert Sans",
                  },
                  "& input::placeholder": {
                    fontFamily: "Albert Sans",
                  },
                }}
              />
            </Box>
          </Box>

          {/* Venue Details */}
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              p: 3,
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}
            >
              Venue Details
            </Typography>

            {/* First row (first 3 fields) */}
            <Box
              sx={{
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  label: "Venue Name",
                  name: "venueDetails.venueName",
                  required: true,
                },
                { label: "Street Name", name: "venueDetails.streetName" },
                { label: "Area", name: "venueDetails.area", required: true },
                { label: "City", name: "venueDetails.city", required: true },
                { label: "State", name: "venueDetails.state", required: true },
                {
                  label: "Pincode",
                  name: "venueDetails.pincode",
                  required: true,
                },
              ].map((field) => (
                <TextField
                  key={field.name}
                  label={field.label}
                  name={field.name}
                  value={eventData.venueDetails[field.name.split(".")[1]]}
                  onChange={handleChange}
                  required={field.required}
                  sx={{
                    width: isMobile ? "90%" : "45%",
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Banner Images */}
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              p: 3,
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}
            >
              Banner Images
            </Typography>

            <Box sx={{ mb: 2 }}>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                style={{ display: "none" }}
                id="banner-upload"
              />
              <label htmlFor="banner-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<AddIcon />}
                  sx={{ mb: 2, color: "#19AEDC", fontFamily: "albert sans" }}
                >
                  Add Images
                </Button>
              </label>
            </Box>

            <Typography
              variant="subtitle2"
              sx={{ mb: 1, fontFamily: "albert sans" }}
            >
              Current Images:
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
              {eventData.bannerImages.map((image, index) => (
                <Box
                  key={index}
                  sx={{
                    position: "relative",
                    width: isMobile ? "100%" : "23%",
                  }}
                >
                  <img
                    src={image}
                    alt={`Banner ${index + 1}`}
                    style={{
                      width: "100%",
                      height: 150,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      backgroundColor: "rgba(255,255,255,0.7)",
                    }}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              {newBannerImages.map((file, index) => (
                <Box
                  key={`new-${index}`}
                  sx={{
                    position: "relative",
                    width: isMobile ? "100%" : "23%",
                  }}
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`New Banner ${index + 1}`}
                    style={{
                      width: "100%",
                      height: 150,
                      objectFit: "cover",
                      borderRadius: 8,
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: "absolute",
                      top: 5,
                      right: 5,
                      backgroundColor: "rgba(255,255,255,0.7)",
                    }}
                    onClick={() => handleRemoveNewImage(index)}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Ticket Pricing */}
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              p: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}
            >
              Ticket Pricing
            </Typography>

            {eventData.pricing.map((tier, index) => (
              <Box
                key={index}
                sx={{
                  mb: 3,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: 2,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Ticket Type"
                    value={tier.ticketType}
                    onChange={(e) =>
                      handlePricingChange(index, "ticketType", e.target.value)
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& .MuiInputLabel-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& .MuiFormHelperText-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& input::placeholder": {
                        fontFamily: "Albert Sans",
                      },
                    }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Price"
                    type="number"
                    value={tier.price}
                    onChange={(e) =>
                      handlePricingChange(
                        index,
                        "price",
                        Number(e.target.value)
                      )
                    }
                    sx={{
                      "& .MuiInputBase-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& .MuiInputLabel-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& .MuiFormHelperText-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& input::placeholder": {
                        fontFamily: "Albert Sans",
                      },
                    }}
                    disabled={tier.free}
                    InputProps={{
                      startAdornment: (
                        <Typography sx={{ mr: 1, fontFamily: "albert sans" }}>
                          ₹
                        </Typography>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& .MuiInputLabel-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& .MuiFormHelperText-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& input::placeholder": {
                        fontFamily: "Albert Sans",
                      },
                    }}
                    label="Seats"
                    type="number"
                    value={tier.seats}
                    onChange={(e) =>
                      handlePricingChange(
                        index,
                        "seats",
                        Number(e.target.value)
                      )
                    }
                    required
                  />
                  <TextField
                    fullWidth
                    label="Tax %"
                    type="number"
                    value={tier.tax}
                    sx={{
                      "& .MuiInputBase-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& .MuiInputLabel-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& .MuiFormHelperText-root": {
                        fontFamily: "Albert Sans",
                      },
                      "& input::placeholder": {
                        fontFamily: "Albert Sans",
                      },
                    }}
                    onChange={(e) =>
                      handlePricingChange(index, "tax", Number(e.target.value))
                    }
                    disabled={tier.free}
                  />
                  <IconButton
                    color="error"
                    onClick={() => removePricingTier(index)}
                    sx={{ alignSelf: "center" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
            ))}

            <Button
              variant="outlined"
              onClick={addPricingTier}
              startIcon={<AddIcon />}
              sx={{ color: "#19AEDC", fontFamily: "albert sans" }}
            >
              Add Tier
            </Button>
          </Box>

          {/* Cancellation policy */}
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              p: 3,
              mb: 3,
              mt: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}
            >
              Cancellation Policy
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl
                  fullWidth
                  sx={{ mb: 2, width: isMobile ? 180 : 300 }}
                >
                  <InputLabel id="category-label">
                    Cancellation Available
                  </InputLabel>
                  <Select
                    labelId="category-label"
                    name="cancellationAvailable"
                    value={eventData.cancellationAvailable.toString()}
                    onChange={handleChange}
                    label="Category"
                  >
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {eventData.cancellationAvailable === "true" ||
              eventData.cancellationAvailable === true ? (
                <>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Cancellation Days"
                      name="cancellationDays"
                      type="number"
                      value={eventData.cancellationDays}
                      onChange={handleChange}
                      InputProps={{
                        inputProps: { min: 0 },
                      }}
                      sx={{
                        mb: 2,
                        "& .MuiInputBase-root": {
                          fontFamily: "Albert Sans",
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily: "Albert Sans",
                        },
                        "& .MuiFormHelperText-root": {
                          fontFamily: "Albert Sans",
                        },
                        "& input::placeholder": {
                          fontFamily: "Albert Sans",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl
                      fullWidth
                      sx={{ mb: 2, width: isMobile ? 180 : 200 }}
                    >
                      <InputLabel>Deduction Type</InputLabel>
                      <Select
                        name="deductionType"
                        value={eventData.deductionType}
                        onChange={handleChange}
                        label="Category"
                      >
                        <MenuItem value="percentage">Percentage</MenuItem>
                        <MenuItem value="fixed">Fixed Amount</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={
                        eventData.deductionType === "percentage"
                          ? "Deduction Percentage"
                          : "Deduction Amount"
                      }
                      name="deductionRate"
                      type="number"
                      value={eventData.deductionRate}
                      onChange={handleChange}
                      InputProps={{
                        inputProps: { min: 0 },
                        startAdornment:
                          eventData.deductionType === "fixed" ? (
                            <Typography
                              sx={{ mr: 1, fontFamily: "albert sans" }}
                            >
                              ₹
                            </Typography>
                          ) : null,
                        endAdornment:
                          eventData.deductionType === "percentage" ? (
                            <Typography
                              sx={{ ml: 1, fontFamily: "albert sans" }}
                            >
                              %
                            </Typography>
                          ) : null,
                      }}
                      sx={{
                        mb: 2,
                        "& .MuiInputBase-root": {
                          fontFamily: "Albert Sans",
                        },
                        "& .MuiInputLabel-root": {
                          fontFamily: "Albert Sans",
                        },
                        "& .MuiFormHelperText-root": {
                          fontFamily: "Albert Sans",
                        },
                        "& input::placeholder": {
                          fontFamily: "Albert Sans",
                        },
                      }}
                    />
                  </Grid>
                </>
              ) : null}
            </Grid>
          </Box>

          {/* Speakers */}
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              p: 3,
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}
            >
              Speakers
            </Typography>

            {eventData.speaker?.map((speaker, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "center",
                  gap: 2,
                  mb: 2,
                  width: isMobile ? "100%" : "80%",
                }}
              >
                <TextField
                  fullWidth
                  label={`Speaker ${index + 1} Name`}
                  value={speaker.name}
                  onChange={(e) =>
                    handleSpeakerChange(index, "name", e.target.value)
                  }
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label={`Speaker ${index + 1} Role/Designation`}
                  value={speaker.role}
                  onChange={(e) =>
                    handleSpeakerChange(index, "role", e.target.value)
                  }
                  sx={{
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />
                <IconButton color="error" onClick={() => removeSpeaker(index)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addSpeaker}
              sx={{
                mb: 2,
                color: "#19AEDC",
                borderColor: "#19AEDC",
                fontFamily: "albert sans",
              }}
            >
              Add Speaker
            </Button>
          </Box>

          {/* Perks */}
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              p: 3,
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}
            >
              Perks & Amenities
            </Typography>

            {eventData.perks.map((perk, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 2,
                  alignItems: "center",
                  mb: 2,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 1,
                }}
              >
                <TextField
                  label="Item Name"
                  value={perk.itemName || ""}
                  onChange={(e) =>
                    handlePerkChange(index, "itemName", e.target.value)
                  }
                  sx={{
                    width: isMobile ? "100%" : "25%",
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />
                <TextField
                  label="Price"
                  type="number"
                  value={perk.price || 0}
                  onChange={(e) =>
                    handlePerkChange(
                      index,
                      "price",
                      parseFloat(e.target.value) || 0
                    )
                  }
                  sx={{
                    width: isMobile ? "100%" : "20%",
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />
                <TextField
                  label="Limit"
                  type="number"
                  value={perk.limit || 0}
                  onChange={(e) =>
                    handlePerkChange(
                      index,
                      "limit",
                      parseInt(e.target.value, 10) || 0
                    )
                  }
                  sx={{
                    width: isMobile ? "100%" : "20%",
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />

                {/* Image preview */}
                {perk.url && (
                  <Box
                    sx={{
                      width: isMobile ? "100%" : "100px",
                      height: "60px",
                      overflow: "hidden",
                      borderRadius: 1,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <img
                      src={perk.url}
                      alt={perk.itemName}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </Box>
                )}

                <IconButton color="error" onClick={() => removePerk(index)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addPerk}
              sx={{ mb: 2, color: "#19AEDC", fontFamily: "albert sans" }}
            >
              Add Perk
            </Button>
          </Box>

          {/* FAQs */}
          <Box
            sx={{
              backgroundColor: "white",
              borderRadius: 2,
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
              p: 3,
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}
            >
              FAQs
            </Typography>

            {eventData.FAQ.map((faq, index) => (
              <Box
                key={index}
                sx={{
                  mb: 3,
                  p: 2,
                  border: "1px solid #e0e0e0",
                  borderRadius: 2,
                  width: isMobile ? "90%" : "60%",
                }}
              >
                <TextField
                  fullWidth
                  label="Question"
                  value={faq.question || ""}
                  onChange={(e) =>
                    handleFAQChange(index, "question", e.target.value)
                  }
                  placeholder="Enter your question"
                  sx={{
                    mb: 2,
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />

                <TextField
                  fullWidth
                  label="Answer"
                  value={faq.answer || ""}
                  onChange={(e) =>
                    handleFAQChange(index, "answer", e.target.value)
                  }
                  multiline
                  rows={2}
                  sx={{
                    mb: 2,
                    "& .MuiInputBase-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& .MuiFormHelperText-root": {
                      fontFamily: "Albert Sans",
                    },
                    "& input::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                  }}
                />
                <IconButton color="error" onClick={() => removeFAQ(index)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addFAQ}
              sx={{
                mb: 2,
                color: "#19AEDC",
                borderColor: "#19AEDC",
                fontFamily: "albert sans",
              }}
            >
              Add FAQ
            </Button>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={() => navigate(`/vendor/${vendorId}`)}
              sx={{ fontWeight: 600, fontFamily: "albert sans" }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "#19AEDC",
                color: "white",
                fontWeight: 600,
                fontFamily: "albert sans",
                "&:hover": { backgroundColor: "#0E91B9" },
              }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <CircularProgress size={24} sx={{ color: "white", mr: 1 }} />
                  Updating...
                </>
              ) : (
                "Update Event"
              )}
            </Button>
          </Box>
        </form>
        <Dialog
          open={dialogState.open}
          onClose={closeDialog}
          sx={{ zIndex: 9999 }} // Ensure it appears above everything
        >
          <DialogTitle sx={{ fontFamily: "albert sans" }}>Notice</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ fontFamily: "albert sans" }}>
              {dialogState.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={closeDialog}
              color="primary"
              sx={{ fontFamily: "albert sans" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </div>
  );
};

export default EditEventPage;
