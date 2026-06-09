import logo from './assets/Lighthouse assets/logos/jpg/Lighthouse_logo_descriptive_wide.jpg'

export default function LighthouseLogo() {
  return (
    <img
      src={logo}
      alt="Lighthouse Commercial Property Insights"
      height="48"
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
