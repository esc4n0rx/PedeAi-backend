import request from 'supertest'
import express from 'express'
import { describe, it, expect, beforeAll } from 'vitest'

import registerRoutes from '../routes/register.routes'
import loginRoutes from '../routes/login.routes'
import profileRoutes from '../routes/profile.routes'
import { errorHandler } from '../middlewares/errorHandler'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
app.use(express.json())
app.use('/register', registerRoutes)
app.use('/login', loginRoutes)
app.use('/perfil', profileRoutes)
app.use(errorHandler)

let token = ''
let email = `test-${Date.now()}@email.com`
let senha = '123456'

describe('Registro, login e acesso autenticado', () => {
  it('deve registrar um novo usuário', async () => {
    const res = await request(app).post('/register').send({
      nome: 'Teste Login',
      email,
      senha,
      cpf_cnpj: `1234567890${Math.floor(Math.random() * 1000)}`,
      telefone: '11999999999',
      endereco: 'Rua Teste'
    })

    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('message')
  })

  it('deve realizar login com email e senha', async () => {
    const res = await request(app).post('/login').send({ email, senha })

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('token')
    expect(res.body).toHaveProperty('user')
    token = res.body.token
  })

  it('deve negar acesso à rota /perfil sem token', async () => {
    const res = await request(app).get('/perfil')
    expect(res.status).toBe(401)
    expect(res.body).toHaveProperty('error', 'Token não fornecido')
  })

  it('deve permitir acesso à rota /perfil com token', async () => {
    const res = await request(app)
      .get('/perfil')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('user')
    expect(res.body.user).toHaveProperty('email', email)
  })
})
