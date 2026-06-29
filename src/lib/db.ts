import { supabase } from "./supabase";
import type {
  Transaction,
  Alert,
  User,
  PluggyAccount,
  WebhookLog,
  AuditLog,
  Company,
} from "../types";

// Data-access layer (Track B). Maps Supabase rows (snake_case) to the app's
// camelCase types and back. All reads/writes go through RLS, so a user only
// sees rows for companies they belong to.

// ---------- mappers: DB row -> app type ----------
const toTransaction = (r: any): Transaction => ({
  id: r.id,
  description: r.description,
  bank: r.bank ?? "",
  bankCode: r.bank_code ?? "",
  direction: r.direction,
  status: r.status,
  value: Number(r.value),
  date: r.date,
  reference: r.reference ?? "",
  category: r.category ?? "",
  score: r.score != null ? Number(r.score) : undefined,
  externalId: r.external_id ?? undefined,
  matchedId: r.matched_id ?? undefined,
  companyCnpj: r.company_cnpj ?? undefined,
});

const toAlert = (r: any): Alert => ({
  id: r.id,
  title: r.title,
  description: r.description ?? "",
  level: r.level,
  status: r.status,
  category: r.category ?? "",
  date: r.date,
  actionUrl: r.action_url ?? undefined,
  snoozedUntil: r.snoozed_until ?? undefined,
  companyCnpj: r.company_cnpj ?? undefined,
});

const toAccount = (r: any): PluggyAccount => ({
  id: r.id,
  name: r.name,
  type: r.type,
  bankName: r.bank_name ?? "",
  balance: Number(r.balance),
  syncStatus: r.sync_status,
  lastSync: r.last_sync ?? "",
  companyCnpj: r.company_cnpj ?? undefined,
});

const toCompany = (r: any): Company => ({
  cnpj: r.cnpj,
  razaoSocial: r.razao_social,
  nomeFantasia: r.nome_fantasia ?? "",
  regime: r.regime ?? "",
  minBalanceAlert: Number(r.min_balance_alert),
  timezone: r.timezone ?? "America/Sao_Paulo",
  certificateUploaded: !!r.certificate_uploaded,
  certificateExpiry: r.certificate_expiry ?? undefined,
  logo: r.logo ?? undefined,
});

export const toUser = (r: any): User => ({
  id: r.id,
  name: r.name ?? "",
  email: r.email ?? "",
  avatar:
    r.avatar ||
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100",
  role: r.role,
  status: r.status,
  lastActive: r.last_active ? new Date(r.last_active).toLocaleString("pt-BR") : "Agora mesmo",
  lastIp: r.last_ip ?? "",
  device: r.device ?? "Navegador Web",
});

const toWebhookLog = (r: any): WebhookLog => ({
  id: r.id,
  url: r.url,
  event: r.event ?? "",
  status: r.status,
  timestamp: r.timestamp,
  duration: r.duration ?? 0,
  statusCode: r.status_code ?? 0,
});

const toAuditLog = (r: any): AuditLog => ({
  id: r.id,
  userId: r.user_id ?? "",
  userName: r.user_name ?? "",
  action: r.action,
  details: r.details ?? "",
  timestamp: r.timestamp,
  ip: r.ip ?? "",
});

export interface IntegrationSetting {
  id: string;
  companyCnpj: string;
  kind: "bank_api" | "erp" | "webhook" | "notifications";
  ref: string;
  config: any;
  status?: string;
}

export interface TeamInvite {
  id: string;
  email: string;
  name?: string;
  role: string;
  companyCnpj?: string;
  status: string;
}

const toIntegration = (r: any): IntegrationSetting => ({
  id: r.id,
  companyCnpj: r.company_cnpj,
  kind: r.kind,
  ref: r.ref ?? "",
  config: r.config ?? {},
  status: r.status ?? undefined,
});

const toInvite = (r: any): TeamInvite => ({
  id: r.id,
  email: r.email,
  name: r.name ?? undefined,
  role: r.role,
  companyCnpj: r.company_cnpj ?? undefined,
  status: r.status,
});

