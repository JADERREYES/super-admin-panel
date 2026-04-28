import React, { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Divider,
  Empty,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Space,
  Spin,
  Tag,
  Typography
} from 'antd';
import {
  DeleteOutlined,
  ExperimentOutlined,
  FilePdfOutlined,
  InboxOutlined,
  ReloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import {
  eliminarDocumentoIaTenant,
  guardarDocumentoIaTenant,
  listarDocumentosIaTenant,
  preguntarIaTenant,
  subirPdfIaTenant
} from '../../api/superadmin';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

const getErrorMessage = (error) => {
  const backendMessage = error?.response?.data?.error || error?.message || 'Error desconocido';

  if (error?.response?.status === 401) {
    return 'Sesión expirada';
  }

  if (backendMessage === 'Empresa/oficina no encontrada') {
    return 'La oficina no existe o el tenantId es inválido';
  }

  return backendMessage;
};

const GestionIaModal = ({ open, oficina, onClose }) => {
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [savingText, setSavingText] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [asking, setAsking] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [documentos, setDocumentos] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfTitulo, setPdfTitulo] = useState('');
  const [pdfCategoria, setPdfCategoria] = useState('');
  const [textoTitulo, setTextoTitulo] = useState('');
  const [textoCategoria, setTextoCategoria] = useState('');
  const [textoContenido, setTextoContenido] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [resultadoPregunta, setResultadoPregunta] = useState(null);

  const tenantId = oficina?.tenantId || '';
  const oficinaNombre = oficina?.nombre || '';
  const oficinaCodigo = oficina?.codigoEmpresa || '';

  const resetState = () => {
    setSelectedFile(null);
    setPdfTitulo('');
    setPdfCategoria('');
    setTextoTitulo('');
    setTextoCategoria('');
    setTextoContenido('');
    setPregunta('');
    setResultadoPregunta(null);
    setDocumentos([]);
  };

  const cargarDocumentos = async () => {
    if (!tenantId) return;

    try {
      setLoadingDocs(true);
      const response = await listarDocumentosIaTenant(tenantId);
      setDocumentos(response.documentos || []);
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (open && tenantId) {
      cargarDocumentos();
    }

    if (!open) {
      resetState();
    }
  }, [open, tenantId]);

  const handleGuardarTexto = async () => {
    if (!textoTitulo.trim()) {
      message.error('Escribe un título');
      return;
    }

    if (!textoContenido.trim()) {
      message.error('Escribe el contenido');
      return;
    }

    try {
      setSavingText(true);
      await guardarDocumentoIaTenant(tenantId, {
        titulo: textoTitulo.trim(),
        contenido: textoContenido.trim(),
        categoria: textoCategoria.trim(),
        fuente: 'texto_superadmin'
      });
      message.success('Texto IA guardado correctamente');
      setTextoTitulo('');
      setTextoCategoria('');
      setTextoContenido('');
      await cargarDocumentos();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setSavingText(false);
    }
  };

  const handleSubirPdf = async () => {
    if (!selectedFile) {
      message.error('Selecciona un PDF');
      return;
    }

    try {
      setUploadingPdf(true);
      await subirPdfIaTenant(tenantId, {
        archivo: selectedFile,
        titulo: pdfTitulo.trim(),
        categoria: pdfCategoria.trim(),
        fuente: 'pdf_superadmin'
      });
      message.success('PDF IA subido correctamente');
      setSelectedFile(null);
      setPdfTitulo('');
      setPdfCategoria('');
      await cargarDocumentos();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleEliminarDocumento = async (documentoId) => {
    try {
      setDeletingId(documentoId);
      await eliminarDocumentoIaTenant(tenantId, documentoId);
      message.success('Documento IA eliminado correctamente');
      await cargarDocumentos();
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setDeletingId(null);
    }
  };

  const handlePreguntar = async () => {
    if (!pregunta.trim()) {
      message.error('Escribe una pregunta');
      return;
    }

    try {
      setAsking(true);
      const response = await preguntarIaTenant(tenantId, {
        pregunta: pregunta.trim()
      });
      setResultadoPregunta(response);
      message.success('Pregunta procesada correctamente');
    } catch (error) {
      message.error(getErrorMessage(error));
    } finally {
      setAsking(false);
    }
  };

  return (
    <Modal
      title={`Gestión IA - ${oficinaNombre || 'Oficina'}`}
      open={open}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={cargarDocumentos} loading={loadingDocs}>
          Recargar
        </Button>,
        <Button key="close" type="primary" onClick={onClose}>
          Cerrar
        </Button>
      ]}
    >
      {!tenantId ? (
        <Alert type="error" showIcon message="No se encontró tenantId para esta oficina" />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card size="small">
            <Space direction="vertical" size={2}>
              <Title level={5} style={{ margin: 0 }}>{oficinaNombre}</Title>
              <Text>TenantId: <Text code>{tenantId}</Text></Text>
              {oficinaCodigo ? <Text>Código: <Tag color="blue">{oficinaCodigo}</Tag></Text> : null}
            </Space>
          </Card>

          <Card title={<Space><FilePdfOutlined />Subir PDF IA</Space>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              />
              {selectedFile ? <Text type="secondary">Archivo seleccionado: {selectedFile.name}</Text> : null}
              <Input
                placeholder="Título del PDF"
                value={pdfTitulo}
                onChange={(event) => setPdfTitulo(event.target.value)}
              />
              <Input
                placeholder="Categoría"
                value={pdfCategoria}
                onChange={(event) => setPdfCategoria(event.target.value)}
              />
              <Button type="primary" icon={<InboxOutlined />} loading={uploadingPdf} onClick={handleSubirPdf}>
                Subir PDF IA
              </Button>
            </Space>
          </Card>

          <Card title={<Space><SaveOutlined />Guardar texto IA</Space>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Input
                placeholder="Título"
                value={textoTitulo}
                onChange={(event) => setTextoTitulo(event.target.value)}
              />
              <Input
                placeholder="Categoría"
                value={textoCategoria}
                onChange={(event) => setTextoCategoria(event.target.value)}
              />
              <TextArea
                rows={5}
                placeholder="Contenido del documento IA"
                value={textoContenido}
                onChange={(event) => setTextoContenido(event.target.value)}
              />
              <Button type="primary" icon={<SaveOutlined />} loading={savingText} onClick={handleGuardarTexto}>
                Guardar texto IA
              </Button>
            </Space>
          </Card>

          <Card
            title="Documentos IA"
            extra={<Button icon={<ReloadOutlined />} onClick={cargarDocumentos} loading={loadingDocs}>Actualizar</Button>}
          >
            <Spin spinning={loadingDocs}>
              {documentos.length === 0 ? (
                <Empty description="No hay documentos IA cargados para esta oficina" />
              ) : (
                <List
                  dataSource={documentos}
                  renderItem={(documento) => (
                    <List.Item
                      actions={[
                        <Popconfirm
                          key="delete"
                          title="¿Eliminar este documento IA?"
                          onConfirm={() => handleEliminarDocumento(documento.id)}
                          okText="Eliminar"
                          cancelText="Cancelar"
                        >
                          <Button
                            danger
                            type="link"
                            icon={<DeleteOutlined />}
                            loading={deletingId === documento.id}
                          >
                            Eliminar
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space wrap>
                            <Text strong>{documento.titulo}</Text>
                            {documento.categoria ? <Tag color="purple">{documento.categoria}</Tag> : null}
                            {documento.fuente ? <Tag>{documento.fuente}</Tag> : null}
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size={2}>
                            <Text type="secondary">ID: {documento.id}</Text>
                            {documento.metadata?.originalName ? (
                              <Text type="secondary">Archivo: {documento.metadata.originalName}</Text>
                            ) : null}
                            <Text type="secondary">
                              Creado: {documento.createdAt ? new Date(documento.createdAt).toLocaleString() : 'N/A'}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </Spin>
          </Card>

          <Card title={<Space><ExperimentOutlined />Probar pregunta IA</Space>}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <Input
                placeholder="Escribe una pregunta"
                value={pregunta}
                onChange={(event) => setPregunta(event.target.value)}
              />
              <Button type="primary" icon={<ExperimentOutlined />} loading={asking} onClick={handlePreguntar}>
                Probar pregunta IA
              </Button>
              {resultadoPregunta ? (
                <>
                  <Divider style={{ margin: '8px 0' }} />
                  <Paragraph>
                    <Text strong>Respuesta:</Text><br />
                    {resultadoPregunta.respuesta}
                  </Paragraph>
                  <Text strong>Documentos usados:</Text>
                  <List
                    size="small"
                    dataSource={resultadoPregunta.documentos || []}
                    locale={{ emptyText: 'No se devolvieron documentos' }}
                    renderItem={(doc) => (
                      <List.Item>
                        <Space direction="vertical" size={0}>
                          <Text strong>{doc.titulo}</Text>
                          <Text type="secondary">Score: {typeof doc.score === 'number' ? doc.score.toFixed(4) : 'N/A'}</Text>
                          <Text type="secondary">{doc.contenido}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </>
              ) : null}
            </Space>
          </Card>
        </Space>
      )}
    </Modal>
  );
};

export default GestionIaModal;
