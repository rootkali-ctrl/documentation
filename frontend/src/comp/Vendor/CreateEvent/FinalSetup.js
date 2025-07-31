import { useEffect, useRef, useCallback, useState, createRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  TextField,
  Typography,
  useMediaQuery,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEventContext } from "./EventContext";
import { useNavigate, useParams } from "react-router-dom";
// import axios from "axios"; // Not used in this component currently
import { Add, Remove } from "@mui/icons-material";

const FinalSetup = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const {
    formData,
    updateFormSection,
    markStepCompleted,
    shouldRedirectToStep1,
    stepCompletion,
  } = useEventContext();
  const isMobile = useMediaQuery("(max-width:900px)");

  // State for form fields
  const [localData, setLocalData] = useState({ contact: "", tags: "" });
  const [FAQ, setFAQ] = useState([{ ques: "", ans: "" }]);
  const [isCancel, setIsCancel] = useState(false);
  const [cancelDays, setCancelDays] = useState("");
  const [deductionRate, setDeductionRate] = useState("");
  const [deductionType, setDeductionType] = useState("");
  const [ticketCount, setTicketCount] = useState(10); // Default value
  const [isFocused, setIsFocused] = useState(false); // For select focus behavior

  // State for validation
  const [validationTriggered, setValidationTriggered] = useState(false);
  const [invalidFields, setInvalidFields] = useState({});

  // Maximum and Minimum ticket limits for the counter
  const maxLimit = 10;
  const minLimit = 1;

  // Total attendees from pricing tickets (for context, though not directly used in validation here)
  const totalAttendees = formData?.pricing?.tickets?.reduce((acc, ticket) => {
    return acc + Number(ticket.seats || 0);
  }, 0);

  // Redirect logic for reload detection and step validation
  useEffect(() => {
    // Redirect to step 1 if page was reloaded
    if (shouldRedirectToStep1()) {
      navigate(`/createevent/${vendorId}/step1`);
      return;
    }

    // Redirect to step 1 if previous steps are not completed or required data is missing
    if (
      !stepCompletion.step1 ||
      !stepCompletion.step2 ||
      !formData.eventDetails?.name ||
      !formData.pricing?.tickets?.length ||
      Object.keys(formData.eventDetails || {}).length === 0
    ) {
      navigate(`/createevent/${vendorId}/step1`);
      return;
    }

    // Populate form data from context if available
    if (formData.finalSetup) {
      setLocalData({
        contact: formData.finalSetup.contact || "",
        tags: formData.finalSetup.tags || "",
      });
      setFAQ(formData.finalSetup.FAQ || [{ ques: "", ans: "" }]);
      setIsCancel(formData.finalSetup.cancellationAvailable || false);
      setCancelDays(formData.finalSetup.cancellationDays || "");
      setDeductionRate(formData.finalSetup.deductionRate || "");
      setDeductionType(formData.finalSetup.deductionType || "");
      setTicketCount(formData.finalSetup.ticketCount || 10);
    }
  }, [shouldRedirectToStep1, stepCompletion, formData, navigate, vendorId]);


  // Validation function using useCallback for memoization
  const validateForm = useCallback(() => {
    const newInvalidFields = {};
    let isValid = true;
    let firstInvalidField = null;

    const setInvalid = (key, value = true) => {
      newInvalidFields[key] = value;
      if (value) { // Only set isValid to false if it's actually invalid
        isValid = false;
        if (!firstInvalidField) firstInvalidField = key;
      }
    };

    // Validate Contact Details
    if (localData.contact.trim() === "") {
      setInvalid("contact");
    } else if (!/^\S+@\S+\.\S+$/.test(localData.contact)) { // Basic email regex
      setInvalid("contact", "invalid");
    }

    // Validate FAQs
    // If there are no FAQs, it's considered valid (optional to add)
    // But if FAQs are added, they must be filled.
    if (FAQ.length > 0) {
      FAQ.forEach((item, index) => {
        if (item.ques.trim() === "") {
          setInvalid(`faqQues${index}`);
        }
        if (item.ans.trim() === "") {
          setInvalid(`faqAns${index}`);
        }
      });
    }


    // Validate Tags
    if (localData.tags.trim() === "") {
      setInvalid("tags");
    }

    // Validate Cancellation Policy fields if enabled
    if (isCancel) {
      if (cancelDays.trim() === "" || parseInt(cancelDays) <= 0) {
        setInvalid("cancelDays");
      }
      if (deductionType.trim() === "") {
        setInvalid("deductionType");
      }
      if (deductionRate.trim() === "" || parseFloat(deductionRate) <= 0) {
        setInvalid("deductionRate");
      }
    }

    setInvalidFields(newInvalidFields);
    return { isValid, firstInvalidField };
  }, [localData, FAQ, isCancel, cancelDays, deductionType, deductionRate]);

  // Effect to re-validate when form data changes, if validation has been triggered
  useEffect(() => {
    if (validationTriggered) {
      validateForm();
    }
  }, [localData, FAQ, isCancel, cancelDays, deductionType, deductionRate, validationTriggered, validateForm]);


  // General input change handler for localData fields and specific others
  const handleChangeInput = (e) => {
    const { name, value } = e.target;

    if (name === "deductionRate") {
      if (/^\d*\.?\d{0,2}$/.test(value) || value === "") {
        setDeductionRate(value);
      }
    } else if (name === "deductionType") {
      setDeductionType(value);
    } else if (name === "cancelDays") {
      if (/^\d*$/.test(value) || value === "") {
        setCancelDays(value);
      }
    }
    else {
      setLocalData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (validationTriggered) {
      // Re-validate specific field if validation was triggered
      if (name === "contact") {
        const isInvalid = value.trim() === "" || !/^\S+@\S+\.\S+$/.test(value);
        setInvalidFields(prev => ({ ...prev, [name]: isInvalid ? (value.trim() === "" ? true : "invalid") : false }));
      } else if (name === "deductionRate" || name === "cancelDays") {
          setInvalidFields(prev => ({ ...prev, [name]: value.trim() === "" || parseFloat(value) <= 0 }));
      } else if (name === "deductionType") {
          setInvalidFields(prev => ({ ...prev, [name]: value.trim() === "" }));
      } else {
          setInvalidFields(prev => ({ ...prev, [name]: value.trim() === "" }));
      }
    }
  };

  const handleAddFAQ = () => {
    setFAQ([
      ...FAQ,
      {
        ques: "",
        ans: "",
      },
    ]);
    if (validationTriggered) {
        // Clear potential FAQ validation errors for new empty fields
        setInvalidFields(prev => ({
            ...prev,
            [`faqQues${FAQ.length}`]: false,
            [`faqAns${FAQ.length}`]: false,
        }));
    }
  };

  const handleRemoveFAQ = (indexToRemove) => {
    const removeItem = [...FAQ];
    removeItem.splice(indexToRemove, 1);
    setFAQ(removeItem);
    if (validationTriggered) {
        // Re-validate FAQs after removal
        validateForm();
    }
  };

  const handleFAQChange = (index, field, value) => {
    const updatedFAQ = [...FAQ];
    updatedFAQ[index][field] = value;
    setFAQ(updatedFAQ);
    if (validationTriggered) {
      setInvalidFields(prev => ({ ...prev, [`faq${field === 'ques' ? 'Ques' : 'Ans'}${index}`]: value.trim() === "" }));
    }
  };


  // Ticket Count handlers
  const handleIncrement = () => {
    if (ticketCount < maxLimit) {
      setTicketCount((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (ticketCount > minLimit) {
      setTicketCount((prev) => prev - 1);
    }
  };

  const handleInputTicketCountChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value)) {
      setTicketCount(value);
    } else if (e.target.value === "") {
      setTicketCount(""); // Allow empty temporarily for user input
    }
  };

  const handleBlurTicketCount = () => {
    if (ticketCount === "" || isNaN(ticketCount)) {
      setTicketCount(minLimit); // Default to min if left empty or invalid
    } else if (ticketCount < minLimit) {
      setTicketCount(minLimit);
    } else if (ticketCount > maxLimit) {
      setTicketCount(maxLimit);
    }
  };


  const handleFinal = async () => {
    setValidationTriggered(true); // Trigger validation on submit
    const { isValid, firstInvalidField } = validateForm();

    if (isValid) {
      updateFormSection("finalSetup", {
        contact: localData.contact,
        tags: localData.tags,
        FAQ,
        cancellationAvailable: isCancel,
        cancellationDays: isCancel ? cancelDays : "", // Only save if cancellation is enabled
        deductionType: isCancel ? deductionType : "", // Only save if cancellation is enabled
        deductionRate: isCancel ? deductionRate : "", // Only save if cancellation is enabled
        ticketCount: ticketCount === "" ? minLimit : ticketCount, // Ensure a default if somehow empty
      });
      markStepCompleted("step3");
      navigate(`/createevent/${vendorId}/eventpreview`);
    } else {
      // Scroll to the first invalid field
      if (firstInvalidField) {
        const element = document.querySelector(`[data-field="${firstInvalidField}"]`);
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "center",
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
        }}
      >
        <Box
          sx={{
            display: "flex",
            padding: "2% 3%",
            flexDirection: "column",
            width: isMobile ? "90%" : "70%",
            boxSizing: "border-box",
            backgroundColor: "white",
            height: "auto",
            borderRadius: "10px",
            margin: "0 auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* Contact Details */}
          <Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize: isMobile ? "20px" : "28px",
                mb: "2%",
              }}
            >
              Contact Details
            </Typography>
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
                Enter your email for contact
              </Typography>
              <OutlinedInput
                name="contact"
                data-field="contact" // Data attribute for scrolling
                value={localData.contact}
                onChange={handleChangeInput}
                placeholder="xyz@gmail.com"
                sx={{
                  width: isMobile ? "90%" : "50%",
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
                      validationTriggered && invalidFields.contact ? "red" : "#ccc",
                  },
                }}
              />
              {validationTriggered && invalidFields.contact && (
                <Typography
                  color="error"
                  sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                >
                  {invalidFields.contact === "invalid"
                    ? "Please enter a valid email address."
                    : "Email is required."}
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* Ticket Limit */}
          <Box sx={{ mt: "2%" }}>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize: isMobile ? "20px" : "28px",
                mb: "1%",
              }}
            >
              Ticket Limit
            </Typography>
            <Box
              sx={{
                display: isMobile ? "block" : "flex",
                alignItems: "center",
                width: "80%",
                justifyContent: "space-between",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontSize: isMobile ? "14px" : "16px",
                }}
              >
                How many tickets should be booked in a single booking
              </Typography>
              <Box
                display="flex"
                alignItems="center"
                gap={1}
                sx={{ mt: isMobile ? 2 : null, mb: isMobile ? 2 : null }}
              >
                <IconButton
                  onClick={handleDecrement}
                  disabled={ticketCount <= minLimit}
                >
                  <Remove />
                </IconButton>

                <TextField
                  value={ticketCount}
                  onChange={handleInputTicketCountChange}
                  onBlur={handleBlurTicketCount}
                  inputProps={{
                    style: { textAlign: "center", width: "40px" },
                    inputMode: "numeric",
                    pattern: "[0-9]*"
                  }}
                  size="small"
                />

                <IconButton
                  onClick={handleIncrement}
                  disabled={ticketCount >= maxLimit}
                >
                  <Add />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* FAQs */}
          <Box sx={{ mt: "2%" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: "2%",
              }}
            >
              <Typography
                sx={{
                  fontFamily: "albert sans",
                  fontWeight: "900",
                  fontSize: isMobile ? "20px" : "28px",
                }}
              >
                FAQs
              </Typography>
              <Box>
                <Button
                  onClick={handleAddFAQ}
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
                  + Add FAQ
                </Button>
              </Box>
            </Box>
            {FAQ.map((t, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",
                  boxSizing: "border-box",
                  border:
                    validationTriggered &&
                    (invalidFields[`faqQues${index}`] ||
                      invalidFields[`faqAns${index}`])
                      ? "1px solid red"
                      : "1px solid #ccc",
                  padding: "2%",
                  mt: isMobile ? 1 : "1%",
                  borderRadius: "10px",
                }}
              >
                <Box sx={{ width: isMobile ? "90%" : "95%" }}>
                  <FormControl fullWidth variant="outlined">
                    <OutlinedInput
                      data-field={`faqQues${index}`} // Data attribute for scrolling
                      value={t.ques}
                      onChange={(e) => {
                        handleFAQChange(index, "ques", e.target.value);
                      }}
                      placeholder="Enter question"
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
                            validationTriggered && invalidFields[`faqQues${index}`]
                              ? "red"
                              : "#ccc",
                        },
                      }}
                    />
                    {validationTriggered && invalidFields[`faqQues${index}`] && (
                      <Typography
                        color="error"
                        sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                      >
                        FAQ Question is required.
                      </Typography>
                    )}
                  </FormControl>
                  <FormControl fullWidth variant="outlined" sx={{ mt: "1%" }}>
                    <OutlinedInput
                      data-field={`faqAns${index}`} // Data attribute for scrolling
                      value={t.ans}
                      onChange={(e) => {
                        handleFAQChange(index, "ans", e.target.value);
                      }}
                      placeholder="Type your answer..."
                      multiline
                      minRows={4}
                      sx={{
                        width: "100%",
                        fontFamily: "Albert Sans",
                        "&::placeholder": {
                          fontFamily: "Albert Sans",
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#19AEDC",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor:
                            validationTriggered && invalidFields[`faqAns${index}`]
                              ? "red"
                              : "#ccc",
                        },
                      }}
                    />
                    {validationTriggered && invalidFields[`faqAns${index}`] && (
                      <Typography
                        color="error"
                        sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                      >
                        FAQ Answer is required.
                      </Typography>
                    )}
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    display: isMobile ? "block" : "flex",
                    justifyContent: "flex-end",
                    width: "5%",
                  }}
                >
                  {FAQ.length > 1 && ( // Allow removing only if more than one FAQ
                    <DeleteIcon
                      onClick={() => handleRemoveFAQ(index)}
                      sx={{
                        cursor: "pointer",
                        color: "gray",
                        "&:hover": { color: "red" },
                      }}
                    />
                  )}
                </Box>
              </Box>
            ))}
          </Box>

          {/* Tags */}
          <Box sx={{ mt: "2%" }}>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize: isMobile ? "20px" : "28px",
              }}
            >
              Tags
            </Typography>
            <FormControl fullWidth variant="outlined" sx={{ mt: "2%" }}>
              <OutlinedInput
                name="tags"
                data-field="tags" // Data attribute for scrolling
                value={localData.tags}
                onChange={handleChangeInput}
                placeholder="add tags (comma separated, e.g., music, festival)"
                sx={{
                  width: isMobile ? "90%" : "50%",
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
                      validationTriggered && invalidFields.tags ? "red" : "#ccc",
                  },
                }}
              />
              {validationTriggered && invalidFields.tags && (
                <Typography
                  color="error"
                  sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 1 }}
                >
                  Tags are required.
                </Typography>
              )}
            </FormControl>
          </Box>

          {/* Cancellation Policy */}
          <Box sx={{ mt: "2%" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isCancel}
                  onChange={(e) => {
                    setIsCancel(e.target.checked);
                    if (!e.target.checked && validationTriggered) {
                        // Clear cancellation policy errors if unchecked
                        setInvalidFields(prev => {
                            const newPrev = { ...prev };
                            delete newPrev.cancelDays;
                            delete newPrev.deductionType;
                            delete newPrev.deductionRate;
                            return newPrev;
                        });
                    }
                  }}
                  sx={{
                    color: "gray",
                    "&.Mui-checked": {
                      color: "#19AEDC",
                    },
                  }}
                />
              }
              label="Enable Cancellation Policy"
              sx={{
                "& .MuiFormControlLabel-label": {
                  fontFamily: "Albert Sans",
                  fontSize: "16px",
                },
              }}
            />

            {isCancel && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: isMobile ? "90%" : "50%",
                  gap: "1em",
                }}
              >
                <OutlinedInput
                  name="cancelDays" // Added name
                  data-field="cancelDays" // Data attribute for scrolling
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
                        validationTriggered && invalidFields.cancelDays
                          ? "red"
                          : "#ccc",
                    },
                  }}
                  placeholder="Cancel up to X days before (Enter only numbers)"
                  value={cancelDays}
                  onChange={handleChangeInput}
                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                />
                {validationTriggered && invalidFields.cancelDays && (
                  <Typography
                    color="error"
                    sx={{ fontFamily: "albert sans", fontSize: "12px", mt: -0.5 }} // Adjusted margin
                  >
                    Days before cancellation is required and must be greater than 0.
                  </Typography>
                )}
                <FormControl
                  sx={{
                    width: "100%",
                    height: "40px", // Adjusted height for better alignment
                    fontFamily: "Albert Sans",
                    // Added validation border color
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        validationTriggered && invalidFields.deductionType
                          ? "red"
                          : "#ccc",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#19AEDC",
                    },
                  }}
                  size="small"
                >
                  <InputLabel
                    id="deduction-type-label"
                    sx={{ fontFamily: "Albert Sans" }}
                  >
                    Deduction Type
                  </InputLabel>
                  <Select
                    labelId="deduction-type-label"
                    id="deduction-type-select"
                    name="deductionType" // Added name
                    data-field="deductionType" // Data attribute for scrolling
                    value={deductionType}
                    onChange={handleChangeInput}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    input={
                      <OutlinedInput
                        label="Deduction Type"
                        sx={{
                          height: "50px", // Maintained consistency for Select input height
                          fontFamily: "Albert Sans",
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#19AEDC",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor:
                              validationTriggered && invalidFields.deductionType
                                ? "red"
                                : "#ccc",
                          },
                        }}
                      />
                    }
                  >
                    <MenuItem
                      value="percentage"
                      sx={{ fontFamily: "Albert Sans" }}
                    >
                      Percentage
                    </MenuItem>
                    {/* Add other deduction types if needed */}
                  </Select>
                  {validationTriggered && invalidFields.deductionType && (
                    <Typography
                      color="error"
                      sx={{ fontFamily: "albert sans", fontSize: "12px", mt: 0.5 }}
                    >
                      Deduction Type is required.
                    </Typography>
                  )}
                </FormControl>
                <OutlinedInput
                  name="deductionRate" // Added name
                  data-field="deductionRate" // Data attribute for scrolling
                  placeholder="Deduction Rate (e.g., 10 for 10%)"
                  disabled={isFocused} // Keep disabled if select is focused to avoid interaction issues
                  sx={{
                    width: "100%",
                    height: "40px",
                    fontFamily: "Albert Sans",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor:
                        validationTriggered && invalidFields.deductionRate
                          ? "red"
                          : "#ccc",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#19AEDC",
                    },
                  }}
                  inputProps={{ inputMode: "decimal", pattern: "[0-9.]*" }} // Allows decimals
                  value={deductionRate}
                  onChange={handleChangeInput}
                />
                {validationTriggered && invalidFields.deductionRate && (
                  <Typography
                    color="error"
                    sx={{ fontFamily: "albert sans", fontSize: "12px", mt: -0.5 }}
                  >
                    Deduction Rate is required and must be greater than 0.
                  </Typography>
                )}
              </Box>
            )}
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
            onClick={handleFinal}
            variant="contained" // Removed disabled={!isFormValid()}
            sx={{
              textTransform: "none",
              backgroundColor: "#19AEDC",
              fontFamily: "albert sans",
              fontSize: "17px",
              mt: isMobile ? 1 : null,
            }}
          >
            Proceed to preview
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default FinalSetup;