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

test("CT14 - Solicitar empréstimo com sucesso e aprovação de crédito", async ({ page }) => {
    console.log(`Executando CT14 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`senha: ${senha}`);

    // 1. Given que o usuário tenha acessado a funcionalidade "Apply for a Loan" (Request Loan)
    await page.getByRole("link", { name: "Request Loan" }).click();

    // 2. When informar um valor numérico válido no campo "Loan Amount"
    await page.locator("#amount").fill("100");

    // 3. And informar um valor no campo "Down Payment" que seja menor ou igual ao valor do empréstimo
    // O valor deve ser coberto pelo saldo atual da conta (novo usuário tem ~$515)
    await page.locator("#downPayment").fill("10");

    // 4. And selecionar uma conta de origem válida para o débito da entrada
    // Aguarda a opção da conta ser anexada ao DOM (mesmo que oculta inicialmente) para evitar timeouts
    await page.waitForSelector("#fromAccountId option", { state: 'attached' });
    await page.waitForTimeout(1000); // Pausa para garantir carregamento dos dados via AJAX

    const contaOrigem = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (contaOrigem) {
        await page.locator("#fromAccountId").selectOption(contaOrigem);
    }

    // 5. And clicar no botão "Apply Now"
    await page.getByRole("button", { name: "Apply Now" }).click();

    // 6. Then o sistema deve avaliar os critérios mínimos e aprovar a solicitação
    // Validamos se a tela de processamento do empréstimo foi carregada com sucesso
    await expect(page.getByText("Loan Request Processed")).toBeVisible();

    // 7. And exibir o status do empréstimo como "Approved"
    const statusEmprestimo = page.locator("#loanStatus");
    await expect(statusEmprestimo).toBeVisible();
    await expect(statusEmprestimo).toHaveText("Approved");

    // 8. And apresentar o número da nova conta de empréstimo criada para acompanhamento
    const novaContaLocator = page.locator("#newAccountId");
    await expect(novaContaLocator).toBeVisible();
    
    const numeroNovaConta = await novaContaLocator.textContent();
    console.log(`✅ SUCESSO: Empréstimo aprovado! Nova conta de empréstimo gerada: ${numeroNovaConta}`);
});