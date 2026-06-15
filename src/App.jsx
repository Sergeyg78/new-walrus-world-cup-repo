import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { Toaster } from 'react-hot-toast'
import { useState } from 'react'
import { ConnectScreen } from './pages/ConnectScreen'
import { Dashboard }     from './pages/Dashboard'
import '@mysten/dapp-kit/dist/index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 30_000 },
  },
})

const networks = {
  mainnet: { url: 'https://fullnode.mainnet.sui.io:443' },
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networks} defaultNetwork="mainnet">
        <WalletProvider autoConnect>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 5000,
              style: {
                background: '#0d1b2a',
                color:      '#e8eaf6',
                border:     '1px solid rgba(255,255,255,0.1)',
                fontFamily: 'Inter, sans-serif',
                fontSize:   '0.875rem',
              },
              success: {
                iconTheme: { primary: '#69f0ae', secondary: '#0d1b2a' },
              },
              error: {
                iconTheme: { primary: '#ff5252', secondary: '#0d1b2a' },
              },
            }}
          />
          <Main />
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}

function Main() {
  const [appState,  setAppState]  = useState(null)
  const [blobChain, setBlobChain] = useState([])

  if (!appState) {
    return (
      <ConnectScreen
        setAppState={setAppState}
        setBlobChain={setBlobChain}
      />
    )
  }

  return (
    <Dashboard
      appState={appState}
      setAppState={setAppState}
      blobChain={blobChain}
      setBlobChain={setBlobChain}
    />
  )
}