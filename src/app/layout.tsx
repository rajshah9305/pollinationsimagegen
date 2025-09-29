import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RAJ AI Image Studio Pro',
  description: 'Create stunning images with advanced AI models. Free, open-source, and no API key required.',
  keywords: 'AI, image generation, RAJ AI, pollinations, stable diffusion, flux, turbo, kontext, artificial intelligence',
  authors: [{ name: 'RAJ Shah' }],
  openGraph: {
    title: 'RAJ AI Image Studio Pro',
    description: 'Professional AI-powered image creation with multiple models and styles',
    type: 'website',
    url: 'https://pollinationsimagegenerator-jsacelehq.vercel.app',
    images: [
      {
        url: 'https://pollinations.ai/api/logo',
        width: 1200,
        height: 630,
        alt: 'RAJ AI Image Generator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAJ AI Image Generator',
    description: 'Professional AI-powered image creation',
    images: ['https://pollinations.ai/api/logo'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
