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

test("CT08 - Tentativa de abertura de conta com saldo insuficiente", async ({ page }) => {
    console.log(`Executando CT08 para o usuário: ${nomeUsuario}`);

    // --- PASSO 1: Criar uma segunda conta (Conta B) para receber o saldo ---
    await page.getByRole("link", { name: "Open New Account" }).click();
    await page.waitForTimeout(1000);
    await page.locator("#type").selectOption({ label: "SAVINGS" });
    await page.locator("input[value='Open New Account']").click();

    // Captura o número da nova Conta B
    await expect(page.getByRole('heading', { name: 'Account Opened!' })).toBeVisible();
    const contaDestinoB = await page.locator("#newAccountId").innerText();

    // --- PASSO 2: Transferir todo o saldo da Conta A para a Conta B, zerando a Conta A ---
    await page.getByRole("link", { name: "Transfer Funds" }).click();
    await page.waitForTimeout(1000);

    await page.locator("#amount").fill("515.50"); // Valor total inicial do Parabank
    await page.locator("#toAccountId").selectOption({ value: contaDestinoB });
    await page.locator("input[value='Transfer']").click();
    await expect(page.getByText("Transfer Complete!")).toBeVisible();

    // --- PASSO 3: Tentar abrir uma terceira conta usando a Conta A (agora com $0) ---
    // 1. Given que o usuário esteja na tela "Open New Account"
    await page.getByRole("link", { name: "Open New Account" }).click();
    await page.waitForTimeout(1000);

    // 2. And a conta de origem selecionada não possua saldo disponível (Conta A, index 0)
    await page.locator("#fromAccountId").selectOption({ index: 0 });

    // 3. When selecionar o tipo de conta e a respectiva conta de origem
    await page.locator("#type").selectOption({ label: "CHECKING" });

    // 4. And clicar no botão "Open New Account"
    await page.locator("input[value='Open New Account']").click();

    // 5. Then o sistema não deve criar a nova conta e deve retornar um feedback de erro
    // Lógica condicional inteligente para registrar bugs do Parabank sem quebrar a esteira
    const contaFoiAberta = await page.getByRole('heading', { name: 'Account Opened!' }).isVisible();

    if (contaFoiAberta) {
        throw new Error("⚠️ BUG ENCONTRADO: O sistema permitiu a abertura de conta mesmo com a conta de origem zerada ($0.00).");
    } else {
        console.log("✅ SUCESSO NO TESTE: O sistema bloqueou a criação da conta devido ao saldo insuficiente.");
        // Se o sistema exibir uma mensagem de erro ou não exibir o sucesso, o teste valida o comportamento correto
        await expect(page.getByRole('heading', { name: 'Account Opened!' })).not.toBeVisible();
    }
});