import { AuthProvider } from '../../lib/contexts/AuthContext';
import MisTareasClient from './MisTareasClient';

export default function MisTareasPage() {
  return (
    <AuthProvider>
      <MisTareasClient />
    </AuthProvider>
  );
}
