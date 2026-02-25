// CONFIGURAÇÕES INICIAIS
const XP_PARA_LEVEL_UP = 100;

// COMBINADOS(Regras) - Editável e salvo no localStorage
let COMBINADOS = JSON.parse(localStorage.getItem("combinados")) || [];

// Estado da Aplicação
let alunos = JSON.parse(localStorage.getItem("alunos")) || [];

let alunoSelecionado = null;

// Turma (ano + turma) — persistida no localStorage
let TURMA = JSON.parse(localStorage.getItem('turma')) || { ano: '2°', turma: 'B' };

function atualizarTituloTurma() {
    const selectAno = document.getElementById('selectAno');
    const selectTurma = document.getElementById('selectTurma');
    if (selectAno && selectTurma) {
        TURMA.ano = selectAno.value;
        TURMA.turma = selectTurma.value;
        localStorage.setItem('turma', JSON.stringify(TURMA));
    }
    const titulo = document.getElementById('tituloTurma');
    if (titulo) {
        titulo.innerText = `Combinados da Sala - ${TURMA.ano} ${TURMA.turma}`;
    }
}

function inicializarTurma() {
    const selectAno = document.getElementById('selectAno');
    const selectTurma = document.getElementById('selectTurma');
    if (selectAno) selectAno.value = TURMA.ano || '2°';
    if (selectTurma) selectTurma.value = TURMA.turma || 'B';
    atualizarTituloTurma();
}

// Garantir que cada aluno tenha um histórico e migrar dados antigos
alunos = alunos.map(aluno => {
    if (!Array.isArray(aluno.historico)) {
        const totalHistorico = ((aluno.level || 1) - 1) * XP_PARA_LEVEL_UP + (aluno.xp || 0);
        aluno.historico = [];
        if (totalHistorico > 0) {
            aluno.historico.push({ id: Date.now() + Math.floor(Math.random()*1000), valor: totalHistorico, texto: 'Importado', timestamp: new Date().toISOString() });
        }
    }
    // Recalcula level e xp a partir do histórico
    recomputarAlunoPorHistorico(aluno);
    return aluno;
});

// FUNÇÕES PRINCIPAIS

function salvarDados() {
    localStorage.setItem("alunos", JSON.stringify(alunos));
    localStorage.setItem("combinados", JSON.stringify(COMBINADOS));
    renderizarAlunos();
    renderizarRanking();
    renderizarCombinados();
}

function recomputarAlunoPorHistorico(aluno) {
    const total = Math.max(0, aluno.historico.reduce((s, r) => s + (Number(r.valor) || 0), 0));
    aluno.level = 1 + Math.floor(total / XP_PARA_LEVEL_UP);
    aluno.xp = total % XP_PARA_LEVEL_UP;
}

function renderizarAlunos() {
    const grind = document.getElementById("gridAlunos");
    grind.innerHTML = "";

    // Ordena os alunos por nome (alfabético, sensível a acentos em pt-BR)
    const alunosOrdenados = [...alunos].sort((a, b) =>
        (a.nome || '').localeCompare((b.nome || ''), 'pt-BR', { sensitivity: 'base' })
    );

    alunosOrdenados.forEach(aluno => {
        // Calculo da % da barra de progresso
        const porcentagem = (aluno.xp / XP_PARA_LEVEL_UP) * 100;

        // AVATAR PADRÃO POR GÊNERO
        let avatarUrl;
        if (aluno.genero === 'F') {
            // Imagem padrão para meninas
            avatarUrl = "./img/feminino.jpg";
        } else {
            // Imagem padrão para meninos
            avatarUrl = "./img/masculino.jpg";
        }

        const card = document.createElement("div");
        card.className = "card-aluno";

        card.innerHTML = `
        <div class="level-badge">Nivel ${aluno.level}</div>
        <div class="avatar-container">
            <img src="${avatarUrl}" alt="${aluno.nome}" class="avatar" onclick="abrirHistorico(${aluno.id})">
            <div class="avatar-buttons">
                <button class="btn-action-small" onclick="abrirModal(${aluno.id})" title="Ações">⚡</button>
                <button class="btn-edit" onclick="editarAluno(${aluno.id})" title="Editar">✏️</button>
                <button class="btn-delete" onclick="deletarAluno(${aluno.id})" title="Deletar">🗑️</button>
            </div>
        </div>
        <div class="nome">${aluno.nome}</div>
        <div class="xp-container">
            <div class="xp-bar" style="width: ${porcentagem}%;"></div>
        </div>
        <div class="xp-text">${aluno.xp} / ${XP_PARA_LEVEL_UP} XP</div>
        `;

        grind.appendChild(card);
    });
}

