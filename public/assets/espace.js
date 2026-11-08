import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Arrondi des surfaces : partie décimale > 0,50 → m² supérieur ; sinon m² inférieur.
const arrondi = (v) => { const n = Number(v); const e = Math.floor(n); return Math.round((n - e) * 100) > 50 ? e + 1 : e; };
const m2 = (v) => (v == null ? '—' : arrondi(v).toLocaleString('fr-FR') + ' m²');
const dh = (v) => Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DH';
const dfr = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');
const dtfr = (d) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '—');
const niveau = (e) => (e === 0 ? 'RDC' : `R+${e}`);
const opts = (list, cur) => list.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(v)}"${String(v) === String(cur ?? '') ? ' selected' : ''}>${esc(l)}</option>`; }).join('');
const STATUTS = ['Disponible', 'Réservé', 'Vendu', 'Bloqué'];
const P_STATUTS = ['Nouveau', 'Contacté', 'Visite planifiée', 'Converti', 'Perdu'];
const ROLES = [['admin', 'Administrateur'], ['commercial', 'Commercial'], ['adherent', 'Adhérent'], ['en_attente', 'En attente']];
const ROLE_LABEL = Object.fromEntries(ROLES);

let ME = null; // profil
let VIEW = null;
const root = $('#root');

function toast(text, ok = true) {
  const d = document.createElement('div');
  d.className = `msg ${ok ? 'ok' : 'err'}`; d.setAttribute('role', 'status');
  d.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:200;max-width:420px;box-shadow:0 8px 30px rgba(0,0,0,.15)';
  d.textContent = text; document.body.appendChild(d); setTimeout(() => d.remove(), 4200);
}
function openModal(html) { $('#modalBox').innerHTML = html; $('#modal').classList.add('on'); const f = $('#modalBox input,#modalBox select,#modalBox button'); f && f.focus(); }
function closeModal() { $('#modal').classList.remove('on'); }
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal(); });
function genPassword() { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'; const r = crypto.getRandomValues(new Uint32Array(10)); return 'Ebla-' + [...r].map((x) => a[x % a.length]).join(''); }

/* ---------- Connexion ---------- */
function renderLogin(message = '') {
  $('#logout').hidden = true;
  root.innerHTML = `<form class="login" id="loginForm">
    <img src="/media/logo-ebla-two.png" alt="Résidence Ebla Two">
    <h1 style="margin:0;font-size:24px;text-align:center">Espace membres</h1>
    <p class="muted" style="margin:0;text-align:center">Administration, commerciaux et adhérents</p>
    <label class="field">E-mail<input name="email" type="email" required autocomplete="username"></label>
    <label class="field">Mot de passe<input name="password" type="password" required autocomplete="current-password"></label>
    <div id="loginMsg" role="status">${message ? `<div class="msg err">${esc(message)}</div>` : ''}</div>
    <button class="btn up" type="submit">Se connecter</button>
    <p class="small" style="margin:0;text-align:center">Pas encore de compte ? Les accès sont créés par l'administration de l'Amicale.</p>
  </form>`;
  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget); const btn = e.currentTarget.querySelector('button'); btn.disabled = true;
    const { error } = await sb.auth.signInWithPassword({ email: String(fd.get('email')).trim(), password: String(fd.get('password')) });
    btn.disabled = false;
    if (error) $('#loginMsg').innerHTML = '<div class="msg err">E-mail ou mot de passe incorrect.</div>';
    else boot();
  });
}
$('#logout').addEventListener('click', async () => { await sb.auth.signOut(); ME = null; renderLogin(); });

/* ---------- Mot de passe ---------- */
function renderForcePassword() {
  root.innerHTML = `<form class="login" id="pwForm">
    <h1 style="margin:0;font-size:22px">Choisissez votre mot de passe</h1>
    <p class="muted" style="margin:0">Pour sécuriser votre compte, remplacez le mot de passe provisoire qui vous a été communiqué.</p>
    <label class="field">Nouveau mot de passe<input name="p1" type="password" minlength="8" required autocomplete="new-password"></label>
    <label class="field">Confirmer<input name="p2" type="password" minlength="8" required autocomplete="new-password"></label>
    <div id="pwMsg" role="status"></div>
    <button class="btn up" type="submit">Enregistrer</button></form>`;
  $('#pwForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(e.currentTarget);
    if (fd.get('p1') !== fd.get('p2') || String(fd.get('p1')).length < 8) { $('#pwMsg').innerHTML = '<div class="msg err">Les deux mots de passe doivent être identiques (8 caractères minimum).</div>'; return; }
    const { error } = await sb.auth.updateUser({ password: String(fd.get('p1')) });
    if (error) { $('#pwMsg').innerHTML = `<div class="msg err">${esc(error.message)}</div>`; return; }
    await sb.from('profiles').update({ must_change_password: false }).eq('id', ME.id);
    ME.must_change_password = false; toast('Mot de passe mis à jour.'); renderApp();
  });
}

