import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ConfiguracionPage from '../components/admin/ConfiguracionPage';
import { vi, beforeEach, describe, expect, it } from 'vitest';

const mockFetchCached = vi.fn();
const mockInvalidateCache = vi.fn();
const mockApiGet = vi.fn();
const mockApiPost = vi.fn();
const mockApiPut = vi.fn();

vi.mock('../lib/fetcher', () => ({
  fetchCached: (...args: unknown[]) => mockFetchCached(...args),
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
}));

vi.mock('../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    put: (...args: unknown[]) => mockApiPut(...args),
  },
}));

const settingsFixture = {
  companyName: 'Llanogas',
  companyEmail: 'contacto@llanogas.com',
  companyPhone: '+57',
  companyAddress: 'Calle 123',
  smtpHost: 'smtp.example.com',
  smtpPort: 587,
  smtpUsername: 'user@example.com',
  smtpPassword: '********',
  smtpFromEmail: 'noreply@example.com',
  smtpFromName: 'Llanogas',
  smtpEnabled: true,
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
};

const alertRulesFixture = {
  primera: { dias: 7, mensaje: 'Primera alerta', activo: true },
  preventiva: { dias: 3, mensaje: 'Alerta preventiva', activo: true },
  urgente: { dias: 1, mensaje: 'Alerta urgente', activo: true },
  updatedAt: '2024-12-01T10:00:00Z',
};

beforeEach(() => {
  mockFetchCached.mockImplementation((key: string) => {
    if (key === 'systemSettings') return Promise.resolve(settingsFixture);
    if (key === 'alertRules') return Promise.resolve(alertRulesFixture);
    return Promise.resolve(null);
  });
  mockInvalidateCache.mockReset();
  mockApiGet.mockReset();
  mockApiPost.mockReset();
  mockApiPut.mockReset();
  mockApiGet.mockResolvedValue({ data: { source: 'database' } });
  mockApiPost.mockResolvedValue({ data: { success: true } });
  mockApiPut.mockResolvedValue({ data: { data: settingsFixture } });
});

describe('ConfiguracionPage', () => {
  it('permite navegar entre pestañas sin recargar', async () => {
    render(<ConfiguracionPage />);
    await screen.findByText('Información de la empresa');

    fireEvent.click(screen.getByRole('tab', { name: 'SMTP' }));
    await waitFor(() => expect(screen.getByLabelText('Servidor SMTP')).toBeInTheDocument());
    expect(screen.queryByText('Información de la empresa')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: 'Alertas' }));
    await waitFor(() => expect(screen.getByText('Reglas de alertas')).toBeInTheDocument());
  });

  it('no muestra botón de restaurar ni disclaimer de cache', async () => {
    render(<ConfiguracionPage />);
    await screen.findByText('Información de la empresa');

    expect(screen.queryByText(/Restaurar desde cache/i)).toBeNull();
    expect(screen.queryByText(/Cache local/i)).toBeNull();
  });

  it('mantiene Guardar deshabilitado hasta que smtp/test responde ok', async () => {
    render(<ConfiguracionPage />);
    await screen.findByText('Información de la empresa');

    const saveButton = screen.getByRole('button', { name: /Guardar configuración/i });
    expect(saveButton).toBeDisabled();

    fireEvent.click(screen.getByRole('tab', { name: 'SMTP' }));
    await screen.findByLabelText('Servidor SMTP');

    mockApiPost.mockResolvedValueOnce({ data: { success: false, message: 'fail' } });
    fireEvent.click(screen.getByRole('button', { name: /Probar conexión/i }));
    await waitFor(() => expect(mockApiPost).toHaveBeenCalled());
    expect(saveButton).toBeDisabled();

    mockApiPost.mockResolvedValueOnce({ data: { success: true } });
    fireEvent.click(screen.getByRole('button', { name: /Probar conexión/i }));
    await waitFor(() => expect(saveButton).not.toBeDisabled());
  });
});
