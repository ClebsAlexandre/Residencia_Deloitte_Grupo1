# 📌 Automação E2E Parabank - Residência Tecnológica Deloitte

![GitHub repo size](https://img.shields.io/github/repo-size/leonard0antonio/Residencia-Tecnologica-Deloitte-Automacao-parabank?style=for-the-badge)
![GitHub language count](https://img.shields.io/github/languages/count/leonard0antonio/Residencia-Tecnologica-Deloitte-Automacao-parabank?style=for-the-badge)
![GitHub forks](https://img.shields.io/github/forks/leonard0antonio/Residencia-Tecnologica-Deloitte-Automacao-parabank?style=for-the-badge)
![GitHub open issues](https://img.shields.io/github/issues/leonard0antonio/Residencia-Tecnologica-Deloitte-Automacao-parabank?style=for-the-badge)
![GitHub open pull requests](https://img.shields.io/github/issues-pr/leonard0antonio/Residencia-Tecnologica-Deloitte-Automacao-parabank?style=for-the-badge)

![Demo da aplicação](demo.png)

> Projeto de Automação de Testes End-to-End (E2E) para o sistema Parabank. Desenvolvido utilizando Playwright, TypeScript e Faker.js como parte das atividades da Residência Tecnológica da Deloitte.

## 💻 Pré-requisitos

Antes de começar, verifique se você atendeu aos seguintes requisitos:

* Você instalou a versão mais recente do `<Node.js>`
* Você tem uma máquina `<Windows / Linux / Mac>`. 

## 🚀 Instalando o Automação E2E Parabank

Para instalar e configurar o ambiente de desenvolvimento local, siga estas etapas:

**Linux, macOS e Windows:**
```bash
# Clone o repositório
git clone [https://github.com/leonard0antonio/Residencia-Tecnologica-Deloitte-Automacao-parabank.git](https://github.com/leonard0antonio/Residencia-Tecnologica-Deloitte-Automacao-parabank.git)

# Acesse a pasta do projeto
cd Residencia-Tecnologica-Deloitte-Automacao-parabank

# Instale as dependências do Node
npm install

# Instale os navegadores do Playwright
npx playwright install

```

## ☕ Usando a Automação

Para executar os testes da aplicação, rode os seguintes comandos:

```bash
# Para executar todos os testes em modo headless (sem interface)
npx playwright test

# Para executar os testes abrindo a interface de testes do Playwright (UI Mode)
npx playwright test --ui

# Para ver o relatório HTML após a execução dos testes
npx playwright show-report

```

> **Nota:** O projeto utiliza o `Faker.js` para geração de dados de massa dinâmicos nos testes e `commit-and-tag-version` para o versionamento automatizado.

## 🤝 Colaboradores

Agradecemos às seguintes pessoas que contribuíram para este projeto:

<table> <tr> <td align="center"> <a href="https://github.com/leonard0antonio"> <img src="https://avatars.githubusercontent.com/u/169267801?v=4" width="100px;" alt="Leonardo Antonio"/><br /> <sub><b>Leonardo Antonio</b></sub> </a> </td> <td align="center"> <a href="https://github.com/nicolasklayvert"> <img src="https://avatars.githubusercontent.com/u/183760743?v=4" width="100px;" alt="Nicolas Klayvert"/><br /> <sub><b>Nicolas Klayvert</b></sub> </a> </td> <td align="center"> <a href="https://github.com/ClebsAlexandre"> <img src="https://avatars.githubusercontent.com/u/177782773?v=4" width="100px;" alt="ClebsAlexandre"/><br /> <sub><b>ClebsAlexandre</b></sub> </a> </td> </tr> </table>

## 📝 Licença

Esse projeto está sob a licença `MIT`. Veja o arquivo [LICENSE](https://www.google.com/search?q=LICENSEMIT) para mais detalhes.
