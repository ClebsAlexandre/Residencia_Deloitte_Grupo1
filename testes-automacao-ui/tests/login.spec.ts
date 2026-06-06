import { test, expect } from '@playwright/test';
import { generateNewUser } from '../utils/generateUser';

// 1. Criando regras antes de todo código
let usuario: string;
let senha: string;
let nomeUsuario: string;
let firstName: string;
let lastName: string;

// 2. Criar execução para antes de todos os testes
test.beforeAll("Registrar dados do usuário no Parabank", async ({ browser }) => {
    const dadosAleatorios = generateNewUser();
    
    // Armazenando os dados gerados para uso em toda a suíte de testes
    usuario = dadosAleatorios.usuario;
    senha = dadosAleatorios.senha;
    nomeUsuario = dadosAleatorios.nomeUsuario;
    firstName = dadosAleatorios.firstName;
    lastName = dadosAleatorios.lastName;

    // Criamos uma página temporária apenas para fazer o cadastro
    const page = await browser.newPage();
    await page.goto("https://parabank.parasoft.com/parabank/register.htm");

    // Preenchendo o formulário de cadastro (usamos [id='...'] pois os IDs do Parabank têm pontos)
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

    // Clica em registrar
    await page.getByRole("button", { name: "Register" }).click();
    
    // Aguarda a confirmação de que a conta foi criada
    await expect(page.getByText("Your account was created successfully")).toBeVisible();

    // Fecha a aba de registro para os testes começarem de forma limpa
    await page.close();
});

// 3. Criar execução para antes de cada teste
test.beforeEach("Realizar login", async ({ page }) => {
    await page.goto("https://parabank.parasoft.com/parabank/index.htm");
    
    // Preenchendo os campos de login com os dados reais recém-criados
    await page.locator(".login").locator("[name='username']").fill(usuario);
    await page.locator(".login").locator("[name='password']").fill(senha);
    
    // Clicando no botão de Log In
    await page.getByRole("button", { name: "Log In" }).click();

    // Validando que o login não deu erro verificando se o painel da conta apareceu
    await expect(page.locator("#leftPanel")).toBeVisible();
});

// Bloco de teste de exemplo
test("Validar acesso à conta", async ({ page }) => {
    console.log(`Teste em execução para o usuário: ${nomeUsuario}`);
    
    // Agora o sistema realmente conhece o usuário e a mensagem será exibida
    await expect(page.getByText(`Welcome ${nomeUsuario}`)).toBeVisible();
});