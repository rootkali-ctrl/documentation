import React, { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Modal,
  IconButton,
   useMediaQuery,
    Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { auth, db, googleProvider } from "../../firebase_config";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const SignIn = ({
  open,
  handleClose,
  handleSwitchToLogin,
  onSigninSuccess,
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [checkPass, setCheckPassword] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");
  const isFormValid =
    email.trim() !== "" &&
    password.trim() !== "" &&
    confirmPassword.trim() !== "" &&
    password === confirmPassword;

  const handleEmailSignIn = async () => {
    const username = email.split("@")[0];

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setCheckPassword(true);

      // Send verification email
      await sendEmailVerification(user, {
        url: "http://localhost:3000", // Or your deployed link like https://ticketb.web.app/postVerify
      });

      // Save user data to Firestore using user.uid as document ID
      await setDoc(doc(db, "users", user.uid), {
        authId: user.uid,
        username,
        firstName: username,
        lastName: "",
        email,
        type: 'manual',
        password
      });

      // We don't call onSigninSuccess here because email verification is required

      alert(
        "Verification email sent! Please verify your email before logging in."
      );
      handleClose();
    } catch (err) {
      console.error("Error during sign-in:", err);

      if (err.code === "auth/email-already-in-use") {
        alert("This email is already registered. Please log in.");
      } else {
        alert("Sign-in failed. Please check the console for details.");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const email = user.email;
      const username = email.split("@")[0];
      const authId = user.uid;
      const displayName = user.displayName || "";
      const [firstName, lastName] = displayName.split(" ");

      // Store the Google user data in Firestore using user.uid
      await setDoc(doc(db, "users", user.uid), {
        authId,
        username,
        firstName: firstName || username,
        lastName: lastName || "",
        email,
        type: 'google-signin'
      });

      // Call the onSigninSuccess callback to update the UI
      // Google sign-in can be considered pre-verified
      if (onSigninSuccess) {
        onSigninSuccess();
      }

      alert("Google Sign-in successful!");
      handleClose();
      navigate("/");
    } catch (err) {
      console.error("Google Sign-in error:", err);
      alert("Failed to sign in with Google");
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(5px)",
        }}
      >
        <Box
          sx={{
            width: isMobile ? "80%" : "400px",
            backgroundColor: "#fff",
            padding: isMobile ? "1rem" : "2rem",
            borderRadius: "24px",
            boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.2)",
            textAlign: "center",
            position: "relative",
          }}
        >
          <IconButton
            sx={{
              position: "absolute",
              top: "10px",
              left: "10px",
            }}
            onClick={handleClose}
          >
            <ArrowBack />
          </IconButton>

          <Typography
            variant="h5"
            fontWeight="bold"
            mb={1}
            sx={{ fontSize: "24px", fontFamily:'albert sans' }}
          >
            ROLL THE CARPET!
          </Typography>
          <Typography variant="body2" color="gray" mb={2} fontFamily="albert sans">
            Sign in to continue to TicketB
          </Typography>

          <Typography
            variant="body2"
            sx={{ textAlign: "left", color: "black", mb: 0.5 , fontFamily:'albert sans'}}
          >
            Email Address
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter your email"
            fontFamily="albert sans"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                borderRadius: "12px",
                backgroundColor: "#F8F8F8",
                fontFamily:"albert sans"
              },
            }}
          />

          <Typography
            variant="body2"
            sx={{ textAlign: "left", color: "black", mb: 0.5, fontFamily:'albert sans' }}
          >
            Password
          </Typography>
          <TextField
            fullWidth
            placeholder="Enter your password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                borderRadius: "12px",
                backgroundColor: "#F8F8F8",
                fontFamily:'albert sans'
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{ textAlign: "left", color: "black", mb: 0.5 , fontFamily:'albert sans'}}
          >
            Confirm Password
          </Typography>
          <TextField
            fullWidth
            placeholder="Confirm your password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: {
                borderRadius: "12px",
                backgroundColor: "#F8F8F8",
                fontFamily:'albert sans'
              },
            }}
            error={checkPass && password !== confirmPassword}
            helperText={
              checkPass && password !== confirmPassword
                ? "Passwords do not match"
                : ""
            }
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="body2" color="gray" fontFamily="albert sans">
              Remember me
            </Typography>
            <Typography
              variant="body2"
              color="#19AEDC"
              sx={{ cursor: "pointer" , fontFamily:'albert sans'}}
            >
              Forgot password?
            </Typography>
          </Box>

          <Button
            fullWidth
            variant="contained"
            sx={{
              bgcolor: isFormValid ? "#19AEDC" : "#ccc",
              color: "#fff",
              py: 1.5,
              mb: 1,
              borderRadius: "10px",
              fontWeight: "bold",
              fontFamily:'albert sans',
              cursor: isFormValid ? "pointer" : "not-allowed",
              boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
            }}
            disabled={!isFormValid}
            onClick={handleEmailSignIn}
          >
            Sign Up
          </Button>

          <Typography variant="body2" color="gray" fontFamily="albert sans">
            Or continue with
          </Typography>

          <Button
            fullWidth
            variant="outlined"
            sx={{
              backgroundColor: "#19AEDC",
              color: "#FFFFFF",
              py: 1,
              mt: 1,
              borderRadius: "10px",
              fontFamily:'albert sans'
            }}
            onClick={handleGoogleSignIn}
          >
            Google
          </Button>

          <Typography variant="body2" mt={1} fontFamily="albert sans">
            I have an account?{" "}
            <Button
              sx={{ textTransform: "none", color: "#19AEDC", fontFamily:'albert sans' }}
              onClick={handleSwitchToLogin}
            >
              Login
            </Button>
          </Typography>
        </Box>
      </Box>
    </Modal>
  );
};

export default SignIn;
