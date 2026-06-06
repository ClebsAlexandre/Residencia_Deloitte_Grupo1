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

test("CT17 - Tentativa de empréstimo com valores negativos ou inválidos", async ({ page }) => {
    console.log(`Executando CT17 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`senha: ${senha}`);

    // 1. Given que o usuário esteja na funcionalidade "Apply for a Loan"
    await page.getByRole("link", { name: "Request Loan" }).click();

    // 2. When informar caracteres inválidos, valores negativos ou zerados
    // Vamos enviar valores estritamente negativos e absurdos para forçar o erro
    await page.locator("#amount").fill("-5000");
    await page.locator("#downPayment").fill("-500");

    // 3. And selecionar a conta de origem e clicar no botão "Apply Now"
    // Espera a opção de conta aparecer usando a técnica do 'attached' para evitar timeout
    await page.waitForSelector("#fromAccountId option", { state: 'attached' });
    await page.waitForTimeout(1000);

    const contaOrigem = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (contaOrigem) {
        await page.locator("#fromAccountId").selectOption(contaOrigem);
    }

    await page.getByRole("button", { name: "Apply Now" }).click();

    // Pausa para aguardar o processamento (ou quebra) da aplicação
    await page.waitForTimeout(2000);

    // 4. Then o sistema não deve processar a aprovação da solicitação
    // 5. And deve retornar uma mensagem de validação indicando que os valores inseridos estão incorretos

    // Vamos diagnosticar se o sistema engoliu o valor negativo e processou a tela:
    const bugProcessamento = await page.getByText("Loan Request Processed").isVisible();

    if (bugProcessamento) {
        throw new Error("⚠️ BUG ENCONTRADO (GRAVE): O sistema processou um pedido de empréstimo com valores NEGATIVOS.");
    } else {
        console.log("✅ SUCESSO NO TESTE: O sistema bloqueou o formulário e não processou valores negativos.");
        
        // Verifica se a mensagem de erro (genérica ou de formatação) foi apresentada
        // Muitas vezes o Parabank apresenta o erro com a classe .error
        const mensagemErro = page.locator(".error");
        await expect(mensagemErro).toBeVisible();
        await expect(mensagemErro).not.toBeEmpty();
    }
});