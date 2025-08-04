"use client";
import React from "react";

export default function JoinWaitlistPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-8">
      {/* Top Nav (Logo + Language Switcher) */}
      <nav className="w-full max-w-sm mx-auto flex items-center justify-between mb-6">
        {/* Country Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">NG</span>
          {/* Optionally insert a flag image here */}
          {/* <Image src="/ng-flag.png" alt="NG Flag" width={24} height={16} /> */}
        </div>
      </nav>

      {/* Main Container */}
      <div className="w-full max-w-sm mx-auto">
        {/* Heading and Subtext */}
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Welcome to Eraiiz
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Join our exclusive waitlist for early access to innovative sustainable solutions and products designed to transform your lifestyle while saving our planet.
        </p>

        {/* Join Waitlist with Google */}
        <button className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-lg py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 mb-4">
          {/* Optional Google Icon */}
          {/* <Image src="/google-icon.png" alt="Google" width={18} height={18} className="mr-2" /> */}
          Join Waitlist with Google
        </button>

        {/* Separator */}
        <div className="flex items-center justify-center mb-4">
          <span className="text-gray-400 text-sm">Or</span>
        </div>

        {/* Form */}
        <form className="space-y-4">
          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email address"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              placeholder="At least 8 characters"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-green-600 focus:outline-none"
            />
          </div>

          {/* Terms & Conditions */}
          <div className="flex items-start">
            <input
              id="terms"
              type="checkbox"
              className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
              I agree to Eraiiz’s{" "}
              <a href="#" className="text-green-600 underline">
                terms and conditions
              </a>
            </label>
          </div>

          {/* Join Waitlist Button */}
          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded-md text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Join Waitlist
          </button>
        </form>

        {/* Already have an account */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{" "}
          <a href="#" className="text-green-600 font-medium">
            Sign in here
          </a>
        </p>
      </div>
    </div>
  );
}
