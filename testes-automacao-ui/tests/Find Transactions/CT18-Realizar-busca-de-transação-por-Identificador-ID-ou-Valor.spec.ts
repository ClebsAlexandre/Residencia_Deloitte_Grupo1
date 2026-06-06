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

test("CT18 - Realizar busca de transação por Valor", async ({ page }) => {
    console.log(`Executando CT18 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`senha: ${senha}`);

    // --- PRÉ-REQUISITO: Gerar uma transação conhecida para buscarmos ---
    // Fazemos uma transferência rápida de um valor específico para garantir o histórico
    const valorDaBusca = "15";
    
    await page.getByRole("link", { name: "Transfer Funds" }).click();
    await page.waitForSelector("#fromAccountId option", { state: 'attached' });
    await page.waitForTimeout(1000); // Pausa para carregamento AJAX

    await page.locator("#amount").fill(valorDaBusca);
    
    const contaOrigem = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (contaOrigem) {
        await page.locator("#fromAccountId").selectOption(contaOrigem);
        await page.locator("#toAccountId").selectOption(contaOrigem); // Transfere para a própria conta
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

    // 3. And preencher o campo "Find by Amount" com um dado existente
    // No Parabank, IDs com pontos precisam ter a barra invertida (\\) no Playwright
    await page.locator("#amount").fill(valorDaBusca);
    
    // 4. And clicar no respectivo botão "Find Transactions"
    // O Parabank tem vários botões com o mesmo nome nesta tela. 
    // Usamos um seletor que aponta diretamente para a ação (ng-click) do botão de Amount.
   await page.locator("#findByAmount").click();

    // 5. Then o sistema deve retornar a tabela exibindo os dados corretos da transação
    const tabelaResultados = page.locator("#transactionTable");
    
    // Validamos se a tabela apareceu na tela
    await expect(tabelaResultados).toBeVisible();
    
    // Validamos se o valor que transferimos ($15.00) está visível nos resultados da tabela
    await expect(tabelaResultados).toContainText(`$${valorDaBusca}.00`);
    
    console.log(`✅ SUCESSO NO TESTE: O sistema encontrou a transação de $${valorDaBusca}.00 com sucesso.`);
});