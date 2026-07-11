import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Players from "./pages/players";
import Registration from "./pages/Registration";
import PlayersDetail from "./pages/players_detail";
import { TeamProvider } from "./context/TeamContext";
import TeamBuilder from "./pages/teambuilder";
import ViewTeam from "./pages/team_view";
import Matches from "./pages/matches";
import ViewPoints from "./pages/points_view";
import BuildTeamRedirect from "./pages/build_team_redirect";
import MatchDetail from "./pages/match_detail";
import Leagues from "./pages/leauges";
import LeagueDetails from "./pages/league_details";
import ProtectedRoute from "./components/protected_route";
import CricketTeams from "./pages/cricket_teams";
import CricketTeamDetail from "./pages/cricket_teams_detail";
import AuthCallback from './pages/authcallback';
import Wallet from './pages/wallet'
import MockPayment from './pages/mock_payment'




// Only build-team routes need TeamProvider now
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

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes — no login needed */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:matchId" element={<MatchDetail />} />
        <Route path="/leagues" element={<Leagues />} />
        <Route path="/leagues/:leagueId" element={<LeagueDetails />} />
        <Route path="/players" element={<Players />} />
        <Route path="/players/:id" element={<PlayersDetail />} />
        <Route path="/cricket-teams" element={<CricketTeams />} />
        <Route path="/cricket-teams/:teamId" element={<CricketTeamDetail />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/mock-payment" element={<MockPayment />} />

        {/* Protected routes — login required */}
        <Route path="/view-team" element={
          <ProtectedRoute><ViewTeam /></ProtectedRoute>
        } />
        <Route path="/view-points" element={
          <ProtectedRoute><ViewPoints /></ProtectedRoute>
        } />
        
       <Route path="/wallet" element={
       <ProtectedRoute><Wallet /></ProtectedRoute>
       } />

        {/* build-team/* is protected + needs TeamProvider */}
        <Route path="/*" element={
          <ProtectedRoute><TeamLayout /></ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App;