import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const styles = {
    footer: {
      backgroundColor: '#1e40af',
      color: 'white',
      width: '100%',
      marginTop: 'auto',
      borderTop: '1px solid #1e3a8a',
      padding: '1.5rem 0'
    },
    container: {
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '0 1rem',
      textAlign: 'center'
    },
    text: {
      fontSize: '0.875rem',
      color: '#bfdbfe',
      margin: 0
    },
    subtitle: {
      fontSize: '0.75rem',
      color: '#c7d2fe',
      margin: '0.5rem 0 0 0'
    }
  };
  
  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        <p style={styles.text}>
          &copy; {currentYear} Inventory Pro. All rights reserved.
        </p>
        <p style={styles.subtitle}>
          Built with ❤️ for smarter inventory management
        </p>
      </div>
    </footer>
  );
};

export default Footer;
