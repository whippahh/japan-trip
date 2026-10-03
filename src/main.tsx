import React from 'react'
import { createRoot } from 'react-dom/client'
import { installDragScroll } from './lib/dragscroll'
installDragScroll()
import { DataProvider } from './lib/data'
import App from './App'
import './styles.css'
import './simple.css'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </React.StrictMode>,
)
