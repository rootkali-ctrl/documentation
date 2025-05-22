// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import LoginPageAdmin from "./comp/Admin/LoginPage";
import SigninAdmin from "./comp/Admin/SigninPage";
import DashboardUpcoming from "./comp/Admin/DashboardUpcoming";
import UserPage from "./comp/Admin/UserPage";
import PostPage from "./comp/Admin/PostPage";
import Loginsettings from "./comp/Admin/LoginSettings";
import ContactPage from "./comp/Admin/ContactPage";
import EventManagement from "./comp/Admin/EventManagement";
import EventDetails from "./comp/Admin/EventDetails";
import './App.css'
import VendorDetails from './comp/Admin/VendorDetails';
import VendorStatus from './comp/Admin/VendorStatus'

// Create a basic theme
const theme = createTheme({
  typography: {
    fontFamily: 'Albert Sans, sans-serif',
  },
});

function App() {
  return (
    <div>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<LoginPageAdmin />} />
          <Route path="/admin/login" element={<LoginPageAdmin />} />
          <Route path="/admin/signin" element={<SigninAdmin />} />
          <Route path="/admin/dashboardupcoming" element={<DashboardUpcoming />} />
          <Route path="/admin/userpage" element={<UserPage />} />
          <Route path="/admin/postpage" element={<PostPage />} />
          <Route path="/admin/loginsettings" element={<Loginsettings />} />
          <Route path="/admin/contactpage" element={<ContactPage />} />
          <Route path="/admin/eventmanagement" element={<EventManagement />} />
          <Route path="/admin/event/:eventId" element={<EventDetails />} />
          <Route path='/admin/vendordetails/:id' element={<VendorDetails/>} />
          <Route path='/admin/vendorstatus/:id' element={<VendorStatus/>} />
        </Routes>
      </Router>
    </ThemeProvider>
    </div>
  );
}

export default App;