import { UserRole } from '@informatizou/shared';

/**
 * Ações de autorização da plataforma. Derivadas das capacidades por perfil (spec §6).
 * Mantido como união de strings para checagem simples e extensível.
 */
export type Action =
  | 'platform.configure'
  | 'users.manage'
  | 'integrations.configure'
  | 'costs.view'
  | 'logs.view'
  | 'audit.view'
  | 'data.delete'
  | 'rules.change'
  | 'campaigns.create'
  | 'campaigns.run'
  | 'leads.approve'
  | 'leads.reject'
  | 'leads.assign'
  | 'leads.viewAll'
  | 'leads.viewAssigned'
  | 'leads.movePipeline'
  | 'demos.generate'
  | 'demos.publish'
  | 'demos.approveReject'
  | 'messages.approve'
  | 'messages.edit'
  | 'contacts.perform'
  | 'contacts.approve'
  | 'activities.register'
  | 'reports.generate'
  | 'sales.track'
  | 'data.review'
  | 'images.review'
  | 'content.review'
  | 'view';

const MANAGER_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'campaigns.create',
  'campaigns.run',
  'leads.approve',
  'leads.reject',
  'leads.assign',
  'leads.viewAll',
  'leads.viewAssigned',
  'leads.movePipeline',
  'demos.generate',
  'demos.publish',
  'demos.approveReject',
  'messages.approve',
  'messages.edit',
  'contacts.approve',
  'reports.generate',
  'sales.track',
  'data.review',
  'content.review',
  'costs.view',
  'view',
]);

const SALES_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'leads.viewAssigned',
  'leads.movePipeline',
  'messages.edit',
  'contacts.perform',
  'activities.register',
  'view',
]);

const REVIEWER_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  'data.review',
  'images.review',
  'content.review',
  'demos.approveReject',
  'leads.viewAll',
  'view',
]);

const VIEWER_ACTIONS: ReadonlySet<Action> = new Set<Action>(['view']);

const ROLE_ACTIONS: Record<UserRole, ReadonlySet<Action> | 'ALL'> = {
  [UserRole.ADMIN]: 'ALL',
  [UserRole.MANAGER]: MANAGER_ACTIONS,
  [UserRole.SALES]: SALES_ACTIONS,
  [UserRole.REVIEWER]: REVIEWER_ACTIONS,
  [UserRole.VIEWER]: VIEWER_ACTIONS,
};

/** Retorna true se o perfil pode executar a ação. ADMIN pode tudo. */
export function can(role: UserRole, action: Action): boolean {
  const allowed = ROLE_ACTIONS[role];
  if (allowed === 'ALL') return true;
  return allowed.has(action);
}

/** Lança se o perfil não puder executar a ação. */
export class AuthorizationError extends Error {
  constructor(role: UserRole, action: Action) {
    super(`perfil ${role} não autorizado para a ação ${action}`);
    this.name = 'AuthorizationError';
  }
}

export function assertCan(role: UserRole, action: Action): void {
  if (!can(role, action)) {
    throw new AuthorizationError(role, action);
  }
}
