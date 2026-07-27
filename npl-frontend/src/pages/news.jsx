import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

export default function NewsPage() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axiosInstance.get('/api/news/?ordering=-published_at&page_size=20')
      .then(res => setNews(res.data.results || res.data))
      .catch(() => setError('Could not load news.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">Latest from the tournament</p>
            <h1 className="mt-2 text-3xl font-black text-gray-900">News</h1>
          </div>
        </div>

        {loading && <p className="text-gray-600">Loading news...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {news.map(item => (
              <Link
                key={item.id}
                to={`/news/${item.id}`}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                {item.image_url && <img src={item.image_url} alt={item.title} className="h-44 w-full object-cover" />}
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">{item.source_name}</p>
                  <h2 className="mt-2 text-lg font-bold text-gray-900">{item.title}</h2>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-4">{item.summary}</p>
                  <p className="mt-4 text-xs text-purple-900 font-semibold">Read details →</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}