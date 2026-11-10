"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { defaultPortfolioContent, mergePortfolioContent } from "../../lib/portfolio-content";
import { getSupabaseBrowserClient } from "../../lib/supabase-browser";

const tabs = ["PROFILE", "CONTACT", "SKILLS", "EXPERIENCE", "PROJECTS", "METRICS", "PASSWORD"];

export default function AdminPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState(null);
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("PROFILE");
  const [content, setContent] = useState(defaultPortfolioContent);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });

  useEffect(() => {
    if (!supabase) return undefined;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) { setSession(data.session); loadAdminData(data.session.user.id); }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession) loadAdminData(nextSession.user.id);
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, [supabase]);

  async function loadAdminData(userId) {
    if (!supabase) return;
    setBusy(true); setError("");
    const [{ data: contentRow, error: contentError }, { data: roleRow, error: roleError }] = await Promise.all([
      supabase.from("portfolio_content").select("content").eq("id", "main").maybeSingle(),
      supabase.from("portfolio_admins").select("role").eq("user_id", userId).maybeSingle(),
    ]);
    if (contentError || roleError) setError(contentError?.message || roleError?.message || "Unable to load admin data. Apply SUPABASE_SETUP.md first.");
    if (contentRow?.content) setContent(mergePortfolioContent(contentRow.content));
    if (roleRow?.role) setRole(roleRow.role);
    setBusy(false);
  }

  async function login(event) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError("");
    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    else if (data.session) { setSession(data.session); setPassword(""); }
    setBusy(false);
  }

  async function logout() { await supabase?.auth.signOut(); setSession(null); setRole(""); }

  async function saveContent(event) {
    event.preventDefault();
    if (!supabase || !session) return;
    setBusy(true); setError(""); setStatus("");
    const { error: saveError } = await supabase.from("portfolio_content").upsert({ id: "main", content, published: true, updated_at: new Date().toISOString(), updated_by: session.user.id });
    if (saveError) setError(saveError.message); else setStatus("Saved. Refresh the public portfolio to verify the published content.");
    setBusy(false);
  }

  async function changePassword(event) {
    event.preventDefault();
    if (!supabase || !session) return;
    if (passwordForm.next.length < 8 || passwordForm.next !== passwordForm.confirm) { setError("Use a matching password with at least 8 characters."); return; }
    setBusy(true); setError(""); setStatus("");
    const { error: reauthError } = await supabase.auth.signInWithPassword({ email: session.user.email, password: passwordForm.current });
    if (reauthError) setError("Current password could not be verified.");
    else {
      const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.next });
      if (updateError) setError(updateError.message); else { setPasswordForm({ current: "", next: "", confirm: "" }); setStatus("Password changed securely through Supabase Auth."); }
    }
    setBusy(false);
  }

  const update = (path, value) => setContent((current) => {
    const next = structuredClone(current);
    let target = next;
    path.slice(0, -1).forEach((key) => { target = target[key]; });
    target[path[path.length - 1]] = value;
    return next;
  });

  if (!supabase) return <SetupScreen />;
  if (!session) return <LoginScreen email={email} setEmail={setEmail} password={password} setPassword={setPassword} login={login} busy={busy} error={error} />;

  return <main className="admin-page"><div className="admin-dashboard">
    <header className="admin-head"><div><Link className="admin-back" href="/">← PORTFOLIO</Link><p className="admin-kicker">SBV / CONTENT CONTROL</p><h1>Admin <em>desk.</em></h1></div><div className="admin-user"><span>{session.user.email}</span><b>{role || "ADMIN"}</b><button onClick={logout}>LOG OUT</button></div></header>
    <nav className="admin-tabs" aria-label="Admin sections">{tabs.map((tab) => <button className={activeTab === tab ? "active" : ""} key={tab} onClick={() => { setActiveTab(tab); setError(""); setStatus(""); }}>{tab}</button>)}</nav>
    <form onSubmit={activeTab === "PASSWORD" ? changePassword : saveContent} className="admin-editor">
      {activeTab !== "PASSWORD" && <EditorSection tab={activeTab} content={content} update={update} />}
      {activeTab === "PASSWORD" && <PasswordEditor form={passwordForm} setForm={setPasswordForm} />}
      {(error || status) && <p className={error ? "admin-message error" : "admin-message"}>{error || status}</p>}
      <div className="admin-actions">{activeTab === "PASSWORD" ? <button className="admin-save" disabled={busy}>{busy ? "UPDATING…" : "CHANGE PASSWORD"}</button> : <button className="admin-save" disabled={busy}>{busy ? "SAVING…" : "SAVE PUBLISHED CONTENT"}</button>}</div>
    </form>
  </div></main>;
}

function LoginScreen({ email, setEmail, password, setPassword, login, busy, error }) {
  return <main className="admin-page"><div className="admin-panel admin-login"><Link className="admin-back" href="/">← BACK TO PORTFOLIO</Link><p className="admin-kicker">SBV / PRIVATE ACCESS</p><h1>Sign in to<br/><em>edit safely.</em></h1><form onSubmit={login}><label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>Password<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>{error && <p className="admin-message error">{error}</p>}<button className="admin-save" disabled={busy}>{busy ? "VERIFYING…" : "SIGN IN"}</button></form><p className="admin-note">Authentication and password hashing are handled by Supabase Auth.</p></div></main>;
}

