export interface HealthResult {
  ok: boolean;
  status: string;
  apiBase: string;
  detail?: string;
}

/** Consulta o endpoint /health da API. */
export async function checkHealth(apiBase: string): Promise<HealthResult> {
  try {
    const res = await fetch(`${apiBase}/health`);
    if (!res.ok) {
      return { ok: false, status: `HTTP ${res.status}`, apiBase };
    }
    const body = (await res.json()) as { status?: string };
    return { ok: body.status === 'ok', status: body.status ?? 'desconhecido', apiBase };
  } catch (err) {
    return { ok: false, status: 'inacessível', apiBase, detail: (err as Error).message };
  }
}
