import { createRoot } from 'react-dom/client';
import MisReportesPage from '../../components/pages/MisReportesPage';

const container = document.getElementById('mis-reportes-root');
if (container) {
  const root = createRoot(container);
  root.render(<MisReportesPage />);
}
