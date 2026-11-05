import { useState } from 'react'
import { saveAddress } from '../services/commerce'

const emptyAddress = {
  recipient_name: '',
  phone_number: '',
  address_line1: '',
  address_line2: '',
  landmark: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  is_default: false,
}

function getErrorMessage(requestError) {
  const data = requestError.response?.data
  if (!data) return 'We could not save this address.'
  return Object.values(data).flat().join(' ') || 'We could not save this address.'
}

function AddressForm({ initialValues = {}, addressId, onSaved, onCancel }) {
  const [values, setValues] = useState({ ...emptyAddress, ...initialValues })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function updateField(event) {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    const requiredFields = ['recipient_name', 'phone_number', 'address_line1', 'city', 'state', 'postal_code', 'country']
    if (requiredFields.some((field) => !values[field].trim())) {
      setError('Please complete all required address fields.')
      return
    }
    setBusy(true)
    try {
      const address = await saveAddress(values, addressId)
      onSaved(address)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setBusy(false)
    }
  }

  const fields = [
    ['recipient_name', 'Full name'],
    ['phone_number', 'Phone number'],
    ['address_line1', 'Address line'],
    ['address_line2', 'Apartment / suite (optional)'],
    ['landmark', 'Landmark (optional)'],
    ['city', 'City'],
    ['state', 'State'],
    ['postal_code', 'Postal code'],
    ['country', 'Country'],
  ]

  return (
    <form className="mt-6 space-y-3" onSubmit={submit} noValidate>
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(([name, label]) => (
          <input
            className={`field ${name === 'address_line1' || name === 'address_line2' || name === 'landmark' ? 'sm:col-span-2' : ''}`}
            key={name}
            name={name}
            required={!label.includes('optional')}
            placeholder={label}
            value={values[name]}
            onChange={updateField}
          />
        ))}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <div className="flex flex-wrap gap-3 pt-2">
        <button className="button" type="submit" disabled={busy}>
          {busy ? 'Saving address…' : 'Save address'}
        </button>
        {onCancel ? <button className="border border-charcoal/20 px-6 py-3 text-[0.65rem] uppercase tracking-editorial" type="button" onClick={onCancel} disabled={busy}>Cancel</button> : null}
      </div>
    </form>
  )
}

export default AddressForm
