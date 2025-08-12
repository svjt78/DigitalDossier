// File: pages/confirm.js

import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ConfirmPage() {
  const router = useRouter()
  const { token } = router.query
  const [status, setStatus] = useState('loading')  // 'loading' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) return

    const confirmEmail = async () => {
      try {
        const res = await fetch(`/api/auth/confirm?token=${encodeURIComponent(token)}`)
        const payload = await res.json()
        if (res.ok) {
          setStatus('success')
          // Optionally redirect after a short pause:
          setTimeout(() => {
            router.replace('/login?confirmed=true')
          }, 2000)
        } else {
          setErrorMessage(payload.error || 'Confirmation failed.')
          setStatus('error')
        }
      } catch (err) {
        setErrorMessage(err.message || 'Network error.')
        setStatus('error')
      }
    }

    confirmEmail()
  }, [token, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <p className="text-gray-600">Confirming your email…</p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-semibold text-red-600">Confirmation Failed</h2>
          <p className="mt-4 text-gray-700">{errorMessage}</p>
          <Link
            href="/signup"
            className="mt-6 inline-block text-blue-600 hover:underline"
          >
            Try signing up again
          </Link>
        </div>
      </div>
    )
  }

  // Success state (briefly visible before redirect)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
        <h2 className="text-2xl font-semibold text-green-600">Email Confirmed!</h2>
        <p className="mt-4 text-gray-700">
          Your email has been confirmed. Redirecting to login…
        </p>
        <p className="mt-2 text-sm text-gray-500">
          If you’re not redirected,{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            click here
          </Link>.
        </p>
      </div>
    </div>
  )
}
