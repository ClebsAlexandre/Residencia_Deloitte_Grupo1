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

test("CT05 - Tentativa de acesso indevido a contas de terceiros via URL (IDOR)", async ({ page }) => {
    console.log(`Executando CT05 para o usuário: ${nomeUsuario}`);

    // Contexto: O sistema tem uma falha onde permite acessar contas de terceiros
    // mudando o ID na URL. O teste deve reproduzir isso, não quebrar, e avisar no console.

    // Navegue para a URL de detalhes de conta forçando um ID aleatório estático.
    await page.goto("https://parabank.parasoft.com/parabank/activity.htm?id=99999");

    // Verifica se a página exibiu os detalhes da conta indevidamente ou retornou um erro
    const paginaCarregouIndevidamente = await page.locator("h1.title").filter({ hasText: "Account Details" }).isVisible();

    if (paginaCarregouIndevidamente) {
        throw new Error("⚠️ BUG ENCONTRADO: Vulnerabilidade de IDOR. O sistema permitiu acesso à conta de terceiros pela URL.");
    } else {
        // O sistema bloqueou corretamente o acesso à conta de terceiros
        console.log("✅ SUCESSO NO TESTE: O sistema bloqueou o acesso indevido à conta via URL.");
    }
});