/* ---------- Coquille ---------- */
const MENUS = {
  admin: [['dash', 'Tableau de bord'], ['lots', 'Lots'], ['prospects', 'Prospects'], ['visites', 'Visites'], ['users', 'Utilisateurs'], ['echeances', 'Échéanciers'], ['documents', 'Documents'], ['avancement', 'Avancement chantier'], ['compte', 'Mon compte']],
  commercial: [['dash', 'Tableau de bord'], ['lots', 'Lots'], ['prospects', 'Prospects'], ['visites', 'Visites'], ['compte', 'Mon compte']],
  adherent: [['monlot', 'Mon lot'], ['echeances', 'Mon échéancier'], ['documents', 'Mes documents'], ['avancement', 'Avancement chantier'], ['compte', 'Mon compte']],
};
function renderApp() {
  $('#logout').hidden = false;
  if (ME.must_change_password) return renderForcePassword();
  if (ME.role === 'en_attente' || !MENUS[ME.role]) {
    root.innerHTML = `<div class="login"><h1 style="margin:0;font-size:22px">Compte en attente</h1><p class="muted" style="margin:0">Votre compte existe mais n'a pas encore de rôle. L'administration de l'Amicale doit l'activer.</p></div>`;
    return;
  }
  const menu = MENUS[ME.role];
  if (!VIEW || !menu.some(([k]) => k === VIEW)) VIEW = menu[0][0];
  root.innerHTML = `<div class="app"><nav class="side" aria-label="Menu de l'espace">
      <div class="who"><b>${esc(ME.full_name || ME.email)}</b><span>${esc(ROLE_LABEL[ME.role])}</span></div>
      ${menu.map(([k, l]) => `<button type="button" data-v="${k}" class="${k === VIEW ? 'on' : ''}" ${k === VIEW ? 'aria-current="page"' : ''}>${esc(l)}</button>`).join('')}
    </nav><div class="main" id="main"></div></div>`;
  $('.side').addEventListener('click', (e) => { const b = e.target.closest('button[data-v]'); if (b) { VIEW = b.dataset.v; renderApp(); } });
  const main = $('#main');
  main.innerHTML = '<p class="muted">Chargement…</p>';
  VIEWS[VIEW](main).catch((err) => { main.innerHTML = `<div class="msg err">Erreur : ${esc(err.message || err)}</div>`; });
}

/* ---------- Données partagées ---------- */
async function profilesBy(roles) {
  const { data, error } = await sb.from('profiles').select('id,full_name,email,phone,cin,role').in('role', roles).order('full_name');
  if (error) throw error; return data;
}
const nameOf = (list, id) => { const p = list.find((x) => x.id === id); return p ? (p.full_name || p.email) : ''; };

/* ---------- Vues ---------- */
const VIEWS = {};

