"use client"

import React from "react";
import Image from "next/image";

const CallToAction = () => {
  return (
    <section
      className="relative w-full h-[1080px] flex items-center justify-center bg-[#008C00] px-6 md:px-12"
    >
      <div className="flex flex-col md:flex-row justify-between items-center md:items-start w-full h-full">
        <div className="flex flex-col justify-center space-y-6 text-white max-w-lg w-full md:w-1/2">
          <div className="self-center md:self-start">  {/* Centered on mobile */}
            <Image src="/one2.png" width={300} height={20} alt="oneone" className="mt-32" />
          </div>
          <h1 className="text-3xl md:text-5xl mb-4 text-center md:text-left">
            Shop from Eraiiz and take a step closer to a green earth.
          </h1>
          <p className="text-sm md:text-base mb-6 text-center md:text-left">
            Join the Green Movement: Shop Sustainable, Recycled Products from Eraiiz Today!
          </p>
          <div className="flex items-center w-full">
            <input
              type="email"
              placeholder="Your email address"
              className="py-3 px-4 w-full rounded-sm focus:outline-none text-black"
            />
            <button className="bg-green-600 text-white py-3 px-6 rounded-sm">
              Subscribe
            </button>
          </div>
          <p className="text-sm mt-3 text-center md:text-left mb-9">Be the first to know when a product is on sale!</p>
        </div>

        <div className="relative w-full md:w-1/2 h-full flex justify-center items-center md:justify-end md:items-end">
          <Image 
            src="/cta.png" 
            alt="CTA Image" 
            layout="intrinsic" 
            width={1000} 
            height={800} 
            className="rounded-tl-2xl mt-30 hidden md:block"
          />
          <Image 
            src="/cta-mobile-centered.png" 
            alt="CTA Mobile Image" 
            layout="intrinsic" 
            width={500} 
            height={400} 
            className="rounded-tl-2xl block md:hidden mt-32 object-cover"
          />
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
