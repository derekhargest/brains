import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Brain API',
      version: '1.0.0',
      description: 'Cognitive Memory System API Documentation'
    },
    servers: [{ url: 'http://localhost:3002/api' }]
  },
  apis: ['./backend/*.js']
};

export const specs = swaggerJsdoc(options); 