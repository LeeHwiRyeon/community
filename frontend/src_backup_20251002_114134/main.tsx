import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as ReduxProvider } from 'react-redux'
import App from './App'
import './index.css'
import store from './store'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <ChakraProvider resetCSS={false}>
          <App />
        </ChakraProvider>
      </QueryClientProvider>
    </ReduxProvider>
  </React.StrictMode>,
)
