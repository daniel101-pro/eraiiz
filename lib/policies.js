import {
  Shield,
  RotateCcw,
  FileText,
  Lock,
  Cookie,
  Truck,
  Users,
  Leaf,
} from 'lucide-react';

export const policies = [
  {
    title: 'Terms of Service',
    description: 'The agreement governing your use of Eraiiz as a buyer or seller.',
    href: '/policies/terms',
    icon: FileText,
  },
  {
    title: 'Privacy Policy',
    description: 'How we collect, use, store, and protect your personal information.',
    href: '/policies/privacy',
    icon: Lock,
  },
  {
    title: 'Acceptable Use Policy',
    description: 'Rules for using the Eraiiz platform responsibly as a buyer or seller.',
    href: '/policies/acceptable-use',
    icon: Shield,
  },
  {
    title: 'Refund Policy',
    description: 'How returns, refunds, and order disputes are handled on Eraiiz.',
    href: '/policies/refund',
    icon: RotateCcw,
  },
  {
    title: 'Shipping Policy',
    description: 'Delivery timelines, shipping methods, and order fulfillment expectations.',
    href: '/policies/shipping',
    icon: Truck,
  },
  {
    title: 'Cookie Policy',
    description: 'How Eraiiz uses cookies and similar technologies on our website.',
    href: '/policies/cookies',
    icon: Cookie,
  },
  {
    title: 'Community Guidelines',
    description: 'Standards for respectful interaction across the Eraiiz marketplace.',
    href: '/policies/community',
    icon: Users,
  },
  {
    title: 'Sustainability Standards',
    description: 'Environmental and listing requirements for products on Eraiiz.',
    href: '/policies/sustainability',
    icon: Leaf,
  },
];

export const POLICY_LAST_UPDATED = 'December 15, 2024';
