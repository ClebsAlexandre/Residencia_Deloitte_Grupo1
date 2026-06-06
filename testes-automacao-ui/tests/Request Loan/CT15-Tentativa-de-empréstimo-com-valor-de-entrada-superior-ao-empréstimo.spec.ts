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

test("CT15 - Tentativa de empréstimo com valor de entrada superior ao empréstimo", async ({ page }) => {
    console.log(`Executando CT15 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`senha: ${senha}`);

    // 1. Given que o usuário esteja na funcionalidade "Apply for a Loan"
    await page.getByRole("link", { name: "Request Loan" }).click();

    // 2. When preencher o campo "Loan Amount" com um valor financeiro
    const valorEmprestimo = "100";
    await page.locator("#amount").fill(valorEmprestimo);

    // 3. And preencher o campo "Down Payment" com um valor superior ao valor solicitado
    const valorEntrada = "500";
    await page.locator("#downPayment").fill(valorEntrada);

    // 4. And selecionar a conta de origem e clicar no botão "Apply Now"
    // Espera a opção de conta aparecer usando a técnica do 'attached' para evitar timeout
    await page.waitForSelector("#fromAccountId option", { state: 'attached' });
    await page.waitForTimeout(1000);

    const contaOrigem = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (contaOrigem) {
        await page.locator("#fromAccountId").selectOption(contaOrigem);
    }

    await page.getByRole("button", { name: "Apply Now" }).click();

    // Pausa para aguardar o processamento da requisição
    await page.waitForTimeout(2000);

    // 5. Then o sistema deve avaliar as regras de negócio e rejeitar a solicitação
    // 6. And exibir um aviso de que a entrada não pode ser superior ao valor do empréstimo solicitado.

    // Diagnóstico do comportamento do Parabank:
    // O correto seria o formulário exibir um erro e NÃO levar para a tela de "Loan Request Processed".
    const bugPresente = await page.getByText("Loan Request Processed").isVisible();

    if (bugPresente) {
        // Verifica qual foi o status final que o sistema deu para essa transação bizarra
        const statusEmprestimo = await page.locator("#loanStatus").textContent();
        throw new Error(`⚠️ BUG ENCONTRADO: O sistema aceitou e processou o formulário mesmo com a entrada sendo 5x maior que o empréstimo.\nStatus incorreto retornado pelo sistema: ${statusEmprestimo}`);
    } else {
        console.log("✅ SUCESSO NO TESTE: O sistema bloqueou a solicitação na mesma tela.");
        
        // Se um dia o Parabank for corrigido, ele deve exibir uma mensagem de erro na própria tela.
        // O seletor abaixo é genérico para capturar mensagens de erro (classe .error ou id específico)
        const mensagemErro = page.locator(".error");
        await expect(mensagemErro).toBeVisible();
        await expect(mensagemErro).not.toBeEmpty();
    }
});