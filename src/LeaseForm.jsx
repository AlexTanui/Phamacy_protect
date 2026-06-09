import { useState, useRef, useCallback } from 'react'
import LighthouseLogo from './LighthouseLogo'
import styles from './LeaseForm.module.css'

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xqeobala'

const CPI_STATES = [
  'Sydney', 'Melbourne', 'Brisbane', 'Adelaide', 'Perth',
  'Hobart', 'Darwin', 'Canberra', 'Weighted average of eight capital cities',
]

const MONTHS_1_12 = Array.from({ length: 12 }, (_, i) => String(i + 1))

const RENT_REVIEW_OPTIONS = [
  'Fixed %',
  'CPI Only',
  'CPI + Percentage',
  'Fixed Amount ($)',
]

const EMPTY_FORM = {
  tradingName: '',
  lessee: '',
  lessor: '',
  leaseCommencementDate: '',
  leaseExpiryDate: '',
  hasOptionToRenew: '',
  renewalDurationYears: '',
  renewalDurationMonths: '',
  renewalDurationDays: '',
  firstNoticeMonths: '',
  lastNoticeMonths: '',
  hasMarketReview: '',
  currentBaseRent: '',
  currentOutgoings: '',
  currentGrossRent: '',
  tenancyArea: '',
  annualRentReviews: '',
  fixedPercentage: '',
  cpiState: '',
  additionalPercentage: '',
  fixedAmount: '',
}

function Field({ label, required, error, hint, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        {label}
        {required && <span className={styles.required}> *</span>}
      </label>
      {children}
      {hint  && !error && <p className={styles.hint}>{hint}</p>}
      {error && <p className={styles.errorMsg}>{error}</p>}
    </div>
  )
}

function formatCurrency(value) {
  const digits = value.replace(/[^\d.]/g, '')
  const parts = digits.split('.')
  if (parts.length > 2) return value.slice(0, -1)
  if (parts[1] && parts[1].length > 2) return value.slice(0, -1)
  return digits
}

