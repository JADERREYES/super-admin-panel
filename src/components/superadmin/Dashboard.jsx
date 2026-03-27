import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Spin, 
  Alert, 
  Typography,
  Space,
  Button,
  Tag,
  message
} from 'antd';
import { 
  ShopOutlined, 
  UserOutlined, 
  DollarOutlined, 
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  MessageOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { getSuperAdminStats } from '../../api/superadmin';
import io from 'socket.io-client';

const { Title, Text } = Typography;

const Dashboard = ({ notificaciones = [] }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    oficinas: 0,
    clientes: 0,
    cobradores: 0,
    prestamos: 0,
    carteraTotal: 0,
    prestamosActivos: 0,
    prestamosPagados: 0,
    prestamosVencidos: 0
  });
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    cargarEstadisticas();
    
    // Conectar WebSocket
    const newSocket = io('http://localhost:5000');
    newSocket.on('connect', () => {
      console.log('✅ Dashboard conectado a WebSocket');
      newSocket.emit('join-superadmin');
    });
    setSocket(newSocket);
    
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      const data = await getSuperAdminStats();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función para enviar recordatorio por WebSocket - SOLO APP, NO CORREO
  const enviarRecordatorioApp = (empresa) => {
    if (socket && socket.connected) {
      socket.emit('enviar-recordatorio', {
        tenantId: empresa.tenantId,
        empresa: empresa.nombre,
        monto: empresa.montoPendiente,
        diasAtraso: empresa.diasAtraso,
        fechaVencimiento: empresa.fechaVencimiento
      });
      message.success(`📱 Recordatorio enviado a ${empresa.nombre} (dentro de la app)`);
    } else {
      message.error('No hay conexión con el servidor de notificaciones');
    }
  };

  // Función para enviar recordatorio mensual - SOLO APP, NO CORREO
  const enviarRecordatorioMensual = (empresa) => {
    if (socket && socket.connected) {
      socket.emit('enviar-recordatorio-mensual', {
        tenantId: empresa.tenantId,
        empresa: empresa.nombre,
        monto: empresa.montoPendiente,
        diasAtraso: empresa.diasAtraso,
        fechaVencimiento: empresa.fechaVencimiento
      });
      message.success(`📅 Recordatorio mensual enviado a ${empresa.nombre} (dentro de la app)`);
    } else {
      message.error('No hay conexión con el servidor de notificaciones');
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
      <Spin size="large" tip="Cargando estadísticas..." />
    </div>
  );
  
  if (error) return <Alert message="Error" description={error} type="error" showIcon />;

  const prestamosData = [
    { name: 'Activos', value: stats.prestamosActivos, color: '#52c41a' },
    { name: 'Pagados', value: stats.prestamosPagados, color: '#1890ff' },
    { name: 'Vencidos', value: stats.prestamosVencidos, color: '#f5222d' }
  ];

  const distribucionData = [
    { name: 'Oficinas', cantidad: stats.oficinas, icon: '🏢' },
    { name: 'Cobradores', cantidad: stats.cobradores, icon: '👥' },
    { name: 'Clientes', cantidad: stats.clientes, icon: '👤' },
    { name: 'Préstamos', cantidad: stats.prestamos, icon: '📄' }
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24, color: '#1890ff' }}>
        Panel de Control Global
      </Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Oficinas"
              value={stats.oficinas}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Cobradores"
              value={stats.cobradores}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Clientes"
              value={stats.clientes}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="Préstamos Totales"
              value={stats.prestamos}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Cartera Total" className="stat-card">
            <Statistic
              value={stats.carteraTotal}
              precision={2}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322', fontSize: '28px' }}
              suffix="COP"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Préstamos Activos" className="stat-card">
            <Statistic
              value={stats.prestamosActivos}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card title="Préstamos Vencidos" className="stat-card">
            <Statistic
              value={stats.prestamosVencidos}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alertas de empresas morosas */}
      {notificaciones.length > 0 && (
        <Card style={{ marginTop: 24, marginBottom: 24 }}>
          <Title level={4}>⚠️ Empresas con Pagos Pendientes</Title>
          <Row gutter={[16, 16]}>
            {notificaciones.map(empresa => (
              <Col xs={24} sm={12} lg={8} key={empresa.id}>
                <Card size="small" style={{ borderLeft: `4px solid ${empresa.diasAtraso > 30 ? '#ff4d4f' : '#faad14'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{empresa.nombre}</Text>
                      <div><Tag color={empresa.diasAtraso > 30 ? 'red' : 'orange'}>{empresa.diasAtraso} días atraso</Tag></div>
                      <div>Vence: {empresa.fechaVencimiento}</div>
                      <div>Monto: ${empresa.montoPendiente?.toLocaleString()}</div>
                    </div>
                    <Space direction="vertical" size="small">
                      <Button 
                        size="small" 
                        type="primary"
                        icon={<MessageOutlined />} 
                        onClick={() => enviarRecordatorioApp(empresa)}
                      >
                        Recordatorio App
                      </Button>
                      <Button 
                        size="small" 
                        icon={<CalendarOutlined />} 
                        onClick={() => enviarRecordatorioMensual(empresa)}
                        style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: 'white' }}
                      >
                        Mensual App
                      </Button>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Distribución de Préstamos">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={prestamosData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {prestamosData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Distribución General">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distribucionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="cantidad" fill="#8884d8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;