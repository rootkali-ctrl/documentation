import { Box, Typography } from '@mui/material';
import React from 'react';

const AdminLeft = () => {
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

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 20,
        width: '20%',
        ml: '2%',
        height: '100%', 
        display: 'flex',
        flexDirection: 'row', 
        
        zIndex: 1,
      }}
    >
      {/* Menu Items */}
      <Box sx={{ display: 'flex', flexDirection: 'column', margin: '25% 0 0 2%', flexGrow: 1,boxSizing:'border-box',
        border:'1px solid black', }}>
        {menuItems.map((item, index) => (
          <Typography
            key={index}
            sx={{
              fontFamily: 'Albert Sans',
              fontSize: '20px',
              fontWeight: '700',
              color: 'rgba(111, 114, 135, 1)',
              cursor: 'pointer',
              '&:hover': { color: 'black' },
              mt: '2%',
            }}
          >
            {item}
          </Typography>
        ))}
      </Box>

    </Box>
  );
};

export default AdminLeft;
