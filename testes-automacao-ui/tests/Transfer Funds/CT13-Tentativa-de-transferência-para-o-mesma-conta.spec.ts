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
test("CT13 - Tentativa de transferência para a mesma conta", async ({ page }) => {
    console.log(`Executando CT13 para o usuário: ${nomeUsuario}`);
    console.log(`Usuário: ${usuario}`);
    console.log(`senha: ${senha}`);

    // 1. Given que o usuário esteja na funcionalidade "Transfer Funds"
    await page.getByRole("link", { name: "Transfer Funds" }).click();

    // Aguarda o carregamento das opções nos campos de seleção
    await page.waitForSelector("#fromAccountId");

// 2. When selecionar a exata mesma conta nos campos "From account" e "To account"
    
    // Aguarda o Parabank carregar a tag <option> no código (mesmo que invisível na tela)
    await page.waitForSelector("#fromAccountId option", { state: 'attached' });

    // Pausa de 1 segundo para garantir que o número da conta foi totalmente processado
    await page.waitForTimeout(1000);

    // Captura diretamente o atributo 'value' da primeira opção (mesmo oculta)
    const contaUnica = await page.locator("#fromAccountId option").first().getAttribute("value");

    if (contaUnica) {
        console.log(`Usando a conta ${contaUnica} para Origem e Destino.`);
        
        // Seleciona a exata mesma conta nos dois campos
        await page.locator("#fromAccountId").selectOption(contaUnica);
        await page.locator("#toAccountId").selectOption(contaUnica);
    } else {
        console.error("❌ ERRO: Não foi possível capturar o número da conta para o teste.");
        return; // Encerra o teste se não conseguir obter a conta
    }

    // 3. And informar um valor numérico para a transferência
    const valorAbsurdo = "9999999";
    await page.locator("#amount").fill(valorAbsurdo);

    // 4. And clicar no botão "TRANSFER"
    await page.getByRole("button", { name: "Transfer" }).click();

    // Aguardamos um pouco para a requisição finalizar
    await page.waitForTimeout(2000);

    // 5. Then o sistema não deve processar a operação
    // 6. And deve alertar o usuário de que a conta de destino não pode ser a mesma
    
    // Verificamos se a mensagem de sucesso indevida apareceu
    const bugPresente = await page.getByText("Transfer Complete!").isVisible();

    if (bugPresente) {
        // Comportamento falho do sistema
        throw new Error("⚠️ BUG ENCONTRADO: O sistema permitiu uma transferência para a própria conta de origem.");
    } else {
        // Comportamento correto do sistema (se um dia corrigirem o Parabank)
        console.log("✅ SUCESSO NO TESTE: O sistema bloqueou a transferência para a mesma conta.");
        const mensagemErro = page.locator(".error");
        await expect(mensagemErro).toBeVisible();
        // Espera genérica por uma mensagem de erro indicando problema na seleção das contas
        await expect(mensagemErro).not.toBeEmpty(); 
    }
});