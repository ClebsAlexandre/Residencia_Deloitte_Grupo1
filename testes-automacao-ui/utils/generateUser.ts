import { faker } from '@faker-js/faker';

export function generateNewUser() {
  // Gerando um nome e sobrenome aleatórios
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();

  return {

    // Retorna um objeto com os dados do usuário, incluindo um username único e uma senha
    firstName: firstName,
    lastName: lastName,

    // Cria um username único sem espaços
    usuario: `${firstName}${faker.number.int({ min: 100, max: 9999 })}`,
    senha: faker.internet.password({ length: 8, memorable: true }),
    
    // Nome completo para a validação do Welcome
    nomeUsuario: `${firstName} ${lastName}`,
  };
}