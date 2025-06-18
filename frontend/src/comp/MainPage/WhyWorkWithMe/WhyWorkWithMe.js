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
  const timeout = setTimeout(() => {
    const rightContentHeight = rightContentRef.current.offsetHeight;
    const leftContentHeight = leftContentRef.current.offsetHeight;
    const dif = (rightContentHeight - 10) - leftContentHeight;

    ScrollTrigger.matchMedia({
      "(min-width: 900px)": function () {
        ScrollTrigger.create({
          trigger: rightContentRef.current,
          start: "top top",
          end: `+=${dif}px`,
          pin: leftContentRef.current,
          pinSpacing: true,
          markers: false,
        });
      },
      "(max-width: 899px)": function () {
        // clean
      }
    });
  }, 3000);

  return () => clearTimeout(timeout);
}, []);

  return (
    <div className="container2">
      {/* Left Side */}
      <div className="left-content" ref={leftContentRef}>
        <h1 id="h11">WHY</h1>
        <h1 id="h12">TicketB</h1>
        <p>In the dynamic world of events and ticketing, collaboration is key. Here's why partnering with Ticket B is your ideal choice:</p>
      </div>

      {/* Right Side */}
      <div className="right-content" ref={rightContentRef}>
        <WhyWorkWithMeCard
          number="1."
          title="User-Friendly Experience"
          description="Design intuitive and seamless ticketing platforms, ensuring effortless event access and enhanced attendee satisfaction."
        />
        <WhyWorkWithMeCard
          number="2."
          title="Efficient Event Management"
          description="Streamline your event operations with real-time updates, digital check-ins, and robust attendee management systems."
        />
        <WhyWorkWithMeCard
          number="3."
          title="Marketing Excellence"
          description="Drive event visibility and attendance through strategic cross-promotions, targeted social media campaigns, and influential partnerships."
        />
        {/* <WhyWorkWithMeCard
          number="4."
          title="Innovative Solutions"
          description="Implement forward-thinking features such as personalized event recommendations, interactive event participation, and secure digital ticketing."
        />
        <WhyWorkWithMeCard
          number="5."
          title="Reliable Support"
          description="Offer comprehensive customer assistance and reliable event support, ensuring a smooth and satisfying experience for both organizers and attendees. At Ticket B, we are passionate about creating exceptional event experiences."
        /> */}
      </div>
    </div>
  );
};

export default WhyWorkWithMe;