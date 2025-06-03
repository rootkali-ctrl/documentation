import {
  Box,
  Button,
  Checkbox,
  FormControl,
  OutlinedInput,
  Typography,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useState } from "react";
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
  }, [shouldRedirectToStep1, stepCompletion, formData, navigate, vendorId]);

  // Global tax state to control all tickets
  const [globalTax, setGlobalTax] = useState(false);

  const [ticket, setTicket] = useState([
    {
      ticketType: "",
      features: "",
      price: "",
      tax: false, // This will be synced with globalTax
      freeEvent: false,
      seats: "",
    },
  ]);

  const [coupon, setCoupon] = useState([
    {
      couponCode: "",
      reducePert: "",
      startTime: dayjs(),
      endTime: dayjs(),
      couponLimits: "",
    },
  ]);

  const [item, setItem] = useState([
    {
      itemName: "",
      price: "",
      limit: "",
      url: "",
    },
  ]);

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
          tax: firstTicketTax, // Sync all tickets with the first ticket's tax value
        }));
        setTicket(syncedTickets);
      }

      setCoupon(
        formData.pricing.coupons?.length ? formData.pricing.coupons : coupon
      );
      setItem(
        formData.pricing.addons?.length
          ? formData.pricing.addons.map((a) => ({
              itemName: a.itemName || "",
              price: a.price || "",
              limit: a.limit || "",
              url: a.url || "",
            }))
          : item
      );
    }
  }, [formData]);

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...ticket];
    updatedTickets[index][field] = value;

    if (field === "price") {
      updatedTickets[index].freeEvent = false;
    }

    setTicket(updatedTickets);
  };

  const handleFreeCheckbox = (index, isChecked) => {
    const updatedTickets = [...ticket];
    updatedTickets[index].freeEvent = isChecked;

    if (isChecked) {
      updatedTickets[index].price = "0";
    }

    setTicket(updatedTickets);
  };

  // Handle global tax checkbox - affects all tickets
  const handleGlobalTaxCheckbox = (isChecked) => {
    setGlobalTax(isChecked);

    const updatedTickets = ticket.map((t) => ({
      ...t,
      tax: isChecked,
    }));

    setTicket(updatedTickets);
  };

  const handleAddonChange = (index, field, value) => {
    const updatedAddon = [...item];
    updatedAddon[index] = {
      ...updatedAddon[index],
      [field]: value,
      url: updatedAddon[index].url || "",
    };
    setItem(updatedAddon);
  };

  const handleCouponChange = (index, field, value) => {
    const updatedCoupon = [...coupon];
    updatedCoupon[index][field] = value;
    setCoupon(updatedCoupon);
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
  };

  const handleAddItem = () => {
    setItem([...item, { itemName: "", price: "", limit: "", url: "" }]);
  };

  const handleRemoveItem = (indexToRemove) => {
    const removeItem = [...item];
    removeItem.splice(indexToRemove, 1);
    setItem(removeItem);
  };

  const handleRemoveCoupon = (indexToRemove) => {
    const removeItem = [...coupon];
    removeItem.splice(indexToRemove, 1);
    setCoupon(removeItem);
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
  };

  const handleRemoveTicket = (indexToRemove) => {
    const removeTicket = [...ticket];
    removeTicket.splice(indexToRemove, 1);
    setTicket(removeTicket);
  };

  const isFormValid = () => {
    const ticketsValid =
      ticket.length > 0 &&
      ticket.every(
        (t) =>
          t.ticketType.trim() !== "" &&
          t.features.trim() !== "" &&
          t.seats.trim() !== "" &&
          (t.freeEvent || t.price.trim() !== "")
      );

    return ticketsValid;
  };

  const handleNext = () => {
    if (!isFormValid()) {
      return;
    }

    const cleanedTickets = ticket.map((t) => {
      if (t.freeEvent) {
        return { ...t, price: "0" };
      }
      return t;
    });

    setFormData((prev) => ({
      ...prev,
      pricing: {
        tickets: cleanedTickets,
        coupons: coupon,
        addons: item,
      },
    }));
    markStepCompleted("step2");

    navigate(`/createevent/${vendorId}/step3`);
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
            {ticket.map((t, index) => (
              <Box
                key={index}
                sx={{
                  boxSizing: "border-box",
                  border: "1px solid #E5E7EB ",
                  borderRadius: "10px",
                  padding: "2%",
                  mt: "2%",
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
                        value={t.ticketType}
                        onChange={(e) =>
                          handleTicketChange(
                            index,
                            "ticketType",
                            e.target.value
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
                            borderColor: "#ccc",
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
                              color: "#19AEDC", // Always blue when checked
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
                  </FormControl>

                  <DeleteIcon
                    sx={{
                      cursor: "pointer",
                      color: "gray",
                      "&:hover": { color: "red" },
                    }}
                    onClick={() => handleRemoveTicket(index)}
                  />
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
                    value={t.features}
                    onChange={(e) =>
                      handleTicketChange(index, "features", e.target.value)
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
                        borderColor: "#ccc",
                      },
                    }}
                  />
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
                      disabled={t.freeEvent}
                      value={t.price}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                          handleTicketChange(index, "price", e.target.value);
                        }
                      }}
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
                          borderColor: "#ccc",
                        },
                      }}
                    />
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
                      onChange={(e) =>
                        handleGlobalTaxCheckbox(e.target.checked)
                      }
                      disabled={t.freeEvent} // Disable only for free events
                      sx={{
                        color: "gray",
                        "&.Mui-checked": {
                          color: t.freeEvent ? "gray" : "#19AEDC", // Gray when disabled (free event), blue otherwise
                        },
                      }}
                    />
                    <Typography
                      sx={{
                        fontFamily: "Albert Sans",
                        fontSize: isMobile ? "14px" : "16px",
                      }}
                    >
                      Tax amount included in the ticket price
                    </Typography>
                  </Box>
                </Box>

                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ width: isMobile ? "90%" : "40%", mt: "2%" }}
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
                    No. of seats for this category
                  </Typography>
                  <OutlinedInput
                    value={t.seats}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        handleTicketChange(index, "seats", e.target.value);
                      }
                    }}
                    placeholder="0"
                    sx={{
                      width: isMobile ? "90%" : "90%",
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
              </Box>
            ))}

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <Button
                onClick={handleAddTicket}
                variant="contained"
                sx={{
                  backgroundColor: "#19AEDC",
                  minWidth: "20%",
                  mt: "2%",
                  textTransform: "none",
                  display: "flex",
                  fontFamily: "albert sans",
                }}
              >
                + Add ticket type
              </Button>
            </Box>

            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
                mt: "3%",
              }}
            ></Box>
          </Box>
          {/*Add-ons*/}
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
              Add-ons & Purchasables
            </Typography>
            {item.map((t, index) => (
              <Box
                key={index}
                sx={{
                  display: isMobile ? "block" : "flex",
                  mt: "2%",
                  width: "100%",
                  alignItems: "center",
                  gap: "2%",
                }}
              >
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ width: isMobile ? "90%" : "30%" }}
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
                    value={t.itemName}
                    onChange={(e) => {
                      handleAddonChange(index, "itemName", e.target.value);
                    }}
                    placeholder="e.g., Event T-shirt / snacks"
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
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ width: isMobile ? "90%" : "30%" }}
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
                    value={t.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        handleAddonChange(index, "price", value);
                      }
                    }}
                    placeholder="0.00"
                    inputProps={{ inputMode: "decimal" }}
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
                <FormControl
                  fullWidth
                  variant="outlined"
                  sx={{ width: isMobile ? "90%" : "30%" }}
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
                    Quantity(limit)
                  </Typography>
                  <OutlinedInput
                    value={t.limit}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d{0,2}$/.test(value)) {
                        handleAddonChange(index, "limit", e.target.value);
                      }
                    }}
                    placeholder="100"
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
                    mt: "2%",
                    cursor: "pointer",
                    color: "gray",
                    "&:hover": { color: "red" },
                    mt: isMobile ? 2 : 3,
                    ml: isMobile ? 1.5 : null,
                  }}
                  onClick={() => {
                    handleRemoveItem(index);
                  }}
                />
              </Box>
            ))}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <Button
                variant="contained"
                onClick={handleAddItem}
                sx={{
                  backgroundColor: "#19AEDC",
                  minWidth: "20%",
                  mt: "2%",
                  textTransform: "none",
                  display: "flex",
                  fontFamily: "albert sans",
                }}
              >
                + Add items
              </Button>
            </Box>
          </Box>

          {/*Coupons and discounts*/}
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
              Coupons & Discounts
            </Typography>
            {coupon.map((t, index) => (
              <Box
                key={index}
                sx={{
                  boxSizing: "border-box",
                  border: "1px solid #E5E7EB ",
                  borderRadius: "10px",
                  padding: "2%",
                  mt: "2%",
                }}
              >
                <Box
                  sx={{
                    display: isMobile ? "block" : "flex",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <FormControl fullWidth variant="outlined" width="100%">
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
                      value={t.couponCode}
                      onChange={(e) => {
                        handleCouponChange(index, "couponCode", e.target.value);
                      }}
                      placeholder="e.g., FIRST100"
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
                      Reduced Price
                    </Typography>
                    <OutlinedInput
                      value={t.reducePert}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                          handleCouponChange(
                            index,
                            "reducePert",
                            e.target.value
                          );
                        }
                      }}
                      placeholder="Eg. 20% reduced from ticket price"
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
                  <DeleteIcon
                    sx={{
                      cursor: "pointer",
                      color: "gray",
                      "&:hover": { color: "red" },
                    }}
                    onClick={() => {
                      handleRemoveCoupon(index);
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: isMobile ? "block" : "flex",
                    mt: "3%",
                    width: "100%",
                    alignItems: "center",
                    gap: "1.3%",
                  }}
                >
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <FormControl
                      fullWidth
                      variant="outlined"
                      sx={{ width: isMobile ? "90%" : "30%" }}
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
                        value={dayjs(t.startTime)}
                        onChange={(newValue) =>
                          handleCouponChange(index, "startTime", newValue)
                        }
                        slotProps={{
                          textField: {
                            variant: "outlined",
                            placeholder: "Select date and time",
                            sx: {
                              width: "100%",
                              fontFamily: "Albert Sans",
                              "& .MuiOutlinedInput-root": {
                                height: "36px",
                                fontFamily: "Albert Sans",
                              },
                              "& input": {
                                padding: "8px 12px",
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
                      sx={{ width: isMobile ? "90%" : "30%" }}
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
                        End Date & Time
                      </Typography>

                      <DateTimePicker
                        value={dayjs(t.endTime)}
                        onChange={(newValue) =>
                          handleCouponChange(index, "endTime", newValue)
                        }
                        slotProps={{
                          textField: {
                            variant: "outlined",
                            placeholder: "Select date and time",
                            sx: {
                              width: "100%",
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

                  <FormControl
                    fullWidth
                    variant="outlined"
                    sx={{ width: "30%" }}
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
                      Usage limits
                    </Typography>
                    <OutlinedInput
                      value={t.couponLimits}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                          handleCouponChange(
                            index,
                            "couponLimits",
                            e.target.value
                          );
                        }
                      }}
                      placeholder="0"
                      sx={{
                        width: "100%",
                        height: "36px",
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
                </Box>
              </Box>
            ))}
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-end",
                width: "100%",
              }}
            >
              <Button
                onClick={handleAddCoupon}
                variant="contained"
                sx={{
                  backgroundColor: "#19AEDC",
                  minWidth: "20%",
                  mt: "2%",
                  textTransform: "none",
                  display: "flex",
                  fontFamily: "albert sans",
                }}
              >
                + Add Coupon
              </Button>
            </Box>
          </Box>
        </Box>

        {/* <Button onClick={prevStep}>Back</Button> */}
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
export default PricePerk;