VIEWS.dash = async (main) => {
  const [{ data: lots }, { data: pros }, { data: vis }] = await Promise.all([
    sb.from('lots').select('type,statut,surface_habitable'),
    sb.from('prospects').select('statut,created_at'),
    sb.from('visites').select('date_visite,statut,lot_id,prospects(nom,prenom,telephone)').gte('date_visite', new Date().toISOString()).eq('statut', 'Planifiée').order('date_visite').limit(8),
  ]);
  const c = (f) => lots.filter(f).length;
  const types = ['Appartement', 'Appartement RDC', 'Magasin'];
  main.innerHTML = `<h1>Tableau de bord</h1><p class="muted">Vue d'ensemble de la commercialisation.</p>
  <div class="grid2" style="margin-top:20px">
    <div class="stat"><b>${lots.length}</b><span>lots au total</span></div>
    <div class="stat"><b>${c((l) => l.statut === 'Disponible')}</b><span>disponibles</span></div>
    <div class="stat"><b>${c((l) => l.statut === 'Réservé')}</b><span>réservés</span></div>
    <div class="stat"><b>${c((l) => l.statut === 'Vendu')}</b><span>vendus</span></div>
    <div class="stat"><b>${pros.filter((p) => p.statut === 'Nouveau').length}</b><span>nouveaux prospects</span></div>
  </div>
  <div class="panel"><h2>Par type de bien</h2><div class="tbl-box"><table><thead><tr><th>Type</th><th class="num">Total</th><th class="num">Disponibles</th><th class="num">Réservés</th><th class="num">Vendus</th><th class="num">Surface totale</th></tr></thead><tbody>
  ${types.map((t) => { const L = lots.filter((l) => l.type === t); return `<tr><td>${t}</td><td class="num">${L.length}</td><td class="num">${L.filter((l) => l.statut === 'Disponible').length}</td><td class="num">${L.filter((l) => l.statut === 'Réservé').length}</td><td class="num">${L.filter((l) => l.statut === 'Vendu').length}</td><td class="num">${m2(L.reduce((s, l) => s + (l.surface_habitable == null ? 0 : arrondi(l.surface_habitable)), 0))}</td></tr>`; }).join('')}
  </tbody></table></div></div>
  <div class="panel"><h2>Prochaines visites</h2>${vis.length ? `<div class="tbl-box"><table><thead><tr><th>Date</th><th>Visiteur</th><th>Téléphone</th><th>Lot</th></tr></thead><tbody>${vis.map((v) => `<tr><td>${dtfr(v.date_visite)}</td><td>${esc(((v.prospects?.prenom || '') + ' ' + (v.prospects?.nom || '')).trim())}</td><td>${esc(v.prospects?.telephone)}</td><td>${esc(v.lot_id || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">Aucune visite planifiée.</p>'}</div>`;
};

VIEWS.lots = async (main) => {
  const isAdmin = ME.role === 'admin';
  const [{ data: lots, error }, adherents] = await Promise.all([sb.from('lots').select('*').order('ordre'), profilesBy(['adherent'])]);
  if (error) throw error;
  main.innerHTML = `<h1>Lots</h1><p class="muted">${isAdmin ? 'Modifiez statut, adhérent, typologie et surfaces, puis enregistrez la ligne.' : 'Mettez à jour le statut et l’adhérent de chaque lot.'}</p>
  <div class="panel"><div class="toolbar">
    <label class="field">Recherche<input id="q" placeholder="ex. B204"></label>
    <label class="field">Immeuble<select id="fb"><option value="">Tous</option>${opts(['A', 'B', 'C', 'D', 'E', 'F'])}</select></label>
    <label class="field">Type<select id="ft"><option value="">Tous</option>${opts(['Appartement', 'Appartement RDC', 'Magasin'])}</select></label>
    <label class="field">Statut<select id="fs"><option value="">Tous</option>${opts(STATUTS)}</select></label>
    ${isAdmin ? '<button class="btn sm" type="button" id="exportCsv">Exporter CSV</button>' : ''}
  </div><div class="tbl-box" style="max-height:70vh"><table><thead><tr><th>Lot</th><th>Type</th><th>Niv.</th><th>Surface</th><th>Annexe</th><th>Typologie</th><th>Ch.</th><th>Statut</th><th>Adhérent</th><th>Notes</th><th></th></tr></thead><tbody id="rows"></tbody></table></div></div>`;
  const adhOpts = (cur) => `<option value="">—</option>${adherents.map((a) => `<option value="${a.id}"${a.id === cur ? ' selected' : ''}>${esc(a.full_name || a.email)}</option>`).join('')}`;
  const draw = () => {
    const q = $('#q').value.trim().toUpperCase(), b = $('#fb').value, t = $('#ft').value, s = $('#fs').value;
    const L = lots.filter((l) => (!q || l.id.includes(q)) && (!b || l.bloc === b) && (!t || l.type === t) && (!s || l.statut === s));
    $('#rows').innerHTML = L.map((l) => `<tr data-id="${esc(l.id)}">
      <td><b>${esc(l.id)}</b></td><td>${esc(l.type)}</td><td>${niveau(l.etage)}</td>
      <td>${isAdmin ? `<input name="surface_habitable" type="number" step="0.01" value="${l.surface_habitable ?? ''}" style="width:90px" aria-label="Surface habitable ${esc(l.id)}"> <span class="small">${m2(l.surface_habitable)}</span>` : m2(l.surface_habitable)}</td>
      <td>${isAdmin ? `<input name="surface_annexe" type="number" step="0.01" value="${l.surface_annexe ?? ''}" style="width:80px" aria-label="Surface annexe ${esc(l.id)}">` : (l.surface_annexe ? m2(l.surface_annexe) : '—')}</td>
      <td><input name="typologie" value="${esc(l.typologie ?? '')}" style="width:110px" placeholder="F2, F3…" aria-label="Typologie ${esc(l.id)}"></td>
      <td><input name="nb_chambres" type="number" min="0" value="${l.nb_chambres ?? ''}" style="width:56px" aria-label="Chambres ${esc(l.id)}"></td>
      <td><select name="statut" aria-label="Statut ${esc(l.id)}">${opts(STATUTS, l.statut)}</select></td>
      <td><select name="adherent_id" aria-label="Adhérent ${esc(l.id)}">${adhOpts(l.adherent_id)}</select></td>
      <td><input name="notes" value="${esc(l.notes ?? '')}" style="width:160px" aria-label="Notes ${esc(l.id)}"></td>
      <td><button class="btn sm" type="button" data-save>Enregistrer</button></td></tr>`).join('') || '<tr><td colspan="11" class="muted">Aucun lot.</td></tr>';
  };
  ['#q', '#fb', '#ft', '#fs'].forEach((s) => $(s).addEventListener('input', draw));
  draw();
  $('#rows').addEventListener('click', async (e) => {
    if (!e.target.matches('[data-save]')) return;
    const tr = e.target.closest('tr'); const id = tr.dataset.id; const u = {};
    tr.querySelectorAll('input,select').forEach((el) => { let v = el.value.trim(); if (['surface_habitable', 'surface_annexe', 'nb_chambres'].includes(el.name)) v = v === '' ? null : Number(v); else if (v === '') v = null; u[el.name] = v; });
    if (u.statut === 'Disponible') u.adherent_id = null;
    if (u.statut === 'Réservé' && !lots.find((l) => l.id === id).date_reservation) u.date_reservation = new Date().toISOString().slice(0, 10);
    const { error: err } = await sb.from('lots').update(u).eq('id', id);
    if (err) return toast(err.message, false);
    Object.assign(lots.find((l) => l.id === id), u); toast(`Lot ${id} enregistré.`);
  });
  const ex = $('#exportCsv');
  if (ex) ex.addEventListener('click', () => {
    const cols = ['id', 'type', 'bloc', 'etage', 'surface_habitable', 'surface_annexe', 'typologie', 'nb_chambres', 'statut', 'date_reservation', 'notes'];
    const csv = [cols.join(';'), ...lots.map((l) => cols.map((c) => `"${String(l[c] ?? '').replace(/"/g, '""')}"`).join(';')), ''].join('\n') + '';
    const csvWithAdh = csv.split('\n').map((line, i) => (i === 0 ? line + ';adherent' : (line && lots[i - 1] ? line + `;"${nameOf(adherents, lots[i - 1].adherent_id)}"` : line))).join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csvWithAdh], { type: 'text/csv' })); a.download = 'lots-ebla-two.csv'; a.click();
  });
};

