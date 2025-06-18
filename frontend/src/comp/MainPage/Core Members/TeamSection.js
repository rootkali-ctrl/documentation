import React from "react";
import { Box, Typography, Avatar, Card, CardContent } from "@mui/material";
import img1 from '../Core Members/img1.jpg';
import img2 from '../Core Members/img2.jpg';
import img3 from '../Core Members/img3.jpg';
import img4 from '../Core Members/img4.jpg';

const teamMembers = [
  {
    name: "Bubalan",
    title: "CEO",
    description:
      "Leads the software team, overseeing development, ensuring code quality, driving innovation, and delivering tech solutions.",
    image: img1,
  },
  {
    name: "Pavitra",
    title: "Advisor",
    description:
      "Manages outreach and partnerships, building strong relationships and driving strategic collaborations for growth.",
    image: img2,
  },
  {
    name: "Dinesh Prabakaran",
    title: "Co Founder and Director",
    description:
      "Heads a digital marketing agency, specializing in regional brand campaigns with impactful local strategies.",
    image: img3,
  },
  {
    name: "Sujan Srinivasan",
    title: "Co Founder",
    description:
      "Oversees daily operations, ensuring smooth workflows, team coordination, and timely execution of all key tasks.",
    image: img4,
  },
];

const CoreTeamSection = () => {
  return (
    <Box
      sx={{
        px: { xs: 2, md: 10 },
        py: 6,
        textAlign: "center",
        backgroundColor: "#fff",
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: "bold",
          color: "#2E2E3A",
          mb: 6,
          fontFamily: "albert sans",
        }}
      >
        Core members of Ticket B
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {teamMembers.map((member, index) => (
          <Card
            key={index}
            elevation={0}
            sx={{
              flex: "1 1 calc(25% - 1rem)",
              minWidth: 220,
              maxWidth: 260,
              borderRadius: 3,
              border: "1px solid #e0e0e0",
              padding: 3,
              textAlign: "center",
              margin: "0 auto",
            }}
          >
            <Avatar
              src={member.image}
              alt="Team member"
              sx={{
                width: 100,
                height: 100,
                margin: "0 auto 1rem auto",
                bgcolor: "#D9D9D9",
              }}
            />

            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, fontFamily: "albert sans",fontSize:'20px' }}
            >
              {member.name}
            </Typography>
            <Typography
              variant="caption"
              sx={{ display: "block",fontSize:'14px', mb: 1, fontFamily: "albert sans" }}
            >
              {member.title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#555", fontSize: 13, fontFamily: "albert sans" }}
            >
              {member.description}
            </Typography>
          </Card>
        ))}
      </Box>

      <Box sx={{ mt: 10, textAlign: "right", width: "100%" }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 600, fontFamily: "albert sans" }}
        >
          We are backed by{" "}
          <Box component="span" sx={{ color: "#00AEEF", fontWeight: "bold" }}>
             AIC RAISE Incubation Center
          </Box>
        </Typography>
      </Box>
    </Box>
  );
};

export default CoreTeamSection;
