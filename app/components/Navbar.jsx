"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiMenu, FiX } from "react-icons/fi";
import SplashCursor from "../Animations/SplashCursor/SplashCursor";

const navLinks = [
  { label: "About Eraiiz", href: "/about" },
  { label: "Products", href: "/login" },
  { label: "FAQs", href: "/faqs" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <>

      {/* Navbar */}
      <div className="fixed top-0 left-0 w-full bg-white shadow-md py-4 px-6 z-50">
        <nav className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <Image
                src="/logo.png"
                alt="Eraiiz Logo"
                width={120}
                height={40}
                className="h-8 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-7 text-black">
            {navLinks.map((item, index) => (
              <Link key={index} href={item.href}>
                <span className="relative group font-bold transition-colors text-black hover:text-green-600 cursor-pointer">
                  {item.label}
                  <span className="block h-[2px] w-0 bg-green-600 group-hover:w-full transition-all duration-300"></span>
                </span>
              </Link>
            ))}

            {/* Contact Support */}
            <a
              href="mailto:eraiizinfo@gmail.com"
              className="relative group text-green-600 font-bold transition-colors hover:text-black"
            >
              Contact Support
              <span className="block h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
            </a>
          </div>

          {/* Sign Up (Desktop) */}
          <Link
            href="signup"
            className="hidden md:flex items-center px-6 py-2 rounded-lg text-green-500 font-bold border border-green-500 transition-colors hover:bg-green-500 hover:text-white"
          >
            Sign Up Now
          </Link>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-black"
            onClick={toggleMenu}
            aria-label={isOpen ? "Close Menu" : "Open Menu"}
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </nav>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col gap-4">
              {navLinks.map((item, index) => (
                <Link key={index} href={item.href}>
                  <span className="block text-black hover:text-green-600 font-bold">
                    {item.label}
                  </span>
                </Link>
              ))}

              {/* Email */}
              <a
                href="mailto:eraiizinfo@gmail.com"
                className="relative group text-green-600 transition-colors hover:text-black"
              >
                eraiizinfo@gmail.com
                <span className="block h-[2px] w-0 bg-black group-hover:w-full transition-all duration-300"></span>
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;