VIEWS.prospects = async (main) => {
  const [{ data: pros, error }, staff, { data: lots }] = await Promise.all([
    sb.from('prospects').select('*').order('created_at', { ascending: false }), profilesBy(['admin', 'commercial']), sb.from('lots').select('id,statut').order('ordre')]);
  if (error) throw error;
  main.innerHTML = `<h1>Prospects</h1><p class="muted">Demandes reçues par le formulaire du site et contacts ajoutés par l'équipe.</p>
  <div class="panel"><div class="toolbar"><label class="field">Statut<select id="fs"><option value="">Tous</option>${opts(P_STATUTS)}</select></label>
  <button class="btn sm" type="button" id="addP">Ajouter un prospect</button></div>
  <div class="tbl-box" style="max-height:70vh"><table><thead><tr><th>Reçu le</th><th>Nom</th><th>Téléphone</th><th>E-mail</th><th>Ville</th><th>Recherche</th><th>Message</th><th>Statut</th><th>Suivi par</th><th></th></tr></thead><tbody id="rows"></tbody></table></div></div>`;
  const draw = () => {
    const s = $('#fs').value; const P = pros.filter((p) => !s || p.statut === s);
    $('#rows').innerHTML = P.map((p) => `<tr data-id="${p.id}"><td>${dfr(p.created_at)}</td><td><b>${esc(((p.prenom || '') + ' ' + p.nom).trim())}</b></td>
      <td><a href="https://wa.me/${esc(String(p.telephone).replace(/[^\d]/g, ''))}" target="_blank" rel="noopener">${esc(p.telephone)}</a></td><td>${esc(p.email || '')}</td><td>${esc(p.ville || '')}</td>
      <td>${esc([p.type_bien, p.lot_souhaite].filter(Boolean).join(' · '))}</td><td style="white-space:normal;min-width:200px">${esc(p.message || '')}</td>
      <td><select name="statut" aria-label="Statut">${opts(P_STATUTS, p.statut)}</select></td>
      <td><select name="commercial_id" aria-label="Commercial"><option value="">—</option>${staff.map((s2) => `<option value="${s2.id}"${s2.id === p.commercial_id ? ' selected' : ''}>${esc(s2.full_name || s2.email)}</option>`).join('')}</select></td>
      <td style="display:flex;gap:6px"><button class="btn sm" type="button" data-visit>Visite</button>${ME.role === 'admin' ? '<button class="btn ghost sm" type="button" data-del aria-label="Supprimer">Suppr.</button>' : ''}</td></tr>`).join('') || '<tr><td colspan="10" class="muted">Aucun prospect pour le moment.</td></tr>';
  };
  $('#fs').addEventListener('input', draw); draw();
  $('#rows').addEventListener('change', async (e) => {
    const tr = e.target.closest('tr'); const v = e.target.value || null;
    const { error: err } = await sb.from('prospects').update({ [e.target.name]: v }).eq('id', tr.dataset.id);
    if (err) return toast(err.message, false); Object.assign(pros.find((p) => p.id === tr.dataset.id), { [e.target.name]: v }); toast('Prospect mis à jour.');
  });
  $('#rows').addEventListener('click', async (e) => {
    const tr = e.target.closest('tr'); if (!tr) return; const p = pros.find((x) => x.id === tr.dataset.id);
    if (e.target.matches('[data-del]')) {
      if (!confirm('Supprimer ce prospect ?')) return;
      const { error: err } = await sb.from('prospects').delete().eq('id', p.id); if (err) return toast(err.message, false);
      pros.splice(pros.indexOf(p), 1); draw(); toast('Prospect supprimé.');
    }
    if (e.target.matches('[data-visit]')) {
      openModal(`<h2 id="modalTitle" style="margin:0">Planifier une visite — ${esc(p.nom)}</h2><form class="form" id="vf">
        <label class="field">Date et heure<input name="date" type="datetime-local" required></label>
        <label class="field">Type<select name="type">${opts(['Sur site', 'Bureau de vente', 'Visio WhatsApp'])}</select></label>
        <label class="field">Lot<select name="lot"><option value="">—</option>${lots.map((l) => `<option${l.id === p.lot_souhaite ? ' selected' : ''}>${esc(l.id)}</option>`).join('')}</select></label>
        <label class="field">Commercial<select name="com">${staff.map((s2) => `<option value="${s2.id}"${s2.id === (p.commercial_id || ME.id) ? ' selected' : ''}>${esc(s2.full_name || s2.email)}</option>`).join('')}</select></label>
        <label class="field full">Notes<textarea name="notes"></textarea></label>
        <div class="full" style="display:flex;gap:10px"><button class="btn" type="submit">Planifier</button><button class="btn ghost" type="button" data-close>Annuler</button></div></form>`);
      $('#vf').addEventListener('submit', async (ev) => {
        ev.preventDefault(); const fd = new FormData(ev.currentTarget);
        const { error: err } = await sb.from('visites').insert({ prospect_id: p.id, lot_id: fd.get('lot') || null, date_visite: new Date(String(fd.get('date'))).toISOString(), type_visite: fd.get('type'), commercial_id: fd.get('com'), notes: fd.get('notes') || null });
        if (err) return toast(err.message, false);
        await sb.from('prospects').update({ statut: 'Visite planifiée', commercial_id: fd.get('com') }).eq('id', p.id);
        p.statut = 'Visite planifiée'; p.commercial_id = String(fd.get('com')); closeModal(); draw(); toast('Visite planifiée.');
      });
    }
  });
  $('#addP').addEventListener('click', () => {
    openModal(`<h2 id="modalTitle" style="margin:0">Nouveau prospect</h2><form class="form" id="pf">
      <label class="field">Nom<input name="nom" required></label><label class="field">Prénom<input name="prenom"></label>
      <label class="field">Téléphone<input name="telephone" required></label><label class="field">E-mail<input name="email" type="email"></label>
      <label class="field">Ville<input name="ville"></label><label class="field">Source<input name="source" placeholder="Salon, appel…"></label>
      <label class="field full">Message<textarea name="message"></textarea></label>
      <div class="full" style="display:flex;gap:10px"><button class="btn" type="submit">Ajouter</button><button class="btn ghost" type="button" data-close>Annuler</button></div></form>`);
    $('#pf').addEventListener('submit', async (ev) => {
      ev.preventDefault(); const fd = new FormData(ev.currentTarget); const row = {};
      for (const [k, v] of fd.entries()) if (String(v).trim()) row[k] = String(v).trim();
      const { error: err } = await sb.from('prospects').insert(row); if (err) return toast(err.message, false);
      closeModal(); toast('Prospect ajouté.'); renderApp();
    });
  });
};

