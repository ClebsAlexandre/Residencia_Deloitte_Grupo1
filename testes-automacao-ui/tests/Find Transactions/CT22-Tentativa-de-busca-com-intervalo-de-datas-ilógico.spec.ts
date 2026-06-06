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

test("CT22 - Tentativa de busca com intervalo de datas ilógico", async ({ page }) => {
    console.log(`Executando CT22 para o usuário: ${nomeUsuario}`);
  console.log(`Usuário: ${usuario}`);
  console.log(`senha: ${senha}`);

    // 1. Given que o usuário esteja na funcionalidade "Find Transactions"
    await page.getByRole("link", { name: "Find Transactions" }).click();

    await page.waitForSelector("#accountId option", { state: 'attached' });
    await page.waitForTimeout(1000);

    const contaOrigem = await page.locator("#accountId option").first().getAttribute("value");
    if (contaOrigem) {
        await page.locator("#accountId").selectOption(contaOrigem);
    }

    // 2. When preencher o campo de data inicial ("Between") com uma data futura
    // Mapeando com o padrão de IDs compostos do Parabank (se der timeout, ajustaremos para #fromDate)
    await page.locator("#fromDate").fill("12-31-2026");

    // 3. And preencher o campo final ("And") com uma data anterior à data inicial
    // Criando o cenário ilógico: Data Final é MENOR que a Data Inicial
    await page.locator("#toDate").fill("01-01-2026");

    // 4. And clicar no botão para buscar por intervalo
    // Assumindo a nomenclatura lógica dos botões anteriores
    await page.locator("#findByDateRange").click();

    await page.waitForTimeout(2000);

    // 5. Then o sistema deve bloquear a ação
    // 6. And exibir um alerta indicando que a data inicial não pode ser maior que a data final

    const erroInterno = await page.getByText(/internal error/i).isVisible();
    const erroExibido = await page.locator("#dateRangeError").isVisible();

    if (erroInterno) {
        throw new Error("⚠️ BUG ENCONTRADO (GRAVE): O sistema estourou Erro 500 ao invés de validar as datas.");
        
    } else if (!erroExibido) {
        throw new Error("⚠️ BUG ENCONTRADO: O sistema ignorou o intervalo ilógico, não validou o erro e tentou realizar a busca.");
        
    } else {
        console.log("✅ SUCESSO NO TESTE: O sistema validou a regra de negócio e barrou as datas ilógicas.");
        
        // Usamos o ID exato mapeado anteriormente no CT20
        const mensagemErro = page.locator("#dateRangeError");
        await expect(mensagemErro).toBeVisible();
        await expect(mensagemErro).not.toBeEmpty();
    }
});