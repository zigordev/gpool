import { NavigationBar } from '@/components/NavigationBar'
import { RUMProvider } from '@/components/RUMProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { I18nProvider } from '@/i18n/client'
import { getLocale, getMessages, getTranslator } from '@/i18n/server'
import type { Metadata } from 'next'
import { Inter, Bricolage_Grotesque } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  weight: ['500', '600', '700', '800'],
})

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslator()

  return {
    title: t('layout.metadata.title'),
    description: t('layout.metadata.description'),
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages(locale)

  return (
    <html lang={locale} className={`${inter.variable} ${display.variable}`}>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          <AuthProvider>
            <RUMProvider>
              <NavigationBar />
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgb(var(--bg-elevated))',
                    color: 'rgb(var(--fg))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-md)',
                    fontWeight: 500,
                  },
                  success: {
                    iconTheme: {
                      primary: 'rgb(var(--pitch))',
                      secondary: 'white',
                    },
                    style: {
                      background: 'rgb(var(--pitch) / 0.08)',
                      color: 'rgb(var(--pitch))',
                      border: '1px solid rgb(var(--pitch) / 0.30)',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'rgb(var(--live))',
                      secondary: 'white',
                    },
                    style: {
                      background: 'rgb(var(--live) / 0.08)',
                      color: 'rgb(var(--live))',
                      border: '1px solid rgb(var(--live) / 0.30)',
                    },
                  },
                }}
              />
            </RUMProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
