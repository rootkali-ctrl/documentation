import React, { useState } from "react";
import {
  IconButton,
  Collapse,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

const Accordion = ({ title, answer }) => {
  const [accordionOpen, setAccordionOpen] = useState(false);

  return (
    <Box sx={{ mb: 2, borderBottom: "1px solid #e0e0e0", pb: 1 }}>
      <Box
        onClick={() => setAccordionOpen(!accordionOpen)}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          color: accordionOpen ? "#19AEDC" : "#333",
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontFamily:'albert sans', fontWeight:600, fontSize:'20px' }}>
          {title}
        </Typography>
        <IconButton size="small" sx={{ color: accordionOpen ? "#19AEDC" : "#333" }}>
          {accordionOpen ? <RemoveIcon /> : <AddIcon />}
        </IconButton>
      </Box>

      <Collapse in={accordionOpen} timeout="auto" unmountOnExit>
      <Box>
  {typeof answer === 'string' ? (
    <Typography variant="body2" sx={{ mt: 1, color: "#555", fontFamily:'albert sans', fontWeight:400, fontSize:'16px', whiteSpace: 'pre-line' }}>{answer}</Typography>
  ) : (
    answer // JSX gets rendered directly
  )}
</Box>

      </Collapse>
    </Box>
  );
};

export default Accordion;
