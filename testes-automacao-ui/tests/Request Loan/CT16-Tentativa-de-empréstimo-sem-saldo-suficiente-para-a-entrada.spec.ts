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

test("CT16 - Tentativa de empréstimo sem saldo suficiente para a entrada", async ({ page }) => {
    console.log(`Executando CT16 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`senha: ${senha}`);

    // 1. Given que o usuário esteja na funcionalidade "Apply for a Loan"
    await page.getByRole("link", { name: "Request Loan" }).click();

    // 2. When informar valores numéricos válidos nos campos "Loan Amount" e "Down Payment"
    // Solicitamos um empréstimo alto
    await page.locator("#amount").fill("50000");
    
    // 3. And selecionar uma conta de origem que possua saldo inferior ao valor definido para o "Down Payment"
    // Inserimos uma entrada (Down Payment) muito maior que o saldo inicial da conta (que é de ~$515)
    await page.locator("#downPayment").fill("5000");

    // Aguarda a opção da conta ser anexada ao DOM para evitar timeout
    await page.waitForSelector("#fromAccountId option", { state: 'attached' });
    await page.waitForTimeout(1000);

    const contaOrigem = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (contaOrigem) {
        await page.locator("#fromAccountId").selectOption(contaOrigem);
    }

    // 4. And clicar no botão "Apply Now"
    await page.getByRole("button", { name: "Apply Now" }).click();

    // 5. Then o sistema deve avaliar os fundos e recusar a operação
    await expect(page.getByText("Loan Request Processed")).toBeVisible();

    // 6. And exibir o status do empréstimo como "Denied"
    const statusEmprestimo = page.locator("#loanStatus");
    await expect(statusEmprestimo).toBeVisible();
    await expect(statusEmprestimo).toHaveText("Denied");

    // (Opcional/Bônus) Validamos também a mensagem de erro específica que o Parabank exibe em vermelho
    const mensagemErro = page.getByText("You do not have sufficient funds for the given down payment.");
    await expect(mensagemErro).toBeVisible();
    
    console.log("✅ SUCESSO NO TESTE: O sistema negou o empréstimo corretamente por falta de fundos para a entrada.");
});