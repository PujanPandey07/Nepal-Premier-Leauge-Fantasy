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


function TeamLayout() {
  return (
    <TeamProvider>
      <Routes>
        <Route path="build-team" element={<BuildTeamRedirect />} />
        <Route path="build-team/:matchId" element={<TeamBuilder />} />
        <Route path="build-team/:matchId/players" element={<Players showAddButton={true} />} />
        <Route path="players" element={<Players />} />
        <Route path="players/:id" element={<PlayersDetail />} />
      </Routes>
    </TeamProvider>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes that don't need TeamContext */}
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/view-team" element={<ViewTeam />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/matches/:matchId" element={<MatchDetail />} />
        <Route path="/view-points" element={<ViewPoints />} />
        <Route path="/leagues" element={<Leagues />} />
        <Route path="/leagues/:leagueId" element={<LeagueDetails />} />

        {/* TeamLayout handles all /build-team/* and /players/* routes */}
        <Route path="/*" element={<TeamLayout />} />
      </Routes>
    </Router>
  )
}

export default App;