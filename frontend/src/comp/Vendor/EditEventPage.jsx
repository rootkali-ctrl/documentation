import { React, useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import VendorBeforeLogin from "../Header/VendorBeforeLogin";
import { getAuth } from 'firebase/auth';

import { writeBatch } from "firebase/firestore";
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
  FormControlLabel,
  Switch,
  Divider,
  Snackbar,
  Alert,
  CircularProgress,
  useMediaQuery
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DateTimePicker } from '@mui/x-date-pickers';
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import axios from "axios";
import { storage, db } from "../../firebase_config";
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore"; // Added setDoc
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const EditEventPage = () => {
  const { vendorId, eventId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
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
    cancellationAvailable: "false",
    cancellationDays: 0,
    deductionRate: 0,
    deductionType: "",
    bannerImages: [],
    pricing: [{ ticketType: "", price: 0, seats: 0, tax: 0, free: false, features: "" }],
    speaker: [],
    perks: [],
    FAQ: [],
    vendorId: vendorId,
    venueDetails: {
      venueName: "",
      streetName: "",
      area: "",
      city: "",
      state: "",
      pincode: ""
    }
  });

  // File upload state
  const [newBannerImages, setNewBannerImages] = useState([]);
  const [removedImages, setRemovedImages] = useState([]);

  // Category options
  const categoryOptions = [
    "Music", "Sports", "Arts", "Food", "Technology",
    "Education", "Business", "Lifestyle", "Entertainment", "Community"
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
              const response = await axios.get(`http://localhost:8080/api/event/${eventId}`);
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
          severity: "error"
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

  const formatEventData = (data) => {
    console.log("=== EVENT DATA DEBUGGING ===");
    console.log("Event document vendorId:", data.vendorId);
    console.log("URL vendorId parameter:", vendorId);
    console.log("VendorIds match:", data.vendorId === vendorId);
    console.log("================================");

    const id = data._id || eventId;
    const eventDate = data.eventDate ? new Date(data.eventDate) : null;
    const eventHost = data.eventHost ? new Date(data.eventHost) : null;
    const pricing = data.pricing && Array.isArray(data.pricing) ? data.pricing : [];
    const category = data.category && Array.isArray(data.category) ? data.category : [];
    const bannerImages = data.bannerImages && Array.isArray(data.bannerImages) ? data.bannerImages : [];
    const speaker = data.speaker && Array.isArray(data.speaker) ? data.speaker : [];
    const perks = data.perks && Array.isArray(data.perks) ? data.perks : [];
    const FAQ = data.FAQ && Array.isArray(data.FAQ) ? data.FAQ : [];
    const venueDetails = data.venueDetails || {
      venueName: "",
      streetName: "",
      area: "",
      city: "",
      state: "",
      pincode: ""
    };

    setEventData({
      ...data,
      _id: id,
      eventDate,
      eventHost,
      pricing,
      category,
      bannerImages,
      speaker,
      perks,
      FAQ,
      vendorId, // Use vendorId from URL params
      venueDetails
    });
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setEventData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setEventData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle date changes
  const handleDateChange = (name, date) => {
    setEventData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  // Handle category selection
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setEventData(prev => ({
      ...prev,
      category: value
    }));
  };

  // Handle banner image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setNewBannerImages(prev => [...prev, ...files]);
  };

  // Remove banner image (existing ones)
  const handleRemoveImage = (index) => {
    const imageUrl = eventData.bannerImages[index];
    setRemovedImages(prev => [...prev, imageUrl]);
    const updatedImages = [...eventData.bannerImages];
    updatedImages.splice(index, 1);
    setEventData(prev => ({
      ...prev,
      bannerImages: updatedImages
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
        price: value ? 0 : updatedPricing[index].price
      };
    } else {
      updatedPricing[index] = {
        ...updatedPricing[index],
        [field]: value
      };
    }
    setEventData(prev => ({
      ...prev,
      pricing: updatedPricing
    }));
  };

  // Add pricing tier
  const addPricingTier = () => {
    setEventData(prev => ({
      ...prev,
      pricing: [
        ...prev.pricing,
        { ticketType: "", price: 0, seats: 0, tax: 0, free: false, features: "" }
      ]
    }));
  };

  // Remove pricing tier
  const removePricingTier = (index) => {
    const updatedPricing = [...eventData.pricing];
    updatedPricing.splice(index, 1);
    setEventData(prev => ({
      ...prev,
      pricing: updatedPricing
    }));
  };

  // Handle speaker changes
  const handleSpeakerChange = (index, value) => {
    const updatedSpeakers = [...eventData.speaker];
    updatedSpeakers[index] = value;
    setEventData(prev => ({
      ...prev,
      speaker: updatedSpeakers
    }));
  };

  // Add speaker
  const addSpeaker = () => {
    setEventData(prev => ({
      ...prev,
      speaker: [...prev.speaker, ""]
    }));
  };

  // Remove speaker
  const removeSpeaker = (index) => {
    const updatedSpeakers = [...eventData.speaker];
    updatedSpeakers.splice(index, 1);
    setEventData(prev => ({
      ...prev,
      speaker: updatedSpeakers
    }));
  };

  // Handle perk changes
  const handlePerkChange = (index, value) => {
    const updatedPerks = [...eventData.perks];
    updatedPerks[index] = value;
    setEventData(prev => ({
      ...prev,
      perks: updatedPerks
    }));
  };

  // Add perk
  const addPerk = () => {
    setEventData(prev => ({
      ...prev,
      perks: [...prev.perks, ""]
    }));
  };

  // Remove perk
  const removePerk = (index) => {
    const updatedPerks = [...eventData.perks];
    updatedPerks.splice(index, 1);
    setEventData(prev => ({
      ...prev,
      perks: updatedPerks
    }));
  };

  // Handle FAQ changes
  const handleFAQChange = (index, field, value) => {
    const updatedFAQs = [...eventData.FAQ];
    if (!updatedFAQs[index]) {
      updatedFAQs[index] = { question: "", answer: "" };
    }
    updatedFAQs[index] = {
      ...updatedFAQs[index],
      [field]: value
    };
    setEventData(prev => ({
      ...prev,
      FAQ: updatedFAQs
    }));
  };

  // Add FAQ
  const addFAQ = () => {
    setEventData(prev => ({
      ...prev,
      FAQ: [...prev.FAQ, { question: "", answer: "" }]
    }));
  };

  // Remove FAQ
  const removeFAQ = (index) => {
    const updatedFAQs = [...eventData.FAQ];
    updatedFAQs.splice(index, 1);
    setEventData(prev => ({
      ...prev,
      FAQ: updatedFAQs
    }));
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
        const filename = `banner_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
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
        eventDate: eventData.eventDate ? new Date(eventData.eventDate).toISOString() : null,
        eventHost: eventData.eventHost ? new Date(eventData.eventHost).toISOString() : null,
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
        pricing: eventData.pricing.map(tier => ({
          ...tier,
          price: Number(tier.price),
          seats: Number(tier.seats),
          tax: Number(tier.tax),
          free: Boolean(tier.free)
        }))
      };

      console.log("Updating event document with data:", updatedEventData);

      // Use setDoc with merge option
      const eventDocRef = doc(db, "events", eventId);
      await setDoc(eventDocRef, updatedEventData, { merge: true });

      console.log("Event successfully updated in Firestore");

      setSnackbar({
        open: true,
        message: "Event updated successfully",
        severity: "success"
      });

      setTimeout(() => {
        navigate(`/vendorhome/${vendorId}`);
      }, 2000);

    } catch (error) {
      console.error("Error updating event:", error);
      setSnackbar({
        open: true,
        message: error.message || "Failed to update event. Please try again.",
        severity: "error"
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <CircularProgress sx={{ color: "#19AEDC" }} />
      </Box>
    );
  }

 return (
  <div>
    <VendorBeforeLogin />
    <Box sx={{ width: "90%", margin: "0 auto", py: 4 }}>
      <Typography variant="h4" sx={{ fontFamily: "Albert Sans", fontWeight: 800, mb: 3 ,fontSize:isMobile ? "1.5rem" : "2rem"}}>
        Update Event
      </Typography>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Box sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}>
            Basic Information
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField fullWidth label="Event Name" name="name" value={eventData.name} onChange={handleChange} required sx={{width:isMobile?"80%":"20%"}}/>
            <TextField fullWidth label="Description" name="description" value={eventData.description} onChange={handleChange} multiline rows={4} sx={{width:isMobile?"80%":"20%"}} required />

            <Box sx={{ display: isMobile ? "block" : "flex", gap: 2 }}>
              <FormControl fullWidth sx={{ mb: isMobile ? 2 : 0,width:isMobile?"80%":"15%" }}>
                <InputLabel>Category</InputLabel>
                <Select
                  multiple
                  name="category"
                  value={eventData.category}
                  onChange={handleCategoryChange}
                  label="Category"
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => <Chip key={value} label={value} />)}
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

              <TextField fullWidth label="Tags (comma separated)" name="tags" value={eventData.tags} onChange={handleChange} sx={{width:isMobile?"80%":"20%"}} />
            </Box>

            <Box sx={{ display: isMobile ? "block" : "flex", gap: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} sx={{width:isMobile?"80%":"20%"}}>
                <DateTimePicker
                  label="Event Date & Time"
                  value={eventData.eventDate}
                  onChange={(date) => handleDateChange("eventDate", date)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>

              <TextField fullWidth label="Media Link (YouTube/Video)" name="mediaLink" value={eventData.mediaLink} onChange={handleChange} sx={{width:isMobile?"80%":"20%",mt:isMobile?1:null}}/>
            </Box>

            <TextField fullWidth label="Contact Email" name="contact" type="email" value={eventData.contact} onChange={handleChange} required sx={{width:isMobile?"80%":"20%"}} />
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
              { label: "Venue Name", name: "venueDetails.venueName", required: true },
              { label: "Street Name", name: "venueDetails.streetName" },
              { label: "Area", name: "venueDetails.area", required: true },
              { label: "City", name: "venueDetails.city", required: true },
              { label: "State", name: "venueDetails.state", required: true },
              { label: "Pincode", name: "venueDetails.pincode", required: true },
            ].map((field) => (
              <TextField
                key={field.name}
                label={field.label}
                name={field.name}
                value={eventData.venueDetails[field.name.split(".")[1]]}
                onChange={handleChange}
                required={field.required}
                sx={{ width: isMobile ? "90%" : "45%" }}
              />
            ))}
          </Box>
         
        </Box>


        {/* Banner Images */}
        <Box sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}>
            Banner Images
          </Typography>

          <Box sx={{ mb: 2 }}>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: "none" }} id="banner-upload" />
            <label htmlFor="banner-upload">
              <Button variant="outlined" component="span" startIcon={<AddIcon />} sx={{ mb: 2 ,color:"#19AEDC"}}>
                Add Images
              </Button>
            </label>
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Current Images:
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
            {eventData.bannerImages.map((image, index) => (
              <Box key={index} sx={{ position: "relative", width: isMobile ? "100%" : "23%" }}>
                <img src={image} alt={`Banner ${index + 1}`} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8 }} />
                <IconButton size="small" sx={{ position: "absolute", top: 5, right: 5, backgroundColor: "rgba(255,255,255,0.7)" }} onClick={() => handleRemoveImage(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}

            {newBannerImages.map((file, index) => (
              <Box key={`new-${index}`} sx={{ position: "relative", width: isMobile ? "100%" : "23%" }}>
                <img src={URL.createObjectURL(file)} alt={`New Banner ${index + 1}`} style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 8 }} />
                <IconButton size="small" sx={{ position: "absolute", top: 5, right: 5, backgroundColor: "rgba(255,255,255,0.7)" }} onClick={() => handleRemoveNewImage(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Ticket Pricing */}
        <Box sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", p: 3 }}>
          <Typography variant="h6" sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}>
            Ticket Pricing
          </Typography>

          {eventData.pricing.map((tier, index) => (
            <Box key={index} sx={{ mb: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 2 }}>
              <Box sx={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 2 }}>
                <TextField fullWidth label="Ticket Type" value={tier.ticketType} onChange={(e) => handlePricingChange(index, "ticketType", e.target.value)} required />
                <TextField fullWidth label="Price" type="number" value={tier.price} onChange={(e) => handlePricingChange(index, "price", Number(e.target.value))} disabled={tier.free} InputProps={{ startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography> }} />
                <TextField fullWidth label="Seats" type="number" value={tier.seats} onChange={(e) => handlePricingChange(index, "seats", Number(e.target.value))} required />
                <TextField fullWidth label="Tax %" type="number" value={tier.tax} onChange={(e) => handlePricingChange(index, "tax", Number(e.target.value))} disabled={tier.free} />
                <IconButton color="error" onClick={() => removePricingTier(index)} sx={{ alignSelf: "center" }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          ))}

          <Button variant="outlined" onClick={addPricingTier} startIcon={<AddIcon />} sx={{color:"#19AEDC"}}>
            Add Tier
          </Button>
        </Box>
        
        <Box sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", p: 3, mb: 3,mt:2 }}>
            <Typography variant="h6" sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}>
              Cancellation Policy
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth sx={{ mb: 2,width:isMobile?180:300 }}>
                  <InputLabel id="category-label">Cancellation Available</InputLabel>
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

              {eventData.cancellationAvailable === "true" || eventData.cancellationAvailable === true ? (
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
                        inputProps: { min: 0 }
                      }}
                      sx={{ mb: 2 }}
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth sx={{ mb: 2,width:isMobile?180:200 }}>
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
                      label={eventData.deductionType === "percentage" ? "Deduction Percentage" : "Deduction Amount"}
                      name="deductionRate"
                      type="number"
                      value={eventData.deductionRate}
                      onChange={handleChange}
                      InputProps={{
                        inputProps: { min: 0 },
                        startAdornment: eventData.deductionType === "fixed" ? <Typography sx={{ mr: 1 }}>₹</Typography> : null,
                        endAdornment: eventData.deductionType === "percentage" ? <Typography sx={{ ml: 1 }}>%</Typography> : null,
                      }}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                </>
              ) : null}
            </Grid>
          </Box>

          <Box sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}>
              Speakers
            </Typography>

            {eventData.speaker.map((speaker, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Speaker ${index + 1}`}
                  value={speaker}
                  onChange={(e) => handleSpeakerChange(index, e.target.value)}
                  sx={{ mr: 2 ,width:isMobile?"80%":"20%"}}
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
              sx={{ mb: 2,color:"#19AEDC" }}
            >
              Add Speaker
            </Button>
          </Box>

          <Box sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}>
              Perks & Amenities
            </Typography>

            {eventData.perks.map((perk, index) => (
              <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <TextField
                  fullWidth
                  label={`Perk ${index + 1}`}
                  value={perk}
                  onChange={(e) => handlePerkChange(index, e.target.value)}
                  sx={{ mr: 2 ,width:isMobile?"80%":"20%"}}
                />
                <IconButton color="error" onClick={() => removePerk(index)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={addPerk}
              sx={{ mb: 2 ,color:"#19AEDC"}}
            >
              Add Perk
            </Button>
          </Box>


        <Box sx={{ backgroundColor: "white", borderRadius: 2, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)", p: 3, mb: 3 }}>
                    <Typography variant="h6" sx={{ fontFamily: "Albert Sans", fontWeight: 600, mb: 2 }}>
                      FAQs
                    </Typography>
        
                    {eventData.FAQ.map((faq, index) => (
                      <Box key={index} sx={{ mb: 3, p: 2, border: "1px solid #e0e0e0", borderRadius: 2,width:isMobile?"80%":"60%" }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <TextField
                              fullWidth
                              label="Question"
                              value={faq.question || ""}
                              onChange={(e) => handleFAQChange(index, "question", e.target.value)}
                              sx={{ mb: 2 ,width:isMobile?"100%":"200%"}}
                            />
                            <TextField
                              fullWidth
                              label="Answer"
                              value={faq.answer || ""}
                              onChange={(e) => handleFAQChange(index, "answer", e.target.value)}
                              multiline
                              rows={2}
                              sx={{ mb: 2 ,width:isMobile?"100%":"200%"}}
                            />
                            <IconButton color="error" onClick={() => removeFAQ(index)}>
                              <DeleteIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Box>
                    ))}
        
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={addFAQ}
                      sx={{ mb: 2,color:"#19AEDC" }}
                    >
                      Add FAQ
                    </Button>
                  </Box>
        
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => navigate(`/vendor/${vendorId}`)}
                      sx={{ fontWeight: 600 }}
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
    </Box>
  </div>
);
};

export default EditEventPage;