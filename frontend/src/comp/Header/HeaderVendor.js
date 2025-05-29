import { Box,useMediaQuery } from '@mui/material';
import React from 'react';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from "react-router-dom";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

const HeaderVendor = () => {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:900px)");
  return (
    <div>
      <Box sx={{ margin: '1% 2%',p:isMobile?1:0 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            mt: '1%',
          }}
        >
          {/* Left Section */}
          <Box sx={{ ml: '3%', width: !isMobile?'80%':"60%", display: 'flex', gap: '6%', alignItems: 'center' }}>
            <Box
              sx={{
                fontFamily: 'Albert Sans, sans-serif',
                fontWeight: 900,
                fontSize: isMobile?"24px":'30px',
                color: 'rgb(25, 174, 220)',
              }}
            >
              ticketb
            </Box>

            {/* Search Bar */}
            {!isMobile &&(
            <Box
              sx={{
                minWidth: '40%',
                boxSizing: 'border-box',
                border: '1px solid rgb(170, 170, 170)',
                borderRadius: '25px',
                backgroundColor: 'rgba(219, 218, 227, 0.3)',
              }}
            >
              <Box sx={{ display: 'flex', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
                {/* Search */}
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '25%', padding: '0% 2%', justifyContent: 'space-evenly' }}>
                  <SearchIcon sx={{ color: 'gray' }} />
                  <input
                    type="text"
                    placeholder="Search events"
                    style={{
                      fontFamily: 'Albert Sans, sans-serif',
                      fontSize: '16px',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      marginLeft: '2%',
                      flex: 1,
                    }}
                  />
                </Box>

                {/* Vertical Line */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px' ,pl:5}}>
                  <Box sx={{ borderLeft: '2px solid rgb(170, 170, 170)', height: '30px' }}></Box>
                </Box>

                {/* Location */}
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0.5% 0.5% 0.5% 2%' }}>
                  <LocationOnIcon />
                  <Box
                    sx={{
                      fontFamily: 'Albert Sans, sans-serif',
                      width: '60%',
                      fontSize: '16px',
                      marginLeft: '4%',
                      flex: 1,
                    }}
                  >
                    Coimbator
                  </Box>
                  <SearchIcon
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgb(25, 174, 220)',
                      marginLeft: '4%',
                      borderRadius: '50%',
                      cursor: 'pointer',
                      fontSize: '20px',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'right',
                      padding: '8px',
                    }}
                  />
                </Box>
              </Box>
            </Box>
            )}
          </Box>

          {/* Right Section */}
          <Box sx={{ display: 'flex', gap: '4%', alignItems: 'center', justifyContent: 'right', width: !isMobile?'20%':"40%" }}>
            <AccountCircleOutlinedIcon sx={{ fontSize: '30px' }} />
            <Box sx={{ fontFamily: 'Albert Sans', fontSize: '16px', display: 'flex', alignItems: 'center' }}>
              Vendor Name
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Bottom Line */}
      <Box sx={{ mt: '1%', height: '1px', width: '100%', backgroundColor: 'rgb(238, 237, 242)' }} />
    </div>
  );
};

export default HeaderVendor;