export interface Registry {
  id: string;
  companyCnpj?: string;
  description: string;
  direction: "inflow" | "outflow";
  value: number;
  dueDate: string;
  bank: string;
  category: string;
  recurrence: "single" | "monthly" | "yearly";
  status: "pending" | "realized";
  documentNumber?: string;
}

const toRegistry = (r: any): Registry => ({
  id: r.id,
  companyCnpj: r.company_cnpj ?? undefined,
  description: r.description,
  direction: r.direction,
  value: Number(r.value),
  dueDate: r.due_date ?? "",
  bank: r.bank ?? "",
  category: r.category ?? "",
  recurrence: r.recurrence ?? "single",
  status: r.status ?? "pending",
  documentNumber: r.document_number ?? undefined,
});

// ---------- reads ----------
export async function fetchAll() {
  const [companies, transactions, alerts, accounts, users, audit, webhooks, integrations, invites, registries] =
    await Promise.all([
      supabase.from("companies").select("*").order("razao_social"),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("alerts").select("*").order("date", { ascending: false }),
      supabase.from("accounts").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }),
      supabase.from("webhook_logs").select("*").order("timestamp", { ascending: false }),
      supabase.from("integration_settings").select("*"),
      supabase.from("team_invites").select("*").order("created_at", { ascending: false }),
      supabase.from("registries").select("*").order("due_date", { ascending: true }),
    ]);

  return {
    companies: (companies.data ?? []).map(toCompany),
    transactions: (transactions.data ?? []).map(toTransaction),
    alerts: (alerts.data ?? []).map(toAlert),
    accounts: (accounts.data ?? []).map(toAccount),
    users: (users.data ?? []).map(toUser),
    auditLogs: (audit.data ?? []).map(toAuditLog),
    webhookLogs: (webhooks.data ?? []).map(toWebhookLog),
    integrationSettings: (integrations.data ?? []).map(toIntegration),
    invites: (invites.data ?? []).map(toInvite),
    registries: (registries.data ?? []).map(toRegistry),
  };
}

