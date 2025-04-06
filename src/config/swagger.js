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