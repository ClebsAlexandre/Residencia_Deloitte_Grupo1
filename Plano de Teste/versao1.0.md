# Plano de Testes – ParaBank
Integrantes da equipe
- Clebson Alexandre
- Nicolas Klayvert
- Sérgio Roberto
- Leonardo Antônio
- Luan Guilherme
- Moisés Maurício

  ---
  
## Nome do Sistema
ParaBank

## Descrição do Sistema

O ParaBank funciona como um ambiente de simulação bancária. Na prática, ele imita a estrutura de um banco de verdade, trazendo fluxos reais como consulta de saldos, transferências, pagamentos e solicitações de empréstimo. Como todo o valor movimentado é fictício, a plataforma serve como um laboratório seguro focado exclusivamente no treinamento e na validação de testes de software para o setor financeiro.

---

## Funcionalidades em Escopo

As funcionalidades do sistema ParaBank selecionadas para esta fase de validação e testes são:

1. **Accounts Overview (Visão Geral da Conta):** Visualização consolidada de todas as contas associadas a um cliente, garantindo a identificação única e a precisão dos saldos exibidos.
2. **Open New Account (Abrir Conta):** Fluxo de criação de novas contas bancárias para utilizadores autenticados, validando a definição do tipo de conta e a conta de origem para o depósito inicial.
3. **Transfer Funds (Transferir Fundos):** Realização de transferências de valores entre contas do próprio utilizador, garantindo a atomicidade da operação.
4. **Request Loan (Solicitar Empréstimo):** Submissão e processamento de pedidos de empréstimo associados a uma conta específica, exigindo validação de valores e conta de origem.

---

## Critérios de Aceite

### Accounts Overview (Visão Geral da Conta)

**Front-end**
* O sistema deve exibir todas as contas associadas ao usuário autenticado.
* Cada conta deve ser identificada de forma única na listagem da tela.
* A interface deve apresentar de forma clara o saldo e o valor disponível para cada conta.
* O usuário deve conseguir acessar os detalhes de uma conta selecionada sem perder o contexto de navegação do sistema.

**API / Back-end**
* A API deve retornar dados de contas de forma totalmente isolada por cliente, garantindo que não há mistura de informações.
* A consulta no back-end deve exigir um identificador de cliente válido.
* O sistema deve retornar respostas consistentes e previsíveis (como uma lista vazia ou código adequado) caso o cliente não possua contas associadas.
* É estritamente proibido expor dados de contas que não pertençam ao cliente informado na requisição.

---

### Open New Account (Abrir Conta)

**Front-end**
* A interface deve exigir a definição do tipo de conta antes de permitir o avanço no fluxo.
* O sistema deve exigir a seleção de uma conta de origem para a realização do depósito inicial.
* Após a tentativa de abertura de conta, o sistema deve comunicar ao usuario se a operação foi concluída com sucesso ou se ocorreu falha.
* O usuario não deve conseguir prosseguir caso as informações mínimas necessárias não estejam preenchidas.
* A interface deve apresentar mensagens claras indicando quais informações obrigatórias estão em falta.

**API / Back-end**
* A API deve permitir criar uma nova conta vinculada a um cliente existente.
* O back-end deve exigir cliente, tipo de conta e conta de origem válidos para processar a criação.
* O sistema não deve criar contas quando as informações obrigatórias estiverem ausentes ou inválidas.
* Em caso de sucesso, o back-end deve garantir que a nova conta passe a fazer parte do conjunto de contas do cliente.
* Em caso de erro, a API não deve gerar efeitos colaterais parciais sobre as contas já existentes.

---

### Transfer Funds (Transferir Fundos)

**Front-end**
* O sistema deve permitir a transferência de valores exclusivamente entre contas que pertençam ao usuário autenticado.
* A interface deve exigir obrigatoriamente o preenchimento do valor, da conta de origem e da conta de destino para realizar a operação.
* O formulário não deve permitir a submissão ou execução da transferência caso faltem informações essenciais.
* A aplicação deve comunicar de forma clara ao usuário o resultado (sucesso ou falha) da tentativa de transferência.
* A tela deve manter o contexto de navegação contínuo após a finalização da operação.

**API / Back-end**
* A API deve permitir o registro de uma transação de transferência apenas quando as contas informadas forem válidas.
* O back-end deve validar do lado do servidor se as contas envolvidas (origem e destino) pertencem efetivamente ao mesmo cliente.
* O registro da transferência no banco de dados deve ser processado de forma atômica, evitando a criação de estados intermediários inconsistentes.
* Em caso de erro durante o processo, o sistema não deve efetuar qualquer alteração nos saldos nem gerar transações parciais (garantia de rollback).
* O back-end deve retornar uma resposta estruturada e coerente com o resultado real da operação de transferência.

---

### Request Loan (Solicitar Empréstimo)

**Front-end**
* O sistema deve permitir ao usuário solicitar um empréstimo associado à sua conta.
* A interface deve exigir o preenchimento obrigatório do valor do empréstimo, do valor de entrada (down payment) e da seleção da conta de origem.
* O formulário não deve habilitar a submissão da solicitação caso as informações necessárias não estejam preenchidas.
* A aplicação deve apresentar ao usuário o resultado da solicitação dentro do próprio fluxo da tela.
* A interface deve garantir e manter o uso contínuo do sistema após a finalização da solicitação.