export async function insertRegistry(item: Registry, companyCnpj: string): Promise<Registry> {
  const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
  const { data, error } = await supabase
    .from("registries")
    .insert({
      company_cnpj: companyCnpj,
      description: item.description,
      direction: item.direction,
      value: item.value,
      due_date: item.dueDate || null,
      bank: item.bank,
      category: item.category,
      recurrence: item.recurrence,
      status: item.status || "pending",
      document_number: item.documentNumber ?? null,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;
  return toRegistry(data);
}

export async function deleteRegistry(id: string) {
  const { error } = await supabase.from("registries").delete().eq("id", id);
  if (error) throw error;
}

export async function updateRegistryStatus(id: string, status: string) {
  const { error } = await supabase.from("registries").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function upsertIntegration(
  companyCnpj: string,
  kind: IntegrationSetting["kind"],
  ref: string,
  config: any,
  status?: string,
): Promise<IntegrationSetting> {
  const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
  const { data, error } = await supabase
    .from("integration_settings")
    .upsert(
      { company_cnpj: companyCnpj, kind, ref: ref || "", config, status: status ?? null, updated_by: userId, updated_at: new Date().toISOString() },
      { onConflict: "company_cnpj,kind,ref" },
    )
    .select()
    .single();
  if (error) throw error;
  return toIntegration(data);
}

export async function createInvite(invite: {
  email: string;
  name?: string;
  role: string;
  companyCnpj: string;
}): Promise<TeamInvite> {
  const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
  const { data, error } = await supabase
    .from("team_invites")
    .upsert(
      { email: invite.email.toLowerCase(), name: invite.name, role: invite.role, company_cnpj: invite.companyCnpj, invited_by: userId, status: "pending" },
      { onConflict: "email,company_cnpj" },
    )
    .select()
    .single();
  if (error) throw error;
  return toInvite(data);
}

// ---------- writes ----------
export async function insertTransaction(tx: Transaction): Promise<Transaction> {
  const { data, error } = await supabase
    .from("transactions")
    .insert({
      company_cnpj: tx.companyCnpj,
      description: tx.description,
      bank: tx.bank,
      bank_code: tx.bankCode,
      direction: tx.direction,
      status: tx.status,
      value: tx.value,
      date: tx.date,
      reference: tx.reference,
      category: tx.category,
      score: tx.score ?? null,
      external_id: tx.externalId ?? null,
      created_by: (await supabase.auth.getUser()).data.user?.id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toTransaction(data);
}

export async function updateTransactionStatus(id: string, status: string) {
  const { error } = await supabase.from("transactions").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function resolveAlert(id: string) {
  const { error } = await supabase.from("alerts").update({ status: "resolved" }).eq("id", id);
  if (error) throw error;
}

export async function snoozeAlert(id: string, snoozedUntilIso: string) {
  const { error } = await supabase
    .from("alerts")
    .update({ status: "snoozed", snoozed_until: snoozedUntilIso })
    .eq("id", id);
  if (error) throw error;
}

export async function insertCompany(c: Company): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .insert({
      cnpj: c.cnpj,
      razao_social: c.razaoSocial,
      nome_fantasia: c.nomeFantasia,
      regime: c.regime,
      min_balance_alert: c.minBalanceAlert,
      timezone: c.timezone,
      certificate_uploaded: c.certificateUploaded,
      certificate_expiry: c.certificateExpiry ?? null,
      logo: c.logo ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return toCompany(data);
}

export async function deleteCompany(cnpj: string) {
  const { error } = await supabase.from("companies").delete().eq("cnpj", cnpj);
  if (error) throw error;
}

export async function updateCompany(c: Company): Promise<Company> {
  const { data, error } = await supabase
    .from("companies")
    .update({
      razao_social: c.razaoSocial,
      nome_fantasia: c.nomeFantasia,
      regime: c.regime,
      min_balance_alert: c.minBalanceAlert,
      timezone: c.timezone,
      certificate_uploaded: c.certificateUploaded,
      certificate_expiry: c.certificateExpiry ?? null,
      logo: c.logo ?? null,
    })
    .eq("cnpj", c.cnpj)
    .select()
    .single();
  if (error) throw error;
  return toCompany(data);
}

export async function insertAccount(a: PluggyAccount): Promise<PluggyAccount> {
  const { data, error } = await supabase
    .from("accounts")
    .insert({
      company_cnpj: a.companyCnpj,
      name: a.name,
      type: a.type,
      bank_name: a.bankName,
      balance: a.balance,
      sync_status: a.syncStatus,
      last_sync: a.lastSync,
    })
    .select()
    .single();
  if (error) throw error;
  return toAccount(data);
}

export async function deleteAccount(id: string) {
  const { error } = await supabase.from("accounts").delete().eq("id", id);
  if (error) throw error;
}

export async function updateUserRole(id: string, role: string) {
  const { error } = await supabase.from("profiles").update({ role }).eq("id", id);
  if (error) throw error;
}

export async function updateUserStatus(id: string, status: string) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function insertAudit(entry: {
  userId: string;
  userName: string;
  action: string;
  details: string;
}) {
  const { error } = await supabase.from("audit_logs").insert({
    user_id: entry.userId,
    user_name: entry.userName,
    action: entry.action,
    details: entry.details,
  });
  if (error) console.error("audit insert failed", error);
}

export async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error || !data) return null;
  return toUser(data);
}

// ---------- multi-tenant ----------
export interface Tenant {
  id: string;
  name: string;
  status: string;          // trialing | active | past_due | suspended | canceled
  trialEndsAt?: string;
  plan?: { code: string; name: string; price_cents?: number; limits?: any };
}

export async function fetchCurrentTenant(userId: string): Promise<Tenant | null> {
  const { data: prof } = await supabase.from("profiles").select("tenant_id").eq("id", userId).single();
  if (!prof?.tenant_id) return null;
  const { data } = await supabase
    .from("tenants")
    .select("id,name,status,trial_ends_at, plan:plans(code,name,price_cents,limits)")
    .eq("id", prof.tenant_id)
    .single();
  if (!data) return null;
  const plan = Array.isArray((data as any).plan) ? (data as any).plan[0] : (data as any).plan;
  return { id: data.id, name: data.name, status: data.status, trialEndsAt: (data as any).trial_ends_at ?? undefined, plan };
}

// Backoffice (super-admin): tenants + plans + financial KPIs + per-tenant usage.
export async function fetchBackoffice() {
  const [tenants, plans, profs, invoices, txs, companies] = await Promise.all([
    supabase.from("tenants").select("*").order("created_at"),
    supabase.from("plans").select("*").order("price_cents"),
    supabase.from("profiles").select("id,email,name,tenant_id,role,is_super_admin"),
    supabase.from("invoices").select("tenant_id,amount_cents,status"),
    supabase.from("transactions").select("tenant_id"),
    supabase.from("companies").select("tenant_id"),
  ]);
  const planById = new Map((plans.data ?? []).map((p: any) => [p.id, p]));
  const profList = profs.data ?? [];
  const superIds = new Set(profList.filter((p: any) => p.is_super_admin).map((p: any) => p.id));
  const inv = invoices.data ?? [];
  const txList = txs.data ?? [];
  const coList = companies.data ?? [];

  const tenantList = (tenants.data ?? []).map((t: any) => ({
    id: t.id, name: t.name, status: t.status, planId: t.plan_id,
    trialEndsAt: t.trial_ends_at, pastDueSince: t.past_due_since, createdAt: t.created_at,
    plan: planById.get(t.plan_id) || null,
    owner: profList.find((p: any) => p.id === t.owner_id) || null,
    internal: superIds.has(t.owner_id),
    userCount: profList.filter((p: any) => p.tenant_id === t.id).length,
    txCount: txList.filter((x: any) => x.tenant_id === t.id).length,
    companyCount: coList.filter((x: any) => x.tenant_id === t.id).length,
  }));

  // Financial KPIs consider customer tenants only (exclude internal/super-admin tenants).
  const customers = tenantList.filter((t) => !t.internal);
  const active = customers.filter((t) => t.status === "active");
  const finance = {
    mrr: active.reduce((s, t) => s + (t.plan?.price_cents || 0), 0),
    active: active.length,
    trialing: customers.filter((t) => t.status === "trialing").length,
    pastDue: customers.filter((t) => t.status === "past_due").length,
    suspended: customers.filter((t) => t.status === "suspended").length,
    customers: customers.length,
    received: inv.filter((i: any) => i.status === "paid").reduce((s: number, i: any) => s + (i.amount_cents || 0), 0),
    open: inv.filter((i: any) => i.status === "open" || i.status === "overdue").reduce((s: number, i: any) => s + (i.amount_cents || 0), 0),
  };
  return { tenants: tenantList, plans: (plans.data ?? []) as any[], finance };
}

export async function updateTenantFields(id: string, fields: Record<string, any>) {
  const { error } = await supabase.from("tenants").update(fields).eq("id", id);
  if (error) throw error;
}

export async function savePlan(p: { id?: string; code: string; name: string; price_cents: number; limits: any; active: boolean }) {
  const { error } = await supabase.from("plans").upsert(p, { onConflict: "code" });
  if (error) throw error;
}

// ---------- F4: tickets ----------
export interface Ticket {
  id: string; tenantId: string; subject: string; status: string; priority: string;
  createdAt: string; tenantName?: string;
}
const unwrap = (v: any) => (Array.isArray(v) ? v[0] : v);

export async function fetchTickets(): Promise<Ticket[]> {
  const { data, error } = await supabase
    .from("tickets").select("*, tenant:tenants(name)").order("updated_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map((t: any) => ({
    id: t.id, tenantId: t.tenant_id, subject: t.subject, status: t.status, priority: t.priority,
    createdAt: t.created_at, tenantName: unwrap(t.tenant)?.name,
  }));
}

export async function createTicket(subject: string, priority = "normal"): Promise<Ticket> {
  const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
  const { data, error } = await supabase
    .from("tickets").insert({ subject, priority, created_by: uid }).select("*, tenant:tenants(name)").single();
  if (error) throw error;
  return { id: data.id, tenantId: data.tenant_id, subject: data.subject, status: data.status, priority: data.priority, createdAt: data.created_at, tenantName: unwrap(data.tenant)?.name };
}

export async function fetchTicketMessages(ticketId: string) {
  const { data, error } = await supabase
    .from("ticket_messages").select("*").eq("ticket_id", ticketId).order("created_at");
  if (error) return [];
  return (data ?? []).map((m: any) => ({ id: m.id, authorId: m.author_id, body: m.body, internal: m.internal, createdAt: m.created_at }));
}

export async function addTicketMessage(ticketId: string, tenantId: string, body: string, internal = false) {
  const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
  const { error } = await supabase.from("ticket_messages").insert({ ticket_id: ticketId, tenant_id: tenantId, author_id: uid, body, internal });
  if (error) throw error;
  await supabase.from("tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId);
}

export async function updateTicketStatus(id: string, status: string) {
  const { error } = await supabase.from("tickets").update({ status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ---------- F4: metering ----------
export async function recordUsage(kind: string, qty = 1) {
  try { await supabase.from("usage_events").insert({ kind, qty }); } catch { /* ignore */ }
}

// Current-month usage per tenant, keyed by tenant_id -> { kind: total }.
export async function fetchUsageThisMonth(): Promise<Record<string, Record<string, number>>> {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
  const { data, error } = await supabase.from("usage_events").select("tenant_id,kind,qty").gte("created_at", start.toISOString());
  if (error) return {};
  const map: Record<string, Record<string, number>> = {};
  for (const r of data as any[]) {
    map[r.tenant_id] = map[r.tenant_id] || {};
    map[r.tenant_id][r.kind] = (map[r.tenant_id][r.kind] || 0) + (r.qty || 0);
  }
  return map;
}

// Fase 0 activation/conversion funnel (super-admin / backoffice).
export async function fetchActivation() {
  const [tenants, profs, usage] = await Promise.all([
    supabase.from("tenants").select("id,status,owner_id,created_at"),
    supabase.from("profiles").select("id,is_super_admin"),
    supabase.from("usage_events").select("tenant_id,kind"),
  ]);
  const superIds = new Set((profs.data ?? []).filter((p: any) => p.is_super_admin).map((p: any) => p.id));
  const byTenant: Record<string, Set<string>> = {};
  for (const u of (usage.data ?? []) as any[]) {
    (byTenant[u.tenant_id] ||= new Set()).add(u.kind);
  }
  const customers = (tenants.data ?? []).filter((t: any) => !superIds.has(t.owner_id));
  const has = (id: string, k: string) => byTenant[id]?.has(k);
  return {
    customers: customers.length,
    imported: customers.filter((t: any) => has(t.id, "ai_import")).length,
    reconciled: customers.filter((t: any) => has(t.id, "reconciled")).length,
    activated: customers.filter((t: any) => has(t.id, "ai_import") && has(t.id, "reconciled")).length,
    paying: customers.filter((t: any) => t.status === "active").length,
  };
}

// ---------- F4: impersonation (read-only) ----------
export async function logImpersonation(tenantId: string, reason?: string) {
  const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
  try { await supabase.from("impersonation_logs").insert({ super_admin_id: uid, tenant_id: tenantId, reason: reason ?? null }); } catch { /* ignore */ }
}

export async function fetchTenantSnapshot(tenantId: string) {
  const [companies, txs, accounts, users] = await Promise.all([
    supabase.from("companies").select("*").eq("tenant_id", tenantId),
    supabase.from("transactions").select("*").eq("tenant_id", tenantId).order("date", { ascending: false }).limit(25),
    supabase.from("accounts").select("*").eq("tenant_id", tenantId),
    supabase.from("profiles").select("id,email,name,role,status").eq("tenant_id", tenantId),
  ]);
  return {
    companies: (companies.data ?? []).map(toCompany),
    transactions: (txs.data ?? []).map(toTransaction),
    accounts: (accounts.data ?? []).map(toAccount),
    users: (users.data ?? []).map(toUser),
  };
}
