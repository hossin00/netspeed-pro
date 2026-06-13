import { useState } from 'react'
import SplashScreen from './components/SplashScreen'
import Onboarding from './components/Onboarding'
import App from './App'

const DONE_KEY = 'netspeed-pro_onboarded_v1'
type Phase = 'splash' | 'onboard' | 'app'

export default function AppWrapper() {
  const [phase, setPhase] = useState<Phase>('splash')
  const features = ["Real-time speed display", "Connection history", "Ping and latency test", "Network diagnostics"]
  return (
    <>
      {phase === 'splash' && <SplashScreen onDone={()=>setPhase(localStorage.getItem(DONE_KEY)?'app':'onboard')} color1="#06b6d4" color2="#0891b2" emoji="📡" name="NetSpeed Pro" tagline="Network speed and connectivity tools"/>}
      {phase === 'onboard' && <Onboarding onDone={()=>{localStorage.setItem(DONE_KEY,'1');setPhase('app')}} color1="#06b6d4" emoji="📡" name="NetSpeed Pro" features={features}/>}
      {phase === 'app' && <App/>}
    </>
  )
}