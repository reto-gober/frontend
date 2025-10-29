import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { Agenda, AgendaEntry, DateData } from 'react-native-calendars';
import { Card, Text } from 'react-native-paper';
import { solicitarApi } from '../api/client';
import { usarAutenticacion } from '../auth/AuthContext';

type EventoCalendario = {
  id: number;
  titulo: string;
  inicio: string; // YYYY-MM-DD
  fin?: string; // YYYY-MM-DD
  color?: string;
};

export default function PantallaCalendario() {
  const { token } = usarAutenticacion();
  const [elementos, establecerElementos] = React.useState<Record<string, AgendaEntry[]>>({});

  const cargarElementos = React.useCallback(async (dia: DateData) => {
    const inicio = new Date(dia.timestamp);
    const fin = new Date(dia.timestamp);
    fin.setDate(fin.getDate() + 30);
    try {
      const eventos = await solicitarApi<EventoCalendario[]>(`/calendario/events?start=${inicio.toISOString().slice(0,10)}&end=${fin.toISOString().slice(0,10)}`, { token });
      const agrupado: Record<string, AgendaEntry[]> = {};
      for (const evento of eventos) {
        const fecha = (evento as any).start ? (evento as any).start : evento.inicio; // compatibilidad si backend devuelve 'start'
        agrupado[fecha] = agrupado[fecha] || [];
        agrupado[fecha].push({ name: evento.titulo || (evento as any).title, height: 64, day: fecha, evento } as any);
      }
      establecerElementos(agrupado);
    } catch {
      const hoy = new Date().toISOString().slice(0,10);
      establecerElementos({
        [hoy]: [
          { name: 'Reporte DANE - Trimestral', height: 64 } as AgendaEntry,
          { name: 'SUI Energía - Mensual', height: 64 } as AgendaEntry,
        ],
      });
    }
  }, [token]);

  return (
    <View style={estilos.contenedor}>
      <Agenda
        items={elementos}
        loadItemsForMonth={cargarElementos}
        selected={new Date().toISOString().slice(0,10)}
        renderItem={(item) => (
          <Card style={{ marginRight: 10 }}>
            <Card.Content>
              <Text>{item.name}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1 },
});