function renderizarRanking() {
    const rankingList = document.getElementById("rankingList");
    rankingList.innerHTML = "";

    // Filtra apenas alunos com XP > 0, ordena por XP + (level * XP_PARA_LEVEL_UP) e pega os 5 primeiros
    const top5 = [...alunos]
        .map(a => ({
            ...a,
            xpTotal: ( (a.level - 1) * XP_PARA_LEVEL_UP ) + (a.xp || 0)
        }))
        .filter(a => a.xpTotal > 0)
        .sort((a, b) => b.xpTotal - a.xpTotal)
        .slice(0, 5);

    top5.forEach((aluno, index) => {
        const xpTotal = aluno.xpTotal !== undefined ? aluno.xpTotal : ((aluno.level - 1) * XP_PARA_LEVEL_UP + (aluno.xp || 0));
        const posicao = index + 1;
        let medalha = '';
        let classe = '';

        if (posicao === 1) {
            medalha = '🥇';
            classe = 'primeiro';
        } else if (posicao === 2) {
            medalha = '🥈';
            classe = 'segundo';
        } else if (posicao === 3) {
            medalha = '🥉';
            classe = 'terceiro';
        } else {
            medalha = `#${posicao}`;
        }

        const item = document.createElement("div");
        item.className = `ranking-item ${classe}`;
        item.innerHTML = `
            <span class="ranking-posicao">${medalha}</span>
            <span class="ranking-nome">${aluno.nome}</span>
            <span class="ranking-xp">Lv.${aluno.level} +${aluno.xp}XP</span>
        `;
        rankingList.appendChild(item);
    });
}

function renderizarCombinados() {
    const combinadosList = document.getElementById("combinadosList");
    combinadosList.innerHTML = "";

    COMBINADOS.forEach(comb => {
        const item = document.createElement("div");
        item.className = `combinado-item ${comb.tipo}`;
        
        const sinal = comb.tipo === "bom" ? '+' : '-';
        
        item.innerHTML = `
            <span class="combinado-texto">${comb.texto}</span>
            <span class="combinado-xp ${comb.tipo}">${sinal}${comb.xp} XP</span>
            <div class="combinado-actions">
                <button class="btn-edit" onclick="editarCombinado(${comb.id})" title="Editar">✏️</button>
                <button class="btn-delete" onclick="deletarCombinado(${comb.id})" title="Deletar">🗑️</button>
            </div>
        `;
        combinadosList.appendChild(item);
    });
}

// Editar / Deletar combinados
function editarCombinado(id) {
    const comb = COMBINADOS.find(c => c.id === id);
    if (!comb) return;

    document.getElementById('inputTextoCombinado').value = comb.texto;
    document.getElementById('inputXPCombinado').value = comb.xp;
    document.getElementById('inputTipoCombinado').value = comb.tipo;

    const modal = document.getElementById('modalCombinado');
    modal.dataset.editId = id;
    modal.querySelector('.modal-title').innerText = 'Editar Combinado';
    modal.style.display = 'flex';
}

function deletarCombinado(id) {
    const comb = COMBINADOS.find(c => c.id === id);
    if (!comb) return;
    if (!confirm(`Confirma excluir o combinado "${comb.texto}"? Esta ação não pode ser desfeita.`)) return;
    COMBINADOS = COMBINADOS.filter(c => c.id !== id);
    salvarDados();
}

function abrirModal(id) {
    alunoSelecionado = id;
    const aluno = alunos.find(a => a.id === id);

    document.getElementById("modalNomeAluno").innerText = `Ação para: ${aluno.nome}`;

    const lista = document.getElementById("listaCombinados");
    lista.innerHTML = "";

    COMBINADOS.forEach(comb => {
        const btn = document.createElement("button");
        const classeTipo = comb.tipo === "bom" ? 'btn-positive' : 'btn-negative';
        const sinal = comb.tipo === "bom" ? '+' : '-';
        const xpValue = comb.tipo === "bom" ? comb.xp : -comb.xp;

        btn.className = `btn-action ${classeTipo}`;
        btn.innerHTML = `<span>${comb.texto}</span>
        <span>${sinal}${comb.xp} XP</span>`;
        btn.onclick = () => aplicarAcao(xpValue, comb.texto);

        lista.appendChild(btn);
    });

    document.getElementById('modalAcoes').style.display = 'flex';

}

