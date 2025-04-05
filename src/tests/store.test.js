// src/tests/store.test.js
import request from 'supertest';
import express from 'express';
import { describe, it, expect, beforeAll } from 'vitest';
import dotenv from 'dotenv';
import storeRoutes from '../routes/store.routes.js';
import authRoutes from '../routes/auth.routes.js';
import { errorHandler } from '../middlewares/errorHandler.js';

dotenv.config();

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/store', storeRoutes);
app.use(errorHandler);

let token = '';
let email = `store-test-${Date.now()}@example.com`;
let senha = 'senha123';

describe('Gerenciamento de lojas', () => {
  // Preparação - criar usuário e fazer login
  beforeAll(async () => {
    // Registrar usuário de teste
    await request(app).post('/register').send({
      nome: 'Teste Loja',
      email,
      senha,
      cpf_cnpj: `12345678901${Math.floor(Math.random() * 100)}`,
      telefone: '11999999999'
    });

    // Fazer login
    const loginRes = await request(app).post('/auth/login').send({ 
      email, 
      senha 
    });
    
    token = loginRes.body.accessToken;
  });

  it('deve criar uma nova loja', async () => {
    const res = await request(app)
      .post('/store')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Restaurante Teste',
        address: 'Rua das Flores, 123',
        neighborhood: 'Centro',
        city: 'São Paulo',
        payment_methods: ['dinheiro', 'cartão', 'pix']
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Loja criada com sucesso');
    expect(res.body).toHaveProperty('store');
    expect(res.body.store).toHaveProperty('id');
  });

  it('deve buscar os detalhes da loja', async () => {
    const res = await request(app)
      .get('/store')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('store');
    expect(res.body.store).toHaveProperty('name', 'Restaurante Teste');
  });

  it('deve atualizar os dados da loja', async () => {
    const res = await request(app)
      .put('/store')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Restaurante Atualizado',
        theme: 'dark'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Loja atualizada com sucesso');
    expect(res.body.store).toHaveProperty('name', 'Restaurante Atualizado');
    expect(res.body.store).toHaveProperty('theme', 'dark');
  });

  it('deve alterar o status da loja', async () => {
    const res = await request(app)
      .patch('/store/status')
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'inactive'
      });

    expect(res.status).toBe(200);
    expect(res.body.store).toHaveProperty('status', 'inactive');
  });
});