import * as React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, useTheme, Button } from 'react-native-paper';
import { usarAutenticacion } from '../auth/AuthContext';
import { solicitarApi } from '../api/client';

type Indicadores = {
  cumplimiento: number;
  vencidos: number;
  proximos: number;
  enviados: number;
};

export default function PantallaTablero() {
  const { token, cerrarSesion } = usarAutenticacion();
  const [indicadores, establecerIndicadores] = React.useState<Indicadores | null>(null);
  const [cargando, establecerCargando] = React.useState(true);
  const tema = useTheme();

  React.useEffect(() => {
    (async () => {
      try {
        const datos = await solicitarApi<Indicadores>('/dashboard/kpis', { token });
        establecerIndicadores(datos);
      } catch {
        establecerIndicadores({ cumplimiento: 82, vencidos: 3, proximos: 7, enviados: 24 });
      } finally {
        establecerCargando(false);
      }
    })();
  }, [token]);

  return (
    <ScrollView contentContainerStyle={estilos.contenedor}>
      <View style={estilos.fila}>
        <Card style={[estilos.tarjeta, { backgroundColor: tema.colors.primary }]}> 
          <Card.Content>
            <Text variant="titleLarge" style={estilos.tituloTarjeta}>Cumplimiento</Text>
            <Text variant="displaySmall">{indicadores?.cumplimiento ?? '—'}%</Text>
          </Card.Content>
        </Card>
        <Card style={estilos.tarjeta}>
          <Card.Content>
            <Text variant="titleLarge" style={estilos.tituloTarjeta}>Vencidos</Text>
            <Text variant="displaySmall" style={{ color: '#d32f2f' }}>{indicadores?.vencidos ?? '—'}</Text>
          </Card.Content>
        </Card>
      </View>
      <View style={estilos.fila}>
        <Card style={estilos.tarjeta}>
          <Card.Content>
            <Text variant="titleLarge" style={estilos.tituloTarjeta}>Próximos 15 días</Text>
            <Text variant="displaySmall" style={{ color: '#ef6c00' }}>{indicadores?.proximos ?? '—'}</Text>
          </Card.Content>
        </Card>
        <Card style={estilos.tarjeta}>
          <Card.Content>
            <Text variant="titleLarge" style={estilos.tituloTarjeta}>Enviados</Text>
            <Text variant="displaySmall" style={{ color: '#2e7d32' }}>{indicadores?.enviados ?? '—'}</Text>
          </Card.Content>
        </Card>
      </View>
      <Button style={{ marginTop: 16 }} onPress={cerrarSesion}>Cerrar sesión</Button>
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  contenedor: { padding: 16 },
  fila: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  tarjeta: { flex: 1 },
  tituloTarjeta: { opacity: 0.8 },
});

