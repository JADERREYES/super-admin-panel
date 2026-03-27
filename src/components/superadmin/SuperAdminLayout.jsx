import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Layout, Menu, Avatar, Badge, Dropdown, Space, Typography, Button, Tooltip, Modal, message, Tag } from 'antd';
import {
  DashboardOutlined,
  ShopOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  NotificationOutlined,
  SunOutlined,
  MoonOutlined,
  RocketOutlined,
  StopOutlined,
  WarningOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import OficinasManager from './OficinasManager';
import Reportes from './Reportes';
import Configuracion from './Configuracion';
import { getOficinas, cambiarEstadoOficina, getEmpresasMorosas } from '../../api/superadmin';
import './SuperAdminLayout.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const SuperAdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesSocket, setNotificacionesSocket] = useState([]);
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);
  const navigate = useNavigate();
  
  const userName = localStorage.getItem('userName') || 'Super Admin';
  const userEmail = localStorage.getItem('userEmail') || 'admin@super.com';

  // Conexión Socket.io para notificaciones en tiempo real
  useEffect(() => {
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Conectado al servidor WebSocket');
      newSocket.emit('join-superadmin');
    });
    
    newSocket.on('nueva-notificacion', (data) => {
      console.log('🔔 Nueva notificación de pago:', data);
      setNotificacionesSocket(prev => [{
        ...data,
        id: Date.now(),
        leida: false
      }, ...prev]);
      message.success(data.mensaje, 4);
    });
    
    newSocket.on('recordatorio-enviado', (data) => {
      console.log('✅ Recordatorio enviado:', data);
      message.success(`✅ ${data.mensaje}`, 3);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Error de conexión WebSocket:', error);
      message.warning('Conectando al servidor de notificaciones...', 2);
    });
    
    setSocket(newSocket);
    
    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, []);

  // Verificar pagos pendientes
  const verificarPagosPendientes = async () => {
    try {
      setLoading(true);
      
      try {
        const morosas = await getEmpresasMorosas();
        if (morosas && morosas.length > 0) {
          setNotificaciones(morosas);
          if (morosas.length > 0) {
            message.warning(`${morosas.length} empresa(s) con pagos pendientes`, 3);
          }
          return;
        }
      } catch (apiError) {
        console.log('API de pagos no disponible, usando simulación');
      }
      
      // Fallback: simulación
      const oficinas = await getOficinas();
      const hoy = new Date();
      const morosas = [];
      
      for (const empresa of oficinas) {
        if (!empresa.estado) continue;
        
        const fechaCreacion = new Date(empresa.fechaCreacion);
        const diasDesdeCreacion = Math.floor((hoy - fechaCreacion) / (1000 * 60 * 60 * 24));
        
        if (diasDesdeCreacion >= 30) {
          const fechaVencimiento = new Date(fechaCreacion);
          fechaVencimiento.setMonth(fechaVencimiento.getMonth() + 1);
          
          if (fechaVencimiento <= hoy) {
            const diasAtraso = Math.floor((hoy - fechaVencimiento) / (1000 * 60 * 60 * 24));
            const empresasMorosasSimuladas = ['popayan2', 'cali22'];
            if (empresasMorosasSimuladas.includes(empresa.tenantId?.toLowerCase())) {
              morosas.push({
                id: empresa._id,
                nombre: empresa.nombre,
                tenantId: empresa.tenantId,
                fechaCreacion: empresa.fechaCreacion,
                fechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
                diasAtraso: diasAtraso,
                montoPendiente: 350000,
                contacto: `admin@${empresa.tenantId}.com`,
                estado: empresa.estado
              });
            }
          }
        }
      }
      
      setNotificaciones(morosas);
      
      if (morosas.length > 0) {
        message.warning(`${morosas.length} empresa(s) con pagos pendientes`, 3);
      }
      
    } catch (error) {
      console.error('Error verificando pagos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    verificarPagosPendientes();
    const interval = setInterval(verificarPagosPendientes, 21600000);
    return () => clearInterval(interval);
  }, []);

  // Función para enviar recordatorio por WebSocket (dentro de la app) - SOLO NOTIFICACIÓN, NO CORREO
  const enviarRecordatorioApp = (empresa) => {
    if (socket && socket.connected) {
      console.log('📤 Enviando recordatorio a:', empresa.nombre);
      console.log('📡 Tenant ID:', empresa.tenantId);
      
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

  // Función para enviar recordatorio mensual (dentro de la app) - SOLO NOTIFICACIÓN, NO CORREO
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

  // Función para desactivar empresa
  const desactivarEmpresa = async (empresa) => {
    Modal.confirm({
      title: `⚠️ Desactivar empresa ${empresa.nombre}`,
      content: `Esta empresa tiene ${empresa.diasAtraso} días de atraso en el pago. ¿Está seguro de desactivarla?`,
      okText: 'Sí, desactivar',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await cambiarEstadoOficina(empresa.id, false);
          message.success(`Empresa ${empresa.nombre} desactivada correctamente`);
          verificarPagosPendientes();
        } catch (error) {
          message.error('Error al desactivar empresa: ' + error.message);
        }
      }
    });
  };

  // Marcar notificación como leída
  const marcarComoLeida = (id) => {
    setNotificacionesSocket(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, leida: true } : notif
      )
    );
  };

  // Eliminar notificación
  const eliminarNotificacion = (id) => {
    setNotificacionesSocket(prev => prev.filter(notif => notif.id !== id));
  };

  // Contador de notificaciones no leídas
  const notificacionesNoLeidas = notificacionesSocket.filter(n => !n.leida).length;

  // Menú de notificaciones
  const notificationMenu = {
    items: [
      // Notificaciones de eventos en tiempo real
      ...notificacionesSocket.slice(0, 5).map(notif => ({
        key: notif.id,
        label: (
          <div 
            style={{ 
              padding: '8px 12px', 
              borderBottom: '1px solid #f0f0f0',
              background: notif.leida ? 'transparent' : 'rgba(24,144,255,0.05)',
              cursor: 'pointer'
            }}
            onClick={() => marcarComoLeida(notif.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {notif.type === 'pago' ? (
                <CheckCircleOutlined style={{ color: '#52c41a' }} />
              ) : (
                <MessageOutlined style={{ color: '#1890ff' }} />
              )}
              <Text strong style={{ fontSize: 13 }}>{notif.mensaje}</Text>
            </div>
            <div style={{ fontSize: 11, color: '#999' }}>
              {new Date(notif.fecha).toLocaleString()}
            </div>
            <Button 
              type="link" 
              size="small" 
              style={{ padding: 0, marginTop: 4, fontSize: 11 }}
              onClick={(e) => {
                e.stopPropagation();
                eliminarNotificacion(notif.id);
              }}
            >
              Eliminar
            </Button>
          </div>
        ),
      })),
      ...(notificacionesSocket.length > 0 && notificaciones.length > 0 ? [{ type: 'divider' }] : []),
      // Empresas morosas
      ...notificaciones.map(empresa => ({
        key: `morosa-${empresa.id}`,
        label: (
          <div style={{ padding: '8px 0', minWidth: 280, borderBottom: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Space>
                <WarningOutlined style={{ color: empresa.diasAtraso > 30 ? '#ff4d4f' : '#faad14' }} />
                <Text strong style={{ color: empresa.diasAtraso > 30 ? '#ff4d4f' : '#faad14' }}>
                  {empresa.nombre}
                </Text>
              </Space>
              <Tag color={empresa.diasAtraso > 30 ? 'red' : 'orange'}>
                {empresa.diasAtraso} días
              </Tag>
            </div>
            <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
              Vence: {empresa.fechaVencimiento} | Adeuda: ${empresa.montoPendiente.toLocaleString()}
            </div>
            {/* SOLO NOTIFICACIONES DENTRO DE LA APP - SIN CORREO */}
            <Space size={8}>
              <Button 
                size="small" 
                type="primary"
                icon={<MessageOutlined />} 
                onClick={() => enviarRecordatorioApp(empresa)}
              >
                📱 Recordatorio App
              </Button>
              <Button 
                size="small" 
                icon={<CalendarOutlined />} 
                onClick={() => enviarRecordatorioMensual(empresa)}
                style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: 'white' }}
              >
                📅 Mensual App
              </Button>
              <Button 
                size="small" 
                danger 
                icon={<StopOutlined />} 
                onClick={() => desactivarEmpresa(empresa)}
              >
                ⛔ Desactivar
              </Button>
            </Space>
          </div>
        ),
      })),
    ].filter(item => item !== null),
  };

  // Agregar mensaje de vacío si no hay notificaciones
  if (notificationMenu.items.length === 0) {
    notificationMenu.items = [{
      key: 'empty',
      label: (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Text type="secondary">No hay notificaciones</Text>
        </div>
      ),
    }];
  }

  const renderContent = () => {
    switch (selectedMenu) {
      case 'dashboard':
        return <Dashboard notificaciones={notificaciones} />;
      case 'oficinas':
        return <OficinasManager />;
      case 'reportes':
        return <Reportes />;
      case 'configuracion':
        return <Configuracion />;
      default:
        return <Dashboard notificaciones={notificaciones} />;
    }
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    localStorage.clear();
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Cerrar Sesión',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }} className={darkMode ? 'dark-theme' : 'light-theme'}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        theme="dark"
        style={{
          background: 'linear-gradient(180deg, #0a0f2a 0%, #0a0a1a 100%)',
          boxShadow: '4px 0 20px rgba(0,0,0,0.3)'
        }}
      >
        <div className="logo-container">
          <div className="logo-icon">
            <RocketOutlined style={{ fontSize: 32, color: '#00d4ff' }} />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <Title level={4} style={{ margin: 0, color: '#00d4ff' }}>NEXUS</Title>
              <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Control Galáctico</Text>
            </div>
          )}
        </div>
        
        <Menu
          theme="dark"
          selectedKeys={[selectedMenu]}
          mode="inline"
          items={[
            { key: 'dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: 'oficinas', icon: <ShopOutlined />, label: 'Oficinas' },
            { key: 'reportes', icon: <BarChartOutlined />, label: 'Reportes' },
            { key: 'configuracion', icon: <SettingOutlined />, label: 'Configuración' },
          ]}
          onClick={(item) => setSelectedMenu(item.key)}
          style={{ background: 'transparent' }}
        />
        
        {/* Indicador de estado WebSocket */}
        <div style={{ 
          position: 'absolute', 
          bottom: 20, 
          left: collapsed ? 20 : 70,
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <div style={{ 
            width: 8, 
            height: 8, 
            borderRadius: '50%', 
            background: socket?.connected ? '#52c41a' : '#ff4d4f',
            boxShadow: socket?.connected ? '0 0 5px #52c41a' : 'none'
          }} />
          {!collapsed && (
            <Text style={{ color: '#666', fontSize: 10 }}>
              {socket?.connected ? 'Conectado' : 'Sin conexión'}
            </Text>
          )}
        </div>
      </Sider>
      
      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: darkMode ? 'rgba(10, 15, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${darkMode ? '#1f2a3a' : '#e8e8e8'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 1000
        }}>
          <div>
            <Title level={4} style={{ margin: 0, background: 'linear-gradient(135deg, #00d4ff, #7b2cbf)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Panel de Control Galáctico
            </Title>
          </div>
          
          <div>
            <Space size="large">
              <Tooltip title="Cambiar tema">
                <Button
                  type="text"
                  icon={darkMode ? <SunOutlined /> : <MoonOutlined />}
                  onClick={() => setDarkMode(!darkMode)}
                  style={{ fontSize: 18 }}
                />
              </Tooltip>
              
              <Dropdown 
                menu={notificationMenu} 
                placement="bottomRight" 
                trigger={['click']}
                overlayStyle={{ maxWidth: 380, maxHeight: 500, overflow: 'auto' }}
              >
                <Badge 
                  count={notificacionesNoLeidas + notificaciones.length} 
                  offset={[-5, 5]} 
                  style={{ backgroundColor: '#ff4d4f' }}
                >
                  <Button 
                    type="text" 
                    icon={<NotificationOutlined style={{ fontSize: 18 }} />} 
                    style={{ 
                      background: (notificacionesNoLeidas + notificaciones.length) > 0 ? 'rgba(255,77,79,0.1)' : 'transparent'
                    }}
                  />
                </Badge>
              </Dropdown>
              
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} style={{ background: 'linear-gradient(135deg, #00d4ff, #7b2cbf)' }} />
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{userName}</div>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>{userEmail}</div>
                  </div>
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        
        <Content style={{ margin: '24px' }}>
          <div
            style={{
              padding: 24,
              minHeight: 360,
              background: darkMode ? 'rgba(10, 15, 42, 0.8)' : '#fff',
              borderRadius: 16,
              backdropFilter: darkMode ? 'blur(10px)' : 'none'
            }}
          >
            {renderContent()}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default SuperAdminLayout;