// ==============================================
// VizinhoPro — Módulo de Autenticação (Supabase)
// ==============================================

// Sessão armazenada no sessionStorage
function getCurrentUser() {
    const raw = sessionStorage.getItem('vizinhopro_session');
    if (!raw) return null;
    const session = JSON.parse(raw);
    // REQ08: expiração por inatividade de 30 minutos
    if (Date.now() - session.lastActivity > 30 * 60 * 1000) {
        sessionStorage.removeItem('vizinhopro_session');
        return null;
    }
    session.lastActivity = Date.now();
    sessionStorage.setItem('vizinhopro_session', JSON.stringify(session));
    return session;
}

// Login via Supabase REST (consulta tabela usuarios) — REQ01
async function login(email, senha) {
    try {
        const users = await supabaseGet('usuarios', `select=*&email=eq.${encodeURIComponent(email)}&senha=eq.${encodeURIComponent(senha)}&ativo=eq.true&limit=1`);
        if (users.length === 0) {
            return { success: false, message: 'Credenciais inválidas.' };
        }
        const user = users[0];
        const session = {
            userId: user.id,
            nome: user.nome,
            email: user.email,
            bloco: user.bloco,
            apto: user.apto,
            role: user.role,
            lastActivity: Date.now()
        };
        sessionStorage.setItem('vizinhopro_session', JSON.stringify(session));
        return { success: true, user: session };
    } catch (e) {
        return { success: false, message: 'Erro de conexão com o servidor.' };
    }
}

function logout() {
    sessionStorage.removeItem('vizinhopro_session');
    window.location.replace('login.html');
}

// REQ08: protege rotas — esconde body e redireciona
function requireAuth() {
    const user = getCurrentUser();
    if (!user) {
        document.body.style.display = 'none';
        window.location.replace('login.html');
        throw new Error('AUTH_REQUIRED');
    }
    return user;
}

function requireAdmin() {
    const user = requireAuth();
    if (user && user.role !== 'admin') {
        document.body.style.display = 'none';
        window.location.replace('inicio.html');
        throw new Error('ADMIN_REQUIRED');
    }
    return user;
}

// Renderiza header do usuário na página
function renderUserHeader() {
    const user = getCurrentUser();
    if (!user) return;

    const nameEl = document.querySelector('[data-user-name]');
    const avatarEl = document.querySelector('[data-user-avatar]');
    const logoutBtn = document.querySelector('[data-logout]');
    const adminLinks = document.querySelectorAll('[data-admin-only]');

    if (nameEl) nameEl.textContent = user.nome;
    if (avatarEl) avatarEl.textContent = user.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

    // Esconde links admin para moradores
    if (user.role !== 'admin') {
        adminLinks.forEach(el => el.style.display = 'none');
    }
}
