// URL base da API - ajuste conforme necessário
const API_BASE_URL = 'http://localhost:8080';

// Elementos do formulário
const clienteForm = document.getElementById('clienteForm');
const clientesTable = document.getElementById('clientesTable');

// Event Listener para o formulário de cliente
clienteForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    
    // Coletar dados do formulário
    const clienteData = {
        nome: document.getElementById('nome').value,
        telefone: document.getElementById('telefone').value,
        email: document.getElementById('email').value
    };

    try {
        await cadastrarCliente(clienteData);
        clienteForm.reset();
        
        // Recarregar a lista de clientes
        carregarClientes();
        
        // Mostrar mensagem de sucesso
        mostrarMensagem('Cliente cadastrado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro ao cadastrar cliente:', error);
        mostrarMensagem('Erro ao cadastrar cliente: ' + error.message, 'error');
    }
});

// Função para cadastrar cliente
async function cadastrarCliente(clienteData) {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clienteData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao cadastrar cliente');
        }

        return await response.json();
    } catch (error) {
        throw new Error(error.message);
    }
}

// Função para carregar lista de clientes
async function carregarClientes(pagina = 0, tamanho = 10) {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes?page=${pagina}&size=${tamanho}`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar clientes');
        }

        const data = await response.json();
        preencherTabelaClientes(data.content);
        atualizarPaginacao(data);
    } catch (error) {
        console.error('Erro:', error);
        clientesTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    Erro ao carregar clientes: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Função para preencher a tabela de clientes
function preencherTabelaClientes(clientes) {
    if (!clientes || clientes.length === 0) {
        clientesTable.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Nenhum cliente cadastrado</td>
            </tr>
        `;
        return;
    }

    clientesTable.innerHTML = clientes.map(cliente => `
        <tr>
            <td>${cliente.id}</td>
            <td>${cliente.nome}</td>
            <td>${formatarTelefone(cliente.telefone)}</td>
            <td>${cliente.email}</td>
            <td>
                <button class="btn btn-warning btn-sm me-1" onclick="editarCliente(${cliente.id})">
                    Editar
                </button>
                <button class="btn btn-danger btn-sm" onclick="excluirCliente(${cliente.id})">
                    Excluir
                </button>
            </td>
        </tr>
    `).join('');
}

// Função para formatar telefone
function formatarTelefone(telefone) {
    // Remove tudo que não é número
    const numeros = telefone.replace(/\D/g, '');
    
    // Formata conforme o tamanho
    if (numeros.length === 11) {
        return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
    } else if (numeros.length === 10) {
        return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 6)}-${numeros.substring(6)}`;
    }
    
    return telefone;
}

// Função para atualizar paginação
function atualizarPaginacao(data) {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    const totalPages = data.totalPages;
    const currentPage = data.number;

    let paginationHTML = '';

    // Botão anterior
    if (currentPage > 0) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="carregarClientes(${currentPage - 1})">Anterior</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#" tabindex="-1">Anterior</a>
            </li>
        `;
    }

    // Números das páginas
    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `
                <li class="page-item active">
                    <a class="page-link" href="#">${i + 1}</a>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="carregarClientes(${i})">${i + 1}</a>
                </li>
            `;
        }
    }

    // Botão próximo
    if (currentPage < totalPages - 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="carregarClientes(${currentPage + 1})">Próxima</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#">Próxima</a>
            </li>
        `;
    }

    pagination.innerHTML = paginationHTML;
}

// Função para verificar se a API está respondendo
async function verificarConexaoAPI() {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes?page=0&size=1`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        return response.ok;
    } catch (error) {
        console.warn('API não está respondendo:', error);
        return false;
    }
}


// Função para buscar clientes (chamada pelo onclick)
function buscarClientesPorNome() {
    const termoBusca = document.getElementById('buscarNomeInput').value.trim();
    
    if (termoBusca === '') {
        // Se estiver vazio, carrega todos os clientes
        carregarClientes();
    } else {
        // Busca por nome
        executarBuscaClientesPorNome(termoBusca);
    }
}