VIEWS.visites = async (main) => {
  const [{ data: vis, error }, staff] = await Promise.all([sb.from('visites').select('*,prospects(nom,prenom,telephone)').order('date_visite', { ascending: false }), profilesBy(['admin', 'commercial'])]);
  if (error) throw error;
  main.innerHTML = `<h1>Visites</h1><div class="panel"><div class="tbl-box" style="max-height:72vh"><table><thead><tr><th>Date</th><th>Visiteur</th><th>Téléphone</th><th>Lot</th><th>Type</th><th>Commercial</th><th>Statut</th><th>Notes</th></tr></thead><tbody id="rows">
  ${vis.map((v) => `<tr data-id="${v.id}"><td>${dtfr(v.date_visite)}</td><td>${esc(((v.prospects?.prenom || '') + ' ' + (v.prospects?.nom || '')).trim())}</td><td>${esc(v.prospects?.telephone || '')}</td><td>${esc(v.lot_id || '—')}</td><td>${esc(v.type_visite || '')}</td><td>${esc(nameOf(staff, v.commercial_id))}</td>
  <td><select name="statut" aria-label="Statut">${opts(['Planifiée', 'Effectuée', 'Annulée'], v.statut)}</select></td><td><input name="notes" value="${esc(v.notes || '')}" style="width:220px" aria-label="Notes"></td></tr>`).join('') || '<tr><td colspan="8" class="muted">Aucune visite.</td></tr>'}
  </tbody></table></div></div>`;
  $('#rows').addEventListener('change', async (e) => {
    const tr = e.target.closest('tr'); const { error: err } = await sb.from('visites').update({ [e.target.name]: e.target.value || null }).eq('id', tr.dataset.id);
    toast(err ? err.message : 'Visite mise à jour.', !err);
  });
};

VIEWS.users = async (main) => {
  const { data: users, error } = await sb.from('profiles').select('*').order('created_at');
  if (error) throw error;
  main.innerHTML = `<h1>Utilisateurs</h1><p class="muted">Créez les comptes des commerciaux et des adhérents. Communiquez-leur le mot de passe provisoire : ils devront le changer à la première connexion.</p>
  <div class="panel"><div class="toolbar"><button class="btn sm" type="button" id="addU">Créer un compte</button></div>
  <div class="tbl-box"><table><thead><tr><th>Nom</th><th>E-mail</th><th>Téléphone</th><th>CIN</th><th>Rôle</th><th>Créé le</th><th></th></tr></thead><tbody id="rows">
  ${users.map((u) => `<tr data-id="${u.id}"><td><input name="full_name" value="${esc(u.full_name || '')}" aria-label="Nom"></td><td>${esc(u.email)}</td>
    <td><input name="phone" value="${esc(u.phone || '')}" style="width:140px" aria-label="Téléphone"></td><td><input name="cin" value="${esc(u.cin || '')}" style="width:100px" aria-label="CIN"></td>
    <td><select name="role" aria-label="Rôle" ${u.id === ME.id ? 'disabled' : ''}>${opts(ROLES, u.role)}</select></td><td>${dfr(u.created_at)}</td>
    <td style="display:flex;gap:6px"><button class="btn sm" type="button" data-save>Enregistrer</button><button class="btn ghost sm" type="button" data-reset>Mot de passe</button>${u.id === ME.id ? '' : '<button class="btn ghost sm" type="button" data-del>Suppr.</button>'}</td></tr>`).join('')}
  </tbody></table></div></div>`;
  const call = async (body) => { const { data, error: err } = await sb.functions.invoke('admin-users', { body }); if (err) { let m = err.message; try { m = (await err.context.json()).error || m; } catch {} throw new Error(m); } return data; };
  $('#rows').addEventListener('click', async (e) => {
    const tr = e.target.closest('tr'); if (!tr) return; const id = tr.dataset.id; const u = users.find((x) => x.id === id);
    try {
      if (e.target.matches('[data-save]')) {
        const upd = {}; tr.querySelectorAll('input,select:not([disabled])').forEach((el) => { upd[el.name] = el.value.trim() || null; });
        if (!upd.role) delete upd.role;
        const { error: err } = await sb.from('profiles').update(upd).eq('id', id); if (err) throw err; toast('Utilisateur enregistré.');
      }
      if (e.target.matches('[data-reset]')) {
        const pw = genPassword();
        if (!confirm(`Réinitialiser le mot de passe de ${u.email} ?\nNouveau mot de passe provisoire : ${pw}`)) return;
        await call({ action: 'reset_password', user_id: id, password: pw });
        openModal(`<h2 id="modalTitle" style="margin:0">Mot de passe réinitialisé</h2><p>Communiquez à <b>${esc(u.email)}</b> ce mot de passe provisoire :</p><p style="font-size:22px;font-weight:800;font-family:monospace">${esc(pw)}</p><button class="btn" type="button" data-close>Fermer</button>`);
      }
      if (e.target.matches('[data-del]')) {
        if (!confirm(`Supprimer définitivement le compte ${u.email} ?`)) return;
        await call({ action: 'delete', user_id: id }); toast('Compte supprimé.'); renderApp();
      }
    } catch (err) { toast(err.message, false); }
  });
  $('#addU').addEventListener('click', () => {
    const pw = genPassword();
    openModal(`<h2 id="modalTitle" style="margin:0">Créer un compte</h2><form class="form" id="uf">
      <label class="field">Nom complet<input name="full_name" required></label><label class="field">E-mail<input name="email" type="email" required></label>
      <label class="field">Téléphone<input name="phone"></label><label class="field">CIN<input name="cin"></label>
      <label class="field">Rôle<select name="role">${opts(ROLES.filter(([r]) => r !== 'en_attente'), 'adherent')}</select></label>
      <label class="field">Mot de passe provisoire<input name="password" value="${pw}" minlength="8" required></label>
      <div class="full" id="ufMsg" role="status"></div>
      <div class="full" style="display:flex;gap:10px"><button class="btn" type="submit">Créer</button><button class="btn ghost" type="button" data-close>Annuler</button></div></form>`);
    $('#uf').addEventListener('submit', async (ev) => {
      ev.preventDefault(); const body = Object.fromEntries(new FormData(ev.currentTarget)); const b = ev.currentTarget.querySelector('button[type=submit]'); b.disabled = true;
      try {
        await call({ action: 'create', ...body });
        openModal(`<h2 id="modalTitle" style="margin:0">Compte créé</h2><p>Transmettez ces identifiants à <b>${esc(body.full_name)}</b> :</p><p>Adresse : <b>${location.origin}/espace.html</b><br>E-mail : <b>${esc(body.email)}</b><br>Mot de passe provisoire : <b style="font-family:monospace">${esc(body.password)}</b></p><button class="btn" type="button" data-close>Fermer</button>`);
        VIEW = 'users'; const keep = $('#modalBox').innerHTML; renderApp(); openModal(keep);
      } catch (err) { b.disabled = false; $('#ufMsg').innerHTML = `<div class="msg err">${esc(err.message)}</div>`; }
    });
  });
};

