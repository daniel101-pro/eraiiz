'use client';

import { Suspense, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { ArrowLeft, Check, Eye, EyeOff, Mail } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const inputClass =
  'w-full h-11 rounded-lg border border-gray-200 bg-white px-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-green-700 focus:ring-2 focus:ring-green-700/15';
const buttonClass =
  'w-full h-11 rounded-lg bg-green-950 text-sm font-medium text-white transition hover:bg-green-900 disabled:opacity-60 flex items-center justify-center';

function Spinner() {
  return <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />;
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8">
        <Image src="/logo.png" alt="Eraiiz" width={110} height={32} className="h-8 w-auto" priority />
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        {children}
      </div>
      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </div>
  );
}

function RequestLink() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const send = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/auth/request-password-reset`, { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-50">
          <Mail className="h-5 w-5 text-green-800" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Check your email</h1>
        <p className="mt-1 text-sm text-gray-500 break-all">{email}</p>
        <button
          type="button"
          onClick={send}
          disabled={loading}
          className="mt-6 text-sm font-medium text-green-800 hover:underline disabled:opacity-60"
        >
          {loading ? 'Sending…' : 'Resend link'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Reset password</h1>
      <input
        type="email"
        autoComplete="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoFocus
        className={inputClass}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? <Spinner /> : 'Send reset link'}
      </button>
    </form>
  );
}

function PasswordField({ value, onChange, placeholder, autoFocus }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        autoComplete="new-password"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        minLength={8}
        autoFocus={autoFocus}
        className={`${inputClass} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-400 hover:text-gray-700"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SetPassword({ token }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Use at least 8 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, newPassword: password });
      setDone(true);
      setTimeout(() => router.push('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'This link is invalid or expired');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-green-50">
          <Check className="h-5 w-5 text-green-800" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900">Password updated</h1>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">New password</h1>
      <PasswordField
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        autoFocus
      />
      <PasswordField
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm password"
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className={buttonClass}>
        {loading ? <Spinner /> : 'Update password'}
      </button>
      {error && (
        <Link href="/reset-password" className="block text-center text-sm text-green-800 hover:underline">
          Get a new link
        </Link>
      )}
    </form>
  );
}

function ResetPasswordContent() {
  const token = useSearchParams().get('token');
  return <Shell>{token ? <SetPassword token={token} /> : <RequestLink />}</Shell>;
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
