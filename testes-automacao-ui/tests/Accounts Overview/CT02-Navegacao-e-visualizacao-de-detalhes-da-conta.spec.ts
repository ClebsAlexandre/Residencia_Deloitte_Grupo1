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

test("CT02 - Navegação e visualização de detalhes da conta", async ({ page }) => {
    console.log(`Executando CT02 para o usuário: ${nomeUsuario}`);
    
    // Given que o usuário esteja na funcionalidade "Accounts Overview"
    // O usuário já cai lá após o login, mas para garantir, clique no link Accounts Overview.
    await page.getByRole("link", { name: "Accounts Overview" }).click();

    // When clicar no número de uma conta específica na tabela
    // Crie uma lógica para localizar o primeiro link (<a>) dentro do corpo da tabela (#accountTable tbody tr).
    const primeiraContaLink = page.locator("#accountTable tbody tr").first().locator("a");
    
    // Aguarda o link estar visível para garantir que a tabela carregou
    await expect(primeiraContaLink).toBeVisible();

    // Capture o texto desse link (o número da conta gerada dinamicamente) e armazene em uma variável const numeroConta.
    const numeroConta = await primeiraContaLink.textContent();
    console.log(`Conta capturada: ${numeroConta}`);

    // Clique neste link.
    await primeiraContaLink.click();

    // Then o sistema deve redirecionar para a tela de detalhes da conta
    // Valide que a página carregou um cabeçalho h1.title contendo o texto Account Details.
    const tituloDetalhes = page.locator("h1.title").filter({ hasText: "Account Details" });
    await expect(tituloDetalhes).toBeVisible();

    // And exibir corretamente o número, tipo, saldo e saldo disponível da conta selecionada
    // Valide que o elemento com id #accountId tem exatamente o mesmo texto da variável numeroConta capturada anteriormente.
    const accountIdElement = page.locator("#accountId");
    await expect(accountIdElement).toHaveText(numeroConta as string);

    // Valide que os elementos de id #accountType, #balance e #availableBalance estão visíveis na tela.
    await expect(page.locator("#accountType")).toBeVisible();
    await expect(page.locator("#balance")).toBeVisible();
    await expect(page.locator("#availableBalance")).toBeVisible();
});
