import { AuthProvider } from '../../lib/contexts/AuthContext';
import SupervisorCalendarioClient from './SupervisorCalendarioClient';

export default function SupervisorCalendarioPage() {
  return (
    <AuthProvider>
      <SupervisorCalendarioClient />
    </AuthProvider>
  );
}
