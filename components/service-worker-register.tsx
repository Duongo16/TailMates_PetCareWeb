'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Only register in production
            if (process.env.NODE_ENV === 'production') {
                window.addEventListener('load', () => {
                    navigator.serviceWorker
                        .register('/sw.js')
                        .then((registration) => {
                            console.log('SW registered: ', registration)
                        })
                        .catch((registrationError) => {
                            console.log('SW registration failed: ', registrationError)
                        })
                })
            }
        }
    }, [])

    return null
}
