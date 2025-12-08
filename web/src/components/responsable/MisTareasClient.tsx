import MisReportesClient from "./MisReportesClient";

// Reuse MisReportesClient functionality but hide the top header/title for Mis Tareas.
export default function MisTareasClient() {
  return (
    <div className="mis-tareas-wrapper">
      <MisReportesClient />
      <style>{`
				/* Oculta encabezado/título propio de Mis Reportes en esta vista */
				.mis-tareas-wrapper .mis-reportes-page .page-header {
					display: none;
				}
			`}</style>
    </div>
  );
}