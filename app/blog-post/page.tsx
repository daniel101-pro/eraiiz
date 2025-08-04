"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Footer from "../components/Footer";


const BlogPost = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-md mt-28">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          The Future of Sustainable Shopping
        </h1>
        <p className="text-gray-500 text-sm">Published on March 20, 2025 by Eraiiz Team</p>

        <Image
          src="/cta.png"
          width={800}
          height={400}
          alt="Sustainable shopping concept"
          className="w-full h-64 object-cover mt-4 rounded-md"
        />

        <p className="text-lg text-gray-700 mt-6 leading-relaxed">
          The shift towards sustainable shopping is gaining momentum as more
          people recognize the importance of reducing their carbon footprint.
          At Eraiiz, we are committed to promoting eco-friendly products that
          help consumers make more conscious choices.
        </p>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6">
          The Wild Truth and Our Why
        </h2>
        <p className="text-gray-700 mt-4">
          Sustainable brands have struggled with visibility, affecting their functionality
          and success. A notable example is Shaker London, which shut down despite rebranding
          due to financial constraints from market invisibility.
        </p>

        <blockquote className="bg-green-100 border-l-4 border-green-500 p-4 mt-6 italic text-gray-800">
          &ldquo;Sustainable shopping isn&rsquo;t just a trend; it&rsquo;s the future. Every
          purchase you make is a vote for the kind of world you want to live in.&rdquo;
        </blockquote>

        <h2 className="text-2xl font-semibold text-gray-800 mt-6">
          How Eraiiz is Making a Difference
        </h2>
        <p className="text-gray-700 mt-4">
          Eraiiz is redefining climate action by connecting sustainable brands with global consumers.
          Our AI-powered sustainability insights and impact tracking feature allow users to measure
          their contribution to carbon footprint reduction.
        </p>

        <div className="flex justify-center mt-8">
          <Link 
            href="/shop" 
            className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-800 transition"
          >
            Explore Sustainable Products
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BlogPost;
