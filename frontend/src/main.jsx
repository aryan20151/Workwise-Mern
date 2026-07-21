import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const isValidKey = PUBLISHABLE_KEY && PUBLISHABLE_KEY !== 'pk_test_placeholder' && PUBLISHABLE_KEY.length > 20;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isValidKey ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
