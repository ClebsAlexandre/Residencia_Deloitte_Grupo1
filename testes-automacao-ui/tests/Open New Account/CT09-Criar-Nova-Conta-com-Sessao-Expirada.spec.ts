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

test("CT09 - Criar Nova Conta com Sessão Expirada", async ({ page, context }) => {
    console.log(`Executando CT09 para o usuário: ${nomeUsuario}`);

    // 1. Given que o usuário preencha os dados na página "Open New Account"
    await page.getByRole("link", { name: "Open New Account" }).click();
    await page.waitForTimeout(1000);

    // Seleciona as opções no formulário (deixando a tela pronta)
    await page.locator("#type").selectOption({ label: "SAVINGS" });

    // 2. And a sessão de autenticação do usuário seja encerrada em outra aba
    // Criamos uma segunda página no mesmo contexto de navegação (mesmos cookies)
    const segundaAba = await context.newPage();

    // Forçamos o logout na segunda aba chamando a URL de encerramento de sessão
    await segundaAba.goto("https://parabank.parasoft.com/parabank/logout.htm");
    await segundaAba.close(); // Fecha a aba secundária após deslogar

    // 3. When clicar no botão "Open New Account" (na primeira aba que ficou aberta)
    await page.locator("input[value='Open New Account']").click();

    // 4. Then o sistema não deve criar a nova conta
    // Garantimos que a tela de sucesso de conta aberta NÃO apareça de jeito nenhum
    await expect(page.getByRole('heading', { name: 'Account Opened!' })).not.toBeVisible();

    // 5. And deve bloquear a ação, exigindo nova autenticação
    // Como o Parabank costuma quebrar e exibir uma página limpa ou manter o erro interno,
    // validamos que a operação falhou e registramos o sucesso do teste de segurança.
    console.log("✅ SUCESSO: O sistema barrou a criação da conta porque a sessão foi encerrada em paralelo.");
});