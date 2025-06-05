import { useEffect, useRef, useCallback, useState } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  MenuItem,
  OutlinedInput,
  Grid,
  TextField,
  Select,
  useMediaQuery,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContentText,
  DialogContent,
  DialogActions,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTheme } from "@mui/material/styles";
import Carousel from "react-material-ui-carousel";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs"; // for value handling
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { useEventContext } from "./EventContext";
import { useParams } from "react-router-dom";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const { updateFormSection, formData, markStepCompleted } = useEventContext();
  const isMobile = useMediaQuery("(max-width:900px)");
  const [mediaLink, setMediaLink] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [localData, setLocalData] = useState({
    name: "",
    description: "",
    banner: [],
    eventHost: dayjs(),
    eventDate: dayjs(),
  });

  const [imageData, setImageData] = useState({
    eventCard: null,
    banner: null,
    previousEvents: [null, null, null],
    ticket: null,
  });
  const [speaker, setSpeaker] = useState([{ name: "", role: "" }]);
  const [venueDetails, setVenueDetails] = useState({
    venueName: "",
    streetName: "",
    city: "",
    state: "",
    pincode: "",
    area: "",
  });

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

  useEffect(() => {
    if (formData.eventDetails) {
      const {
        speaker = [],
        venueDetails: savedVenue = {},
        ...rest
      } = formData.eventDetails;

      setLocalData((prev) => ({
        ...prev,
        ...rest,
        eventHost: dayjs(rest.eventHost),
        eventDate: dayjs(rest.eventDate),
      }));

      setSpeaker(speaker);

      setVenueDetails({
        venueName: savedVenue.venueName || "",
        streetName: savedVenue.streetName || "",
        city: savedVenue.city || "",
        state: savedVenue.state || "",
        pincode: savedVenue.pincode || "",
        area: savedVenue.area || "",
      });

      setSelectedCategories(formData.eventDetails.category || []);
      setMediaLink(formData.eventDetails.mediaLink || "");
    }
  }, [formData]);

  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

  // New refs for individual upload buttons
  const fileInputRefs = {
    eventCard: useRef(null),
    banner: useRef(null),
    previousEvents: [useRef(null), useRef(null), useRef(null)],
    ticket: useRef(null),
  };

  // Image specifications for different types
  const imageSpecs = {
    eventCard: {
      width: "300px",
      height: "200px",
      label: "Event Card Image",
      description: "300x200px - Main event card display",
    },
    banner: {
      width: "800px",
      height: "300px",
      label: "Banner Image",
      description: "800x300px - Hero banner",
    },
    previousEvents: {
      width: "300px",
      height: "200px",
      label: "Previous Event Images",
      description: "300x200px each - Event gallery",
    },
    ticket: {
      width: "200px",
      height: "400px",
      label: "Ticket Image",
      description: "200x400px - Ticket design",
    },
  };

  // Check if all images are uploaded
  const isImageUploadComplete = () => {
    return !!(
      imageData.eventCard &&
      imageData.banner &&
      imageData.previousEvents.every((img) => img) &&
      imageData.ticket
    );
  };

  const isFormValid = () => {
    const requiredFieldsValid =
      localData.name.trim() !== "" &&
      localData.description.trim() !== "" &&
      localData.eventHost &&
      localData.eventDate &&
      selectedCategories.length > 0 &&
      venueDetails.venueName.trim() !== "" &&
      venueDetails.streetName.trim() !== "" &&
      venueDetails.city.trim() !== "" &&
      venueDetails.state.trim() !== "" &&
      venueDetails.pincode.trim() !== "" &&
      venueDetails.area.trim() !== "";

    const bannerValid = isImageUploadComplete();

    return requiredFieldsValid && bannerValid;
  };

  const handleCategorizedFileSelect =
    (type, index = null) =>
    (event) => {
      const file = event.target.files[0];
      if (!file || !file.type.startsWith("image/")) return;

      const imageUrl = URL.createObjectURL(file);

      setImageData((prev) => {
        let newData = { ...prev };

        if (type === "previousEvents" && index !== null) {
          newData.previousEvents = [...prev.previousEvents];
          newData.previousEvents[index] = { file, url: imageUrl };
        } else {
          newData[type] = { file, url: imageUrl };
        }

        // Update banner array and images for display
        const allFiles = [];
        const allUrls = [];

        // Add files in specific order
        if (newData.eventCard) {
          allFiles.push(newData.eventCard.file);
          allUrls.push(newData.eventCard.url);
        }
        if (newData.banner) {
          allFiles.push(newData.banner.file);
          allUrls.push(newData.banner.url);
        }
        newData.previousEvents.forEach((img) => {
          if (img) {
            allFiles.push(img.file);
            allUrls.push(img.url);
          }
        });
        if (newData.ticket) {
          allFiles.push(newData.ticket.file);
          allUrls.push(newData.ticket.url);
        }

        setLocalData((prevLocal) => ({
          ...prevLocal,
          banner: allFiles,
        }));

        setImages(allUrls);

        return newData;
      });
    };

  // Remove individual images
  const removeImage = (type, index = null) => {
    setImageData((prev) => {
      let newData = { ...prev };

      if (type === "previousEvents" && index !== null) {
        newData.previousEvents = [...prev.previousEvents];
        if (newData.previousEvents[index]) {
          URL.revokeObjectURL(newData.previousEvents[index].url);
          newData.previousEvents[index] = null;
        }
      } else {
        if (newData[type]) {
          URL.revokeObjectURL(newData[type].url);
          newData[type] = null;
        }
      }

      // Update banner array and images
      const allFiles = [];
      const allUrls = [];

      if (newData.eventCard) {
        allFiles.push(newData.eventCard.file);
        allUrls.push(newData.eventCard.url);
      }
      if (newData.banner) {
        allFiles.push(newData.banner.file);
        allUrls.push(newData.banner.url);
      }
      newData.previousEvents.forEach((img) => {
        if (img) {
          allFiles.push(img.file);
          allUrls.push(img.url);
        }
      });
      if (newData.ticket) {
        allFiles.push(newData.ticket.file);
        allUrls.push(newData.ticket.url);
      }

      setLocalData((prevLocal) => ({
        ...prevLocal,
        banner: allFiles,
      }));

      setImages(allUrls);

      return newData;
    });
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);

    const validImages = files
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 6);
    const newImageUrls = validImages.map((file) => URL.createObjectURL(file));

    setImages((prev) => [...prev, ...newImageUrls].slice(0, 6));

    setLocalData((prev) => ({
      ...prev,
      banner: [...validImages].slice(0, 6),
    }));
  };

  // Your existing handleNext function remains the same
  const handleNext = () => {
    if (!isFormValid()) {
      showDialog(
        "Please fill all required fields and upload exactly 6 banner images."
      );

      return;
    }

    const eventData = {
      ...localData,
      speaker,
      eventDate: dayjs(localData.eventDate).toISOString(),
      eventHost: dayjs(localData.eventHost).toISOString(),
      vendorId,
      mediaLink,
      category: selectedCategories,
      venueDetails,
      banner: localData.banner,
    };

    console.log("Event Details on Next Click:", eventData);

    updateFormSection("eventDetails", eventData);

    markStepCompleted("step1");

    navigate(`/createevent/${vendorId}/step2`);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (name, newValue) => {
    setLocalData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleAddSpeaker = () => {
    setSpeaker((prev) => [...prev, { name: "", role: "" }]);
  };

  const handleRemoveSpeaker = (index) => {
    const updated = [...speaker];
    updated.splice(index, 1);
    setSpeaker(updated);
  };

  const handleSpeakerChange = (index, field, value) => {
    const updated = [...speaker];
    updated[index][field] = value;
    setSpeaker(updated);
  };

  const handleVenueChange = (field, value) => {
    setVenueDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCategoryChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedCategories(value);
  };

  const categoryFields = [
    "Music",
    "Workshop",
    "Technology",
    "Business",
    "Education",
    "Health",
    "Sports",
    "Art",
  ];

  const ITEM_HEIGHT = 48;
  const ITEM_PADDING_TOP = 8;
  const MenuProps = {
    PaperProps: {
      style: {
        maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
        width: 250,
      },
    },
  };

  const theme = useTheme();
  const getStyles = (name, selectedCategories, theme) => ({
    fontWeight:
      selectedCategories.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  });

  const fields = [
    {
      label: "Venue/Hotel Name",
      key: "venueName",
      placeholder: "Enter venue name",
    },
    {
      label: "Street Name",
      key: "streetName",
      placeholder: "Enter street address",
    },
    { label: "Area/Locality", key: "area", placeholder: "Enter area" },
    { label: "City", key: "city", placeholder: "Enter city" },
    { label: "State", key: "state", placeholder: "Enter state" },
    { label: "Pincode", key: "pincode", placeholder: "Enter pincode" },
  ];

  // your return JSX here...

  {
    /*} const VenueMap = ({ venueDetails }) => {
    const [center, setCenter] = useState({ lat: 11.0168, lng: 76.9558 }); // Default to Coimbatore
    const [markerPosition, setMarkerPosition] = useState(center);

    const fullAddress = useMemo(() => {
      return `${venueDetails.building || ''}, ${venueDetails.street || ''}, ${venueDetails.city || ''}, ${venueDetails.state || ''}, ${venueDetails.pincode || ''}, ${venueDetails.country || ''}`;
    }, [venueDetails]);

    const { isLoaded, loadError } = useJsApiLoader({
      googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // Replace this
    });

    useEffect(() => {
      const delayDebounceFn = setTimeout(() => {
        if (fullAddress.trim()) {
          axios
            .get(`https://maps.googleapis.com/maps/api/geocode/json`, {
              params: {
                address: fullAddress,
                key: 'YOUR_GOOGLE_MAPS_API_KEY',
              },
            })
            .then((res) => {
              const location = res.data.results[0]?.geometry?.location;
              if (location) {
                setCenter(location);
                setMarkerPosition(location);
              }
            })
            .catch((err) => {
              console.error('Geocoding failed:', err);
            });
        }
      }, 800); // Debounce

      return () => clearTimeout(delayDebounceFn);
    }, [fullAddress]);

    const onMapClick = (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
    };

    if (!isLoaded && !loadError) {
      return (
        <Typography variant="body2">
          Loading map...
        </Typography>
      );
    }

    if (loadError) {
      return (
        <Typography color="error" variant="body2">
          Failed to load map. Please check your API key.
        </Typography>
      );
    }


    return (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={15}
        onClick={onMapClick}
      >
        <Marker position={markerPosition} />
      </GoogleMap>
    );
  };*/
  }

  useEffect(() => {
    setLocalData((prev) => ({
      ...prev,
      category: selectedCategories,
    }));
  }, [selectedCategories]);

  return (
    <div>
      <Box
        sx={{
          backgroundColor: "#F9FAFB",
          minHeight: !isMobile ? "100vh" : null,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: isMobile ? "90%" : "70%",
            margin: "0 auto",
            overflowX: "hidden",
          }}
        >
          {/*Event overview*/}
          <Box
            sx={{
              padding: isMobile ? "2% 4%" : "2% 3%",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              margin: "2% auto",
              boxSizing: "border-box",
              backgroundColor: "white",
              height: "auto",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize: isMobile ? "20px" : "28px",
              }}
            >
              Event Overview
            </Typography>
            <Box>
              <Box sx={{ width: "100%", mt: "2%" }}>
                <Typography
                  mb={2}
                  sx={{
                    fontFamily: "albert sans",
                    fontSize: "18px",
                    fontWeight: "bold",
                  }}
                >
                  Event Images Upload
                </Typography>

                <Typography
                  mb={3}
                  sx={{ fontFamily: "albert sans", color: "#666" }}
                >
                  Please upload all 6 images (1 Event Card + 1 Banner + 3
                  Previous Events + 1 Ticket)
                </Typography>

                {/* Event Card Image */}
                <Box mb={3}>
                  <Typography
                    mb={1}
                    sx={{ fontFamily: "albert sans", fontWeight: "bold" }}
                  >
                    Event Card Image
                  </Typography>
                  <Typography
                    mb={2}
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    300x200px - Main event display
                  </Typography>
                  <Box
                    sx={{
                      width: isMobile ? "90%" : "300px",
                      height: "200px",
                      border: imageData.eventCard
                        ? "2px solid #19AEDC"
                        : "2px dashed #ccc",
                      borderRadius: 4,
                      overflow: "hidden",
                      backgroundColor: imageData.eventCard
                        ? "#f0f9ff"
                        : "#f9f9f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      cursor: !imageData.eventCard ? "pointer" : "default",
                    }}
                    onClick={() =>
                      !imageData.eventCard &&
                      fileInputRefs.eventCard.current.click()
                    }
                  >
                    {imageData.eventCard ? (
                      <>
                        <Box
                          component="img"
                          src={imageData.eventCard.url}
                          alt="Event Card"
                          sx={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                        <IconButton
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "rgba(255,255,255,0.9)",
                            "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage("eventCard");
                          }}
                        >
                          <Typography sx={{ fontSize: "16px" }}>×</Typography>
                        </IconButton>
                      </>
                    ) : (
                      <Typography
                        variant="subtitle1"
                        color="textSecondary"
                        sx={{ fontFamily: "albert sans" }}
                      >
                        Click to upload Event Card
                      </Typography>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRefs.eventCard}
                      style={{ display: "none" }}
                      onChange={handleCategorizedFileSelect("eventCard")}
                    />
                  </Box>
                </Box>

                {/* Banner Image */}
                <Box mb={3}>
                  <Typography
                    mb={1}
                    sx={{ fontFamily: "albert sans", fontWeight: "bold" }}
                  >
                    Banner Image
                  </Typography>
                  <Typography
                    mb={2}
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    800x300px - Hero banner
                  </Typography>
                  <Box
                    sx={{
                      width: isMobile ? "90%" : "80%",
                      maxWidth: 800,
                      height: isMobile ? 200 : 300,
                      border: imageData.banner
                        ? "2px solid #19AEDC"
                        : "2px dashed #ccc",
                      borderRadius: 4,
                      overflow: "hidden",
                      backgroundColor: imageData.banner ? "#f0f9ff" : "#f9f9f9",
                      mx: "auto",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      cursor: !imageData.banner ? "pointer" : "default",
                    }}
                    onClick={() =>
                      !imageData.banner && fileInputRefs.banner.current.click()
                    }
                  >
                    {imageData.banner ? (
                      <>
                        <Box
                          component="img"
                          src={imageData.banner.url}
                          alt="Banner"
                          sx={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                        <IconButton
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "rgba(255,255,255,0.9)",
                            "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage("banner");
                          }}
                        >
                          <Typography sx={{ fontSize: "16px" }}>×</Typography>
                        </IconButton>
                      </>
                    ) : (
                      <Typography
                        variant="subtitle1"
                        color="textSecondary"
                        sx={{ fontFamily: "albert sans" }}
                      >
                        Click to upload Banner
                      </Typography>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRefs.banner}
                      style={{ display: "none" }}
                      onChange={handleCategorizedFileSelect("banner")}
                    />
                  </Box>
                </Box>

                {/* Previous Event Images */}
                <Box mb={3}>
                  <Typography
                    mb={1}
                    sx={{ fontFamily: "albert sans", fontWeight: "bold" }}
                  >
                    Previous Event Images
                  </Typography>
                  <Typography
                    mb={2}
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    300x200px each - Event gallery (3 images required)
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {[0, 1, 2].map((index) => (
                      <Box
                        key={index}
                        sx={{
                          width: isMobile ? "90px" : "300px",
                          height: isMobile ? "60px" : "200px",
                          border: imageData.previousEvents[index]
                            ? "2px solid #19AEDC"
                            : "2px dashed #ccc",
                          borderRadius: 4,
                          overflow: "hidden",
                          backgroundColor: imageData.previousEvents[index]
                            ? "#f0f9ff"
                            : "#f9f9f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          cursor: !imageData.previousEvents[index]
                            ? "pointer"
                            : "default",
                        }}
                        onClick={() =>
                          !imageData.previousEvents[index] &&
                          fileInputRefs.previousEvents[index].current.click()
                        }
                      >
                        {imageData.previousEvents[index] ? (
                          <>
                            <Box
                              component="img"
                              src={imageData.previousEvents[index].url}
                              alt={`Previous Event ${index + 1}`}
                              sx={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                objectFit: "contain",
                              }}
                            />
                            <IconButton
                              sx={{
                                position: "absolute",
                                top: 2,
                                right: 2,
                                bgcolor: "rgba(255,255,255,0.9)",
                                "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                                minWidth: "auto",
                                width: "24px",
                                height: "24px",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage("previousEvents", index);
                              }}
                            >
                              <Typography sx={{ fontSize: "14px" }}>
                                ×
                              </Typography>
                            </IconButton>
                          </>
                        ) : (
                          <Typography
                            variant={isMobile ? "caption" : "subtitle2"}
                            color="textSecondary"
                            sx={{
                              fontFamily: "albert sans",
                              textAlign: "center",
                            }}
                          >
                            Event {index + 1}
                          </Typography>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRefs.previousEvents[index]}
                          style={{ display: "none" }}
                          onChange={handleCategorizedFileSelect(
                            "previousEvents",
                            index
                          )}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Ticket Image */}
                <Box mb={3}>
                  <Typography
                    mb={1}
                    sx={{ fontFamily: "albert sans", fontWeight: "bold" }}
                  >
                    Ticket Image
                  </Typography>
                  <Typography
                    mb={2}
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    200x250px - Ticket design
                  </Typography>
                  <Box
                    sx={{
                      width: isMobile ? "90%" : "200px",
                      height: "250px",
                      border: imageData.ticket
                        ? "2px solid #19AEDC"
                        : "2px dashed #ccc",
                      borderRadius: 4,
                      overflow: "hidden",
                      backgroundColor: imageData.ticket ? "#f0f9ff" : "#f9f9f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      cursor: !imageData.ticket ? "pointer" : "default",
                    }}
                    onClick={() =>
                      !imageData.ticket && fileInputRefs.ticket.current.click()
                    }
                  >
                    {imageData.ticket ? (
                      <>
                        <Box
                          component="img"
                          src={imageData.ticket.url}
                          alt="Ticket"
                          sx={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            objectFit: "contain",
                          }}
                        />
                        <IconButton
                          sx={{
                            position: "absolute",
                            top: 4,
                            right: 4,
                            bgcolor: "rgba(255,255,255,0.9)",
                            "&:hover": { bgcolor: "rgba(255,255,255,1)" },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeImage("ticket");
                          }}
                        >
                          <Typography sx={{ fontSize: "16px" }}>×</Typography>
                        </IconButton>
                      </>
                    ) : (
                      <Typography
                        variant="subtitle1"
                        color="textSecondary"
                        sx={{ fontFamily: "albert sans" }}
                      >
                        Ticket image
                      </Typography>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRefs.ticket}
                      style={{ display: "none" }}
                      onChange={handleCategorizedFileSelect("ticket")}
                    />
                  </Box>
                </Box>

                {/* Progress Indicator */}
                <Box
                  sx={{
                    mt: 3,
                    p: 2,
                    backgroundColor: isImageUploadComplete()
                      ? "#e8f5e8"
                      : "#fff3e0",
                    borderRadius: 2,
                    border: `1px solid ${
                      isImageUploadComplete() ? "#4caf50" : "#ff9800"
                    }`,
                    mb: 2,
                  }}
                >
                  <Typography
                    sx={{ fontFamily: "albert sans", fontWeight: "bold" }}
                  >
                    Progress:{" "}
                    {Object.values(imageData).flat().filter(Boolean).length}/6
                    images uploaded
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    {isImageUploadComplete()
                      ? "All images uploaded! You can proceed to the next step."
                      : "Please upload all required images to continue."}
                  </Typography>
                </Box>

                {/* Keep your existing upload button for fallback */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                    width: "90%",
                    mb: "2%",
                  }}
                ></Box>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              padding: "2% 3%",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              margin: "2% auto",
              boxSizing: "border-box",
              backgroundColor: "white",
              height: "auto",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <FormControl fullWidth variant="outlined">
              <Typography
                variant="subtitle2"
                sx={{
                  marginBottom: "6px",
                  color: "#666",
                  fontWeight: 500,
                  fontFamily: "Albert Sans",
                }}
              >
                Event title
              </Typography>
              <OutlinedInput
                name="name"
                value={localData.name}
                onChange={handleChange}
                placeholder="Enter a catchy title"
                sx={{
                  width: "90%",
                  height: "40px",
                  fontFamily: "Albert Sans",
                  "&::placeholder": {
                    fontFamily: "Albert Sans",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#19AEDC",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ccc",
                  },
                }}
              />
            </FormControl>

            <FormControl fullWidth variant="outlined" sx={{ mt: "2%" }}>
              <Typography
                variant="subtitle2"
                sx={{
                  marginBottom: "6px",
                  color: "#666",
                  fontWeight: 500,
                  fontFamily: "Albert Sans",
                }}
              >
                Event Description
              </Typography>

              <TextField
                name="description"
                value={localData.description}
                onChange={handleChange}
                placeholder="Describe your event..."
                variant="outlined"
                multiline
                minRows={3}
                fullWidth
                InputProps={{
                  sx: {
                    width: "90%",
                    fontFamily: "Albert Sans",
                    "&::placeholder": {
                      fontFamily: "Albert Sans",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#19AEDC",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ccc",
                    },
                  },
                }}
              />

              {/* Word count display */}
              {/* <Typography
                variant="caption"
                sx={{
                  mt: '4px',
                  ml: '2px',
                  color: countWords(desp) > 1000 ? 'error.main' : 'text.secondary',
                  fontFamily: 'Albert Sans',
                }}
              >
                {countWords(desp)} / 1000 words
              </Typography> */}
            </FormControl>

            <FormControl fullWidth variant="outlined">
              <Typography
                variant="subtitle2"
                sx={{
                  mt: "2%",
                  color: "#666",
                  fontWeight: 500,
                  fontFamily: "Albert Sans",
                }}
              >
                Upload media link
              </Typography>
              <OutlinedInput
                name="mediaLink"
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                fullWidth
                placeholder="https://youtube.com/..."
                sx={{
                  width: "90%",
                  height: "40px",
                  fontFamily: "Albert Sans",
                  "&::placeholder": {
                    fontFamily: "Albert Sans",
                  },
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#19AEDC",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ccc",
                  },
                }}
              />
            </FormControl>

            <FormControl sx={{ width: "90%" }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mt: "2%",
                  color: "#666",
                  fontWeight: 500,
                  fontFamily: "Albert Sans",
                }}
              >
                Event Category
              </Typography>
              <Select
                sx={{
                  height: "50px",
                  mt: "1%",
                  fontFamily: "albert sans",
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#19AEDC",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ccc",
                  },
                }}
                labelId="category-chip-label"
                id="category-chip"
                multiple
                value={selectedCategories || []}
                onChange={handleCategoryChange}
                renderValue={(selected) =>
                  selected?.length ? selected.join(" • ") : "Select categories"
                }
                MenuProps={MenuProps}
                input={<OutlinedInput id="select-multiple-chip" />}
                displayEmpty
              >
                {categoryFields.map((name) => (
                  <MenuItem
                    sx={{ fontFamily: "albert sans" }}
                    key={name}
                    value={name}
                    style={getStyles(name, selectedCategories, theme)}
                  >
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/*Speaker and hosts*/}
          <Box
            sx={{
              padding: "2% 3%",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              margin: "2% auto",
              boxSizing: "border-box",
              backgroundColor: "white",
              height: "auto",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                mb: "2%",
                alignItems: "center",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontWeight: "900",
                  fontSize: isMobile ? "16px" : "28px",
                }}
              >
                Speakers and Hosts (Optional)
              </Typography>
              <Button
                onClick={handleAddSpeaker}
                sx={{
                  textTransform: "none",
                  color: "#19AEDC",
                  fontFamily: "Albert Sans",
                }}
              >
                + Add speaker
              </Button>
            </Box>

            <Box
              sx={{
                border: "1px solid #E5E7EB",
                borderRadius: "10px",
                padding: "2% 3%",
                minHeight: isMobile ? 30 : null,
                height: isMobile ? "auto" : null,
                display: "flex",
                flexDirection: "column",
                gap: "2%",
              }}
            >
              {speaker.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: isMobile ? "block" : "flex",
                    gap: "3%",
                    alignItems: "flex-end",
                  }}
                >
                  <FormControl fullWidth variant="outlined">
                    <Typography
                      variant="subtitle2"
                      sx={{
                        marginBottom: "6px",
                        color: "#666",
                        fontWeight: 500,
                        fontFamily: "Albert Sans",
                      }}
                    >
                      Name
                    </Typography>
                    <OutlinedInput
                      placeholder="Enter speaker name"
                      value={speaker[index].name}
                      onChange={(e) =>
                        handleSpeakerChange(index, "name", e.target.value)
                      }
                      sx={{
                        width: "100%",
                        height: "40px",
                        fontFamily: "Albert Sans",
                        "&::placeholder": {
                          fontFamily: "Albert Sans",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#19AEDC",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#ccc",
                        },
                      }}
                    />
                  </FormControl>

                  <FormControl fullWidth variant="outlined">
                    <Typography
                      variant="subtitle2"
                      sx={{
                        marginBottom: "6px",
                        color: "#666",
                        fontWeight: 500,
                        fontFamily: "Albert Sans",
                        mt: isMobile ? "10px" : "0px",
                      }}
                    >
                      Role/Designation of speaker
                    </Typography>
                    <OutlinedInput
                      placeholder="e.g., Host, DJ, Speaker"
                      value={speaker[index].role}
                      onChange={(e) =>
                        handleSpeakerChange(index, "role", e.target.value)
                      }
                      sx={{
                        width: "100%",
                        height: "40px",
                        fontFamily: "Albert Sans",
                        "&::placeholder": {
                          fontFamily: "Albert Sans",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#19AEDC",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#ccc",
                        },
                      }}
                    />
                  </FormControl>

                  <DeleteIcon
                    sx={{
                      color: "gray",
                      cursor: "pointer",
                      "&:hover": { color: "red" },
                      mb: "8px",
                      mt: isMobile ? "10px" : "0px",
                    }}
                    onClick={() => handleRemoveSpeaker(index)}
                  />
                </Box>
              ))}
            </Box>
          </Box>

          {/*Date and time*/}
          <Box
            sx={{
              padding: "2% 3%",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              margin: "2% auto",
              boxSizing: "border-box",
              backgroundColor: "white",
              height: "auto",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize: "28px",
              }}
            >
              Event Schedule
            </Typography>
            <Box
              sx={{
                display: isMobile ? "block" : "flex",
                width: isMobile ? "100%" : "95%",
                margin: "0 auto",
                gap: "5%",
                mt: "2%",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <FormControl
                  variant="outlined"
                  sx={{ marginBottom: 2, width: isMobile ? "90%" : "45%" }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      marginBottom: "6px",
                      color: "#666",
                      fontWeight: 500,
                      fontFamily: "Albert Sans",
                    }}
                  >
                    Start Date & Time
                  </Typography>

                  <DateTimePicker
                    value={dayjs(localData.eventDate)}
                    onChange={(newValue) =>
                      handleDateChange("eventDate", newValue)
                    }
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        placeholder: "Select date and time",
                        sx: {
                          fontFamily: "Albert Sans",
                          "& .MuiOutlinedInput-root": {
                            height: "36px", // Set desired height
                            fontFamily: "Albert Sans",
                          },
                          "& input": {
                            padding: "8px 12px", // Reduce inner spacing
                            fontSize: "14px",
                            fontFamily: "Albert Sans",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#ccc",
                          },
                          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                            {
                              borderColor: "#19AEDC",
                            },
                        },
                      },
                    }}
                  />
                </FormControl>
              </LocalizationProvider>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <FormControl
                  variant="outlined"
                  sx={{
                    marginBottom: 2,
                    width: "45%",
                    width: isMobile ? "90%" : "45%",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      marginBottom: "6px",
                      color: "#666",
                      fontWeight: 500,
                      fontFamily: "Albert Sans",
                    }}
                  >
                    Event Host date (Bookings open date)
                  </Typography>

                  <DateTimePicker
                    value={dayjs(localData.eventHost)}
                    onChange={(newValue) =>
                      handleDateChange("eventHost", newValue)
                    }
                    slotProps={{
                      textField: {
                        variant: "outlined",
                        placeholder: "Select date and time",
                        sx: {
                          fontFamily: "Albert Sans",
                          "& .MuiOutlinedInput-root": {
                            height: "36px", // Set desired height
                            fontFamily: "Albert Sans",
                          },
                          "& input": {
                            padding: "8px 12px", // Reduce inner spacing
                            fontSize: "14px",
                            fontFamily: "Albert Sans",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#ccc",
                          },
                          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                            {
                              borderColor: "#19AEDC",
                            },
                        },
                      },
                    }}
                  />
                </FormControl>
              </LocalizationProvider>
            </Box>
          </Box>

          {/*Venue details*/}
          <Box
            sx={{
              padding: "2% 3%",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              margin: "2% auto",
              boxSizing: "border-box",
              backgroundColor: "white",
              height: "auto",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            }}
          >
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize: "28px",
              }}
            >
              Venue Details
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, mt: "2%" }}>
              {fields.map((field) => (
                <Box
                  key={field.key}
                  sx={{
                    flex: "1 1 calc(50% - 12px)", // 2 fields per row with some spacing
                    minWidth: "300px", // fallback on smaller screens
                  }}
                >
                  <FormControl fullWidth variant="outlined">
                    <Typography
                      variant="subtitle2"
                      sx={{
                        marginBottom: "6px",
                        color: "#666",
                        fontWeight: 500,
                        fontFamily: "Albert Sans",
                      }}
                    >
                      {field.label}
                    </Typography>
                    <OutlinedInput
                      placeholder={field.placeholder}
                      value={venueDetails[field.key]}
                      onChange={(e) =>
                        handleVenueChange(field.key, e.target.value)
                      }
                      sx={{
                        height: "40px",
                        fontFamily: "Albert Sans",
                        "&::placeholder": {
                          fontFamily: "Albert Sans",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#ccc",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#19AEDC",
                        },
                      }}
                    />
                  </FormControl>
                </Box>
              ))}
            </Box>

            {/* <VenueMap venueDetails={venueDetails} /> */}
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            width: "95%",
            margin: "2% 0 2% 0",
          }}
        >
          <Button
            onClick={handleNext}
            disabled={!isFormValid()}
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: "#19AEDC",
              fontFamily: "albert sans",
              fontSize: "17px",
            }}
          >
            Save and continue
          </Button>
        </Box>
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

export default CreateEvent;