function SetupScreen() {
  return <main className="admin-page"><div className="admin-panel"><Link className="admin-back" href="/">← BACK TO PORTFOLIO</Link><p className="admin-kicker">SBV / PRIVATE ACCESS</p><h1>Admin access<br/><em>needs setup.</em></h1><p className="admin-lede">Add the two Supabase public environment variables from <code>.env.example</code>, apply <code>supabase/schema.sql</code>, seed the content, and this page becomes the real login and editing desk.</p><div className="admin-status"><span>STATUS</span><b>SUPABASE CONFIGURATION REQUIRED</b></div><p className="admin-note">No password, hash, token, or service-role key is stored in this project.</p></div></main>;
}

function EditorSection({ tab, content, update }) {
  if (tab === "PROFILE") return <Section title="Profile"><Field label="Name" value={content.profile.name} onChange={(value) => update(["profile", "name"], value)} /><Field label="Role" value={content.profile.role} onChange={(value) => update(["profile", "role"], value)} /><Field label="Professional summary" value={content.profile.summary} onChange={(value) => update(["profile", "summary"], value)} area /><Field label="Experience" value={content.profile.experience} onChange={(value) => update(["profile", "experience"], value)} /><Field label="Domain" value={content.profile.domain} onChange={(value) => update(["profile", "domain"], value)} /></Section>;
  if (tab === "CONTACT") return <Section title="Contact"><Field label="Email" type="email" value={content.contact.email} onChange={(value) => update(["contact", "email"], value)} /><Field label="LinkedIn URL" type="url" value={content.contact.linkedin} onChange={(value) => update(["contact", "linkedin"], value)} /></Section>;
  if (tab === "METRICS") return <Section title="Verified metrics"><Field label="Automated test cases" value={content.metrics.automated} onChange={(value) => update(["metrics", "automated"], value)} /><Field label="Total test cases" value={content.metrics.total} onChange={(value) => update(["metrics", "total"], value)} /><Field label="Connected domains" value={content.metrics.domainCount} onChange={(value) => update(["metrics", "domainCount"], value)} /></Section>;
  if (tab === "SKILLS") return <Section title="Existing skills">{content.skills.map((skill, index) => <div className="admin-row" key={index}><Field label={`Skill ${index + 1}`} value={skill[0]} onChange={(value) => update(["skills", index, 0], value)} /><Field label="Description" value={skill[1]} onChange={(value) => update(["skills", index, 1], value)} /></div>)}</Section>;
  if (tab === "EXPERIENCE") return <Section title="Experience">{content.experienceEntries.map((entry, index) => <div className="admin-row" key={index}><Field label="Dates" value={entry.year} onChange={(value) => update(["experienceEntries", index, "year"], value)} /><Field label="Role" value={entry.role} onChange={(value) => update(["experienceEntries", index, "role"], value)} /><Field label="Company / detail" value={entry.detail} onChange={(value) => update(["experienceEntries", index, "detail"], value)} /></div>)}</Section>;
  return <Section title="Projects">{content.projects.map((project, index) => <div className="admin-project" key={index}><h2>Project {index + 1}</h2><Field label="Title" value={project.title} onChange={(value) => update(["projects", index, "title"], value)} /><Field label="Accent label" value={project.accent} onChange={(value) => update(["projects", index, "accent"], value)} /><Field label="Client" value={project.client} onChange={(value) => update(["projects", index, "client"], value)} /><Field label="Duration" value={project.duration} onChange={(value) => update(["projects", index, "duration"], value)} /><Field label="Role" value={project.role} onChange={(value) => update(["projects", index, "role"], value)} /><Field label="Description" value={project.description} onChange={(value) => update(["projects", index, "description"], value)} area /><Field label="Workflow" value={project.workflow} onChange={(value) => update(["projects", index, "workflow"], value)} /><Field label="Responsibilities" value={project.responsibilities} onChange={(value) => update(["projects", index, "responsibilities"], value)} /></div>)}</Section>;
}

function PasswordEditor({ form, setForm }) { return <Section title="Change password"><Field label="Current password" type="password" value={form.current} onChange={(value) => setForm({ ...form, current: value })} /><Field label="New password" type="password" value={form.next} onChange={(value) => setForm({ ...form, next: value })} /><Field label="Confirm new password" type="password" value={form.confirm} onChange={(value) => setForm({ ...form, confirm: value })} /></Section>; }
function Section({ title, children }) { return <section className="admin-section"><p className="admin-kicker">EDIT / {title.toUpperCase()}</p>{children}</section>; }
function Field({ label, value, onChange, type = "text", area = false }) { const Tag = area ? "textarea" : "input"; return <label className="admin-field">{label}<Tag type={area ? undefined : type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} rows={area ? 5 : undefined} /></label>; }
