import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';

// Importações diretas
import registerRoutes from "../routes/register.routes.js";
import authRoutes from "../routes/auth.routes.js";
import storeRoutes from "../routes/store.routes.js";
import productRoutes from "../routes/product.routes.js";
import orderRoutes from "../routes/order.routes.js";
import { errorHandler } from "../middlewares/errorHandler.js";

// Mock do serviço de criptografia para testes
import { vi } from 'vitest';
vi.mock('../utils/encryption.js', () => ({
  encrypt: (data) => `encrypted-${data}`,
  decrypt: (data) => data.replace('encrypted-', '')
}));

dotenv.config();

const app = express();
app.use(express.json());
app.use('/register', registerRoutes);
app.use('/auth', authRoutes);
app.use('/store', storeRoutes);
app.use('/products', productRoutes);
app.use('/orders', orderRoutes);
app.use(errorHandler);

// Variáveis para uso nos testes
let token = '';
let storeId = '';
let productId = '';
let orderId = '';

// Dados do usuário de teste
const testUser = {
  email: `test-orders-${Date.now()}@example.com`,
  senha: 'senha123',
  nome: 'Teste Pedidos',
  cpf_cnpj: `12345678901${Math.floor(Math.random() * 1000)}`,
  telefone: '11999999999',
  endereco: 'Rua Teste'
};

// Dados do produto de teste
const testProduct = {
  name: 'Produto Teste Pedido',
  description: 'Produto para teste de pedidos',
  price: 19.90,
  serving_size: '1 porção'
};

// Dados do pedido de teste
const testOrder = {
  customer: {
    name: 'Cliente Teste',
    phone: '11987654321',
    email: 'cliente@teste.com'
  },
  address: {
    street: 'Rua dos Testes',
    number: '123',
    complement: 'Apto 45',
    neighborhood: 'Bairro Teste',
    city: 'São Paulo',
    zip_code: '01234-567',
    reference_point: 'Perto da padaria'
  },
  items: [
    // Será preenchido depois de criar o produto
  ],
  payment_method: 'pix',
  notes: 'Pedido de teste via API'
};

describe('Testes de APIs de Pedidos', () => {
  // Configuração inicial: criar usuário, fazer login e preparar ambiente
  beforeAll(async () => {
    // 1. Registrar usuário
    await request(app)
      .post('/register')
      .send(testUser);

    // 2. Fazer login
    const loginRes = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        senha: testUser.senha
      });

    token = loginRes.body.accessToken;

    // 3. Criar loja
    const storeRes = await request(app)
      .post('/store')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Loja Teste Pedidos',
        address: 'Rua dos Testes, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        payment_methods: ['dinheiro', 'pix']
      });

    storeId = storeRes.body.store.id;

    // 4. Criar produto para teste
    const productRes = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send(testProduct);

    productId = productRes.body.product.id;
    
    // 5. Preencher o item do pedido de teste
    testOrder.items = [
      {
        product_id: productId,
        quantity: 2,
        notes: 'Item de teste'
      }
    ];
  });

  // Teste 1: Criar um novo pedido
  it('deve criar um novo pedido', async () => {
    const res = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(testOrder);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Pedido criado com sucesso');
    expect(res.body).toHaveProperty('order');
    expect(res.body.order).toHaveProperty('id');
    expect(res.body.order).toHaveProperty('status', 'em_processamento');
    expect(res.body.order).toHaveProperty('payment_method', 'pix');
    
    // Salvar o ID do pedido para os próximos testes
    orderId = res.body.order.id;
  });

  // Teste 2: Obter detalhes de um pedido
  it('deve obter os detalhes de um pedido específico', async () => {
    const res = await request(app)
      .get(`/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('order');
    expect(res.body.order).toHaveProperty('id', orderId);
    expect(res.body.order).toHaveProperty('customer');
    expect(res.body.order).toHaveProperty('address');
    expect(res.body.order).toHaveProperty('items');
    expect(res.body.order.items).toHaveLength(1);
  });

  // Teste 3: Listar pedidos
  it('deve listar pedidos com paginação', async () => {
    const res = await request(app)
      .get('/orders')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination).toHaveProperty('total');
    expect(res.body.pagination).toHaveProperty('page', 1);
    expect(res.body.orders.length).toBeGreaterThan(0);
  });

  // Teste 4: Atualizar status de um pedido
  it('deve atualizar o status de um pedido', async () => {
    const res = await request(app)
      .patch(`/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'em_preparacao',
        notes: 'Mudando para preparação via teste'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Status do pedido atualizado para em_preparacao');
    expect(res.body).toHaveProperty('order');
    expect(res.body.order).toHaveProperty('status', 'em_preparacao');
  });

  // Teste 5: Não permitir transições de status inválidas
  it('não deve permitir cancelar um pedido em rota', async () => {
    // Primeiro mudar para em_rota
    await request(app)
      .patch(`/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'em_rota',
        notes: 'Mudando para em rota'
      });
    
    // Tentar cancelar
    const res = await request(app)
      .patch(`/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'cancelado',
        notes: 'Tentando cancelar'
      });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Não é possível cancelar um pedido que já está em rota');
  });

  // Teste 6: Finalizar um pedido
  it('deve finalizar um pedido', async () => {
    const res = await request(app)
      .patch(`/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'finalizado',
        notes: 'Pedido entregue com sucesso'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Status do pedido atualizado para finalizado');
    expect(res.body).toHaveProperty('order');
    expect(res.body.order).toHaveProperty('status', 'finalizado');
  });

  // Teste 7: Confirmar pagamento de um pedido
  it('deve confirmar o pagamento de um pedido', async () => {
    // Criar um novo pedido para este teste
    const newOrderRes = await request(app)
      .post('/orders')
      .set('Authorization', `Bearer ${token}`)
      .send(testOrder);
    
    const newOrderId = newOrderRes.body.order.id;
    
    // Confirmar pagamento
    const res = await request(app)
      .post(`/orders/${newOrderId}/confirm-payment`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Pagamento confirmado');
    expect(res.body).toHaveProperty('order');
    expect(res.body.order).toHaveProperty('payment_status', 'confirmado');
  });
});