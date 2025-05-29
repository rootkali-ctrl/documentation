import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Main components
import DesktopMainPage from "./comp/MainPage/DesktopMainPage";
import EventPage from "./comp/EventPage/EventPage";
import TicketPricePage from "./comp/TicketPricePage/TicketPricePage";
import ProceedToPayPage from "./comp/ProceedToPayPage/ProceedToPayPage";
import PaymentPortalPage from "./comp/PaymentPortalPage/PaymentPortalPage";
import RazorPayPage from "./comp/RazorPayPage/RazorPayPage";
import TicketBookedPage from "./comp/TicketBookedPage/TicketBookedPage";
import RecentOrders from "./comp/RecentOrders/RecentOrders";

// Auth components
import Signin from "./comp/Signin/Signin";
import Login from "./comp/Login/Login";
import Profile from "./comp/Profile/Profile";
import Settings from "./comp/Settings/Settings";

// Vendor components
import CreateEvent from "./comp/Vendor/CreateEvent/CreateEvent";
import VendorRegister from "./comp/Vendor/VendorRegister";
import VendorConfirmation from "./comp/Vendor/VendorConfirmation";
import VendorVerified from "./comp/Vendor/VendorVerified";
import VendorHome from "./comp/Vendor/VendorHome";
import VendorDocument from './comp/Vendor/VendorDocument';
import VendorLogin from './comp/Vendor/VendorLogin';
import VendorOrganization from "./comp/Vendor/VendorOrganization";
import EventPreview from "./comp/Vendor/CreateEvent/EventPreview";
import { VendorProvider } from "./comp/Vendor/VendorContext";
import PricePerk from "./comp/Vendor/CreateEvent/PricePerk";
import FinalSetup from "./comp/Vendor/CreateEvent/FinalSetup";
import CreateEventLayout from "./comp/Vendor/CreateEvent/CreateEventLayout";
import EditEventPage from "./comp/Vendor/EditEventPage"; // Added import for EditEventPage

// Admin & Dashboard
import EventDashboard from "./comp/EventDashboard/EventDashboard";
import AdminDashboard from "./comp/Admin/AdminDashboard";

// Utils
import ScrollToTop from "./utils/ScrollToTop";
import QRScannerPage from "./comp/QR Scanner/QRScannerPage";
import BookingDetailsPage from './comp/Booking Details/BookingDetailsPage';
import VendorScanner from "./comp/Vendor/Vendor Profile/VendorScanner";
import VendorProfile from "./comp/Vendor/Vendor Profile/VendorProfile";
import VendorDoc from "./comp/Vendor/Vendor Profile/VendorDoc";
import VendorOrg from "./comp/Vendor/Vendor Profile/VendorOrg";

function App() {
  return (
    <div className="app-container">
      <Router>
        <VendorProvider>
          <ScrollToTop />
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<DesktopMainPage />} />
            <Route path="/:userId" element={<DesktopMainPage />} />


            {/* Event Routes */}
            <Route path="/eventpage/:eventId/:userUID" element={<EventPage />} />
            <Route path="/eventpage" element={<EventPage />} />
            <Route path="/ticketpricepage/:eventId/:userUID" element={<TicketPricePage />} />
            <Route path="/ticketpricepage" element={<TicketPricePage />} />

            {/* Payment flow routes */}
            <Route path="/event/:eventId/proceedtopay" element={<ProceedToPayPage />} />
            <Route path="/proceedtopay" element={<ProceedToPayPage />} />
            <Route path="/proceedtopay/:eventId/:userUID" element={<ProceedToPayPage />} />
            <Route path="/proceedtopaypage/:eventId/:userUID" element={<ProceedToPayPage />} />
            <Route path="/paymentportalpage/:eventId/:userUID" element={<PaymentPortalPage />} />
            <Route path="/paymentportal/:eventId/:userUID" element={<Navigate to="/paymentportalpage" replace />} />
            <Route path="/razorpaypage/:eventId/:userUID" element={<RazorPayPage />} />
            <Route path="/ticketbookedpage/:eventId/:userUID" element={<TicketBookedPage />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signin" element={<Signin />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path='/vendorlogin/:vendorId' element={<VendorLogin />} />

            {/* Vendor Routes */}
            <Route
              path="/vendor/*"
              element={
                <VendorProvider>
                  <Routes>
                    <Route path="register" element={<VendorRegister />} />
                    <Route path="organization" element={<VendorOrganization />} />
                    <Route path="document" element={<VendorDocument />} />
                    <Route path="confirmation" element={<VendorConfirmation />} />
                    <Route path="verified" element={<VendorVerified />} />
                  </Routes>
                </VendorProvider>
              }
            />

            {/* User Routes */}
            <Route path="/recentorders" element={<RecentOrders />} />
            <Route path="/recentorders/:userId" element={<RecentOrders />} />
            <Route path="/findtickets" element={<Navigate to="/recentorders" replace />} />

            {/* Vendor Routes */}
            <Route path="/vendor/register/:vendorId" element={<VendorRegister />} />
            <Route path="/vendor/organization" element={<VendorOrganization />} />
            <Route path="/vendor/document" element={<VendorDocument />} />
            <Route path="/vendor/confirmation" element={<VendorConfirmation />} />
            <Route path="/vendor/verified" element={<VendorVerified />} />
            <Route path="/vendorconfirmation" element={<VendorConfirmation />} />
            <Route path="/vendorverified" element={<VendorVerified />} />
            <Route path="/editevent/:vendorId/:eventId" element={<EditEventPage />} /> 
            

            {/* Dashboard Routes */}
            <Route path='/vendorhome/:vendorId' element={<VendorHome />} />
            <Route path="/vendorhome/QRScanner/:vendorId" element={<QRScannerPage/>} />
            <Route path='/eventdashboard' element={<EventDashboard />} />
            <Route path='/eventdashboard/:eventId' element={<EventDashboard />} />
            <Route path="/admindashboard" element={<AdminDashboard />} />
            <Route path="/eventpreview" element={<EventPreview />} />
            <Route path="/priceperk" element={<PricePerk />} />
            <Route path="/finalsetup" element={<FinalSetup />} />

            {/*Vendor profile*/}
            <Route path='/vendorprofile/vendorscanner/:vendorId' element={<VendorScanner/>} />
            <Route path='/vendorprofile/vendorprofile/:vendorId' element={<VendorProfile/>} />            
            <Route path='/vendorprofile/vendordocuments/:vendorId' element={<VendorDoc/>} />            
            <Route path='/vendorprofile/vendororganization/:vendorId' element={<VendorOrg/>} />
            <Route path="/vendorprofile/:vendorId/booking/:bookingId" element={<BookingDetailsPage />} />


            {/* Create Event Routes */}
            <Route path="/createevent/:vendorId/*" element={<CreateEventLayout />}>
              <Route path="step1" element={<CreateEvent />} />
              <Route path="step2" element={<PricePerk />} />
              <Route path="step3" element={<FinalSetup />} />
              <Route path="eventpreview" element={<EventPreview />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </VendorProvider>
      </Router>
    </div>
  );
}

export default App;