function fecharModal() {
    document.getElementById('modalAcoes').style.display = 'none';
    alunoSelecionado = null;
}

function aplicarAcao(valor, texto) {
    const index = alunos.findIndex(a => a.id === alunoSelecionado);
    if (index !== -1) {
        let aluno = alunos[index];

        // Cria registro no histórico
        const registro = {
            id: Date.now() + Math.floor(Math.random()*1000),
            valor: Number(valor) || 0,
            texto: texto || 'Ação',
            timestamp: new Date().toISOString()
        };
        aluno.historico.push(registro);

        // Recalcula level/xp a partir do histórico (ganhos acumulados)
        recomputarAlunoPorHistorico(aluno);

        // Notifica se houve level up
        // Calcula total antes e depois para detectar mudança de nível
        // (opcional)

        salvarDados();
        fecharModal();
    }
}

// Abre modal de histórico do aluno
function abrirHistorico(id) {
    alunoSelecionado = id;
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) return;

    document.getElementById('modalNomeHistorico').innerText = `Histórico: ${aluno.nome}`;
    renderizarHistorico(aluno);
    document.getElementById('modalHistorico').style.display = 'flex';
}

function fecharHistorico() {
    document.getElementById('modalHistorico').style.display = 'none';
    alunoSelecionado = null;
}

function renderizarHistorico(aluno) {
    const list = document.getElementById('historicoList');
    list.innerHTML = '';
    if (!aluno.historico) aluno.historico = [];

    // Mostra em ordem cronológica reversa (mais recente primeiro)
    [...aluno.historico].reverse().forEach(reg => {
        const el = document.createElement('div');
        el.className = 'historico-item';
        const sinal = reg.valor >= 0 ? '+' : '-';
        const valorAbs = Math.abs(reg.valor);
        const data = new Date(reg.timestamp).toLocaleString();
        el.innerHTML = `
            <div class="hist-text"><strong>${sinal}${valorAbs} XP</strong> — ${reg.texto}<br><small>${data}</small></div>
            <div class="hist-actions">
                <button onclick="editarRegistro(${aluno.id}, ${reg.id})">✏️</button>
                <button onclick="deletarRegistro(${aluno.id}, ${reg.id})">🗑️</button>
            </div>
        `;
        list.appendChild(el);
    });
}

function editarRegistro(alunoId, registroId) {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) return;
    const idx = aluno.historico.findIndex(r => r.id === registroId);
    if (idx === -1) return;
    const reg = aluno.historico[idx];

    const novoTexto = prompt('Editar descrição:', reg.texto);
    if (novoTexto === null) return; // cancel
    const novoValorRaw = prompt('Editar valor (use - para debitar):', String(reg.valor));
    if (novoValorRaw === null) return;
    const novoValor = Number(novoValorRaw);
    if (isNaN(novoValor)) { alert('Valor inválido'); return; }

    reg.texto = novoTexto;
    reg.valor = novoValor;
    reg.timestamp = new Date().toISOString();

    recomputarAlunoPorHistorico(aluno);
    salvarDados();
    renderizarHistorico(aluno);
}

function deletarRegistro(alunoId, registroId) {
    const aluno = alunos.find(a => a.id === alunoId);
    if (!aluno) return;
    const idx = aluno.historico.findIndex(r => r.id === registroId);
    if (idx === -1) return;
    if (!confirm('Confirma excluir este registro?')) return;

    aluno.historico.splice(idx, 1);
    recomputarAlunoPorHistorico(aluno);
    salvarDados();
    renderizarHistorico(aluno);
}


function adicionarAluno() {
    // Mantido para compatibilidade; abre o formulário
    abrirFormAluno();
}

function resetarTudo(){
    if(confirm("Tem certeza que deseja resetar todos os dados? Esta ação não pode ser desfeita.")) {
        localStorage.removeItem("alunos");
        localStorage.removeItem("combinados");
        location.reload();
    }
}

// Funções de Editar e Deletar Aluno
function editarAluno(id) {
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) return;
    
    document.getElementById('inputNomeAluno').value = aluno.nome;
    document.getElementById('inputXPAluno').value = aluno.xp;
    document.getElementById('inputLevelAluno').value = aluno.level;
    document.getElementById('inputGeneroAluno').value = aluno.genero;
    
    // Muda o título e o comportamento do botão salvar
    const modal = document.getElementById('modalAluno');
    modal.dataset.editId = id;
    modal.querySelector('.modal-title').innerText = 'Editar Aluno';
    
    document.getElementById('modalAluno').style.display = 'flex';
}

