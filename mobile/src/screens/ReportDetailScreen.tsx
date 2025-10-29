import * as React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Card, List } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { useRoute } from '@react-navigation/native';
import { usarAutenticacion } from '../auth/AuthContext';
import { solicitarApi, subirArchivoApi } from '../api/client';

type Evidencia = {
  id_evidencia: number;
  nombre_archivo: string;
  fecha_subida: string;
};

export default function PantallaDetalleReporte() {
  const ruta = useRoute<any>();
  const { id, title } = ruta.params || {};
  const { token } = usarAutenticacion();
  const [evidencias, establecerEvidencias] = React.useState<Evidencia[]>([]);
  const [cargando, establecerCargando] = React.useState(true);
  const [subiendo, establecerSubiendo] = React.useState(false);

  const cargar = React.useCallback(async () => {
    establecerCargando(true);
    try {
      const respuesta = await solicitarApi<Evidencia[]>(`/reportes/${id}/evidencias`, { token });
      establecerEvidencias(respuesta);
    } catch {
      establecerEvidencias([
        { id_evidencia: 101, nombre_archivo: 'oficio_envio.pdf', fecha_subida: new Date().toISOString() },
      ]);
    } finally {
      establecerCargando(false);
    }
  }, [id, token]);

  React.useEffect(() => { cargar(); }, [cargar]);

  const subirEvidencia = async () => {
    try {
      establecerSubiendo(true);
      const resultado = await DocumentPicker.getDocumentAsync({ multiple: false });
      if (resultado.canceled) return;
      const archivo = resultado.assets[0];
      await subirArchivoApi(`/reportes/${id}/evidencias`, {
        uri: archivo.uri,
        name: archivo.name || 'evidencia',
        type: archivo.mimeType || undefined,
      }, token);
      Alert.alert('Éxito', 'Evidencia subida.');
      cargar();
    } catch (e: any) {
      Alert.alert('Error al subir', e.message || 'Intenta de nuevo');
    } finally {
      establecerSubiendo(false);
    }
  };

  return (
    <View style={estilos.contenedor}>
      <Card>
        <Card.Title title={title || `Reporte #${id}`} subtitle="Evidencias" />
        <Card.Content>
          {evidencias.map(ev => (
            <List.Item key={ev.id_evidencia} title={ev.nombre_archivo} description={new Date(ev.fecha_subida).toLocaleString()} left={props => <List.Icon {...props} icon="file" />} />
          ))}
          {evidencias.length === 0 && !cargando && (
            <Text>No hay evidencias aún.</Text>
          )}
          <Button mode="contained" style={{ marginTop: 12 }} onPress={subirEvidencia} loading={subiendo}>
            Subir evidencia
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 16 },
});

