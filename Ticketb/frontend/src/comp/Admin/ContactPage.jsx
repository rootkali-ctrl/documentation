import React, { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
  InputAdornment
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  Article as ArticleIcon,
  Settings as SettingsIcon,
  ContactPage as ContactPageIcon,
  Event as EventIcon,
  Edit as EditIcon,
  VisibilityOff
} from "@mui/icons-material";

const sidebarItems = [
  { name: "Dashboard", icon: <TrendingUpIcon />, active: false, path: "/admin/dashboardupcoming" },
  { name: "Users", icon: <GroupIcon />, active: false, path: "/admin/userpage" },
  { name: "Posts", icon: <ArticleIcon />, active: false, path: "/admin/postpage" },
  { name: "Login Settings", icon: <SettingsIcon />, active: false, path: "/admin/loginsettings" },
  { name: "Contact", icon: <ContactPageIcon />, active: true, path: "/admin/contactpage" },
  { name: "Events", icon: <EventIcon />, active: false, path: "/admin/eventmanagement" },
];


const ContactPage = () => {
  const [formData, setFormData] = useState({
    username: "admin_user",
    password: "password123",
    contact: "+1 234 567 890",
    address: "123 Event Street, Suite 456, Event City, EC 12345",
    email: "ticketb@gmail.com",
  });

  const [editMode, setEditMode] = useState({
    username: true,
    password: true,
    contact: true,
    address: true,
    email: false,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const toggleEdit = (field) => {
    setEditMode((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

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
          <Typography variant="h5" fontWeight="bold" mb={1}>
            Contact Management
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Manage your admin contact details
          </Typography>

          <Box
            bgcolor="white"
            p={4}
            borderRadius={2}
            boxShadow={2}
            width="100%"
            maxWidth="700px"
          >
            <Stack spacing={3}>
              {/* Username */}
              <TextField
                label="Username"
                variant="outlined"
                value={formData.username}
                onChange={(e) => handleChange("username", e.target.value)}
                disabled={!editMode.username}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleEdit("username")}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password */}
              <TextField
                label="Password"
                variant="outlined"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                disabled={!editMode.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleEdit("password")}>
                        <VisibilityOff fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Contact Number */}
              <TextField
                label="Contact Number"
                variant="outlined"
                value={formData.contact}
                onChange={(e) => handleChange("contact", e.target.value)}
                disabled={!editMode.contact}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleEdit("contact")}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Address */}
              <TextField
                label="Address"
                variant="outlined"
                multiline
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                disabled={!editMode.address}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleEdit("address")}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Email */}
              <TextField
                label="Email Address"
                variant="outlined"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                disabled={!editMode.email}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => toggleEdit("email")}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Stack>

            <Box mt={4} textAlign="left">
              <Button variant="contained" sx={{ backgroundColor: "#19aedc", px: 4 }}>
                Save Changes
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ContactPage;
