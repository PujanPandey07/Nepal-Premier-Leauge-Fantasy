import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

export default function NewsDetail() {
  const { newsId } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    setError(null)

    axiosInstance
      .get(`/api/news/${newsId}/`)
      .then((res) => {
        if (!isMounted) return
        setItem(res.data)
      })
      .catch((err) => {
        if (!isMounted) return
        console.error('Error fetching news detail:', err)
        setError('Could not load this article. It may have been removed or is temporarily unavailable.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [newsId])

  const formattedDate = item?.published_at
    ? new Date(item.published_at).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <div className="mb-4 h-4 w-28 animate-pulse rounded bg-gray-200" />
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
            <div className="h-72 w-full animate-pulse bg-gray-200" />
            <div className="space-y-4 p-6 md:p-8">
              <div className="h-3 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="space-y-2 pt-4">
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <Link to="/news" className="text-sm font-medium text-purple-900 hover:underline">
            ← Back to news
          </Link>
          <div className="mt-6 rounded-3xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <p className="text-base font-semibold text-red-600">{error || 'Article not found.'}</p>
            <p className="mt-2 text-xs text-gray-500">
              Please check the article link or return to the main news feed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <div className="mb-4">
          <Link to="/news" className="text-sm font-medium text-purple-900 hover:underline">
            ← Back to news
          </Link>
        </div>

        <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          {item.image_url && !imageError && (
            <div className="relative h-72 w-full overflow-hidden bg-gray-100">
              <img
                src={item.image_url}
                alt={item.title || 'News article header'}
                onError={() => setImageError(true)}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.28em] text-purple-900">
                {item.source_name || 'News Update'}
              </span>
              {formattedDate && (
                <span className="text-xs text-gray-400 tabular-nums">
                  {formattedDate}
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-black text-gray-900 md:text-3xl leading-tight">
              {item.title}
            </h1>

            <div className="mt-6 border-t border-gray-100 pt-6">
              <p className="whitespace-pre-line text-base leading-relaxed text-gray-700">
                {item.summary || item.content || 'No content available for this article.'}
              </p>
            </div>

            {item.source_url && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
                >
                  Read original source
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}