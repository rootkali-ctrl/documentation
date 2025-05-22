import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const VendorContext = createContext();

export const useVendor = () => useContext(VendorContext);

export const VendorProvider = ({ children }) => {
  const [vendorData, setVendorData] = useState(null);

  return (
    <VendorContext.Provider value={{ vendorData, setVendorData }}>
      {children}
    </VendorContext.Provider>
  );
};