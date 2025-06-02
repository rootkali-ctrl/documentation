import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { EventProvider, useEventContext } from "./EventContext";
import {useMediaQuery, Stepper, Step, StepLabel, Box} from "@mui/material";

const steps = ["Event Setup", "Pricing & Perks", "Final Setup"];

const getCurrentStep = (pathname) => {
  if (pathname.includes("/step1")) return 0;
  if (pathname.includes("/step2")) return 1;
  if (pathname.includes("/step3")) return 2;
  return 0;
};

// Route Guard Component
const RouteGuard = ({ children }) => {
  const { stepCompletion } = useEventContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { vendorId } = useParams();

  useEffect(() => {
    const currentPath = location.pathname;
    const isOnStep2 = currentPath.includes("/step2");
    const isOnStep3 = currentPath.includes("/step3");
    const isPreview = currentPath.includes("eventpreview");

    // If on step 2 but step 1 not completed, redirect to step 1
    if (isOnStep2 && !stepCompletion.step1) {
      navigate(`/createevent/${vendorId}/step1`, { replace: true });
      return;
    }

    // If on step 3 but step 1 or step 2 not completed, redirect to step 1
    if (isOnStep3 && (!stepCompletion.step1 || !stepCompletion.step2)) {
      navigate(`/createevent/${vendorId}/step1`, { replace: true });
      return;
    }

    // If on preview but any step not completed, redirect to step 1
    if (isPreview && (!stepCompletion.step1 || !stepCompletion.step2 || !stepCompletion.step3)) {
      navigate(`/createevent/${vendorId}/step1`, { replace: true });
      return;
    }
  }, [location.pathname, stepCompletion, navigate, vendorId]);

  return children;
};

const CreateEventLayout = () => {
  const location = useLocation();
  const currentStep = getCurrentStep(location.pathname);
  const isPreviewPage = location.pathname.includes("eventpreview");
  const isMobile = useMediaQuery("(max-width:900px)");
  return (
    <EventProvider>
      <RouteGuard>
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
              sx={{ padding: "20px 5%", width: !isMobile ? "50%" : '90%' , margin: "0 auto" }}
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    sx={{
                      width:'100%',
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
      </RouteGuard>
    </EventProvider>
  );
};

export default CreateEventLayout;
