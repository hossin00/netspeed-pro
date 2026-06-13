import { useState, useEffect, useRef } from 'react'
import { Wifi, Activity, Globe, RefreshCw, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'

const ACCENT = '#06b6d4'

interface PingResult { url: string; ms: number | null; ok: boolean }
interface SpeedSample { time: string; download: number }

export default function App() {
  const [tab, setTab] = useState<'speed' | 'ping' | 'info'>('speed')
  const [testing, setTesting] = useState(false)
  const [downloadMbps, setDownloadMbps] = useState<number | null>(null)
  const [pingMs, setPingMs] = useState<number | null>(null)
  const [progress, setProgress] = useState(0)
  const [history, setHistory] = useState<SpeedSample[]>([])
  const [pingUrls, setPingUrls] = useState('google.com\ncloudflare.com\ngithub.com')
  const [pingResults, setPingResults] = useState<PingResult[]>([])
  const [pinging, setPinging] = useState(false)
  const [netInfo, setNetInfo] = useState<Record<string, string>>({})

  useEffect(() => {
    const saved = localStorage.getItem('ns_history')
    if (saved) setHistory(JSON.parse(saved))
    collectNetInfo()
  }, [])

  function collectNetInfo() {
    const info: Record<string, string> = {}
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    if (conn) {
      if (conn.effectiveType) info['Connection Type'] = conn.effectiveType.toUpperCase()
      if (conn.downlink) info['Downlink'] = conn.downlink + ' Mbps'
      if (conn.rtt) info['RTT'] = conn.rtt + ' ms'
      if (conn.saveData !== undefined) info['Data Saver'] = conn.saveData ? 'Enabled' : 'Disabled'
    }
    info['Online Status'] = navigator.onLine ? 'Online' : 'Offline'
    if (navigator.userAgent) {
      const ua = navigator.userAgent
      if (ua.includes('Windows')) info['Platform'] = 'Windows'
      else if (ua.includes('Mac')) info['Platform'] = 'macOS'
      else if (ua.includes('Linux')) info['Platform'] = 'Linux'
      else info['Platform'] = 'Unknown'
    }
    info['Language'] = navigator.language || 'Unknown'
    info['Cookies Enabled'] = navigator.cookieEnabled ? 'Yes' : 'No'
    info['Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone
    info['Screen'] = window.screen.width + '×' + window.screen.height
    setNetInfo(info)
  }

  async function runSpeedTest() {
    setTesting(true)
    setProgress(0)
    setDownloadMbps(null)
    setPingMs(null)

    try {
      // Ping test
      const pingStart = performance.now()
      await fetch('https://www.cloudflare.com/cdn-cgi/trace', { cache: 'no-store', mode: 'no-cors' }).catch(() => {})
      const pingEnd = performance.now()
      const ping = Math.round(pingEnd - pingStart)
      setPingMs(ping)
      setProgress(30)

      // Download test using a known file
      const sizes = [500000, 1000000]
      const speeds: number[] = []
      for (let i = 0; i < sizes.length; i++) {
        const start = performance.now()
        try {
          const res = await fetch('https://speed.cloudflare.com/__down?bytes=' + sizes[i], { cache: 'no-store' })
          const blob = await res.blob()
          const end = performance.now()
          const durationS = (end - start) / 1000
          const mbps = (blob.size * 8) / (durationS * 1000000)
          speeds.push(mbps)
        } catch {
          speeds.push(0)
        }
        setProgress(30 + 35 * (i + 1))
      }

      const avgSpeed = speeds.filter(s => s > 0).reduce((a, b) => a + b, 0) / speeds.filter(s => s > 0).length || 0
      setDownloadMbps(Math.round(avgSpeed * 10) / 10)
      setProgress(100)

      const sample: SpeedSample = { time: new Date().toLocaleTimeString(), download: Math.round(avgSpeed * 10) / 10 }
      const newHistory = [sample, ...history].slice(0, 20)
      setHistory(newHistory)
      localStorage.setItem('ns_history', JSON.stringify(newHistory))
    } catch {
      setDownloadMbps(0)
    }
    setTesting(false)
  }

  async function runPing() {
    setPinging(true)
    setPingResults([])
    const urls = pingUrls.split('\n').map(u => u.trim()).filter(Boolean).slice(0, 8)
    const results: PingResult[] = []
    for (const url of urls) {
      try {
        const start = performance.now()
        await fetch('https://' + url + '/favicon.ico', { mode: 'no-cors', cache: 'no-store' }).catch(() => {})
        const end = performance.now()
        results.push({ url, ms: Math.round(end - start), ok: true })
      } catch {
        results.push({ url, ms: null, ok: false })
      }
      setPingResults([...results])
    }
    setPinging(false)
  }

  function getSpeedColor(mbps: number) {
    if (mbps >= 50) return '#22c55e'
    if (mbps >= 10) return ACCENT
    if (mbps >= 1) return '#f59e0b'
    return '#ef4444'
  }

  function getSpeedLabel(mbps: number) {
    if (mbps >= 100) return 'Excellent'
    if (mbps >= 50) return 'Very Good'
    if (mbps >= 10) return 'Good'
    if (mbps >= 1) return 'Fair'
    return 'Slow'
  }

  return (
    <div style={{ background: '#030712', minHeight: '100vh', fontFamily: 'Inter,sans-serif', color: '#fff' }}>
      <div style={{ background: '#0c1929', padding: '1.2rem 1.5rem', borderBottom: '1px solid #1e3a5f' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Wifi size={24} style={{ color: ACCENT }} />
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>NetSpeed Pro</h1>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {(['speed', 'ping', 'info'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, background: tab === t ? ACCENT : '#0c1929', border: 'none', borderRadius: 10, padding: '0.6rem', color: tab === t ? '#000' : '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize' }}>{t === 'speed' ? '⚡ Speed' : t === 'ping' ? '🏓 Ping' : '📡 Network'}</button>
          ))}
        </div>

        {tab === 'speed' && (
          <div>
            <div style={{ background: '#0c1929', borderRadius: 24, padding: '2.5rem', textAlign: 'center', marginBottom: 20, border: '1px solid #1e3a5f' }}>
              {testing ? (
                <div>
                  <div style={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid #1e3a5f', borderTop: '4px solid ' + ACCENT, animation: 'spin 1s linear infinite', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: ACCENT }}>{progress}%</span>
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
                  <p style={{ color: '#64748b' }}>Testing your connection...</p>
                </div>
              ) : downloadMbps !== null ? (
                <div>
                  <div style={{ fontSize: 64, fontWeight: 900, color: getSpeedColor(downloadMbps), lineHeight: 1 }}>{downloadMbps}</div>
                  <div style={{ color: '#64748b', fontSize: 18, marginBottom: 8 }}>Mbps</div>
                  <div style={{ color: getSpeedColor(downloadMbps), fontSize: 14, fontWeight: 600, marginBottom: 16 }}>{getSpeedLabel(downloadMbps)}</div>
                  {pingMs !== null && <div style={{ color: '#94a3b8', fontSize: 14 }}>Latency: <strong style={{ color: '#fff' }}>{pingMs}ms</strong></div>}
                </div>
              ) : (
                <div>
                  <Activity size={60} style={{ color: '#1e3a5f', marginBottom: 16 }} />
                  <p style={{ color: '#64748b', fontSize: 16 }}>Ready to test your connection</p>
                </div>
              )}
            </div>
            <button onClick={runSpeedTest} disabled={testing} style={{ width: '100%', background: testing ? '#1e3a5f' : ACCENT, border: 'none', borderRadius: 14, padding: '1rem', color: testing ? '#64748b' : '#000', fontSize: 16, fontWeight: 800, cursor: testing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <RefreshCw size={18} style={{ animation: testing ? 'spin 1s linear infinite' : 'none' }} /> {testing ? 'Testing...' : 'Run Speed Test'}
            </button>

            {history.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 14, color: '#64748b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><TrendingUp size={14} /> History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {history.slice(0, 8).map((h, i) => (
                    <div key={i} style={{ background: '#0c1929', borderRadius: 10, padding: '0.7rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1e3a5f' }}>
                      <span style={{ color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={12} /> {h.time}</span>
                      <span style={{ color: getSpeedColor(h.download), fontWeight: 700, fontSize: 14 }}>{h.download} Mbps</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'ping' && (
          <div>
            <div style={{ background: '#0c1929', borderRadius: 16, padding: '1.2rem', marginBottom: 16, border: '1px solid #1e3a5f' }}>
              <label style={{ color: '#94a3b8', fontSize: 13, display: 'block', marginBottom: 8 }}>Hosts to ping (one per line)</label>
              <textarea value={pingUrls} onChange={e => setPingUrls(e.target.value)} rows={5} style={{ width: '100%', background: '#030712', border: '1px solid #1e3a5f', borderRadius: 8, padding: '0.7rem', color: '#fff', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'monospace' }} />
            </div>
            <button onClick={runPing} disabled={pinging} style={{ width: '100%', background: pinging ? '#1e3a5f' : ACCENT, border: 'none', borderRadius: 12, padding: '0.8rem', color: pinging ? '#64748b' : '#000', fontSize: 15, fontWeight: 700, cursor: pinging ? 'not-allowed' : 'pointer', marginBottom: 16 }}>{pinging ? 'Pinging...' : 'Run Ping Test'}</button>
            {pingResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pingResults.map((r, i) => (
                  <div key={i} style={{ background: '#0c1929', borderRadius: 12, padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #1e3a5f' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {r.ok ? <CheckCircle size={16} style={{ color: '#22c55e' }} /> : <XCircle size={16} style={{ color: '#ef4444' }} />}
                      <span style={{ color: '#e2e8f0', fontSize: 14, fontFamily: 'monospace' }}>{r.url}</span>
                    </div>
                    <span style={{ color: r.ok ? (r.ms! < 100 ? '#22c55e' : r.ms! < 300 ? '#f59e0b' : '#ef4444') : '#ef4444', fontWeight: 700, fontSize: 14 }}>{r.ok ? r.ms + 'ms' : 'Failed'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'info' && (
          <div>
            <div style={{ background: '#0c1929', borderRadius: 16, padding: '1.2rem', border: '1px solid #1e3a5f', marginBottom: 12 }}>
              <h3 style={{ fontSize: 14, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}><Globe size={14} /> Network Information</h3>
              {Object.entries(netInfo).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #1e3a5f' }}>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{k}</span>
                  <span style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 600 }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={collectNetInfo} style={{ background: '#1e3a5f', border: 'none', borderRadius: 10, padding: '0.6rem 1.2rem', color: ACCENT, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}><RefreshCw size={14} /> Refresh Info</button>
          </div>
        )}
      </div>
    </div>
  )
}
