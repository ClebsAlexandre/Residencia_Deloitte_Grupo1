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

    // Preenchendo o formulário de cadastro
    await page.locator("[id='customer\\.firstName']").fill(firstName);
    await page.locator("[id='customer\\.lastName']").fill(lastName);
    await page.locator("[id='customer\\.address\\.street']").fill("Rua QA 123");
    await page.locator("[id='customer\\.address\\.city']").fill("Recife");
    await page.locator("[id='customer\\.address\\.state']").fill("PE");
    await page.locator("[id='customer\\.address\\.zipCode']").fill("50000-000");
    await page.locator("[id='customer\\.phoneNumber']").fill("81999999999");
    await page.locator("[id='customer\\.ssn']").fill("000-00-0000");

    // Preenchendo os campos de login com os dados gerados
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

test("CT04 - Utilização dos filtros de transação", async ({ page }) => {
    console.log(`Executando CT04 para o usuário: ${nomeUsuario}`);
    
    // Given que o usuário esteja na seção Account Activity de uma conta
    // Navegue para Accounts Overview.
    await page.getByRole("link", { name: "Accounts Overview" }).click();

    // Localize o primeiro link de conta na tabela (#accountTable tbody tr:first-child a) e clique nele para acessar a tela de detalhes.
    const primeiraContaLink = page.locator("#accountTable tbody tr").first().locator("a");
    await expect(primeiraContaLink).toBeVisible();
    await primeiraContaLink.click();

    // When selecionar o período (Activity Period) e o tipo de transação (Type) nos filtros
    // Na tela de Account Details, selecione a opção 'All' no dropdown de período (id #month).
    await page.locator("#month").selectOption("All");

    // Selecione a opção 'Credit' no dropdown de tipo (id #transactionType).
    await page.locator("#transactionType").selectOption("Credit");

    // And clicar no botão GO
    // Clique no botão com o nome 'Go' ou seletor input[value='Go'].
    await page.locator("input[value='Go']").click();

    // Then a tabela deve atualizar exibindo apenas as transações que respeitem os filtros escolhidos
    // Aguarde um delay do Parabank
    await page.waitForTimeout(1000);

    // Valide que a tabela de transações (#transactionTable) está visível ou a mensagem de 'No transactions found.'
    const transactionTable = page.locator("#transactionTable");
    const noTransactionsMessage = page.getByText("No transactions found.");
    
    // O Parabank oculta a tabela se não houver resultados para o filtro
    if (await noTransactionsMessage.isVisible()) {
        console.log("Filtro aplicado: Nenhuma transação encontrada (Página não quebrou).");
    } else {
        await expect(transactionTable).toBeVisible();
        const transacoes = transactionTable.locator("tbody tr");
        const countTransacoes = await transacoes.count();
        console.log(`Foram encontradas ${countTransacoes} transação/transações com os filtros aplicados.`);
    }
});
