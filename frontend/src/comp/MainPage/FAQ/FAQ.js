import React from "react";
import Accordion from "./Accordion";
import { Box, Typography } from "@mui/material";

const FAQ = () => {
  return (
    <Box
      sx={{
        width: "100%",
        color: "black",
        padding: 0,
        borderRadius: 0,
        display: { xs: "block", md: "flex" },
        marginTop: "4%",
        mb: "4%",
      }}
    >
      {/* Left Section for FAQ Title */}
      <Box
        sx={{
          width: { xs: "95%", md: "40%", lg: "30%" },
          textAlign: { xs: "center", md: "left" },
          padding: { xs: 2, md: 3 },
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 500,
            marginBottom: 3,
            fontSize: { xs: "36px", md: "40px" },
            marginLeft: { xs: "0", md: "10%", lg: "45%" },
            marginTop: { xs: "0px", md: "5%", lg: "2%" },
            fontFamily: "Albert Sans, sans-serif",
            color: "#19AEDC",
          }}
        >
          FREQUENTLY ASKED QUESTIONS
        </Typography>
      </Box>

      {/* Right Section for Accordion */}
     <Box
  sx={{
    width: { xs: "90%", md: "50%", lg: "40%" },
    marginLeft: { xs: "5%", md: 0, lg: "10%" },
    padding: { xs: 2, md: 3 },
  }}
>
  <Accordion
    title="What is TicketB’s core product and how does it work?"
    answer={`TicketB is a localized digital ticketing platform. It allows event organizers to list their events and sell tickets online in Tamil and English. Organizers receive payments directly after deducting a small commission. Users can easily book tickets, receive digital QR passes on WhatsApp, and pay via UPI. Commission rates vary based on event category and scale.`}
  />

 <Accordion
  title="What makes this solution innovative or unique?"
  answer={
    <>
      <Typography mb={1} sx={{ color: "#555", fontFamily:'albert sans', fontWeight:400, fontSize:'16px',}}>
        TicketB goes beyond just online ticketing. We offer:
      </Typography>
      {[
        "Tamil-first user interface",
        "Affordable and flexible commission model",
        "Event promotion via digital marketing agencies",
        "Education and onboarding for non-digital organizers",
        "This hands-on, hyperlocal approach is missing in major platforms.",
      ].map((point, index) => (
        <Typography key={index} sx={{ ml: 2, mb: 0.5, color: "#555", fontFamily:'albert sans', fontWeight:400, fontSize:'16px',}}>
          • {point}
        </Typography>
      ))}
    </>
  }
/>

  <Accordion
    title="Do you have any notable partnerships or pilot results?"
    answer={`Yes, we’ve partnered with local digital media agencies to promote events across platforms like YouTube and Instagram. Our pilot events helped us confirm that regional users prefer WhatsApp-based ticket delivery and Tamil-language interfaces.`}
  />

  <Accordion
  title="What do you know about this market that others don’t?"
  answer={
    <>
      <Typography mb={1} sx={{ color: "#555", fontFamily:'albert sans', fontWeight:400, fontSize:'16px',}}>
        We understand that many local organizers:
      </Typography>
      {[
        "Don’t speak fluent English",
        "Aren’t tech-savvy",
        "Don’t know where to start with digital tools",
      ].map((point, index) => (
        <Typography key={index} sx={{ ml: 2, mb: 0.5, color: "#555", fontFamily:'albert sans', fontWeight:400, fontSize:'16px',}}>
          • {point}
        </Typography>
      ))}
      <Typography mt={2} sx={{ color: "#555", fontFamily:'albert sans', fontWeight:400, fontSize:'16px',}}>
        TicketB fills this gap with local onboarding, handholding support, and a familiar language interface.
      </Typography>
      <Typography sx={{ color: "#555", fontFamily:'albert sans', fontWeight:400, fontSize:'16px',}}>
        We help them succeed online, not just sell tickets.
      </Typography>
    </>
  }
/>


  <Accordion
    title="Why is now the right time for TicketB?"
    answer={`There is massive digital adoption happening across Tamil Nadu — even in rural towns. Post-pandemic, event culture is booming, but platforms haven’t caught up to regional needs. This is the perfect moment to build a regionally dominant ticketing brand before bigger players enter.`}
  />
</Box>

    </Box>
  );
};

export default FAQ;
