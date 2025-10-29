import * as React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Button, HelperText, Card } from 'react-native-paper';
import { usarAutenticacion } from '../auth/AuthContext';

export default function PantallaInicioSesion() {
  const { iniciarSesion } = usarAutenticacion();
  const [correo, establecerCorreo] = React.useState('');
  const [contrasena, establecerContrasena] = React.useState('');
  const [cargando, establecerCargando] = React.useState(false);
  const [error, establecerError] = React.useState<string | null>(null);

  const enviarFormulario = async () => {
    establecerError(null);
    establecerCargando(true);
    try {
      await iniciarSesion(correo.trim(), contrasena);
    } catch (e: any) {
      establecerError(e.message || 'Error de autenticación');
    } finally {
      establecerCargando(false);
    }
  };

  const errorCorreo = !!correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo);

  return (
    <View style={estilos.contenedor}>
      <Card style={estilos.tarjeta}>
        <Card.Title title="SIREI Móvil" subtitle="Inicia sesión" />
        <Card.Content>
          <TextInput
            label="Correo"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            value={correo}
            onChangeText={establecerCorreo}
            style={estilos.campo}
          />
          {errorCorreo && <HelperText type="error">Correo no válido</HelperText>}
          <TextInput
            label="Contraseña"
            secureTextEntry
            value={contrasena}
            onChangeText={establecerContrasena}
            style={estilos.campo}
          />
          {error && <HelperText type="error">{error}</HelperText>}
          <Button mode="contained" onPress={enviarFormulario} loading={cargando} disabled={!correo || !contrasena || errorCorreo}>
            Entrar
          </Button>
        </Card.Content>
      </Card>
      <Text style={estilos.pie}>Departamento del Meta • SIREI</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  contenedor: { flex: 1, padding: 16, justifyContent: 'center' },
  tarjeta: { marginHorizontal: 8 },
  campo: { marginBottom: 12 },
  pie: { textAlign: 'center', marginTop: 24, opacity: 0.6 },
});

