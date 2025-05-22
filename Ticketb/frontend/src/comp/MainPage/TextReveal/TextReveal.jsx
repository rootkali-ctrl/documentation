import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Box, Typography } from '@mui/material';

gsap.registerPlugin(ScrollTrigger);

const customSegments = [
  "Well,",
  "we the developers at snippetScript will fall in love with your product,",
  "so we spend all day thinking about it for making it work",
  "cool to grab the eyes of your target audience",
  "which will give you organic growth"
];

const TextReveal = () => {
  const textSectionRef = useRef(null);
  const segmentRefs = useRef([]);

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: textSectionRef.current,
        start: 'top top',
        end: '+=100%',
        pin: true,
        scrub: true,
        markers: true,
      },
    });

    tl.to(segmentRefs.current, {
      color: '#19AEDC',
      stagger: 1,
      duration: 0.8,
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <Box sx={{ height: 0 }} />
      <Box
        ref={textSectionRef}
        sx={{ width: '100%', height: '100vh' }}
      >
        <Box
          sx={{
            width: {
              xs: '85%',
              sm: '80%',
              md: '65%',
              lg: '40%',
            },
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            margin: '0 auto',
          }}
        >
          <Typography
            component="p"
            sx={{
              color: '#666',
              fontSize: {
                xs: '24px',
                sm: '28px',
                md: '36px',
                lg: '40px',
              },
              fontWeight: 600,
            }}
          >
            {customSegments.map((segment, index) => (
              <Box
                key={index}
                component="span"
                ref={(el) => (segmentRefs.current[index] = el)}
                sx={{
                  display: 'inline',
                  transition: 'color 0.3s ease-in-out',
                  marginRight: '6px',
                }}
              >
                {segment}
              </Box>
            ))}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ height: 0 }} />
    </>
  );
};

export default TextReveal;
