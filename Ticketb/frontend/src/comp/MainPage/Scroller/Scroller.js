import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import './Scroller.css';

const Scroller = () => {
  const targetRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start 20vh", "end start"], 
  });

  const adjustedScrollProgress = useTransform(scrollYProgress, [0, 1], [0, 0.1]);

  const scale = useTransform(adjustedScrollProgress, [0, 1], [1, 30]);  
  const yPosition = useTransform(adjustedScrollProgress, [0, 1], ["0%", "450vh"]);  
  const xPosition = useTransform(adjustedScrollProgress, [0, 1], ["0%", "0%"]); 

  return (
    <div className='body-container'>
          <div className="container">
            <div id="para">
              <h1>
                <span style={{ paddingLeft: "10%" }}>
                  “But when I give<br />
                </span>
                concert, I’m a bare headed<br />
                musician, looking for the<br />
                <div ref={targetRef}>
                  naked...<br />
                </div>
              </h1>
            </div>
            <motion.div
              id="truth"
              style={{
                scale: scale,
                y: yPosition,
                x: xPosition,
              }}
            >
              <h1>truth.</h1>
            </motion.div>
          </div>
    </div>
  
  );
};

export default Scroller;
