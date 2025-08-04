"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/all";

// Register GSAP plugin
gsap.registerPlugin(ScrollTrigger);

const Opposite = () => {
  const sectionRef = useRef(null);
  const largeImageRef = useRef(null);
  const smallImageRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const context = gsap.context(() => {
      // Large Image Animation
      if (largeImageRef.current) {
        gsap.fromTo(
          largeImageRef.current,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 1,
            scrollTrigger: {
              trigger: largeImageRef.current,
              start: "top 80%",
              end: "top 20%",
              scrub: true,
            },
          }
        );
      }

      // Small Images Animation (draggable and hover effects removed)
      smallImageRefs.current.forEach((img, index) => {
        if (img) {
          gsap.fromTo(
            img,
            { opacity: 0, y: 50 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: index * 0.2,
              scrollTrigger: {
                trigger: img,
                start: "top 90%",
                end: "top 50%",
                scrub: true,
              },
            }
          );
        }
      });
    }, sectionRef);

    return () => context.revert();
  }, []);

  return (
    <div ref={sectionRef} className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 my-10 sm:my-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Left side - Large Image */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 group">
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <img
            ref={largeImageRef}
            src="/largeimage.png"
            alt="Featured Product"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <p className="text-white text-sm font-medium">Discover our sustainable collection</p>
          </div>
        </div>

        {/* Right side - Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 lg:mt-0">
          {/* First Image */}
          <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-800 order-1 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <img
              ref={(el) => {
                smallImageRefs.current[0] = el;
              }}
              src="/side1.png"
              alt="Product View"
              className="w-full h-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
            />
          </div>

          {/* First Text Card (Black) */}
          <div className="group bg-black rounded-2xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative order-2 lg:order-2">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10">
              <h3 className="text-white text-xl sm:text-2xl font-medium mb-3 sm:mb-4 group-hover:text-[#00B300] transition-colors">Plastics</h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                Discover a range of innovative and sustainable products crafted from recycled plastics.
              </p>
            </div>
            <button className="relative z-10 bg-white text-black rounded-full py-2 sm:py-2.5 px-5 sm:px-6 text-sm font-medium transition-all duration-300 hover:bg-[#00B300] hover:text-white hover:shadow-lg hover:shadow-[#00B300]/20 transform hover:-translate-y-0.5 active:translate-y-0 w-fit mt-4">
              Start shopping
            </button>
          </div>

          {/* Second Image */}
          <div className="group relative aspect-[4/3] rounded-2xl overflow-hidden order-3 lg:order-4">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-200 to-purple-200 opacity-75 group-hover:opacity-90 transition-opacity duration-300" />
            <img
              ref={(el) => {
                smallImageRefs.current[1] = el;
              }}
              src="/slide2.png"
              alt="Product Showcase"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          {/* Second Text Card (White) */}
          <div className="group bg-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between border border-gray-100 hover:border-[#00B300] transition-all duration-300 hover:shadow-xl order-4 lg:order-3">
            <div>
              <h3 className="text-black text-xl sm:text-2xl font-medium mb-3 sm:mb-4 group-hover:text-[#00B300] transition-colors">Plastics</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                From durable home essentials to stylish accessories, each piece is designed to showcase the power of sustainability without compromising on quality.
              </p>
            </div>
            <button className="bg-[#008C00] text-white rounded-full py-2 sm:py-2.5 px-5 sm:px-6 text-sm font-medium transition-all duration-300 hover:bg-[#00B300] hover:shadow-lg hover:shadow-[#00B300]/20 transform hover:-translate-y-0.5 active:translate-y-0 w-fit mt-4">
              Start shopping
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Opposite;
