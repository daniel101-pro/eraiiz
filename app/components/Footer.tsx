"use client";
import React from "react";
import Image from "next/image";
import Noise from "../Animations/Noise/Noise";

const Footer = () => {
  return (
    <>
      <footer className="w-full bg-white border-t border-gray-200 py-16 px-6 md:px-12 lg:px-24 relative z-10">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center md:items-start text-center md:text-left space-y-12 md:space-y-0">
          <div className="mb-6 md:mb-0 flex flex-col items-center md:items-start">
            <Image src="/logo.png" alt="ERaiiz Logo" width={120} height={40} />
            <p className="text-gray-600 mt-4 md:mt-6 text-sm md:text-base">
              Connecting Consumers with <br /> Sustainable Brands to Reduce <br /> Carbon Footprint
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:space-x-12 space-y-8 md:space-y-0 items-center md:items-start">
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h3 className="text-lg font-medium text-black mb-3 md:mb-5">Company</h3>
              <ul className="text-gray-600 space-y-2 text-sm md:text-base">
                <li>About Us</li>
                <li>Services</li>
                <li>Pricing</li>
              </ul>
            </div>
            <div className="mb-6 md:mb-0 text-center md:text-left">
              <h3 className="text-lg font-medium text-black mb-3 md:mb-5">Information</h3>
              <ul className="text-gray-600 space-y-2 text-sm md:text-base">
                <li>Reviews</li>
                <li>FAQs</li>
                <li>Reach Out to Us</li>
              </ul>
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                Subscribe to newsletter on item updates <br /> and deals on Eraiiz
              </p>
              <div className="flex items-center w-full justify-center md:justify-start">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full max-w-[300px]">
                  <input
                    type="email"
                    placeholder="Your email address"
                    className="py-2 px-4 focus:outline-none w-full text-black text-sm md:text-base"
                  />
                  <button className="bg-green-600 text-white py-2 px-4 text-sm md:text-base">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 text-center md:text-right text-gray-600 text-sm md:text-base pr-6 md:pr-20">
          Contact Us:{" "}
          <a href="mailto:eraiizinfo@gmail.com" className="text-green-600">
            eraiizinfo@gmail.com
          </a>
        </div>
        <div className="mt-4 text-center text-gray-600 text-sm md:text-base">
          This website was made with love by Daniel Falodun.
        </div>
      </footer>
      <div className="relative w-full h-[120px] bg-[#008C00] border-t border-gray-200">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <h1 className="text-[80px] font-bold text-[#009900] select-none">ERAIIZ</h1>
        </div>
        <Noise
          patternSize={450}
          patternScaleX={1}
          patternScaleY={1}
          patternRefreshInterval={1}
          patternAlpha={85}
        />
      </div>
    </>
  );
};

export default Footer;
