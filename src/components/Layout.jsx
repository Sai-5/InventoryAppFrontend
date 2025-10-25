import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

const styles = {
  layout: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    paddingTop: '60px' // Space for fixed header
  },
  main: {
    flexGrow: 1,
    backgroundColor: '#f9fafb',
    padding: '2rem 0'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 1.5rem',
    width: '100%',
    position: 'relative'
  }
};

const Layout = () => {
  return (
    <div style={styles.layout}>
      <Header />
      
      {/* Main Content */}
      <main style={styles.main}>
        <div style={styles.container}>
          <Outlet />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
