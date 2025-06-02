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
  useMediaQuery
} from "@mui/material";
import React, { useEffect, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEventContext } from "./EventContext";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Add, Remove } from "@mui/icons-material";
const FinalSetup = () => {
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const { formData, updateFormSection, markStepCompleted, shouldRedirectToStep1, stepCompletion } = useEventContext();
  const isMobile = useMediaQuery("(max-width:900px)");
  // Redirect logic for reload detection and step validation
  useEffect(() => {
    // Redirect to step 1 if page was reloaded
    if (shouldRedirectToStep1()) {
      navigate(`/createevent/${vendorId}/step1`);
      return;
    }

    // Redirect to step 1 if previous steps are not completed or required data is missing
    if (!stepCompletion.step1 || !stepCompletion.step2 || 
        !formData.eventDetails?.name || 
        !formData.pricing?.tickets?.length ||
        Object.keys(formData.eventDetails || {}).length === 0) {
      navigate(`/createevent/${vendorId}/step1`);
      return;
    }
  }, [shouldRedirectToStep1, stepCompletion, formData, navigate, vendorId]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "deductionRate") setDeductionRate(value);
    else if (name === "deductionType") setDeductionType(value);
    else {
      setLocalData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  useEffect(() => {
    console.log(formData)
  })

  const [localData, setLocalData] = useState({ contact: "", tags: "" });
  const [FAQ, setFAQ] = useState([{ ques: "", ans: "" }]);
  const [isCancel, setIsCancel] = useState(false);
  const [cancelDays, setCancelDays] = useState("");
  const [deductionRate, setDeductionRate] = useState("");
  const [deductionType, setDeductionType] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  
  const totalAttendees = formData?.pricing?.tickets?.reduce((acc, ticket) => {
    return acc + Number(ticket.seats || 0);
  }, 0);

  const handleAddFAQ = () => {
    setFAQ([
      ...FAQ,
      {
        ques: "",
        ans: "",
      },
    ]);
  };

  const isFormValid = () => {
  const faqs =
    FAQ.length > 0 &&
    FAQ.every(
      (t) =>
        t.ques.trim() !== "" &&
        t.ans.trim() !== ""
    );
    const tags = 
    localData.tags.length>0

  return faqs && tags;
};


  const [ticketCount, setTicketCount] = useState(10);
  const maxLimit = 10; 
  const minLimit = 1;

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

  const handleInputChange = (e) => {
  const value = parseInt(e.target.value);
  if (!isNaN(value)) {
    setTicketCount(value);
  }
};

const handleBlur = () => {
  if (ticketCount < minLimit) {
    setTicketCount(minLimit);
  } else if (ticketCount > maxLimit) {
    setTicketCount(maxLimit);
  }
};


  const handleRemoveFAQ = (indexToRemove) => {
    const removeItem = [...FAQ];
    removeItem.splice(indexToRemove, 1);
    setFAQ(removeItem);
  };

  const handleFinal = async () => {
    updateFormSection("finalSetup", {
      contact: localData.contact,
      tags: localData.tags,
      FAQ,
      cancellationAvailable: isCancel,
      cancellationDays: cancelDays,
      deductionType,
      deductionRate,
      ticketCount
    });
    markStepCompleted("step3")
    navigate(`/createevent/${vendorId}/eventpreview`);
  };

  const handleFAQChange = (index, field, value) => {
    const updatedFAQ = [...FAQ];
    updatedFAQ[index][field] = value;
    setFAQ(updatedFAQ);
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
            width:isMobile?"90%": "70%",
            boxSizing: "border-box",
            backgroundColor: "white",
            height: "auto",
            borderRadius: "10px",
            margin: "0 auto",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize:isMobile?"20px": "28px",
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
                value={localData.contact}
                onChange={handleChange}
                placeholder="xyz@gmail.com"
                sx={{
                  width: isMobile?"90%":"40%",
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

          <Box sx={{ mt: "2%" }}>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize:isMobile?"20px": "28px",
                mb: "1%",
              }}
            >
              Ticket Limit
            </Typography>
            <Box sx={{display:isMobile?"block":'flex', alignItems:'center',width:'80%', justifyContent:'space-between' }}>
              <Typography sx={{fontFamily:'albert sans',fontSize:isMobile?"14px":"16px"}}>
                How many tickets should be booked in a single booking
              </Typography>
              <Box display="flex" alignItems="center" gap={1} sx={{mt:isMobile?2:null,mb:isMobile?2:null}}>
                <IconButton
                  onClick={handleDecrement}
                  disabled={ticketCount <= minLimit}
                >
                  <Remove />
                </IconButton>

                <TextField
                  value={ticketCount}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  inputProps={{
                    style: { textAlign: "center", width: "40px" },
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
                  fontSize:isMobile?"20px": "28px",
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
                  border: "1px solid #ccc",
                  padding: "2%",
                  mt: isMobile?1:"1%",
                  borderRadius: "10px",
                }}
              >
                <Box sx={{ width: isMobile?"90%":"95%" }}>
                  <FormControl fullWidth variant="outlined">
                    <OutlinedInput
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
                          borderColor: "#ccc",
                        },
                      }}
                    />
                  </FormControl>
                  <FormControl fullWidth variant="outlined" sx={{ mt: "1%" }}>
                    <OutlinedInput
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
                          borderColor: "#ccc",
                        },
                      }}
                    />
                  </FormControl>
                </Box>
                <Box
                  sx={{
                    display:isMobile?"block": "flex",
                    justifyContent: "flex-end",
                    width: "5%",
                  }}
                >
                  <DeleteIcon
                    onClick={() => handleRemoveFAQ(index)}
                    sx={{
                      cursor: "pointer",
                      color: "gray",
                      "&:hover": { color: "red" },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: "2%" }}>
            <Typography
              sx={{
                fontFamily: "albert sans",
                fontWeight: "900",
                fontSize: isMobile?"20px": "28px",
              }}
            >
              Tags
            </Typography>
            <FormControl fullWidth variant="outlined" sx={{ mt: "2%" }}>
              <OutlinedInput
                name="tags"
                value={localData.tags}
                onChange={handleChange}
                placeholder="add tags"
                sx={{
                  width:isMobile?"90%": "40%",
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

          <Box sx={{ mt: "2%" }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isCancel}
                  onChange={(e) => setIsCancel(e.target.checked)}
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
                  fontSize: "16px", // optional
                },
              }}
            />

            {isCancel && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  width: isMobile?"90%":"40%",
                  gap: "1em",
                }}
              >
                <OutlinedInput
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
                  placeholder="Days before event to cancel"
                  value={cancelDays}
                  onChange={(e) => setCancelDays(e.target.value)}
                />
                <FormControl
                  sx={{
                    width: "100%",
                    height: "40px",
                    fontFamily: "Albert Sans",
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
                    value={deductionType}
                    onChange={handleChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    name="deductionType"
                    input={
                      <OutlinedInput
                        label="Deduction Type"
                        sx={{
                          height: "50px",
                          mt: "1%",
                          fontFamily: "Albert Sans",
                          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#19AEDC",
                          },
                          "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "#ccc",
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
                    <MenuItem value="price" sx={{ fontFamily: "Albert Sans" }}>
                      Price
                    </MenuItem>
                  </Select>
                </FormControl>
                <OutlinedInput
                  placeholder="Deduction Rate"
                  disabled={isFocused}
                  sx={{
                    width: "100%",

                    height: "40px",
                    fontFamily: "Albert Sans",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#ccc",
                    },
                  }}
                  value={deductionRate}
                  onChange={(e) => setDeductionRate(e.target.value)}
                />
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
            disabled={!isFormValid()}
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: "#19AEDC",
              fontFamily: "albert sans",
              fontSize: "17px",
              mt:isMobile?1:null
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
