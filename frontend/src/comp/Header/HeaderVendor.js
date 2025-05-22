import { Box} from '@mui/material'
import React from 'react'
import './HeaderVendor.css'
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useNavigate } from "react-router-dom";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

const HeaderVendor = () => {
const navigate = useNavigate();
  return (
    <div>
        <Box
            sx={{margin:'1% 2%'}}>
            <div className='headerVendor-container'>
                <div className='headerVendor-left'>
                    <div className='headerVendor-title'>
                        ticketb
                    </div>
                    <div className='headerVendor-search'>
                        <div className='headerVendor-search-separation'>
                            <div className='headerVendor-search-container'>
                                <SearchIcon className='headerVendor-search-icon'/>
                                <input type='text' placeholder='Search events' className='headerVendor-search-text' />
                            </div>
                            <div className="headerVendor-line-container">
                                <div className="headerVendor-vertical-line"></div>
                            </div>
                            <div className='headerVendor-location-container'>
                                <LocationOnIcon className='headerVendor-location-icon'/>
                                {/* <input placeholder='Location' className='headerVendor-location-text' /> */}
                                <div className='headerVendor-location-text'>
                                    Coimbator
                                </div>
                                <SearchIcon className='headerVendor-locationSearch-icon'/>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="headerVendor-right">
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <AccountCircleOutlinedIcon sx={{fontSize:'30px'}} />
                    </div>
                    <div className="headerVendor-name">Vendor Name</div>
                </div>

            </div>
        </Box>
        <div className='headerVendor-bottomLine'></div>
    </div>
  )
}

export default HeaderVendor


