import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  TextField,
  Typography,
  Link,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export const Body = () => {
  const formFields = [
    {
      id: "email",
      label: "Email Address",
      placeholder: "Enter your email",
      type: "email",
    },
    {
      id: "password",
      label: "Password",
      placeholder: "Enter your password",
      type: "password",
    },
  ];
  const navigate = useNavigate();
  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100vh"
      position="relative"
      bgcolor="#f3f4f6"
    >
      {/* Header */}
      <Box
        position="absolute"
        top={0}
        left={0}
        width="100%"
        height="89px"
        bgcolor="#f9fafb"
        borderBottom="1px solid #e0e0e0"
        display="flex"
        alignItems="center"
        paddingLeft={4}
      >
        <Typography variant="h4" component="div" fontWeight="900">
          <Box component="span" color="#19aedc">
            ticketb
          </Box>
          <Box component="span" color="black">
            admin
          </Box>
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        width="100%"
        maxWidth={534}
        margin="auto"
        paddingTop={12}
        paddingBottom={4}
        display="flex"
        flexDirection="column"
        alignItems="center"
      >
        <Typography variant="h3" fontWeight={600} align="center" gutterBottom>
          IT&apos;s YOU AGAIN..
        </Typography>

        <Card
          sx={{
            width: 448,
            borderRadius: "50px",
            boxShadow: "0px 25px 50px rgba(0,0,0,0.25)",
            mt: 8,
            bgcolor: "#ffffff",
          }}
        >
          <CardContent sx={{ px: 4, py: 6 }}>
            {/* Header */}
            <Box display="flex" flexDirection="column" alignItems="center" mb={6}>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                Welcome Back!
              </Typography>
              <Typography variant="body1" color="text.secondary" mt={2}>
                Log in to continue to ticketb
              </Typography>
            </Box>

            {/* Login Form */}
            <Box component="form" noValidate autoComplete="off">
              {formFields.map((field) => (
                <Box key={field.id} mb={3}>
                  <TextField
                    id={field.id}
                    label={field.label}
                    type={field.type}
                    placeholder={field.placeholder}
                    variant="outlined"
                    fullWidth
                    InputProps={{ style: { borderRadius: 12, height: 50 } }}
                  />
                </Box>
              ))}

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <FormControlLabel
                  control={<Checkbox color="primary" />}
                  label="Remember me"
                />
                <Link
                  href="#"
                  underline="hover"
                  sx={{
                    background: "linear-gradient(to bottom, #0a9bfb, #0f0e14)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    fontSize: 14,
                  }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                variant="contained"
                fullWidth
                type="submit"
                sx={{
                  bgcolor: "#19aedc",
                  color: "#fff",
                  py: 1.5,
                  borderRadius: 4,
                  textTransform: "none",
                  fontWeight: 500,
                  "&:hover": {
                    bgcolor: "#19aedc",
                    opacity: 0.9,
                  },
                }}
                
                onClick={() => navigate("/admin/dashboardupcoming")}
              >
                Log In
              </Button>

              <Box mt={4} textAlign="center">
                <Typography variant="body2">
                  <Box component="span" color="text.secondary">
                    Don&apos;t have an account?
                  </Box>
                  <Link href="#" fontWeight={500} color="#19aedc" underline="hover" onClick={() => navigate("/admin/signin")}>
                    {" "}
                    Sign in
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};
export default Body;