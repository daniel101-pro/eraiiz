"use client"
import React, { useState, useEffect } from "react";
import Image from "next/image";

const Footer = () => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 py-16 px-6 md:px-12 lg:px-24 relative z-10">
      <div className="container mx-auto flex flex-col md:flex-row justify-between relative space-y-12 md:space-y-0">
        <div className="mb-6 md:mb-0 flex flex-col items-start">
          <Image src="/logo.png" alt="ERaiiz Logo" width={120} height={40} />
          <p className="text-gray-600 mt-4 md:mt-6 text-sm md:text-base text-left">
            Connecting Consumers with <br /> Sustainable Brands to Reduce <br /> Carbon Footprint
          </p>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-12 space-y-8 md:space-y-0">
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-medium text-black mb-3 md:mb-5">Company</h3>
            <ul className="text-gray-600 space-y-2 text-sm md:text-base">
              <li>About Us</li>
              <li>Services</li>
              <li>Pricing</li>
            </ul>
          </div>
          <div className="mb-6 md:mb-0">
            <h3 className="text-lg font-medium text-black mb-3 md:mb-5">Information</h3>
            <ul className="text-gray-600 space-y-2 text-sm md:text-base">
              <li>Reviews</li>
              <li>FAQs</li>
              <li>Reach Out to Us</li>
            </ul>
          </div>
          <div>
            <p className="text-gray-600 mb-4 text-sm md:text-base">
              Subscribe to newsletter on item updates <br /> and deals on Eraiiz
            </p>
            <div className="flex items-center w-full">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden w-full">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="py-2 px-4 focus:outline-none w-full text-black text-sm md:text-base"
                />
                <button className="bg-green-600 text-white py-2 px-4 text-sm md:text-base">Subscribe</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-10 text-right text-gray-600 text-sm md:text-base pr-6 md:pr-20">
        Contact Us: <a href="mailto:eraiizinfo@gmail.com" className="text-green-600">eraiizinfo@gmail.com</a>
      </div>
    </footer>
  );
};

export default Footer;
