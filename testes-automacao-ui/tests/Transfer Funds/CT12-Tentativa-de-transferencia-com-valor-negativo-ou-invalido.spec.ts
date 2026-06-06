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

test("CT12 - Tentativa de transferência com valor negativo ou inválido", async ({ page }) => {
    console.log(`Executando CT12 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`Senha: ${senha}`);

    // Given que o usuário tenha acessado a funcionalidade "Transfer Funds"
    await page.getByRole("link", { name: "Transfer Funds" }).click();

    // Aguarda o AJAX do ParaBank carregar os selects das contas antes de interagir com eles
    await page.waitForTimeout(2000);

    // And possua saldo disponível na conta de origem
    // Captura e seleciona a primeira conta disponível como origem
    const contaOrigemValue = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (contaOrigemValue) {
        await page.locator("#fromAccountId").selectOption(contaOrigemValue);
        // Seleciona a mesma conta também como destino (única disponível para novo usuário)
        await page.locator("#toAccountId").selectOption(contaOrigemValue);
    }

    // When informar um valor negativo, zerado ou texto no campo "Amount" (Preencha com "-500")
    await page.locator("#amount").fill("-500");

    // And selecionar as contas de origem e destino (já selecionadas acima)

    // And clicar no botão "TRANSFER"
    await page.getByRole("button", { name: "Transfer" }).click();

    // Aguarda o sistema processar a requisição
    await page.waitForTimeout(2000);

    // Verificamos se a mensagem de sucesso está na tela (retorna true ou false)
    const transferenciaCompletada = await page.getByText("Transfer Complete!").isVisible();

    if (transferenciaCompletada) {
        // O sistema permitiu a transferência com valor negativo (Comportamento Inesperado / Bug)
        throw new Error("⚠️ BUG ENCONTRADO: O sistema completou a transferência mesmo com um valor negativo.");
    } else {
        // Then o sistema não deve realizar a transferência
        // And deve exibir uma mensagem de erro indicando que o formato do valor é inválido
        console.log("✅ SUCESSO NO TESTE: O sistema bloqueou a transferência com valor negativo.");

        // Valida a presença de uma mensagem de erro na tela
        const mensagemErro = page.locator(".error");
        await expect(mensagemErro).toBeVisible();
        await expect(mensagemErro).toContainText(/invalid/i);
    }
});
