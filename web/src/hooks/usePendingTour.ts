import { useEffect } from "react";
import { useResponsableManual } from "../lib/manual/responsableManual";

/**
 * Hook para verificar y ejecutar tours pendientes después de navegación.
 * Debe usarse en componentes que pueden ser destino de tours con navegación automática.
 */
export function usePendingTour() {
  const manual = useResponsableManual();

  useEffect(() => {
    // Verificar si hay un tour pendiente después de la navegación
    manual.checkPendingTour();
  }, [manual]);
}
