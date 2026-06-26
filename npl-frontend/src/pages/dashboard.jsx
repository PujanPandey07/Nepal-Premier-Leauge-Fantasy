import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/navbar'

function Dashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) navigate('/')
  }, [])

  const cards = [
    { title: 'Browse Players', desc: 'View all players, search and filter by role, price, and more.', to: '/players', color: 'bg-blue-600' },
    { title: 'Build Your Team', desc: 'Pick your squad, set captain/vice-captain, manage your budget.', to: '/build-team', color: 'bg-green-600' },
    { title: 'View Saved Team', desc: 'See your locked-in squad and live points once the match starts.', to: '/view-team', color: 'bg-purple-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
        <p className="text-gray-600 mb-8">What would you like to do?</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map(card => (
            <Link
              key={card.to}
              to={card.to}
              className="block rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className={`${card.color} h-2`} />
              <div className="bg-white p-6">
                <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
                <p className="text-gray-600 text-sm">{card.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard