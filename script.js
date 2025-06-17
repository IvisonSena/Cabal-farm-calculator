// Dados armazenados localmente
let atividades = JSON.parse(localStorage.getItem('atividades')) || [];
let itens = JSON.parse(localStorage.getItem('itens')) || [];
let farms = JSON.parse(localStorage.getItem('farms')) || [];
let entradas = [];
let drops = [];

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    carregarSelects();
    carregarFarmsSalvos();
    inicializarUX();
    setTimeout(recuperarFarmTemp, 1000);
    document.getElementById('dataFarm').value = new Date().toISOString().split('T')[0];
});

// === GERENCIAR ATIVIDADES ===
function adicionarTipoAtividade() {
    const tipo = document.getElementById('tipoAtividadeInput').value.trim();
    if (!tipo) {
        mostrarNotificacao('Digite um tipo de atividade!', 'warning');
        return;
    }
    
    const select = document.getElementById('tipoAtividadeSelect');
    const option = document.createElement('option');
    option.value = tipo;
    option.textContent = tipo;
    select.appendChild(option);
    
    document.getElementById('tipoAtividadeInput').value = '';
    mostrarNotificacao('Tipo de atividade adicionado!', 'success');
}

function salvarAtividade() {
    const tipo = document.getElementById('tipoAtividadeSelect').value;
    const nome = document.getElementById('nomeAtividadeInput').value.trim();
    const custo = parseFloat(document.getElementById('custoAtividadeInput').value) || 0;
    const imagemFile = document.getElementById('imagemAtividade').files[0];
    
    if (tipo === 'Selecione...' || !nome) {
        mostrarNotificacao('Preencha todos os campos obrigatórios!', 'error');
        return;
    }
    
    const atividade = {
        id: Date.now(),
        tipo: tipo,
        nome: nome,
        custo: custo,
        imagem: ''
    };
    
    if (imagemFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            atividade.imagem = e.target.result;
            atividades.push(atividade);
            localStorage.setItem('atividades', JSON.stringify(atividades));
            carregarSelects();
            mostrarNotificacao('Atividade salva com sucesso!', 'success');
        };
        reader.readAsDataURL(imagemFile);
    } else {
        atividades.push(atividade);
        localStorage.setItem('atividades', JSON.stringify(atividades));
        carregarSelects();
        mostrarNotificacao('Atividade salva com sucesso!', 'success');
    }
    
    // Limpar campos
    document.getElementById('nomeAtividadeInput').value = '';
    document.getElementById('custoAtividadeInput').value = '';
    document.getElementById('imagemAtividade').value = '';
}

// === GERENCIAR ITENS ===
function salvarItem() {
    const nome = document.getElementById('nomeItemInput').value.trim();
    const valor = parseFloat(document.getElementById('valorItemInput').value) || 0;
    const imagemFile = document.getElementById('imagemItem').files[0];
    
    if (!nome) {
        mostrarNotificacao('Digite o nome do item!', 'warning');
        return;
    }
    
    const item = {
        id: Date.now(),
        nome: nome,
        valor: valor,
        imagem: ''
    };
    
    if (imagemFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            item.imagem = e.target.result;
            itens.push(item);
            localStorage.setItem('itens', JSON.stringify(itens));
            carregarSelects();
            mostrarNotificacao('Item adicionado com sucesso!', 'success');
        };
        reader.readAsDataURL(imagemFile);
    } else {
        itens.push(item);
        localStorage.setItem('itens', JSON.stringify(itens));
        carregarSelects();
        mostrarNotificacao('Item adicionado com sucesso!', 'success');
    }
    
    // Limpar campos
    document.getElementById('nomeItemInput').value = '';
    document.getElementById('valorItemInput').value = '';
    document.getElementById('imagemItem').value = '';
}

// === CARREGAR SELECTS ===
function carregarSelects() {
    // Carregar select de entradas (apenas atividades)
    const entradaSelect = document.getElementById('entradaSelect');
    entradaSelect.innerHTML = '<option>Selecione...</option>';
    
    atividades.forEach(atividade => {
        const option = document.createElement('option');
        option.value = `atividade_${atividade.id}`;
        option.textContent = `${atividade.tipo} - ${atividade.nome}`;
        option.dataset.valor = atividade.custo;
        option.dataset.imagem = atividade.imagem || '';
        entradaSelect.appendChild(option);
    });
    
    // Carregar select de drops (apenas itens)
    const dropSelect = document.getElementById('dropSelect');
    dropSelect.innerHTML = '<option>Selecione...</option>';
    
    itens.forEach(item => {
        const option = document.createElement('option');
        option.value = item.id;
        option.textContent = item.nome;
        option.dataset.valor = item.valor;
        option.dataset.imagem = item.imagem || '';
        dropSelect.appendChild(option);
    });
}

// === EVENTOS DOS SELECTS ===
function configurarEventosSelects() {
    document.getElementById('entradaSelect').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.valor) {
            document.getElementById('entradaValor').value = selectedOption.dataset.valor;
        }
    });

    document.getElementById('dropSelect').addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        if (selectedOption.dataset.valor) {
            document.getElementById('dropValor').value = selectedOption.dataset.valor;
        }
    });
}

// === CALCULAR FARM ===
function adicionarEntrada() {
    const select = document.getElementById('entradaSelect');
    const qtd = parseInt(document.getElementById('entradaQtd').value) || 1;
    const valor = parseFloat(document.getElementById('entradaValor').value) || 0;
    
    if (select.value === 'Selecione...') {
        mostrarNotificacao('Selecione um item/atividade!', 'warning');
        return;
    }
    
    const selectedOption = select.options[select.selectedIndex];
    const entrada = {
        id: Date.now(),
        nome: selectedOption.text,
        quantidade: qtd,
        valorUnitario: valor,
        total: qtd * valor,
        imagem: selectedOption.dataset.imagem || ''
    };
    
    entradas.push(entrada);
    atualizarTabelaEntradas();
    calcularResumo();
    
    // Limpar campos
    document.getElementById('entradaQtd').value = 1;
    document.getElementById('entradaValor').value = '';
    
    mostrarNotificacao('Custo adicionado!', 'success');
}

function adicionarDrop() {
    const select = document.getElementById('dropSelect');
    const qtd = parseInt(document.getElementById('dropQtd').value) || 1;
    const valor = parseFloat(document.getElementById('dropValor').value) || 0;
    
    if (select.value === 'Selecione...') {
        mostrarNotificacao('Selecione um item!', 'warning');
        return;
    }
    
    const selectedOption = select.options[select.selectedIndex];
    const drop = {
        id: Date.now(),
        nome: selectedOption.text,
        quantidade: qtd,
        valorUnitario: valor,
        total: qtd * valor,
        imagem: selectedOption.dataset.imagem || ''
    };
    
    drops.push(drop);
    atualizarTabelaDrops();
    calcularResumo();
    
    // Limpar campos
    document.getElementById('dropQtd').value = 1;
    document.getElementById('dropValor').value = '';
    
    mostrarNotificacao('Drop adicionado!', 'success');
}

function atualizarTabelaEntradas() {
    const tabela = document.getElementById('tabelaEntradas');
    tabela.innerHTML = '<tr><th>Imagem</th><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
    
    entradas.forEach(entrada => {
        const row = tabela.insertRow();
        const imagemHtml = entrada.imagem ? `<img src="${entrada.imagem}" style="width: 32px; height: 32px;">` : '📦';
        row.innerHTML = `
            <td>${imagemHtml}</td>
            <td>${entrada.nome}</td>
            <td>${entrada.quantidade}</td>
            <td>${formatarAlz(entrada.valorUnitario)}</td>
            <td class="valor-negativo">${formatarAlz(entrada.total)}</td>
            <td><button onclick="removerEntrada(${entrada.id})" title="Remover item">🗑️</button></td>
        `;
    });
}

function atualizarTabelaDrops() {
    const tabela = document.getElementById('tabelaDrops');
    tabela.innerHTML = '<tr><th>Imagem</th><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
    
    drops.forEach(drop => {
        const row = tabela.insertRow();
        const imagemHtml = drop.imagem ? `<img src="${drop.imagem}" style="width: 32px; height: 32px;">` : '💎';
        row.innerHTML = `
            <td>${imagemHtml}</td>
            <td>${drop.nome}</td>
            <td>${drop.quantidade}</td>
            <td>${formatarAlz(drop.valorUnitario)}</td>
            <td class="valor-positivo">${formatarAlz(drop.total)}</td>
            <td><button onclick="removerDrop(${drop.id})" title="Remover item">🗑️</button></td>
        `;
    });
}

function removerEntrada(id) {
    entradas = entradas.filter(entrada => entrada.id !== id);
    atualizarTabelaEntradas();
    calcularResumo();
    mostrarNotificacao('Custo removido!', 'info');
}

function removerDrop(id) {
    drops = drops.filter(drop => drop.id !== id);
    atualizarTabelaDrops();
    calcularResumo();
    mostrarNotificacao('Drop removido!', 'info');
}

function calcularResumo() {
    const totalCustos = entradas.reduce((sum, entrada) => sum + entrada.total, 0);
    const totalDrops = drops.reduce((sum, drop) => sum + drop.total, 0);
    const lucro = totalDrops - totalCustos;
    
    // Lista detalhada de custos
    let listaCustos = '';
    entradas.forEach(entrada => {
        const imagemHtml = entrada.imagem ? `<img src="${entrada.imagem}" style="width: 20px; height: 20px; margin-right: 5px;">` : '📦 ';
        listaCustos += `<div style="display: flex; align-items: center; margin: 2px 0;">
            ${imagemHtml}${entrada.nome} x${entrada.quantidade} = ${formatarAlz(entrada.total)}
        </div>`;
    });
    
    // Lista detalhada de drops
    let listaDrops = '';
    drops.forEach(drop => {
        const imagemHtml = drop.imagem ? `<img src="${drop.imagem}" style="width: 20px; height: 20px; margin-right: 5px;">` : '💎 ';
        listaDrops += `<div style="display: flex; align-items: center; margin: 2px 0;">
            ${imagemHtml}${drop.nome} x${drop.quantidade} = ${formatarAlz(drop.total)}
        </div>`;
    });
    
    const resumo = document.getElementById('resumoFarm');
    resumo.innerHTML = `
        <table>
            <tr>
                <td><strong>💰 Total Custos:</strong></td>
                <td class="valor-negativo">${formatarAlz(totalCustos)}</td>
            </tr>
            <tr>
                <td><strong>💎 Total Drops:</strong></td>
                <td class="valor-positivo">${formatarAlz(totalDrops)}</td>
            </tr>
            <tr>
                <td><strong>📊 Lucro/Prejuízo:</strong></td>
                <td class="${lucro >= 0 ? 'valor-positivo' : 'valor-negativo'}">${formatarAlz(lucro)}</td>
            </tr>
        </table>
        
        ${entradas.length > 0 ? `<div style="margin-top: 15px;"><strong>📋 Detalhes dos Custos:</strong><div style="margin-left: 10px;">${listaCustos}</div></div>` : ''}
        
        ${drops.length > 0 ? `<div style="margin-top: 15px;"><strong>💎 Detalhes dos Drops:</strong><div style="margin-left: 10px;">${listaDrops}</div></div>` : ''}
    `;
}

// === SALVAR E GERENCIAR FARMS ===
function salvarFarm() {
    const nome = document.getElementById('nomeFarmInput').value.trim();
    const observacoes = document.getElementById('observacoesFarm').value.trim();
    const data = document.getElementById('dataFarm').value;
    
    if (!nome) {
        alert('Digite um nome para o farm!');
        return;
    }
    
    if (!data) {
        alert('Selecione uma data!');
        return;
    }
    
    const totalEntradas = entradas.reduce((sum, item) => sum + item.total, 0);
    const totalDrops = drops.reduce((sum, item) => sum + item.total, 0);
    const lucro = totalDrops - totalEntradas;
    
    const farm = {
        id: Date.now(),
        nome: nome,
        observacoes: observacoes,
        data: data,
        entradas: [...entradas],
        drops: [...drops],
        totalEntradas: totalEntradas,
        totalDrops: totalDrops,
        lucro: lucro
    };
    
    farms.push(farm);
    localStorage.setItem('farms', JSON.stringify(farms));
    carregarFarmsSalvos();
    mostrarNotificacao('Farm salvo com sucesso!', 'success');
}

function limparFarm() {
    if (confirm('Tem certeza que deseja limpar todos os dados?')) {
        entradas = [];
        drops = [];
        document.getElementById('nomeFarmInput').value = '';
        document.getElementById('observacoesFarm').value = '';
        document.getElementById('tabelaEntradas').innerHTML = '<tr><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
        document.getElementById('tabelaDrops').innerHTML = '<tr><th>Item</th><th>Qtd</th><th>V. Unitário</th><th>Total</th><th>Ações</th></tr>';
        atualizarResumo();
        mostrarNotificacao('Dados limpos!', 'info');
    }
}

function carregarFarmsSalvos() {
    const lista = document.getElementById('listaFarms');
    lista.innerHTML = '';
    
    if (farms.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Nenhum farm salvo ainda.</p>';
        return;
    }
    
    farms.sort(function(a, b) { return new Date(b.data) - new Date(a.data); }).forEach(function(farm) {
        const div = document.createElement('div');
        
        // Gerar HTML das observações se existir
        let observacoesHtml = '';
        if (farm.observacoes && farm.observacoes.trim() !== '') {
            observacoesHtml = '<div style="margin-bottom: 10px;"><strong>📝 Observações:</strong><br>' +
                '<div style="background: white; padding: 6px; border-radius: 4px; border-left: 3px solid #3498db; margin-top: 3px; font-style: italic;">' +
                farm.observacoes + '</div></div>';
        }
        
        div.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
            '<strong style="color: #2c3e50;">' + farm.nome + '</strong>' +
            '<span class="badge ' + (farm.lucro >= 0 ? 'badge-success' : 'badge-danger') + '">' +
            (farm.lucro >= 0 ? 'Lucro' : 'Prejuízo') + '</span></div>' +
            '<div style="font-size: 12px; color:rgb(3, 3, 3); margin-bottom: 8px;">📅 ' + formatarData(farm.data) + '</div>' +
            '<div style="font-weight: bold; margin-bottom: 10px;">💰 ' + formatarAlz(farm.lucro) + '</div>' +
            '<div id="detalhes_' + farm.id + '" style="display: none; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; font-size: 11px;">' +
            observacoesHtml +
            '<div><strong>📋 Entradas/Custos:</strong></div>' +
            farm.entradas.map(function(entrada) {
                return '<div style="margin: 2px 0; display: flex; align-items: center;">' +
                    (entrada.imagem ? '<img src="' + entrada.imagem + '" style="width: 16px; height: 16px; margin-right: 5px;">' : '📦 ') +
                    entrada.nome + ' x' + entrada.quantidade + ' = ' + formatarAlz(entrada.total) + '</div>';
            }).join('') +
            '<div style="margin-top: 8px;"><strong>💎 Drops:</strong></div>' +
            farm.drops.map(function(drop) {
                return '<div style="margin: 2px 0; display: flex; align-items: center;">' +
                    (drop.imagem ? '<img src="' + drop.imagem + '" style="width: 16px; height: 16px; margin-right: 5px;">' : '💎 ') +
                    drop.nome + ' x' + drop.quantidade + ' = ' + formatarAlz(drop.total) + '</div>';
            }).join('') +
            '</div>' +
            '<div style="display: flex; gap: 5px;">' +
            '<button onclick="toggleDetalhesFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Ver detalhes">👁️ Detalhes</button>' +
            '<button onclick="carregarFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Carregar farm">📂 Carregar</button>' +
            '<button onclick="duplicarFarm(' + farm.id + ')" style="flex: 1; font-size: 11px;" title="Duplicar farm">📋 Duplicar</button>' +
            '<button onclick="excluirFarm(' + farm.id + ')" style="flex: 1; font-size: 11px; background: #e74c3c;" title="Excluir farm">🗑️ Excluir</button>' +
            '</div>';
        lista.appendChild(div);
    });
}

function carregarFarm(id) {
    const farm = farms.find(f => f.id === id);
    if (!farm) return;
    
    entradas = [...farm.entradas];
    drops = [...farm.drops];
    
    document.getElementById('nomeFarmInput').value = farm.nome;
    document.getElementById('dataFarm').value = farm.data;
    
    atualizarTabelaEntradas();
    atualizarTabelaDrops();
    calcularResumo();
    
    mostrarNotificacao('Farm carregado com sucesso!', 'success');
}

function duplicarFarm(id) {
    const farm = farms.find(f => f.id === id);
    if (!farm) return;
    
    entradas = [...farm.entradas];
    drops = [...farm.drops];
    
    document.getElementById('nomeFarmInput').value = farm.nome + ' (Cópia)';
    document.getElementById('dataFarm').value = new Date().toISOString().split('T')[0];
    
    atualizarTabelaEntradas();
    atualizarTabelaDrops();
    calcularResumo();
    
    mostrarNotificacao('Farm duplicado! Altere o nome e salve novamente.', 'info');
}

function excluirFarm(id) {
    const farm = farms.find(f => f.id === id);
    if (!farm) return;
    
    if (confirm(`Tem certeza que deseja excluir o farm "${farm.nome}"?`)) {
        farms = farms.filter(f => f.id !== id);
        localStorage.setItem('farms', JSON.stringify(farms));
        carregarFarmsSalvos();
        mostrarNotificacao('Farm excluído!', 'info');
    }
}

function toggleDetalhesFarm(id) {
    const detalhes = document.getElementById(`detalhes_${id}`);
    if (detalhes.style.display === 'none') {
        detalhes.style.display = 'block';
    } else {
        detalhes.style.display = 'none';
    }
}

// === CALCULAR PERÍODO ===
function calcularPeriodo() {
    const dataInicio = document.getElementById('dataInicio').value;
    const dataFim = document.getElementById('dataFim').value;
    
    if (!dataInicio || !dataFim) {
        mostrarNotificacao('Selecione as datas de início e fim!', 'warning');
        return;
    }
    
    if (dataInicio > dataFim) {
        mostrarNotificacao('Data de início deve ser anterior à data fim!', 'error');
        return;
    }
    
    const farmsPeriodo = farms.filter(farm => {
        return farm.data >= dataInicio && farm.data <= dataFim;
    });
    
    if (farmsPeriodo.length === 0) {
        document.getElementById('resultadoPeriodo').innerHTML = 
            '<p style="text-align: center; color: #7f8c8d; font-style: italic;">Nenhum farm encontrado no período.</p>';
        return;
    }
    
    const totalLucro = farmsPeriodo.reduce((sum, farm) => sum + farm.lucro, 0);
    const totalCustos = farmsPeriodo.reduce((sum, farm) => sum + farm.totalCustos, 0);
    const totalDrops = farmsPeriodo.reduce((sum, farm) => sum + farm.totalDrops, 0);
    const farmsLucrativos = farmsPeriodo.filter(f => f.lucro > 0).length;
    const farmsPrejuizo = farmsPeriodo.filter(f => f.lucro < 0).length;
    
    document.getElementById('resultadoPeriodo').innerHTML = `
        <div>
            <div style="text-align: center; margin-bottom: 15px;">
                <strong>📊 Resumo do Período</strong><br>
                <small style="color: #7f8c8d;">📅 ${formatarData(dataInicio)} até ${formatarData(dataFim)}</small>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px;">
                <div style="text-align: center; padding: 8px; background: rgba(52, 152, 219, 0.1); border-radius: 6px;">
                    <div style="font-size: 18px; font-weight: bold; color: #3498db;">${farmsPeriodo.length}</div>
                    <div style="font-size: 11px; color: #7f8c8d;">Total Farms</div>
                </div>
                <div style="text-align: center; padding: 8px; background: rgba(39, 174, 96, 0.1); border-radius: 6px;">
                    <div style="font-size: 18px; font-weight: bold; color: #27ae60;">${farmsLucrativos}</div>
                    <div style="font-size: 11px; color: #7f8c8d;">Lucrativos</div>
                </div>
            </div>
            
            <table style="width: 100%; font-size: 12px;">
                <tr>
                    <td><strong>💰 Total investido:</strong></td>
                    <td class="valor-negativo" style="text-align: right;">${formatarAlz(totalCustos)}</td>
                </tr>
                <tr>
                    <td><strong>💎 Total obtido:</strong></td>
                    <td class="valor-positivo" style="text-align: right;">${formatarAlz(totalDrops)}</td>
                </tr>
                <tr style="border-top: 2px solid #3498db;">
                    <td><strong>📈 Lucro total:</strong></td>
                    <td class="${totalLucro >= 0 ? 'valor-positivo' : 'valor-negativo'}" style="text-align: right; font-weight: bold;">
                        ${formatarAlz(totalLucro)}
                    </td>
                </tr>
                <tr>
                    <td><strong>📊 Lucro médio/farm:</strong></td>
                    <td class="${totalLucro >= 0 ? 'valor-positivo' : 'valor-negativo'}" style="text-align: right;">
                        ${formatarAlz(totalLucro / farmsPeriodo.length)}
                    </td>
                </tr>
                <tr>
                    <td><strong>📈 Taxa de sucesso:</strong></td>
                    <td style="text-align: right; color: #3498db; font-weight: bold;">
                        ${((farmsLucrativos / farmsPeriodo.length) * 100).toFixed(1)}%
                    </td>
                </tr>
            </table>
        </div>
    `;
}

