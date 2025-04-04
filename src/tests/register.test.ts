// src/tests/register.test.ts
import request from 'supertest'
import { describe, it, expect } from 'vitest'
import express from 'express'
import registerRoutes from '../routes/register.routes'
import { errorHandler } from '../middlewares/errorHandler'

const app = express()
app.use(express.json())
app.use('/register', registerRoutes)
app.use(errorHandler)

describe('POST /register', () => {
  it('deve registrar um novo usuário com sucesso', async () => {
    const res = await request(app).post('/register').send({
      nome: 'Teste',
      email: `test-${Date.now()}@email.com`,
      senha: '123456',
      cpf_cnpj: `1234567890${Math.floor(Math.random() * 1000)}`,
      telefone: '11999999999',
      endereco: 'Rua Teste'
    })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('message', 'Usuário registrado com sucesso')
  })
})