// Função para executar a busca de clientes por nome
async function executarBuscaClientesPorNome(nome, pagina = 0) {
    try {
        const apiOnline = await verificarConexaoAPI();
        if (!apiOnline) {
            mostrarMensagem('API não está respondendo. Verifique se o servidor está rodando.', 'error');
            return;
        }

        const response = await fetch(
            `${API_BASE_URL}/clientes/buscarNome?nome=${encodeURIComponent(nome)}&page=${pagina}&size=10`
        );
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        preencherTabelaClientes(data.content);
        atualizarPaginacao(data, nome);
        
        if (data.content.length === 0) {
            mostrarMensagem(`Nenhum cliente encontrado para "${nome}"`, 'info');
        }
    } catch (error) {
        console.error('Erro na busca:', error);
        mostrarMensagem('Erro ao buscar clientes: ' + error.message, 'error');
    }
}

// Função para editar cliente
async function editarCliente(id) {
    try {
        // Buscar dados do cliente
        const response = await fetch(`${API_BASE_URL}/clientes/${id}`);
        if (!response.ok) {
            throw new Error('Erro ao buscar dados do cliente');
        }

        const cliente = await response.json();

        // Preencher formulário com dados do cliente
        document.getElementById('nome').value = cliente.nome;
        document.getElementById('telefone').value = cliente.telefone;
        document.getElementById('email').value = cliente.email;

        // Alterar o botão para "Atualizar"
        const submitButton = clienteForm.querySelector('button[type="submit"]');
        submitButton.textContent = 'Atualizar Cliente';
        submitButton.classList.remove('btn-success');
        submitButton.classList.add('btn-warning');

        // Remover event listener anterior e adicionar novo para atualização
        clienteForm.onsubmit = async function(event) {
            event.preventDefault();
            
            const clienteDataAtualizado = {
                nome: document.getElementById('nome').value,
                telefone: document.getElementById('telefone').value,
                email: document.getElementById('email').value
            };

            try {
                await atualizarCliente(id, clienteDataAtualizado);
                clienteForm.reset();
                
                // Restaurar botão original
                submitButton.textContent = 'Cadastrar Cliente';
                submitButton.classList.remove('btn-warning');
                submitButton.classList.add('btn-success');
                
                // Restaurar event listener original
                clienteForm.onsubmit = clienteFormOriginalSubmit;
                
                carregarClientes();
                mostrarMensagem('Cliente atualizado com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao atualizar cliente:', error);
                mostrarMensagem('Erro ao atualizar cliente: ' + error.message, 'error');
            }
        };

    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao carregar dados do cliente: ' + error.message, 'error');
    }
}

// Salvar o event listener original
const clienteFormOriginalSubmit = clienteForm.onsubmit;

// Função para atualizar cliente
async function atualizarCliente(id, clienteData) {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(clienteData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao atualizar cliente');
        }

        return await response.json();
    } catch (error) {
        throw new Error(error.message);
    }
}

// Função para excluir cliente
async function excluirCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/clientes/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Erro ao excluir cliente');
        }

        carregarClientes();
        mostrarMensagem('Cliente excluído com sucesso!', 'success');
    } catch (error) {
        console.error('Erro:', error);
        mostrarMensagem('Erro ao excluir cliente: ' + error.message, 'error');
    }
}

// Função para mostrar mensagens
function mostrarMensagem(mensagem, tipo) {
    // Remover mensagens anteriores
    const mensagensAnteriores = document.querySelectorAll('.alert-message');
    mensagensAnteriores.forEach(msg => msg.remove());

    // Criar nova mensagem
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${tipo === 'success' ? 'success' : 'danger'} alert-message position-fixed`;
    alertDiv.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 1050;
        min-width: 300px;
    `;
    alertDiv.textContent = mensagem;

    document.body.appendChild(alertDiv);

    // Remover automaticamente após 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Event Listener para busca em tempo real (opcional)
document.addEventListener('DOMContentLoaded', function() {
    const buscaInput = document.querySelector('input[type="text"]');
    if (buscaInput) {
        let timeoutId;
        buscaInput.addEventListener('input', function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                if (this.value.trim() === '') {
                    carregarClientes();
                } else {
                    buscarClientesPorNome(this.value.trim());
                }
            }, 500);
        });
    }

    // Carregar clientes ao inicializar
    carregarClientes();
});

