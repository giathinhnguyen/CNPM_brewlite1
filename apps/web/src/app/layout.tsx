import type { Metadata } from 'next';
import { Suspense } from 'react';
import Providers from './providers';
import '../index.css';
export const metadata: Metadata = { title: 'BrewLite', description: 'Đặt đồ uống BrewLite', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="vi"><body><Suspense fallback={<p role="status" className="p-12 text-center">Đang tải BrewLite...</p>}><Providers>{children}</Providers></Suspense></body></html>;
}
