import React from "react";

const Footer = () => {
  const styles = {
    footer: {
      backgroundColor: "#000",
      color: "#fff",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      height: "50vh",
    },
    footerContent: {
      display: "flex",
      justifyContent: "space-between",
      margin: "40px",
    },
    leftSection: {
      maxWidth: "60%",
    },
    heading: {
      fontSize: "2rem",
      marginBottom: "10px",
      width:"50%",
    },
    connectButton: {
      background: "none",
      border: "1px solid #fff",
      padding: "10px 20px",
      fontSize: "1rem",
      color: "#fff",
      cursor: "pointer",
      borderRadius: "20px",
    },
   
    rightSection: {
      textAlign: "left",
      maxWidth: "35%",
      marginTop: "15vh",
      fontSize: "1.3rem",
    },
    rightp:{
          width:"50%",
          fontSize: "1.3rem",
    },
    rightfp:{
     width:"50%",
     fontSize: "1rem",
},
    footerBottom: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "40px 20px",
    },
    socialIcons: {
      display: "flex",
      gap: "10px",
    },
    icon: {
      backgroundColor: "#fff",
      color: "#000",
      width: "30px",
      height: "30px",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: "50%",
      cursor: "pointer",
    },
    linkedinHover: {
      backgroundColor: "#0077b5",
      color: "#fff",
    },
    closeHover: {
      backgroundColor: "#ff0000",
      color: "#fff",
    },
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.footerContent}>
        <div style={styles.leftSection}>
          <h2 style={styles.heading}>Talk to one of our friendly team members Let's do something brilliant together.</h2>
          <button
            style={styles.connectButton}
          >
            Connect
          </button>
        </div>
        <div style={styles.rightSection}>
          <h3 style={styles.righth}>Careers</h3>
          <p style={styles.rightp}>Work with the UK's Very Best Business Focused Technology Consultancy.</p>
        </div>
      </div>
      <div style={styles.footerBottom}>
        <p style={styles.rightfp}>Site Developed by Snippet Script</p>
        <div style={styles.socialIcons}>
          <div
            style={styles.icon}
          >
            in
          </div>
          <div
            style={styles.icon}
          >
            X
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