export default function LeaseForm() {
  // 'form' | 'document' — which path the user has chosen
  const [mode, setMode]             = useState(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [files, setFiles]           = useState([])
  const [dragOver, setDragOver]     = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus]         = useState(null) // 'success' | 'error' | null
  const [errorDetail, setErrorDetail] = useState('')
  const [errors, setErrors]         = useState({})
  const fileInputRef = useRef(null)
  const formRef      = useRef(null)

  const showRenewalFields = form.hasOptionToRenew === 'Yes'
  const showFixedPct      = form.annualRentReviews === 'Fixed %' || form.annualRentReviews === 'CPI + Percentage'
  const showCpiState      = form.annualRentReviews === 'CPI Only' || form.annualRentReviews === 'CPI + Percentage'
  const showAdditionalPct = form.annualRentReviews === 'CPI + Percentage'
  const showFixedAmount   = form.annualRentReviews === 'Fixed Amount ($)'

  const set = (field) => (e) => {
    const val = e.target.value
    setForm((prev) => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const setCurrency = (field) => (e) => {
    const formatted = formatCurrency(e.target.value)
    setForm((prev) => ({ ...prev, [field]: formatted }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const setInt = (field) => (e) => {
    const val = e.target.value.replace(/[^\d]/g, '')
    setForm((prev) => ({ ...prev, [field]: val }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }))
  }

  const addFiles = useCallback((incoming) => {
    const accepted = Array.from(incoming).filter((f) => {
      const ext = f.name.split('.').pop().toLowerCase()
      return ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'].includes(ext)
    })
    setFiles((prev) => {
      const names = new Set(prev.map((f) => f.name))
      return [...prev, ...accepted.filter((f) => !names.has(f.name))]
    })
  }, [])

  const removeFile = (name) => setFiles((prev) => prev.filter((f) => f.name !== name))

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const switchMode = (next) => {
    setMode(next)
    setErrors({})
    setStatus(null)
    // scroll form into view after a tick so the new content is rendered
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const validate = () => {
    const errs = {}
    if (!form.tradingName.trim()) errs.tradingName = 'Required'

    if (mode === 'document') {
      if (files.length === 0) errs.files = 'Please attach at least one lease document'
      return errs
    }

    // full form validation
    if (!form.lessee.trim())             errs.lessee = 'Required'
    if (!form.lessor.trim())             errs.lessor = 'Required'
    if (!form.leaseCommencementDate)     errs.leaseCommencementDate = 'Required'
    if (!form.leaseExpiryDate)           errs.leaseExpiryDate = 'Required'
    if (!form.hasOptionToRenew)          errs.hasOptionToRenew = 'Required'
    if (!form.hasMarketReview)           errs.hasMarketReview = 'Required'
    if (!form.currentBaseRent)           errs.currentBaseRent = 'Required'
    if (!form.currentOutgoings)          errs.currentOutgoings = 'Required'
    if (!form.currentGrossRent)          errs.currentGrossRent = 'Required'
    if (!form.tenancyArea)               errs.tenancyArea = 'Required'
    if (!form.annualRentReviews)         errs.annualRentReviews = 'Required'
    if (showRenewalFields) {
      if (!form.firstNoticeMonths)       errs.firstNoticeMonths = 'Required'
      if (!form.lastNoticeMonths)        errs.lastNoticeMonths = 'Required'
    }
    if (showFixedPct && !form.fixedPercentage)           errs.fixedPercentage = 'Required'
    if (showCpiState && !form.cpiState)                  errs.cpiState = 'Required'
    if (showAdditionalPct && !form.additionalPercentage) errs.additionalPercentage = 'Required'
    if (showFixedAmount && !form.fixedAmount)             errs.fixedAmount = 'Required'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      const firstKey = Object.keys(errs)[0]
      const el = formRef.current?.querySelector(`[name="${firstKey}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    setSubmitting(true)
    setStatus(null)

    try {
      let messageBody
      let subject

      if (mode === 'document') {
        subject = `${form.tradingName} – Lease Documents`
        messageBody = `
PHARMACY PROTECT – LEASE DOCUMENT SUBMISSION
=============================================

Trading Name: ${form.tradingName}

ATTACHED DOCUMENTS
------------------
${files.map((f) => `• ${f.name}`).join('\n')}
        `.trim()
      } else {
        subject = `${form.tradingName} – Lease Details`

        const renewalSection = showRenewalFields
          ? `
Renewal Duration (Years):             ${form.renewalDurationYears || '—'}
Renewal Duration (Months):            ${form.renewalDurationMonths || '—'}
Renewal Duration (Days):              ${form.renewalDurationDays || '—'}
First Date to Give Notice (Months Prior): ${form.firstNoticeMonths}
Last Date to Give Notice (Months Prior):  ${form.lastNoticeMonths}`
          : 'N/A'

        const rentReviewDetails = [
          showFixedPct      ? `Fixed %: ${form.fixedPercentage}%` : null,
          showCpiState      ? `CPI State: ${form.cpiState}` : null,
          showAdditionalPct ? `Additional Percentage: ${form.additionalPercentage}%` : null,
          showFixedAmount   ? `Fixed Amount: $${form.fixedAmount}` : null,
        ].filter(Boolean).join('\n') || '—'

        messageBody = `
PHARMACY PROTECT – LEASE DETAILS SUBMISSION
============================================

Trading Name:               ${form.tradingName}
Lessee:                     ${form.lessee}
Lessor:                     ${form.lessor}
Lease Commencement Date:    ${form.leaseCommencementDate}
Lease Expiry Date:          ${form.leaseExpiryDate}

RENEWAL OPTIONS
---------------
Option to Renew:            ${form.hasOptionToRenew}
${renewalSection}

Market Review on Renewal:   ${form.hasMarketReview}

FINANCIAL DETAILS
-----------------
Current Base Rent (ex GST): $${form.currentBaseRent}
Current Outgoings (ex GST): $${form.currentOutgoings}
Current Gross Rent (ex GST):$${form.currentGrossRent}
Tenancy Area (m²):          ${form.tenancyArea} m²

RENT REVIEWS
------------
Annual Rent Reviews Type:   ${form.annualRentReviews}
${rentReviewDetails}

ATTACHED DOCUMENTS
------------------
${files.length ? files.map((f) => `• ${f.name}`).join('\n') : 'No documents attached'}
        `.trim()
      }

      const fd = new FormData()
      fd.append('_subject', subject)
      fd.append('message', messageBody)
      files.forEach((f) => fd.append('attachment', f))

      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || `HTTP ${res.status}`)
      }

      setStatus('success')
      setForm(EMPTY_FORM)
      setFiles([])
      setMode(null)
      setErrors({})
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } catch (err) {
      console.error('Submission error:', err)
      setStatus('error')
      setErrorDetail(err?.message || 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <LighthouseLogo />
        </div>
      </header>

      <main className={styles.main}>
        <div className={styles.card} ref={formRef}>

          {/* ── Card header ── */}
          <div className={styles.cardHeader}>
            <p className={styles.projectTag}>Pharmacy Protect</p>
            <h1 className={styles.title}>Lease Information</h1>
            <p className={styles.subtitle}>
              There are two ways to submit your lease information. Choose the option
              that works best for you below.
            </p>
          </div>

          {/* ── Mode selector ── */}
          <div className={styles.modeSelector}>
            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'form' ? styles.modeBtnActive : ''}`}
              onClick={() => switchMode('form')}
            >
              <span className={styles.modeBtnIcon}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <rect x="3" y="3" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M7 8h8M7 11h8M7 14h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>
              </span>
              <span className={styles.modeBtnLabel}>Fill out the form</span>
              <span className={styles.modeBtnDesc}>Enter lease details field by field</span>
            </button>

            <div className={styles.modeDivider}>
              <span>or</span>
            </div>

            <button
              type="button"
              className={`${styles.modeBtn} ${mode === 'document' ? styles.modeBtnActive : ''}`}
              onClick={() => switchMode('document')}
            >
              <span className={styles.modeBtnIcon}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <path d="M13 2H6a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M13 2v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M11 13v-4M9 11l2-2 2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
              <span className={styles.modeBtnLabel}>Upload lease documents</span>
              <span className={styles.modeBtnDesc}>Drop your lease files and we'll handle the rest</span>
            </button>
          </div>

          {/* ── Banners ── */}
          {status === 'success' && (
            <div className={styles.successBanner}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#00a14b"/>
                <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <strong>Submission received</strong>
                <p>Your lease information has been sent to the Lighthouse Insights team. We'll be in touch shortly.</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className={styles.errorBanner}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="10" fill="#d12333"/>
                <path d="M10 6v5M10 13v1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <div>
                <strong>Submission failed</strong>
                <p>Something went wrong. Please try again or contact us at intelligence@lighthouseinsights.au</p>
                {errorDetail && <p style={{fontSize:11,marginTop:4,color:'#7f1d1d',fontFamily:'monospace'}}>{errorDetail}</p>}
              </div>
            </div>
          )}

          {/* ── Form content (shown only after mode is chosen) ── */}
          {mode && (
            <form onSubmit={handleSubmit} noValidate>

              {/* ── Trading Name (always shown) ── */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {mode === 'document' ? 'Identify Your Tenancy' : 'Tenancy Details'}
                </h2>

                {mode === 'document' && (
                  <p className={styles.sectionDesc}>
                    Your trading name is required so we can match the documents to your account.
                  </p>
                )}

                <div className={styles.grid2}>
                  <Field label="Trading Name" required error={errors.tradingName}>
                    <input
                      name="tradingName"
                      className={`${styles.input} ${errors.tradingName ? styles.inputError : ''}`}
                      type="text"
                      placeholder="e.g. Acme Pty Ltd"
                      value={form.tradingName}
                      onChange={set('tradingName')}
                    />
                  </Field>

                  {/* Lessee + Lessor only in full form mode */}
                  {mode === 'form' && (
                    <>
                      <Field label="Lessee" required error={errors.lessee}>
                        <input
                          name="lessee"
                          className={`${styles.input} ${errors.lessee ? styles.inputError : ''}`}
                          type="text"
                          placeholder="Legal entity name"
                          value={form.lessee}
                          onChange={set('lessee')}
                        />
                      </Field>
                      <Field label="Lessor" required error={errors.lessor}>
                        <input
                          name="lessor"
                          className={`${styles.input} ${errors.lessor ? styles.inputError : ''}`}
                          type="text"
                          placeholder="Landlord / owner name"
                          value={form.lessor}
                          onChange={set('lessor')}
                        />
                      </Field>
                    </>
                  )}
                </div>
              </section>

              {/* ── Full form sections ── */}
              {mode === 'form' && (
                <>
                  {/* Lease Term */}
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Lease Term</h2>
                    <div className={styles.grid2}>
                      <Field label="Lease Commencement Date" required error={errors.leaseCommencementDate}>
                        <input
                          name="leaseCommencementDate"
                          className={`${styles.input} ${errors.leaseCommencementDate ? styles.inputError : ''}`}
                          type="date"
                          value={form.leaseCommencementDate}
                          onChange={set('leaseCommencementDate')}
                        />
                      </Field>
                      <Field label="Lease Expiry Date" required error={errors.leaseExpiryDate}>
                        <input
                          name="leaseExpiryDate"
                          className={`${styles.input} ${errors.leaseExpiryDate ? styles.inputError : ''}`}
                          type="date"
                          value={form.leaseExpiryDate}
                          onChange={set('leaseExpiryDate')}
                        />
                      </Field>
                    </div>
                  </section>

                  {/* Renewal Options */}
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Renewal Options</h2>
                    <div className={styles.grid2}>
                      <Field label="Do you have an option to renew?" required error={errors.hasOptionToRenew}>
                        <select
                          name="hasOptionToRenew"
                          className={`${styles.select} ${errors.hasOptionToRenew ? styles.inputError : ''}`}
                          value={form.hasOptionToRenew}
                          onChange={set('hasOptionToRenew')}
                        >
                          <option value="">Select…</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                      </Field>
                    </div>

                    {showRenewalFields && (
                      <div className={styles.conditionalBlock}>
                        <div className={styles.conditionalLabel}>Renewal Duration</div>
                        <div className={styles.grid3}>
                          <Field label="Duration (Years)" error={errors.renewalDurationYears}>
                            <input
                              name="renewalDurationYears"
                              className={`${styles.input} ${errors.renewalDurationYears ? styles.inputError : ''}`}
                              type="text" inputMode="numeric" placeholder="0"
                              value={form.renewalDurationYears}
                              onChange={setInt('renewalDurationYears')}
                            />
                          </Field>
                          <Field label="Duration (Months)" error={errors.renewalDurationMonths}>
                            <input
                              name="renewalDurationMonths"
                              className={`${styles.input} ${errors.renewalDurationMonths ? styles.inputError : ''}`}
                              type="text" inputMode="numeric" placeholder="0"
                              value={form.renewalDurationMonths}
                              onChange={setInt('renewalDurationMonths')}
                            />
                          </Field>
                          <Field label="Duration (Days)" error={errors.renewalDurationDays}>
                            <input
                              name="renewalDurationDays"
                              className={`${styles.input} ${errors.renewalDurationDays ? styles.inputError : ''}`}
                              type="text" inputMode="numeric" placeholder="0"
                              value={form.renewalDurationDays}
                              onChange={setInt('renewalDurationDays')}
                            />
                          </Field>
                        </div>
                        <div className={styles.grid2} style={{ marginTop: 16 }}>
                          <Field label="First date to give notice (Months Prior)" required error={errors.firstNoticeMonths}>
                            <select
                              name="firstNoticeMonths"
                              className={`${styles.select} ${errors.firstNoticeMonths ? styles.inputError : ''}`}
                              value={form.firstNoticeMonths}
                              onChange={set('firstNoticeMonths')}
                            >
                              <option value="">Select months…</option>
                              {MONTHS_1_12.map((m) => <option key={m}>{m}</option>)}
                            </select>
                          </Field>
                          <Field label="Last date to give notice (Months Prior)" required error={errors.lastNoticeMonths}>
                            <select
                              name="lastNoticeMonths"
                              className={`${styles.select} ${errors.lastNoticeMonths ? styles.inputError : ''}`}
                              value={form.lastNoticeMonths}
                              onChange={set('lastNoticeMonths')}
                            >
                              <option value="">Select months…</option>
                              {MONTHS_1_12.map((m) => <option key={m}>{m}</option>)}
                            </select>
                          </Field>
                        </div>
                      </div>
                    )}

                    <div className={styles.grid2} style={{ marginTop: 16 }}>
                      <Field label="Do you have a market review upon renewals?" required error={errors.hasMarketReview}>
                        <select
                          name="hasMarketReview"
                          className={`${styles.select} ${errors.hasMarketReview ? styles.inputError : ''}`}
                          value={form.hasMarketReview}
                          onChange={set('hasMarketReview')}
                        >
                          <option value="">Select…</option>
                          <option>Yes</option>
                          <option>No</option>
                        </select>
                      </Field>
                    </div>
                  </section>

                  {/* Financial Details */}
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Financial Details</h2>
                    <div className={styles.grid2}>
                      <Field label="Current Base Rent ($ ex GST)" required error={errors.currentBaseRent}>
                        <div className={styles.currencyWrapper}>
                          <span className={styles.currencyPrefix}>$</span>
                          <input
                            name="currentBaseRent"
                            className={`${styles.input} ${styles.currencyInput} ${errors.currentBaseRent ? styles.inputError : ''}`}
                            type="text" inputMode="decimal" placeholder="0.00"
                            value={form.currentBaseRent}
                            onChange={setCurrency('currentBaseRent')}
                          />
                        </div>
                      </Field>
                      <Field label="Current Outgoings ($ ex GST)" required error={errors.currentOutgoings}>
                        <div className={styles.currencyWrapper}>
                          <span className={styles.currencyPrefix}>$</span>
                          <input
                            name="currentOutgoings"
                            className={`${styles.input} ${styles.currencyInput} ${errors.currentOutgoings ? styles.inputError : ''}`}
                            type="text" inputMode="decimal" placeholder="0.00"
                            value={form.currentOutgoings}
                            onChange={setCurrency('currentOutgoings')}
                          />
                        </div>
                      </Field>
                      <Field label="Current Gross (total) Rent ($ ex GST)" required error={errors.currentGrossRent}>
                        <div className={styles.currencyWrapper}>
                          <span className={styles.currencyPrefix}>$</span>
                          <input
                            name="currentGrossRent"
                            className={`${styles.input} ${styles.currencyInput} ${errors.currentGrossRent ? styles.inputError : ''}`}
                            type="text" inputMode="decimal" placeholder="0.00"
                            value={form.currentGrossRent}
                            onChange={setCurrency('currentGrossRent')}
                          />
                        </div>
                      </Field>
                      <Field label="Tenancy Area (m²)" required error={errors.tenancyArea} hint="Enter area in square metres">
                        <div className={styles.currencyWrapper}>
                          <input
                            name="tenancyArea"
                            className={`${styles.input} ${styles.currencyInput} ${errors.tenancyArea ? styles.inputError : ''}`}
                            type="text" inputMode="decimal" placeholder="0.00"
                            value={form.tenancyArea}
                            onChange={setCurrency('tenancyArea')}
                            style={{ paddingLeft: 12 }}
                          />
                          <span className={styles.currencySuffix}>m²</span>
                        </div>
                      </Field>
                    </div>
                  </section>

                  {/* Annual Rent Reviews */}
                  <section className={styles.section}>
                    <h2 className={styles.sectionTitle}>Annual Rent Reviews</h2>
                    <div className={styles.grid2}>
                      <Field label="Annual Rent Reviews" required error={errors.annualRentReviews}>
                        <select
                          name="annualRentReviews"
                          className={`${styles.select} ${errors.annualRentReviews ? styles.inputError : ''}`}
                          value={form.annualRentReviews}
                          onChange={set('annualRentReviews')}
                        >
                          <option value="">Select type…</option>
                          {RENT_REVIEW_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                        </select>
                      </Field>
                    </div>

                    {(showFixedPct || showCpiState || showAdditionalPct || showFixedAmount) && (
                      <div className={styles.conditionalBlock}>
                        <div className={styles.grid2}>
                          {showFixedPct && (
                            <Field label="Fixed % (per annum)" required error={errors.fixedPercentage}>
                              <div className={styles.currencyWrapper}>
                                <input
                                  name="fixedPercentage"
                                  className={`${styles.input} ${styles.currencyInput} ${errors.fixedPercentage ? styles.inputError : ''}`}
                                  type="text" inputMode="decimal" placeholder="0.00"
                                  value={form.fixedPercentage}
                                  onChange={setCurrency('fixedPercentage')}
                                  style={{ paddingLeft: 12 }}
                                />
                                <span className={styles.currencySuffix}>%</span>
                              </div>
                            </Field>
                          )}
                          {showCpiState && (
                            <Field label="CPI (State)" required error={errors.cpiState}>
                              <select
                                name="cpiState"
                                className={`${styles.select} ${errors.cpiState ? styles.inputError : ''}`}
                                value={form.cpiState}
                                onChange={set('cpiState')}
                              >
                                <option value="">Select state…</option>
                                {CPI_STATES.map((s) => <option key={s}>{s}</option>)}
                              </select>
                            </Field>
                          )}
                          {showAdditionalPct && (
                            <Field label="Additional Percentage" required error={errors.additionalPercentage}>
                              <div className={styles.currencyWrapper}>
                                <input
                                  name="additionalPercentage"
                                  className={`${styles.input} ${styles.currencyInput} ${errors.additionalPercentage ? styles.inputError : ''}`}
                                  type="text" inputMode="decimal" placeholder="0.00"
                                  value={form.additionalPercentage}
                                  onChange={setCurrency('additionalPercentage')}
                                  style={{ paddingLeft: 12 }}
                                />
                                <span className={styles.currencySuffix}>%</span>
                              </div>
                            </Field>
                          )}
                          {showFixedAmount && (
                            <Field label="Fixed Amount ($)" required error={errors.fixedAmount}>
                              <div className={styles.currencyWrapper}>
                                <span className={styles.currencyPrefix}>$</span>
                                <input
                                  name="fixedAmount"
                                  className={`${styles.input} ${styles.currencyInput} ${errors.fixedAmount ? styles.inputError : ''}`}
                                  type="text" inputMode="decimal" placeholder="0.00"
                                  value={form.fixedAmount}
                                  onChange={setCurrency('fixedAmount')}
                                />
                              </div>
                            </Field>
                          )}
                        </div>
                      </div>
                    )}
                  </section>
                </>
              )}

              {/* ── Document upload (shown in both modes) ── */}
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                  {mode === 'document' ? 'Upload Lease Documents' : 'Lease Documents (Optional)'}
                </h2>
                <p className={styles.sectionDesc}>
                  {mode === 'document'
                    ? 'Upload your lease documents below. We accept PDF, Word, JPG, and PNG files.'
                    : 'Optionally attach your lease documents alongside the form data.'}
                </p>

                <div
                  className={`${styles.dropZone} ${dragOver ? styles.dropZoneActive : ''} ${errors.files ? styles.dropZoneError : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
                  aria-label="Upload lease documents"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    multiple
                    className={styles.hiddenInput}
                    onChange={(e) => { addFiles(e.target.files); if (errors.files) setErrors((p) => ({ ...p, files: undefined })) }}
                  />
                  <div className={styles.dropIcon}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                      <rect width="40" height="40" rx="8" fill="#e8f0fb"/>
                      <path d="M20 26V14M14 20l6-6 6 6" stroke="#005aa9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M13 30h14" stroke="#005aa9" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <p className={styles.dropText}><strong>Add lease documents</strong></p>
                  <p className={styles.dropSubtext}>Drag & drop files here, or click to browse</p>
                  <p className={styles.dropTypes}>PDF · DOC · DOCX · JPG · PNG</p>
                </div>
                {errors.files && <p className={styles.errorMsg} style={{ marginTop: 8 }}>{errors.files}</p>}

                {files.length > 0 && (
                  <ul className={styles.fileList}>
                    {files.map((f) => (
                      <li key={f.name} className={styles.fileItem}>
                        <span className={styles.fileIcon}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M9 1H4a1 1 0 00-1 1v12a1 1 0 001 1h8a1 1 0 001-1V6L9 1z" stroke="#005aa9" strokeWidth="1.2" strokeLinejoin="round"/>
                            <path d="M9 1v5h5" stroke="#005aa9" strokeWidth="1.2" strokeLinejoin="round"/>
                          </svg>
                        </span>
                        <span className={styles.fileName}>{f.name}</span>
                        <span className={styles.fileSize}>
                          {f.size < 1024 * 1024
                            ? `${(f.size / 1024).toFixed(0)} KB`
                            : `${(f.size / (1024 * 1024)).toFixed(1)} MB`}
                        </span>
                        <button
                          type="button"
                          className={styles.removeFile}
                          onClick={() => removeFile(f.name)}
                          aria-label={`Remove ${f.name}`}
                        >×</button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              {/* ── Submit ── */}
              <div className={styles.submitRow}>
                <p className={styles.privacyNote}>
                  Your information is transmitted securely to the Lighthouse Insights team at{' '}
                  <a href="mailto:intelligence@lighthouseinsights.au" className={styles.emailLink}>
                    intelligence@lighthouseinsights.au
                  </a>
                  . It will not be shared with third parties.
                </p>
                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                  {submitting ? (
                    <><span className={styles.spinner} /> Sending…</>
                  ) : mode === 'document' ? (
                    'Submit Documents'
                  ) : (
                    'Submit Lease Information'
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </main>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Lighthouse Insights. All rights reserved.</p>
      </footer>
    </div>
  )
}
