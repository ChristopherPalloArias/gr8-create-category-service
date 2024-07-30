import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import AWS from 'aws-sdk';

// AWS region and Lambda function configuration
const region = "us-east-2";
const lambdaFunctionName = "fetchSecretsFunction_gr8";

// Function to invoke Lambda and fetch secrets
async function getSecretFromLambda() {
  const lambda = new AWS.Lambda({ region: region });
  const params = {
    FunctionName: lambdaFunctionName,
  };

  try {
    const response = await lambda.invoke(params).promise();
    const payload = JSON.parse(response.Payload);
    if (payload.errorMessage) {
      throw new Error(payload.errorMessage);
    }
    const body = JSON.parse(payload.body);
    return JSON.parse(body.secret);
  } catch (error) {
    console.error('Error invoking Lambda function:', error);
    throw error;
  }
}

// Function to start the service
async function startService() {
  let secrets;
  try {
    secrets = await getSecretFromLambda();
  } catch (error) {
    console.error(`Error starting service: ${error}`);
    return;
  }

  const app = express();
  const port = 8086;

  app.use(cors());
  app.use(express.json());

  // Configure AWS DynamoDB
  AWS.config.update({
    region: region,
    accessKeyId: secrets.AWS_ACCESS_KEY_ID,
    secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
  });

  const dynamoDB = new AWS.DynamoDB.DocumentClient();

  // Swagger setup
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'Category Service API',
        version: '1.0.0',
        description: 'API for managing categories',
      },
    },
    apis: ['./src/index.js'],
  };

  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  // Connect to RabbitMQ
  let channel;
  async function connectRabbitMQ() {
    try {
      const connection = await amqp.connect('amqp://3.136.72.14:5672/');
      channel = await connection.createChannel();
      await channel.assertQueue('category-events', { durable: true });
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
  }

  // Publish event to RabbitMQ
  const publishEvent = async (eventType, data) => {
    const event = { eventType, data };
    try {
      if (channel) {
        channel.sendToQueue('category-events', Buffer.from(JSON.stringify(event)), { persistent: true });
        console.log('Event published to RabbitMQ:', event);
      } else {
        console.error('Channel is not initialized');
      }
    } catch (error) {
      console.error('Error publishing event to RabbitMQ:', error);
    }
  };

  await connectRabbitMQ();

  /**
   * @swagger
   * /categories:
   *   post:
   *     summary: Create a new category
   *     description: Create a new category by name
   *     requestBody:
   *       description: Category object that needs to be created
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Electronics"
   *     responses:
   *       201:
   *         description: Category created
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 name:
   *                   type: string
   *                   example: "Electronics"
   *                 nameCategory:
   *                   type: string
   *                   example: "Electronics"
   *       500:
   *         description: Error creating category
   */
  app.post('/categories', async (req, res) => {
    const { name } = req.body;
    console.log('Received request to create category:', req.body);

    try {
      // Save category to DynamoDB
      const params = {
        TableName: 'Categories_gr8',
        Item: {
          name,
          nameCategory: name,
        },
      };

      dynamoDB.put(params, (err, data) => {
        if (err) {
          console.error('Error saving category to DynamoDB:', err);
          res.status(500).send({ message: 'Error saving category to DynamoDB', error: err });
        } else {
          console.log('Category saved to DynamoDB:', data);

          // Publish category created event to RabbitMQ
          const event = {
            eventType: 'CategoryCreated',
            data: { name, nameCategory: name },
          };
          channel.sendToQueue('category-events', Buffer.from(JSON.stringify(event)));
          console.log('Event published to RabbitMQ:', event);

          res.status(201).send({ name, nameCategory: name });
        }
      });
    } catch (error) {
      console.error('Error creating category:', error);
      res.status(500).send({ message: 'Error creating category', error: error });
    }
  });

  app.get('/', (req, res) => {
    res.send('Category Service Running');
  });

  app.listen(port, () => {
    console.log(`Category service listening at http://localhost:${port}`);
  });
}

startService();
