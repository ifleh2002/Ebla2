import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SUPABASE_URL, SUPABASE_KEY, CONTACTS } from './config.js';

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const $ = (s) => document.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Arrondi des surfaces : partie décimale > 0,50 → m² supérieur ; sinon m² inférieur.
const arrondi = (v) => { const n = Number(v); const e = Math.floor(n); return Math.round((n - e) * 100) > 50 ? e + 1 : e; };
const m2 = (v) => (v == null ? '—' : arrondi(v).toLocaleString('fr-FR') + ' m²');
const niveau = (e) => (e === 0 ? 'RDC' : `${e}${e === 1 ? 'er' : 'e'} étage`);

/* Lire la suite */
$('#descBtn').addEventListener('click', (e) => {
  const open = $('#desc').classList.toggle('open');
  e.currentTarget.textContent = open ? 'Réduire' : 'Lire la suite';
  e.currentTarget.setAttribute('aria-expanded', String(open));
});

/* Galerie */
const PHOTOS = [
  ['photo_apt_a_salon.jpg', 'Séjour — appartement type A'],
  ['photo_apt_b_salon.jpg', 'Séjour — appartement type B'],
  ['photo_apt_c_salon.jpg', 'Séjour et îlot — appartement type C'],
  ['photo_apt_d_studio.jpg', 'Espace de vie — studio type D'],
  ['photo_apt_a_suite.jpg', 'Suite parentale — type A'],
  ['photo_apt_b_chambre.jpg', 'Suite parentale — type B'],
  ['photo_apt_c_suite.jpg', 'Suite avec dressing — type C'],
  ['photo_apt_b_kids.jpg', 'Chambre enfants — type B'],
  ['photo_apt_a_cuisine.jpg', 'Cuisine équipée — type A'],
  ['photo_apt_c_sdb.jpg', 'Salle de bain — type C'],
];
let gi = 0;
function renderGal() {
  const n = PHOTOS.length;
  $('#galTrack').innerHTML = [0, 1, 2].map((k) => {
    const i = (gi + k) % n; const [f, t] = PHOTOS[i];
    return `<figure><img src="/media/${f}" alt="${esc(t)}" data-zoom loading="lazy"><figcaption>${String(i + 1).padStart(2, '0')} / ${n} — ${esc(t)}</figcaption></figure>`;
  }).join('');
  $('#galDots').innerHTML = PHOTOS.map((_, i) => `<span class="${i === gi ? 'on' : ''}"></span>`).join('');
}
$('#galPrev').onclick = () => { gi = (gi - 1 + PHOTOS.length) % PHOTOS.length; renderGal(); };
$('#galNext').onclick = () => { gi = (gi + 1) % PHOTOS.length; renderGal(); };
renderGal();

/* Zoom images */
document.addEventListener('click', (e) => {
  const img = e.target.closest('img[data-zoom]');
  if (!img) return;
  $('#lbImg').src = img.src; $('#lbImg').alt = img.alt; $('#lb').classList.add('on'); $('#lbClose').focus();
});
$('#lbClose').onclick = () => $('#lb').classList.remove('on');
$('#lb').addEventListener('click', (e) => { if (e.target.id === 'lb') $('#lb').classList.remove('on'); });

