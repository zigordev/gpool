import { AppNav } from '@/components/AppNav'
import { PoolsProvider } from '@/contexts/PoolsContext'
import { RumProvider } from '@/observability/RumProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import { I18nProvider } from '@/i18n/client'
import { getLocale, getMessages, getTranslator } from '@/i18n/server'
import type { Metadata } from 'next'
import { Inter, Bricolage_Grotesque } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import 'flag-icons/css/flag-icons.min.css'
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
}: Readonly<{
  children: React.ReactNode
}>) {
  const locale = await getLocale()
  const messages = await getMessages(locale)

  return (
    <html lang={locale} data-theme="gpool" className={`${inter.variable} ${display.variable}`}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('gpool-theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-mode','dark');}}catch(e){}` }} />
        <I18nProvider locale={locale} messages={messages}>
          <AuthProvider>
            <RumProvider />
              <main
                style={{
                  position: 'relative',
                  minHeight: 'calc(100vh - 4rem)',
                  background: 'rgb(var(--bg))',
                }}
              >
                <div
                  aria-hidden
                  className="bg-mesh"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                  }}
                />

                  <PoolsProvider>
                    <AppNav>{children}</AppNav>
                  </PoolsProvider>
              </main>
              <Toaster
                position="top-right"
                containerStyle={{ zIndex: 99999 }}
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: 'rgb(var(--bg-elevated))',
                    color: 'rgb(var(--fg))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 8px 24px rgb(0 0 0 / 0.25)',
                    fontWeight: 500,
                    opacity: 1,
                  },
                  success: {
                    iconTheme: {
                      primary: 'rgb(var(--pitch))',
                      secondary: 'white',
                    },
                    style: {
                      background: 'color-mix(in srgb, rgb(var(--pitch)) 14%, rgb(var(--bg-elevated)))',
                      color: 'rgb(var(--pitch))',
                      border: '1px solid rgb(var(--pitch) / 0.40)',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: 'rgb(var(--live))',
                      secondary: 'white',
                    },
                    style: {
                      background: 'color-mix(in srgb, rgb(var(--live)) 14%, rgb(var(--bg-elevated)))',
                      color: 'rgb(var(--live))',
                      border: '1px solid rgb(var(--live) / 0.40)',
                    },
                  },
                }}
              />
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
