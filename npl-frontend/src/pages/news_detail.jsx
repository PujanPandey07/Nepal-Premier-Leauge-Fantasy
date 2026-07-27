import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Navbar from '../components/navbar'
import axiosInstance from '../utilis/axiosInstance'

export default function NewsDetail() {
  const { newsId } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axiosInstance.get(`/api/news/${newsId}/`)
      .then(res => setItem(res.data))
      .catch(() => setError('Could not load this article.'))
      .finally(() => setLoading(false))
  }, [newsId])

  if (loading) {
    return <div className="min-h-screen bg-slate-50"><Navbar /><div className="p-8">Loading...</div></div>
  }

  if (error || !item) {
    return <div className="min-h-screen bg-slate-50"><Navbar /><div className="p-8 text-red-600">{error || 'Article not found.'}</div></div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <Link to="/news" className="text-sm font-medium text-purple-900 hover:underline">← Back to news</Link>
        <article className="mt-4 overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-gray-100">
          {item.image_url && <img src={item.image_url} alt={item.title} className="h-72 w-full object-cover" />}
          <div className="p-6 md:p-8">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-500">{item.source_name}</p>
            <h1 className="mt-3 text-3xl font-black text-gray-900">{item.title}</h1>
            <p className="mt-2 text-sm text-gray-500">{new Date(item.published_at).toLocaleString()}</p>
            <p className="mt-6 whitespace-pre-line text-base leading-7 text-gray-700">{item.summary}</p>
            <a href={item.source_url} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
              Read original source
            </a>
          </div>
        </article>
      </div>
    </div>
  )
}