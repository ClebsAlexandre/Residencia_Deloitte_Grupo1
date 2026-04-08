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

### 1. Accounts Overview (Visão Geral da Conta)

**Front-end**
* O sistema deve exibir todas as contas associadas ao utilizador autenticado.
* Cada conta deve ser identificada de forma única na listagem do ecrã.
* A interface deve apresentar de forma clara o saldo e o valor disponível para cada conta.
* O utilizador deve conseguir aceder aos detalhes de uma conta selecionada sem perder o contexto de navegação do sistema.

**API / Back-end**
* A API deve retornar dados de contas de forma totalmente isolada por cliente, garantindo que não há mistura de informações.
* A consulta no back-end deve exigir um identificador de cliente válido.
* O sistema deve retornar respostas consistentes e previsíveis (como uma lista vazia ou código adequado) caso o cliente não possua contas associadas.
* É estritamente proibido expor dados de contas que não pertençam ao cliente informado na requisição.

---

### Open New Account

**Front-end**
- A interface deve exigir a definição do tipo de conta antes de permitir o avanço no fluxo.
- O sistema deve exigir a seleção de uma conta de origem para a realização do depósito inicial.
- Após a tentativa de abertura de conta, o sistema deve comunicar ao utilizador se a operação foi concluída com sucesso ou   se ocorreu falha.
- O utilizador não deve conseguir prosseguir caso as informações mínimas necessárias não estejam preenchidas.
- A interface deve apresentar mensagens claras indicando quais informações obrigatórias estão em falta.

**API / Back-end**
- 
- 
- 

---

### Transfer Funds

**Front-end**
- 
- 
- 

**API / Back-end**
- 
- 
- 

---

### Request Loan

**Front-end**
- 
- 
- 

**API / Back-end**
- 
- 
- 

---

## Funcionalidades Fora de Escopo

---

## Estratégia de Testes
- ### Open New Account

**Front-end**
Objetivo dos Testes:
-Garantir que o utilizador define corretamente o tipo de conta, evitando inconsistências e assegurando o cumprimento das regras de negócio.
-Validar que a operação possui uma origem de fundos válida, assegurando a integridade do processo de abertura de conta.
-Assegurar que o utilizador recebe feedback claro e imediato sobre o resultado da operação, melhorando a experiência e evitando dúvidas.
-Garantir que o sistema bloqueia submissões incompletas, prevenindo erros e mantendo a consistência dos dados.
-Facilitar a correção de erros pelo utilizador, tornando a interação mais intuitiva e eficiente.

Tipo de teste: 
-Teste funcional positivo
-Teste funcional / validação de campo obrigatório
-Teste de usabilidade / feedback visual
-Teste funcional / validação de regra de negócio
-Teste funcional negativo

Ferramentas
-Selenium
-Playwright

---

## Premissas e Riscos

### Premissas
- 

### Riscos
- 

## Gerenciamento do Projeto

### Metodologia


### Organização em Sprints
- 

### Cronograma
- 
