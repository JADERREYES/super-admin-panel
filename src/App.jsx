import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Oficinas from "./pages/Oficinas";
import Layout from "./components/Layout";

function App() {
  const token = localStorage.getItem("super_token");

  // Si no hay token, mostrar login
  if (!token) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/oficinas" element={<Oficinas />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;