// === FUNÇÕES UTILITÁRIAS ===
function formatarAlz(valor) {
    if (valor === 0) return '<span class="color-branco">0 Alz</span>';
    
    const absValor = Math.abs(valor);
    const valorFormatado = absValor.toLocaleString('pt-BR') + ' Alz';
    const corClass = obterCorAlz(absValor);
    
    return `<span class="${corClass}">${valor < 0 ? '-' : ''}${valorFormatado}</span>`;
}

function obterCorAlz(valor) {
    if (valor <= 9999) return 'color-branco';
    if (valor <= 999999) return 'color-amarelo';
    if (valor <= 9999999) return 'color-ciano';
    if (valor <= 99999999) return 'color-verde';
    if (valor <= 999999999) return 'color-laranja';
    if (valor <= 9999999999) return 'color-azul';
    if (valor <= 99999999999) return 'color-verdeclaro';
    return 'color-rosaescuro';
}

function adicionarEventosCoresAlz() {
    const camposAlz = ['custoAtividadeInput', 'valorItemInput', 'entradaValor', 'dropValor'];
    
    camposAlz.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', function() {
                const valor = parseFloat(this.value) || 0;
                const corClass = obterCorAlz(valor);
                
                // Remover classes de cor anteriores
                this.classList.remove('color-branco', 'color-amarelo', 'color-ciano', 'color-verde', 'color-laranja', 'color-azul', 'color-verdeclaro', 'color-rosaescuro');
                
                // Adicionar nova classe de cor
                this.classList.add(corClass);
            });
        }
    });
}

function formatarData(data) {
    const date = new Date(data + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// === SISTEMA DE NOTIFICAÇÕES ===
function mostrarNotificacao(mensagem, tipo = 'info') {
    // Remove notificação anterior se existir
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente) {
        notificacaoExistente.remove();
    }
    
    const notificacao = document.createElement('div');
    notificacao.className = 'notificacao';
    notificacao.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 1000;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Definir cor baseada no tipo
    const cores = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notificacao.style.background = cores[tipo] || cores.info;
    notificacao.textContent = mensagem;
    
    document.body.appendChild(notificacao);
    
    // Remover após 3 segundos
    setTimeout(() => {
        if (notificacao.parentNode) {
            notificacao.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notificacao.remove(), 300);
        }
    }, 3000);
}

// Adicionar CSS das animações das notificações
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// === FUNCIONALIDADES EXTRAS ===

