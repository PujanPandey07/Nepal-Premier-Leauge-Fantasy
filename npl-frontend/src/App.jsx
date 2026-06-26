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
          <Route path="/build-team/players" element={<Players showAddButton={true} />} />
          <Route path="/build-team" element={<TeamBuilder />} />
          <Route path="/view-team" element={<ViewTeam />} />
          <Route path="/matches" element={<Matches />} />
        </Routes>
      </Router>
    </TeamProvider>
  );
}

export default App;