/* VITALITY - aplicação: estrutura, navegação por hash, login e inicialização. */
(function () {
  'use strict';
  const V = window.V;
  V.nav = { route: 'dashboard', params: {} };

  const MENU = [
    ['dashboard', 'Dashboard', 'dashboard'], ['empresas', 'Encontrar empresas', 'search'], ['studio', 'Gerador de sites', 'wand'],
    ['projetos', 'Meus projetos', 'folder'], ['clientes', 'Clientes', 'users'], ['modelos', 'Modelos de sites', 'layout'], ['config', 'Configurações', 'gear'],
  ];
  const ROUTES = MENU.map((m) => m[0]).concat(['editor']);

  V.go = (route, params) => {
    if (!ROUTES.includes(route)) route = 'dashboard';
    V.nav.params = params || {};
    if (location.hash.slice(1) === route) V.render(); else location.hash = route;
  };
  window.addEventListener('hashchange', () => { const r = location.hash.slice(1); if (ROUTES.includes(r) && r !== V.nav.route) { V.nav.route = r; V.render(true); } });

  function shell() {
    const s = V.state.settings, logged = V.api.isCloud();
    V.$('#root').innerHTML = `<div id="app"><aside class="side" aria-label="Menu principal">
        <div class="brand"><img class="brand-logo" src="src/assets/logo.png" alt="Vitality - Conectando ideias"></div>
        <nav class="nav">${MENU.map((m) => `<a href="#${m[0]}" data-r="${m[0]}">${V.icon(m[2])}<span>${m[1]}</span>${m[0] === 'projetos' ? `<span class="count" id="c-p"></span>` : m[0] === 'clientes' ? `<span class="count" id="c-c"></span>` : ''}</a>`).join('')}</nav>
        <div class="side-foot"><div class="mode-pill ${logged ? 'live' : ''}" title="${logged ? 'Dados no Supabase' : 'Dados só neste navegador'}"><i></i>${logged ? 'Conectado ao Supabase' : 'Modo local'}</div>
          <div class="user-card"><div class="avatar">${V.esc(V.initials(logged ? V.profile.email : s.agencyName))}</div><div class="grow" style="min-width:0"><div style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${V.esc(logged ? V.profile.email : s.agencyName)}</div><div class="muted" style="font-size:11.5px">${logged ? (V.profile.role === 'admin' ? 'Administrador' : 'Membro') : 'Sem login'}</div></div>${logged ? `<button class="btn icon sm ghost" data-act="logout" aria-label="Sair" title="Sair">${V.icon('logout', 'sm')}</button>` : ''}</div>
          <div class="muted" style="font-size:11px;padding:0 6px">Transformamos negócios em experiências digitais.</div></div></aside>
      <div class="main"><div class="topbar"><button class="btn icon sm" data-act="nav-toggle" aria-label="Abrir menu">${V.icon('menu')}</button><img src="src/assets/logo.png" alt="Vitality" style="height:26px;width:auto"></div><div id="view"></div></div><div class="scrim" data-act="nav-toggle"></div></div>`;
  }
  V.acts['nav-toggle'] = () => document.body.classList.toggle('nav-open');
  V.acts.logout = () => { V.auth.signOut(); location.reload(); };

  V.render = (changed) => {
    const view = V.$('#view'); if (!view) return;
    const r = V.nav.route; const v = V.views[r === 'editor' ? 'editor' : r];
    document.body.classList.remove('nav-open');
    const ap = V.$('#app'); if (ap) ap.classList.toggle('editing', r === 'editor');
    view.className = ''; view.innerHTML = '';
    try { v.render(view, V.nav.params); }
    catch (e) { console.error(e); view.innerHTML = `<div class="page"><div class="banner err">${V.icon('warn')}<div><b>Não foi possível abrir esta tela.</b><br>${V.esc(e.message)}</div></div></div>`; }
    const active = r === 'editor' ? 'projetos' : r;
    V.$$('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.r === active));
    const cp = V.$('#c-p'), cc = V.$('#c-c');
    if (cp) cp.textContent = V.state.projects.length || ''; if (cc) cc.textContent = V.state.clients.length || '';
    if (cp && !V.state.projects.length) cp.style.display = 'none'; if (cc && !V.state.clients.length) cc.style.display = 'none';
    if (changed) window.scrollTo(0, 0);
  };

  /* ------------------------------------------------------------------- login */
  function loginView(msg, kind) {
    V.$('#root').innerHTML = `<div class="login"><div class="login-art"><img src="src/assets/logo.png" alt="Vitality - Conectando ideias" style="width:min(300px,70%);height:auto">
      <div><h1>Transformamos negócios em experiências digitais.</h1><p class="muted" style="margin-top:14px;max-width:44ch">Encontre empresas sem presença digital, crie o site delas e acompanhe cada negociação em um só lugar.</p></div><div class="muted" style="font-size:12px">Sul de Minas Gerais</div></div>
      <div class="login-form"><form class="card col" id="lf" style="gap:14px"><h2 id="lf-t">Entrar</h2>
        ${msg ? `<div class="banner ${kind || ''}">${V.icon(kind === 'info' ? 'info' : 'warn')}<div>${V.esc(msg)}</div></div>` : ''}
        <div class="field"><label for="lf-e">E-mail</label><input id="lf-e" class="inp" type="email" autocomplete="username" required></div>
        <div class="field"><label for="lf-p">Senha</label><input id="lf-p" class="inp" type="password" autocomplete="current-password" minlength="6" required></div>
        <button class="btn primary" type="submit" id="lf-b" style="min-height:44px">Entrar</button>
        <button class="btn ghost" type="button" id="lf-s">Criar conta</button>
        <p class="muted" style="font-size:12px">O primeiro cadastro vira administrador. Os demais precisam ser aprovados por ele.</p></form></div></div>`;
    let signup = false;
    V.$('#lf-s').onclick = () => { signup = !signup; V.$('#lf-t').textContent = signup ? 'Criar conta' : 'Entrar'; V.$('#lf-b').textContent = signup ? 'Cadastrar' : 'Entrar'; V.$('#lf-s').textContent = signup ? 'Já tenho conta' : 'Criar conta'; V.$('#lf-p').autocomplete = signup ? 'new-password' : 'current-password'; };
    V.$('#lf').onsubmit = async (e) => {
      e.preventDefault(); const b = V.$('#lf-b'); b.disabled = true; const em = V.$('#lf-e').value.trim(), pw = V.$('#lf-p').value;
      try {
        if (signup) { const d = await V.auth.signUp(em, pw); if (!d.access_token) return loginView('Conta criada. Se o projeto exige confirmação por e-mail, confirme e entre. Depois, aguarde a aprovação do administrador (o primeiro cadastro já entra aprovado).', 'info'); }
        else await V.auth.signIn(em, pw);
        await startCloud();
      } catch (err) { b.disabled = false; V.toast(/Invalid login/i.test(err.message) ? 'E-mail ou senha incorretos.' : err.message, 'err'); }
    };
  }

  async function startCloud() {
    const p = await V.auth.loadProfile();
    if (!p || !p.approved) { V.auth.signOut(); return loginView('Sua conta ainda não foi aprovada por um administrador.', ''); }
    await V.sync.pull(); await V.api.refreshIntegrations(); enter();
  }

  function enter() {
    shell();
    const r = location.hash.slice(1); V.nav.route = ROUTES.includes(r) ? r : 'dashboard';
    if (V.nav.route === 'editor' && !V.find('projects', V.ed.id)) V.nav.route = 'projetos';
    V.render();
  }

  window.addEventListener('error', (e) => { if (e.message && !/ResizeObserver/.test(e.message)) console.error(e.error || e.message); });
  window.addEventListener('unhandledrejection', (e) => { console.error(e.reason); V.toast('Erro inesperado: ' + ((e.reason && e.reason.message) || e.reason), 'err'); });

  async function boot() {
    V.loadState();
    if (!V.cloudConfigured() && !V.state.settings.demoSeeded && !V.state.leads.length) {
      V.state.leads = V.demoLeads(); V.state.settings.demoSeeded = true; V.saveLocal();
    }
    try {
      if (V.cloudConfigured()) { if (V.auth.restore()) { try { await startCloud(); } catch (e) { V.auth.signOut(); loginView('Sua sessão expirou. Entre novamente.', ''); } } else loginView(); }
      else enter();
    } finally { const b = V.$('#boot'); if (b) { b.style.opacity = '0'; setTimeout(() => b.remove(), 400); } }
  }
  boot();
})();
