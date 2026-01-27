// ASW3Homepage.jsx
import React, { useRef, useEffect, useState } from 'react';
import Navbar from './navbar';
import '../assets/css/autoliv.css';
import heroVideo from '../assets/images/homepage_video.mp4';
import factoryimg from'../assets/images/factory.jpg';
import autolivVideo from "../assets/images/autolivvd.mp4";
const ASW3Homepage = () => {
  const videoRef = useRef(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
   const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  useEffect(() => {
    // Video autoplay with muted audio
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Autoplay prevented:", error);
      });
    }
    
    // Intersection Observer for animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.2 }
    );
    
    // Observe all sections with animation class
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
    
    return () => observer.disconnect();
  }, []);

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  return (
    <div className="asw3-homepage">
      <Navbar />
      {/* Hero Section with Video Background */}
      <section  id="home" className="asw3-hero">
        <div className="hero-video-container">
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            loop 
            playsInline 
            className="hero-video"
            poster="https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1740&q=80"
          >
            <source src={heroVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          <div className="video-overlay"></div>
        </div>
        <div className="asw3-container">
          <div className="asw3-hero-content animate-on-scroll">
            <h1>Precision Crafted Foam Steering Wheels</h1>
            <p>26 years of excellence in automotive craftsmanship</p>
            <a href="#products" className="asw3-btn">Explore Our Products</a>
          </div>
        </div>
      </section>

  {/* About Section */}
<section id="about" className="asw3-about">
  <div className="asw3-container asw3-about-wrapper">
    {/* Left side - Text */}
    <div className="asw3-about-text animate-on-scroll">
      <h2>About ASW3 SARL</h2>
      <h3>Four Decades of Automotive Excellence</h3>
      <p>
        Since 1983, <strong>ASW3 SARL</strong> has been at the forefront of steering 
        wheel innovation and manufacturing. Our dedication to <strong>quality, safety, 
        and customer satisfaction</strong> has earned us the trust of global automotive 
        leaders.
      </p>
      <p>
        Combining <strong>state-of-the-art technology</strong> with traditional 
        craftsmanship, we produce steering wheels that guarantee superior comfort, 
        durability, and modern design.
      </p>

      {/* Mission & Values */}
      <div className="asw3-mission-values">
        <h4>Our Mission & Values</h4>
        <ul>
          <li><i className="fas fa-check-circle"></i> Safety & Quality First</li>
          <li><i className="fas fa-lightbulb"></i> Continuous Innovation</li>
          <li><i className="fas fa-globe"></i> Global Partnerships</li>
          <li><i className="fas fa-users"></i> Customer-Centered Solutions</li>
        </ul>
      </div>

      {/* CTA */}
      <a href="#contact" className="asw3-btn">Work With Us</a>
    </div>

    {/* Right side - Image & Counters */}
    <div className="asw3-about-visual animate-on-scroll">
      <img src={factoryimg} alt="ASW3 Factory" className="asw3-about-image" />

      <div className="asw3-counters">
        <div className="counter">
          <h3>68+</h3>
          <p>Global clients</p>
        </div>
        <div className="counter">
          <h3>$10.5 billion </h3>
          <p>global annual net sales.</p>
        </div>
        <div className="counter">
          <h3>60K+</h3>
          <p>employees Worldwide </p>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* Video Section */}
<section id="service" className="asw3-video-section">
  <div className="asw3-container">
    <div className="asw3-section-title animate-on-scroll">
      <h2>Our Manufacturing Process</h2>
    </div>
    <div className="asw3-video-container animate-on-scroll">
      {!isVideoPlaying ? (
        <div className="asw3-video-placeholder" onClick={handleVideoPlay}>
          <i className="fas fa-play-circle"></i>
        </div>
      ) : (
        <video
          controls
          autoPlay
          className="asw3-video-player"
          width="800"
          height="450"
        >
          <source src={autolivVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}
      <p className="asw3-video-caption">
        Watch how our expert craftsmen transform raw materials into premium foam steering wheels
      </p>
    </div>
  </div>
</section>
      {/* Process Steps */}
      <section className="asw3-process">
        <div className="asw3-container">
          <div className="asw3-section-title animate-on-scroll">
            <h2 style={{color:"#18207A"}}>From Design to Quality</h2>
          </div>
          <div className="asw3-steps">
            <div className="asw3-step animate-on-scroll">
              <div className="asw3-step-icon">
                <i className="fas fa-ruler-combined"></i>
              </div>
              <h3>Design & Engineering</h3>
              <p>Our engineers create precise designs tailored to each client's specifications and ergonomic requirements.</p>
            </div>
            <div className="asw3-step animate-on-scroll">
              <div className="asw3-step-icon">
                <i className="fas fa-cut"></i>
              </div>
              <h3>Material Selection</h3>
              <p>We source only the highest quality foam compounds and materials for durability and comfort.</p>
            </div>
            <div className="asw3-step animate-on-scroll">
              <div className="asw3-step-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <h3>Precision Molding</h3>
              <p>Advanced injection molding techniques ensure consistent quality and perfect form every time.</p>
            </div>
            <div className="asw3-step animate-on-scroll">
              <div className="asw3-step-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <h3>Quality Assurance</h3>
              <p>Each steering wheel undergoes rigorous testing for comfort, durability, and safety standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="asw3-products">
        <div className="asw3-container">
          <div className="asw3-section-title animate-on-scroll">
            <h2 style={{color:" #18207A"}}>Our Products</h2>
          </div>
          <div className="asw3-product-gallery">
            <div className="asw3-product animate-on-scroll">
              <div className="asw3-product-img">Premium Foam Wheel</div>
              <div className="asw3-product-info">
                <h3>Classic Series</h3>
                <p>Traditional design with modern comfort, perfect for vintage car restorations.</p>
              </div>
            </div>
            <div className="asw3-product animate-on-scroll">
              <div className="asw3-product-img">Sport Foam Wheel</div>
              <div className="asw3-product-info">
                <h3>Sport Series</h3>
                <p>Enhanced grip and contouring for performance driving enthusiasts.</p>
              </div>
            </div>
            <div className="asw3-product animate-on-scroll">
              <div className="asw3-product-img">Luxury Foam Wheel</div>
              <div className="asw3-product-info">
                <h3>Luxury Series</h3>
                <p>Premium finishes and exceptional comfort for high-end vehicles.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="asw3-footer">
        <div className="asw3-container">
          <div className="asw3-footer-content">
            <div className="asw3-footer-section animate-on-scroll">
              <h3>About Us</h3>
              <p>ASW3 SARL has been manufacturing premium foam steering wheels for automotive enthusiasts and manufacturers since 1983.</p>
            </div>
            <div className="asw3-footer-section animate-on-scroll">
              <h3>Contact Us</h3>
              <ul className="asw3-contact-info">
                <li><i className="fas fa-map-marker-alt"></i> Industrial Zone 1160, Zaghouan, Tunisia</li>
                <li><i className="fas fa-phone"></i> +123 456 7890</li>
                <li><i className="fas fa-envelope"></i> contact@autoliv.com</li>
              </ul>
            </div>
            <div className="asw3-footer-section animate-on-scroll">
              <h3>Quick Links</h3>
              <ul className="asw3-contact-info">
                <li><a href="#home"><i className="fas fa-chevron-right"></i> Home</a></li>
                <li><a href="#about"><i className="fas fa-chevron-right"></i> About</a></li>
                <li><a href="#products"><i className="fas fa-chevron-right"></i> Products</a></li>
                
              </ul>
            </div>
            <div className="asw3-footer-section animate-on-scroll">
              <h3>Follow Us</h3>
              <div className="asw3-socials">
                <a href="#"><i className="fab fa-facebook-f"></i></a>
                <a href="#"><i className="fab fa-twitter"></i></a>
                <a href="#"><i className="fab fa-instagram"></i></a>
                <a href="#"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
          </div>
          <div className="asw3-footer-bottom">
            <p>
            © {new Date().getFullYear()} Autoliv Portal. All rights reserved.
          </p>
          </div>
           
        </div>
      </footer>
    </div>
  );
};

export default ASW3Homepage;