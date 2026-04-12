import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kloze',
  description: 'Le CRM haute performance pour Closers',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  )
}
