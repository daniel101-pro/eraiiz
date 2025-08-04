'use client';

import { useState, useEffect } from 'react';
import Image from "next/image";
import Link from "next/link";
import { Leaf } from "lucide-react";
import axios from 'axios';

export default function CategoriesSection() {
  const [categories, setCategories] = useState([
    {
      name: "Plastic Made Products",
      count: "Loading...",
      href: "/plastic", // Updated
      image: "/image1.png",
      id: "plastic",
    },
    {
      name: "Glass Made Products",
      count: "Loading...",
      href: "/glass", // Updated
      image: "/image2.png",
      id: "glass",
    },
    {
      name: "Rubber Made Products",
      count: "Loading...",
      href: "/rubber", // Updated
      image: "/image3.png",
      id: "rubber",
    },
    {
      name: "General Recycled Items",
      count: "Loading...",
      href: "/recycled", // Updated
      image: "/image4.png",
      id: "recycled",
    },
  ]);

  // Fetch product counts
  useEffect(() => {
    const fetchProductCounts = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/products/count`, {
          timeout: 30000,
        });
        console.log('CategoriesSection: Product Counts Response:', response.data);
        const updatedCategories = categories.map((cat) => {
          const countData = response.data.find((item) => item.category === cat.name);
          return {
            ...cat,
            count: countData ? `${countData.count.toLocaleString()} products` : '0 products',
          };
        });
        setCategories(updatedCategories);
      } catch (error) {
        console.error('CategoriesSection: Fetch Error:', error.response?.data || error.message);
        setCategories(categories.map((cat) => ({ ...cat, count: 'Error' })));
      }
    };
    fetchProductCounts();
  }, []);

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-sm font-semiboldtext-xl sm:text-2xl font-semibold text-gray-800">Explore these categories</h1>
        <Link
          href="/categories"
          className="flex items-center gap-1 px-4 py-1.5 bg-[#F8FFF8] border border-[#CDEFCB] text-gray-700 rounded-xl text-sm font-medium hover:bg-[#ECF9EC] transition"
        >
          See all
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={cat.href}
            className="block group"
          >
            <div className="overflow-hidden rounded-xl">
              <Image
                src={cat.image}
                alt={cat.name}
                width={300}
                height={300}
                className="w-full h-48 object-cover transition duration-300 group-hover:scale-105 rounded-xl"
              />
            </div>
            <div className="mt-3 text-center">
              <div className="flex items-center justify-center">
                <Leaf className="h-4 w-4 text-green-600 mr-1" />
                <h3 className="text-base font-semibold text-gray-900">{cat.name}</h3>
              </div>
              <p className="text-sm text-gray-500">{cat.count}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}