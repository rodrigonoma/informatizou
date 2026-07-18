import { Client as MinioClient } from 'minio';
import { createLogger } from '@informatizou/logging';

const log = createLogger({ name: 'storage' });

export interface StorageConfig {
  provider: string; // 'minio' | 's3' | 'disabled'
  endpoint: string; // ex.: http://localhost:9100
  accessKey: string;
  secretKey: string;
  bucket: string;
  region?: string;
}

export class StorageDisabledError extends Error {
  constructor() {
    super('Storage desabilitado (STORAGE_PROVIDER=disabled)');
    this.name = 'StorageDisabledError';
  }
}

/** Interpreta a URL de endpoint em host/port/ssl para o client MinIO. */
function parseEndpoint(endpoint: string): { endPoint: string; port: number; useSSL: boolean } {
  const url = new URL(endpoint);
  const useSSL = url.protocol === 'https:';
  const port = url.port ? Number(url.port) : useSSL ? 443 : 80;
  return { endPoint: url.hostname, port, useSSL };
}

/**
 * Wrapper de armazenamento S3-compatível (MinIO). A conexão é preguiçosa: o
 * client só é criado quando usado, então importar este módulo não exige MinIO no ar.
 */
export class StorageService {
  private client: MinioClient | null = null;
  private readonly config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  get enabled(): boolean {
    return this.config.provider !== 'disabled';
  }

  get bucket(): string {
    return this.config.bucket;
  }

  private getClient(): MinioClient {
    if (!this.enabled) {
      throw new StorageDisabledError();
    }
    if (!this.client) {
      const { endPoint, port, useSSL } = parseEndpoint(this.config.endpoint);
      this.client = new MinioClient({
        endPoint,
        port,
        useSSL,
        accessKey: this.config.accessKey,
        secretKey: this.config.secretKey,
        region: this.config.region,
      });
    }
    return this.client;
  }

  /** Garante que o bucket exista (idempotente). */
  async ensureBucket(): Promise<void> {
    const client = this.getClient();
    const exists = await client.bucketExists(this.config.bucket).catch(() => false);
    if (!exists) {
      await client.makeBucket(this.config.bucket, this.config.region ?? 'us-east-1');
      log.info({ bucket: this.config.bucket }, 'bucket criado');
    }
  }

  /** Faz upload de um objeto e retorna a chave armazenada. */
  async putObject(
    key: string,
    body: Buffer | string,
    contentType = 'application/octet-stream',
  ): Promise<string> {
    const client = this.getClient();
    const buffer = typeof body === 'string' ? Buffer.from(body) : body;
    await client.putObject(this.config.bucket, key, buffer, buffer.length, {
      'Content-Type': contentType,
    });
    log.debug({ bucket: this.config.bucket, key }, 'objeto enviado');
    return key;
  }

  /** Gera uma URL assinada temporária para leitura. */
  async getPresignedUrl(key: string, expirySeconds = 3600): Promise<string> {
    const client = this.getClient();
    return client.presignedGetObject(this.config.bucket, key, expirySeconds);
  }
}

export interface StorageEnv {
  STORAGE_PROVIDER: string;
  MINIO_ENDPOINT: string;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_BUCKET: string;
}

export function createStorageService(env: StorageEnv): StorageService {
  return new StorageService({
    provider: env.STORAGE_PROVIDER,
    endpoint: env.MINIO_ENDPOINT,
    accessKey: env.MINIO_ACCESS_KEY,
    secretKey: env.MINIO_SECRET_KEY,
    bucket: env.MINIO_BUCKET,
  });
}
