import Constants from 'expo-constants';

function obtenerUrlApi(): string {
  const desdeEntorno = process.env.EXPO_PUBLIC_API_URL;
  if (desdeEntorno && desdeEntorno.length > 0) return desdeEntorno;
  // @ts-expect-error expoConfig existe en tiempo de ejecución para Expo Go
  const extra = Constants?.expoConfig?.extra ?? Constants?.manifest?.extra;
  return (extra?.apiUrl as string) || 'http://localhost:8080';
}

export const URL_API = obtenerUrlApi();

export type OpcionesHttp = RequestInit & { token?: string | null };

export async function solicitarApi<T = any>(ruta: string, opciones: OpcionesHttp = {}): Promise<T> {
  const url = ruta.startsWith('http') ? ruta : `${URL_API}${ruta}`;
  const cabeceras: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opciones.headers as Record<string, string>),
  };
  if (opciones.token) cabeceras['Authorization'] = `Bearer ${opciones.token}`;

  const resp = await fetch(url, { ...opciones, headers: cabeceras });
  if (!resp.ok) {
    let detalle: any = undefined;
    try { detalle = await resp.json(); } catch { /* ignore */ }
    throw new Error(detalle?.message || `HTTP ${resp.status}`);
  }
  try {
    return (await resp.json()) as T;
  } catch {
    return undefined as unknown as T;
  }
}

export async function subirArchivoApi<T = any>(ruta: string, archivo: { uri: string; name: string; type?: string }, token?: string | null): Promise<T> {
  const url = ruta.startsWith('http') ? ruta : `${URL_API}${ruta}`;
  const formulario = new FormData();
  formulario.append('file', {
    // @ts-ignore RN FormData file shim
    uri: archivo.uri,
    name: archivo.name,
    type: archivo.type || 'application/octet-stream',
  });
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formulario as any,
  });
  if (!resp.ok) throw new Error(`Fallo de carga: ${resp.status}`);
  try { return (await resp.json()) as T; } catch { return undefined as unknown as T; }
}
