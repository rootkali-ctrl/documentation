import { useEffect, useRef, useMemo, useState } from "react";
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
  const { updateFormSection, formData, markStepCompleted  } = useEventContext();

  const [mediaLink, setMediaLink] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);

  const [localData, setLocalData] = useState({
    name: "",
    description: "",
    banner: [],
    eventHost: dayjs(),
    eventDate: dayjs(),
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

    const bannerValid = localData.banner.length === 6;

    return requiredFieldsValid && bannerValid;
  };

  const handleNext = () => {
  if (!isFormValid()) {
    alert("Please fill all required fields and upload exactly 6 banner images.");
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

  const [images, setImages] = useState([]);
  const fileInputRef = useRef(null);

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
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            width: "70%",
            margin: "0 auto",
          }}
        >
          {/*Event overview*/}
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
              Event Overview
            </Typography>
            <Box>
              <Box sx={{ width: "100%", mt: "2%" }}>
                <Typography mb={1} sx={{ fontFamily: "albert sans" }}>
                  Event Banner
                </Typography>

                <Box
                  sx={{
                    width: "80%",
                    maxWidth: 1200,
                    height: 300,
                    maxHeight: "400px",
                    border: "2px dashed #ccc",
                    borderRadius: 4,
                    overflow: "hidden",
                    backgroundColor: "#f9f9f9",
                    mx: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                  }}
                >
                  {images.length > 0 ? (
                    <Carousel
                      navButtonsAlwaysVisible
                      autoPlay={false}
                      animation="slide"
                      indicators={false}
                      sx={{
                        width: "100%",
                        height: "100%",
                      }}
                    >
                      {images.map((img, index) => (
                        <Box
                          key={index}
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            backgroundColor: "#fff",
                          }}
                        >
                          <Box
                            component="img"
                            src={img}
                            alt={`upload-${index}`}
                            sx={{
                              maxWidth: "100%",
                              maxHeight: "100%",
                              objectFit: "contain",
                            }}
                          />
                        </Box>
                      ))}
                    </Carousel>
                  ) : (
                    <Typography
                      variant="subtitle1"
                      color="textSecondary"
                      sx={{ fontFamily: "albert sans" }}
                    >
                      No image uploaded
                    </Typography>
                  )}
                </Box>

                {/* Upload Button - bottom-right */}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 2,
                    width: "90%",
                    mb: "2%",
                  }}
                >
                  <Box sx={{ display: "flex", gap: "2%", width: "60%" }}>
                    <Typography
                      sx={{ margin: "0 auto", fontFamily: "albert sans" }}
                    >
                      Please upload exactly 6 images to continue
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: "40%",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <Button
                      variant="contained"
                      sx={{
                        textTransform: "none",
                        bgcolor: "#19AEDC",
                        fontFamily: "albert sans",
                      }}
                      onClick={() => fileInputRef.current.click()}
                    >
                      Upload Image
                    </Button>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleFileSelect}
                    />
                  </Box>
                </Box>
              </Box>

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
                    selected?.length
                      ? selected.join(" • ")
                      : "Select categories"
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
              }}
            >
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontWeight: "900",
                  fontSize: "28px",
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
                display: "flex",
                flexDirection: "column",
                gap: "2%",
              }}
            >
              {speaker.map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: "flex",
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
                display: "flex",
                width: "95%",
                margin: "0 auto",
                gap: "5%",
                mt: "2%",
              }}
            >
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <FormControl
                  variant="outlined"
                  sx={{ marginBottom: 2, width: "45%" }}
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
                  sx={{ marginBottom: 2, width: "45%" }}
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
      </Box>
    </div>
  );
};

export default CreateEvent;
