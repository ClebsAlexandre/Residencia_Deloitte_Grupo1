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

test("CT06 - Validar layout e campos da tela de abertura de conta", async ({ page }) => {
    console.log(`Executando CT06 para o usuário: ${nomeUsuario}`);

    // Given que o usuário esteja autenticado (já garantido pelo beforeEach)
    // Clique no link Open New Account.
    await page.getByRole("link", { name: "Open New Account" }).click();

    // Aguarda um delay do Parabank para carregamento dos dados via AJAX
    await page.waitForTimeout(1000);

    // Then o sistema deve exibir o formulário de abertura de conta corretamente

    // Valide que o texto 'What type of Account would you like to open?' está visível.
    await expect(page.getByText("What type of Account would you like to open?")).toBeVisible();

    // Valide que o dropdown de tipo (id #type) existe e contém as opções CHECKING e SAVINGS por texto.
    const dropdownTipo = page.locator("#type");
    await expect(dropdownTipo).toBeVisible();
    await expect(dropdownTipo).toContainText("CHECKING");
    await expect(dropdownTipo).toContainText("SAVINGS");
    console.log("✅ Dropdown de tipo validado: opções CHECKING e SAVINGS encontradas.");

    // Valide que a tela contém a mensagem sobre o depósito mínimo (busque por texto que contenha A minimum of $).
    await expect(page.getByText(/A minimum of \$/)).toBeVisible();
    console.log("✅ Mensagem de depósito mínimo exibida corretamente.");

    // Valide que o dropdown de conta de origem (id #fromAccountId) está visível na tela.
    await expect(page.locator("#fromAccountId")).toBeVisible();
    console.log("✅ Dropdown de conta de origem (#fromAccountId) visível.");
});