import React, { useEffect, useRef } from 'react';
import './WhyWorkWithMe.css';
import WhyWorkWithMeCard from './WhyWorkWithMeCard';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const WhyWorkWithMe = () => {
  const leftContentRef = useRef(null);
  const rightContentRef = useRef(null);

  useEffect(() => {
    const rightContentHeight = rightContentRef.current.offsetHeight;
    const leftContentHeight = leftContentRef.current.offsetHeight;
    const dif = (rightContentHeight - 10) - leftContentHeight;

    // Use ScrollTrigger.matchMedia to handle media queries
    ScrollTrigger.matchMedia({
      // For screens wider than 900px
      "(min-width: 900px)": function () {
        // ScrollTrigger pin animation for larger screens
        ScrollTrigger.create({
          trigger: rightContentRef.current,
          start: "top top",
          end: `+=${dif}px`,
          pin: leftContentRef.current,
          pinSpacing: true,
          markers: false,
        });
      },

      // For screens smaller than 900px (no pinning)
      "(max-width: 899px)": function () {
        // No pin effect or animations for smaller screens
        // GSAP automatically cleans up triggers created for larger screens
      }
    });

    // Fade-right animation for left content (applies to all screen sizes)
    const fadeRightTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: leftContentRef.current,
        start: "top 80%", // When the top of the left content hits 80% of the viewport height
        end: "bottom 60%",
        toggleActions: "play none none reset", // Reset ensures it repeats when revisiting
        markers: false,
      },
    });

    // Define the animation for fade-right
    fadeRightTimeline.fromTo(
      leftContentRef.current,
      {
        opacity: 0,
        x: -100, // Starting position to the left
      },
      {
        opacity: 1,
        x: 0, // End position
        duration: 1.5,
        ease: 'power3.out',
      }
    );
  }, []);

  return (
    <div className="container2">
      {/* Left Side */}
      <div className="left-content" ref={leftContentRef}>
        <h1 id="h11">WHY</h1>
        <h1 id="h12"> Snippet Script</h1>
        <p>In the world of design, collaboration is key, and here's why partnering with me is the right choice</p>
      </div>

      {/* Right Side */}
      <div className="right-content" ref={rightContentRef}>
        <WhyWorkWithMeCard
          number="1."
          title="Technical Excellence"
          description="Deploy advanced microservices and cloud-native solutions with strict coding standards and CI/CD pipelines for scalable, high-performance applications."
        />
        <WhyWorkWithMeCard
          number="2."
          title="Agile Mastery"
          description="Deliver rapid results through Scrum methodology and sprint cycles, ensuring adaptive planning and maximum project efficiency."
        />
        <WhyWorkWithMeCard
          number="3."
          title="Security First"
          description="Implement enterprise security with multi-layer authentication and encryption, following OWASP guidelines and compliance standards."
        />
        <WhyWorkWithMeCard
          number="4."
          title="Architecture Innovation"
          description="Build robust systems using containerization and serverless technologies, optimized for scalability and modern tech integration."
        />
        <WhyWorkWithMeCard
          number="5."
          title="Solution Engineering"
          description="Create modular, API-driven applications with microservices patterns, ensuring seamless integration and maintainable code."
        />
      </div>
    </div>
  );
};

export default WhyWorkWithMe;
