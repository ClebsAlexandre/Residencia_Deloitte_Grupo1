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

test("CT01 - Validar listagem de contas e patrimonio consolidado", async ({ page }) => {
    console.log(`Executando CT01 para o usuário: ${nomeUsuario}`);
    
    // Given que o usuário esteja autenticado no sistema ParaBank (Isso já ocorre no beforeEach).
    
    // When acessar a funcionalidade "Accounts Overview" (Clique no link Accounts Overview).
    await page.getByRole("link", { name: "Accounts Overview" }).click();

    // Then o sistema deve exibir uma lista com pelo menos uma conta associada 
    // (Aguarde e valide a visibilidade da tabela de id #accountTable e que a primeira linha do corpo da tabela contenha um elemento a - link da conta).
    const accountTable = page.locator("#accountTable");
    await expect(accountTable).toBeVisible();
    
    const firstAccountLink = accountTable.locator("tbody tr").first().locator("a");
    await expect(firstAccountLink).toBeVisible();

    // And deve apresentar o número da conta, saldo e valor disponível para cada uma 
    // (Valide se os cabeçalhos da tabela existem: Account, Balance* e Available Amount).
    const tableHeaders = accountTable.locator("thead th");
    await expect(tableHeaders.filter({ hasText: "Account" })).toBeVisible();
    await expect(tableHeaders.filter({ hasText: "Balance*" })).toBeVisible();
    await expect(tableHeaders.filter({ hasText: "Available Amount" })).toBeVisible();

    // And deve exibir o saldo total consolidado e o saldo total disponível de forma clara no rodapé 
    // (Valide se existe uma linha na tabela contendo o texto Total e verifique se nela contém o caractere $ indicando o valor consolidado).
    const totalRow = accountTable.locator("tbody tr").filter({ hasText: "Total" });
    await expect(totalRow).toBeVisible();
    await expect(totalRow).toContainText("$");
});
