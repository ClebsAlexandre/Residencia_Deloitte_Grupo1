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

test("CT21 - Tentativa de busca com data em formato inválido", async ({ page }) => {
    console.log(`Executando CT21 para o usuário: ${nomeUsuario}`);
  console.log(`Usuário: ${usuario}`);
  console.log(`senha: ${senha}`);

    // 1. Given que o usuário esteja na funcionalidade "Find Transactions"
    await page.getByRole("link", { name: "Find Transactions" }).click();

    // Aguarda o carregamento das opções no select da conta
    await page.waitForSelector("#accountId option", { state: 'attached' });
    await page.waitForTimeout(1000);

    const contaOrigem = await page.locator("#accountId option").first().getAttribute("value");
    if (contaOrigem) {
        await page.locator("#accountId").selectOption(contaOrigem);
    }

    // 2. When informar uma data em formato incorreto ou inserir letras no campo "Find by Date"
    // Usando o ID exato que você mapeou (#transactionDate)
    const dataInvalida = "FORMATO-INVALIDO";
    await page.locator("#transactionDate").fill(dataInvalida);

    // 3. And acionar a busca
    await page.locator("#findByDate").click();

    // Aguarda a resposta (ou a quebra) do servidor
    await page.waitForTimeout(2000);

    // 4. Then o sistema não deve realizar a pesquisa nem retornar erro interno de servidor (Erro 500)
    // 5. And deve exibir uma mensagem de validação informando que o formato da data é inválido
    
    // Verificamos se o Parabank apresentou a temida mensagem de erro interno
    const erroInterno = await page.getByText(/internal error/i).isVisible();

    if (erroInterno) {
        throw new Error("⚠️ BUG ENCONTRADO (GRAVE): O sistema quebrou (Erro 500) ao receber letras no campo de data em vez de validar a entrada.");
        
    } else {
        console.log("✅ SUCESSO NO TESTE: O sistema não quebrou e validou corretamente a entrada inválida.");
        
        // Apontamos diretamente para o ID do erro de data, evitando capturar os spans vazios de outros campos
        const mensagemErro = page.locator("#transactionDateError");
        
        // Verifica se a mensagem de erro específica deste campo apareceu e não está vazia
        await expect(mensagemErro).toBeVisible();
        await expect(mensagemErro).not.toBeEmpty();
    }
});