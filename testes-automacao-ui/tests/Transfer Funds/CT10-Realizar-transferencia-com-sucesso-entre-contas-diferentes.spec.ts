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

test("CT10 - Realizar transferência com sucesso entre contas diferentes", async ({ page }) => {
    console.log(`Executando CT10 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`Senha: ${senha}`);

    // --- PRÉ-REQUISITO: Criar uma segunda conta para servir como destino da transferência ---
    // Como o usuário recém-criado possui apenas uma conta, precisamos abrir uma nova
    // para que haja uma conta de destino diferente da conta de origem
    await page.getByRole("link", { name: "Open New Account" }).click();

    // Aguarda o Parabank carregar as opções no select de conta de origem
    await page.waitForSelector("#fromAccountId");

    // Captura o valor da primeira conta disponível para selecionar como origem
    const primeiraContaOrigem = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (primeiraContaOrigem) {
        await page.locator("#fromAccountId").selectOption(primeiraContaOrigem);
    }

    // Clica no botão para abrir a nova conta
    await page.getByRole("button", { name: "Open New Account" }).click();

    // Valida que a segunda conta foi criada com sucesso
    await expect(page.getByText("Account Opened!")).toBeVisible();
    const contaDestinoId = await page.locator("#newAccountId").textContent();
    console.log(`Nova conta de destino criada: ${contaDestinoId}`);
    // --------------------------------------------------------------------------------------

    // Given que o usuário tenha acessado a funcionalidade "Transfer Funds"
    await page.getByRole("link", { name: "Transfer Funds" }).click();

    // Aguarda o AJAX do ParaBank carregar os selects das contas antes de interagir com eles
    await page.waitForTimeout(2000);

    // And possua saldo disponível na conta de origem selecionada
    // Captura a primeira conta (origem) disponível no combo
    const contaOrigemValue = await page.locator("#fromAccountId option").first().getAttribute("value");
    if (contaOrigemValue) {
        await page.locator("#fromAccountId").selectOption(contaOrigemValue);
    }

    // When informar um valor numérico válido no campo "Amount"
    await page.locator("#amount").fill("50");

    // And selecionar uma conta de destino diferente da conta de origem (index 1 = segunda conta)
    const contaDestinoOption = page.locator("#toAccountId option").nth(1);
    const contaDestinoValue = await contaDestinoOption.getAttribute("value");
    if (contaDestinoValue) {
        await page.locator("#toAccountId").selectOption(contaDestinoValue);
    }

    // And clicar no botão "TRANSFER"
    await page.getByRole("button", { name: "Transfer" }).click();

    // Then o sistema deve realizar a transferência com sucesso
    // And exibir uma mensagem de confirmação informando o valor transferido e as contas envolvidas
    await expect(page.getByText("Transfer Complete!")).toBeVisible();
    await expect(page.getByText("$50.00")).toBeVisible();
    console.log(`✅ SUCESSO NO TESTE: Transferência de $50.00 realizada com sucesso!`);

    // And apresentar a mensagem de referência para visualizar as atividades pós-transação
    // O Parabank exibe "See Account Activity for more details." como parágrafo de texto,
    // sem um link com role explícito. Validamos o texto que confirma a disponibilidade da activity.
    const mensagemActivity = page.getByText("See Account Activity for more details.");
    await expect(mensagemActivity).toBeVisible();
    console.log(`✅ Mensagem "See Account Activity for more details." visível após a transferência.`);
});
