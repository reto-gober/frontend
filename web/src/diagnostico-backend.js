/**
 * Script de diagnóstico para verificar la conectividad con el backend
 *
 * USO:
 * 1. Abre la consola del navegador (F12)
 * 2. Copia y pega este código
 * 3. Revisa los resultados
 */

console.log("🔍 === DIAGNÓSTICO DE CONECTIVIDAD BACKEND ===");

// 1. Verificar variable de entorno
const apiUrl = import.meta.env?.PUBLIC_API_URL || "http://localhost:8080";
console.log("🌐 API URL configurada:", apiUrl);

// 2. Verificar token
const token = localStorage.getItem("token");
console.log(
  "🔐 Token en localStorage:",
  token ? "✅ Presente" : "❌ No encontrado"
);
if (token) {
  console.log(
    "🔐 Token (primeros 50 caracteres):",
    token.substring(0, 50) + "..."
  );
}

// 3. Verificar usuario
const usuario = localStorage.getItem("usuario");
console.log(
  "👤 Usuario en localStorage:",
  usuario ? "✅ Presente" : "❌ No encontrado"
);
if (usuario) {
  try {
    const usuarioData = JSON.parse(usuario);
    console.log("👤 Datos del usuario:", usuarioData);
    console.log("👤 Roles:", usuarioData.roles);
  } catch (e) {
    console.error("❌ Error al parsear usuario:", e);
  }
}

// 4. Test de conectividad básica
console.log("\n🧪 Probando conectividad con el backend...");

fetch(`${apiUrl}/api/flujo-reportes/mis-periodos?page=0&size=10`, {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
})
  .then((response) => {
    console.log("📡 Respuesta del backend:");
    console.log("  - Status:", response.status);
    console.log("  - Status Text:", response.statusText);
    console.log("  - Headers:", Object.fromEntries(response.headers.entries()));

    return response.json();
  })
  .then((data) => {
    console.log("✅ Datos recibidos del backend:");
    console.log(data);

    if (data.data && data.data.content) {
      console.log(`✅ Periodos encontrados: ${data.data.content.length}`);
      if (data.data.content.length > 0) {
        console.log("✅ Primer periodo:", data.data.content[0]);
      }
    } else {
      console.warn("⚠️ No se encontró data.data.content en la respuesta");
    }
  })
  .catch((error) => {
    console.error("❌ Error en la petición:");
    console.error(error);
  });

console.log("\n📋 Verifica los resultados arriba ☝️");
