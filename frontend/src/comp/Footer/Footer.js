import React from "react";
import "./Footer.css";
import { Box, Typography } from "@mui/material";

const aboutLinks = [
  "About Us",
  "Contact Us",
  "Refund Policy",
  "Promotional Partners",
  "Sitemap",
];

const eventCategories = [
  "Standup Comedy",
  "Sports",
  "Business",
  "Music and Concerts",
  "Camping",
  "Education",
  "Food and Drink",
  "Festival",
];

const contactAddress =["Near RHR Hotel, Meenakshi Amman Nagar, No.1 C6, SBA Building, L&T Bypass Road, Kamachipuram, Coimbatore, Tamil Nadu, 641016.",]
const contactDetails = [
  "admin@ticketb.com",
  "+91 86678 59174",
  "+91 91234 56780",
];

const icons=[
  "Icon1",
  "Icon2",
  "Icon3"
]

const Footer = () => {
  return (
    <Box
      sx={{
        backgroundColor: "rgb(8,116,175)",
        maxHeight: "70vh",
        padding: "2% 4%",
        color: "white",
        display:'flex',
        flexDirection:'column'
      }}
    >
      <Box sx={{height:'10vh',textAlign:'left'}}>
        <Typography sx={{ fontFamily: "Albert Sans", fontWeight: "800", fontSize:'23px',}}>
          Well, it's all about exploring
        </Typography>
        <Typography sx={{ fontFamily: "Albert Sans",mt:"1%" }}>
          ticketb is a platform that integrates all eventing stakeholders to
          simply develop, publicize, interconnect as well as manage events of
          all sizes and shapes!.
        </Typography>
      </Box>



      <Box className="middle-box" sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start', 
          mt: '2%', 
          height: '150px', 
          width: '100%', 
          textAlign: 'left'
          }}>
          <Box sx={{ width: '15%' }}>
              {aboutLinks.map((item, index) => (
                  <Typography key={index} sx={{ fontFamily: "Albert Sans", lineHeight: '32px', fontWeight: '300', cursor:'pointer', '&:hover':{textDecoration:'underline'} }}>
                      {item}
                  </Typography>
              ))}
          </Box>

          <Box sx={{
              width: '40%', 
              display: 'grid', 
              gridAutoFlow: 'column', 
              gridAutoColumns: 'min-content', 
              gridTemplateRows: 'repeat(5, auto)', 
              gap:'9px',
              gridAutoColumns: '180px', 
              columnGap: '35px', 
          }}>
              {eventCategories.map((item, index) => (
                  <Typography key={index} sx={{ fontFamily: "Albert Sans", fontWeight: '300', breakInside: 'avoid', cursor:'pointer', '&:hover':{textDecoration:'underline'} }}>
                      {item}
                  </Typography>
              ))}
          </Box>

          <Box sx={{ width: '40%', textAlign: 'right' }}>
            {contactAddress.map((item,index) =>(
              <Typography key={index} sx={{ fontFamily: "Albert Sans", lineHeight: '30px', fontWeight: '300' }}>{item}</Typography>
            ))}
              {contactDetails.map((item, index) => (
                  <Typography key={index} sx={{ fontFamily: "Albert Sans", lineHeight: '30px', fontWeight: '300',cursor:'pointer','&:hover':{textDecoration:'underline'} }}>
                      {item}
                  </Typography>
              ))}
          </Box>
      </Box>


      <Box sx={{display:'flex',
                flexDirection:'column',
                width:'100%',
                mt:'1%',
                alignItems:'center',
                justifyContent:'center',
                textAlign:'center'
      }}>
    
          <Box
              sx={{
                display: "flex",
                alignItems: "center",
                width: "100%",
                mt: "1%",
              }}
            >
            <Box sx={{ flex: 1, height: "0.8px", backgroundColor: "rgba(255,255,255,0.4)" }}></Box>
            <Typography sx={{ fontFamily: "Albert Sans", mx: 2, whiteSpace: "nowrap",fontSize:'22px', fontWeight:'900',letterSpacing:'0.5px' }}>
              ticketb
            </Typography>
            <Box sx={{ flex: 1, height: "0.8px", backgroundColor: "rgba(255,255,255,0.4)" }}></Box>
          </Box>

          <Typography sx={{width:'65%',mt:'1%',fontFamily:'Albert Sans', fontWeight:'300'}}>ticketb is a platform that integrates all eventing stakeholders to simply develop, publicize, interconnect as well as manage events of all sizes and shapes!.</Typography>
          
          <Box sx={{display:'flex',mt:'1.5%', width:'50%',justifyContent:'center',}}>
            {icons.map((item,index) =>( 
              <div key={index} className="footer-icons">{item}</div>
            ))}
          </Box>
            <Typography sx={{fontFamily:'Albert Sans',mt:'1%', fontWeight:'300'}}>All rights reserved with love by Ticketb</Typography>
      </Box>
      <Box sx={{display:'flex',
        width:'100%',
        justifyContent:'right',
        mt:'2%'
        
      }}>
        <Typography sx={{fontFamily:'Albert Sans', fontWeight:'300'}}>Site Designed and Developed at Snippet Script</Typography>
      </Box>
    </Box>
  );
};

export default Footer;



