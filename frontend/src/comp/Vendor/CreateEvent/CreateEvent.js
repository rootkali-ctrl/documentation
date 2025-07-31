import { useEffect, useRef, useCallback, useState, createRef } from "react";
import {
  Box,
  Typography,
  Button,
  FormControl,
  MenuItem,
  OutlinedInput,
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
import { useTheme } from "@mui/material/styles";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useNavigate, useParams } from "react-router-dom";
import { useEventContext } from "./EventContext";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const { updateFormSection, formData, markStepCompleted } = useEventContext();
  const isMobile = useMediaQuery("(max-width:900px)");
  const [mediaLink, setMediaLink] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const theme = useTheme();

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
    previousEvents: Array(6).fill(null),
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

  const [validationTriggered, setValidationTriggered] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});

  // Refs for all input fields
  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const eventDateRef = useRef(null);
  const eventHostRef = useRef(null);
  const categoryRef = useRef(null);
  const venueNameRef = useRef(null);
  const streetNameRef = useRef(null);
  const cityRef = useRef(null);
  const stateRef = useRef(null);
  const pincodeRef = useRef(null);
  const areaRef = useRef(null);
  const eventCardRef = useRef(null);
  const bannerRef = useRef(null);
  const ticketRef = useRef(null);
  const speakerRefs = useRef([]);

  const fileInputRefs = {
    eventCard: useRef(null),
    banner: useRef(null),
    previousEvents: [
      useRef(null),
      useRef(null),
      useRef(null),
      useRef(null),
      useRef(null),
      useRef(null),
    ],
    ticket: useRef(null),
  };

  const [images, setImages] = useState([]);

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
        bannerImages: savedBannerImages = [],
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

      const newImageData = {
        eventCard: null,
        banner: null,
        previousEvents: Array(6).fill(null),
        ticket: null,
      };

      if (savedBannerImages[0]) newImageData.eventCard = { url: savedBannerImages[0], file: null };
      if (savedBannerImages[1]) newImageData.banner = { url: savedBannerImages[1], file: null };
      for (let i = 0; i < 6; i++) {
        if (savedBannerImages[2 + i]) {
          newImageData.previousEvents[i] = { url: savedBannerImages[2 + i], file: null };
        }
      }
      if (savedBannerImages[8]) newImageData.ticket = { url: savedBannerImages[8], file: null };

      setImageData(newImageData);

      const allFiles = [];
      const allUrls = [];
      if (newImageData.eventCard && newImageData.eventCard.file) allFiles.push(newImageData.eventCard.file);
      if (newImageData.eventCard && newImageData.eventCard.url) allUrls.push(newImageData.eventCard.url);

      if (newImageData.banner && newImageData.banner.file) allFiles.push(newImageData.banner.file);
      if (newImageData.banner && newImageData.banner.url) allUrls.push(newImageData.banner.url);

      newImageData.previousEvents.forEach((img) => {
        if (img && img.file) allFiles.push(img.file);
        if (img && img.url) allUrls.push(img.url);
      });

      if (newImageData.ticket && newImageData.ticket.file) allFiles.push(newImageData.ticket.file);
      if (newImageData.ticket && newImageData.ticket.url) allUrls.push(newImageData.ticket.url);

      setLocalData((prevLocal) => ({
        ...prevLocal,
        banner: allFiles,
      }));
      setImages(allUrls);
    }
  }, [formData]);

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
      description: "300x200px each - Event gallery (6 images required)",
    },
    ticket: {
      width: "200px",
      height: "250px",
      label: "Ticket Image",
      description: "200x250px - Ticket design",
    },
  };

  const isImageUploadComplete = () => {
    return (
      !!imageData.eventCard &&
      !!imageData.banner &&
      imageData.previousEvents.every((img) => img !== null) &&
      !!imageData.ticket
    );
  };

  const validateForm = () => {
    const newInvalidFields = {};
    let isValid = true;
    let firstInvalidField = null;

    // Check Event Overview fields
    if (localData.name.trim() === "") {
      newInvalidFields.name = true;
      isValid = false;
      if (!firstInvalidField) firstInvalidField = 'name';
    }
    if (localData.description.trim() === "") {
      newInvalidFields.description = true;
      isValid = false;
      if (!firstInvalidField) firstInvalidField = 'description';
    }
    if (!localData.eventHost || !dayjs(localData.eventHost).isValid()) {
      newInvalidFields.eventHost = true;
      isValid = false;
      if (!firstInvalidField) firstInvalidField = 'eventHost';
    }
    if (!localData.eventDate || !dayjs(localData.eventDate).isValid()) {
      newInvalidFields.eventDate = true;
      isValid = false;
      if (!firstInvalidField) firstInvalidField = 'eventDate';
    }
    if (selectedCategories.length === 0) {
      newInvalidFields.category = true;
      isValid = false;
      if (!firstInvalidField) firstInvalidField = 'category';
    }
    if (!isImageUploadComplete()) {
      newInvalidFields.images = true;
      isValid = false;
      if (!firstInvalidField) {
        if (!imageData.eventCard) firstInvalidField = 'eventCard';
        else if (!imageData.banner) firstInvalidField = 'banner';
        else if (!imageData.ticket) firstInvalidField = 'ticket';
        else {
          const emptyPrevEventIndex = imageData.previousEvents.findIndex(img => !img);
          if (emptyPrevEventIndex !== -1) firstInvalidField = `previousEvents${emptyPrevEventIndex}`;
        }
      }
    }

    // Check Venue Details fields
    const fields = [
      { key: "venueName" },
      { key: "streetName" },
      { key: "area" },
      { key: "city" },
      { key: "state" },
      { key: "pincode" },
    ];
    fields.forEach(field => {
      if (venueDetails[field.key].trim() === "") {
        newInvalidFields[field.key] = true;
        isValid = false;
        if (!firstInvalidField) firstInvalidField = field.key;
      }
    });

    // Check Speaker fields
    speaker.forEach((s, index) => {
      if (s.name.trim() === '') {
        newInvalidFields[`speakerName${index}`] = true;
        isValid = false;
        if (!firstInvalidField) firstInvalidField = `speakerName${index}`;
      }
      if (s.role.trim() === '') {
        newInvalidFields[`speakerRole${index}`] = true;
        isValid = false;
        if (!firstInvalidField) firstInvalidField = `speakerRole${index}`;
      }
    });

    setInvalidFields(newInvalidFields);
    return { isValid, firstInvalidField };
  };

  const handleCategorizedFileSelect = (type, index = null) => (event) => {
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

      if (validationTriggered) {
        validateForm();
      }

      return newData;
    });
    event.target.value = null;
  };

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

      if (validationTriggered) {
        validateForm();
      }

      return newData;
    });
  };

  const handleNext = () => {
    setValidationTriggered(true);
    const { isValid, firstInvalidField } = validateForm();

    if (isValid) {
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
    } else {
      showDialog("Please fill all required fields before proceeding.");

      // Scroll to the first invalid field
      const refs = {
        name: nameRef,
        description: descriptionRef,
        eventHost: eventHostRef,
        eventDate: eventDateRef,
        category: categoryRef,
        venueName: venueNameRef,
        streetName: streetNameRef,
        area: areaRef,
        city: cityRef,
        state: stateRef,
        pincode: pincodeRef,
        eventCard: eventCardRef,
        banner: bannerRef,
        ticket: ticketRef,
        ...fileInputRefs.previousEvents.reduce((acc, ref, index) => ({
          ...acc,
          [`previousEvents${index}`]: ref
        }), {}),
        ...speakerRefs.current.reduce((acc, { nameRef, roleRef }, index) => ({
          ...acc,
          [`speakerName${index}`]: nameRef,
          [`speakerRole${index}`]: roleRef
        }), {}),
      };

      if (firstInvalidField && refs[firstInvalidField] && refs[firstInvalidField].current) {
        refs[firstInvalidField].current.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [name]: value.trim() === "" }));
    }
  };

  const handleDateChange = (name, newValue) => {
    setLocalData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [name]: !newValue || !dayjs(newValue).isValid() }));
    }
  };

  const handleAddSpeaker = () => {
    setSpeaker((prev) => [...prev, { name: "", role: "" }]);
    speakerRefs.current.push({ nameRef: createRef(), roleRef: createRef() });
    if (validationTriggered) {
      validateForm();
    }
  };

  const handleRemoveSpeaker = (index) => {
    const updated = [...speaker];
    updated.splice(index, 1);
    setSpeaker(updated);
    speakerRefs.current.splice(index, 1);
    if (validationTriggered) {
      validateForm();
    }
  };

  const handleSpeakerChange = (index, field, value) => {
    const updated = [...speaker];
    updated[index][field] = value;
    setSpeaker(updated);
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [`speaker${field}${index}`]: value.trim() === '' }));
    }
  };

  const handleVenueChange = (field, value) => {
    setVenueDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [field]: value.trim() === "" }));
    }
  };

  const handleCategoryChange = (event) => {
    const { target: { value } } = event;
    setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, category: (typeof value === 'string' ? value.split(',') : value).length === 0 }));
    }
  };

  const categoryFields = [
    "Music", "Workshop", "Technology", "Business", "Education", "Health", "Sports", "Art",
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

  const getStyles = (name, selectedCategories, theme) => ({
    fontWeight:
      selectedCategories.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  });

  const fields = [
    { label: "Venue/Hotel Name", key: "venueName", placeholder: "Enter venue name", ref: venueNameRef },
    { label: "Street Name", key: "streetName", placeholder: "Enter street address", ref: streetNameRef },
    { label: "Area/Locality", key: "area", placeholder: "Enter area", ref: areaRef },
    { label: "City", key: "city", placeholder: "Enter city", ref: cityRef },
    { label: "State", key: "state", placeholder: "Enter state", ref: stateRef },
    { label: "Pincode", key: "pincode", placeholder: "Enter pincode", ref: pincodeRef },
  ];

  useEffect(() => {
    setLocalData((prev) => ({
      ...prev,
      category: selectedCategories,
    }));
  }, [selectedCategories]);

  // Initialize speaker refs
  useEffect(() => {
    speakerRefs.current = speaker.map((_, index) => ({
      nameRef: createRef(),
      roleRef: createRef(),
    }));
  }, [speaker.length]);

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
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: isMobile ? "90%" : "70%",
            margin: "0 auto",
            overflowX: "hidden",
          }}
        >
          {/* Event Overview */}
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
                  Please upload all 9 images (1 Event Card + 1 Banner + 6 Previous Events + 1 Ticket)
                </Typography>

                {/* Event Card Image */}
                <Box mb={3} ref={eventCardRef}>
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
                    {imageSpecs.eventCard.description}
                  </Typography>
                  <Box
                    sx={{
                      width: isMobile ? "90%" : imageSpecs.eventCard.width,
                      height: imageSpecs.eventCard.height,
                      border: validationTriggered && !imageData.eventCard
                        ? "2px solid red"
                        : imageData.eventCard
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
                <Box mb={3} ref={bannerRef}>
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
                    {imageSpecs.banner.description}
                  </Typography>
                  <Box
                    sx={{
                      width: isMobile ? "90%" : imageSpecs.banner.width,
                      maxWidth: imageSpecs.banner.width,
                      height: isMobile ? 200 : imageSpecs.banner.height,
                      border: validationTriggered && !imageData.banner
                        ? "2px solid red"
                        : imageData.banner
                        ? "2px solid #19AEDC"
                        : "2px dashed #ccc",
                      borderRadius: 4,
                      overflow: "hidden",
                      backgroundColor: imageData.banner ? "#f0f9ff" : "#f9f9f9",
                      mx: isMobile ? "auto" : "0",
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
                    {imageSpecs.previousEvents.description}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {[...Array(6)].map((_, index) => (
                      <>
                        <Box
                          key={index}
                          sx={{
                            width: isMobile ? "90px" : imageSpecs.previousEvents.width,
                            height: isMobile ? "60px" : imageSpecs.previousEvents.height,
                            border: validationTriggered && !imageData.previousEvents[index]
                              ? "2px solid red"
                              : imageData.previousEvents[index]
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
                          onClick={() => {
                            if (!imageData.previousEvents[index] && fileInputRefs.previousEvents[index].current) {
                              fileInputRefs.previousEvents[index].current.click();
                            }
                          }}
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
                        </Box>
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRefs.previousEvents[index]}
                          style={{ display: "none" }}
                          onChange={handleCategorizedFileSelect("previousEvents", index)}
                        />
                      </>
                    ))}
                  </Box>
                </Box>

                {/* Ticket Image */}
                <Box mb={3} ref={ticketRef}>
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
                    {imageSpecs.ticket.description}
                  </Typography>
                  <Box
                    sx={{
                      width: isMobile ? "90%" : imageSpecs.ticket.width,
                      height: imageSpecs.ticket.height,
                      border: validationTriggered && !imageData.ticket
                        ? "2px solid red"
                        : imageData.ticket
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
                    {
                      (imageData.eventCard ? 1 : 0) +
                      (imageData.banner ? 1 : 0) +
                      imageData.previousEvents.filter(Boolean).length +
                      (imageData.ticket ? 1 : 0)
                    }/9{" "}
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
                inputRef={nameRef}
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
                    borderColor: validationTriggered && invalidFields.name ? "red" : "#ccc",
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
                inputRef={descriptionRef}
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
                      borderColor: validationTriggered && invalidFields.description ? "red" : "#ccc",
                    },
                  },
                }}
              />
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
                Upload media link (Optional)
              </Typography>
              <OutlinedInput
                name="mediaLink"
                value={mediaLink}
                onChange={(e) => setMediaLink(e.target.value)}
                fullWidth
                placeholder="e.g., http://googleusercontent.com/youtube.com/7"
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

            <FormControl sx={{ width: "90%" }} ref={categoryRef}>
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
                    borderColor: validationTriggered && invalidFields.category ? "red" : "#ccc",
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

          {/* Speaker and Hosts */}
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
              {speaker.map((s, index) => (
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
                      value={s.name}
                      onChange={(e) =>
                        handleSpeakerChange(index, "name", e.target.value)
                      }
                      inputRef={speakerRefs.current[index]?.nameRef}
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
                          borderColor: validationTriggered && invalidFields[`speakerName${index}`] ? "red" : "#ccc",
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
                      value={s.role}
                      onChange={(e) =>
                        handleSpeakerChange(index, "role", e.target.value)
                      }
                      inputRef={speakerRefs.current[index]?.roleRef}
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
                          borderColor: validationTriggered && invalidFields[`speakerRole${index}`] ? "red" : "#ccc",
                        },
                      }}
                    />
                  </FormControl>

                  <IconButton
                    sx={{
                      color: "gray",
                      cursor: "pointer",
                      "&:hover": { color: "red" },
                      mb: "8px",
                      mt: isMobile ? "10px" : "0px",
                    }}
                    onClick={() => handleRemoveSpeaker(index)}
                  >
                    <Typography sx={{ fontSize: "16px" }}>×</Typography>
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Date and Time */}
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
                        inputRef: eventDateRef,
                        sx: {
                          fontFamily: "Albert Sans",
                          "& .MuiOutlinedInput-root": {
                            height: "36px",
                            fontFamily: "Albert Sans",
                            borderColor: validationTriggered && invalidFields.eventDate ? "red" : "#ccc",
                          },
                          "& input": {
                            padding: "8px 12px",
                            fontSize: "14px",
                            fontFamily: "Albert Sans",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: validationTriggered && invalidFields.eventDate ? "red" : "#ccc",
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
                        inputRef: eventHostRef,
                        sx: {
                          fontFamily: "Albert Sans",
                          "& .MuiOutlinedInput-root": {
                            height: "36px",
                            fontFamily: "Albert Sans",
                            borderColor: validationTriggered && invalidFields.eventHost ? "red" : "#ccc",
                          },
                          "& input": {
                            padding: "8px 12px",
                            fontSize: "14px",
                            fontFamily: "Albert Sans",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: validationTriggered && invalidFields.eventHost ? "red" : "#ccc",
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

          {/* Venue Details */}
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
                    flex: "1 1 calc(50% - 12px)",
                    minWidth: "300px",
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
                      inputRef={field.ref}
                      sx={{
                        height: "40px",
                        fontFamily: "Albert Sans",
                        "&::placeholder": {
                          fontFamily: "Albert Sans",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: validationTriggered && invalidFields[field.key] ? "red" : "#ccc",
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
          sx={{ zIndex: 9999 }}
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