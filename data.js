// ==============================================
// VizinhoPro — Módulo de Dados (Supabase REST API)
// ==============================================
const SUPABASE_URL = 'https://bxcnnngxvgfukblodyke.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ4Y25ubmd4dmdmdWtibG9keWtlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzNjUxNDksImV4cCI6MjA4ODk0MTE0OX0.BdgSwCu-r68usr-IBXcyiUjC9m923SZHHcT4ZKcASG0';

function supabaseHeaders() {
    return {
        'apikey': SUPABASE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };
}

async function supabaseGet(table, query) {
    const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
    const res = await fetch(url, { headers: supabaseHeaders() });
    if (!res.ok) throw new Error(`Supabase GET ${table}: ${res.statusText}`);
    return res.json();
}

async function supabasePost(table, data) {
    const url = `${SUPABASE_URL}/rest/v1/${table}`;
    const res = await fetch(url, {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Supabase POST ${table}: ${res.statusText}`);
    }
    return res.json();
}

async function supabasePatch(table, query, data) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
    const res = await fetch(url, {
        method: 'PATCH',
        headers: supabaseHeaders(),
        body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`Supabase PATCH ${table}: ${res.statusText}`);
    return res.json();
}

async function supabaseDelete(table, query) {
    const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
    const res = await fetch(url, {
        method: 'DELETE',
        headers: supabaseHeaders()
    });
    if (!res.ok) throw new Error(`Supabase DELETE ${table}: ${res.statusText}`);
    return res;
}

// ==================== USUÁRIOS ====================

async function getUsers() {
    return supabaseGet('usuarios', 'select=*&order=data_cadastro.asc');
}

async function getUserByEmail(email) {
    const users = await supabaseGet('usuarios', `select=*&email=eq.${encodeURIComponent(email)}&limit=1`);
    return users.length > 0 ? users[0] : null;
}

async function addUser(userData) {
    try {
        const rows = await supabasePost('usuarios', {
            nome: userData.nome,
            email: userData.email,
            senha: userData.senha,
            bloco: userData.bloco,
            apto: userData.apto,
            role: 'morador',
            ativo: true
        });
        return { success: true, user: rows[0] };
    } catch (e) {
        if (e.message.includes('unique') || e.message.includes('duplicate') || e.message.includes('idx_unique_apt_bloco_ativo')) {
            return { success: false, message: 'Já existe um morador ativo neste apartamento/bloco ou e-mail já cadastrado.' };
        }
        return { success: false, message: e.message };
    }
}

async function toggleUserActive(userId) {
    const users = await supabaseGet('usuarios', `select=ativo&id=eq.${userId}`);
    if (users.length === 0) return;
    const newAtivo = !users[0].ativo;
    await supabasePatch('usuarios', `id=eq.${userId}`, { ativo: newAtivo });
}

// ==================== PRESTADORES ====================

async function getProviders() {
    return supabaseGet('prestadores', 'select=*&order=data_cadastro.asc');
}

async function getProviderById(id) {
    const rows = await supabaseGet('prestadores', `select=*&id=eq.${id}`);
    return rows.length > 0 ? rows[0] : null;
}

async function addProvider(providerData) {
    try {
        const rows = await supabasePost('prestadores', {
            nome: providerData.nome,
            categoria: providerData.categoria,
            telefone: providerData.telefone || null,
            email: providerData.email || null,
            descricao: providerData.descricao || '',
            imagem: providerData.imagem || null,
            cadastrado_por: providerData.cadastradoPor || null
        });
        return { success: true, provider: rows[0] };
    } catch (e) {
        return { success: false, message: e.message };
    }
}

// ==================== AVALIAÇÕES ====================

async function getReviews() {
    return supabaseGet('avaliacoes', 'select=*&order=data.desc');
}

async function getReviewsByProvider(prestadorId) {
    return supabaseGet('avaliacoes', `select=*&prestador_id=eq.${prestadorId}&order=data.desc`);
}

async function addReview(reviewData) {
    try {
        const rows = await supabasePost('avaliacoes', {
            prestador_id: reviewData.prestadorId,
            usuario_id: reviewData.userId,
            user_bloco: reviewData.userBloco,
            user_apto: reviewData.userApto,
            nota: reviewData.nota,
            comentario: reviewData.comentario,
            data_dia: new Date().toISOString().split('T')[0]
        });
        return { success: true, review: rows[0] };
    } catch (e) {
        if (e.message.includes('idx_unique_review_per_day') || e.message.includes('unique') || e.message.includes('duplicate')) {
            return { success: false, message: 'Você já avaliou este profissional hoje. Tente novamente amanhã!' };
        }
        return { success: false, message: e.message };
    }
}

// ==================== RANKING (REQ06) ====================

async function getProviderStats() {
    const providers = await getProviders();
    const reviews = await supabaseGet('avaliacoes', 'select=prestador_id,nota');
    
    return providers.map(p => {
        const provReviews = reviews.filter(r => r.prestador_id === p.id);
        const total = provReviews.length;
        const media = total > 0 
            ? (provReviews.reduce((acc, r) => acc + r.nota, 0) / total).toFixed(1) 
            : '0.0';
        
        return {
            ...p,
            total,
            media: parseFloat(media),
            insuficiente: total < 2
        };
    });
}

async function getRanking(categoria) {
    const stats = await getProviderStats();
    let filtered = stats;
    
    if (categoria && categoria !== 'todos') {
        filtered = stats.filter(p => p.categoria === categoria);
    }
    
    // Ordenar: primeiro os com avaliações (por média desc), depois sem avaliações
    return filtered.sort((a, b) => {
        if (a.total === 0 && b.total === 0) return 0;
        if (a.total === 0) return 1;
        if (b.total === 0) return -1;
        return b.media - a.media || b.total - a.total;
    });
}

// ==================== LGPD (REQ11) ====================

async function exportProviderData(prestadorId) {
    const provider = await getProviderById(prestadorId);
    if (!provider) return null;
    const reviews = await getReviewsByProvider(prestadorId);
    return { prestador: provider, avaliacoes: reviews };
}

async function deleteProviderData(prestadorId) {
    // As avaliações são deletadas em cascata pela FK
    await supabaseDelete('prestadores', `id=eq.${prestadorId}`);
}

// ==================== HELPERS ====================

function getCategoriaLabel(cat) {
    const labels = {
        'eletrica': 'Elétrica',
        'hidraulica': 'Hidráulica',
        'limpeza': 'Limpeza',
        'jardinagem': 'Jardinagem',
        'pintura': 'Pintura',
        'ar-condicionado': 'Ar-Condicionado',
        'marcenaria': 'Marcenaria',
        'engenharia': 'Engenharia',
        'outro': 'Outro'
    };
    return labels[cat] || cat;
}

function getCategoriaIcon(cat) {
    const icons = {
        'eletrica': { icon: 'bolt', color: 'text-yellow-500' },
        'hidraulica': { icon: 'water_drop', color: 'text-blue-500' },
        'limpeza': { icon: 'mop', color: 'text-green-500' },
        'jardinagem': { icon: 'park', color: 'text-emerald-500' },
        'pintura': { icon: 'format_paint', color: 'text-orange-500' },
        'ar-condicionado': { icon: 'ac_unit', color: 'text-cyan-500' },
        'marcenaria': { icon: 'carpenter', color: 'text-amber-700' },
        'engenharia': { icon: 'engineering', color: 'text-purple-500' },
        'outro': { icon: 'more_horiz', color: 'text-gray-500' }
    };
    return icons[cat] || icons['outro'];
}
