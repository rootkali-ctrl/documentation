import { createContext, useContext, useState, useEffect } from "react";

const EventContext = createContext();

export const useEventContext = () => useContext(EventContext);

export const EventProvider = ({ children }) => {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("createEventFormData");
    return saved
      ? JSON.parse(saved)
      : {
          eventDetails: {},
          pricing: {},
          finalSetup: {},
        };
  });

  const [vendorInfo, setVendorInfo] = useState(() => {
    const saved = localStorage.getItem("vendorInfo");
    return saved ? JSON.parse(saved) : null;
  });

  // Add step completion tracking
  const [stepCompletion, setStepCompletion] = useState(() => {
    const saved = sessionStorage.getItem("eventFormStepCompletion");
    return saved ? JSON.parse(saved) : {
      step1: false,
      step2: false,
      step3: false
    };
  });

  // Track if this is a fresh session (page reload detection)
  const [isPageReloaded, setIsPageReloaded] = useState(() => {
    // Check if there's an active session flag
    const wasActive = sessionStorage.getItem("eventFormSessionActive");
    
    // If there was an active session but we're initializing again, it's a reload
    if (wasActive) {
      return true;
    }
    
    // Mark session as active
    sessionStorage.setItem("eventFormSessionActive", "true");
    return false;
  });

  // Save vendor info if set
  useEffect(() => {
    if (vendorInfo) {
      localStorage.setItem("vendorInfo", JSON.stringify(vendorInfo));
    }
  }, [vendorInfo]);

  // Sync form data to localStorage
  useEffect(() => {
    localStorage.setItem("createEventFormData", JSON.stringify(formData));
  }, [formData]);

  // Sync step completion to sessionStorage
  useEffect(() => {
    sessionStorage.setItem("eventFormStepCompletion", JSON.stringify(stepCompletion));
  }, [stepCompletion]);

  // Handle page reload - reset step completion but keep form data
  useEffect(() => {
    if (isPageReloaded) {
      // Reset step completion on reload to force restart from step 1
      setStepCompletion({
        step1: false,
        step2: false,
        step3: false
      });
      sessionStorage.removeItem("eventFormStepCompletion");
      
      // Reset the reload flag
      setIsPageReloaded(false);
    }
  }, [isPageReloaded]);

  // Clean up session flag when component unmounts
  useEffect(() => {
    const cleanup = () => {
      sessionStorage.removeItem("eventFormSessionActive");
    };

    // Add event listener for page unload
    window.addEventListener("beforeunload", cleanup);
    
    return () => {
      window.removeEventListener("beforeunload", cleanup);
      cleanup();
    };
  }, []);

  const updateFormSection = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  // Mark step as completed
  const markStepCompleted = (step) => {
    setStepCompletion(prev => ({
      ...prev,
      [step]: true
    }));
  };

  // Reset form and step completion
  const resetForm = () => {
    setFormData({
      eventDetails: {},
      pricing: {},
      finalSetup: {},
    });
    setStepCompletion({
      step1: false,
      step2: false,
      step3: false
    });
    localStorage.removeItem("createEventFormData");
    sessionStorage.removeItem("eventFormStepCompletion");
    sessionStorage.removeItem("eventFormSessionActive");
  };

  // Check if user should be redirected to step 1 due to reload
  const shouldRedirectToStep1 = () => {
    return isPageReloaded;
  };

  return (
    <EventContext.Provider
      value={{ 
        formData, 
        setFormData, 
        vendorInfo, 
        setVendorInfo, 
        updateFormSection,
        stepCompletion,
        markStepCompleted,
        resetForm,
        shouldRedirectToStep1,
        isPageReloaded
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export default EventContext;