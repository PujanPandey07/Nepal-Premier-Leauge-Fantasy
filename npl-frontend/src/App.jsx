import { BrowserRouter as Router, Route, Routes} from "react-router-dom";
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

function App() {
  return (
    <TeamProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/players/:id" element={<PlayersDetail />} />
          <Route path="/build-team" element={<BuildTeamRedirect />} />
          <Route path="/build-team/:matchId" element={<TeamBuilder />} />
          <Route path="/build-team/:matchId/players" element={<Players showAddButton={true} />} />
          <Route path="/view-team" element={<ViewTeam />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/view-points" element={<ViewPoints />} />
          <Route path="/matches/:matchId" element={<MatchDetail />} />
        </Routes>
      </Router>
    </TeamProvider>
  );
}

export default App;