VIEWS.echeances = async (main) => {
  if (ME.role === 'adherent') {
    const { data, error } = await sb.from('echeances').select('*').eq('adherent_id', ME.id).order('date_echeance');
    if (error) throw error;
    const tot = data.reduce((s, x) => s + Number(x.montant), 0), paye = data.filter((x) => x.statut === 'Payé').reduce((s, x) => s + Number(x.montant), 0);
    main.innerHTML = `<h1>Mon échéancier</h1><div class="grid2" style="margin-top:20px"><div class="stat"><b>${dh(tot)}</b><span>total programmé</span></div><div class="stat"><b>${dh(paye)}</b><span>déjà réglé</span></div><div class="stat"><b>${dh(tot - paye)}</b><span>reste à régler</span></div></div>
    <div class="panel"><div class="tbl-box"><table><thead><tr><th>Échéance</th><th>Lot</th><th class="num">Montant</th><th>Date prévue</th><th>Payé le</th><th>Statut</th></tr></thead><tbody>
    ${data.map((x) => `<tr><td>${esc(x.libelle)}</td><td>${esc(x.lot_id || '—')}</td><td class="num">${dh(x.montant)}</td><td>${dfr(x.date_echeance)}</td><td>${dfr(x.date_paiement)}</td><td>${esc(x.statut)}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">Aucune échéance enregistrée pour le moment.</td></tr>'}</tbody></table></div></div>`;
    return;
  }
  const adherents = await profilesBy(['adherent']);
  const { data: lots } = await sb.from('lots').select('id,adherent_id');
  main.innerHTML = `<h1>Échéanciers</h1><div class="panel"><div class="toolbar"><label class="field">Adhérent<select id="sa"><option value="">Choisir…</option>${adherents.map((a) => `<option value="${a.id}">${esc(a.full_name || a.email)}</option>`).join('')}</select></label></div><div id="ech"><p class="muted">${adherents.length ? 'Choisissez un adhérent.' : 'Créez d’abord des comptes adhérents dans « Utilisateurs ».'}</p></div></div>`;
  const load = async () => {
    const aid = $('#sa').value; if (!aid) return;
    const { data } = await sb.from('echeances').select('*').eq('adherent_id', aid).order('date_echeance');
    const myLots = lots.filter((l) => l.adherent_id === aid).map((l) => l.id);
    $('#ech').innerHTML = `<div class="tbl-box"><table><thead><tr><th>Libellé</th><th>Lot</th><th class="num">Montant</th><th>Date prévue</th><th>Payé le</th><th>Statut</th><th></th></tr></thead><tbody id="er">
      ${data.map((x) => `<tr data-id="${x.id}"><td>${esc(x.libelle)}</td><td>${esc(x.lot_id || '—')}</td><td class="num">${dh(x.montant)}</td><td>${dfr(x.date_echeance)}</td>
      <td><input type="date" name="date_paiement" value="${x.date_paiement || ''}" aria-label="Date de paiement"></td><td><select name="statut" aria-label="Statut">${opts(['À payer', 'Payé', 'En retard'], x.statut)}</select></td><td><button class="btn ghost sm" type="button" data-del>Suppr.</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">Aucune échéance.</td></tr>'}</tbody></table></div>
      <form class="form" id="ef" style="margin-top:18px"><label class="field">Libellé<input name="libelle" required placeholder="Tranche 1 — réservation"></label><label class="field">Montant (DH)<input name="montant" type="number" step="0.01" min="0" required></label>
      <label class="field">Date prévue<input name="date_echeance" type="date"></label><label class="field">Lot<select name="lot_id"><option value="">—</option>${opts(myLots)}</select></label>
      <div class="full"><button class="btn" type="submit">Ajouter l'échéance</button></div></form>`;
    $('#er').addEventListener('change', async (e) => { const id = e.target.closest('tr').dataset.id; const { error: err } = await sb.from('echeances').update({ [e.target.name]: e.target.value || null }).eq('id', id); toast(err ? err.message : 'Échéance mise à jour.', !err); });
    $('#er').addEventListener('click', async (e) => { if (!e.target.matches('[data-del]') || !confirm('Supprimer cette échéance ?')) return; const { error: err } = await sb.from('echeances').delete().eq('id', e.target.closest('tr').dataset.id); if (err) return toast(err.message, false); load(); });
    $('#ef').addEventListener('submit', async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const { error: err } = await sb.from('echeances').insert({ adherent_id: aid, libelle: fd.get('libelle'), montant: Number(fd.get('montant')), date_echeance: fd.get('date_echeance') || null, lot_id: fd.get('lot_id') || null }); if (err) return toast(err.message, false); toast('Échéance ajoutée.'); load(); });
  };
  $('#sa').addEventListener('input', load);
};

