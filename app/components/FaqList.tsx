'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

type FAQItem = {
  question: string;
  answer: ReactNode;
};

const faqs: FAQItem[] = [
  {
    question: 'How much carbon does shopping on Eraiiz save?',
    answer:
      'Each listing includes an estimated carbon footprint based on materials, weight, and shipping. Recycled inputs usually beat virgin materials, but the saving depends on the product. Check the product page for that item’s numbers.',
  },
  {
    question: 'Are recycled products as durable as new ones?',
    answer:
      'Listings are meant to last like comparable conventional goods. Read the product details and seller description for materials, care, and expected wear.',
  },
  {
    question: 'What can I buy on Eraiiz?',
    answer: (
      <>
        Recycled and sustainably made goods across plastic, rubber, glass, wood, palm frond, and general recycled categories.{' '}
        <Link href="/login" className="underline hover:text-green-950">
          Browse the shop
        </Link>
        .
      </>
    ),
  },
  {
    question: 'How do I become a seller?',
    answer: (
      <>
        Create an account as a buyer, then upgrade from Become a seller. That change is permanent.{' '}
        <Link href="/supplier/migrate" className="underline hover:text-green-950">
          Seller upgrade
        </Link>
        .
      </>
    ),
  },
  {
    question: 'How do I track an order?',
    answer:
      'When a seller ships, you get a tracking number. Open Orders in your account to follow it.',
  },
  {
    question: 'What is the return policy?',
    answer: (
      <>
        Most unused items in original packaging can be returned within 30 days.{' '}
        <Link href="/policies/refund" className="underline hover:text-green-950">
          Refund policy
        </Link>
        .
      </>
    ),
  },
  {
    question: 'Do you ship internationally?',
    answer:
      'Sellers ship from their own countries. Delivery time and cost depend on the listing and destination.',
  },
];

export default function FaqList({ compact = false }: { compact?: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className={compact ? 'w-full' : 'mx-auto max-w-3xl'}>
      <div className={compact ? 'mb-8' : 'mb-10'}>
        <p className="text-sm font-medium text-green-800">Help</p>
        <h2 className="mt-1 text-3xl font-bold tracking-tight text-green-950">Questions</h2>
        <p className="mt-2 text-sm text-gray-600">Orders, selling, impact, and returns.</p>
      </div>

      <div className="border-t border-gray-200">
        {faqs.map((faq, index) => {
          const open = openIndex === index;
          return (
            <div key={faq.question} className="border-b border-gray-200">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 py-4 text-left"
              >
                <span className="text-base font-medium text-green-950">{faq.question}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-500 transition ${open ? 'rotate-180' : ''}`} />
              </button>
              {open ? <div className="pb-4 text-sm leading-relaxed text-gray-600">{faq.answer}</div> : null}
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-gray-600">
        Still stuck?{' '}
        <Link href="/contact" className="font-medium text-green-900 underline hover:text-green-950">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}
