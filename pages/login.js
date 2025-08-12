// File: pages/login.js

import { useState, useEffect, useContext } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { AuthContext } from '@/contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login, userId } = useContext(AuthContext) // <-- FIX: use userId
  const { confirmed } = router.query

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [bgUrl, setBgUrl]       = useState(null)

  // Redirect to home if already logged in
  useEffect(() => {
    if (userId) {
      router.replace('/')
    }
  }, [userId, router]) // <-- FIX: depend on userId

  // Show banner if email verification just completed
  useEffect(() => {
    if (confirmed === 'true') {
      setError('Your email has been verified! Please log in below.')
    }
  }, [confirmed])

  // Fetch background image URL on mount
  useEffect(() => {
    fetch('/api/login-bg')
      .then(res => res.json())
      .then(data => setBgUrl(data.loginBgUrl))
      .catch(console.error)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
      } else {
        login(data)
        router.push('/')
      }
    } catch (err) {
      setError(err.message || 'Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!bgUrl) return null

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left: Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-8">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold text-gray-900">Log In</h1>
          <p className="mt-2 text-gray-600">
            Enter your credentials to access your account.
          </p>

          {error && (
            <div
              className={`mt-4 p-3 rounded-md ${
                confirmed === 'true'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
              <div className="text-right mt-1">
                <Link href="/forgot-password" className="text-blue-600 hover:underline text-sm">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {loading ? 'Logging in…' : 'Log In'}
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
                onClick={() => {/* TODO: Google OAuth */}}
                className="w-full py-2 border border-gray-300 rounded-md flex items-center justify-center space-x-2 hover:bg-gray-50 cursor-not-allowed opacity-75"
              >
                <Image
                  src="/icons/google.svg"
                  alt="Google logo"
                  width={18}
                  height={18}
                />
                <span className="text-gray-700">Log in with Google</span>
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Right: Background Image */}
      <div className="hidden md:block flex-1 relative">
        <Image
          src={bgUrl}
          alt="Login background"
          fill
          className="object-cover"
          priority
        />
      </div>
    </div>
  )
}