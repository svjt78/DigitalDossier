// File: pages/signup.js

import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import bcrypt from 'bcryptjs'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [bgUrl, setBgUrl]       = useState(null)
  const [resending, setResending] = useState(false)

  // Load the signup background
  useEffect(() => {
    fetch('/api/signup-bg')
      .then(res => res.json())
      .then(data => setBgUrl(data.signupBgUrl))
      .catch(console.error)
  }, [])

  // Redirect if already logged in
  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      router.replace('/')
    }
  }, [router])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Sign up failed')
      } else {
        // FIXED: Updated success message to clearly indicate email verification is required
        setSuccess(
          `Sign up successful! 🎉\n` +
          `We've sent a verification email to ${email}.\n` +
          `Please click the link in the email to activate your account before logging in.`
        )
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle resend verification email
  const handleResendEmail = async () => {
    setResending(true)
    try {
      const res = await fetch('/api/auth/verify-email/resend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        alert('✅ Verification email resent successfully! Please check your inbox (and spam folder).')
      } else if (res.status === 409) {
        // Already verified
        alert('✅ ' + data.error)
        // Optionally redirect to login
        setTimeout(() => router.push('/login'), 2000)
      } else if (res.status === 404) {
        alert('❌ ' + data.error)
      } else {
        alert('❌ ' + (data.error || 'Failed to resend email. Please try again later.'))
      }
    } catch (err) {
      console.error('Resend error:', err)
      alert('❌ Network error. Please check your connection and try again.')
    } finally {
      setResending(false)
    }
  }

  // Show enhanced success message once signup completes
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
          {/* Success icon */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-green-600">
              Sign Up Successful!
            </h2>
          </div>

          <div className="space-y-4">
            <p className="text-center text-gray-700 font-medium">
              Welcome aboard, {username}! 🎉
            </p>
            
            {/* Clear instructions box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-semibold text-blue-900 mb-2">
                ✉️ Check Your Email
              </p>
              <p className="text-sm text-blue-800 mb-3">
                We've sent a verification link to:
                <br />
                <strong className="text-blue-900">{email}</strong>
              </p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open the email from Digital Dossier</li>
                <li>Click the verification link</li>
                <li>Your account will be activated</li>
                <li>Then you can log in</li>
              </ol>
            </div>

            {/* Important note */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs text-amber-800">
                <strong>Important:</strong> You must verify your email before you can log in. 
                The verification link expires in 24 hours.
              </p>
            </div>

            {/* Resend option */}
            <div className="pt-4 border-t text-center">
              <p className="text-sm text-gray-600">
                Can't find the email? Check your spam folder or{' '}
                <button 
                  onClick={handleResendEmail}
                  disabled={resending}
                  className="text-blue-600 hover:underline disabled:opacity-50"
                >
                  {resending ? 'resending...' : 'resend verification email'}
                </button>
              </p>
            </div>

            {/* Login link */}
            <div className="text-center pt-4">
              <Link
                href="/login"
                className="inline-block text-blue-600 hover:underline text-sm"
              >
                Go to Login Page →
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Otherwise, render the two-column signup form
  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Signup Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-gray-600">
            Enter your details below to sign up.
          </p>
          {error && <p className="mt-4 text-red-600">{error}</p>}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              />
            </div>

            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              />
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {loading ? 'Signing up…' : 'Sign Up'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>

            <div className="tooltip-container" data-tooltip="Coming soon! 🚀">
              <button
                type="button"
                onClick={() => {}}
                className="w-full py-2 border border-gray-300 rounded-md flex items-center justify-center space-x-2 hover:bg-gray-50 cursor-not-allowed opacity-75"
              >
                <Image
                  src="/icons/google.svg"
                  alt="Google logo"
                  width={18}
                  height={18}
                />
                <span className="text-gray-700">Sign up with Google</span>
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              href="/login"
              className="text-primary-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Background Image */}
      <div className="hidden md:block flex-1 relative">
        {bgUrl && (
          <Image
            src={bgUrl}
            alt="Sign up background"
            fill
            className="object-cover"
            priority
          />
        )}
      </div>
    </div>
  )
}