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


  const updateFormSection = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  };

  
  return (
    <EventContext.Provider
      value={{ formData, setFormData, vendorInfo, setVendorInfo, updateFormSection, }}
    >
      {children}
    </EventContext.Provider>
  );
};

export default EventContext;
