import { useEffect, useRef, useCallback, useState, createRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  OutlinedInput,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import DeleteIcon from "@mui/icons-material/Delete";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { useEventContext } from "./EventContext";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

const PricePerk = () => {
  const { vendorId } = useParams();
  const {
    formData,
    setFormData,
    markStepCompleted,
    shouldRedirectToStep1,
    stepCompletion,
  } = useEventContext();
  const isMobile = useMediaQuery("(max-width:900px)");
  const navigate = useNavigate();

  // Redirect logic for reload detection and step validation
  useEffect(() => {
    // Redirect to step 1 if page was reloaded
    if (shouldRedirectToStep1()) {
      navigate(`/createevent/${vendorId}/step1`);
      return;
    }

    // Redirect to step 1 if step 1 is not completed or required data is missing
    if (
      !stepCompletion.step1 ||
      !formData.eventDetails?.name ||
      Object.keys(formData.eventDetails || {}).length === 0
    ) {
      navigate(`/createevent/${vendorId}/step1`);
      return;
    }
  }, [shouldRedirectToStep1, stepCompletion.step1, formData, navigate, vendorId]);

  // Global tax state to control all tickets
  const [globalTax, setGlobalTax] = useState(false);

  const [ticket, setTicket] = useState([
    {
      ticketType: "",
      features: "",
      price: "",
      tax: false,
      freeEvent: false,
      seats: "",
    },
  ]);

  const [coupon, setCoupon] = useState([]);

  const [item, setItem] = useState([]);

  const [validationTriggered, setValidationTriggered] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});

  // Helper function to check if any field in an object has data
  const hasAnyData = (obj) => {
    return Object.values(obj).some(value => {
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      if (dayjs.isDayjs(value)) {
        return value.isValid();
      }
      return value !== null && value !== undefined && value !== '';
    });
  };

  // Helper function to check if any coupon has data
  const hasAnyCouponData = (coupons) => {
    return coupons.some(coupon => {
      return coupon.couponCode.trim() !== '' ||
             coupon.reducePert.trim() !== '' ||
             coupon.couponLimits.trim() !== '' ||
             (dayjs(coupon.startTime).isValid() && !dayjs(coupon.startTime).isSame(dayjs(), 'day')) ||
             (dayjs(coupon.endTime).isValid() && !dayjs(coupon.endTime).isSame(dayjs(), 'day'));
    });
  };

  // Helper function to check if any addon has data
  const hasAnyAddonData = (addons) => {
    return addons.some(addon => {
      return addon.itemName.trim() !== '' ||
             addon.price.trim() !== '' ||
             addon.limit.trim() !== '';
    });
  };

  useEffect(() => {
    if (formData?.pricing) {
      // Initialize tickets with values from formData
      if (formData.pricing.tickets?.length) {
        setTicket(formData.pricing.tickets);

        // Set globalTax based on the first ticket's tax value
        const firstTicketTax =
          typeof formData.pricing.tickets[0].tax === "boolean"
            ? formData.pricing.tickets[0].tax
            : false;
        setGlobalTax(firstTicketTax);

        // Make sure all tickets have the same tax value
        const syncedTickets = formData.pricing.tickets.map((t) => ({
          ...t,
          tax: firstTicketTax,
        }));
        setTicket(syncedTickets);
      } else {
        // If no tickets in formData, ensure at least one empty ticket is present
        setTicket([{
          ticketType: "",
          features: "",
          price: "",
          tax: false,
          freeEvent: false,
          seats: "",
        }]);
      }

      // Initialize coupons - only if they exist in formData
      if (formData.pricing.coupons?.length) {
        setCoupon(formData.pricing.coupons.map(c => ({
          ...c,
          startTime: dayjs(c.startTime),
          endTime: dayjs(c.endTime)
        })));
      } else {
        setCoupon([]);
      }

      // Initialize addons - only if they exist in formData
      if (formData.pricing.addons?.length) {
        setItem(formData.pricing.addons.map((a) => ({
          itemName: a.itemName || "",
          price: a.price || "",
          limit: a.limit || "",
          url: a.url || "",
        })));
      } else {
        setItem([]);
      }
    }
  }, [formData]);

  // Handler for text input changes (Ticket, Addon, Coupon)
  const handleChange = (setter, index, field, value, validationKey) => {
    setter(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [validationKey]: value.trim() === "" }));
    }
  };

  // Specific handler for ticket price (with numeric validation)
  const handlePriceChange = (index, value, validationKey) => {
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") { // Allows empty string or valid decimal
      handleTicketChange(index, "price", value);
    }
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [validationKey]: value.trim() === "" }));
    }
  };

  // Specific handler for seats (numeric validation)
  const handleSeatsChange = (index, value, validationKey) => {
    if (/^\d*$/.test(value) || value === "") { // Only allows whole numbers or empty string
      handleTicketChange(index, "seats", value);
    }
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [validationKey]: value.trim() === "" }));
    }
  };

  // Specific handler for addon price (numeric validation)
  const handleAddonPriceChange = (index, value, validationKey) => {
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") { // Allows empty string or valid decimal
      handleAddonChange(index, "price", value);
    }
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [validationKey]: value.trim() === "" }));
    }
  };

  // Specific handler for addon limit (numeric validation)
  const handleAddonLimitChange = (index, value, validationKey) => {
    if (/^\d*$/.test(value) || value === "") { // Only allows whole numbers or empty string
      handleAddonChange(index, "limit", value);
    }
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [validationKey]: value.trim() === "" }));
    }
  };

  // Specific handler for coupon reducePert (numeric validation)
  const handleCouponReducePertChange = (index, value, validationKey) => {
    if (/^\d*\.?\d{0,2}$/.test(value) || value === "") { // Allows empty string or valid decimal
      handleCouponChange(index, "reducePert", value);
    }
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [validationKey]: value.trim() === "" }));
    }
  };

  // Specific handler for coupon limits (numeric validation)
  const handleCouponLimitsChange = (index, value, validationKey) => {
    if (/^\d*$/.test(value) || value === "") { // Only allows whole numbers or empty string
      handleCouponChange(index, "couponLimits", value);
    }
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [validationKey]: value.trim() === "" }));
    }
  };

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...ticket];
    updatedTickets[index][field] = value;

    if (field === "price" && value !== "0") {
      updatedTickets[index].freeEvent = false;
    }

    setTicket(updatedTickets);
    if (validationTriggered) {
      validateForm(); // Re-validate on change if triggered
    }
  };

  const handleFreeCheckbox = (index, isChecked) => {
    const updatedTickets = [...ticket];
    updatedTickets[index].freeEvent = isChecked;

    if (isChecked) {
      updatedTickets[index].price = "0";
      // Clear price validation error if it was free
      setInvalidFields(prev => ({ ...prev, [`price${index}`]: false }));
    } else {
      // If unchecked, and price is still "0", you might want to mark it invalid if required
      if (updatedTickets[index].price === "0" && validationTriggered) {
        setInvalidFields(prev => ({ ...prev, [`price${index}`]: true }));
      }
    }

    setTicket(updatedTickets);
    if (validationTriggered) {
      validateForm();
    }
  };

  const handleGlobalTaxCheckbox = (isChecked) => {
    setGlobalTax(isChecked);

    const updatedTickets = ticket.map((t) => ({
      ...t,
      tax: isChecked,
    }));

    setTicket(updatedTickets);
    if (validationTriggered) {
      validateForm();
    }
  };

  const handleAddonChange = (index, field, value) => {
    const updatedAddon = [...item];
    updatedAddon[index] = {
      ...updatedAddon[index],
      [field]: value,
      url: updatedAddon[index].url || "",
    };
    setItem(updatedAddon);
    if (validationTriggered) {
      validateForm();
    }
  };

  const handleCouponChange = (index, field, value) => {
    const updatedCoupon = [...coupon];
    updatedCoupon[index][field] = value;
    setCoupon(updatedCoupon);
    if (validationTriggered) {
      // For date pickers, also check if valid dayjs object
      const isFieldInvalid = (field === "startTime" || field === "endTime") ? !dayjs(value).isValid() : value.trim() === "";
      setInvalidFields(prev => ({ ...prev, [`${field}${index}`]: isFieldInvalid }));
    }
  };

  const handleAddCoupon = () => {
    setCoupon([
      ...coupon,
      {
        couponCode: "",
        reducePert: "",
        startTime: dayjs(),
        endTime: dayjs(),
        couponLimits: "",
      },
    ]);
    if (validationTriggered) {
      validateForm();
    }
  };

  const handleAddItem = () => {
    setItem([...item, { itemName: "", price: "", limit: "", url: "" }]);
    if (validationTriggered) {
      validateForm();
    }
  };

  const handleRemoveItem = (indexToRemove) => {
    const updatedItems = [...item];
    updatedItems.splice(indexToRemove, 1);
    setItem(updatedItems);

    // Clear validation errors for the removed item
    if (validationTriggered) {
      setInvalidFields(prev => {
        const newInvalidFields = { ...prev };
        delete newInvalidFields[`itemName${indexToRemove}`];
        delete newInvalidFields[`priceItem${indexToRemove}`];
        delete newInvalidFields[`limit${indexToRemove}`];
        return newInvalidFields;
      });
      validateForm();
    }
  };

  const handleRemoveCoupon = (indexToRemove) => {
    const updatedCoupons = [...coupon];
    updatedCoupons.splice(indexToRemove, 1);
    setCoupon(updatedCoupons);

    // Clear validation errors for the removed coupon
    if (validationTriggered) {
      setInvalidFields(prev => {
        const newInvalidFields = { ...prev };
        delete newInvalidFields[`couponCode${indexToRemove}`];
        delete newInvalidFields[`reducePert${indexToRemove}`];
        delete newInvalidFields[`startTime${indexToRemove}`];
        delete newInvalidFields[`endTime${indexToRemove}`];
        delete newInvalidFields[`couponLimits${indexToRemove}`];
        return newInvalidFields;
      });
      validateForm();
    }
  };

  const handleAddTicket = () => {
    setTicket([
      ...ticket,
      {
        ticketType: "",
        features: "",
        price: "",
        tax: globalTax,
        freeEvent: false,
        seats: "",
      },
    ]);
    if (validationTriggered) {
      validateForm();
    }
  };

  const handleRemoveTicket = (indexToRemove) => {
    const removeTicket = [...ticket];
    removeTicket.splice(indexToRemove, 1);
    setTicket(removeTicket);
    if (validationTriggered) {
      validateForm();
    }
  };

  const validateForm = useCallback(() => {
    const newInvalidFields = {};
    let isValid = true;
    let firstInvalidField = null; // Store the key of the first invalid field

    // Validate tickets (MANDATORY)
    if (ticket.length === 0) {
      isValid = false;
    } else {
      ticket.forEach((t, index) => {
        if (t.ticketType.trim() === "") {
          newInvalidFields[`ticketType${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `ticketType${index}`;
        }
        if (t.features.trim() === "") {
          newInvalidFields[`features${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `features${index}`;
        }
        if (!t.freeEvent && (t.price.trim() === "" || parseFloat(t.price) <= 0)) {
          newInvalidFields[`price${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `price${index}`;
        }
        if (t.seats.trim() === "" || parseInt(t.seats) <= 0) {
          newInvalidFields[`seats${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `seats${index}`;
        }
      });
    }

    // Validate add-ons (OPTIONAL - only validate if any addon has data)
    if (item.length > 0 && hasAnyAddonData(item)) {
      item.forEach((i, index) => {
        if (i.itemName.trim() === "") {
          newInvalidFields[`itemName${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `itemName${index}`;
        }
        if (i.price.trim() === "" || parseFloat(i.price) <= 0) {
          newInvalidFields[`priceItem${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `priceItem${index}`;
        }
        if (i.limit.trim() === "" || parseInt(i.limit) <= 0) {
          newInvalidFields[`limit${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `limit${index}`;
        }
      });
    }

    // Validate coupons (OPTIONAL - only validate if any coupon has data)
    if (coupon.length > 0 && hasAnyCouponData(coupon)) {
      coupon.forEach((c, index) => {
        if (c.couponCode.trim() === "") {
          newInvalidFields[`couponCode${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `couponCode${index}`;
        }
        if (c.reducePert.trim() === "" || parseFloat(c.reducePert) <= 0) {
          newInvalidFields[`reducePert${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `reducePert${index}`;
        }
        if (!dayjs(c.startTime).isValid()) {
          newInvalidFields[`startTime${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `startTime${index}`;
        }
        if (!dayjs(c.endTime).isValid()) {
          newInvalidFields[`endTime${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `endTime${index}`;
        }
        // Ensure end time is not before start time
        if (dayjs(c.startTime).isValid() && dayjs(c.endTime).isValid() && dayjs(c.endTime).isBefore(dayjs(c.startTime))) {
            newInvalidFields[`endTime${index}`] = true;
            isValid = false;
            if (!firstInvalidField) firstInvalidField = `endTime${index}`;
        }
        if (c.couponLimits.trim() === "" || parseInt(c.couponLimits) <= 0) {
          newInvalidFields[`couponLimits${index}`] = true;
          isValid = false;
          if (!firstInvalidField) firstInvalidField = `couponLimits${index}`;
        }
      });
    }

    setInvalidFields(newInvalidFields);
    return { isValid, firstInvalidField };
  }, [ticket, item, coupon]); // Dependencies for useCallback

  // To trigger validation on initial load or data change if already in validation mode
  useEffect(() => {
    if (validationTriggered) {
      validateForm();
    }
  }, [ticket, item, coupon, validationTriggered, validateForm]);

  const handleNext = () => {
    setValidationTriggered(true); // Trigger validation on button click
    const { isValid, firstInvalidField } = validateForm();

    if (isValid) {
      const cleanedTickets = ticket.map((t) => {
        // Ensure price is "0" if freeEvent is true
        if (t.freeEvent) {
          return { ...t, price: "0" };
        }
        return t;
      });

      // Only include coupons if they have data
      const cleanedCoupons = coupon.length > 0 && hasAnyCouponData(coupon)
        ? coupon.map(c => ({
            ...c,
            startTime: c.startTime.toISOString(),
            endTime: c.endTime.toISOString(),
          }))
        : [];

      // Only include addons if they have data
      const cleanedAddons = item.length > 0 && hasAnyAddonData(item) ? item : [];

      setFormData((prev) => ({
        ...prev,
        pricing: {
          tickets: cleanedTickets,
          coupons: cleanedCoupons,
          addons: cleanedAddons,
        },
      }));
      markStepCompleted("step2");

      navigate(`/createevent/${vendorId}/step3`);
    } else {
      // Scroll to the first invalid field using data-field attribute
      if (firstInvalidField) {
        const element = document.querySelector(`[data-field="${firstInvalidField}"]`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center", // Align to the center of the viewport
          });
        }
      }
    }
  };

  return (
    <div>
      <Box
        sx={{
          backgroundColor: "#F9FAFB",
          minHeight: "100vh",
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
          }}
        >
          {/*Ticket type*/}
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
                fontSize: isMobile ? "20px" : "28px",
              }}
            >
              Ticket Setup
            </Typography>

            {ticket.length === 0 && validationTriggered && (
                <Typography color="error" sx={{ fontFamily: "albert sans", fontSize: "14px", mt: 2 }}>
                    At least one ticket type is required. Please add a ticket.
                </Typography>
            )}

            {ticket.map((t, index) => (
              <Box
                key={index}
                sx={{
                  boxSizing: "border-box",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  padding: "2%",
                  mt: "2%",
                  borderColor: (validationTriggered && (
                    invalidFields[`ticketType${index}`] ||
                    invalidFields[`features${index}`] ||
                    invalidFields[`price${index}`] ||
                    invalidFields[`seats${index}`]
                  )) ? "red" : "#E5E7EB", // Highlight the whole box if any field inside is invalid
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
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
                      Ticket Type
                    </Typography>
                    <Box
                      sx={{
                        display: isMobile ? "block" : "flex",
                        alignItems: "center",
                        gap: "2%",
                      }}
                    >
                      <OutlinedInput
                        data-field={`ticketType${index}`}
                        value={t.ticketType}
                        onChange={(e) =>
                          handleChange(
                            setTicket,
                            index,
                            "ticketType",
                            e.target.value,
                            `ticketType${index}`
                          )
                        }
                        placeholder="Eg. VIP, Regular, Child"
                        sx={{
                          width: isMobile ? "90%" : "35%",
                          height: "40px",
                          fontFamily: "Albert Sans",
                          "&::placeholder": {
                            fontFamily: "Albert Sans",
                          },
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#19AEDC",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor:
                              validationTriggered &&
                              invalidFields[`ticketType${index}`]
                                ? "red"
                                : "#ccc",
                          },
                        }}
                      />
                      <Box
                        sx={{
                          alignItems: "center",
                          display: "flex",
                          width: isMobile ? "90%" : "30%",
                        }}
                      >
                        <Checkbox
                          checked={t.freeEvent || false}
                          onChange={(e) =>
                            handleFreeCheckbox(index, e.target.checked)
                          }
                          sx={{
                            color: "gray",
                            "&.Mui-checked": {
                              color: "#19AEDC",
                            },
                          }}
                        />
                        <Typography
                          sx={{
                            fontFamily: "albert sans",
                            fontSize: isMobile ? "14px" : "16px",
                          }}
                        >
                          Free for this type
                        </Typography>
                      </Box>
                    </Box>
                    {validationTriggered && invalidFields[`ticketType${index}`] && (
                      <Typography
                        color="error"
                        sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                      >
                        Ticket Type is required.
                      </Typography>
                    )}
                  </FormControl>

                  {ticket.length > 1 && ( // Only show delete if more than one ticket
                    <DeleteIcon
                      sx={{
                        cursor: "pointer",
                        color: "gray",
                        "&:hover": { color: "red" },
                      }}
                      onClick={() => handleRemoveTicket(index)}
                    />
                  )}
                </Box>

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
                    Features/Inclusions
                  </Typography>
                  <OutlinedInput
                    data-field={`features${index}`}
                    value={t.features}
                    onChange={(e) =>
                      handleChange(
                        setTicket,
                        index,
                        "features",
                        e.target.value,
                        `features${index}`
                      )
                    }
                    placeholder="List the features included in this ticket type"
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
                        borderColor:
                          validationTriggered && invalidFields[`features${index}`]
                            ? "red"
                            : "#ccc",
                      },
                    }}
                  />
                  {validationTriggered && invalidFields[`features${index}`] && (
                    <Typography
                      color="error"
                      sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                    >
                      Features/Inclusions are required.
                    </Typography>
                  )}
                </FormControl>

                <Box
                  sx={{
                    display: isMobile ? "block" : "flex",
                    mt: "2%",
                    width: "100%",
                    alignItems: "center",
                  }}
                >
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ width: isMobile ? "90%" : "40%", mr: "2%" }}
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
                      Price (₹)
                    </Typography>
                    <OutlinedInput
                      data-field={`price${index}`}
                      disabled={t.freeEvent}
                      value={t.price}
                      onChange={(e) => handlePriceChange(index, e.target.value, `price${index}`)}
                      placeholder="0.00"
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
                          borderColor:
                            validationTriggered && invalidFields[`price${index}`]
                              ? "red"
                              : "#ccc",
                        },
                      }}
                    />
                    {validationTriggered && invalidFields[`price${index}`] && (
                      <Typography
                        color="error"
                        sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                      >
                        Price is required and must be greater than 0 if not free.
                      </Typography>
                    )}
                  </FormControl>
                  <Box
                    sx={{
                      alignItems: "center",
                      display: "flex",
                      width: isMobile ? "90%" : "40%",
                      mt: isMobile ? 1 : 2,
                    }}
                   >
                    <Checkbox
                      checked={globalTax}
                      onChange={(e) => handleGlobalTaxCheckbox(e.target.checked)}
                      sx={{
                        color: "gray",
                        "&.Mui-checked": {
                          color: "#19AEDC",
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: "albert sans",
                        fontSize: isMobile ? "14px" : "16px",
                      }}
                    >
                      Tax included with ticket price
                    </Typography>
                  </Box>
                </Box>

                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ mt: "2%", width: isMobile ? "90%" : "40%" }}
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
                    Available Seats
                  </Typography>
                  <OutlinedInput
                    data-field={`seats${index}`}
                    value={t.seats}
                    onChange={(e) => handleSeatsChange(index, e.target.value, `seats${index}`)}
                    placeholder="Number of seats available"
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
                        borderColor:
                          validationTriggered && invalidFields[`seats${index}`]
                            ? "red"
                            : "#ccc",
                      },
                    }}
                  />
                  {validationTriggered && invalidFields[`seats${index}`] && (
                    <Typography
                      color="error"
                      sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                    >
                      Number of seats is required and must be greater than 0.
                    </Typography>
                  )}
                </FormControl>
              </Box>
            ))}

            <Button
              onClick={handleAddTicket}
              sx={{
                mt: "2%",
                color: "#19AEDC",
                fontFamily: "albert sans",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              + Add Another Ticket Type
            </Button>
          </Box>

          {/* Coupons Section */}
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
                fontSize: isMobile ? "20px" : "28px",
                mb: "2%",
              }}
            >
              Discount Coupons (Optional)
            </Typography>

            {coupon.map((c, index) => (
              <Box
                key={index}
                sx={{
                  boxSizing: "border-box",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  padding: "2%",
                  mt: "2%",
                  borderColor: (validationTriggered && (
                    invalidFields[`couponCode${index}`] ||
                    invalidFields[`reducePert${index}`] ||
                    invalidFields[`startTime${index}`] ||
                    invalidFields[`endTime${index}`] ||
                    invalidFields[`couponLimits${index}`]
                  )) ? "red" : "#E5E7EB",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontWeight: "600",
                      fontSize: "18px",
                      color: "#374151",
                    }}
                  >
                    Coupon {index + 1}
                  </Typography>
                  <DeleteIcon
                    sx={{
                      cursor: "pointer",
                      color: "gray",
                      "&:hover": { color: "red" },
                    }}
                    onClick={() => handleRemoveCoupon(index)}
                  />
                </Box>

                <Box
                  sx={{
                    display: isMobile ? "block" : "flex",
                    gap: "2%",
                    mt: "2%",
                  }}
                >
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ width: isMobile ? "100%" : "48%", mb: isMobile ? "2%" : 0 }}
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
                      Coupon Code
                    </Typography>
                    <OutlinedInput
                      data-field={`couponCode${index}`}
                      value={c.couponCode}
                      onChange={(e) =>
                        handleChange(
                          setCoupon,
                          index,
                          "couponCode",
                          e.target.value,
                          `couponCode${index}`
                        )
                      }
                      placeholder="Enter coupon code"
                      sx={{
                        height: "40px",
                        fontFamily: "Albert Sans",
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#19AEDC",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor:
                            validationTriggered && invalidFields[`couponCode${index}`]
                              ? "red"
                              : "#ccc",
                        },
                      }}
                    />
                    {validationTriggered && invalidFields[`couponCode${index}`] && (
                      <Typography
                        color="error"
                        sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                      >
                        Coupon code is required.
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ width: isMobile ? "100%" : "48%" }}
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
                      Discount Percentage (%)
                    </Typography>
                    <OutlinedInput
                      data-field={`reducePert${index}`}
                      value={c.reducePert}
                      onChange={(e) => handleCouponReducePertChange(index, e.target.value, `reducePert${index}`)}
                      placeholder="Enter discount percentage"
                      sx={{
                        height: "40px",
                        fontFamily: "Albert Sans",
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#19AEDC",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor:
                            validationTriggered && invalidFields[`reducePert${index}`]
                              ? "red"
                              : "#ccc",
                        },
                      }}
                    />
                    {validationTriggered && invalidFields[`reducePert${index}`] && (
                      <Typography
                        color="error"
                        sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                      >
                        Discount percentage is required and must be greater than 0.
                      </Typography>
                    )}
                  </FormControl>
                </Box>

                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box
                    sx={{
                      display: isMobile ? "block" : "flex",
                      gap: "2%",
                      mt: "2%",
                    }}
                  >
                    <Box sx={{ width: isMobile ? "100%" : "48%", mb: isMobile ? "2%" : 0 }}>
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
                        data-field={`startTime${index}`}
                        value={c.startTime}
                        onChange={(newValue) =>
                          handleCouponChange(index, "startTime", newValue)
                        }
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            height: "40px",
                            fontFamily: "Albert Sans",
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#19AEDC",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor:
                                validationTriggered && invalidFields[`startTime${index}`]
                                  ? "red"
                                  : "#ccc",
                            },
                          },
                        }}
                      />
                      {validationTriggered && invalidFields[`startTime${index}`] && (
                        <Typography
                          color="error"
                          sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                        >
                          Valid start date and time is required.
                        </Typography>
                      )}
                    </Box>

                    <Box sx={{ width: isMobile ? "100%" : "48%" }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          marginBottom: "6px",
                          color: "#666",
                          fontWeight: 500,
                          fontFamily: "Albert Sans",
                        }}
                      >
                        End Date & Time
                      </Typography>
                      <DateTimePicker
                        data-field={`endTime${index}`}
                        value={c.endTime}
                        onChange={(newValue) =>
                          handleCouponChange(index, "endTime", newValue)
                        }
                        sx={{
                          width: "100%",
                          "& .MuiOutlinedInput-root": {
                            height: "40px",
                            fontFamily: "Albert Sans",
                            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                              borderColor: "#19AEDC",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor:
                                validationTriggered && invalidFields[`endTime${index}`]
                                  ? "red"
                                  : "#ccc",
                            },
                          },
                        }}
                      />
                      {validationTriggered && invalidFields[`endTime${index}`] && (
                        <Typography
                          color="error"
                          sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                        >
                          Valid end date and time is required and must be after start time.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </LocalizationProvider>

                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ mt: "2%", width: isMobile ? "100%" : "48%" }}
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
                    Usage Limit
                  </Typography>
                  <OutlinedInput
                    data-field={`couponLimits${index}`}
                    value={c.couponLimits}
                    onChange={(e) => handleCouponLimitsChange(index, e.target.value, `couponLimits${index}`)}
                    placeholder="Maximum number of uses"
                    sx={{
                      height: "40px",
                      fontFamily: "Albert Sans",
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#19AEDC",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor:
                          validationTriggered && invalidFields[`couponLimits${index}`]
                            ? "red"
                            : "#ccc",
                      },
                    }}
                  />
                  {validationTriggered && invalidFields[`couponLimits${index}`] && (
                    <Typography
                      color="error"
                      sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                    >
                      Usage limit is required and must be greater than 0.
                    </Typography>
                  )}
                </FormControl>
              </Box>
            ))}

            <Button
              onClick={handleAddCoupon}
              sx={{
                mt: "2%",
                color: "#19AEDC",
                fontFamily: "albert sans",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              + Add Coupon
            </Button>
          </Box>

          {/* Add-ons Section */}
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
                fontSize: isMobile ? "20px" : "28px",
                mb: "2%",
              }}
            >
              Add-ons (Optional)
            </Typography>

            {item.map((addon, index) => (
              <Box
                key={index}
                sx={{
                  boxSizing: "border-box",
                  border: "1px solid #E5E7EB",
                  borderRadius: "10px",
                  padding: "2%",
                  mt: "2%",
                  borderColor: (validationTriggered && (
                    invalidFields[`itemName${index}`] ||
                    invalidFields[`priceItem${index}`] ||
                    invalidFields[`limit${index}`]
                  )) ? "red" : "#E5E7EB",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography
                    sx={{
                      fontFamily: "albert sans",
                      fontWeight: "600",
                      fontSize: "18px",
                      color: "#374151",
                    }}
                  >
                    Add-on {index + 1}
                  </Typography>
                  <DeleteIcon
                    sx={{
                      cursor: "pointer",
                      color: "gray",
                      "&:hover": { color: "red" },
                    }}
                    onClick={() => handleRemoveItem(index)}
                  />
                </Box>

                <Box
                  sx={{
                    display: isMobile ? "block" : "flex",
                    gap: "2%",
                    mt: "2%",
                  }}
                >
                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ width: isMobile ? "100%" : "48%", mb: isMobile ? "2%" : 0 }}
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
                      Item Name
                    </Typography>
                    <OutlinedInput
                      data-field={`itemName${index}`}
                      value={addon.itemName}
                      onChange={(e) =>
                        handleChange(
                          setItem,
                          index,
                          "itemName",
                          e.target.value,
                          `itemName${index}`
                        )
                      }
                      placeholder="e.g., T-shirt, Parking, Meal"
                      sx={{
                        height: "40px",
                        fontFamily: "Albert Sans",
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#19AEDC",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor:
                            validationTriggered && invalidFields[`itemName${index}`]
                              ? "red"
                              : "#ccc",
                        },
                      }}
                    />
                    {validationTriggered && invalidFields[`itemName${index}`] && (
                      <Typography
                        color="error"
                        sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                      >
                        Item name is required.
                      </Typography>
                    )}
                  </FormControl>

                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ width: isMobile ? "100%" : "48%" }}
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
                      Price (₹)
                    </Typography>
                    <OutlinedInput
                      data-field={`priceItem${index}`}
                      value={addon.price}
                      onChange={(e) => handleAddonPriceChange(index, e.target.value, `priceItem${index}`)}
                      placeholder="0.00"
                      sx={{
                        height: "40px",
                        fontFamily: "Albert Sans",
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#19AEDC",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor:
                            validationTriggered && invalidFields[`priceItem${index}`]
                              ? "red"
                              : "#ccc",
                        },
                      }}
                    />
                    {validationTriggered && invalidFields[`priceItem${index}`] && (
                      <Typography
                        color="error"
                        sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                      >
                        Price is required and must be greater than 0.
                      </Typography>
                    )}
                  </FormControl>
                </Box>

                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ mt: "2%", width: isMobile ? "100%" : "48%" }}
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
                    Quantity Limit
                  </Typography>
                  <OutlinedInput
                    data-field={`limit${index}`}
                    value={addon.limit}
                    onChange={(e) => handleAddonLimitChange(index, e.target.value, `limit${index}`)}
                    placeholder="Maximum quantity available"
                    sx={{
                      height: "40px",
                      fontFamily: "Albert Sans",
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: "#19AEDC",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor:
                          validationTriggered && invalidFields[`limit${index}`]
                            ? "red"
                            : "#ccc",
                      },
                    }}
                  />
                  {validationTriggered && invalidFields[`limit${index}`] && (
                    <Typography
                      color="error"
                      sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                    >
                      Quantity limit is required and must be greater than 0.
                    </Typography>
                  )}
                </FormControl>
              </Box>
            ))}

            <Button
              onClick={handleAddItem}
              sx={{
                mt: "2%",
                color: "#19AEDC",
                fontFamily: "albert sans",
                textTransform: "none",
                fontSize: "16px",
                fontWeight: "600",
              }}
            >
              + Add Item
            </Button>
          </Box>

          {/* Next Button */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: "3%",
              mb: "3%",
            }}
          >
            <Button
              onClick={handleNext}
              sx={{
                backgroundColor: "#19AEDC",
                color: "white",
                fontFamily: "albert sans",
                textTransform: "none",
                fontSize: "18px",
                fontWeight: "600",
                padding: "12px 40px",
                borderRadius: "8px",
                "&:hover": {
                  backgroundColor: "#1596C7",
                },
              }}
            >
              Continue to Next Step
            </Button>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default PricePerk;