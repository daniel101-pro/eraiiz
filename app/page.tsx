"use client";
import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import GridComponent from "./components/GridComponent";
import Opposite from "./components/Opposite";
import Footer from "./components/Footer";
import CallToAction from "./components/CallToAction";
import FaqSection from "./faqs/page";
import BlogCarousel from "./components/BlogCarousel";
import Navbar from "./components/Navbar";
import Masonry from './components/Masonry/Masonry';
import TrueFocus from "./TextAnimations/TrueFocus/TrueFocus";
import SplashCursor from "./Animations/SplashCursor/SplashCursor";
import BlurText from "./TextAnimations/BlurText/BlurText";

const Page = () => {
  const textRef = useRef<HTMLHeadingElement>(null);
  const [backgroundImage, setBackgroundImage] = useState("/Hero.png");

  useEffect(() => {
    // Check screen size to determine which background image to use
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setBackgroundImage("/Hero2.png"); // For mobile devices
      } else {
        setBackgroundImage("/Hero.png"); // For larger screens
      }
    };

    // Initial check
    handleResize();

    // Listen for window resize
    window.addEventListener("resize", handleResize);

    // Clean up event listener on unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const mainText = "Erase Waste By Shopping Quality Recycled";
    const synonyms = [
      "Products",
      "Items",
      "Materials",
      "Goods",
      "Supplies",
      "Resources",
      "Commodities",
      "Merchandise",
      "Essentials",
      "Assets",
    ];
    let currentText = "";
    let index = 0;
    let synonymIndex = 0;

    const typeWriterAnimation = () => {
      if (index < mainText.length) {
        currentText += mainText[index];
        if (textRef.current) textRef.current.innerText = currentText;
        index++;
        setTimeout(typeWriterAnimation, 30);
      } else {
        changeSynonym();
      }
    };

    const changeSynonym = () => {
      if (textRef.current) {
        textRef.current.innerHTML = `${mainText} <span class="text-[#008C00] font-bold">${synonyms[synonymIndex]}</span>.`;
      }
      synonymIndex = (synonymIndex + 1) % synonyms.length;
      setTimeout(changeSynonym, 1000);
    };

    typeWriterAnimation();
  }, []);

  const items = [
    {
      id: "1",
      img: "https://picsum.photos/id/1015/600/900?grayscale",
      url: "https://example.com/one",
      height: 400,
    },
    {
      id: "2",
      img: "https://picsum.photos/id/1011/600/750?grayscale",
      url: "https://example.com/two",
      height: 250,
    },
    {
      id: "3",
      img: "https://picsum.photos/id/1020/600/800?grayscale",
      url: "https://example.com/three",
      height: 600,
    },
    {
      id: "4",
      img: "https://picsum.photos/id/1025/600/800?grayscale",
      url: "https://example.com/four",
      height: 300,
    },
    {
      id: "5",
      img: "https://picsum.photos/id/1035/600/800?grayscale",
      url: "https://example.com/five",
      height: 500,
    },
    {
      id: "6",
      img: "https://picsum.photos/id/1040/600/800?grayscale",
      url: "https://example.com/six",
      height: 450,
    },
    {
      id: "7",
      img: "https://picsum.photos/id/1045/600/800?grayscale",
      url: "https://example.com/seven",
      height: 350,
    },
    {
      id: "8",
      img: "https://picsum.photos/id/1050/600/800?grayscale",
      url: "https://example.com/eight",
      height: 550,
    },
    {
      id: "9",
      img: "https://picsum.photos/id/1055/600/800?grayscale",
      url: "https://example.com/nine",
      height: 400,
    },
    {
      id: "10",
      img: "https://picsum.photos/id/1060/600/800?grayscale",
      url: "https://example.com/ten",
      height: 480,
    },
    {
      id: "11",
      img: "https://picsum.photos/id/1065/600/800?grayscale",
      url: "https://example.com/eleven",
      height: 520,
    },
    {
      id: "12",
      img: "https://picsum.photos/id/1070/600/800?grayscale",
      url: "https://example.com/twelve",
      height: 420,
    }
  ];

  return (
    <>

      <div className="relative z-20">
        <Navbar />
      </div>

      <div
        className="h-screen bg-no-repeat bg-top bg-contain"
        style={{ backgroundImage: `url('${backgroundImage}')` }}
      >
        <div className="flex justify-center">
          <Image
            src="/oneone.png"
            width={300}
            height={2}
            alt="oneone"
            className="mt-32 sm:mt-32"
            draggable={false}
          />
        </div>
        <div className="h-full w-full flex flex-col justify-center text-center -mt-36 sm:-mt-[250px] px-4 sm:px-6">
          <h1
            ref={textRef}
            className="text-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-medium mt-10 sm:mt-4 md:mt-6 leading-tight md:leading-tight text-center"
          ></h1>
          <div className="mt-4 flex justify-center w-full px-4 sm:px-6">
            <div className="max-w-2xl w-full flex justify-center">
              <BlurText
                text="Shop sustainably with Eraiiz and discover how waste can be transformed to wealth while keeping the planet safe."
                delay={150}
                animateBy="words"
                direction="top"
                className="text-gray-500 font-light text-center w-full"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-4 sm:mt-6 sm:space-x-4 px-6">
            <Link href="/signup">
              <button className="bg-[#008C00] text-white py-3 px-8 rounded-lg w-full sm:w-auto transition-transform duration-300 hover:scale-105">
                Create your account
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-[#FFFFFF] text-black py-3 px-8 rounded-lg w-full sm:w-auto border border-[#D1D1D1] transition-transform duration-300 hover:scale-105">
                Start shopping
              </button>
            </Link>
          </div>
        </div>

        <GridComponent />
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-[45px] font-medium text-gray-900 leading-snug mt-10">
              Connecting Consumers with Sustainable Brands to Reduce{" "}
              <span className="text-[#008C00]">Carbon</span> Footprint
            </h2>
          </div>

          <div className="mt-16 md:mt-80">
            <p className="text-gray-700 mb-6">
              With a small team of passionate individuals, Eraiiz is focused on
              redefining climate action to include earthwise shopping models.
              Our mission is to bridge the gap between sustainable brands and
              global consumers thereby reducing the level of carbon footprint in
              the whole supply chain.
            </p>
            <button className="px-6 py-2 bg-[#008C00] text-white rounded-md hover:bg-black hover:text-white transition-transform duration-300 hover:scale-105">
              Start Shopping
            </button>
          </div>
        </div>
        <div className="w-full flex flex-col items-center mt-20 mb-20">
          <h1 className="text-xs sm:text-sm md:text-base font-medium text-center mb-6 text-black">
            Why Eraiiz?
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[950px] p-5">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[250px] transition-transform duration-300 hover:scale-105">
              <h2 className="font-light text-xl mb-10 text-black">
                Access to a network of top-picked sustainable choices
              </h2>
              <p className="text-gray-500">
                We pre-vet all products available on Eraiiz to ensure that they
                are sustainably sourced and made.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[250px] transition-transform duration-300 hover:scale-105">
              <h2 className="font-light text-black text-xl mb-10">
                Easy navigation process
              </h2>
              <p className="text-gray-500">
                Our platform is organized with you in mind, hence, you don&apos;t
                have to go through any hassle, from product sorting to checking
                out, we&apos;ve got you covered.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[250px] transition-transform duration-300 hover:scale-105">
              <h2 className="font-light text-black text-xl mb-10">
                Data-driven approach
              </h2>
              <p className="text-gray-500">
                We leverage data that are meticulously researched and work with
                experts to connect you with the best sustainable brand you need.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-[250px] flex flex-col justify-between transition-transform duration-300 hover:scale-105">
              <p className="text-gray-500 mt-10">
                Sign Up &amp; Take your first step with Eraiiz to erase waste
              </p>
              <button className="bg-[#008C00] text-white font-semibold py-2 px-4 rounded-lg mt-4">
                Create your account
              </button>
            </div>
          </div>
          <Opposite />
          <div className="w-full max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 mb-20">
            <TrueFocus
              sentence="Save Earth"
              manualMode={false}
              blurAmount={5}
              borderColor="#008C00"
              glowColor="rgba(0, 140, 0, 0.6)"
              animationDuration={1.5}
              pauseBetweenAnimations={0.8}
            />
          </div>
          <div className="relative w-full max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-16 mb-20">
            <div className="h-[600px] md:h-[800px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
              <div className="min-h-full pb-8">
                <Masonry
                  items={items}
                  ease="power3.out"
                  duration={0.6}
                  stagger={0.05}
                  animateFrom="bottom"
                  scaleOnHover={true}
                  hoverScale={0.95}
                  blurToFocus={true}
                  colorShiftOnHover={false}
                />
              </div>
            </div>
          </div>

          {/* Blog Section */}
          <div className="w-full max-w-[1400px] mx-auto px-8 sm:px-12 lg:px-16 mb-20">
            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-2">
                <h2 className="text-sm sm:text-base md:text-lg font-medium">Blog Posts</h2>
                <p className="text-gray-600">
                  Inspire Change: Explore Insights on Recycling, Sustainability, and Carbon Reduction.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src="/recycled-products.png"
                    alt="Blog post"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between bg-white rounded-lg p-8 shadow-sm">
                  <div>
                    <h3 className="text-2xl font-medium mb-4">
                      Recycling Revolution: Turning Waste into Resources
                    </h3>
                    <p className="text-gray-600">
                      Recycling is more than just a trend– in this blog, we delve into the innovative ways industries and individuals are transforming waste into valuable materials.
                    </p>
                  </div>
                  <button className="bg-[#00B300] text-white px-6 py-3 rounded-lg w-fit mt-6 hover:bg-[#008C00] transition-colors">
                    Read more
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <div className="flex gap-2">
                  <div className="w-8 h-2 bg-[#008C00] rounded-full" />
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                  <div className="w-2 h-2 bg-gray-200 rounded-full" />
                </div>
                <button className="p-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <FaqSection />
          <CallToAction />
          <Footer />
        </div>
      </div>
    </>
  );
};

export default Page;
