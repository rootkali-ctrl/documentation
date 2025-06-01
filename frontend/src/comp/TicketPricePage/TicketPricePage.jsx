import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  CardContent,
  Modal,
  Card,
  CircularProgress,
  Grid,
  Tabs,
  Tab,
  Container,
  Alert,
  useMediaQuery,
} from "@mui/material";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import FastfoodIcon from "@mui/icons-material/Fastfood";
import { useNavigate, useParams } from "react-router-dom";
import Header from "../Header/MainHeaderWOS";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase_config";
import { getAuth } from "firebase/auth";

const steps = ["Select Tickets", "Details", "Payment"];

// Default images based on category
const defaultFoodImages = {
  Popcorn:
    "https://recipeforperfection.com/wp-content/uploads/2017/11/Movie-Theater-Popcorn-in-a-popcorn-bucket.jpg",
  Snacks:
    "https://www.mashed.com/img/gallery/the-untold-truth-of-movie-theater-nachos/intro-1567530294.jpg",
  Beverages:
    "https://www.coca-cola.com/content/dam/journey/us/en/private/2019/03/coca-cola-media-1-1200x900.jpg",
  Default: "https://static.toiimg.com/thumb/54659021.cms?width=1200&height=900",
};

const getDefaultImage = (itemName) => {
  const category = Object.keys(defaultFoodImages).find((key) =>
    itemName.toLowerCase().includes(key.toLowerCase())
  );
  return category ? defaultFoodImages[category] : defaultFoodImages["Default"];
};

