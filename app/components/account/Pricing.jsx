'use client';

import { DollarSign, LayoutGrid, Handshake } from 'lucide-react';

export default function Pricing() {
  return (
    <div className="space-y-8">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600"/> Eraiiz Pricing</h2>
        <p className="text-gray-600 mb-4 text-sm leading-relaxed">
          Our business model is simple, flexible, and designed to help sustainable brands thrive while
          funding platform innovation.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Commission */}
          <div className="p-4 border border-green-100 rounded-lg bg-green-50">
            <div className="flex items-center gap-2 mb-2 text-green-700 font-semibold"><LayoutGrid className="h-4 w-4"/> Commission-Based</div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Eraiiz earns a <span className="font-medium">10-15% commission</span> on every successful sale.
              Zero upfront costs – we only win when our sellers win.
            </p>
          </div>
          {/* Subscription */}
          <div className="p-4 border border-blue-100 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2 text-blue-700 font-semibold"><DollarSign className="h-4 w-4"/> Subscription Model</div>
            <p className="text-sm text-gray-700 leading-relaxed">
              Brands can opt in to a <span className="font-medium">monthly or yearly subscription</span> for
              premium storefront visibility, deeper analytics, and exclusive marketing boosts.
            </p>
          </div>
          {/* Partnerships */}
          <div className="p-4 border border-purple-100 rounded-lg bg-purple-50">
            <div className="flex items-center gap-2 mb-2 text-purple-700 font-semibold"><Handshake className="h-4 w-4"/> Strategic Partnerships</div>
            <p className="text-sm text-gray-700 leading-relaxed">
              We collaborate with leading <span className="font-medium">sustainability certifiers</span> to help
              brands validate their eco-claims and unlock extra trust badges inside Eraiiz.
            </p>
          </div>
        </div>
      </div>
      {/* Why Eraiiz */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-3">Why Eraiiz?</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>Building the <span className="font-medium">world’s largest marketplace for sustainability</span>.</li>
          <li>AI-powered product recommendations & transparent impact tracking.</li>
          <li>Unique plantable packaging that turns orders into new life 🌱.</li>
          <li>Mission-driven team laser-focused on Gen&nbsp;Z and climate action.</li>
        </ul>
      </div>
    </div>
  );
} 