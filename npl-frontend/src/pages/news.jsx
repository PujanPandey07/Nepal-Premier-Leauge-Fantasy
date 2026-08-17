import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axiosInstance
      .get('/api/news/?ordering=-published_at&page_size=20')
      .then((res) => setNews(res.data.results || res.data))
      .catch(() => setError('Could not load news articles at this time.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-purple-600">
            Latest from the tournament
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            News & Updates
          </h1>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 text-xs sm:text-sm font-medium text-red-600 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-red-700 underline text-xs font-bold hover:text-red-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeleton Grid */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs animate-pulse flex flex-col"
              >
                <div className="h-44 w-full bg-slate-200" />
                <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-20 bg-slate-200 rounded" />
                    <div className="h-5 w-full bg-slate-200 rounded" />
                    <div className="h-3 w-4/5 bg-slate-200 rounded" />
                  </div>
                  <div className="h-3 w-24 bg-slate-100 rounded pt-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && news.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 sm:p-12 text-center shadow-xs">
            <p className="text-sm sm:text-base font-bold text-slate-800">No news articles found.</p>
            <p className="mt-1 text-xs text-slate-400">Check back later for match updates and tournament coverage.</p>
          </div>
        )}

        {/* News Grid */}
        {!loading && !error && news.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {news.map((item) => (
              <Link
                key={item.id}
                to={`/news/${item.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-purple-300 hover:shadow-md"
              >
                {/* Image Container with Fallback */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-100 shrink-0">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        if (e.target.nextSibling) {
                          e.target.nextSibling.style.display = 'flex'
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className={`${
                      item.image_url ? 'hidden' : 'flex'
                    } h-full w-full items-center justify-center bg-slate-900 text-slate-400 font-bold text-xs uppercase tracking-wider`}
                  >
                    📰 NPL News
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <span className="text-purple-600 truncate">{item.source_name || 'Official'}</span>
                      {item.published_at && (
                        <span className="shrink-0 text-gray-400 font-normal">
                          {new Date(item.published_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <h2 className="mt-2 text-base sm:text-lg font-bold text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2 leading-snug">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-3 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  {/* Read More Link */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-purple-700 group-hover:text-purple-800">
                    <span>Read details</span>
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}