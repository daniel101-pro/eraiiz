'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import PolicyPageLayout from '../../components/PolicyPageLayout';

export default function RefundPolicyPage() {
  useEffect(() => {
    document.title = 'Refund Policy | Eraiiz';
  }, []);

  return (
    <PolicyPageLayout title="Refund Policy" lastUpdated="December 15, 2024">
      <section>
        <h2 className="text-lg font-semibold text-gray-900">1. Overview</h2>
        <p>
          Eraiiz is committed to fair and transparent refunds. This policy explains when buyers may
          request a return or refund, how sellers should respond, and how Eraiiz may assist with disputes.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">2. Eligibility for Refunds</h2>
        <p>You may be eligible for a refund if:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>The item arrived damaged, defective, or materially different from the listing.</li>
          <li>The wrong item was delivered.</li>
          <li>The order was not shipped within the stated processing time and cannot be fulfilled.</li>
          <li>The product is unused, in original packaging, and returned within the allowed window.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">3. 30-Day Return Window</h2>
        <p>
          For most eligible items, buyers may request a return within <strong>30 days</strong> of delivery.
          Items must generally be unused and returned in their original packaging unless the return is due
          to damage, defect, or seller error.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">4. Non-Refundable Items</h2>
        <p>Refunds may not be available for:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Items marked as final sale or non-returnable in the listing.</li>
          <li>Products that have been used, altered, or damaged by the buyer after delivery.</li>
          <li>Custom or made-to-order products once production has started, unless defective.</li>
          <li>Digital goods or services already delivered and consumed.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">5. How to Request a Refund</h2>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>Contact the seller through your order details or Eraiiz support.</li>
          <li>Provide your order number, reason for the request, and supporting photos if applicable.</li>
          <li>Return the item according to the seller&apos;s or Eraiiz&apos;s return instructions when required.</li>
          <li>Once the return is confirmed, refunds are processed to the original payment method.</li>
        </ol>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">6. Refund Processing Time</h2>
        <p>
          Approved refunds are typically processed within <strong>5–10 business days</strong> after the
          returned item is received and inspected, depending on your payment provider or bank.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">7. Shipping Costs</h2>
        <p>
          If a return is due to seller error, damage, or a mislisted product, return shipping costs may
          be covered by the seller or Eraiiz. For change-of-mind returns, the buyer may be responsible
          for return shipping unless otherwise stated on the product listing.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">8. Disputes</h2>
        <p>
          If you cannot resolve an issue with a seller, contact Eraiiz support at{' '}
          <a href="mailto:support@eraiiz.com" className="text-green-600 hover:underline">
            support@eraiiz.com
          </a>
          . We may review order details, messages, and delivery records before making a final decision.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-900">9. Related Policies</h2>
        <p>
          Please also review our{' '}
          <Link href="/policies/acceptable-use" className="text-green-600 hover:underline">
            Acceptable Use Policy
          </Link>{' '}
          for platform conduct rules that apply to buyers and sellers.
        </p>
      </section>
    </PolicyPageLayout>
  );
}
