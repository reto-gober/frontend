import * as React from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { List, Searchbar } from 'react-native-paper';
import { usarAutenticacion } from '../auth/AuthContext';
import { solicitarApi } from '../api/client';
import { useNavigation } from '@react-navigation/native';

type Reporte = {
  id_reporte: number;
  nombre: string;
  fecha_vencimiento: string;
  estado: 'Pendiente' | 'En Proceso' | 'Enviado';
};

export default function PantallaReportes() {
  const { token } = usarAutenticacion();
  const navegacion = useNavigation<any>();
  const [consulta, establecerConsulta] = React.useState('');
  const [reportes, establecerReportes] = React.useState<Reporte[]>([]);
  const [cargando, establecerCargando] = React.useState(true);

  const cargar = React.useCallback(async () => {
    establecerCargando(true);
    try {
      const respuesta = await solicitarApi<Reporte[]>(`/reportes?estado=&desde=&hasta=&responsable=`, { token });
      establecerReportes(respuesta);
    } catch {
      establecerReportes([
        { id_reporte: 1, nombre: 'Reporte DANE Trimestral', fecha_vencimiento: '2025-11-10', estado: 'Pendiente' },
        { id_reporte: 2, nombre: 'SUI Agua Mensual', fecha_vencimiento: '2025-10-30', estado: 'En Proceso' },
        { id_reporte: 3, nombre: 'Superservicios Semestral', fecha_vencimiento: '2025-12-15', estado: 'Enviado' },
      ]);
    } finally {
      establecerCargando(false);
    }
  }, [token]);

  React.useEffect(() => { cargar(); }, [cargar]);

  const filtrados = reportes.filter(r => r.nombre.toLowerCase().includes(consulta.toLowerCase()));

  return (
    <View style={{ flex: 1 }}>
      <Searchbar placeholder="Buscar reporte" value={consulta} onChangeText={establecerConsulta} style={{ margin: 8 }} />
      <FlatList
        data={filtrados}
        keyExtractor={item => String(item.id_reporte)}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} />}
        renderItem={({ item }) => (
          <List.Item
            title={item.nombre}
            description={`Vence: ${item.fecha_vencimiento} • ${item.estado}`}
            onPress={() => navegacion.navigate('ReportDetail', { id: item.id_reporte, title: item.nombre })}
            left={props => <List.Icon {...props} icon={item.estado === 'Enviado' ? 'check-circle' : item.estado === 'En Proceso' ? 'progress-clock' : 'alert-circle'} />}
          />
        )}
      />
    </View>
  );
}

