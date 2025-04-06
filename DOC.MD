# Guia de Uso da Documentação API PedeAi

A API do PedeAi é documentada usando Swagger (OpenAPI), fornecendo uma interface interativa para aprender, testar e utilizar os endpoints da API.

## Acessando a Documentação

Após iniciar o servidor, a documentação Swagger estará disponível em:

```
http://localhost:3000/api-docs
```

## Como Usar a Documentação

### Navegação

A interface do Swagger organiza os endpoints em grupos lógicos (tags):

- **Autenticação**: Rotas para login, refresh de token e logout
- **Usuários**: Rotas para registro e perfil do usuário
- **Planos**: Rotas para gerenciamento de planos e assinaturas
- **Loja**: Rotas para gerenciamento da loja
- **Produtos**: Rotas para gerenciamento de produtos
- **Categorias**: Rotas para gerenciamento de categorias de produtos

### Autenticação

Para testar endpoints protegidos:

1. Primeiro, faça login usando o endpoint `/auth/login`
2. Copie o token JWT retornado (valor do campo `accessToken`)
3. Clique no botão "Authorize" no topo da página
4. Na janela de autorização, digite `Bearer {seu-token}` no campo de valor (substitua `{seu-token}` pelo token JWT que você copiou)
5. Clique em "Authorize" e depois "Close"

Agora você pode testar os endpoints protegidos, pois o Swagger enviará o token de autorização em todas as requisições.

### Testando Endpoints

Para cada endpoint, o Swagger mostra:

1. **Resumo e Descrição**: O que o endpoint faz
2. **Parâmetros**: Parâmetros de URL, query ou path necessários
3. **Corpo da Requisição**: Modelo de dados a serem enviados (quando aplicável)
4. **Respostas**: Possíveis códigos de resposta e seus formatos

Para testar um endpoint:

1. Clique no endpoint que deseja testar para expandir a seção
2. Preencha os parâmetros necessários
3. Clique no botão "Try it out"
4. Revise a requisição e clique em "Execute"
5. Observe a resposta, incluindo código de status, headers e corpo

### Modelos de Dados

Na parte inferior da documentação, você encontrará os modelos de dados (schemas) utilizados pela API. Estes descrevem a estrutura dos objetos usados nas requisições e respostas.

## Exemplos de Uso

### 1. Registrar um Novo Usuário

1. Expanda o endpoint `POST /register`
2. Clique em "Try it out"
3. Preencha o corpo da requisição com os dados do usuário
4. Clique em "Execute"

### 2. Fazer Login

1. Expanda o endpoint `POST /auth/login`
2. Clique em "Try it out"
3. Informe o email e senha
4. Clique em "Execute"
5. Copie o token retornado para usar nas próximas requisições

### 3. Criar uma Loja

1. Autentique-se conforme descrito anteriormente
2. Expanda o endpoint `POST /store`
3. Clique em "Try it out"
4. Preencha os dados da loja
5. Clique em "Execute"

### 4. Criar Produtos

1. Autentique-se conforme descrito anteriormente
2. Expanda o endpoint `POST /products`
3. Clique em "Try it out"
4. Preencha os dados do produto
5. Clique em "Execute"

## Limites de Plano

A API inclui limitações baseadas no plano do usuário:

- **Plano Gratuito (free)**:
  - Até 10 produtos
  - Até 3 categorias
  - Sem acesso a recursos premium

- **Plano Vitrine**:
  - Até 20 produtos
  - Até 5 categorias
  - Acesso a temas básicos

- **Plano Prateleira**:
  - Até 50 produtos
  - Até 10 categorias
  - Acesso a promoções e cupons

- **Plano Mercado**:
  - Produtos e categorias ilimitados
  - Acesso a todos os recursos

As tentativas de exceder esses limites resultarão em erros 403 (Forbidden).