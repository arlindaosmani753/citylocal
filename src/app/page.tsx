import Link from 'next/link'
import { Search, Map, Users } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between h-14">
          <span className="text-sm font-bold tracking-widest text-gray-900">
            CITYLOCAL
          </span>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Join free
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-gray-100 py-20 text-center">
          <div className="max-w-4xl mx-auto px-6">
            <span className="inline-block bg-indigo-50 text-indigo-600 text-xs font-semibold tracking-widest px-4 py-1.5 rounded-full mb-6">
              LOCAL KNOWLEDGE, SHARED
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-4">
              Your city,<br />from the inside
            </h1>
            <p className="text-base text-gray-500 max-w-md mx-auto mb-8 leading-relaxed">
              Places, events and reviews from locals who actually live there — not tourists, not algorithms.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/register"
                className="text-sm font-semibold bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create free account
              </Link>
              <Link
                href="/login"
                className="text-sm text-gray-600 border border-gray-200 px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400">No credit card · Free forever</p>
          </div>
        </section>

        {/* How it Works */}
        <section className="bg-gray-50 py-16">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-10">
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">
                How it works
              </p>
              <h2 className="text-2xl font-bold text-gray-900">
                Three steps to your city
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                {
                  icon: Search,
                  step: '1',
                  heading: 'Search a city',
                  body: 'Find your city or discover somewhere new',
                },
                {
                  icon: Map,
                  step: '2',
                  heading: 'Browse the feed',
                  body: 'Places, events and local reviews — on a map',
                },
                {
                  icon: Users,
                  step: '3',
                  heading: 'Join & contribute',
                  body: 'Add your own picks and help your community',
                },
              ].map(({ icon: Icon, step, heading, body }) => (
                <div
                  key={step}
                  className="bg-white border border-gray-200 rounded-xl p-6 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{heading}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4">
        <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
          <span className="text-xs font-bold tracking-widest text-gray-300">CITYLOCAL</span>
          <span className="text-xs text-gray-300">© 2026</span>
        </div>
      </footer>

    </div>
  )
}
