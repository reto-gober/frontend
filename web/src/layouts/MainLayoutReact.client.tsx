import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from '../lib/contexts/AuthContext';
import { Sidebar } from '../components/common/Sidebar';

const container = document.getElementById('app-root');
if (container) {
  const root = createRoot(container);
  
  root.render(
    <AuthProvider>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ 
          flex: 1, 
          marginLeft: '280px',
          minHeight: '100vh',
          backgroundColor: 'var(--color-background)'
        }}>
          <div id="content-root"></div>
        </main>
      </div>
    </AuthProvider>
  );
}