// Exportar dados para backup
function exportarDados() {
    const dados = {
        atividades: atividades,
        itens: itens,
        farms: farms,
        versao: '1.0',
        dataExportacao: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(dados, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `farm-calculator-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    mostrarNotificacao('Backup exportado com sucesso!', 'success');
}

// Importar dados de backup
function importarDados(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const dados = JSON.parse(e.target.result);
            
            // Validar estrutura do backup
            if (!dados.atividades || !dados.itens || !dados.farms) {
                throw new Error('Estrutura de backup inválida');
            }
            
            if (confirm('⚠️ Isso irá substituir todos os dados atuais. Continuar?\n\n💡 Dica: Faça um backup dos dados atuais antes de continuar.')) {
                atividades = dados.atividades || [];
                itens = dados.itens || [];
                farms = dados.farms || [];
                
                localStorage.setItem('atividades', JSON.stringify(atividades));
                localStorage.setItem('itens', JSON.stringify(itens));
                localStorage.setItem('farms', JSON.stringify(farms));
                
                carregarSelects();
                carregarFarmsSalvos();
                
                mostrarNotificacao(`Dados importados com sucesso! ${farms.length} farms, ${atividades.length} atividades, ${itens.length} itens.`, 'success');
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            mostrarNotificacao('Erro ao importar arquivo. Verifique se é um backup válido.', 'error');
        }
    };
    reader.readAsText(file);
    
    // Limpar input para permitir reimportar o mesmo arquivo
    event.target.value = '';
}

// Mostrar estatísticas gerais
function mostrarEstatisticas() {
    if (farms.length === 0) {
        mostrarNotificacao('Nenhum farm registrado ainda!', 'warning');
        return;
    }
    
    const totalFarms = farms.length;
    const farmsLucrativos = farms.filter(f => f.lucro > 0).length;
    const farmsPrejuizo = farms.filter(f => f.lucro < 0).length;
    const farmsNeutros = farms.filter(f => f.lucro === 0).length;
    const lucroTotal = farms.reduce((sum, f) => sum + f.lucro, 0);
    const lucroMedio = lucroTotal / totalFarms;
    const melhorFarm = farms.reduce((max, f) => f.lucro > max.lucro ? f : max);
    const piorFarm = farms.reduce((min, f) => f.lucro < min.lucro ? f : min);
    
    // Calcular estatísticas por período
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const farmsDoMes = farms.filter(f => new Date(f.data) >= inicioMes);
    const lucroDoMes = farmsDoMes.reduce((sum, f) => sum + f.lucro, 0);
    
    const stats = `📊 ESTATÍSTICAS GERAIS

🎯 RESUMO GERAL:
• Total de farms: ${totalFarms}
• Farms lucrativos: ${farmsLucrativos} (${((farmsLucrativos/totalFarms)*100).toFixed(1)}%)
• Farms com prejuízo: ${farmsPrejuizo} (${((farmsPrejuizo/totalFarms)*100).toFixed(1)}%)
• Farms neutros: ${farmsNeutros}

💰 FINANCEIRO:
• Lucro total: ${formatarAlz(lucroTotal)}
• Lucro médio por farm: ${formatarAlz(lucroMedio)}
• Lucro do mês atual: ${formatarAlz(lucroDoMes)} (${farmsDoMes.length} farms)

🏆 RECORDES:
• Melhor farm: "${melhorFarm.nome}" 
  ${formatarAlz(melhorFarm.lucro)} em ${formatarData(melhorFarm.data)}
• Pior farm: "${piorFarm.nome}"
  ${formatarAlz(piorFarm.lucro)} em ${formatarData(piorFarm.data)}

📈 PERFORMANCE:
• Taxa de sucesso geral: ${((farmsLucrativos/totalFarms)*100).toFixed(1)}%
• Farms registrados este mês: ${farmsDoMes.length}`;
    
    alert(stats);
}

// Mostrar dicas de uso
function mostrarDicas() {
    const dicas = `💡 DICAS DE USO DA CALCULADORA

⌨️ ATALHOS DE TECLADO:
• Ctrl + S: Salvar farm atual
• Ctrl + L: Limpar farm atual  
• Ctrl + E: Exportar backup dos dados

🎯 FLUXO RECOMENDADO:
1️⃣ Cadastre suas atividades principais (DG, DX, Arena,)
2️⃣ Cadastre os itens que podem dropar com valores atualizados
3️⃣ Para cada sessão de farm:
   • Adicione todos os custos (entradas, consumíveis, etc.)
   • Adicione todos os drops obtidos
   • Salve o farm para histórico
4️⃣ Use análises por período para avaliar performance

💰 DICAS DE VALORES:
• Use valores em Alz (ex: 1000000 para 1M)
• Mantenha os valores dos itens sempre atualizados
• Considere todos os custos: entradas, pots, repairs, etc.

📊 ANÁLISES AVANÇADAS:
• Use o cálculo por período para análises mensais/semanais
• Compare diferentes tipos de farm
• Identifique os farms mais lucrativos
• Monitore sua taxa de sucesso

🔧 MANUTENÇÃO:
• Faça backup dos dados regularmente
• Limpe farms muito antigos se necessário
• Atualize valores dos itens conforme o mercado
• Use a função de duplicar farm para sessões similares

🎮 DICAS ESPECÍFICAS CABAL:
• Considere o custo de teleporte e consumíveis
• Inclua drops secundários (alz, materiais, etc.)
• Monitore eventos especiais que afetam drops
• Compare eficiência entre diferentes horários`;
    
    alert(dicas);
}

// Limpar todos os dados
function limparTodosDados() {
    const confirmacao1 = confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os dados salvos!\n\n📋 Dados que serão perdidos:\n• Todas as atividades cadastradas\n• Todos os itens cadastrados\n• Todos os farms salvos\n\nEsta ação NÃO pode ser desfeita!\n\nTem certeza que deseja continuar?');
    
    if (!confirmacao1) return;
    
    const confirmacao2 = confirm('🚨 ÚLTIMA CONFIRMAÇÃO!\n\nTodos os dados serão perdidos permanentemente.\n\n💡 Recomendação: Faça um backup antes de continuar.\n\nDigite "CONFIRMAR" na próxima tela para prosseguir.');
    
    if (!confirmacao2) return;
    
    const confirmacaoTexto = prompt('Digite "CONFIRMAR" (em maiúsculas) para apagar todos os dados:');
    
    if (confirmacaoTexto !== 'CONFIRMAR') {
        mostrarNotificacao('Operação cancelada.', 'info');
        return;
    }
    
    // Limpar todos os dados
    localStorage.clear();
    atividades = [];
    itens = [];
    farms = [];
    entradas = [];
    drops = [];
    
    // Recarregar interface
    carregarSelects();
    carregarFarmsSalvos();
    atualizarTabelaEntradas();
    atualizarTabelaDrops();
    calcularResumo();
    
    // Limpar campos
    document.getElementById('nomeFarmInput').value = '';
    document.getElementById('dataFarm').value = new Date().toISOString().split('T')[0];
    document.getElementById('resultadoPeriodo').innerHTML = '';
    
    mostrarNotificacao('Todos os dados foram apagados!', 'success');
}

// === FUNCIONALIDADES DE UX ===

// Inicializar melhorias de experiência do usuário
function inicializarUX() {
    // Configurar eventos dos selects
    configurarEventosSelects();
    
    // Adicionar placeholder dinâmico nos campos de valor
    const campos = ['entradaValor', 'dropValor', 'custoAtividadeInput', 'valorItemInput'];
    campos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('focus', function() {
                if (!this.placeholder.includes('ex:')) {
                    this.placeholder = 'ex: 1000000 (1M Alz)';
                }
            });
            
            campo.addEventListener('blur', function() {
                if (!this.value) {
                    this.placeholder = this.placeholder.split(' (')[0];
                }
            });
        }
    });
    
    // Auto-save temporário para recuperação
    setInterval(() => {
        if (entradas.length > 0 || drops.length > 0) {
            const farmTemp = {
                entradas: entradas,
                drops: drops,
                nome: document.getElementById('nomeFarmInput').value,
                data: document.getElementById('dataFarm').value,
                timestamp: Date.now()
            };
            localStorage.setItem('farmTemp', JSON.stringify(farmTemp));
        }
    }, 30000); // Auto-save a cada 30 segundos
    
    // Adicionar tooltips informativos
    adicionarTooltips();
    
    // Configurar validações em tempo real
    configurarValidacoes();
    
    // Adicionar esta linha no final da função:
    adicionarEventosCoresAlz();
}

// Adicionar tooltips informativos
function adicionarTooltips() {
    const tooltips = {
        'tipoAtividadeInput': 'Ex: Dungeon, Boss, Evento, PvP',
        'custoAtividadeInput': 'Custo padrão de entrada em Alz',
        'valorItemInput': 'Valor atual do item no mercado',
        'entradaQtd': 'Quantas vezes você fez essa atividade',
        'dropQtd': 'Quantidade do item que dropou',
        'nomeFarmInput': 'Nome para identificar esta sessão de farm',
        'dataFarm': 'Data em que o farm foi realizado'
    };
    
    Object.entries(tooltips).forEach(([id, texto]) => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.title = texto;
        }
    });
}

// Configurar validações em tempo real
function configurarValidacoes() {
    // Validar campos numéricos
    const camposNumericos = ['custoAtividadeInput', 'valorItemInput', 'entradaQtd', 'dropQtd', 'entradaValor', 'dropValor'];
    
    camposNumericos.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('input', function() {
                // Remover caracteres não numéricos (exceto ponto e vírgula)
                this.value = this.value.replace(/[^0-9.,]/g, '');
                
                // Substituir vírgula por ponto
                this.value = this.value.replace(',', '.');
                
                // Validar se é um número válido
                if (this.value && isNaN(parseFloat(this.value))) {
                    this.style.borderColor = '#e74c3c';
                } else {
                    this.style.borderColor = '#e0e0e0';
                }
            });
        }
    });
}

// Recuperar farm temporário
function recuperarFarmTemp() {
    const farmTempStr = localStorage.getItem('farmTemp');
    if (!farmTempStr) return;
    
    try {
        const farmTemp = JSON.parse(farmTempStr);
        
        // Verificar se o farm temporário não é muito antigo (mais de 24 horas)
        const agora = Date.now();
        const tempoLimite = 24 * 60 * 60 * 1000; // 24 horas em ms
        
        if (agora - farmTemp.timestamp > tempoLimite) {
            localStorage.removeItem('farmTemp');
            return;
        }
        
        if ((farmTemp.entradas && farmTemp.entradas.length > 0) || 
            (farmTemp.drops && farmTemp.drops.length > 0)) {
            
            if (confirm('🔄 Encontrei um farm não salvo da sua última sessão.\n\nDeseja recuperá-lo?')) {
                entradas = farmTemp.entradas || [];
                drops = farmTemp.drops || [];
                
                if (farmTemp.nome) {
                    document.getElementById('nomeFarmInput').value = farmTemp.nome;
                }
                if (farmTemp.data) {
                    document.getElementById('dataFarm').value = farmTemp.data;
                }
                
                atualizarTabelaEntradas();
                atualizarTabelaDrops();
                calcularResumo();
                
                mostrarNotificacao('Farm recuperado com sucesso!', 'success');
            }
            
            localStorage.removeItem('farmTemp');
        }
    } catch (error) {
        console.error('Erro ao recuperar farm temporário:', error);
        localStorage.removeItem('farmTemp');
    }
}

// === ATALHOS DE TECLADO ===
document.addEventListener('keydown', function(e) {
    // Ctrl + S para salvar farm
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        salvarFarm();
    }
    
    // Ctrl + L para limpar farm atual
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        limparFarm();
    }
    
    // Ctrl + E para exportar dados
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        exportarDados();
    }
    
    // Ctrl + D para duplicar último farm
    if (e.ctrlKey && e.key === 'd') {
        e.preventDefault();
        if (farms.length > 0) {
            duplicarFarm(farms[farms.length - 1].id);
        }
    }
    
    // ESC para limpar seleções
    if (e.key === 'Escape') {
        document.getElementById('entradaSelect').selectedIndex = 0;
        document.getElementById('dropSelect').selectedIndex = 0;
        document.getElementById('entradaValor').value = '';
        document.getElementById('dropValor').value = '';
    }
});

// === INICIALIZAÇÃO FINAL ===

// Adicionar alguns dados de exemplo na primeira execução
function adicionarDadosExemplo() {
    // Não adicionar dados de exemplo - usuário vai cadastrar manualmente
    localStorage.setItem('primeiraExecucao', 'false');
}

// Executar inicialização de dados de exemplo após carregamento
setTimeout(adicionarDadosExemplo, 2000);

// === FUNÇÕES DE FORMATAÇÃO MELHORADAS ===

// Melhorar formatação de números grandes
function formatarNumero(valor) {
    return valor.toLocaleString('pt-BR');
}

// Calcular porcentagem de lucro
function calcularPorcentagemLucro(lucro, investimento) {
    if (investimento === 0) return 0;
    return ((lucro / investimento) * 100).toFixed(1);
}

// === VALIDAÇÕES FINAIS ===

// Validar dados antes de salvar
function validarDadosFarm() {
    if (entradas.length === 0 && drops.length === 0) {
        return { valido: false, mensagem: 'Adicione pelo menos um custo ou drop!' };
    }
    
    const nome = document.getElementById('nomeFarmInput').value.trim();
    if (!nome) {
        return { valido: false, mensagem: 'Digite um nome para o farm!' };
    }
    
    return { valido: true };
}

// Sobrescrever função salvarFarm com validação
const salvarFarmOriginal = salvarFarm;
salvarFarm = function() {
    const validacao = validarDadosFarm();
    if (!validacao.valido) {
        mostrarNotificacao(validacao.mensagem, 'warning');
        return;
    }
    salvarFarmOriginal();
};

// === LOG DE ATIVIDADES (OPCIONAL) ===
function logAtividade(acao, detalhes = '') {
    const log = {
        timestamp: new Date().toISOString(),
        acao: acao,
        detalhes: detalhes
    };
    
    let logs = JSON.parse(localStorage.getItem('logs')) || [];
    logs.push(log);
    
    // Manter apenas os últimos 100 logs
    if (logs.length > 100) {
        logs = logs.slice(-100);
    }
    
    localStorage.setItem('logs', JSON.stringify(logs));
}

// Adicionar logs nas principais ações
const salvarAtividadeOriginal = salvarAtividade;
salvarAtividade = function() {
    salvarAtividadeOriginal();
    logAtividade('Atividade salva', document.getElementById('nomeAtividadeInput').value);
};

const salvarItemOriginal = salvarItem;
salvarItem = function() {
    salvarItemOriginal();
    logAtividade('Item salvo', document.getElementById('nomeItemInput').value);
};

// Adicionar funções de gerenciamento de listas:
function mostrarAbaGerenciar(tipo) {
    // Ocultar todas as abas
    document.getElementById('abaAtividades').style.display = 'none';
    document.getElementById('abaItens').style.display = 'none';
    
    // Resetar botões
    document.getElementById('btnAbaAtividades').style.background = '';
    document.getElementById('btnAbaItens').style.background = '';
    
    if (tipo === 'atividades') {
        document.getElementById('abaAtividades').style.display = 'block';
        document.getElementById('btnAbaAtividades').style.background = '#3498db';
        carregarListaAtividades();
    } else {
        document.getElementById('abaItens').style.display = 'block';
        document.getElementById('btnAbaItens').style.background = '#3498db';
        carregarListaItens();
    }
}

function carregarListaAtividades() {
    const lista = document.getElementById('listaAtividades');
    lista.innerHTML = '';
    
    if (atividades.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhuma atividade cadastrada.</p>';
        return;
    }
    
    atividades.forEach((atividade, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; align-items: center; gap: 10px;';
        
        div.innerHTML = `
            <div style="width: 40px;">
                ${atividade.imagem ? `<img src="${atividade.imagem}" style="width: 32px; height: 32px;">` : '📦'}
            </div>
            <div style="flex: 1;">
                <strong>${atividade.tipo} - ${atividade.nome}</strong><br>
                <small>Custo: ${formatarAlz(atividade.custo)}</small>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="moverAtividade(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover para cima">⬆️</button>
                <button onclick="moverAtividade(${index}, 1)" ${index === atividades.length - 1 ? 'disabled' : ''} title="Mover para baixo">⬇️</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="editarAtividade(${atividade.id})" title="Editar">✏️</button>
                <button onclick="excluirAtividade(${atividade.id})" title="Excluir" style="background: #e74c3c;">🗑️</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

function carregarListaItens() {
    const lista = document.getElementById('listaItens');
    lista.innerHTML = '';
    
    if (itens.length === 0) {
        lista.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhum item cadastrado.</p>';
        return;
    }
    
    itens.forEach((item, index) => {
        const div = document.createElement('div');
        div.style.cssText = 'border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 5px; display: flex; align-items: center; gap: 10px;';
        
        div.innerHTML = `
            <div style="width: 40px;">
                ${item.imagem ? `<img src="${item.imagem}" style="width: 32px; height: 32px;">` : '💎'}
            </div>
            <div style="flex: 1;">
                <strong>${item.nome}</strong><br>
                <small>Valor: ${formatarAlz(item.valor)}</small>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="moverItem(${index}, -1)" ${index === 0 ? 'disabled' : ''} title="Mover para cima">⬆️</button>
                <button onclick="moverItem(${index}, 1)" ${index === itens.length - 1 ? 'disabled' : ''} title="Mover para baixo">⬇️</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 2px;">
                <button onclick="editarItem(${item.id})" title="Editar">✏️</button>
                <button onclick="excluirItem(${item.id})" title="Excluir" style="background: #e74c3c;">🗑️</button>
            </div>
        `;
        lista.appendChild(div);
    });
}

// Funções de movimentação:
function moverAtividade(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= atividades.length) return;
    
    [atividades[index], atividades[novoIndex]] = [atividades[novoIndex], atividades[index]];
    localStorage.setItem('atividades', JSON.stringify(atividades));
    carregarListaAtividades();
    carregarSelects();
}

function moverItem(index, direcao) {
    const novoIndex = index + direcao;
    if (novoIndex < 0 || novoIndex >= itens.length) return;
    
    [itens[index], itens[novoIndex]] = [itens[novoIndex], itens[index]];
    localStorage.setItem('itens', JSON.stringify(itens));
    carregarListaItens();
    carregarSelects();
}

// Funções de exclusão:
function excluirAtividade(id) {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
        atividades = atividades.filter(a => a.id !== id);
        localStorage.setItem('atividades', JSON.stringify(atividades));
        carregarListaAtividades();
        carregarSelects();
        mostrarNotificacao('Atividade excluída!', 'info');
    }
}

function excluirItem(id) {
    if (confirm('Tem certeza que deseja excluir este item?')) {
        itens = itens.filter(i => i.id !== id);
        localStorage.setItem('itens', JSON.stringify(itens));
        carregarListaItens();
        carregarSelects();
        mostrarNotificacao('Item excluído!', 'info');
    }
}

function recolherAbas() {
    document.getElementById('abaAtividades').style.display = 'none';
    document.getElementById('abaItens').style.display = 'none';
    document.getElementById('btnAbaAtividades').style.background = '';
    document.getElementById('btnAbaItens').style.background = '';
}