// Adicionar estilos para as mensagens (adicione ao CSS existente)
const estiloMensagens = `
.alert-message {
    animation: slideIn 0.3s ease-out;
}

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
`;

// Função para carregar clientes no select
async function carregarClientesNoSelect() {
    try {
        const response = await fetch(`${API_BASE_URL}/clientes?size=1000`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar clientes');
        }

        const data = await response.json();
        const select = document.getElementById('clienteId');
        
        // Limpar options exceto o primeiro
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adicionar clientes
        data.content.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nome} - ${cliente.telefone}`;
            select.appendChild(option);
        });
        
        console.log(`${data.content.length} clientes carregados no select`);
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        mostrarMensagem('Erro ao carregar lista de clientes', 'error');
    }
}

// Atualize o Event Listener para carregar os clientes ao mostrar a seção
document.addEventListener('DOMContentLoaded', function() {
    const fliperamaForm = document.getElementById('fliperamaForm');
    
    if (fliperamaForm) {
        // Carregar clientes quando a seção de fliperamas for mostrada
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.target.id === 'fliperamas' && 
                    mutation.target.classList.contains('active-section')) {
                    carregarClientesNoSelect();
                }
            });
        });
        
        observer.observe(document.getElementById('fliperamas'), {
            attributes: true,
            attributeFilter: ['class']
        });

        // Event Listener do formulário (mantém o mesmo)
        fliperamaForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Coletar dados do formulário
            const fliperamaData = {
                clienteId: document.getElementById('clienteId').value,
                titulo: document.getElementById('titulo').value.trim(),
                jogadores: parseInt(document.getElementById('jogadores').value),
                urlImagem: document.getElementById('urlImagem').value.trim(),
                dataLocacao: document.getElementById('dataLocacao').value,
             //   dataEntrega: document.getElementById('dataEntrega').value,
                valorAluguel: document.getElementById('valorAluguel').value ? 
                    parseFloat(document.getElementById('valorAluguel').value) : null
            };

            // Validação básica
            if (!fliperamaData.clienteId || fliperamaData.clienteId === "") {
                mostrarMensagem('Por favor, selecione um cliente.', 'error');
                return;
            }

            if (!fliperamaData.titulo || !fliperamaData.jogadores || 
                !fliperamaData.dataLocacao ) {
                mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }

            // Validar número de jogadores
            if (fliperamaData.jogadores < 1) {
                mostrarMensagem('O número de jogadores deve ser pelo menos 1.', 'error');
                return;
            }

            // Validar se data de entrega é posterior à data de locação
            if (new Date(fliperamaData.dataEntrega) <= new Date(fliperamaData.dataLocacao)) {
                mostrarMensagem('A data de entrega deve ser posterior à data de locação.', 'error');
                return;
            }

            try {
                // Mostrar loading
                const submitButton = fliperamaForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Cadastrando...';
                submitButton.disabled = true;

                const resultado = await cadastrarFliperama(fliperamaData);
                fliperamaForm.reset();
                
                // Mostrar mensagem de sucesso
                mostrarMensagem('Fliperama cadastrado com sucesso! Status: DISPONÍVEL', 'success');
                
                // Recarregar a lista de fliperamas (se existir)
                if (typeof carregarFliperamas === 'function') {
                    carregarFliperamas();
                }
            } catch (error) {
                console.error('Erro ao cadastrar fliperama:', error);
                mostrarMensagem('Erro ao cadastrar fliperama: ' + error.message, 'error');
            } finally {
                // Restaurar botão
                const submitButton = fliperamaForm.querySelector('button[type="submit"]');
                submitButton.textContent = 'Cadastrar Fliperama';
                submitButton.disabled = false;
            }
        });
    }
});

// Também carregar clientes quando a página carregar
carregarClientesNoSelect();



// Função para cadastrar fliperama
async function cadastrarFliperama(fliperamaData) {
    try {
        const response = await fetch(`${API_BASE_URL}/fliperamas/${fliperamaData.clienteId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                titulo: fliperamaData.titulo,
                jogadores: fliperamaData.jogadores,
                urlImagem: fliperamaData.urlImagem,
                dataLocacao: fliperamaData.dataLocacao,
          //      dataEntrega: fliperamaData.dataEntrega, // Campo adicionado
                valorAluguel: fliperamaData.valorAluguel
            })
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao cadastrar fliperama';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                
                if (response.status === 400) {
                    errorMessage = 'Dados inválidos: ' + errorMessage;
                } else if (response.status === 404) {
                    errorMessage = 'Cliente não encontrado';
                }
            } catch (parseError) {
                errorMessage = `Erro ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        return await response.json();
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            throw new Error('Não foi possível conectar com o servidor. Verifique se a API está rodando.');
        }
        throw error;
    }
}

// Event Listener para o formulário de fliperama
document.addEventListener('DOMContentLoaded', function() {
    const fliperamaForm = document.getElementById('fliperamaForm');
    
    if (fliperamaForm) {
        fliperamaForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            // Coletar dados do formulário
            const fliperamaData = {
                clienteId: document.getElementById('clienteId').value,
                titulo: document.getElementById('titulo').value.trim(),
                jogadores: parseInt(document.getElementById('jogadores').value),
                urlImagem: document.getElementById('urlImagem').value.trim(),
                dataLocacao: document.getElementById('dataLocacao').value,
              //  dataEntrega: document.getElementById('dataEntrega').value, // Campo adicionado
                valorAluguel: document.getElementById('valorAluguel').value ? 
                    parseFloat(document.getElementById('valorAluguel').value) : null
            };

            // Validação básica
            if (!fliperamaData.clienteId || !fliperamaData.titulo || !fliperamaData.jogadores || 
                !fliperamaData.dataLocacao || !fliperamaData.dataEntrega) {
                mostrarMensagem('Por favor, preencha todos os campos obrigatórios.', 'error');
                return;
            }

            // Validar número de jogadores
            if (fliperamaData.jogadores < 1) {
                mostrarMensagem('O número de jogadores deve ser pelo menos 1.', 'error');
                return;
            }

            // Validar se data de entrega é posterior à data de locação
            if (new Date(fliperamaData.dataEntrega) <= new Date(fliperamaData.dataLocacao)) {
                mostrarMensagem('A data de entrega deve ser posterior à data de locação.', 'error');
                return;
            }

            try {
                // Mostrar loading
                const submitButton = fliperamaForm.querySelector('button[type="submit"]');
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Cadastrando...';
                submitButton.disabled = true;

                const resultado = await cadastrarFliperama(fliperamaData);
                fliperamaForm.reset();
                
                // Mostrar mensagem de sucesso
                mostrarMensagem('Fliperama cadastrado com sucesso! Status: DISPONÍVEL', 'success');
                
                // Recarregar a lista de fliperamas (se existir)
                if (typeof carregarFliperamas === 'function') {
                    carregarFliperamas();
                }
            } catch (error) {
                console.error('Erro ao cadastrar fliperama:', error);
                mostrarMensagem('Erro ao cadastrar fliperama: ' + error.message, 'error');
            } finally {
                // Restaurar botão
                const submitButton = fliperamaForm.querySelector('button[type="submit"]');
                submitButton.textContent = 'Cadastrar Fliperama';
                submitButton.disabled = false;
            }
        });
    }
});


// Função para carregar e exibir fliperamas
async function carregarFliperamas(pagina = 0, tamanho = 12) {
    try {
        const response = await fetch(`${API_BASE_URL}/fliperamas?page=${pagina}&size=${tamanho}`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        exibirFliperamas(data.content);
        atualizarPaginacaoFliperamas(data);
    } catch (error) {
        console.error('Erro ao carregar fliperamas:', error);
        document.getElementById('fliperamasGrid').innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">❌ Erro ao carregar fliperamas: ${error.message}</p>
            </div>
        `;
    }
}

