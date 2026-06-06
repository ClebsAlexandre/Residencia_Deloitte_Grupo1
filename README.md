# Projeto de Quality Assurance - Residência Deloitte

Bem-vindo ao repositório oficial do nosso squad para o projeto prático da **Residência Tecnológica em Quality Assurance**, promovida pela Deloitte em parceria com o Porto Digital.

## 👥 Equipe e Responsabilidades
A divisão de tarefas para a execução técnica das validações ocorreu da seguinte forma:

- **Automação de Interface (E2E com Playwright):** Nicolas e Leonardo
- **Testes de API (Insomnia):** Clebson e Luan

## Status Atual do Projeto
**Fase de Entrega e Conclusão:** O projeto encontra-se com todas as frentes de teste implementadas e consolidadas.

O nosso escopo abrangeu o mapeamento e modelagem do **Plano de Testes**, a execução de validações de API (via Insomnia) e a construção de uma suíte de automação End-to-End (E2E) com Playwright. Todo o ciclo foi focado no sistema **ParaBank**, validando regras de negócio e mapeando falhas reais da aplicação.

## Estrutura do Repositório
- `Plano de Teste/`: Diretório destinado à documentação central do nosso planeamento.
- `testes-api/`: Validações de API do sistema Parabank.
- `testes-automacao-ui/`: Projeto de Automação de Testes End-to-End (E2E) em Playwright.

> 💡 **Nota aos Mentores sobre a Automação (`testes-automacao-ui/`):** 
> A nossa automação E2E foi desenvolvida com foco na precisão dos relatórios de QA. Os cenários automatizados estão estritamente alinhados com os bugs encontrados no TestRail. 
> Portanto, quando rodarem a automação e observarem testes falhando (status **Failed** em vermelho no relatório do Playwright), **não se trata de um erro de código**. Nós configuramos os testes para **lançarem uma exceção intencionalmente (throw Error)** toda vez que detectam que o Parabank permitiu uma ação indevida. Isso garante que as falhas de regras de negócio não sejam mascaradas como sucesso, refletindo o real estado da aplicação no relatório HTML.


---
*Repositório mantido colaborativamente pelo nosso squad durante o ciclo da residência.*
