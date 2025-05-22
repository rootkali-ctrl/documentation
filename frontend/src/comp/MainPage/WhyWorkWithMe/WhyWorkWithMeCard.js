import React from 'react';

const WhyWorkWithMeCard = ({ number, title, description }) => {

  return (
    <div className="card" >
      <div 
        className="card_right" 
        id='cr' 
        style={{  margin: "0px" }}
      >
        <p style={{ margin: "0px" }}>{number}</p>
      </div>
      <div className="card_left">
        <h2>{title}</h2>
        <hr />
        <p id='clp'>{description}</p>
      </div>
    </div>
  );
};

export default WhyWorkWithMeCard;
