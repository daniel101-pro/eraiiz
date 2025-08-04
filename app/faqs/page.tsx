"use client"
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

type FAQItem = {
  question: string;
  answer: string;
};

const faqs: FAQItem[] = [
  {
    question: 'What level of carbon emission is reduced by shopping from Eraiiz?',
    answer: `Every product on Eraiiz is a makeup of different recyclables. It's more accurate to say that purchasing recycled products from Eraiiz can help reduce your personal carbon footprint and contribute to a more sustainable future.

The amount of carbon emissions reduced by shopping from Eraiiz varies depending on the specific product and its material composition. However, studies show that recycled materials like PET plastic can save around 75% of the carbon emissions compared to virgin materials. Similarly, recycling aluminum saves about 95% of the energy used in production. By choosing recycled products, you can contribute to a more sustainable future.`
  },
  {
    question: 'What are the potential levels of carbon impact that can possibly be achieved by shopping from Eraiiz?',
    answer: 'The potential carbon impact reduction varies depending on the product category and recycling methods used. Eraiiz aims to provide transparent information about the carbon savings for each product.'
  },
  {
    question: 'Are recycled products overly exaggerated?',
    answer: 'No, recycled products are effective and sustainable alternatives that help reduce environmental impact without compromising quality.'
  },
  {
    question: 'Do recycled products have same durability and life expectancy as other conventional/traditional products?',
    answer: 'Yes, products on Eraiiz are designed to meet high-quality standards, ensuring durability and longevity comparable to conventional products.'
  },
  {
    question: 'What categories of products are available on Eraiiz?',
    answer: 'Eraiiz offers a variety of products, including clothing, accessories, home decor, and more, all made from quality recycled materials.'
  },
  {
    question: 'What are the end goals of shopping for recycled products?',
    answer: 'To promote sustainability, reduce carbon footprint, and contribute to a cleaner environment while enjoying high-quality products.'
  }
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <>
        <div className="relative z-10">
          <Navbar />
        </div>
    <div className="max-w-4xl mx-auto my-16 p-6">
      <div className="text-center mb-10">
        <div className="flex justify-center items-center text-[#008C00] mb-2">
          <HelpCircle className="mr-2" />
          <span>FAQs</span>
        </div>
        <h2 className="text-3xl font-semibold text-black mb-2">Frequently Asked Questions</h2>
        <p className="text-gray-500">Everything You Need to Know: Answers to Your Most Common Questions.</p>
      </div>
      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="border border-[#D1D1D1] rounded-lg p-4 bg-white cursor-pointer transition-all"
          >
            <div className="flex justify-between items-center" onClick={() => toggleFAQ(index)}>
              <h3 className="text-black text-base font-medium flex-1">Q: {faq.question}</h3>
              {openIndex === index ? (
                <ChevronUp className="text-[#008C00] ml-2" size={20} />
              ) : (
                <ChevronDown className="text-[#008C00] ml-2" size={20} />
              )}
            </div>
            {openIndex === index && (
              <div className="mt-4 text-gray-600 text-sm">
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="text-center text-gray-500 mt-8">
        Can’t find answers to your question? Reach out to us <span className="text-[#008C00]">here</span>
      </div>
    </div>
    </>
  );
};

export default FAQSection;
