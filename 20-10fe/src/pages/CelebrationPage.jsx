import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { generateFamilyGreeting } from '../api/familyApi'
import FamilyFeedback from '../components/FamilyFeedback'
import MotherMemories from '../components/MotherMemories'
import Petals from '../components/paper/Petals'
import Stamp from '../components/paper/Stamp'
import { familyAssets } from '../lib/familyAssets'
import { getFamilyGreeting } from '../lib/familyGreetings'
import '../styles/celebration.css'
import '../styles/family.css'

export default function CelebrationPage() {
  const { name: routeName = '' } = useParams()
  const name = routeName.normalize('NFC').trim().slice(0, 100)
  const [response, setResponse] = useState(null)
  const fallback = getFamilyGreeting(name)
  const result = response?.name === name ? response.data : fallback
  useEffect(() => {
    window.scrollTo(0, 0)
    let cancelled = false
    generateFamilyGreeting(name).then(data => {
      if (!cancelled) setResponse({ name, data })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [name])
  return <main className={`celebrate family-letter page-paper${result.special ? ' family-letter--mother' : ''}`}>
    <Petals count={result.special ? 7 : 3} />
    <article className="postcard family-postcard">
      <span className="tape tape--center" aria-hidden="true" />
      <div className="letter-florals" aria-hidden="true">
        {familyAssets.letterFlowers.map((url, index) => <img key={url} className={`letter-floral letter-floral--${index + 1}`} src={url} alt="" draggable="false" decoding="async" />)}
      </div>
      <div className="letter-content">
      <header className="postcard__head">
        <div><p className="postcard__label">{result.title}</p><h1 className="postcard__name">{result.recipient}</h1></div>
        <Stamp inline rotate={5} />
      </header>
      {result.special && <p className="family-mother-note">Có một nơi luôn là nhà. Có một người luôn là mẹ.</p>}
      {result.special ? <MotherMemories greeting={result.greeting} /> : <div className="family-letter__body">{result.greeting.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>}
      <FamilyFeedback key={name} name={name} recipient={result.recipient} />
      <footer className="postcard__foot"><span className="postcard__sign">— {result.signature}</span><Link className="btn-ink" to="/">Quay lại</Link></footer>
      </div>
    </article>
  </main>
}