// Função para exibir fliperamas em cards
function exibirFliperamas(fliperamas) {
    const grid = document.getElementById('fliperamasGrid');
    
    if (!fliperamas || fliperamas.length === 0) {
        grid.innerHTML = `
            <div class="col-12 text-center">
                <p>Nenhum fliperama cadastrado</p>
                <button class="btn btn-primary" onclick="showSection('fliperamas')">
                    Cadastrar Primeiro Fliperama
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = fliperamas.map(fliperama => `
        <div class="col-md-6 col-lg-4 mb-4">
            <div class="card fliperama-card h-100">
                <div class="position-relative">
                    <img src="${fliperama.urlImagem || 'https://via.placeholder.com/300x200/0d0221/00ccff?text=FLIPERAMA'}" 
                         class="fliperama-image card-img-top" 
                         alt="${fliperama.titulo}"
                         onerror="this.src='https://via.placeholder.com/300x200/0d0221/00ccff?text=IMAGEM+NÃO+ENCONTRADA'">
                    <span class="status-badge position-absolute top-0 end-0 m-2 ${getStatusClass(fliperama.status)}">
                        ${getStatusText(fliperama.status)}
                    </span>
                </div>
                <div class="card-body">
                    <h5 class="card-title text-truncate" title="${fliperama.titulo}">
                        ${fliperama.titulo}
                    </h5>
                    <div class="mb-2">
                        <small class="text-muted">Cliente:</small>
                        <p class="mb-1 fw-bold">${fliperama.cliente ? fliperama.cliente.nome : 'N/A'}</p>
                    </div>
                    <div class="row small text-muted">
                        <div class="col-6">
                            <i class="bi bi-people"></i> ${fliperama.jogadores} jogador(es)
                        </div>
                        <div class="col-6 text-end">
                            <i class="bi bi-calendar"></i> ${formatarData(fliperama.dataLocacao)}
                        </div>
                    </div>
                    ${fliperama.valorAluguel ? `
                    <div class="mt-2">
                        <small class="text-muted">Valor:</small>
                        <p class="mb-0 fw-bold text-success">R$ ${formatarValor(fliperama.valorAluguel)}</p>
                    </div>
                    ` : ''}
                </div>
                <div class="card-footer bg-transparent">
                    <div class="btn-group w-100">
                        ${fliperama.status === 'DISPONIVEL' ? `
                        <button class="btn btn-success btn-sm" onclick="alugarFliperama(${fliperama.id})">
                            <i class="bi bi-check-circle"></i> Alugar
                        </button>
                        ` : ''}
                        ${fliperama.status === 'LOCADO' ? `
                        <button class="btn btn-warning btn-sm" onclick="cancelarLocacao(${fliperama.id})">
                            <i class="bi bi-x-circle"></i> Cancelar
                        </button>
                        ` : ''}
                        <button class="btn btn-info btn-sm" onclick="detalhesFliperama(${fliperama.id})">
                            <i class="bi bi-eye"></i> Detalhes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Funções auxiliares
function getStatusClass(status) {
    const classes = {
        'DISPONIVEL': 'status-disponivel',
        'LOCADO': 'status-locado',
        'CANCELADO': 'status-cancelado'
    };
    return classes[status] || 'status-cancelado';
}

function getStatusText(status) {
    const textos = {
        'DISPONIVEL': 'DISPONÍVEL',
        'LOCADO': 'ALUGADO',
        'CANCELADO': 'CANCELADO'
    };
    return textos[status] || status;
}

function formatarData(dataString) {
    if (!dataString) return 'N/A';
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
}

function formatarValor(valor) {
    if (!valor) return '0,00';
    return parseFloat(valor).toFixed(2).replace('.', ',');
}

// Função para atualizar paginação dos fliperamas
function atualizarPaginacaoFliperamas(data) {
    const pagination = document.querySelector('#fliperamas .pagination');
    if (!pagination) return;

    const totalPages = data.totalPages;
    const currentPage = data.number;

    let paginationHTML = '';

    // Botão anterior
    if (currentPage > 0) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="carregarFliperamas(${currentPage - 1})">Anterior</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#" tabindex="-1">Anterior</a>
            </li>
        `;
    }

    // Números das páginas
    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `
                <li class="page-item active">
                    <a class="page-link" href="#">${i + 1}</a>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="carregarFliperamas(${i})">${i + 1}</a>
                </li>
            `;
        }
    }

    // Botão próximo
    if (currentPage < totalPages - 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="carregarFliperamas(${currentPage + 1})">Próxima</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#">Próxima</a>
            </li>
        `;
    }

    pagination.innerHTML = paginationHTML;
}

// Função para carregar fliperamas quando a seção for mostrada
document.addEventListener('DOMContentLoaded', function() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'fliperamas' && 
                mutation.target.classList.contains('active-section')) {
                carregarFliperamas();
            }
        });
    });
    
    observer.observe(document.getElementById('fliperamas'), {
        attributes: true,
        attributeFilter: ['class']
    });
});

