import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PedeAi API',
      version: '1.0.0',
      description: 'API para a plataforma PedeAi - Solução para restaurantes independentes',
      contact: {
        name: 'Suporte PedeAi',
        email: 'suporte@pedeai.com.br'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de desenvolvimento'
      },
      {
        url: 'https://api.pedeai.com.br',
        description: 'Servidor de produção'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do usuário'
            },
            nome: {
              type: 'string',
              description: 'Nome do usuário'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário'
            },
            plan_active: {
              type: 'string',
              description: 'Plano ativo do usuário (free, plan-vitrine, plan-prateleira, plan-mercado)'
            }
          }
        },
        Store: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da loja'
            },
            user_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do usuário proprietário'
            },
            name: {
              type: 'string',
              description: 'Nome da loja'
            },
            address: {
              type: 'string',
              description: 'Endereço da loja'
            },
            neighborhood: {
              type: 'string',
              description: 'Bairro da loja'
            },
            city: {
              type: 'string',
              description: 'Cidade da loja'
            },
            logo_url: {
              type: 'string',
              format: 'url',
              description: 'URL do logo'
            },
            banner_url: {
              type: 'string',
              format: 'url',
              description: 'URL do banner'
            },
            theme: {
              type: 'string',
              description: 'Tema da loja'
            },
            payment_methods: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Métodos de pagamento aceitos'
            },
            business_hours: {
              type: 'object',
              description: 'Horário de funcionamento'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive'],
              description: 'Status da loja'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do produto'
            },
            store_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da loja associada'
            },
            category_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da categoria (opcional)'
            },
            name: {
              type: 'string',
              description: 'Nome do produto'
            },
            description: {
              type: 'string',
              description: 'Descrição do produto'
            },
            price: {
              type: 'number',
              format: 'float',
              description: 'Preço do produto'
            },
            discount_price: {
              type: 'number',
              format: 'float',
              description: 'Preço com desconto (opcional)'
            },
            image_url: {
              type: 'string',
              format: 'url',
              description: 'URL da imagem do produto'
            },
            status: {
              type: 'string',
              enum: ['active', 'inactive', 'out_of_stock'],
              description: 'Status do produto'
            },
            is_featured: {
              type: 'boolean',
              description: 'Indicador se o produto é destacado'
            },
            slug: {
              type: 'string',
              description: 'Slug do produto para URL amigável'
            }
          }
        },
        ProductCategory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único da categoria'
            },
            store_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da loja associada'
            },
            name: {
              type: 'string',
              description: 'Nome da categoria'
            },
            description: {
              type: 'string',
              description: 'Descrição da categoria'
            },
            display_order: {
              type: 'integer',
              description: 'Ordem de exibição'
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do pedido'
            },
            store_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da loja'
            },
            customer_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cliente'
            },
            address_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do endereço de entrega'
            },
            coupon_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cupom aplicado (se houver)'
            },
            status: {
              type: 'string',
              enum: ['em_processamento', 'em_preparacao', 'em_rota', 'finalizado', 'cancelado', 'recusado'],
              description: 'Status atual do pedido'
            },
            payment_method: {
              type: 'string',
              enum: ['pix', 'cartao', 'dinheiro'],
              description: 'Método de pagamento'
            },
            payment_status: {
              type: 'string',
              enum: ['pendente', 'confirmado', 'nao_confirmado'],
              description: 'Status do pagamento'
            },
            payment_proof_url: {
              type: 'string',
              format: 'uri',
              description: 'URL do comprovante de pagamento (para Pix)'
            },
            change_for: {
              type: 'number',
              format: 'float',
              description: 'Valor para troco (para dinheiro)'
            },
            subtotal: {
              type: 'number',
              format: 'float',
              description: 'Subtotal do pedido (sem descontos e taxas)'
            },
            delivery_fee: {
              type: 'number',
              format: 'float',
              description: 'Taxa de entrega'
            },
            discount: {
              type: 'number',
              format: 'float',
              description: 'Valor do desconto aplicado'
            },
            total: {
              type: 'number',
              format: 'float',
              description: 'Valor total do pedido (subtotal + taxa - desconto)'
            },
            notes: {
              type: 'string',
              description: 'Observações sobre o pedido'
            },
            customer: {
              $ref: '#/components/schemas/Customer'
            },
            address: {
              $ref: '#/components/schemas/Address'
            },
            items: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderItem'
              }
            },
            status_history: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/OrderStatusHistory'
              }
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data da última atualização'
            }
          }
        },
        Customer: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do cliente'
            },
            store_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID da loja'
            },
            name: {
              type: 'string',
              description: 'Nome do cliente'
            },
            phone: {
              type: 'string',
              description: 'Telefone do cliente'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do cliente (opcional)'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          }
        },
        Address: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do endereço'
            },
            customer_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do cliente'
            },
            street: {
              type: 'string',
              description: 'Nome da rua'
            },
            number: {
              type: 'string',
              description: 'Número do endereço'
            },
            complement: {
              type: 'string',
              description: 'Complemento (opcional)'
            },
            neighborhood: {
              type: 'string',
              description: 'Bairro'
            },
            city: {
              type: 'string',
              description: 'Cidade'
            },
            zip_code: {
              type: 'string',
              description: 'CEP'
            },
            reference_point: {
              type: 'string',
              description: 'Ponto de referência (opcional)'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de atualização'
            }
          }
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do item'
            },
            order_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do pedido'
            },
            product_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do produto'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Quantidade do produto'
            },
            unit_price: {
              type: 'number',
              format: 'float',
              description: 'Preço unitário do produto'
            },
            total_price: {
              type: 'number',
              format: 'float',
              description: 'Preço total do item (quantidade * preço unitário)'
            },
            notes: {
              type: 'string',
              description: 'Observações sobre o item'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação'
            }
          }
        },
        OrderStatusHistory: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'ID único do registro'
            },
            order_id: {
              type: 'string',
              format: 'uuid',
              description: 'ID do pedido'
            },
            status: {
              type: 'string',
              enum: ['em_processamento', 'em_preparacao', 'em_rota', 'finalizado', 'cancelado', 'recusado'],
              description: 'Status registrado'
            },
            notes: {
              type: 'string',
              description: 'Observações sobre a mudança de status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data do registro'
            }
          }
        },
        Plan: {
          type: 'object',
          properties: {
            planName: {
              type: 'string',
              description: 'Nome do plano'
            },
            description: {
              type: 'string',
              description: 'Descrição do plano'
            },
            status: {
              type: 'string',
              enum: ['active', 'expired'],
              description: 'Status do plano'
            },
            expiresAt: {
              type: 'string',
              format: 'date-time',
              description: 'Data de expiração do plano'
            },
            daysRemaining: {
              type: 'integer',
              description: 'Dias restantes até a expiração'
            },
            limits: {
              type: 'object',
              properties: {
                maxProducts: {
                  type: 'integer',
                  description: 'Limite máximo de produtos'
                },
                maxCategories: {
                  type: 'integer',
                  description: 'Limite máximo de categorias'
                }
              }
            },
            features: {
              type: 'array',
              items: {
                type: 'string'
              },
              description: 'Recursos disponíveis no plano'
            },
            usage: {
              type: 'object',
              properties: {
                products: {
                  type: 'object',
                  properties: {
                    current: {
                      type: 'integer',
                      description: 'Quantidade atual de produtos'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Limite de produtos'
                    },
                    percentage: {
                      type: 'integer',
                      description: 'Percentual de uso (0-100)'
                    }
                  }
                },
                categories: {
                  type: 'object',
                  properties: {
                    current: {
                      type: 'integer',
                      description: 'Quantidade atual de categorias'
                    },
                    limit: {
                      type: 'integer',
                      description: 'Limite de categorias'
                    },
                    percentage: {
                      type: 'integer',
                      description: 'Percentual de uso (0-100)'
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']  // Arquivos onde os comentários Swagger estão
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { 
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "PedeAi API Documentation",
  }));
};