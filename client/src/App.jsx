import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import Session from './pages/Session'

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/session/:password" element={<Session />} />
      </Routes>
    </BrowserRouter>
  )
}
