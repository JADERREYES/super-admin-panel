import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Select, DatePicker, message, Table, Tag, Tooltip, Alert, Modal, Form, Input, InputNumber } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, MessageOutlined, CalendarOutlined, WarningOutlined, EditOutlined } from '@ant-design/icons';
import io from 'socket.io-client';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TextArea } = Input;

const Reportes = () => {
  const [loading, setLoading] = useState(false);
  const [reporteData, setReporteData] = useState([]);
  const [tipoReporte, setTipoReporte] = useState('oficinas');
  const [empresasMorosas, setEmpresasMorosas] = useState([]);
  const [socket, setSocket] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState(null);
  const [tipoNotificacion, setTipoNotificacion] = useState('normal'); // 'normal' o 'mensual'
  const [form] = Form.useForm();

  useEffect(() => {
    cargarEmpresasMorosas();
    
    const newSocket = io('http://localhost:5000');
    newSocket.on('connect', () => {
      console.log('✅ Reportes conectado a WebSocket');
      newSocket.emit('join-superadmin');
    });
    setSocket(newSocket);
    
    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  const cargarEmpresasMorosas = async () => {
    try {
      setEmpresasMorosas([
        { 
          id: 1, 
          nombre: 'Popayan2', 
          fechaVencimiento: '2026-02-15', 
          montoPendiente: 500000, 
          diasAtraso: 38, 
          contacto: 'admin@popayan2.com',
          telefono: '3246868990',
          tenantId: 'popayan2_1q4i',
          estado: 'critico'
        },
        { 
          id: 2, 
          nombre: 'cali22', 
          fechaVencimiento: '2026-03-01', 
          montoPendiente: 350000, 
          diasAtraso: 24, 
          contacto: 'admin@cali22.com',
          telefono: '3112345678',
          tenantId: 'cali22_b5j1',
          estado: 'alerta'
        },
        { 
          id: 3, 
          nombre: 'cali', 
          fechaVencimiento: '2026-03-10', 
          montoPendiente: 280000, 
          diasAtraso: 15, 
          contacto: 'admin@cali.com',
          telefono: '3223456789',
          tenantId: 'cali_wa5s',
          estado: 'seguimiento'
        }
      ]);
    } catch (error) {
      console.error('Error cargando empresas morosas:', error);
      message.error('Error al cargar empresas con pagos pendientes');
    }
  };

  const generarReporte = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        let data = [];
        
        switch (tipoReporte) {
          case 'oficinas':
            data = [
              { key: '1', nombre: 'Oficina Norte', totalPrestamos: 150, montoTotal: 25000000, clientes: 45, cobradores: 3, eficiencia: '92%' },
              { key: '2', nombre: 'Oficina Sur', totalPrestamos: 98, montoTotal: 18500000, clientes: 32, cobradores: 2, eficiencia: '88%' },
              { key: '3', nombre: 'Oficina Centro', totalPrestamos: 210, montoTotal: 42000000, clientes: 67, cobradores: 4, eficiencia: '95%' },
            ];
            break;
          case 'prestamos':
            data = [
              { key: '1', tipo: 'Crédito Rápido', cantidad: 245, montoPromedio: 150000, tasaInteres: '15%' },
              { key: '2', tipo: 'Crédito Empresarial', cantidad: 98, montoPromedio: 500000, tasaInteres: '12%' },
              { key: '3', tipo: 'Microcrédito', cantidad: 115, montoPromedio: 50000, tasaInteres: '18%' },
            ];
            break;
          case 'cobradores':
            data = [
              { key: '1', nombre: 'Juan Pérez', oficina: 'Norte', clientesAsignados: 45, cobrosMensuales: 12500000, eficiencia: '94%' },
              { key: '2', nombre: 'María López', oficina: 'Sur', clientesAsignados: 32, cobrosMensuales: 8900000, eficiencia: '89%' },
              { key: '3', nombre: 'Carlos Ruiz', oficina: 'Centro', clientesAsignados: 67, cobrosMensuales: 19800000, eficiencia: '96%' },
            ];
            break;
          case 'financiero':
            data = [
              { key: '1', concepto: 'Préstamos Otorgados', monto: 85500000, variacion: '+12%' },
              { key: '2', concepto: 'Cobros Realizados', monto: 41200000, variacion: '+8%' },
              { key: '3', concepto: 'Cartera por Cobrar', monto: 44300000, variacion: '-2%' },
              { key: '4', concepto: 'Intereses Generados', monto: 12825000, variacion: '+15%' },
            ];
            break;
          default:
            data = [];
        }
        
        setReporteData(data);
        message.success('Reporte generado exitosamente');
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Error al generar reporte: ' + error.message);
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    message.info('Exportando a Excel...');
  };

  const exportarPDF = () => {
    message.info('Exportando a PDF...');
  };

  // Abrir modal para editar mensaje
  const abrirModalEditar = (empresa, tipo) => {
    setSelectedEmpresa(empresa);
    setTipoNotificacion(tipo);
    
    // Mensajes predefinidos según el tipo
    const mensajeNormal = `⚠️ RECORDATORIO DE PAGO - ${empresa.nombre}\n\nEstimado equipo,\n\nSe ha detectado que el pago correspondiente no ha sido realizado.\n\n📅 Fecha de vencimiento: ${empresa.fechaVencimiento}\n⏰ Días de atraso: ${empresa.diasAtraso} días\n💰 Monto pendiente: $${empresa.montoPendiente.toLocaleString()}\n\nPor favor, realice el pago a la brevedad para evitar la desactivación de su cuenta.\n\nSaludos cordiales,\nEquipo de Administración - Gota a Gota`;
    
    const mensajeMensual = `⚠️ RECORDATORIO MENSUAL - ${empresa.nombre}\n\nEstimado equipo,\n\nEl pago de la mensualidad correspondiente al mes de ${empresa.fechaVencimiento} está pendiente.\n\n📅 Fecha de vencimiento: ${empresa.fechaVencimiento}\n⏰ Días de atraso: ${empresa.diasAtraso} días\n💰 Monto pendiente: $${empresa.montoPendiente.toLocaleString()}\n\nPor favor, regularice su situación a la brevedad.\n\nSaludos cordiales,\nEquipo de Administración - Gota a Gota`;
    
    form.setFieldsValue({
      mensaje: tipo === 'normal' ? mensajeNormal : mensajeMensual,
      monto: empresa.montoPendiente,
      diasAtraso: empresa.diasAtraso
    });
    
    setModalVisible(true);
  };

  // Enviar recordatorio personalizado
  const enviarRecordatorioPersonalizado = async (values) => {
    if (!socket || !socket.connected) {
      message.error('No hay conexión con el servidor de notificaciones');
      return;
    }
    
    const { mensaje, monto, diasAtraso } = values;
    const evento = tipoNotificacion === 'normal' ? 'enviar-recordatorio' : 'enviar-recordatorio-mensual';
    
    socket.emit(evento, {
      tenantId: selectedEmpresa.tenantId,
      empresa: selectedEmpresa.nombre,
      monto: monto,
      diasAtraso: diasAtraso,
      fechaVencimiento: selectedEmpresa.fechaVencimiento,
      mensajePersonalizado: mensaje
    });
    
    message.success(`📱 ${tipoNotificacion === 'normal' ? 'Recordatorio' : 'Recordatorio mensual'} personalizado enviado a ${selectedEmpresa.nombre}`);
    setModalVisible(false);
    form.resetFields();
  };

  const getTagColor = (dias) => {
    if (dias > 30) return 'red';
    if (dias > 15) return 'orange';
    return 'gold';
  };

  const getEstadoTexto = (dias) => {
    if (dias > 30) return 'Crítico';
    if (dias > 15) return 'Alerta';
    return 'Seguimiento';
  };

  const morososColumns = [
    { 
      title: 'Empresa', 
      dataIndex: 'nombre', 
      key: 'nombre',
      render: (text, record) => (
        <Space>
          <WarningOutlined style={{ color: record.diasAtraso > 30 ? '#ff4d4f' : '#faad14' }} />
          <strong>{text}</strong>
        </Space>
      )
    },
    { 
      title: 'Fecha Vencimiento', 
      dataIndex: 'fechaVencimiento', 
      key: 'fechaVencimiento',
      render: (fecha) => <Tag>{fecha}</Tag>
    },
    { 
      title: 'Días Atraso', 
      dataIndex: 'diasAtraso', 
      key: 'diasAtraso', 
      render: (dias) => (
        <Tag color={getTagColor(dias)} style={{ fontWeight: 'bold' }}>
          {dias} días
        </Tag>
      )
    },
    { 
      title: 'Estado', 
      key: 'estado',
      render: (_, record) => (
        <Tag color={getTagColor(record.diasAtraso)}>
          {getEstadoTexto(record.diasAtraso)}
        </Tag>
      )
    },
    { 
      title: 'Monto Pendiente', 
      dataIndex: 'montoPendiente', 
      key: 'montoPendiente', 
      render: (monto) => (
        <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
          ${monto.toLocaleString()}
        </span>
      )
    },
    { 
      title: 'Contacto', 
      dataIndex: 'contacto', 
      key: 'contacto',
      render: (contacto) => <Tag>{contacto}</Tag>
    },
    { 
      title: 'Acciones', 
      key: 'acciones',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Editar mensaje y enviar recordatorio">
            <Button 
              size="small"
              icon={<EditOutlined />} 
              onClick={() => abrirModalEditar(record, 'normal')}
            >
              Editar
            </Button>
          </Tooltip>
          <Tooltip title="Editar mensaje y enviar recordatorio mensual">
            <Button 
              size="small"
              icon={<CalendarOutlined />} 
              onClick={() => abrirModalEditar(record, 'mensual')}
              style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: 'white' }}
            >
              Mensual
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  const getDynamicColumns = () => {
    switch (tipoReporte) {
      case 'oficinas':
        return [
          { title: 'Oficina', dataIndex: 'nombre', key: 'nombre' },
          { title: 'Total Préstamos', dataIndex: 'totalPrestamos', key: 'totalPrestamos' },
          { title: 'Monto Total', dataIndex: 'montoTotal', key: 'montoTotal', render: (monto) => `$${monto.toLocaleString()}` },
          { title: 'Clientes Activos', dataIndex: 'clientes', key: 'clientes' },
          { title: 'Cobradores', dataIndex: 'cobradores', key: 'cobradores' },
          { title: 'Eficiencia', dataIndex: 'eficiencia', key: 'eficiencia', render: (text) => <Tag color="green">{text}</Tag> }
        ];
      case 'prestamos':
        return [
          { title: 'Tipo de Préstamo', dataIndex: 'tipo', key: 'tipo' },
          { title: 'Cantidad', dataIndex: 'cantidad', key: 'cantidad' },
          { title: 'Monto Promedio', dataIndex: 'montoPromedio', key: 'montoPromedio', render: (monto) => `$${monto.toLocaleString()}` },
          { title: 'Tasa de Interés', dataIndex: 'tasaInteres', key: 'tasaInteres' }
        ];
      case 'cobradores':
        return [
          { title: 'Cobrador', dataIndex: 'nombre', key: 'nombre' },
          { title: 'Oficina', dataIndex: 'oficina', key: 'oficina' },
          { title: 'Clientes Asignados', dataIndex: 'clientesAsignados', key: 'clientesAsignados' },
          { title: 'Cobros Mensuales', dataIndex: 'cobrosMensuales', key: 'cobrosMensuales', render: (monto) => `$${monto.toLocaleString()}` },
          { title: 'Eficiencia', dataIndex: 'eficiencia', key: 'eficiencia', render: (text) => <Tag color="blue">{text}</Tag> }
        ];
      case 'financiero':
        return [
          { title: 'Concepto', dataIndex: 'concepto', key: 'concepto' },
          { title: 'Monto', dataIndex: 'monto', key: 'monto', render: (monto) => `$${monto.toLocaleString()}` },
          { title: 'Variación', dataIndex: 'variacion', key: 'variacion', render: (text) => (
            <Tag color={text.includes('+') ? 'green' : 'red'}>{text}</Tag>
          )}
        ];
      default:
        return [];
    }
  };

  return (
    <div>
      <Title level={2} style={{ marginBottom: 8 }}>Reportes Globales</Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Análisis detallado del rendimiento de todas las oficinas
      </Text>
      
      {/* Card de filtros */}
      <Card style={{ marginBottom: 24, borderRadius: 12 }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>Tipo de Reporte:</Text>
            <Select 
              style={{ width: 220, marginLeft: 16 }} 
              value={tipoReporte}
              onChange={setTipoReporte}
            >
              <Option value="oficinas">📊 Reporte de Oficinas</Option>
              <Option value="prestamos">💰 Reporte de Préstamos</Option>
              <Option value="cobradores">👥 Reporte de Cobradores</Option>
              <Option value="financiero">📈 Reporte Financiero</Option>
            </Select>
          </div>
          
          <div>
            <Text strong>Rango de Fechas:</Text>
            <RangePicker style={{ marginLeft: 16 }} />
          </div>
          
          <Space>
            <Button 
              type="primary" 
              onClick={generarReporte} 
              loading={loading}
              icon={<DownloadOutlined />}
            >
              Generar Reporte
            </Button>
            <Button 
              icon={<FileExcelOutlined />} 
              onClick={exportarExcel}
              style={{ backgroundColor: '#52c41a', color: 'white' }}
            >
              Exportar Excel
            </Button>
            <Button 
              icon={<FilePdfOutlined />} 
              onClick={exportarPDF}
              style={{ backgroundColor: '#f5222d', color: 'white' }}
            >
              Exportar PDF
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Card de resultados del reporte */}
      {reporteData.length > 0 && (
        <Card 
          title={`Resultados del Reporte - ${tipoReporte.toUpperCase()}`} 
          style={{ marginBottom: 24, borderRadius: 12 }}
        >
          <Table 
            columns={getDynamicColumns()} 
            dataSource={reporteData} 
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: true }}
          />
        </Card>
      )}

      {/* Card de empresas con pagos pendientes */}
      <Card 
        title={
          <Space>
            <WarningOutlined style={{ color: '#ff4d4f' }} />
            <span style={{ color: '#ff4d4f' }}>⚠️ Empresas con Pagos Pendientes</span>
          </Space>
        }
        style={{ borderRadius: 12, borderColor: '#ff4d4f' }}
      >
        {empresasMorosas.length > 0 ? (
          <>
            <Alert
              message="Atención"
              description={`Hay ${empresasMorosas.length} empresas con pagos atrasados. Use el botón "Editar" para personalizar el mensaje y el monto antes de enviar.`}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <Table 
              columns={morososColumns} 
              dataSource={empresasMorosas} 
              rowKey="id"
              pagination={{ pageSize: 5 }}
              scroll={{ x: true }}
            />
          </>
        ) : (
          <Alert
            message="Todo en orden"
            description="No hay empresas con pagos pendientes."
            type="success"
            showIcon
          />
        )}
      </Card>

      {/* Modal para editar mensaje */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            <span>Editar Mensaje de Recordatorio</span>
          </Space>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        {selectedEmpresa && (
          <Form
            form={form}
            layout="vertical"
            onFinish={enviarRecordatorioPersonalizado}
            initialValues={{
              monto: selectedEmpresa.montoPendiente,
              diasAtraso: selectedEmpresa.diasAtraso
            }}
          >
            <Alert
              message={`Empresa: ${selectedEmpresa.nombre}`}
              description={`Fecha vencimiento: ${selectedEmpresa.fechaVencimiento} | Contacto: ${selectedEmpresa.contacto}`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <Form.Item
              name="monto"
              label="Monto Pendiente"
              rules={[{ required: true, message: 'Ingrese el monto' }]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                step={1000}
                formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
              />
            </Form.Item>
            
            <Form.Item
              name="diasAtraso"
              label="Días de Atraso"
              rules={[{ required: true, message: 'Ingrese los días de atraso' }]}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            
            <Form.Item
              name="mensaje"
              label="Mensaje Personalizado"
              rules={[{ required: true, message: 'Ingrese el mensaje' }]}
            >
              <TextArea rows={8} placeholder="Escribe el mensaje que deseas enviar..." />
            </Form.Item>
            
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<MessageOutlined />}>
                  Enviar Recordatorio
                </Button>
                <Button onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                }}>
                  Cancelar
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default Reportes;