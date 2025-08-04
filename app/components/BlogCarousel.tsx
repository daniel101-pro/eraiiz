"use client";
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const BlogPostsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < 6) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-between mt-8 px-6 lg:px-16">
      {/* Left Image Section */}
      <div className="lg:w-1/3 mb-6 lg:mb-0">
        <Image
          src="/recycling-grid.png"
          alt="Recycling Grid"
          width={400}
          height={400}
          className="rounded-2xl w-full h-full object-cover"
        />
      </div>

      {/* Text Content Section */}
      <div className="lg:w-1/3 text-center lg:text-left mb-6 lg:mb-0">
        <h2 className="text-4xl font-bold font-[East Sea Dokdo]">Blog Posts</h2>
        <p className="text-gray-600 mt-2">
          Inspire Change: Explore Insights on Recycling, Sustainability, and
          Carbon Reduction.
        </p>

        {/* Navigation Controls */}
        <div className="flex items-center justify-center lg:justify-start mt-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="p-2 border rounded-full mr-2 transition-all hover:bg-gray-200"
          >
            <ChevronLeft />
          </button>
          <div className="h-2 w-20 bg-gray-300 rounded-full overflow-hidden mx-2">
            <div
              className="h-full bg-green-500"
              style={{ width: `${(currentIndex / 6) * 100}%` }}
            />
          </div>
          <button
            onClick={handleNext}
            disabled={currentIndex === 6}
            className="p-2 border rounded-full transition-all hover:bg-gray-200"
          >
            <ChevronRight />
          </button>
        </div>
      </div>

      {/* Blog Post Card */}
      <div className="lg:w-1/3">
        <Card className="p-6 bg-white rounded-2xl shadow-lg transition-all hover:shadow-xl">
          <h3 className="text-2xl font-bold mb-2">
            Recycling Revolution: Turning Waste into Resources
          </h3>
          <p className="text-gray-600">
            Recycling is more than just a trend— in this blog, we delve into the
            innovative ways industries and individuals are transforming waste
            into valuable materials.
          </p>
          <Link 
            href="/blog-post"
            className="inline-block mt-4 bg-green-500 text-white px-6 py-2 rounded-xl transition-all hover:bg-green-600 active:transform active:scale-95"
          >
            Read more
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default BlogPostsCarousel;
