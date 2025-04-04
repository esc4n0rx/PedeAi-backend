
<p align="center">
  <img src="https://i.imgur.com/uVl40l3.png" width="200" alt="PedeAi Logo" />
</p>

<h1 align="center">PedeAi - Backend</h1>

<p align="center">
  Plataforma de loja online para restaurantes independentes venderem direto aos seus clientes.
</p>

---

## 🚀 Tecnologias Utilizadas

- **Node.js** com **Express**
- **TypeScript**
- **Supabase (PostgreSQL)**
- **Zod** para validação de dados
- **JWT** para autenticação
- **Stripe** para gerenciamento de assinaturas
- **Vitest + Supertest** para testes
- **Swagger (futuramente)** para documentação

---

## 📁 Estrutura de Pastas

```
src/
├── config/           # Configurações de Supabase, Stripe e planos
├── controllers/      # Lógica das rotas
├── middlewares/      # JWT, erros e validações
├── routes/           # Rotas organizadas
├── services/         # Lógicas de domínio
├── validators/       # Schemas Zod
├── tests/            # Testes automatizados
└── server.ts         # Entry point do backend
```

---

## ✅ Funcionalidades já implementadas

- [x] Registro de usuários
- [x] Login com JWT
- [x] Rota protegida `/perfil`
- [x] Integração com Stripe Checkout
- [x] Webhook do Stripe com atualização de plano
- [x] Testes de autenticação e assinatura

---

## 💳 Planos disponíveis (via Stripe)

| Plano       | Valor   | Descrição                                   |
|-------------|---------|----------------------------------------------|
| Vitrine     | R$29,90 | Ideal para quem está começando               |
| Prateleira  | R$39,90 | Mais produtos e controle                     |
| Mercado     | R$49,90 | Tudo liberado para vender em grande escala   |

---

## ▶️ Como rodar o projeto localmente

1. **Clonar o repositório**
```bash
git clone https://github.com/esc4n0rx/PedeAi-backend
cd pedeai-backend
```

2. **Instalar dependências**
```bash
npm install
```

3. **Criar um arquivo `.env` com as variáveis:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=...
JWT_SECRET=...
JWT_EXPIRES_IN=1d
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

4. **Rodar em desenvolvimento**
```bash
npm run dev
```

---

## 🧪 Rodar os testes

```bash
npm test
```

---

## 🧠 Próximos passos

- [ ] Expiração automática do plano
- [ ] Tela de administração dos planos
- [ ] Swagger com documentação da API
- [ ] Rotina de downgrade automático
- [ ] Módulos de produtos e pedidos

---

## 🤝 Contribuição

Pull Requests são bem-vindos! Para grandes mudanças, abra uma issue antes para discutir o que deseja alterar.

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

<p align="center">Desenvolvido com 💜 por Paulo Oliveira</p>
