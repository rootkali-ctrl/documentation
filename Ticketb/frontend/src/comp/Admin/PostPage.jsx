import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  Typography
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Article as ArticleIcon,
  Settings as SettingsIcon,
  ContactPage as ContactPageIcon,
  Event as EventIcon,
  Add,
  Edit,
  Delete,
  ArrowBackIos,
  ArrowForwardIos
} from "@mui/icons-material";

const sidebarItems = [
  { name: "Dashboard", icon: <TrendingUpIcon />, active: false, path: "/admin/dashboardupcoming" },
  { name: "Users", icon: <GroupIcon />, active: false, path: "/admin/userpage" },
  { name: "Posts", icon: <ArticleIcon />, active: true, path: "/admin/postpage" },
  { name: "Login Settings", icon: <SettingsIcon />, active: false, path: "/admin/loginsettings" },
  { name: "Contact", icon: <ContactPageIcon />, active: false, path: "/admin/contactpage" },
  { name: "Events", icon: <EventIcon />, active: false, path: "/admin/eventmanagement" },
];


const PostPage = () => {
  const MAX_VISIBLE = 1;
  const [heroBanners, setHeroBanners] = useState([]);
  const [inlineBanners, setInlineBanners] = useState([]);
  const [startIndex, setStartIndex] = useState(0);

  const handleAddBanner = (setter) => (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setter((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = (index, banners, setter) => {
    const updated = banners.filter((_, i) => i !== index);
    setter(updated);
    if (startIndex > 0 && updated.length - startIndex < MAX_VISIBLE) {
      setStartIndex(startIndex - 1);
    }
  };

  const visibleHero = heroBanners.slice(startIndex, startIndex + MAX_VISIBLE);

  return (
    <Box height="100vh" display="flex" flexDirection="column" bgcolor="#faf9fb">
      {/* Top Bar */}
      <Box height={89} display="flex" justifyContent="space-between" alignItems="center" px={5} py={2} borderBottom="1px solid #ddd" bgcolor="#f9fafb">
        <Typography variant="h4">
          <Box component="span" fontWeight="bold" color="#19aedc">ticketb</Box>
          <Box component="span" fontWeight="bold" color="black"> admin</Box>
        </Typography>
        <Typography variant="body1" fontSize={18}>Last login at 7th Oct 2025 13:00</Typography>
      </Box>

      {/* Body */}
      <Box display="flex" flex={1}>
        {/* Sidebar */}
        <Box
          width={276}
          flexShrink={0}
          bgcolor="#f9fafb"
          py={10}
          px={3}
          boxShadow={3}
          position="sticky"
          top={0}
          height="90vh"
          overflow="auto"
        >
          {sidebarItems.map((item) => (
            <Button
            key={item.name}
            onClick={() => window.location.href = item.path}
            variant={item.active ? "contained" : "outlined"}
            fullWidth
            sx={{
              justifyContent: "flex-start",
              my: 2,
              paddingY: 2,
              borderRadius: "10px",
              borderColor: item.active ? "#19aedc" : "#ddd",
              bgcolor: item.active ? "#e3f2fd" : "white",
              color: item.active ? "#19aedc" : "black",
              textTransform: "none",
              fontWeight: item.active ? "bold" : "normal",
              gap: 2,
              boxShadow: 1,
            }}
            startIcon={item.icon}
          >
            {item.name}
          </Button>
          
          ))}
        </Box>

        {/* Main Content */}
        <Box flex={1} px={5} py={4} overflow="auto" maxHeight="calc(100vh - 89px)">
          {/* Hero Banners Section */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold">Hero Banners</Typography>
            <Button component="label" variant="contained" startIcon={<Add />} sx={{ bgcolor: "#19aedc" }}>
              Add Banner
              <input type="file" hidden onChange={handleAddBanner(setHeroBanners)} accept="image/*" />
            </Button>
          </Stack>

          <Box position="relative" borderRadius={2} overflow="hidden" bgcolor="white" boxShadow={1} px={3} py={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              {startIndex > 0 && (
                <IconButton onClick={() => setStartIndex(startIndex - 1)}>
                  <ArrowBackIos />
                </IconButton>
              )}

              {visibleHero.map((banner, index) => (
                <Box
                  key={index + startIndex}
                  sx={{
                    position: "relative",
                    width: "100%",
                    height: 250,
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={banner}
                    alt={`hero-banner-${index}`}
                    style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }}
                  />
                  <Box position="absolute" bottom={10} right={10}>
                    <IconButton sx={{ bgcolor: "#fff", mx: 1 }}><Edit /></IconButton>
                    <IconButton
                      sx={{ bgcolor: "#fff" }}
                      onClick={() => handleDelete(index + startIndex, heroBanners, setHeroBanners)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>
              ))}

              {heroBanners.length > startIndex + MAX_VISIBLE && (
                <IconButton onClick={() => setStartIndex(startIndex + 1)}>
                  <ArrowForwardIos />
                </IconButton>
              )}
            </Stack>

            {/* Dot Indicators */}
            <Stack direction="row" justifyContent="center" mt={2} spacing={1}>
              {heroBanners.map((_, i) => (
                <Box
                  key={i}
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: i === startIndex ? "#19aedc" : "grey.400",
                  }}
                />
              ))}
            </Stack>
          </Box>

          {/* Inline Banner Section */}
          <Stack direction="row" justifyContent="space-between" alignItems="center" mt={6} mb={2}>
            <Typography variant="h6" fontWeight="bold">Inline Banner</Typography>
            <Button component="label" variant="contained" startIcon={<Add />} sx={{ bgcolor: "#19aedc" }}>
              Add Banner
              <input type="file" hidden onChange={handleAddBanner(setInlineBanners)} accept="image/*" />
            </Button>
          </Stack>

          <Box borderRadius={2} overflow="hidden" bgcolor="white" boxShadow={1} px={3} py={2}>
            {inlineBanners.map((banner, index) => (
              <Box
                key={index}
                sx={{
                  position: "relative",
                  width: "100%",
                  height: 200,
                  borderRadius: 2,
                  overflow: "hidden",
                  mb: 2,
                }}
              >
                <img
                  src={banner}
                  alt={`inline-banner-${index}`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 10 }}
                />
                <Box position="absolute" bottom={10} right={10}>
                  <IconButton sx={{ bgcolor: "#fff", mx: 1 }}><Edit /></IconButton>
                  <IconButton
                    sx={{ bgcolor: "#fff" }}
                    onClick={() => handleDelete(index, inlineBanners, setInlineBanners)}
                  >
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PostPage;