VIEWS.documents = async (main) => {
  const isAdmin = ME.role === 'admin';
  const { data: docs, error } = await sb.from('documents').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const adherents = isAdmin ? await profilesBy(['adherent']) : [];
  main.innerHTML = `<h1>${isAdmin ? 'Documents' : 'Mes documents'}</h1>
  ${isAdmin ? `<div class="panel"><h2>Déposer un document</h2><form class="form" id="df">
    <label class="field">Titre<input name="titre" required></label><label class="field">Catégorie<select name="categorie">${opts(['Contrat', 'Reçu de paiement', 'Plan', 'Procès-verbal', 'Courrier', 'Autre'])}</select></label>
    <label class="field">Destinataire<select name="dest"><option value="">Tous les adhérents</option>${adherents.map((a) => `<option value="${a.id}">${esc(a.full_name || a.email)}</option>`).join('')}</select></label>
    <label class="field">Fichier (PDF, image…)<input name="file" type="file" required></label>
    <div class="full"><button class="btn" type="submit">Déposer</button></div></form></div>` : ''}
  <div class="panel"><div class="tbl-box"><table><thead><tr><th>Titre</th><th>Catégorie</th><th>Destinataire</th><th>Ajouté le</th><th></th></tr></thead><tbody id="rows">
  ${docs.map((d) => `<tr data-id="${d.id}" data-path="${esc(d.storage_path)}"><td><b>${esc(d.titre)}</b></td><td>${esc(d.categorie || '')}</td><td>${d.adherent_id ? esc(isAdmin ? nameOf(adherents, d.adherent_id) : 'Personnel') : 'Tous les adhérents'}</td><td>${dfr(d.created_at)}</td>
  <td style="display:flex;gap:6px"><button class="btn sm" type="button" data-open>Ouvrir</button>${isAdmin ? '<button class="btn ghost sm" type="button" data-del>Suppr.</button>' : ''}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">Aucun document pour le moment.</td></tr>'}
  </tbody></table></div></div>`;
  $('#rows').addEventListener('click', async (e) => {
    const tr = e.target.closest('tr'); if (!tr) return;
    if (e.target.matches('[data-open]')) {
      const { data, error: err } = await sb.storage.from('documents').createSignedUrl(tr.dataset.path, 300);
      if (err) return toast(err.message, false); window.open(data.signedUrl, '_blank', 'noopener');
    }
    if (e.target.matches('[data-del]') && confirm('Supprimer ce document ?')) {
      await sb.storage.from('documents').remove([tr.dataset.path]);
      const { error: err } = await sb.from('documents').delete().eq('id', tr.dataset.id); if (err) return toast(err.message, false); renderApp();
    }
  });
  const df = $('#df');
  if (df) df.addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(df); const file = fd.get('file'); if (!file || !file.size) return;
    const b = df.querySelector('button'); b.disabled = true;
    const safe = file.name.normalize('NFD').replace(/[^\w.\-]+/g, '_');
    const dest = fd.get('dest'); const path = `${dest ? 'adherents/' + dest : 'commun'}/${Date.now()}_${safe}`;
    const { error: upErr } = await sb.storage.from('documents').upload(path, file);
    if (upErr) { b.disabled = false; return toast(upErr.message, false); }
    const { error: err } = await sb.from('documents').insert({ titre: fd.get('titre'), categorie: fd.get('categorie'), adherent_id: dest || null, storage_path: path });
    b.disabled = false; if (err) return toast(err.message, false); toast('Document déposé.'); renderApp();
  });
};

VIEWS.avancement = async (main) => {
  const isAdmin = ME.role === 'admin';
  const { data, error } = await sb.from('avancement').select('*').order('bloc').order('ordre');
  if (error) throw error;
  main.innerHTML = `<h1>Avancement du chantier</h1><p class="muted">${isAdmin ? 'Ces informations sont publiées sur le site public, section « État d’avancement ».' : 'Suivi des travaux par immeuble.'}</p>
  <div class="panel"><div class="tbl-box"><table><thead><tr><th>Immeuble</th><th>Étape</th><th>Avancement</th><th>Mis à jour</th><th>Commentaire</th>${isAdmin ? '<th></th>' : ''}</tr></thead><tbody id="rows">
  ${data.map((a) => isAdmin ? `<tr data-id="${a.id}"><td><select name="bloc" aria-label="Immeuble">${opts(['A', 'B', 'C', 'D', 'E', 'F', 'Général'], a.bloc)}</select></td><td><input name="etape" value="${esc(a.etape)}" style="width:240px" aria-label="Étape"></td>
    <td><input name="taux" type="number" min="0" max="100" value="${a.taux}" style="width:70px" aria-label="Taux en %"> %</td><td><input name="date_maj" type="date" value="${a.date_maj || ''}" aria-label="Date"></td><td><input name="commentaire" value="${esc(a.commentaire || '')}" style="width:220px" aria-label="Commentaire"></td>
    <td style="display:flex;gap:6px"><button class="btn sm" type="button" data-save>Enregistrer</button><button class="btn ghost sm" type="button" data-del>Suppr.</button></td></tr>`
    : `<tr><td>${esc(a.bloc)}</td><td>${esc(a.etape)}</td><td><div class="bar" style="width:160px"><i style="width:${Number(a.taux)}%"></i></div> ${Number(a.taux)} %</td><td>${dfr(a.date_maj)}</td><td>${esc(a.commentaire || '')}</td></tr>`).join('') || `<tr><td colspan="6" class="muted">Aucune étape renseignée.</td></tr>`}
  </tbody></table></div>
  ${isAdmin ? `<form class="form" id="af" style="margin-top:18px"><label class="field">Immeuble<select name="bloc">${opts(['A', 'B', 'C', 'D', 'E', 'F', 'Général'])}</select></label><label class="field">Étape<input name="etape" required placeholder="Gros œuvre"></label>
  <label class="field">Avancement (%)<input name="taux" type="number" min="0" max="100" value="0" required></label><label class="field">Commentaire<input name="commentaire"></label><div class="full"><button class="btn" type="submit">Ajouter l'étape</button></div></form>` : ''}</div>`;
  if (!isAdmin) return;
  $('#rows').addEventListener('click', async (e) => {
    const tr = e.target.closest('tr'); if (!tr) return;
    if (e.target.matches('[data-save]')) { const u = {}; tr.querySelectorAll('input,select').forEach((el) => { u[el.name] = el.name === 'taux' ? Number(el.value) : (el.value || null); }); const { error: err } = await sb.from('avancement').update(u).eq('id', tr.dataset.id); toast(err ? err.message : 'Étape enregistrée.', !err); }
    if (e.target.matches('[data-del]') && confirm('Supprimer cette étape ?')) { const { error: err } = await sb.from('avancement').delete().eq('id', tr.dataset.id); if (err) return toast(err.message, false); renderApp(); }
  });
  $('#af').addEventListener('submit', async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const { error: err } = await sb.from('avancement').insert({ bloc: fd.get('bloc'), etape: fd.get('etape'), taux: Number(fd.get('taux')), commentaire: fd.get('commentaire') || null, ordre: data.length }); if (err) return toast(err.message, false); renderApp(); });
};

VIEWS.monlot = async (main) => {
  const { data: lots, error } = await sb.from('lots').select('*').eq('adherent_id', ME.id);
  if (error) throw error;
  main.innerHTML = `<h1>Mon lot</h1>${lots.length ? lots.map((l) => `<div class="panel"><h2>${esc(l.id)} — ${esc(l.type)}</h2><div class="grid2">
    <div class="stat"><b>${esc(l.bloc)}</b><span>immeuble</span></div><div class="stat"><b>${niveau(l.etage)}</b><span>niveau</span></div>
    <div class="stat"><b>${m2(l.surface_habitable)}</b><span>surface habitable</span></div>${l.surface_annexe ? `<div class="stat"><b>${m2(l.surface_annexe)}</b><span>annexe / mezzanine</span></div>` : ''}
    <div class="stat"><b>${esc(l.typologie || '—')}</b><span>typologie</span></div><div class="stat"><b><span class="st ${esc(l.statut)}">${esc(l.statut)}</span></b><span>statut${l.date_reservation ? ' depuis le ' + dfr(l.date_reservation) : ''}</span></div></div></div>`).join('')
    : '<div class="panel"><p class="muted" style="margin:0">Aucun lot ne vous est encore attribué. L’administration l’associera à votre compte dès la réservation.</p></div>'}`;
};

VIEWS.compte = async (main) => {
  main.innerHTML = `<h1>Mon compte</h1><div class="panel"><form class="form" id="cf">
    <label class="field">Nom complet<input name="full_name" value="${esc(ME.full_name || '')}"></label><label class="field">Téléphone<input name="phone" value="${esc(ME.phone || '')}"></label>
    <label class="field">E-mail<input value="${esc(ME.email)}" disabled></label><label class="field">Rôle<input value="${esc(ROLE_LABEL[ME.role])}" disabled></label>
    <div class="full"><button class="btn" type="submit">Enregistrer</button></div></form></div>
    <div class="panel"><h2>Changer de mot de passe</h2><form class="form" id="pf"><label class="field">Nouveau mot de passe<input name="p" type="password" minlength="8" required autocomplete="new-password"></label><div class="full"><button class="btn" type="submit">Mettre à jour</button></div></form></div>`;
  $('#cf').addEventListener('submit', async (e) => { e.preventDefault(); const fd = new FormData(e.currentTarget); const u = { full_name: fd.get('full_name'), phone: fd.get('phone') }; const { error } = await sb.from('profiles').update(u).eq('id', ME.id); if (error) return toast(error.message, false); Object.assign(ME, u); toast('Profil enregistré.'); });
  $('#pf').addEventListener('submit', async (e) => { e.preventDefault(); const p = new FormData(e.currentTarget).get('p'); const { error } = await sb.auth.updateUser({ password: String(p) }); toast(error ? error.message : 'Mot de passe mis à jour.', !error); if (!error) e.currentTarget.reset(); });
};

/* ---------- Démarrage ---------- */
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return renderLogin();
  const { data: prof, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  if (error || !prof) { await sb.auth.signOut(); return renderLogin('Profil introuvable. Contactez l’administration.'); }
  ME = prof; renderApp();
}
boot();
