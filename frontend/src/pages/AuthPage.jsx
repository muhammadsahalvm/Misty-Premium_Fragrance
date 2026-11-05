import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/useAppContext'

function getErrorMessage(requestError) {
  const data = requestError.response?.data
  if (!data) return 'We could not complete that request.'
  return Object.values(data).flat().join(' ') || 'We could not complete that request.'
}

function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ email: '', password: '', password_confirm: '', first_name: '', last_name: '', phone_number: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { login, register } = useAppContext()
  const navigate = useNavigate()
  const location = useLocation()

  async function submit(event) {
    event.preventDefault()
    setError('')
    if (isRegister && form.password !== form.password_confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    try {
      if (isRegister) {
        await register(form)
        await login({ email: form.email, password: form.password })
      } else {
        await login({ email: form.email, password: form.password })
      }
      const from = location.state?.from
      const destination = from ? `${from.pathname}${from.search || ''}${from.hash || ''}` : '/account'
      navigate(destination, {
        replace: true,
        state: location.state?.intent ? { intent: location.state.intent } : undefined,
      })
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mx-auto max-w-xl px-6 py-24 sm:py-32">
      <p className="eyebrow text-center">Misty account</p>
      <h1 className="editorial-title mt-5 text-center">{isRegister ? 'Join the house.' : 'Welcome back.'}</h1>
      <form className="mt-12 space-y-5" onSubmit={submit}>
        {isRegister ? <div className="grid gap-5 sm:grid-cols-2">{['first_name', 'last_name'].map((name) => <input key={name} required className="field" placeholder={name.replace('_', ' ')} value={form[name]} onChange={(e) => setForm({ ...form, [name]: e.target.value })} />)}</div> : null}
        {isRegister ? <input className="field" type="tel" placeholder="Phone number (optional)" value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /> : null}
        <input className="field" type="email" required placeholder="Email address" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="field" type="password" required placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {isRegister ? <input className="field" type="password" required placeholder="Confirm password" value={form.password_confirm} onChange={(e) => setForm({ ...form, password_confirm: e.target.value })} /> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="button w-full" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}</button>
      </form>
      <p className="mt-8 text-center text-sm text-charcoal/60">{isRegister ? 'Already a member?' : 'New to Misty?'} <Link className="border-b border-charcoal text-charcoal" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
    </section>
  )
}

export default AuthPage
