import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/navbar'

const BRAND = '#38003c'

const SECTIONS = [
  { id: 'getting-started', label: 'Overview' },
  { id: 'squad-rules', label: 'Squad Rules' },
  { id: 'captaincy', label: 'Captaincy' },
  { id: 'scoring', label: 'Scoring' },
  { id: 'deadlines', label: 'Deadlines' },
  { id: 'leagues', label: 'Leagues' },
]

function SectionCard({ id, title, children }) {
  return (
    <div
      id={id}
      className="scroll-mt-20 rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm mb-6 transition-all"
    >
      <h2 className="mb-4 text-xl font-bold tracking-tight" style={{ color: BRAND }}>
        {title}
      </h2>
      {children}
    </div>
  )
}

function RuleRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span
        className={`text-xs font-bold px-2.5 py-1 rounded-full ${
          highlight
            ? 'bg-amber-100 text-amber-900 border border-amber-200'
            : 'bg-gray-100 text-gray-900'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

export default function Rules() {
  const [activeTab, setActiveTab] = useState('getting-started')

  const scrollToSection = (id) => {
    setActiveTab(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800">
      <Navbar />

      {/* Hero Header */}
      <div
        className="px-6 py-12 md:py-16 text-white"
        style={{ background: `linear-gradient(135deg, ${BRAND}, #1a0020)` }}
      >
        <div className="mx-auto max-w-4xl">
          <span className="rounded-md bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-300 backdrop-blur-sm">
            NPL Fantasy Guide
          </span>
          <h1 className="mt-3 text-3xl font-black md:text-5xl">Rules & Scoring</h1>
          <p className="mt-2 max-w-xl text-sm text-white/80 md:text-base">
            Master the point system, build your ultimate 11-player squad, and rise to the top of the leaderboards.
          </p>
        </div>
      </div>

      {/* Sticky Section Quick Nav */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl gap-2 overflow-x-auto px-6 py-2.5 no-scrollbar">
          {SECTIONS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => scrollToSection(tab.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-950 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* 1. Getting Started */}
        <SectionCard id="getting-started" title="1. Getting Started">
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-900">
                1
              </span>
              <span>
                Set your custom squad name in{' '}
                <Link to="/settings" className="font-semibold underline" style={{ color: BRAND }}>
                  Settings
                </Link>{' '}
                to identify your team on public leaderboards.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-900">
                2
              </span>
              <span>Select an upcoming match from the fixture list before squad locks.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-900">
                3
              </span>
              <span>Pick your 11 players staying within the credit budget cap.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-bold text-purple-900">
                4
              </span>
              <span>Designate a Captain (2×) and Vice-Captain (1.5×) for bonus multipliers.</span>
            </li>
          </ol>
        </SectionCard>

        {/* 2. Squad Rules */}
        <SectionCard id="squad-rules" title="2. Squad Composition">
          <div className="grid grid-cols-1 gap-x-8 md:grid-cols-2">
            <div>
              <RuleRow label="Total Squad Size" value="11 Players" highlight />
              <RuleRow label="Wicket-Keepers (WK)" value="1 Player" />
              <RuleRow label="Batters (BAT)" value="3 Players" />
            </div>
            <div>
              <RuleRow label="All-Rounders (AR)" value="4 Players" />
              <RuleRow label="Bowlers (BOWL)" value="3 Players" />
              <RuleRow label="Max from Single Team" value="7 Players" />
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200/60">
            <strong>Credit Cap Warning:</strong> Each player is assigned a credit value reflecting historical performance. Ensure your total 11-player pick fits inside the tournament budget limit.
          </p>
        </SectionCard>

        {/* 3. Captain & Vice-Captain */}
        <SectionCard id="captaincy" title="3. Captain & Vice-Captain Multipliers">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Captain (C)</span>
              <p className="mt-1 text-2xl font-black text-amber-900">2.0× Points</p>
              <p className="mt-1 text-xs text-amber-700">
                Earns double the base points for all match actions.
              </p>
            </div>
            <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-sky-800">Vice-Captain (VC)</span>
              <p className="mt-1 text-2xl font-black text-sky-900">1.5× Points</p>
              <p className="mt-1 text-xs text-sky-700">
                Earns 1.5 times the base points for all match actions.
              </p>
            </div>
          </div>
        </SectionCard>

        {/* 4. Scoring System */}
        <SectionCard id="scoring" title="4. Detailed Scoring Breakdown">
          <div className="space-y-6">
            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-900">Batting Points</h3>
              <RuleRow label="Per Run Scored" value="+2 pts" />
              <RuleRow label="Boundary Bonus (4)" value="+3 pts" />
              <RuleRow label="Six Bonus (6)" value="+5 pts" />
              <RuleRow label="Half-Century (50 Runs)" value="+20 pts" highlight />
              <RuleRow label="Century (100 Runs)" value="+50 pts" highlight />
              <RuleRow label="High SR Bonus (>200)" value="+10 pts" />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-900">Bowling Points</h3>
              <RuleRow label="Per Wicket (excl. Run-Out)" value="+25 pts" highlight />
              <RuleRow label="Maiden Over" value="+10 pts" />
              <RuleRow label="3-Wicket Haul" value="+20 pts" />
              <RuleRow label="5-Wicket Haul" value="+50 pts" highlight />
              <RuleRow label="Economy Rate (<6.0)" value="+10 pts" />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-900">Fielding Points</h3>
              <RuleRow label="Catch Taken" value="+10 pts" />
              <RuleRow label="3+ Catches Bonus" value="+15 pts" />
              <RuleRow label="Stumping Executed" value="+15 pts" />
              <RuleRow label="Direct Run-Out" value="+10 pts" />
            </div>
          </div>
        </SectionCard>

        {/* 5. Deadlines & Live Updates */}
        <SectionCard id="deadlines" title="5. Deadlines & Live Sync">
          <RuleRow label="Squad Lock Threshold" value="30 mins prior to match start" highlight />
          <RuleRow label="Live Point Recalculation" value="End of each innings" />
          <RuleRow label="Double Header Matches" value="Individually configured" />
        </SectionCard>

        {/* 6. Leagues */}
        <SectionCard id="leagues" title="6. Leagues & Contests">
          <ul className="space-y-2 text-sm text-gray-700 list-disc list-inside">
            <li>Join global public contests or create private head-to-head leagues with friends.</li>
            <li>Paid entry leagues automatically calculate prize distribution upon match completion.</li>
            <li>Rankings and leaderboards continuously update live as fantasy points are recorded.</li>
          </ul>
        </SectionCard>

        {/* CTA Banner */}
        <div className="mt-10 rounded-2xl p-8 text-center text-white" style={{ background: `linear-gradient(135deg, ${BRAND}, #1a0020)` }}>
          <h2 className="text-2xl font-bold">Ready to Put Your Strategy to the Test?</h2>
          <p className="mt-2 text-sm text-white/80">Select an upcoming match and set your winning XI now.</p>
          <Link
            to="/matches"
            className="mt-6 inline-block rounded-full bg-emerald-500 px-8 py-3 text-sm font-bold text-slate-950 transition-transform hover:scale-105"
          >
            Go to Fixtures
          </Link>
        </div>
      </div>
    </div>
  )
}