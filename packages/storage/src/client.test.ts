import { describe, expect, it } from 'vitest';
import { createStorageService, StorageService, StorageDisabledError } from './client.js';

const baseEnv = {
  STORAGE_PROVIDER: 'minio',
  MINIO_ENDPOINT: 'http://localhost:9100',
  MINIO_ACCESS_KEY: 'minioadmin',
  MINIO_SECRET_KEY: 'minioadmin',
  MINIO_BUCKET: 'informatizou',
};

describe('StorageService', () => {
  it('cria serviço habilitado a partir do env', () => {
    const svc = createStorageService(baseEnv);
    expect(svc).toBeInstanceOf(StorageService);
    expect(svc.enabled).toBe(true);
    expect(svc.bucket).toBe('informatizou');
  });

  it('não conecta ao ser construído (conexão preguiçosa)', () => {
    // Não deve lançar mesmo sem MinIO no ar.
    expect(() => createStorageService(baseEnv)).not.toThrow();
  });

  it('provider disabled recusa operações', async () => {
    const svc = createStorageService({ ...baseEnv, STORAGE_PROVIDER: 'disabled' });
    expect(svc.enabled).toBe(false);
    await expect(svc.ensureBucket()).rejects.toBeInstanceOf(StorageDisabledError);
  });
});
