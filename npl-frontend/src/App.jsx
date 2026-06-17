import { BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Players from "./pages/players";
import Registration from "./pages/Registration";
import PlayersDetail from "./pages/players_detail";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/players" element={<Players />} />
        <Route path="/register" element={<Registration />} />
        <Route path="/players/:id" element={<PlayersDetail />} />
      </Routes>
    </Router>
  );
}

export default App;