import React, { forwardRef } from 'react';
import './Work.css';

const WorkCard = forwardRef(({ description }, ref) => {
  return (
    <div className="card" ref={ref}>
      <div className="card_des">
        <h1 id="des">{description}</h1>
      </div>
    </div>
  );
});

export default WorkCard;
