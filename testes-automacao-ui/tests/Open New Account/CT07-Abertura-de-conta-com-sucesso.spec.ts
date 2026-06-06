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

test("CT07 - Abertura de conta com sucesso (SAVINGS)", async ({ page }) => {
    console.log(`Executando CT07 para o usuário: ${nomeUsuario}`);

    // 1. Given que o usuário esteja na tela "Open New Account"
    await page.getByRole("link", { name: "Open New Account" }).click();

    // Defesa de Sênior: Aguarda o carregamento dos dados dinâmicos da página via AJAX
    await page.waitForTimeout(1000);

    // 2. And possua uma conta de origem com saldo suficiente para o depósito inicial
    // (Garantido pelo beforeAll, pois todo usuário novo já nasce com uma conta padrão ativa)
    const dropdownOrigem = page.locator("#fromAccountId");
    await expect(dropdownOrigem).toBeVisible();

    // 3. When selecionar o tipo de conta desejado e a conta de origem
    // Selecionamos o tipo 'SAVINGS' pelo texto visível
    await page.locator("#type").selectOption({ label: "SAVINGS" });

    // Selecionamos a primeira conta disponível no dropdown de origem (index 0)
    await dropdownOrigem.selectOption({ index: 0 });

    // 4. And clicar no botão "Open New Account"
    // Usamos o seletor específico do input para não conflitar com o link do menu
    await page.locator("input[value='Open New Account']").click();

    // 5. Then o sistema deve exibir uma mensagem de confirmação
    // Defesa Definitiva: Ignoramos as classes repetidas e buscamos explicitamente pelo papel de cabeçalho com o texto de sucesso.
    await expect(page.getByRole('heading', { name: 'Account Opened!' })).toBeVisible();
    await expect(page.getByText("Congratulations, your account is now open.")).toBeVisible();

    // 6. And informar o número único da nova conta criada
    const linkNovaConta = page.locator("#newAccountId");
    await expect(linkNovaConta).toBeVisible();

    const numeroNovaConta = await linkNovaConta.innerText();
    console.log(`✅ SUCESSO: Nova conta criada com o número: ${numeroNovaConta}`);
});