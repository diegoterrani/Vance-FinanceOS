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

// ---------- reads ----------
export async function fetchAll() {
  const [companies, transactions, alerts, accounts, users, audit, webhooks] =
    await Promise.all([
      supabase.from("companies").select("*").order("razao_social"),
      supabase.from("transactions").select("*").order("date", { ascending: false }),
      supabase.from("alerts").select("*").order("date", { ascending: false }),
      supabase.from("accounts").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("audit_logs").select("*").order("timestamp", { ascending: false }),
      supabase.from("webhook_logs").select("*").order("timestamp", { ascending: false }),
    ]);

  return {
    companies: (companies.data ?? []).map(toCompany),
    transactions: (transactions.data ?? []).map(toTransaction),
    alerts: (alerts.data ?? []).map(toAlert),
    accounts: (accounts.data ?? []).map(toAccount),
    users: (users.data ?? []).map(toUser),
    auditLogs: (audit.data ?? []).map(toAuditLog),
    webhookLogs: (webhooks.data ?? []).map(toWebhookLog),
  };
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
