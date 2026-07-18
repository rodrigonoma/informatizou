import { describe, expect, it } from 'vitest';
import { UserRole } from '@informatizou/shared';
import { can, assertCan, AuthorizationError } from './rbac.js';

describe('rbac.can', () => {
  it('ADMIN pode tudo', () => {
    expect(can(UserRole.ADMIN, 'users.manage')).toBe(true);
    expect(can(UserRole.ADMIN, 'data.delete')).toBe(true);
    expect(can(UserRole.ADMIN, 'integrations.configure')).toBe(true);
  });

  it('VIEWER só visualiza', () => {
    expect(can(UserRole.VIEWER, 'view')).toBe(true);
    expect(can(UserRole.VIEWER, 'users.manage')).toBe(false);
    expect(can(UserRole.VIEWER, 'campaigns.create')).toBe(false);
  });

  it('MANAGER cria campanhas e aprova, mas não gerencia usuários', () => {
    expect(can(UserRole.MANAGER, 'campaigns.create')).toBe(true);
    expect(can(UserRole.MANAGER, 'messages.approve')).toBe(true);
    expect(can(UserRole.MANAGER, 'users.manage')).toBe(false);
    expect(can(UserRole.MANAGER, 'platform.configure')).toBe(false);
  });

  it('SALES move pipeline e edita mensagens, mas não aprova contato', () => {
    expect(can(UserRole.SALES, 'leads.movePipeline')).toBe(true);
    expect(can(UserRole.SALES, 'messages.edit')).toBe(true);
    expect(can(UserRole.SALES, 'contacts.approve')).toBe(false);
    expect(can(UserRole.SALES, 'campaigns.create')).toBe(false);
  });

  it('REVIEWER revisa e aprova/rejeita demos', () => {
    expect(can(UserRole.REVIEWER, 'content.review')).toBe(true);
    expect(can(UserRole.REVIEWER, 'demos.approveReject')).toBe(true);
    expect(can(UserRole.REVIEWER, 'campaigns.create')).toBe(false);
  });

  it('assertCan lança AuthorizationError quando negado', () => {
    expect(() => assertCan(UserRole.VIEWER, 'data.delete')).toThrow(AuthorizationError);
    expect(() => assertCan(UserRole.ADMIN, 'data.delete')).not.toThrow();
  });
});
