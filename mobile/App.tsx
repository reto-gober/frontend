import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider as PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ProveedorAutenticacion, usarAutenticacion } from './src/auth/AuthContext';
import PantallaInicioSesion from './src/screens/LoginScreen';
import PantallaTablero from './src/screens/DashboardScreen';
import PantallaCalendario from './src/screens/CalendarScreen';
import PantallaReportes from './src/screens/ReportsScreen';
import PantallaDetalleReporte from './src/screens/ReportDetailScreen';

export type TipoParametrosNavegacion = {
  Auth: undefined;
  AppTabs: undefined;
  ReportDetail: { id: number; title?: string };
};

const Pila = createNativeStackNavigator<TipoParametrosNavegacion>();
const Pestanas = createBottomTabNavigator();

function PestaniasApp() {
  return (
    <Pestanas.Navigator screenOptions={{ headerShown: false }}>
      <Pestanas.Screen
        name="Dashboard"
        component={PantallaTablero}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Pestanas.Screen
        name="Calendario"
        component={PantallaCalendario}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-month" color={color} size={size} />
          ),
        }}
      />
      <Pestanas.Screen
        name="Reportes"
        component={PantallaReportes}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="file-document" color={color} size={size} />
          ),
        }}
      />
    </Pestanas.Navigator>
  );
}

function NavegadorRaiz() {
  const { token, cargando } = usarAutenticacion();

  if (cargando) {
    return null; // aquí podría ir un splash
  }

  return (
    <Pila.Navigator>
      {token ? (
        <>
          <Pila.Screen name="AppTabs" component={PestaniasApp} options={{ headerShown: false }} />
          <Pila.Screen name="ReportDetail" component={PantallaDetalleReporte} options={{ title: 'Detalle del Reporte' }} />
        </>
      ) : (
        <Pila.Screen name="Auth" component={PantallaInicioSesion} options={{ headerShown: false }} />
      )}
    </Pila.Navigator>
  );
}

export default function Aplicacion() {
  const esquemaColor = useColorScheme();
  const temaPaper = esquemaColor === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const temaNavegacion = esquemaColor === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <PaperProvider theme={temaPaper}>
      <ProveedorAutenticacion>
        <NavigationContainer theme={temaNavegacion}>
          <StatusBar style={esquemaColor === 'dark' ? 'light' : 'dark'} />
          <NavegadorRaiz />
        </NavigationContainer>
      </ProveedorAutenticacion>
    </PaperProvider>
  );
}
