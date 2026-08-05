import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Players from "./pages/players";
import Registration from "./pages/Registration";
import PlayersDetail from "./pages/players_detail";
import { TeamProvider } from "./context/teamcontext";
import TeamBuilder from "./pages/teambuilder";
import ViewTeam from "./pages/team_view";
import Matches from "./pages/matches";
import ViewPoints from "./pages/points_view";
import BuildTeamRedirect from "./pages/build_team_redirect";
import MatchDetail from "./pages/match_detail";
import MatchScorecard from "./pages/match_scorecard";
import NewsPage from "./pages/news";
import NewsDetail from "./pages/news_detail";
import Leagues from "./pages/leauges";
import LeagueDetails from "./pages/league_details";
import ProtectedRoute from "./components/protected_route";
import CricketTeams from "./pages/cricket_teams";
import CricketTeamDetail from "./pages/cricket_teams_detail";
import AuthCallback from './pages/authcallback';
import Wallet from './pages/wallet'
import MockPayment from './pages/mock_payment'
import Settings from './pages/settings'
import Rules from "./pages/rules";


function TeamLayout() {
  return (
    <TeamProvider>
      <Routes>
        <Route path="build-team" element={<BuildTeamRedirect />} />
        <Route path="build-team/:matchId" element={<TeamBuilder />} />
        <Route path="build-team/:matchId/players" element={<Players showAddButton={true} />} />
      </Routes>
    </TeamProvider>
  )
}

// Waits for the initial silent-refresh check before rendering any routes,
// so ProtectedRoute / isLoggedIn checks never see a false "logged out"
// flash while that check is still in flight.
function AppRoutes() {
  const { checkingAuth } = useAuth()

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Registration />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/matches/:matchId" element={<MatchDetail />} />
      <Route path="/matches/:matchId/scorecard" element={<MatchScorecard />} />
      <Route path="/leagues" element={<Leagues />} />
      <Route path="/leagues/:leagueId" element={<LeagueDetails />} />
      <Route path="/players" element={<Players />} />
      <Route path="/players/:id" element={<PlayersDetail />} />
      <Route path="/cricket-teams" element={<CricketTeams />} />
      <Route path="/cricket-teams/:teamId" element={<CricketTeamDetail />} />
      <Route path="/news" element={<NewsPage />} />
      <Route path="/news/:newsId" element={<NewsDetail />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/mock-payment" element={<MockPayment />} />
      <Route path="/rules" element={<Rules />} />

      <Route path="/view-team" element={
        <ProtectedRoute><ViewTeam /></ProtectedRoute>
      } />
      <Route path="/view-points" element={
        <ProtectedRoute><ViewPoints /></ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute><Settings /></ProtectedRoute>
      } />
      <Route path="/wallet" element={
        <ProtectedRoute><Wallet /></ProtectedRoute>
      } />
      <Route path="/*" element={
        <ProtectedRoute><TeamLayout /></ProtectedRoute>
      } />
    </Routes>
  )
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  )
}

export default App;