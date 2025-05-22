import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { EventProvider } from "./EventContext";
import { Stepper, Step, StepLabel, Box} from "@mui/material";

const steps = ["Event Setup", "Pricing & Perks", "Final Setup"];

const getCurrentStep = (pathname) => {
  if (pathname.includes("/step1")) return 0;
  if (pathname.includes("/step2")) return 1;
  if (pathname.includes("/step3")) return 2;
  return 0;
};

const CreateEventLayout = () => {
  const location = useLocation();
  const currentStep = getCurrentStep(location.pathname);
  const isPreviewPage = location.pathname.includes("eventpreview");

  return (
    <EventProvider>
      <Box
        sx={{
          backgroundColor: "#F9FAFB",
          pt: "2%",
        }}
      >
        {!isPreviewPage && (
          <Stepper
            activeStep={currentStep}
            alternativeLabel
            sx={{ padding: "20px 5%", width: "50%", margin: "0 auto" }}
          >
            {steps.map((label, index) => (
              <Step key={label}>
                <StepLabel
                  sx={{
                    "& .MuiStepLabel-label": {
                      fontFamily: "Albert Sans",
                      color: currentStep === index ? "#19AEDC" : "#999",
                      fontWeight: 600,
                    },
                    "& .MuiStepIcon-root": {
                      color: "#ccc",
                    },
                    "& .MuiStepIcon-root.Mui-completed": {
                      color: "#19AEDC",
                    },
                    "& .MuiStepIcon-root.Mui-active": {
                      color: "#19AEDC",
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        )}
      </Box>

      <Outlet />
    </EventProvider>
  );
};

export default CreateEventLayout;