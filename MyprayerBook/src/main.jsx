import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import LandingPage from './LandingPage.jsx'

function Root() {
  const [showApp, setShowApp] = useState(() => {
    return localStorage.getItem('mpb_visited') === 'true'
  })

  const handleEnter = () => {
    localStorage.setItem('mpb_visited', 'true')
    setShowApp(true)
  }

  return showApp ? <App /> : <LandingPage onEnter={handleEnter} />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)
