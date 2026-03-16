import { useEffect, useState } from "react";
import api from "../api/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/superadmin/stats")
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error cargando stats:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "500px"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          border: "3px solid rgba(108,60,240,0.3)",
          borderTop: "3px solid #6c3cf0",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }} />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Datos de ejemplo para gráficas
  const monthlyData = [
    { name: 'Ene', préstamos: 65, clientes: 78 },
    { name: 'Feb', préstamos: 59, clientes: 82 },
    { name: 'Mar', préstamos: 80, clientes: 91 },
    { name: 'Abr', préstamos: 81, clientes: 94 },
    { name: 'May', préstamos: 56, clientes: 88 },
    { name: 'Jun', préstamos: 55, clientes: 85 },
  ];

  const pieData = [
    { name: 'Activos', value: stats?.prestamosActivos || 45 },
    { name: 'Pagados', value: stats?.prestamosPagados || 30 },
    { name: 'Vencidos', value: stats?.prestamosVencidos || 25 },
  ];

  const COLORS = ['#6c3cf0', '#ff3cd6', '#ff8c3c'];

  const cards = [
    {
      icon: <BusinessIcon style={{ fontSize: "40px" }} />,
      title: "Oficinas",
      value: stats?.oficinas || 0,
      color: "#6c3cf0"
    },
    {
      icon: <PeopleIcon style={{ fontSize: "40px" }} />,
      title: "Clientes",
      value: stats?.clientes || 0,
      color: "#ff3cd6"
    },
    {
      icon: <AccountBalanceIcon style={{ fontSize: "40px" }} />,
      title: "Cobradores",
      value: stats?.cobradores || 0,
      color: "#ff8c3c"
    },
    {
      icon: <AttachMoneyIcon style={{ fontSize: "40px" }} />,
      title: "Préstamos",
      value: stats?.prestamos || 0,
      color: "#4caf50"
    }
  ];

  return (
    <div>
      <h1 style={{
        fontSize: "32px",
        marginBottom: "30px",
        background: "linear-gradient(135deg, #fff, #b8b8d4)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Dashboard Galáctico
      </h1>

      {/* Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "20px",
        marginBottom: "30px"
      }}>
        {cards.map((card, index) => (
          <div
            key={index}
            style={{
              background: "rgba(26,26,58,0.6)",
              backdropFilter: "blur(10px)",
              borderRadius: "20px",
              padding: "25px",
              border: `1px solid ${card.color}40`,
              boxShadow: `0 0 30px ${card.color}20`,
              transition: "transform 0.3s",
              cursor: "pointer"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-5px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ color: card.color, marginBottom: "15px" }}>
              {card.icon}
            </div>
            <h3 style={{ color: "#b8b8d4", fontSize: "14px", marginBottom: "5px" }}>
              {card.title}
            </h3>
            <p style={{ fontSize: "36px", fontWeight: "bold", color: "white" }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficas */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))",
        gap: "20px"
      }}>
        {/* Gráfica de líneas */}
        <div style={{
          background: "rgba(26,26,58,0.6)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "20px",
          border: "1px solid rgba(108,60,240,0.3)"
        }}>
          <h3 style={{ marginBottom: "20px", color: "#b8b8d4" }}>
            📈 Tendencia Mensual
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#b8b8d4" />
              <YAxis stroke="#b8b8d4" />
              <Tooltip 
                contentStyle={{ 
                  background: "#0a0a1f", 
                  border: "1px solid #6c3cf0",
                  borderRadius: "10px"
                }} 
              />
              <Legend />
              <Line type="monotone" dataKey="préstamos" stroke="#6c3cf0" strokeWidth={3} />
              <Line type="monotone" dataKey="clientes" stroke="#ff3cd6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de pastel */}
        <div style={{
          background: "rgba(26,26,58,0.6)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "20px",
          border: "1px solid rgba(108,60,240,0.3)"
        }}>
          <h3 style={{ marginBottom: "20px", color: "#b8b8d4" }}>
            🥧 Estado de Préstamos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={entry => `${entry.name}: ${entry.value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfica de barras */}
        <div style={{
          background: "rgba(26,26,58,0.6)",
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "20px",
          border: "1px solid rgba(108,60,240,0.3)",
          gridColumn: "span 2"
        }}>
          <h3 style={{ marginBottom: "20px", color: "#b8b8d4" }}>
            📊 Comparativa por Oficina
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#b8b8d4" />
              <YAxis stroke="#b8b8d4" />
              <Tooltip />
              <Legend />
              <Bar dataKey="préstamos" fill="#6c3cf0" />
              <Bar dataKey="clientes" fill="#ff3cd6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}