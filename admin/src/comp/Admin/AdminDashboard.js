import React, { useState } from "react";
import { Box, Typography } from "@mui/material";
import AdminPost from "./AdminPost";
import AdminUsers from "./AdminUsers";

const AdminDashboard = () => {
  const [selectedMenu, setSelectedMenu] = useState("Dashboard");

  const menuItems = [
    "Dashboard",
    "Post",
    "Tickets",
    "Users",
    "Profit",
    "Login settings",
    "Venue",
    "Contact",
    "Events",
    "Payout method",
    "Messaging",
  ];
  const dashboardSections = [
    "Upcoming Events",
    "Recent Events",
    "Recent Users and Vendor Registered",
    "Profit",
    "Tax",
    "Sidebar",
  ];

  return (
    <div>
      {/* Admin Header */}
      <Box
        sx={{
          width: "100%",
          padding: "1% 3%",
          backgroundColor: "white",
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 1000,
          borderBottom: "1px solid rgb(238, 237, 242)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "94%",
          }}
        >
          {/* Left Section */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontWeight: 900,
                fontSize: 30,
                color: "rgb(25, 174, 220)",
              }}
            >
              ticketb
            </Typography>
            <Typography
              sx={{
                fontFamily: "Albert Sans",
                fontWeight: 900,
                fontSize: 30,
              }}
            >
              admin
            </Typography>
          </Box>

          {/* Right Section */}
          <Typography sx={{ fontFamily: "Albert Sans", fontSize: 16 }}>
            Last login at 7th Oct 2025 13:00
          </Typography>
        </Box>
      </Box>

      {/* Sidebar and Content Wrapper */}
      <Box sx={{ display: "flex", width: "100%" }}>
        {/* Left Sidebar */}
        <Box
          sx={{
            position: "fixed",
            top: "60px",
            left: 0,
            width: "15%",
            height: "calc(100vh - 60px)",
            backgroundColor: "#fff",
            boxShadow: "2px 0px 5px rgba(0,0,0,0.1)",
            padding: "4% 0% 2% 4%",
            overflowY: "auto",
          }}
        >
          {menuItems.map((item, index) => (
            <Typography
              key={index}
              onClick={() => setSelectedMenu(item)}
              sx={{
                fontFamily: "Albert Sans",
                fontSize: selectedMenu === item ? "22px" : "20px",
                fontWeight: selectedMenu === item ? "900" : "700",
                color: selectedMenu === item ? "black" : "rgba(111, 114, 135, 1)",
                cursor: "pointer",
                "&:hover": { color: "black" },
                marginBottom: "10px",
                transition: "all 0.2s ease-in-out",
              }}
            >
              {item}
            </Typography>
          ))}
        </Box>

        {/* Right Content Area */}
        <Box
          sx={{
            width: "100%",
            marginLeft: "19%",
            marginTop: "70px",
            padding: "2% 0 2% 0",
            overflowY: "auto",
          }}
        >
          {/* <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              mt: "1%",
              ml: "2%",
              fontSize: "32px",
              transition: "all 0.2s ease-in-out",
              fontFamily: "Albert Sans",
            }}
          >
            {selectedMenu}
          </Typography> */}

          <Box sx={{ marginTop: "20px" }}>
            {selectedMenu === "Dashboard" && (
              <Box sx={{ display: "flex", flexDirection: "column", width: "100%", mt: "1%" }}>
                {dashboardSections.map((section, index) => (
                  <Box key={index}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: "2%", ml: "4%", mt: "2%" }}>
                      <Typography sx={{ fontFamily: "Albert Sans", fontSize: "25px", fontWeight: "600", color: "black",cursor:'pointer', '&:hover':{textDecoration:'underline'} }}>
                        {section}
                      </Typography>
                      <Typography sx={{ fontFamily: "Albert Sans", fontSize: "25px", fontWeight: "600", color: "black" }}>
                        {">"}
                      </Typography>
                    </Box>
                    <Typography sx={{ width: "100%", height: "1px", backgroundColor: "rgba(238, 237, 242, 1)", mt: "1%" }} />
                  </Box>
                ))}
              </Box>
            )}

            {selectedMenu === "Post" && <AdminPost />}
            {selectedMenu === "Tickets" && <Typography>This is the Tickets section.</Typography>}
            {selectedMenu === "Users" && <AdminUsers/>}
            {selectedMenu === "Profit" && <Typography>This is the Profit section.</Typography>}
            {selectedMenu === "Login settings" && <Typography>This is the Login Settings section.</Typography>}
            {selectedMenu === "Venue" && <Typography>This is the Venue section.</Typography>}
            {selectedMenu === "Contact" && <Typography>This is the Contact section.</Typography>}
            {selectedMenu === "Events" && <Typography>This is the Events section.</Typography>}
            {selectedMenu === "Payout method" && <Typography>This is the Payout Method section.</Typography>}
            {selectedMenu === "Messaging" && <Typography>This is the Messaging section.</Typography>}
          </Box>
        </Box>
      </Box>
        
      
    </div>
  );
};

export default AdminDashboard;
