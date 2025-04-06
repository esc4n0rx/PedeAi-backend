
import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';

// Importações diretas
import registerRoutes from "../routes/register.routes.js";
import authRoutes from "../routes/auth.routes.js";
import storeRoutes from "../routes/store.routes.js";
import productRoutes from "../routes/product.routes.js";
import planRoutes from "../routes/plan.routes.js";
import { errorHandler } from "../middlewares/errorHandler.js";


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
app.use('/plans', planRoutes);
app.use(errorHandler);


let token = '';
let storeId = '';
const testUser = {
  email: `test-limits-${Date.now()}@example.com`,
  senha: 'senha123',
  nome: 'Teste Limites',
  cpf_cnpj: `12345678901${Math.floor(Math.random() * 1000)}`,
  telefone: '11999999999',
  endereco: 'Rua Teste'
};

describe('Teste de Limites de Plano', () => {

  it('deve registrar um novo usuário para o teste', async () => {
    const res = await request(app)
      .post('/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Usuário registrado com sucesso');
  });

  // Passo 2: Fazer login para obter o token
  it('deve fazer login e obter o token de acesso', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({
        email: testUser.email,
        senha: testUser.senha
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    token = res.body.accessToken;
    
    // Verificar se o usuário está no plano gratuito por padrão
    expect(res.body.user).toHaveProperty('plan_active', 'free');
  });

  // Passo 3: Verificar informações do plano atual
  it('deve retornar informações do plano atual (gratuito)', async () => {
    const res = await request(app)
      .get('/plans/current')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.plan).toHaveProperty('planName', 'free');
    expect(res.body.plan.limits).toHaveProperty('maxProducts', 10);
  });

  // Passo 4: Criar uma loja para o usuário
  it('deve criar uma loja para o usuário', async () => {
    const res = await request(app)
      .post('/store')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Loja Teste Limites',
        address: 'Rua dos Testes, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        payment_methods: ['dinheiro', 'pix']
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Loja criada com sucesso');
    expect(res.body).toHaveProperty('store');
    storeId = res.body.store.id;
  });

  // Passo 5: Criar produtos até atingir o limite (plano gratuito = 10 produtos)
  it('deve permitir criar até 10 produtos no plano gratuito', async () => {
    const productBase = {
      name: 'Produto Teste',
      description: 'Descrição do produto de teste',
      price: 19.90,
      serving_size: '1 porção'
    };

    // Criar 10 produtos (limite do plano gratuito)
    for (let i = 1; i <= 10; i++) {
      const res = await request(app)
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...productBase,
          name: `${productBase.name} ${i}`
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Produto criado com sucesso');
    }

    // Verificar contagem de produtos atual
    const planInfo = await request(app)
      .get('/plans/current')
      .set('Authorization', `Bearer ${token}`);

    expect(planInfo.body.plan.usage).toHaveProperty('products');
    expect(planInfo.body.plan.usage.products.current).toBe(10);
    expect(planInfo.body.plan.usage.products.percentage).toBe(100);
  });

  // Passo 6: Tentar criar um produto além do limite
  it('deve impedir a criação de produtos além do limite do plano', async () => {
    const res = await request(app)
      .post('/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Produto Além do Limite',
        description: 'Este produto não deve ser criado',
        price: 29.90
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Limite de produtos atingido');
    expect(res.body).toHaveProperty('upgrade', true);
  });

  // Passo 7: Testar acesso a funcionalidades premium (produtos destacados)
  it('deve negar acesso a funcionalidades premium no plano gratuito', async () => {
    // Primeiro, buscar um produto existente
    const listRes = await request(app)
      .get('/products')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body).toHaveProperty('products');
    expect(listRes.body.products.length).toBeGreaterThan(0);

    const productId = listRes.body.products[0].id;

    // Tentar destacar o produto (funcionalidade premium)
    const res = await request(app)
      .patch(`/products/${productId}/featured`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        is_featured: true
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Acesso negado');
    expect(res.body).toHaveProperty('requiredFeature', 'promotions');
  });

  // Passo 8: Verificar limites de categorias
  it('deve verificar limites de categorias no plano gratuito', async () => {
    // Criar categorias até o limite (3 para o plano gratuito)
    for (let i = 1; i <= 3; i++) {
      const res = await request(app)
        .post('/products/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: `Categoria Teste ${i}`
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Categoria criada com sucesso');
    }

    // Tentar criar uma categoria além do limite
    const res = await request(app)
      .post('/products/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Categoria Além do Limite'
      });

    expect(res.status).toBe(403);
    expect(res.body).toHaveProperty('error', 'Limite de categorias atingido');
  });

  // Passo 9: Verificar listagem de todos os planos disponíveis
  it('deve listar todos os planos disponíveis', async () => {
    const res = await request(app)
      .get('/plans/all')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('plans');
    expect(res.body.plans.length).toBeGreaterThan(0);
    
    // Verificar se o plano gratuito está marcado como atual
    const freePlan = res.body.plans.find(p => p.id === 'free');
    expect(freePlan).toHaveProperty('isCurrent', true);
    
    // Verificar se há planos pagos disponíveis para upgrade
    const paidPlans = res.body.plans.filter(p => p.id !== 'free');
    expect(paidPlans.length).toBeGreaterThan(0);
  });
});