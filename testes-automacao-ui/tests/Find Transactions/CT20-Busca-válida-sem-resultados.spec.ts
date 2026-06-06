import { test, expect } from "@playwright/test";
import { generateNewUser } from "../../utils/generateUser";

// Variáveis de escopo do arquivo
let usuario: string;
let senha: string;
let nomeUsuario: string;
let firstName: string;
let lastName: string;

test.beforeAll(
  "Registrar dados do usuário no Parabank",
  async ({ browser }) => {
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
    await expect(
      page.getByText("Your account was created successfully"),
    ).toBeVisible();

    await page.close();
  },
);

test.beforeEach("Realizar login", async ({ page }) => {
  await page.goto("https://parabank.parasoft.com/parabank/index.htm");

  await page.locator(".login").locator("[name='username']").fill(usuario);
  await page.locator(".login").locator("[name='password']").fill(senha);

  await page.getByRole("button", { name: "Log In" }).click();
  await expect(page.locator("#leftPanel")).toBeVisible();
});

test("CT20 - Busca válida sem resultados", async ({ page }) => {
  console.log(`Executando CT20 para o usuário: ${nomeUsuario}`);
  console.log(`Usuário: ${usuario}`);
  console.log(`senha: ${senha}`);

  // 1. Given que o usuário esteja na funcionalidade "Find Transactions"
  await page.getByRole("link", { name: "Find Transactions" }).click();

  // Aguarda o carregamento das opções no select da conta
  await page.waitForSelector("#accountId option", { state: "attached" });
  await page.waitForTimeout(1000);

  const contaOrigem = await page
    .locator("#accountId option")
    .first()
    .getAttribute("value");
  if (contaOrigem) {
    await page.locator("#accountId").selectOption(contaOrigem);
  }

  // 2. When realizar uma busca por um critério que nunca foi transacionado
  // Como a conta acabou de ser criada e não fizemos transferências, buscar qualquer valor alto servirá.
  const valorInexistente = "9999999";
  await page.locator("#amount").fill(valorInexistente);

  // Clica no botão de busca por Amount, utilizando o ID mapeado anteriormente
  await page.locator("#findByAmount").click();

  // Aguarda a resposta do servidor para a nossa busca
  await page.waitForTimeout(2000);

  // 3. Then a aplicação não deve quebrar ou ficar em carregamento infinito
  // 4. And a tabela deve aparecer vazia acompanhada de uma mensagem amigável de ausência de resultados

  // Verificamos se o Parabank apresentou os erros tradicionais
    const erroInterno = await page.getByText(/internal error/i).isVisible();
    const erroGenerico = await page.locator("p.error").isVisible();
    
    // NOVO: Verificamos o bug bizarro do frontend (NaN e undefined na tabela) que você descobriu
    const bugTabelaQuebrada = await page.getByText("NaN-NaN-NaN").isVisible();

    if (erroInterno || erroGenerico || bugTabelaQuebrada) {
        if (bugTabelaQuebrada) {
            throw new Error("⚠️ BUG ENCONTRADO: O sistema não soube lidar com a busca vazia.\n-> O frontend quebrou exibindo linhas com NaN-NaN-NaN e undefined.");
        } else {
            throw new Error("⚠️ BUG ENCONTRADO: O sistema não soube lidar com a busca vazia.\n-> Ocorreu um erro genérico (p.error)");
        }
        
    } else {
        console.log("✅ SUCESSO NO TESTE: O sistema não quebrou e lidou corretamente com a busca vazia.");
        
        const tabelaResultados = page.locator("#transactionTable");
        await expect(tabelaResultados).not.toContainText(`$${valorInexistente}`);
    }
});