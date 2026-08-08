import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Session from './pages/Session'
import About from './pages/About'
import Developer from './pages/Developer'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/session/:sessionId" element={<Session />} />
        <Route path="/about" element={<About />} />
        <Route path="/developer" element={<Developer />} />
      </Routes>
    </BrowserRouter>
  )
}
