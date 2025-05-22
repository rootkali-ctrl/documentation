import React, { useRef, useState } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import Slider from "react-slick";
import { ChevronRight } from "@mui/icons-material";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import baner from "../photo/baner.png";
import baner1 from "../photo/baner1.avif"
const images = [baner, baner1, baner];

const AdminPost = () => {
  const sliderRef = useRef(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (sliderRef.current) {
      sliderRef.current.slickNext();
    }
  };

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false, // Hide default arrows
    autoplay: false,
    fade: true, // Enables smooth fading effect
    afterChange: (index) => setCurrentSlide(index), // Track current slide
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", ml: "3%", width: "90%" }}>
      <Typography sx={{ fontFamily: "Albert Sans", fontSize: "25px" }}>
        Carousel <span style={{ fontWeight: "900" }}>Posts</span>
      </Typography>
      <Typography sx={{ fontFamily: "Albert Sans", fontSize: "18px", mt: "2%" }}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.
      </Typography>

      {/* Slider */}
      <Box sx={{ position: "relative", width: "100%", height: "400px", mt: "2%", borderRadius: "10px", overflow: "hidden" }}>
        <Slider ref={sliderRef} {...settings}>
          {images.map((image, index) => (
            <Box key={index} sx={{ width: "100%", height: "400px", position: "relative" }}>
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "10px" }}
              />
            </Box>
          ))}
        </Slider>

        {/* Next Button - Positioned Center Right */}
        <IconButton
          onClick={nextSlide}
          sx={{
            position: "absolute",
            top: "50%",
            right: "10px",
            transform: "translateY(-50%)",
            backgroundColor: "rgba(25, 174, 220, 1)",
            color: "#fff",
            borderRadius: "50%",
            "&:hover": { backgroundColor: "rgba(25, 174, 220, 0.8)" },
          }}
        >
          <ChevronRight />
        </IconButton>
      </Box>

      {/* Slide Navigation */}
      <Box sx={{ display: "flex", alignItems: "center", gap: "1%" }}>
        <Typography sx={{ fontFamily: "Albert Sans", fontSize: "20px", mt: "2%" }}>
          Slide <span style={{ fontSize: "25px", fontWeight: "600" }}>{currentSlide + 1}</span> of  
          <span style={{ fontSize: "25px", fontWeight: "600" }}> {images.length}</span>
        </Typography>
        <Typography sx={{ fontFamily: "Albert Sans", fontSize: "20px", mt: "2%", color: "rgba(25, 174, 220, 1)", cursor: "pointer" }}>
          change post
        </Typography>
      </Box>
    </Box>
  );
};

export default AdminPost;