/* Vidéos */
const VIDEOS = [
  ['video-type-a.mp4', 'photo_apt_a_salon.jpg', 'Appartement type A'],
  ['video-type-b.mp4', 'photo_apt_b_salon.jpg', 'Appartement type B'],
  ['video-type-c.mp4', 'photo_apt_c_salon.jpg', 'Appartement type C'],
  ['video-type-d.mp4', 'photo_apt_d_studio.jpg', 'Studio type D'],
];
function pickVideo(i) {
  const [v, p] = VIDEOS[i]; const pl = $('#vidPlayer');
  pl.poster = `/media/${p}`; pl.src = `/media/${v}`; pl.load();
  [...$('#vidTabs').children].forEach((b, k) => { b.classList.toggle('on', k === i); b.setAttribute('aria-pressed', String(k === i)); });
}
$('#vidTabs').innerHTML = VIDEOS.map((v, i) => `<button type="button" data-i="${i}" aria-pressed="${i === 0}" class="${i === 0 ? 'on' : ''}">${esc(v[2])}</button>`).join('');
$('#vidTabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) pickVideo(Number(b.dataset.i)); });

/* Lots */
let LOTS = [];
function renderLots() {
  const b = $('#fBloc').value, t = $('#fType').value, min = Number($('#fMin').value || 0);
  const rows = LOTS.filter((l) => (!b || l.bloc === b) && (!t || l.type === t) && (!min || arrondi(l.surface_habitable ?? 0) >= min));
  const n = (ty) => rows.filter((l) => l.type === ty).length;
  $('#lotSum').innerHTML = `<span class="chip">${rows.length} lots disponibles</span><span class="chip">${n('Appartement') + n('Appartement RDC')} appartements</span><span class="chip">${n('Magasin')} magasins</span>`;
  $('#lotRows').innerHTML = rows.length ? rows.map((l) => `<tr><td><b>${esc(l.id)}</b></td><td>${esc(l.type)}</td><td>${esc(l.bloc)}</td><td>${niveau(l.etage)}</td><td class="num">${m2(l.surface_habitable)}</td><td class="num">${l.surface_annexe ? m2(l.surface_annexe) : '—'}</td></tr>`).join('')
    : '<tr><td colspan="6" class="muted">Aucun lot disponible ne correspond à ces critères.</td></tr>';
}
['#fBloc', '#fType', '#fMin'].forEach((s) => $(s).addEventListener('input', renderLots));
(async () => {
  // La base ne renvoie au public que les lots « Disponible ».
  const { data, error } = await sb.from('lots').select('id,type,bloc,etage,surface_habitable,surface_annexe,ordre').order('ordre');
  if (error) { $('#lotRows').innerHTML = '<tr><td colspan="6">Impossible de charger les lots pour le moment.</td></tr>'; return; }
  LOTS = data; renderLots();
})();

/* Avancement */
(async () => {
  const { data } = await sb.from('avancement').select('*').order('bloc').order('ordre');
  if (!data || !data.length) { $('#avStep').innerHTML = '<p class="muted">Le suivi détaillé du chantier sera publié ici prochainement.</p>'; return; }
  $('#avStep').innerHTML = data.map((a) => `<div class="step"><span class="small"><b>Immeuble ${esc(a.bloc)}</b> · mis à jour le ${a.date_maj ? new Date(a.date_maj).toLocaleDateString('fr-FR') : '—'}</span><b style="font-size:18px">${esc(a.etape)}</b><div class="bar" role="progressbar" aria-valuenow="${a.taux}" aria-valuemin="0" aria-valuemax="100" aria-label="${esc(a.etape)}"><i style="width:${Number(a.taux)}%"></i></div><span class="small">${Number(a.taux)} %${a.commentaire ? ' — ' + esc(a.commentaire) : ''}</span></div>`).join('');
})();

/* Contacts & carte */
const C = CONTACTS;
$('#contactCards').innerHTML = `
  <div class="card"><h4>${esc(C.commercial.fonction)}</h4><b>${esc(C.commercial.nom)}</b><a href="tel:${esc(C.commercial.tel.replace(/\s/g, ''))}">${esc(C.commercial.tel)}</a><a href="mailto:${esc(C.commercial.email)}">${esc(C.commercial.email)}</a></div>
  <div class="card"><h4>${esc(C.bureau.fonction)}</h4><b>${esc(C.bureau.nom)}</b><a href="mailto:${esc(C.bureau.email)}">${esc(C.bureau.email)}</a></div>
  <div class="card"><h4>Adresse du projet</h4><span>${esc(C.adresse)}</span></div>`;
$('#ftrAddr').textContent = C.adresse;
$('#ftrTel').innerHTML = `<a href="tel:${esc(C.commercial.tel.replace(/\s/g, ''))}">${esc(C.commercial.tel)}</a> · <a href="mailto:${esc(C.commercial.email)}">${esc(C.commercial.email)}</a>`;
$('#map').src = `https://maps.google.com/maps?q=${encodeURIComponent(C.mapsQuery)}&z=15&output=embed`;

/* Formulaire */
$('#leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.currentTarget; const fd = new FormData(f); const msg = $('#leadMsg');
  if (!fd.get('nom') || !fd.get('telephone') || !fd.get('consent')) { msg.className = 'msg err'; msg.textContent = 'Merci d’indiquer votre nom, votre téléphone et d’accepter l’utilisation de vos données.'; return; }
  const btn = f.querySelector('button[type=submit]'); btn.disabled = true;
  const row = {}; ['nom', 'prenom', 'telephone', 'email', 'ville', 'type_bien', 'lot_souhaite', 'source', 'message'].forEach((k) => { const v = String(fd.get(k) || '').trim(); if (v) row[k] = v.slice(0, 1000); });
  const { error } = await sb.from('prospects').insert(row);
  btn.disabled = false;
  if (error) { msg.className = 'msg err'; msg.textContent = 'L’envoi a échoué. Réessayez ou appelez-nous directement.'; return; }
  f.reset(); msg.className = 'msg ok'; msg.textContent = 'Merci ! Votre demande est bien reçue, un conseiller vous rappelle rapidement.';
});