const TicketPricePage = ({ activeStep = 0 }) => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTickets, setSelectedTickets] = useState({});
  const [isFreeTicket, setIsFreeTicket] = useState(false);
  const [openBiteModal, setOpenBiteModal] = useState(false);
  const [selectedFoodItems, setSelectedFoodItems] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isProcessingBooking, setIsProcessingBooking] = useState(false);
  const [error, setError] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const CONVENIENCE_FEE = 40; // Rs 40 convenience fee
  const isMobile = useMediaQuery("(max-width:600px)");

  const auth = getAuth();
  const userUID = auth.currentUser?.uid;

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!eventId) {
          throw new Error("No event ID provided");
        }

        const eventDoc = await getDoc(doc(db, "events", eventId));

        if (!eventDoc.exists()) {
          throw new Error("Event not found");
        }

        const eventData = eventDoc.data();
        const maxTicketCount = parseInt(eventData.ticketCount) || 10; // Parse ticketCount as integer
        const ticketsWithUniqueIds = eventData.pricing
          ? eventData.pricing.map((ticket, index) => ({
              ...ticket,
              id: ticket.id || `pricing-${index}`,
              available: ticket.available || 0, // Ensure available is set
              seats: ticket.seats || 0, // Total seats for reference
            }))
          : [];

        const perks =
          eventData.perks && Array.isArray(eventData.perks)
            ? eventData.perks
            : [];

        const processedFoodItems = perks.map((perk, index) => {
          let category = "Other";
          if (perk.itemName.toLowerCase().includes("popcorn")) {
            category = "Popcorn";
          } else if (
            perk.itemName.toLowerCase().includes("soda") ||
            perk.itemName.toLowerCase().includes("water") ||
            perk.itemName.toLowerCase().includes("drink") ||
            perk.itemName.toLowerCase().includes("juice") ||
            perk.itemName.toLowerCase().includes("coffee")
          ) {
            category = "Beverages";
          } else if (
            perk.itemName.toLowerCase().includes("nachos") ||
            perk.itemName.toLowerCase().includes("fries") ||
            perk.itemName.toLowerCase().includes("nugget") ||
            perk.itemName.toLowerCase().includes("sandwich") ||
            perk.itemName.toLowerCase().includes("snack") ||
            perk.itemName.toLowerCase().includes("burger")
          ) {
            category = "Snacks";
          }

          return {
            id: index + 1,
            name: perk.itemName,
            description: `Delicious ${perk.itemName} for your event enjoyment`,
            image: perk.url || getDefaultImage(perk.itemName),
            price: perk.price || 0,
            category: category,
            limit: perk.limit || 100,
          };
        });

        setFoodItems(processedFoodItems);

        setEvent({
          id: eventDoc.id,
          ...eventData,
          ticket: ticketsWithUniqueIds,
          ticketCount: maxTicketCount,
          foodPerks: perks,
        });

        if (
          ticketsWithUniqueIds.length > 0 &&
          ticketsWithUniqueIds.every((ticket) => ticket.free)
        ) {
          setIsFreeTicket(true);
        }
      } catch (error) {
        console.error("Error fetching event details:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  useEffect(() => {
    console.log(userUID);
  }, [userUID]);

  const handleIncrement = (ticketId) => {
    if (!ticketId || !event || !event.ticket) return;

    const ticketType = event.ticket.find((t) => t.id === ticketId);
    if (!ticketType) return;

    const available = ticketType.available || 0;
    const currentCount = selectedTickets[ticketId] || 0;
    const totalSelected = getTotalTicketCount();
    const maxTicketCount = event.ticketCount || 10;

    if (
      currentCount < available &&
      totalSelected < maxTicketCount &&
      !isFreeTicket
    ) {
      setSelectedTickets((prev) => ({
        ...prev,
        [ticketId]: currentCount + 1,
      }));
    } else if (totalSelected >= maxTicketCount) {
      setError(`Cannot select more than ${maxTicketCount} tickets per purchase.`);
    }
  };

  const handleDecrement = (ticketId) => {
    if (!ticketId) return;

    const currentCount = selectedTickets[ticketId] || 0;

    if (currentCount > 0) {
      const updatedSelectedTickets = { ...selectedTickets };
      updatedSelectedTickets[ticketId] = currentCount - 1;

      if (updatedSelectedTickets[ticketId] === 0) {
        delete updatedSelectedTickets[ticketId];
      }

      setSelectedTickets(updatedSelectedTickets);
      if (getTotalTicketCount() - 1 < event.ticketCount) {
        setError(null);
      }
    }
  };

  const handleFoodIncrement = (foodId) => {
    const currentCount = selectedFoodItems[foodId] || 0;
    const foodItem = foodItems.find((item) => item.id === parseInt(foodId));
    const limit = foodItem?.limit || 10;

    if (currentCount < Math.min(10, limit)) {
      setSelectedFoodItems((prev) => ({
        ...prev,
        [foodId]: currentCount + 1,
      }));
    }
  };

  const handleFoodDecrement = (foodId) => {
    const currentCount = selectedFoodItems[foodId] || 0;

    if (currentCount > 0) {
      const updatedFoodItems = { ...selectedFoodItems };
      updatedFoodItems[foodId] = currentCount - 1;

      if (updatedFoodItems[foodId] === 0) {
        delete updatedFoodItems[foodId];
      }

      setSelectedFoodItems(updatedFoodItems);
    }
  };

  const calculateSubtotal = () => {
    if (isFreeTicket) return 0;

    const ticketsTotal = Object.keys(selectedTickets).reduce((sum, id) => {
      const ticket = event?.ticket?.find((t) => t.id === id);
      return sum + selectedTickets[id] * (ticket?.price || 0);
    }, 0);

    const foodTotal = Object.keys(selectedFoodItems).reduce((sum, id) => {
      const item = foodItems.find((item) => item.id === parseInt(id));
      return sum + selectedFoodItems[id] * (item?.price || 0);
    }, 0);

    return ticketsTotal + foodTotal;
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal + (subtotal > 0 ? CONVENIENCE_FEE : 0);
  };

  const getTotalTicketCount = () => {
    return Object.values(selectedTickets).reduce(
      (sum, count) => sum + count,
      0
    );
  };

  const getTotalFoodCount = () => {
    return Object.values(selectedFoodItems).reduce((a, b) => a + b, 0);
  };

  const foodCategories = [
    "All",
    ...new Set(foodItems.map((item) => item.category)),
  ];

  const filteredFoodItems =
    selectedCategory === "All"
      ? foodItems
      : foodItems.filter((item) => item.category === selectedCategory);

  const prepareSelectedFoodPerks = () => {
    return Object.keys(selectedFoodItems).map((id) => {
      const item = foodItems.find((item) => item.id === parseInt(id));
      return {
        itemName: item?.name || "Food Item",
        price: item?.price || 0,
        limit: item?.limit || 100,
        quantity: selectedFoodItems[id],
      };
    });
  };

  const handleProceed = async () => {
    if (!userUID) {
      alert("Please sign in to continue");
      navigate("/");
      return;
    }

    setIsProcessingBooking(true);

    try {
      if (
        getTotalTicketCount() === 0 &&
        !isFreeTicket &&
        getTotalFoodCount() === 0
      ) {
        throw new Error("Please select at least one ticket or food item");
      }

      if (getTotalTicketCount() > event.ticketCount && !isFreeTicket) {
        throw new Error(
          `Cannot select more than ${event.ticketCount} tickets per purchase.`
        );
      }

      if (getTotalFoodCount() > 0) {
        const selectedFoodPerks = prepareSelectedFoodPerks();
        // Optional DB update
        // await updateDoc(doc(db, "events", eventId), {
        //   selectedPerks: selectedFoodPerks
        // });
      }

      const ticketSummary = Object.keys(selectedTickets).map((id) => {
        const ticket = event?.ticket?.find((t) => t.id === id);
        return {
          type: ticket?.ticketType || "Standard Ticket",
          quantity: selectedTickets[id],
          price: ticket?.price || 0,
          subtotal: selectedTickets[id] * (ticket?.price || 0),
        };
      });

      if (isFreeTicket) {
        ticketSummary.push({
          type: "Free Admission",
          quantity: 1,
          price: 0,
          subtotal: 0,
        });
      }

      const foodSummary = Object.keys(selectedFoodItems).map((id) => {
        const item = foodItems.find((item) => item.id === parseInt(id));
        return {
          name: item?.name || "Food Item",
          quantity: selectedFoodItems[id],
          price: item?.price || 0,
          subtotal: selectedFoodItems[id] * (item?.price || 0),
        };
      });

      const subtotal = calculateSubtotal();
      const totalAmount = calculateTotal();

      navigate(`/proceedtopay/${eventId}/${userUID}`, {
        state: {
          event: {
            id: event.id,
            vendorId: event.vendorId,
            name: event.name,
            date: event.eventDate,
            location: event.venueDetails?.city || "Unknown Location",
            description: event.description || "No description available",
          },
          ticketSummary,
          foodSummary,
          financial: {
            subtotal,
            convenienceFee: CONVENIENCE_FEE,
            totalAmount,
          },
          selectedPerks: prepareSelectedFoodPerks(),
        },
      });
    } catch (error) {
      console.error("Error proceeding to payment:", error);
      setError(error.message);
    } finally {
      setIsProcessingBooking(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9FAFB",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const hasFoodPerks = foodItems && foodItems.length > 0;

  return (
    <Box
      sx={{
        backgroundColor: "#F9FAFB",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        pb: 8,
      }}
    >
      <Header />

      <Container maxWidth="md" sx={{ mt: 2 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={index}>
              <StepLabel
                sx={{
                  "& .MuiStepLabel-label": {
                    color: activeStep === index ? "#19AEDC" : "#ccc",
                    fontWeight: activeStep === index ? "bold" : "normal",
                  },
                  "& .MuiStepIcon-root": {
                    color: activeStep === index ? "#19AEDC" : "#ccc",
                  },
                  "& .Mui-active .MuiStepIcon-root": { color: "#19AEDC" },
                  "& .Mui-completed .MuiStepIcon-root": { color: "#19AEDC" },
                }}
              >
                {label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Container>

      {error && (
        <Container maxWidth="md" sx={{ mt: 2 }}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Container>
      )}

      <Container maxWidth="md" sx={{ mt: 2 }}>
        <Card
          sx={{
            borderRadius: "10px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          <CardContent sx={{ textAlign: { xs: "left", sm: "center" } }}>
            <Typography
              variant="h5"
              sx={{ fontWeight: "bold", textAlign: { xs: "left", sm: "center" } }}
            >
              {event?.name || "Event Name"}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                alignItems: { xs: "flex-start", sm: "center" },
                gap: 2,
                textAlign: { xs: "left", sm: "center" },
                justifyContent: { xs: "flex-start", sm: "center" },
                mt: isMobile ? 2 : 1,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EventIcon sx={{ color: "#19AEDC" }} />
                <Typography variant="body2" sx={{ color: "#4B5563" }}>
                  {event?.eventDate
                    ? new Date(event.eventDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Date not specified"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AccessTimeIcon sx={{ color: "#19AEDC" }} />
                <Typography variant="body2" sx={{ color: "#4B5563" }}>
                  {event?.eventDate
                    ? new Date(event.eventDate).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })
                    : "Time not specified"}
                </Typography>
              </Box>

              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LocationOnIcon sx={{ color: "#19AEDC" }} />
                <Typography variant="body2" sx={{ color: "#4B5563" }}>
                  {event?.venueDetails?.city || "Location"}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>

      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
          Select Your Tickets (Max {event.ticketCount} per purchase)
        </Typography>

        {event?.ticket && event.ticket.length > 0 ? (
          event.ticket.map((ticket) => {
            const ticketId = String(ticket.id);
            const available = ticket.available || 0;
            const isSoldOut = available <= 0;
            const thisTicketCount = selectedTickets[ticketId] || 0;

            return (
              <Card
                key={ticketId}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 2,
                  mb: 2,
                  borderRadius: "10px",
                  boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.05)",
                  borderLeft:
                    thisTicketCount > 0 ? "4px solid #19AEDC" : "none",
                }}
              >
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {ticket.ticketType || "Standard Ticket"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color:
                        isFreeTicket || ticket.free
                          ? "text.secondary"
                          : "text.primary",
                      textDecoration:
                        isFreeTicket || ticket.free ? "line-through" : "none",
                    }}
                  >
                    ₹{ticket.price || 0}
                  </Typography>
                  {(isFreeTicket || ticket.free) && (
                    <Typography
                      variant="body2"
                      sx={{ color: "green", fontWeight: "bold" }}
                    >
                      FREE
                    </Typography>
                  )}
                  {isSoldOut && (
                    <Typography
                      variant="body2"
                      sx={{ color: "error.main", fontWeight: "bold" }}
                    >
                      Sold Out
                    </Typography>
                  )}
                  {!isSoldOut && available < 10 && available > 0 && (
                    <Typography variant="body2" sx={{ color: "warning.main" }}>
                      Only {available} left
                    </Typography>
                  )}
                  {ticket.features && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {ticket.features}
                    </Typography>
                  )}
                </Box>

                {isSoldOut ? (
                  <Typography sx={{ color: "error.main", fontWeight: "bold" }}>
                    Sold Out
                  </Typography>
                ) : thisTicketCount > 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      border: "1px solid #19AEDC",
                      borderRadius: "5px",
                      backgroundColor: "#FFFFFF",
                    }}
                  >
                    <IconButton
                      onClick={() => handleDecrement(ticketId)}
                      size="small"
                    >
                      <RemoveIcon sx={{ color: "#19AEDC" }} />
                    </IconButton>
                    <Typography sx={{ margin: "0 10px", fontWeight: "bold" }}>
                      {thisTicketCount}
                    </Typography>
                    <IconButton
                      onClick={() => handleIncrement(ticketId)}
                      disabled={
                        thisTicketCount >= available ||
                        getTotalTicketCount() >= event.ticketCount ||
                        isFreeTicket
                      }
                      size="small"
                    >
                      <AddIcon
                        sx={{
                          color:
                            thisTicketCount >= available ||
                            getTotalTicketCount() >= event.ticketCount ||
                            isFreeTicket
                              ? "#ccc"
                              : "#19AEDC",
                        }}
                      />
                    </IconButton>
                  </Box>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={() => handleIncrement(ticketId)}
                    disabled={getTotalTicketCount() >= event.ticketCount || isFreeTicket}
                    sx={{
                      borderColor: "#19AEDC",
                      color: "#19AEDC",
                      "&:hover": {
                        borderColor: "#19AEDC",
                        backgroundColor: "rgba(25, 174, 220, 0.1)",
                      },
                    }}
                  >
                    Add
                  </Button>
                )}
              </Card>
            );
          })
        ) : (
          <Typography variant="body2" color="text.secondary">
            No tickets available for this event
          </Typography>
        )}
      </Container>

      <Container maxWidth="md" sx={{ mt: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          {event?.free && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#fff",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
                borderRadius: "10px",
                padding: "10px 20px",
                fontStyle: "italic",
                fontWeight: "bold",
                color: "#19AEDC",
                display: "flex",
                alignItems: "center",
                gap: 2,
                flex: 1,
                justifyContent: "center",
              }}
              onClick={() => {
                setIsFreeTicket(!isFreeTicket);
                if (!isFreeTicket) {
                  setSelectedTickets({});
                }
              }}
            >
              FREE EVENT
              <Box
                sx={{
                  width: "20px",
                  height: "20px",
                  border: "2px solid black",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isFreeTicket ? "green" : "white",
                }}
              >
                {isFreeTicket && (
                  <Typography sx={{ color: "white", fontWeight: "bold" }}>
                    ✓
                  </Typography>
                )}
              </Box>
            </Button>
          )}

          {hasFoodPerks && (
            <Button
              variant="contained"
              sx={{
                backgroundColor: "#fff",
                boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.2)",
                borderRadius: "10px",
                padding: "10px 20px",
                fontStyle: "italic",
                fontWeight: "bold",
                color: "#19AEDC",
                display: "flex",
                alignItems: "center",
                gap: 1,
                flex: 1,
                justifyContent: "center",
              }}
              onClick={() => setOpenBiteModal(true)}
              startIcon={<FastfoodIcon />}
            >
              GRAB A BITE!
              {getTotalFoodCount() > 0 && (
                <Box
                  sx={{
                    ml: 1,
                    backgroundColor: "#19AEDC",
                    color: "white",
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                  }}
                >
                  {getTotalFoodCount()}
                </Box>
              )}
            </Button>
          )}
        </Box>
      </Container>

      <Modal
        open={openBiteModal}
        onClose={() => setOpenBiteModal(false)}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Card
          sx={{
            maxWidth: 800,
            maxHeight: "90vh",
            overflowY: "auto",
            p: { xs: 2, sm: 3 },
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
              flexDirection: "row",
              gap: 1,
            }}
          >
            <Typography
              variant="h6"
              component="h2"
              fontWeight="bold"
              textAlign={{ xs: "center", sm: "left" }}
            >
              Add Snacks & Beverages
            </Typography>
            <IconButton onClick={() => setOpenBiteModal(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {foodItems.length > 0 ? (
            <>
              <Tabs
                value={selectedCategory}
                onChange={(e, newValue) => setSelectedCategory(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  mb: 2,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                {foodCategories.map((category) => (
                  <Tab
                    key={category}
                    label={category}
                    value={category}
                    sx={{
                      fontWeight:
                        selectedCategory === category ? "bold" : "normal",
                      color:
                        selectedCategory === category ? "#19AEDC" : "inherit",
                    }}
                  />
                ))}
              </Tabs>

              <Grid container spacing={2}>
                {filteredFoodItems.map((item) => {
                  const count = selectedFoodItems[item.id] || 0;

                  return (
                    <Grid item xs={12} sm={6} md={4} key={item.id}>
                      <Card
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          height: !isMobile ? "100%" : "100%",
                          width: !isMobile ? "100%" : "80%",
                          boxShadow:
                            count > 0
                              ? "0 0 0 2px #19AEDC"
                              : "0px 4px 12px rgba(0, 0, 0, 0.05)",
                          transition: "all 0.2s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-4px)",
                            boxShadow: "0px 8px 16px rgba(0, 0, 0, 0.1)",
                          },
                        }}
                      >
                        <Box sx={{ height: 140, overflow: "hidden" }}>
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        </Box>
                        <Box sx={{ p: 2, flexGrow: 1 }}>
                          <Typography
                            variant="h6"
                            component="h3"
                            fontSize={{ xs: "1rem", sm: "1.1rem" }}
                            gutterBottom
                          >
                            {item.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1, fontSize: { xs: "0.85rem", sm: "0.95rem" } }}
                          >
                            {item.description}
                          </Typography>
                          <Typography variant="subtitle1" fontWeight="bold">
                            ₹{item.price}
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            p: 2,
                            display: "flex",
                            justifyContent:
                              count > 0 ? "space-between" : "flex-end",
                            alignItems: "center",
                          }}
                        >
                          {count > 0 ? (
                            <>
                              <IconButton
                                size="small"
                                onClick={() => handleFoodDecrement(item.id)}
                                sx={{ color: "#19AEDC" }}
                              >
                                <RemoveIcon />
                              </IconButton>
                              <Typography fontWeight="bold">{count}</Typography>
                              <IconButton
                                size="small"
                                onClick={() => handleFoodIncrement(item.id)}
                                sx={{ color: "#19AEDC" }}
                              >
                                <AddIcon />
                              </IconButton>
                            </>
                          ) : (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleFoodIncrement(item.id)}
                              sx={{
                                borderColor: "#19AEDC",
                                color: "#19AEDC",
                                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                              }}
                            >
                              Add
                            </Button>
                          )}
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </>
          ) : (
            <Typography variant="body1" sx={{ textAlign: "center", py: 4 }}>
              No food items available for this event.
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "stretch", sm: "center" },
              mt: 3,
              gap: 2,
            }}
          >
            <Typography variant="h6" fontSize={{ xs: "1rem", sm: "1.2rem" }}>
              {getTotalFoodCount() > 0
                ? `${getTotalFoodCount()} items selected`
                : "No items selected"}
            </Typography>
            <Button
              variant="contained"
              fullWidth={true}
              onClick={() => setOpenBiteModal(false)}
              sx={{
                backgroundColor: "#19AEDC",
                "&:hover": { backgroundColor: "#148db1" },
                maxWidth: { sm: "200px" },
                alignSelf: { xs: "center", sm: "auto" },
              }}
            >
              Done
            </Button>
          </Box>
        </Card>
      </Modal>

      <Box
        sx={{
          backgroundColor: "white",
          padding: "15px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          boxShadow: "0px -4px 10px rgba(0, 0, 0, 0.05)",
          zIndex: 1000,
        }}
      >
        <Box>
          <Typography variant="body2" sx={{ color: "#6B7280" }}>
            {getTotalTicketCount() > 0
              ? `${getTotalTicketCount()} ${
                  getTotalTicketCount() === 1 ? "ticket" : "tickets"
                }`
              : isFreeTicket
              ? "Free Admission"
              : "No tickets selected"}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: "bold" }}>
            ₹{calculateTotal()}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<ShoppingCartIcon />}
          onClick={handleProceed}
          disabled={
            isProcessingBooking ||
            (getTotalTicketCount() === 0 &&
              !isFreeTicket &&
              getTotalFoodCount() === 0)
          }
          sx={{
            backgroundColor: "#19AEDC",
            "&:hover": { backgroundColor: "#148db1" },
            fontWeight: "bold",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.2)",
            borderRadius: "8px",
          }}
        >
          {isProcessingBooking ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Proceed"
          )}
        </Button>
      </Box>
    </Box>
  );
};

export default TicketPricePage;