function deletarAluno(id) {
    const aluno = alunos.find(a => a.id === id);
    if (!aluno) return;
    
    if (confirm(`Tem certeza que deseja deletar ${aluno.nome}? Esta ação não pode ser desfeita.`)) {
        alunos = alunos.filter(a => a.id !== id);
        salvarDados();
    }
}

// Funções do formulário de Aluno
function abrirFormAluno() {
    document.getElementById('inputNomeAluno').value = '';
    document.getElementById('inputXPAluno').value = 0;
    document.getElementById('inputLevelAluno').value = 1;
    document.getElementById('inputGeneroAluno').value = 'M';
    
    // Reseta o modo editar
    const modal = document.getElementById('modalAluno');
    modal.dataset.editId = '';
    modal.querySelector('.modal-title').innerText = 'Trazer Aluno';
    
    document.getElementById('modalAluno').style.display = 'flex';
}

function fecharModalAluno() {
    document.getElementById('modalAluno').style.display = 'none';
}

function salvarAlunoFromForm() {
    const nome = document.getElementById('inputNomeAluno').value.trim();
    const xp = parseInt(document.getElementById('inputXPAluno').value, 10) || 0;
    const level = parseInt(document.getElementById('inputLevelAluno').value, 10) || 1;
    const genero = document.getElementById('inputGeneroAluno').value || 'M';

    if (!nome) { alert('Nome é obrigatório.'); return; }

    const modal = document.getElementById('modalAluno');
    const editId = modal.dataset.editId;
    
    if (editId) {
        // Modo editar - atualizar aluno existente
        const index = alunos.findIndex(a => a.id === parseInt(editId, 10));
        if (index !== -1) {
            // Atualiza o aluno mantendo histórico atualizado a partir dos valores informados
            const total = (level - 1) * XP_PARA_LEVEL_UP + xp;
            const registroInicial = { id: Date.now() + Math.floor(Math.random()*1000), valor: total, texto: 'Atualizado', timestamp: new Date().toISOString() };
            alunos[index] = { id: alunos[index].id, nome: nome, xp: xp, level: level, genero: genero, historico: [registroInicial] };
            recomputarAlunoPorHistorico(alunos[index]);
        }
    } else {
        // Modo adicionar - novo aluno
        const novoId = Date.now();
        const total = (level - 1) * XP_PARA_LEVEL_UP + xp;
        const historico = total > 0 ? [{ id: Date.now() + Math.floor(Math.random()*1000), valor: total, texto: 'Inicial', timestamp: new Date().toISOString() }] : [];
        const novoAluno = { id: novoId, nome: nome, xp: xp, level: level, genero: genero, historico: historico };
        recomputarAlunoPorHistorico(novoAluno);
        alunos.push(novoAluno);
    }
    
    salvarDados();
    fecharModalAluno();
}

// Funções do formulário de Combinado
function abrirFormCombinado() {
    document.getElementById('inputTextoCombinado').value = '';
    document.getElementById('inputXPCombinado').value = 10;
    document.getElementById('inputTipoCombinado').value = 'bom';
    // reseta modo editar
    const modal = document.getElementById('modalCombinado');
    modal.dataset.editId = '';
    modal.querySelector('.modal-title').innerText = 'Adicionar Combinado';
    document.getElementById('modalCombinado').style.display = 'flex';
}

function fecharModalCombinado() {
    document.getElementById('modalCombinado').style.display = 'none';
}

function salvarCombinadoFromForm() {
    const texto = document.getElementById('inputTextoCombinado').value.trim();
    const xp = parseInt(document.getElementById('inputXPCombinado').value, 10) || 0;
    const tipo = document.getElementById('inputTipoCombinado').value || 'bom';

    if (!texto) { alert('Texto é obrigatório.'); return; }

    const modal = document.getElementById('modalCombinado');
    const editId = modal.dataset.editId;

    if (editId) {
        const idx = COMBINADOS.findIndex(c => c.id === parseInt(editId, 10));
        if (idx !== -1) {
            COMBINADOS[idx] = { id: COMBINADOS[idx].id, texto: texto, xp: xp, tipo: tipo };
        }
    } else {
        const novoId = Date.now();
        COMBINADOS.push({ id: novoId, texto: texto, xp: xp, tipo: tipo });
    }

    salvarDados();
    fecharModalCombinado();
}

// INICIALIZAÇÃO
renderizarAlunos();
renderizarRanking();
renderizarCombinados();
inicializarTurma();
