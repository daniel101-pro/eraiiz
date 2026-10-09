'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

const BUYER = [
  'Browse and buy products',
  'Support sustainable brands',
  'Secure checkout',
  'Join the marketplace as a shopper',
];

const SELLER = [
  'List products in your store',
  'Get paid for sales',
  'Reach buyers on Eraiiz',
  'Grow a green brand',
];

export default function MigratePage() {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState(null);
  const termsRef = useRef(null);

  const handleScroll = () => {
    if (!termsRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = termsRef.current;
    const range = Math.max(1, scrollHeight - clientHeight);
    const progress = (scrollTop / range) * 100;
    setScrollProgress(progress);
    setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 10);
  };

  const handleAcceptAndContinue = async () => {
    if (!isScrolledToBottom) return;

    setIsLoading(true);

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/migrate-to-seller`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to upgrade to seller account');
      }

      if (data.user && data.user.role !== 'seller') {
        throw new Error('Role update failed - please try again');
      }

      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...storedUser, ...data.user };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('role', data.user.role);

      setIsLoading(false);
      setShowSuccess(true);

      setTimeout(() => {
        window.location.href = '/dashboard/seller';
      }, 1800);
    } catch (err) {
      setIsLoading(false);
      setError(err.message);
      setTimeout(() => setError(null), 5000);
    }
  };

  useEffect(() => {
    handleScroll();
  }, []);

  return (
    <div className="min-h-screen bg-white text-green-950">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-12 flex items-center justify-between">
          <Image src="/logo.png" alt="Eraiiz" width={110} height={36} className="h-8 w-auto" />
          <Link href="/dashboard/buyer" className="text-sm text-gray-500 hover:text-green-950">
            Back
          </Link>
        </header>

        <p className="text-sm font-medium text-green-800">Seller upgrade</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Become a seller</h1>
        <p className="mt-3 max-w-xl text-base text-gray-600">
          Keep shopping as a buyer, and start listing products. Read the agreement, then confirm.
        </p>

        <div className="mt-10 grid gap-8 border-y border-gray-200 py-8 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">Now</p>
            <h2 className="mt-1 text-lg font-semibold">Buyer</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {BUYER.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400">After</p>
            <h2 className="mt-1 text-lg font-semibold">Seller</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {SELLER.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-12">
          <h2 className="text-xl font-semibold">Seller agreement</h2>
          <p className="mt-1 text-sm text-gray-500">Scroll to the end to continue.</p>

          <div className="mt-5 border border-gray-200">
            <div
              ref={termsRef}
              onScroll={handleScroll}
              className="h-80 overflow-y-auto p-5 text-sm leading-relaxed text-gray-700 sm:p-6"
              tabIndex={0}
            >
              <h3 className="text-base font-semibold text-green-950">Eraiiz Seller Terms and Conditions</h3>
              <p className="mt-1 text-xs text-gray-500">Effective Date: January 1, 2024 · Last Updated: December 15, 2024</p>

              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-green-950">1. Welcome to Eraiiz Seller Program</h4>
                  <p className="mt-2">
                    By joining Eraiiz as a seller, you become part of a sustainable commerce marketplace. These terms
                    govern your participation.
                  </p>
                  <p className="mt-2">
                    You acknowledge that you have read, understood, and agree to be bound by these Terms, our{' '}
                    <Link href="/policies/privacy" className="underline">
                      Privacy Policy
                    </Link>
                    ,{' '}
                    <Link href="/policies/community" className="underline">
                      Community Guidelines
                    </Link>
                    ,{' '}
                    <Link href="/policies/sustainability" className="underline">
                      Sustainability Standards
                    </Link>
                    ,{' '}
                    <Link href="/policies/acceptable-use" className="underline">
                      Acceptable Use Policy
                    </Link>
                    , and{' '}
                    <Link href="/policies/refund" className="underline">
                      Refund Policy
                    </Link>
                    .
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">2. Seller Eligibility & Account Requirements</h4>
                  <p className="mt-2">
                    <strong>Age & Legal Capacity:</strong> You must be at least 18 years old and have legal capacity to
                    enter binding contracts in your jurisdiction.
                  </p>
                  <p className="mt-2">
                    <strong>Business Information:</strong> Provide accurate business details including tax identification,
                    banking information, and valid contact details.
                  </p>
                  <p className="mt-2">
                    <strong>Account Security:</strong> You are solely responsible for maintaining account confidentiality
                    and all activities under your account.
                  </p>
                  <p className="mt-2">
                    <strong>Verification:</strong> Eraiiz reserves the right to verify your identity and business
                    credentials at any time.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">3. Sustainability Standards & Product Requirements</h4>
                  <p className="mt-2">
                    <strong>Eco-Friendly Products:</strong> All products must align with our sustainability mission. This
                    includes using recycled materials, renewable resources, or contributing to environmental conservation.
                  </p>
                  <p className="mt-2">
                    <strong>Carbon Footprint Reporting:</strong> Sellers must provide accurate carbon footprint information
                    for their products using our integrated carbon calculator.
                  </p>
                  <p className="mt-2">
                    <strong>Prohibited Items:</strong> Items made from endangered species, single-use plastics (where
                    alternatives exist), or products with excessive packaging are strictly prohibited.
                  </p>
                  <p className="mt-2">
                    <strong>Sustainability Certification:</strong> Preference given to products with recognized
                    environmental certifications (FSC, Fair Trade, Energy Star, etc.).
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">4. Product Listings & Quality Standards</h4>
                  <p className="mt-2">
                    <strong>Accurate Descriptions:</strong> Product descriptions must be truthful, detailed, and include
                    sustainability information.
                  </p>
                  <p className="mt-2">
                    <strong>High-Quality Images:</strong> Minimum 3 clear, well-lit photos per product. Images must
                    accurately represent the item&apos;s condition and features.
                  </p>
                  <p className="mt-2">
                    <strong>Pricing Policy:</strong> Competitive and fair pricing. No price manipulation or artificial
                    inflation.
                  </p>
                  <p className="mt-2">
                    <strong>Inventory Management:</strong> Maintain accurate stock levels. Out-of-stock items must be
                    marked unavailable within 24 hours.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">5. Order Fulfillment & Shipping</h4>
                  <p className="mt-2">
                    <strong>Processing Time:</strong> Orders must be processed within 1–2 business days unless otherwise
                    specified.
                  </p>
                  <p className="mt-2">
                    <strong>Eco-Friendly Packaging:</strong> Use sustainable packaging materials whenever possible.
                    Minimize packaging waste.
                  </p>
                  <p className="mt-2">
                    <strong>Shipping Methods:</strong> Partner with eco-conscious shipping providers when available. Offer
                    carbon-neutral shipping options.
                  </p>
                  <p className="mt-2">
                    <strong>Tracking Information:</strong> Provide tracking details to customers within 24 hours of
                    shipment.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">6. Customer Service Excellence</h4>
                  <p className="mt-2">
                    <strong>Response Time:</strong> Respond to customer inquiries within 24 hours, preferably within 12
                    hours.
                  </p>
                  <p className="mt-2">
                    <strong>Professional Communication:</strong> Maintain courteous, helpful, and professional
                    communication at all times.
                  </p>
                  <p className="mt-2">
                    <strong>Return Policy:</strong> Honor reasonable return requests within 30 days. Clearly state your
                    return policy on product listings. See our{' '}
                    <Link href="/policies/refund" className="underline">
                      Refund Policy
                    </Link>{' '}
                    for platform-wide guidelines.
                  </p>
                  <p className="mt-2">
                    <strong>Issue Resolution:</strong> Work collaboratively with Eraiiz support to resolve customer
                    disputes promptly and fairly.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">7. Fees, Payments & Financial Terms</h4>
                  <p className="mt-2">
                    <strong>Commission Structure:</strong> Eraiiz charges a competitive 8–12% commission on sales, varying
                    by product category and seller performance.
                  </p>
                  <p className="mt-2">
                    <strong>Payment Schedule:</strong> Payments are processed weekly, with a 7-day holding period for new
                    sellers.
                  </p>
                  <p className="mt-2">
                    <strong>Transaction Fees:</strong> Additional fees may apply for payment processing (typically 2.9% +
                    $0.30 per transaction).
                  </p>
                  <p className="mt-2">
                    <strong>Tax Responsibility:</strong> Sellers are responsible for all applicable taxes, including sales
                    tax, VAT, and income tax reporting.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">8. Performance Metrics & Seller Standards</h4>
                  <p className="mt-2">
                    <strong>Seller Rating:</strong> Maintain a minimum 4.0-star average rating. Consistent poor
                    performance may result in account review.
                  </p>
                  <p className="mt-2">
                    <strong>Order Cancellation Rate:</strong> Keep cancellation rates below 5%. Excessive cancellations may
                    impact account standing.
                  </p>
                  <p className="mt-2">
                    <strong>Sustainability Score:</strong> Participate in our unique sustainability scoring system to boost
                    product visibility.
                  </p>
                  <p className="mt-2">
                    <strong>Performance Reviews:</strong> Monthly performance reviews with personalized recommendations
                    for improvement.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">9. Intellectual Property & Content</h4>
                  <p className="mt-2">
                    <strong>Original Content:</strong> All product images, descriptions, and content must be original or
                    properly licensed.
                  </p>
                  <p className="mt-2">
                    <strong>Brand Rights:</strong> Do not infringe on trademarks, copyrights, or other intellectual
                    property rights.
                  </p>
                  <p className="mt-2">
                    <strong>Content License:</strong> By uploading content, you grant Eraiiz a non-exclusive license to
                    use it for promotional and operational purposes.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">10. Account Termination & Violations</h4>
                  <p className="mt-2">
                    <strong>Violation Consequences:</strong> Account suspension or termination for repeated violations,
                    fraudulent activity, or failure to meet sustainability standards.
                  </p>
                  <p className="mt-2">
                    <strong>Appeal Process:</strong> Fair appeal process available for disputed account actions. Submit
                    appeals within 30 days.
                  </p>
                  <p className="mt-2">
                    <strong>Data Retention:</strong> Upon termination, seller data will be retained according to legal
                    requirements and our{' '}
                    <Link href="/policies/privacy" className="underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">11. Support & Community</h4>
                  <p className="mt-2">
                    <strong>Seller Support:</strong> Dedicated seller support team available Monday–Friday, 9 AM – 6 PM
                    EST.
                  </p>
                  <p className="mt-2">
                    <strong>Educational Resources:</strong> Access to sustainability guides, marketing tips, and business
                    growth resources.
                  </p>
                  <p className="mt-2">
                    <strong>Community Forums:</strong> Participate in seller community discussions and sustainability
                    initiatives.
                  </p>
                  <p className="mt-2">
                    <strong>Success Programs:</strong> Eligibility for featured seller programs and sustainability awards.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-950">12. Legal & Compliance</h4>
                  <p className="mt-2">
                    <strong>Governing Law:</strong> These terms are governed by the laws of the jurisdiction where Eraiiz
                    operates.
                  </p>
                  <p className="mt-2">
                    <strong>Dispute Resolution:</strong> Binding arbitration for disputes, with option for mediation first.
                  </p>
                  <p className="mt-2">
                    <strong>Limitation of Liability:</strong> Eraiiz&apos;s liability is limited to the amount of fees paid
                    by the seller in the preceding 12 months.
                  </p>
                  <p className="mt-2">
                    <strong>Updates to Terms:</strong> Terms may be updated with 30 days notice. Continued use constitutes
                    acceptance of new terms.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="font-semibold text-green-950">Contact</h4>
                  <p className="mt-2">Seller support: seller-support@eraiiz.com</p>
                  <p>General: hello@eraiiz.com</p>
                  <p>Hours: Monday–Friday, 9:00 AM – 6:00 PM EST</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-gray-200 px-5 py-3 text-xs text-gray-500">
              <span>{Math.round(scrollProgress)}% read</span>
              <button
                type="button"
                onClick={() => {
                  if (termsRef.current) {
                    termsRef.current.scrollTop = termsRef.current.scrollHeight;
                    handleScroll();
                  }
                }}
                className="underline hover:text-green-950"
              >
                Jump to end
              </button>
            </div>
          </div>

          <div className="mt-6">
            <button
              type="button"
              onClick={handleAcceptAndContinue}
              disabled={!isScrolledToBottom || isLoading}
              className="w-full rounded-none bg-green-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 sm:w-auto"
            >
              {isLoading ? 'Updating account…' : 'Accept and continue'}
            </button>
            {!isScrolledToBottom && (
              <p className="mt-3 text-sm text-gray-500">Read the agreement to the end before continuing.</p>
            )}
            {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          </div>
        </section>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 px-4">
          <div className="max-w-sm text-center">
            <p className="text-sm font-medium text-green-800">Done</p>
            <h3 className="mt-2 text-2xl font-bold">You are a seller</h3>
            <p className="mt-2 text-sm text-gray-600">Taking you to the seller dashboard.</p>
          </div>
        </div>
      )}
    </div>
  );
}
