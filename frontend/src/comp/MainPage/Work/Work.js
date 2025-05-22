import React, { useEffect, useRef } from 'react';
import './Work.css';
import WorkCard from './WorkCard';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import AOS from 'aos'; // Import AOS
import 'aos/dist/aos.css'; // Import AOS styles

gsap.registerPlugin(ScrollTrigger);

const Work = () => {
  const leftContentRef = useRef(null);
  const rightContentRef = useRef(null);
  const fifthCardRef = useRef(null);

  const textMap = [
    " when I teach,",
    " when I record,",
    " when I write,",
    " when I play,",
    " when I compose,",
  ];

  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 600,
      once: true,
    });

    const updateText = (index) => {
      const dynamicTextElement = document.getElementById("dynamic-text");
      if (dynamicTextElement) {
        const sentence = textMap[index];
        const words = sentence.split(" ");

        dynamicTextElement.innerHTML = "";

        words.forEach((word, i) => {
          const span = document.createElement("span");
          span.textContent = word;
          dynamicTextElement.appendChild(span);
          if (i !== words.length - 1) {
            const space = document.createElement("span");
            space.textContent = " ";
            dynamicTextElement.appendChild(space);
          }
        });

        gsap.fromTo(
          dynamicTextElement.children,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, stagger: 0.1, duration: 1 }
        );
      }
    };

    ScrollTrigger.matchMedia({
      "(min-width: 900px)": function () {
        const fifthCardOffsetTop = fifthCardRef.current.offsetTop;
        const fifthCardHeight = fifthCardRef.current.offsetHeight;
        const calculatedEnd = fifthCardOffsetTop + fifthCardHeight - 200;

        ScrollTrigger.create({
          trigger: rightContentRef.current,
          start: "top top",
          end: `+=${calculatedEnd}px`,
          pin: leftContentRef.current,
          pinSpacing: true,
          markers:true,
        });

        const cards = gsap.utils.toArray(".card");
        cards.forEach((card, index) => {
          ScrollTrigger.create({
            trigger: card,
            start: "top center",
            end: "bottom center",
            onEnter: () => updateText(index),
            onEnterBack: () => updateText(index),
            markers: true,
          });
        });
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
    
<div id="container21">
      <div className="container22">
        <div className="left-content" ref={leftContentRef}>
          <h1 id="h11" style={{ fontSize: "90px", marginBottom: "0px" }}>
            "
          </h1>
          <h4
            id="dynamic-text"
            style={{
              fontSize: "50px",
              marginTop: "0px",
              paddingLeft: "50px",
              fontWeight: "300",
            }}
          />
        </div>

        <div className="right-content" ref={rightContentRef}>
          <WorkCard description="I wear my pedagogue's hat" />
          <WorkCard description="I wear my sound engineer's hat" />
          <WorkCard description="I wear my researcher's hat" />
          <WorkCard description="I wear my church organist's hat" />
          <WorkCard ref={fifthCardRef} description="I wear my architect's hat" />
        </div>
      </div>
      </div>
     
    </>
  );
};

export default Work;