// Funções placeholder para as ações (implementar depois)
function alugarFliperama(id) {
    mostrarMensagem(`Função alugar fliperama ${id} - Em desenvolvimento`, 'info');
}

function cancelarLocacao(id) {
    mostrarMensagem(`Função cancelar locação ${id} - Em desenvolvimento`, 'info');
}

function detalhesFliperama(id) {
    mostrarMensagem(`Função detalhes fliperama ${id} - Em desenvolvimento`, 'info');
}

// Função para alugar fliperama
async function alugarFliperama(id) {
    if (!confirm('Deseja realmente alugar este fliperama?')) {
        return;
    }

    try {
        // Mostrar loading
        const botao = event.target;
        const textoOriginal = botao.textContent;
        botao.textContent = 'Alugando...';
        botao.disabled = true;

        const alugarData = {
            id: id,
            status: 'LOCADO' // O status é definido automaticamente no backend, mas enviamos por segurança
        };

        const response = await fetch(`${API_BASE_URL}/fliperamas/locar/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(alugarData)
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao alugar fliperama';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                
                if (response.status === 400) {
                    errorMessage = 'Dados inválidos: ' + errorMessage;
                } else if (response.status === 404) {
                    errorMessage = 'Fliperama não encontrado';
                }
            } catch (parseError) {
                errorMessage = `Erro ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const resultado = await response.json();
        
        // Mostrar mensagem de sucesso
        mostrarMensagem('Fliperama alugado com sucesso!', 'success');
        
        // Recarregar a lista de fliperamas
        if (typeof carregarFliperamas === 'function') {
            carregarFliperamas();
        }
        
        // Recarregar a lista de alugados
        if (typeof carregarFliperamasAlugados === 'function') {
            carregarFliperamasAlugados();
        }

    } catch (error) {
        console.error('Erro ao alugar fliperama:', error);
        
        // Verificar se é erro de fliperama indisponível
        if (error.message.includes('Fliperama Já está alugado') || 
            error.message.includes('indisponível')) {
            mostrarMensagem('Este fliperama já está alugado e não pode ser alugado novamente.', 'error');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            mostrarMensagem('Não foi possível conectar com o servidor.', 'error');
        } else {
            mostrarMensagem('Erro ao alugar fliperama: ' + error.message, 'error');
        }
    } finally {
        // Restaurar botão
        const botao = event.target;
        botao.textContent = textoOriginal;
        botao.disabled = false;
    }
}

// Função para cancelar locação
async function cancelarLocacao(id) {
    if (!confirm('Deseja realmente cancelar a locação deste fliperama?')) {
        return;
    }

    try {
        // Mostrar loading
        const botao = event.target;
        const textoOriginal = botao.textContent;
        botao.textContent = 'Cancelando...';
        botao.disabled = true;

        const cancelarData = {
            id: id,
            status: 'CANCELADO'
        };

        const response = await fetch(`${API_BASE_URL}/fliperamas/cancelar/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cancelarData)
        });

        if (!response.ok) {
            let errorMessage = 'Erro ao cancelar locação';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
                
                if (response.status === 400) {
                    errorMessage = 'Dados inválidos: ' + errorMessage;
                } else if (response.status === 404) {
                    errorMessage = 'Fliperama não encontrado';
                }
            } catch (parseError) {
                errorMessage = `Erro ${response.status}: ${response.statusText}`;
            }
            
            throw new Error(errorMessage);
        }

        const resultado = await response.json();
        
        // Mostrar mensagem de sucesso
        mostrarMensagem('Locação cancelada com sucesso!', 'success');
        
        // Recarregar as listas
        if (typeof carregarFliperamas === 'function') {
            carregarFliperamas();
        }
        
        if (typeof carregarFliperamasAlugados === 'function') {
            carregarFliperamasAlugados();
        }
        
        if (typeof carregarFliperamasCancelados === 'function') {
            carregarFliperamasCancelados();
        }

    } catch (error) {
        console.error('Erro ao cancelar locação:', error);
        
        // Verificar se é erro de fliperama já cancelado
        if (error.message.includes('já cancelado') || 
            error.message.includes('não pode ser cancelado')) {
            mostrarMensagem('Esta locação já está cancelada ou não pode ser cancelada.', 'error');
        } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
            mostrarMensagem('Não foi possível conectar com o servidor.', 'error');
        } else {
            mostrarMensagem('Erro ao cancelar locação: ' + error.message, 'error');
        }
    } finally {
        // Restaurar botão
        const botao = event.target;
        botao.textContent = textoOriginal;
        botao.disabled = false;
    }
}

// Função para carregar fliperamas alugados
async function carregarFliperamasAlugados(pagina = 0, tamanho = 12) {
    try {
        const response = await fetch(`${API_BASE_URL}/fliperamas/alugados?page=${pagina}&size=${tamanho}`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        exibirFliperamasAlugados(data.content);
        atualizarPaginacaoAlugados(data);
    } catch (error) {
        console.error('Erro ao carregar fliperamas alugados:', error);
        document.getElementById('alugadosTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-danger">
                    ❌ Erro ao carregar fliperamas alugados: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Função para exibir fliperamas alugados em tabela
function exibirFliperamasAlugados(fliperamas) {
    const tbody = document.getElementById('alugadosTable');
    
    if (!fliperamas || fliperamas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Nenhum fliperama alugado no momento</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = fliperamas.map(fliperama => `
        <tr>
            <td>${fliperama.id}</td>
            <td>${fliperama.titulo}</td>
            <td>${fliperama.cliente ? fliperama.cliente.nome : 'N/A'}</td>
            <td>${formatarData(fliperama.dataLocacao)}</td>
            <td>R$ ${formatarValor(fliperama.valorAluguel)}</td>
            <td>
                <button class="btn btn-warning btn-sm" onclick="cancelarLocacao(${fliperama.id})">
                    <i class="bi bi-x-circle"></i> Cancelar
                </button>
            </td>
        </tr>
    `).join('');
}

// Função para atualizar paginação dos alugados
function atualizarPaginacaoAlugados(data) {
    // Implementação similar à atualizarPaginacaoFliperamas
    // ... (código de paginação)
}

// Carregar fliperamas alugados quando a seção for mostrada
document.addEventListener('DOMContentLoaded', function() {
    const observerAlugados = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'alugados' && 
                mutation.target.classList.contains('active-section')) {
                carregarFliperamasAlugados();
            }
        });
    });
    
    observerAlugados.observe(document.getElementById('alugados'), {
        attributes: true,
        attributeFilter: ['class']
    });
});


// Função para carregar fliperamas cancelados
async function carregarFliperamasCancelados(pagina = 0, tamanho = 12) {
    try {
        const response = await fetch(`${API_BASE_URL}/fliperamas/cancelados?page=${pagina}&size=${tamanho}`);
        
        if (!response.ok) {
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        exibirFliperamasCancelados(data.content);
        atualizarPaginacaoCancelados(data);
    } catch (error) {
        console.error('Erro ao carregar fliperamas cancelados:', error);
        document.getElementById('canceladosTable').innerHTML = `
            <tr>
                <td colspan="5" class="text-center text-danger">
                    ❌ Erro ao carregar locações canceladas: ${error.message}
                </td>
            </tr>
        `;
    }
}

// Função para exibir fliperamas cancelados em tabela
function exibirFliperamasCancelados(fliperamas) {
    const tbody = document.getElementById('canceladosTable');
    
    if (!fliperamas || fliperamas.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center">Nenhuma locação cancelada</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = fliperamas.map(fliperama => `
        <tr>
            <td>${fliperama.id}</td>
            <td>
                <strong>${fliperama.titulo}</strong>
                <br>
                <small class="text-muted">${fliperama.jogadores} jogador(es)</small>
            </td>
            <td>
                ${fliperama.cliente ? `
                    <strong>${fliperama.cliente.nome}</strong>
                    <br>
                    <small class="text-muted">${fliperama.cliente.telefone}</small>
                ` : 'N/A'}
            </td>
            <td>
                <small class="text-muted">Locação:</small>
                <br>
                ${formatarData(fliperama.dataLocacao)}
                <br>
                <small class="text-muted">Cancelamento:</small>
                <br>
                <span class="text-danger">${obterDataCancelamento(fliperama)}</span>
            </td>
            <td>
                <span class="badge bg-secondary">R$ ${formatarValor(fliperama.valorAluguel)}</span>
            </td>
        </tr>
    `).join('');
}

// Função auxiliar para obter data de cancelamento (simulada)
function obterDataCancelamento(fliperama) {
    // Como não temos campo específico, usamos a data atual como simulação
    // Ou você pode adicionar um campo dataCancelamento no backend
    return new Date().toLocaleDateString('pt-BR');
}

// Função para atualizar paginação dos cancelados
function atualizarPaginacaoCancelados(data) {
    const pagination = document.querySelector('#cancelados .pagination');
    if (!pagination) return;

    const totalPages = data.totalPages;
    const currentPage = data.number;

    let paginationHTML = '';

    // Botão anterior
    if (currentPage > 0) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="carregarFliperamasCancelados(${currentPage - 1})">Anterior</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#" tabindex="-1">Anterior</a>
            </li>
        `;
    }

    // Números das páginas
    for (let i = 0; i < totalPages; i++) {
        if (i === currentPage) {
            paginationHTML += `
                <li class="page-item active">
                    <a class="page-link" href="#">${i + 1}</a>
                </li>
            `;
        } else {
            paginationHTML += `
                <li class="page-item">
                    <a class="page-link" href="#" onclick="carregarFliperamasCancelados(${i})">${i + 1}</a>
                </li>
            `;
        }
    }

    // Botão próximo
    if (currentPage < totalPages - 1) {
        paginationHTML += `
            <li class="page-item">
                <a class="page-link" href="#" onclick="carregarFliperamasCancelados(${currentPage + 1})">Próxima</a>
            </li>
        `;
    } else {
        paginationHTML += `
            <li class="page-item disabled">
                <a class="page-link" href="#">Próxima</a>
            </li>
        `;
    }

    pagination.innerHTML = paginationHTML;
}

// Carregar fliperamas cancelados quando a seção for mostrada
document.addEventListener('DOMContentLoaded', function() {
    const observerCancelados = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.target.id === 'cancelados' && 
                mutation.target.classList.contains('active-section')) {
                carregarFliperamasCancelados();
            }
        });
    });
    
    observerCancelados.observe(document.getElementById('cancelados'), {
        attributes: true,
        attributeFilter: ['class']
    });
});

// Função para exportar relatório de cancelados (opcional)
function exportarCancelados() {
    mostrarMensagem('Função de exportação em desenvolvimento', 'info');
}

// Adicionar botão de exportação ao HTML (opcional)
// <button class="btn btn-outline-success btn-sm" onclick="exportarCancelados()">
//     <i class="bi bi-download"></i> Exportar
// </button>


// Carregar fliperamas inicialmente
carregarFliperamas();

// Adicionar estilos ao documento
const styleSheet = document.createElement('style');
styleSheet.textContent = estiloMensagens;
document.head.appendChild(styleSheet);
