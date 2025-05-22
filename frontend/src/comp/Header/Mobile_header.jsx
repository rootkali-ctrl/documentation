import React from 'react';
import { AppBar, Toolbar, Box, Typography } from '@mui/material';

import { useNavigate } from "react-router-dom";
import './MobileHeader.css';

const MobileHeader = () => {
   

    return (
        <AppBar 
            position="static" 
            className="mobile-header" 
            sx={{ backgroundColor: "white", boxShadow: "none", borderBottom: "2px solid #EEEDF2" }}
        >
            <Toolbar>
                <Box className="mobile-title">
                    ticketb
                </Box>
                
                <Typography className="mobile-signin" sx={{fontWeight: 500 }}>
                    Signup
                </Typography>
            </Toolbar>
            
           
        </AppBar>
    );
};

export default MobileHeader;