**API / Back-end**
* A API deve permitir registrar solicitações de empréstimo exclusivamente para clientes existentes.
* O back-end deve validar do lado do servidor se o cliente, os valores informados e a conta de origem são estritamente válidos.
* O serviço deve retornar de forma clara e estruturada o resultado da solicitação, indicando se foi processada ou não.
* Em caso de aprovação e sucesso, o sistema deve gerar um empréstimo devidamente vinculado ao cliente e à conta.
* Em caso de erro na validação ou processamento, o back-end não deve provocar quaisquer alterações parciais em dados financeiros.

---

## Funcionalidades Fora de Escopo

Para esta fase de validação, os testes estarão limitados estritamente às quatro funcionalidades descritas acima. Sendo assim, não farão parte do escopo de testes as seguintes funcionalidades do sistema ParaBank:

* **Bill Pay (Pagamento de Contas):** O fluxo de pagamento de faturas ou envio de valores para terceiros não será testado.
* **Find Transactions (Buscar Transações):** A pesquisa detalhada de histórico de transações por data, valor ou identificador da transação não entrará nesta fase.
* **Update Contact Info (Atualização de Cadastro):** A funcionalidade de alteração de dados pessoais do usuário (endereço, telefone, etc.) está fora do escopo.
* **Register (Registro de Novo Usuário):** A criação de novos perfis de acesso ao sistema do banco não será alvo de validação.
* **Admin Page (Painel de Administração):** As configurações internas do sistema, limpeza do banco de dados e controle de parâmetros de serviços SOAP/REST não serão testados.

---

## Estratégia de Testes

**Objetivo dos Testes:**
O objetivo principal é validar se as funcionalidades de gestão de contas, transferências e empréstimos do ParaBank operam estritamente de acordo com as regras de negócio e especificações. Os testes visam garantir que o sistema processe transações válidas de forma atômica, bloqueie operações inválidas e retorne o feedback correto ao usuário, garantindo a integridade dos dados simulados.

**Níveis e Tipos de Teste:**
A abordagem será baseada em técnicas de **Caixa Preta** (como Particionamento de Equivalência e Análise de Valor Limite), abrangendo os seguintes níveis:
* **Testes de Sistema:** Validação do comportamento da aplicação como um todo, assegurando que o front-end e a API/back-end se comunicam corretamente e cumprem os requisitos funcionais.
* **Testes de Aceitação:** Execução de fluxos que simulam a visão e a interação do usuário final, validando se a interface atende às expectativas de usabilidade.

**Ferramentas Utilizadas:**
* **Documentação e Repositório:** GitHub (Markdown).
* **Gerenciamento do Projeto:** [Trello].
* **Execução dos Testes:** Testes manuais utilizando navegadores web no Desktop/PC (ex: Google Chrome, Edge, Opera).
---

## Premissas e Riscos

### Premissas
* O ambiente de testes do ParaBank estará online, funcional e acessível durante toda a fase de planejamento e execução.
* A equipe terá acesso contínuo às ferramentas de gerenciamento de projeto e documentação escolhidas.
* Não haverá necessidade de manipulação direta do banco de dados, sendo os testes focados apenas nas camadas de interface e serviços da API.

### Riscos
* **Indisponibilidade do Ambiente:** Por se tratar de um ambiente de demonstração público, o ParaBank pode sofrer instabilidades ou sair do ar, o que travaria a execução dos testes.
* **Inconsistência de Dados:** Como outros usuários globais podem estar utilizando o sistema simultaneamente, dados de teste podem sofrer alterações inesperadas.
* **Gargalos de Comunicação:** Desalinhamento entre os membros da equipe durante as Sprints, podendo gerar atrasos na entrega da documentação final.

## Gerenciamento do Projeto

### Metodologia
A equipe adotará a metodologia Ágil, utilizando o framework **Scrum** para guiar o desenvolvimento do plano e a execução dos testes, garantindo entregas contínuas e alinhamento constante entre os 6 membros do squad.

### Organização em Sprints
O ciclo de trabalho será dividido em **3 Sprints**, estruturadas da seguinte forma:
* **Duração de cada Sprint:** 2 semanas.
* **Sprint 1 - Planejamento e Estruturação (23/04 a 06/05):** Foco na compreensão das regras de negócio, configuração das ferramentas de gestão e finalização do documento de Plano de Testes.
* **Sprint 2 - Modelagem e Casos de Teste (07/05 a 20/05):** Criação e detalhamento dos Casos de Teste (CTs) para as quatro funcionalidades em escopo, aplicando técnicas de Caixa Preta.
* **Sprint 3 - Execução e Reporte (21/05 a 04/06):** Execução prática dos testes no ambiente de demonstração do ParaBank, registro de evidências, reporte de bugs e montagem da apresentação final.

### Cronograma
* **Data de Início do Projeto:** 23/04/2026
* **Data Prevista de Encerramento:** 04/06/2026
