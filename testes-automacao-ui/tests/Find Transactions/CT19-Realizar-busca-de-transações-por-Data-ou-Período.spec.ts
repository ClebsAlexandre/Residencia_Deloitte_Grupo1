import { test, expect } from '@playwright/test';
import { generateNewUser } from '../../utils/generateUser';

// Variáveis de escopo do arquivo
let usuario: string;
let senha: string;
let nomeUsuario: string;
let firstName: string;
let lastName: string;

test.beforeAll("Registrar dados do usuário no Parabank", async ({ browser }) => {
    const dadosAleatorios = generateNewUser();
    
    usuario = dadosAleatorios.usuario;
    senha = dadosAleatorios.senha;
    nomeUsuario = dadosAleatorios.nomeUsuario;
    firstName = dadosAleatorios.firstName;
    lastName = dadosAleatorios.lastName;

    const page = await browser.newPage();
    await page.goto("https://parabank.parasoft.com/parabank/register.htm");

    await page.locator("[id='customer\\.firstName']").fill(firstName);
    await page.locator("[id='customer\\.lastName']").fill(lastName);
    await page.locator("[id='customer\\.address\\.street']").fill("Rua QA 123");
    await page.locator("[id='customer\\.address\\.city']").fill("Recife");
    await page.locator("[id='customer\\.address\\.state']").fill("PE");
    await page.locator("[id='customer\\.address\\.zipCode']").fill("50000-000");
    await page.locator("[id='customer\\.phoneNumber']").fill("81999999999");
    await page.locator("[id='customer\\.ssn']").fill("000-00-0000");
    
    await page.locator("[id='customer\\.username']").fill(usuario);
    await page.locator("[id='customer\\.password']").fill(senha);
    await page.locator("#repeatedPassword").fill(senha);

    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Your account was created successfully")).toBeVisible();

    await page.close();
});

test.beforeEach("Realizar login", async ({ page }) => {
    await page.goto("https://parabank.parasoft.com/parabank/index.htm");
    
    await page.locator(".login").locator("[name='username']").fill(usuario);
    await page.locator(".login").locator("[name='password']").fill(senha);
    
    await page.getByRole("button", { name: "Log In" }).click();
    await expect(page.locator("#leftPanel")).toBeVisible();
});

test("CT19 - Realizar busca de transação por Data", async ({ page }) => {
    console.log(`Executando CT19 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`senha: ${senha}`);

    // --- PRÉ-REQUISITO: Gerar uma transação no dia de hoje ---
    const valorDaTransferencia = "25"; // Valor qualquer apenas para gerar a transação
    
    await page.getByRole("link", { name: "Transfer Funds" }).click();
    await page.waitForSelector("#fromAccountId option", { state: 'attached' });
    await page.waitForTimeout(1000);

    await page.locator("#amount").fill(valorDaTransferencia);
    
    const contaOrigem = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (contaOrigem) {
        await page.locator("#fromAccountId").selectOption(contaOrigem);
        await page.locator("#toAccountId").selectOption(contaOrigem); // Transfere para si mesmo
    }
    await page.getByRole("button", { name: "Transfer" }).click();
    await expect(page.getByText("Transfer Complete!")).toBeVisible();
    // ------------------------------------------------------------------

    // 1. Given que o usuário esteja na funcionalidade "Find Transactions"
    await page.getByRole("link", { name: "Find Transactions" }).click();

    // 2. When selecionar uma conta válida
    await page.waitForSelector("#accountId option", { state: 'attached' });
    await page.waitForTimeout(1000);
    if (contaOrigem) {
        await page.locator("#accountId").selectOption(contaOrigem);
    }

    // 3. And preencher o campo "Find by Date" com uma data válida
    // Pegamos a data atual do sistema e formatamos para MM-DD-YYYY conforme exige o Parabank
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataFormatada = `${mes}-${dia}-${ano}`;
    
    console.log(`Buscando transações da data: ${dataFormatada}`);

    // Tentamos usar o padrão de ID que o Parabank geralmente adota para este campo
    // Se der timeout aqui depois, precisaremos inspecionar o elemento como fizemos no Amount!
    await page.locator("#transactionDate").fill(dataFormatada);

    // 4. And clicar no botão "Find Transactions"
    // Seguindo a lógica do findByAmount, o botão de data deve ser findByDate
    await page.locator("#findByDate").click();

    // 5. Then o sistema deve exibir a listagem de todas as transações ocorridas na data
    const tabelaResultados = page.locator("#transactionTable");
    await expect(tabelaResultados).toBeVisible();
    
    // Valida se o valor da transação que fizemos hoje ($25.00) apareceu nos resultados filtrados
    await expect(tabelaResultados).toContainText(`$${valorDaTransferencia}.00`);
    
    console.log("✅ SUCESSO NO TESTE: O sistema encontrou a transação filtrando pela data de hoje.");
});