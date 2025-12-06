import notifications from '../lib/notifications';

/**
 * Archivo de ejemplo para probar el sistema de notificaciones
 * Puedes usar estas funciones en la consola del navegador
 */

// Función para probar todos los tipos de notificaciones
export const testNotifications = {
  
  // Probar notificación de éxito
  testSuccess: () => {
    notifications.success('¡Esta es una notificación de éxito!', '¡Perfecto!');
  },

  // Probar notificación de error
  testError: () => {
    notifications.error('Algo salió mal en la operación', 'Error');
  },

  // Probar notificación de advertencia
  testWarning: () => {
    notifications.warning('Ten cuidado con esta acción', 'Advertencia');
  },

  // Probar notificación de información
  testInfo: () => {
    notifications.info('Esta es información importante', 'Información');
  },

  // Probar modal de confirmación
  testConfirm: async () => {
    const result = await notifications.confirm(
      'Esta acción no se puede deshacer',
      '¿Continuar?',
      'Sí, continuar',
      'Cancelar'
    );
    console.log('Usuario confirmó:', result);
    
    if (result) {
      notifications.success('¡Acción confirmada!');
    } else {
      notifications.info('Acción cancelada');
    }
  },

  // Probar toast de éxito
  testToastSuccess: () => {
    notifications.toast('Cambios guardados', 'success');
  },

  // Probar toast de error
  testToastError: () => {
    notifications.toast('Error en la operación', 'error');
  },

  // Probar toast de advertencia
  testToastWarning: () => {
    notifications.toast('Advertencia detectada', 'warning');
  },

  // Probar toast de info
  testToastInfo: () => {
    notifications.toast('Descargando archivo...', 'info');
  },

  // Probar loading
  testLoading: async () => {
    notifications.loading('Procesando datos...');
    
    // Simular operación larga
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    notifications.close();
    notifications.success('¡Proceso completado!');
  },

  // Probar secuencia completa
  testSequence: async () => {
    // 1. Loading
    notifications.loading('Iniciando proceso...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // 2. Cerrar loading
    notifications.close();
    
    // 3. Info
    notifications.toast('Paso 1 completado', 'info');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 4. Success
    notifications.toast('Paso 2 completado', 'success');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 5. Warning
    notifications.toast('Advertencia: Revisar datos', 'warning');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 6. Final success
    notifications.success('¡Todos los pasos completados correctamente!', '¡Éxito!');
  },

  // Probar todos los tipos en secuencia
  testAll: async () => {
    console.log('🧪 Iniciando prueba de notificaciones...');
    
    // Success
    notifications.toast('Probando Success...', 'success');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Error
    notifications.toast('Probando Error...', 'error');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Warning
    notifications.toast('Probando Warning...', 'warning');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Info
    notifications.toast('Probando Info...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Success modal
    notifications.success('Todas las notificaciones funcionan correctamente', '¡Prueba Completa!');
    
    console.log('✅ Prueba completada');
  }
};

// Hacer disponible globalmente en desarrollo
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).testNotifications = testNotifications;
  console.log('🧪 Sistema de notificaciones cargado. Usa testNotifications.testAll() para probar');
}

export default testNotifications;
