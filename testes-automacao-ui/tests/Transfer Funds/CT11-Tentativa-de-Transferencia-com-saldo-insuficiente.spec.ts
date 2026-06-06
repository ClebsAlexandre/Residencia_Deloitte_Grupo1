import { test, expect } from '@playwright/test';
import { generateNewUser } from '../../utils/generateUser';

// 2. Criando regras antes de todo código (Escopo do Arquivo)
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
    
    await page.locator("[id='customer\\.username']").fill(usuario);
    await page.locator("[id='customer\\.password']").fill(senha);
    await page.locator("#repeatedPassword").fill(senha);

    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Your account was created successfully")).toBeVisible();

    await page.close();
});

// 3. Criar execução para antes de cada teste
test.beforeEach("Realizar login", async ({ page }) => {
    await page.goto("https://parabank.parasoft.com/parabank/index.htm");
    
    await page.locator(".login").locator("[name='username']").fill(usuario);
    await page.locator(".login").locator("[name='password']").fill(senha);
    
    await page.getByRole("button", { name: "Log In" }).click();
    await expect(page.locator("#leftPanel")).toBeVisible();
});

// Cenário de Teste Isolado
test("CT11 – Tentativa de Transferência com saldo insuficiente", async ({ page }) => {
   console.log(`Executando CT11 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`senha: ${senha}`);

    // --- PRÉ-REQUISITO: Abrir uma nova conta para ter um destino válido ---
    await page.getByRole("link", { name: "Open New Account" }).click();
    
    // Aguarda o Parabank carregar as opções no select
    await page.waitForSelector("#fromAccountId");
    
    // Captura o 'value' exato da primeira tag <option> disponível
    const primeiraContaOrigem = await page.locator("#fromAccountId option").first().getAttribute("value");
    
    // Seleciona a conta passando o valor real como parâmetro
    if (primeiraContaOrigem) {
        await page.locator("#fromAccountId").selectOption(primeiraContaOrigem);
    }
    
    // Clica no botão para abrir a conta
    await page.getByRole("button", { name: "Open New Account" }).click();
    
    // Valida que a conta foi aberta e captura o novo número da conta
    await expect(page.getByText("Account Opened!")).toBeVisible();
    const contaDestinoId = await page.locator("#newAccountId").textContent();
    console.log(`Nova conta de destino criada: ${contaDestinoId}`);
    // ----------------------------------------------------------------------

    // Given que o usuário tenha acessado a funcionalidade "Transfer Funds"
    await page.getByRole("link", { name: "Transfer Funds" }).click();

    // Aguarda o carregamento das opções nos campos de seleção
    await page.waitForSelector("#fromAccountId");
    await page.waitForSelector("#toAccountId");

    // When informar um valor superior ao saldo disponível
    const valorAbsurdo = "9999999";
    await page.locator("#amount").fill(valorAbsurdo);

    // And selecionar uma conta de destino válida (A conta que acabamos de criar!)
    if (contaDestinoId) {
        await page.locator("#toAccountId").selectOption(contaDestinoId);
    }

    // And clicar no botão "TRANSFER"
    await page.getByRole("button", { name: "Transfer" }).click();

    // Aguardamos 2 segundos para dar tempo de o sistema processar a transação
    await page.waitForTimeout(2000);

    // Verificamos se a mensagem de sucesso está na tela (retorna true ou false)
    const bugPresente = await page.getByText("Transfer Complete!").isVisible();

    if (bugPresente) {
        // O sistema permitiu a transferência sem saldo (Comportamento Real / Bug)
        throw new Error("⚠️ BUG ENCONTRADO: O sistema completou a transferência mesmo sem saldo suficiente.");
    } else {
        // O sistema bloqueou a transferência corretamente (Comportamento Esperado)
        console.log("✅ SUCESSO NO TESTE: O sistema bloqueou a transferência sem saldo.");
        
        const mensagemErro = page.locator(".error");
        await expect(mensagemErro).toBeVisible();
        await expect(mensagemErro).toContainText(/insufficient funds/i);
    }
});