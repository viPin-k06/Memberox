import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import HowItWorks from "../components/HowItWorks";
import Pricing from "../components/Pricing";
import Cta from "../components/Cta";
import Footer from "../components/Footer";

const Landing = () => {
  return (
    <div>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Cta />
      <Footer />
    </div>
  );
};

export default Landing;
