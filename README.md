# Plataforma de Indicação e Avaliação de Prestadores de Serviço em Comunidades Condominiais

## 1. Escopo

### Grupo de Trabalho
- **Disciplina:** PRO-3151 — Laboratório de Sistema de Informação (Escola Politécnica da USP)
- **Grupo:** G03
- **Participante:** Filipe Cassoli, Daniel Travassos, Bruno Reali de Freitas, Felipe Sanches, Eduardo Berriel.

### Organização Cliente
- **Nome:** Administração Condominial (cliente interno)
- **Descrição:** Organização responsável pela gestão de comunidades residenciais, abrangendo manutenção de infraestrutura predial, segurança de perímetro e suporte operacional aos moradores. Lida diariamente com o fluxo de profissionais terceirizados que circulam pelas áreas comuns e privativas para realização de manutenções, reformas e serviços domésticos.

### Objetivo da Aplicação
Resolver a assimetria de informação na contratação de prestadores de serviço autônomos (eletricistas, encanadores, diaristas etc.) dentro de comunidades condominiais. Atualmente o processo é informal e pulverizado em grupos de mensagens, sem registro histórico confiável. A aplicação centraliza avaliações, notas e relatos dos moradores em um catálogo colaborativo, gerando um ranking interno de profissionais por categoria de serviço — integrado a um modelo de IA (Claude / Anthropic) para auxiliar na análise e síntese das avaliações.

### Público-Alvo
- **Moradores** do condomínio (leitura e escrita de avaliações, busca de prestadores)
- **Administração do condomínio** (aprovação de usuários, gestão de vínculos apartamento/bloco)

---

## 2. Matriz de Requisitos

| Código | Nome | Tipo | Definição clara? | Verificável/Testável? | Tecnicamente viável? |
|--------|------|------|-----------------|----------------------|----------------------|
| REQ01 | Autenticar usuário | F | ✅ | ✅ | ✅ |
| REQ02 | Aprovar e vincular morador | F | ✅ | ✅ | ✅ |
| REQ03 | Cadastrar prestador de serviço | F | ✅ | ✅ | ✅ |
| REQ04 | Registrar avaliação de prestador | F | ✅ | ✅ | ✅ |
| REQ05 | Buscar e filtrar prestadores | F | ✅ | ✅ | ✅ |
| REQ06 | Gerar ranking de prestadores | F | ✅ | ✅ | ✅ |
| REQ07 | Controle de acesso por autenticação fechada | NF | ✅ | ✅ | ✅ |
| REQ08 | Desempenho — tempo de resposta | NF | ✅ | ✅ | ✅ |

---

## 3. Requisitos Funcionais

### REQ01 — Autenticar Usuário
**Descrição:** O sistema deve permitir o login de moradores e administradores utilizando e-mail e senha. Não há cadastro público; o acesso só é possível após aprovação pela administração.

**Critérios de aceitação:**
- Usuário não aprovado não consegue acessar nenhuma tela do sistema.
- Login com credenciais inválidas exibe mensagem de erro sem revelar qual campo está incorreto.
- Sessão expira após 30 minutos de inatividade.

---

### REQ02 — Aprovar e Vincular Morador
**Descrição:** O sistema deve permitir que a administração cadastre, aprove e vincule um morador a um apartamento e bloco específicos. Moradores não podem se auto-cadastrar.

**Critérios de aceitação:**
- Somente o perfil "Administração" visualiza e executa a tela de aprovação.
- Um morador vinculado a um apartamento não pode ser vinculado a outro simultaneamente.
- A desativação de um morador revoga imediatamente seu acesso.

---

### REQ03 — Cadastrar Prestador de Serviço
**Descrição:** O sistema deve permitir que um morador autenticado cadastre o perfil de um prestador, informando nome, contato, categoria de serviço (ex.: Hidráulica, Elétrica, Jardinagem, Limpeza) e observações gerais.

**Critérios de aceitação:**
- Pelo menos um campo de contato (telefone ou e-mail) é obrigatório.
- A categoria de serviço deve ser selecionada a partir de uma lista pré-definida.
- O sistema registra qual morador realizou o cadastro e em qual data.

---

### REQ04 — Registrar Avaliação de Prestador
**Descrição:** O sistema deve permitir que um morador autenticado registre uma avaliação para um prestador já cadastrado, atribuindo uma nota (1 a 5 estrelas) e um relato textual sobre o atendimento.

**Critérios de aceitação:**
- Um morador pode avaliar o mesmo prestador mais de uma vez (contratações distintas), mas não duas vezes no mesmo dia.
- Nota e relato são campos obrigatórios.
- O sistema registra o vínculo do avaliador (apartamento/bloco) para garantir rastreabilidade.

---

### REQ05 — Buscar e Filtrar Prestadores
**Descrição:** O sistema deve permitir que moradores autenticados busquem prestadores por nome e/ou categoria de serviço, exibindo os resultados ordenados por nota média decrescente.

**Critérios de aceitação:**
- A busca por categoria retorna apenas prestadores daquela categoria.
- Prestadores sem nenhuma avaliação aparecem ao final da listagem.
- A busca por nome é case-insensitive e aceita correspondência parcial.

---

### REQ06 — Gerar Ranking de Prestadores
**Descrição:** O sistema deve calcular e exibir um ranking interno dos prestadores mais bem avaliados por categoria, com base na média ponderada das notas recebidas.

**Critérios de aceitação:**
- O ranking é atualizado imediatamente após o registro de uma nova avaliação.
- Exibe nota média, número total de avaliações e categoria de cada prestador.
- Prestadores com menos de 2 avaliações são marcados visualmente como "avaliações insuficientes".

---

## 4. Requisitos Não Funcionais

### REQ07 — Controle de Acesso por Autenticação Fechada
**Descrição:** O acesso à leitura e escrita de qualquer dado da plataforma deve ser restrito exclusivamente a usuários previamente aprovados pela administração e vinculados a um apartamento e bloco específicos. Não haverá cadastro aberto ao público geral.

**Critérios de aceitação:**
- Qualquer rota da aplicação retorna HTTP 401/403 para requisições sem token válido.
- Tentativas de acesso com token de usuário não vinculado são bloqueadas e registradas em log.
- Prestadores não podem criar perfis ou avaliações na plataforma.

---

### REQ08 — Desempenho — Tempo de Resposta
**Descrição:** O sistema deve responder a qualquer requisição de leitura (busca, listagem, ranking) em até 2 segundos em condições normais de uso.

**Critérios de aceitação:**
- 95% das requisições de leitura são processadas em menos de 2 segundos com até 50 usuários simultâneos.
- Requisições que ultrapassem o limite devem retornar resposta parcial com indicador de carregamento, sem travar a interface.

---

