import * as React from 'react';
import * as SecureStore from 'expo-secure-store';

type TipoContextoAutenticacion = {
  token: string | null;
  cargando: boolean;
  iniciarSesion: (correo: string, contrasena: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const ContextoAutenticacion = React.createContext<TipoContextoAutenticacion | undefined>(undefined);

export function ProveedorAutenticacion({ children }: { children: React.ReactNode }) {
  const [token, establecerToken] = React.useState<string | null>(null);
  const [cargando, establecerCargando] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const almacenado = await SecureStore.getItemAsync('auth_token');
        if (almacenado) establecerToken(almacenado);
      } finally {
        establecerCargando(false);
      }
    })();
  }, []);

  const iniciarSesion = React.useCallback(async (correo: string, contrasena: string) => {
    // TODO: Reemplazar por llamada real al API.
    if (!correo || !contrasena) throw new Error('Credenciales requeridas');
    const jwt = 'demo-jwt-token';
    await SecureStore.setItemAsync('auth_token', jwt);
    establecerToken(jwt);
  }, []);

  const cerrarSesion = React.useCallback(async () => {
    await SecureStore.deleteItemAsync('auth_token');
    establecerToken(null);
  }, []);

  const valor = React.useMemo(
    () => ({ token, cargando, iniciarSesion, cerrarSesion }),
    [token, cargando, iniciarSesion, cerrarSesion]
  );

  return <ContextoAutenticacion.Provider value={valor}>{children}</ContextoAutenticacion.Provider>;
}

export function usarAutenticacion(): TipoContextoAutenticacion {
  const contexto = React.useContext(ContextoAutenticacion);
  if (!contexto) throw new Error('usarAutenticacion debe usarse dentro de ProveedorAutenticacion');
  return contexto;
}
