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
  const { formData, setFormData, updateFormSection, updatedFormData } =
    useEventContext();

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
  const [ticketCount, setTicketCount] = useState(10);
  const maxLimit = totalAttendees; 
  const minLimit = 10;

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
    const value = e.target.value;

    // Allow only digits
    if (/^\d*$/.test(value)) {
      const numericValue = Number(value);
      if (numericValue >= minLimit && numericValue <= maxLimit) {
        setTicketCount(numericValue);
      } else if (value === "") {
        setTicketCount("");
      }
    }
  };

  const handleBlur = () => {
    if (ticketCount === "" || isNaN(ticketCount)) {
      setTicketCount(minLimit);
    } else if (ticketCount < minLimit) {
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
    // const finalSetup = {
    //   contact: localData.contact,
    //   tags: localData.tags,
    //   FAQ,
    // };

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
            width: "70%",
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
                fontSize: "28px",
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
                  width: "40%",
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
                fontSize: "28px",
                mb: "1%",
              }}
            >
              Ticket Limit
            </Typography>
            <Box sx={{display:'flex', alignItems:'center',width:'80%', justifyContent:'space-between' }}>
              <Typography sx={{fontFamily:'albert sans'}}>
                How many tickets should be booked in a single booking
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
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
                  fontSize: "28px",
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
                  mt: "1%",
                  borderRadius: "10px",
                }}
              >
                <Box sx={{ width: "95%" }}>
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
                    display: "flex",
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
                fontSize: "28px",
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
                  width: "40%",
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
                  width: "40%",
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
            variant="contained"
            sx={{
              textTransform: "none",
              backgroundColor: "#19AEDC",
              fontFamily: "albert sans",
              fontSize: "17px",
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
