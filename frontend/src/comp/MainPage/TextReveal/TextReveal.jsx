import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './TextReveal.css';

gsap.registerPlugin(ScrollTrigger);

const TextReveal = () => {
  const textSectionRef = useRef(null);
  const wrapperRef = useRef(null);

  // Custom text segments
  const splitText = (element) => {
    const customSegments = [
      "At Ticket B, we are passionate about",
      "creating exceptional event experiences.",
      "Our dedicated team works tirelessly, ",
      "crafting intuitive and engaging digital ticketing solutions",
      "that captivate your audience and drive natural growth."
    ];
    
    // Insert each custom segment into its own span
    element.innerHTML = customSegments.map((segment) => `<span class="segment">${segment}</span>`).join(' ');
  };

  useEffect(() => {
    const paragraph = wrapperRef.current.querySelector('p');
    splitText(paragraph);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: textSectionRef.current,
        start: 'top top',
        end: '+=200%',
        pin: true,
        scrub: true,
        markers: false,
      },
    });

    // Animate the color of each segment from grey to white
    tl.to(paragraph.querySelectorAll('.segment'), {
      color: '#19AEDC', // Change to white
      stagger: 1, // Delay between segments
      duration: 0.8, // Transition duration
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <>
      <section id="s1"></section>
      <section id="textSection" ref={textSectionRef}>
        <div className="container1">
          <div className="wrapper" ref={wrapperRef}>
            <p className="white">
              {/* Text will be split into custom segments */}
              Well, we the developers at snippetScript will fall in love with your product, so we spend all day thinking about it for making it work cool to grab the eyes of your target audience which will give you organic growth
            </p>
          </div>
        </div>
      </section>
      <section id="s1"></section>
    </>
  );
};

export default TextReveal;
