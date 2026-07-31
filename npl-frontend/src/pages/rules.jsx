// pages/rules.jsx
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'

const BRAND = '#38003c'

function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-bold mb-4" style={{ color: BRAND }}>{title}</h2>
      {children}
    </div>
  )
}

function RuleRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  )
}

export default function Rules() {
  return (
    <div className="min-h-screen bg-[#f4f6fb]">
      <Navbar />

      <div
        className="px-8 py-14 text-white"
        style={{ background: `linear-gradient(135deg, ${BRAND}, #1a0020)` }}
      >
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
            NPL Fantasy Cricket
          </p>
          <h1 className="text-3xl md:text-4xl font-black mt-2">How to Play</h1>
          <p className="text-white/70 mt-3 max-w-xl">
            Everything you need to know — building your squad, scoring points, and competing in leagues.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10">

        <SectionCard title="1. Getting Started">
          <ol className="space-y-3 text-sm text-gray-700 list-decimal list-inside">
            <li>Set your fantasy team name once in <Link to="/settings" className="underline font-medium" style={{ color: BRAND }}>Settings</Link> — it represents you in every match and league.</li>
            <li>Pick an upcoming match and build your 11-player squad before the deadline.</li>
            <li>Choose a Captain and Vice-Captain for bonus points.</li>
            <li>Join or create a league to compete with others.</li>
            <li>Watch your points update live as each innings finishes.</li>
          </ol>
        </SectionCard>

        <SectionCard title="2. Squad Rules">
          <RuleRow label="Total players" value="11" />
          <RuleRow label="Wicket-Keepers" value="1" />
          <RuleRow label="Batsmen" value="3" />
          <RuleRow label="Bowlers" value="3" />
          <RuleRow label="All-Rounders" value="4" />
          <RuleRow label="Max players from one real team" value="7" />
          <RuleRow label="Budget" value="Stay within your tournament's credit cap" />
          <p className="text-xs text-gray-400 mt-4">
            Player credit values reflect real season performance — pricier players aren't automatically better picks for every match.
          </p>
        </SectionCard>

        <SectionCard title="3. Captain & Vice-Captain">
          <RuleRow label="Captain" value="2× points" />
          <RuleRow label="Vice-Captain" value="1.5× points" />
          <p className="text-xs text-gray-400 mt-4">
            Choose wisely — this multiplier applies to everything your Captain and Vice-Captain earn in that match.
          </p>
        </SectionCard>

        <SectionCard title="4. Scoring System">
          <h3 className="text-sm font-bold text-gray-800 mb-2">Batting</h3>
          <RuleRow label="Per run" value="2 pts" />
          <RuleRow label="Per boundary (4)" value="+3 pts" />
          <RuleRow label="Per six" value="+5 pts" />
          <RuleRow label="Half-century (50+ runs)" value="+20 pts" />
          <RuleRow label="Century (100+ runs)" value="+50 pts" />
          <RuleRow label="Strike rate above 200" value="+10 pts" />

          <h3 className="text-sm font-bold text-gray-800 mt-6 mb-2">Bowling</h3>
          <RuleRow label="Per wicket" value="25 pts" />
          <RuleRow label="Per maiden over" value="10 pts" />
          <RuleRow label="3-wicket haul" value="+20 pts" />
          <RuleRow label="5-wicket haul" value="+50 pts" />
          <RuleRow label="Economy rate below 6" value="+10 pts" />

          <h3 className="text-sm font-bold text-gray-800 mt-6 mb-2">Fielding</h3>
          <RuleRow label="Per catch" value="10 pts" />
          <RuleRow label="3+ catches in a match" value="+15 pts" />
          <RuleRow label="Per stumping" value="15 pts" />
          <RuleRow label="3+ stumpings in a match" value="+15 pts" />
          <RuleRow label="Per run-out" value="10 pts" />
          <RuleRow label="2+ run-outs in a match" value="+15 pts" />
        </SectionCard>

        <SectionCard title="5. Deadlines & Live Matches">
          <RuleRow label="Squad lock" value="30 minutes before match start" />
          <RuleRow label="Points update" value="Live, after each innings completes" />
          <RuleRow label="Two matches same day" value="Both open for selection at once" />
          <p className="text-xs text-gray-400 mt-4">
            Once the deadline passes, your squad for that match is locked — no changes until the next match.
          </p>
        </SectionCard>

        <SectionCard title="6. Leagues & Prizes">
          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
            <li>Join public leagues freely, or private leagues with an invite code.</li>
            <li>Some leagues require an entry fee, paid from your wallet.</li>
            <li>Leagues with a prize pool reward the top-ranked member.</li>
            <li>Rankings update as match points come in.</li>
          </ul>
        </SectionCard>

        <div className="text-center mt-10">
          <Link
            to="/matches"
            className="inline-block text-white px-6 py-3 rounded-full font-semibold"
            style={{ backgroundColor: BRAND }}
          >
            Start Building Your Team
          </Link>
        </div>

      </div>
    </div>
  )
}