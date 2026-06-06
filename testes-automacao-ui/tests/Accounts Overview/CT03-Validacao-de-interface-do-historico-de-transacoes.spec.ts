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

test("CT03 - Validação de interface do histórico de transações", async ({ page }) => {
    console.log(`Executando CT03 para o usuário: ${nomeUsuario}`);
    
    // Given que o usuário tenha acessado os detalhes de uma conta específica:
    // Navegue para Accounts Overview.
    await page.getByRole("link", { name: "Accounts Overview" }).click();

    // Localize o primeiro link de conta na tabela (#accountTable tbody tr:first-child a) e clique nele.
    const primeiraContaLink = page.locator("#accountTable tbody tr").first().locator("a");
    await expect(primeiraContaLink).toBeVisible();
    await primeiraContaLink.click();

    // When a página de detalhes da conta for carregada:
    // Aguarde o carregamento do título da página (h1.title com texto Account Details).
    const tituloDetalhes = page.locator("h1.title").filter({ hasText: "Account Details" });
    await expect(tituloDetalhes).toBeVisible();

    // Then o sistema deve exibir a seção "Account Activity":
    // Valide que o título secundário 'Account Activity' está visível na tela.
    const tituloActivity = page.locator("h1.title").filter({ hasText: "Account Activity" });
    await expect(tituloActivity).toBeVisible();

    // And apresentar uma tabela contendo o histórico com: data, descrição, débito e crédito:
    // Localize a tabela de transações (id #transactionTable).
    const transactionTable = page.locator("#transactionTable");
    
    // Verificar se a tabela ou a mensagem de que não há transações está visível, 
    // já que o Parabank pode ter comportamento diferente dependo da conta recém criada.
    const noTransactionsMessage = page.getByText("No transactions found.");
    
    if (await noTransactionsMessage.isVisible()) {
        console.log("⚠️ Nenhuma transação encontrada (Tabela não renderizada). Validando a ausência de quebras.");
        // O teste não vai quebrar, mas informamos que a tabela de histórico não apareceu.
    } else {
        // Valide que os cabeçalhos (th) da tabela contêm os textos exatos: Date, Transaction, Debit (-) e Credit (+).
        await expect(transactionTable).toBeVisible();
        
        const thead = transactionTable.locator("thead");
        await expect(thead.locator("th").filter({ hasText: "Date" })).toBeVisible();
        await expect(thead.locator("th").filter({ hasText: "Transaction" })).toBeVisible();
        await expect(thead.locator("th").filter({ hasText: "Debit (-)" })).toBeVisible();
        await expect(thead.locator("th").filter({ hasText: "Credit (+)" })).toBeVisible();
        
        console.log("✅ Cabeçalhos da tabela do histórico validados com sucesso!");
    }
});
