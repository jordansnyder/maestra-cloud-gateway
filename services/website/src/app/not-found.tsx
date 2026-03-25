import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-7xl font-bold text-zinc-800">404</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">
            Lost in the installation?
          </h1>
          <p className="mt-4 text-zinc-400 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist. It may have been moved or the URL might be incorrect.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-medium rounded-lg px-6 py-3 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
