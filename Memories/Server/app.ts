import 'dotenv/config';
import 'reflect-metadata';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { AppDataSource } from './data-source';
import { userRouter } from './routes/user.routes';
import { authRouter } from './routes/auth.routes';
import { swaggerSpec } from './swagger';
import { printBanner } from './commands/banner';
import { logger } from './logger';
import { authMiddleware } from './middlewares/auth.middleware';
import morgan from 'morgan';
import os from 'os';

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const host = getLocalIP();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(morgan('dev'));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/users', authMiddleware, userRouter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

AppDataSource.initialize()
  .then(() => {
    console.log('Database connected');
    app.listen(PORT, () => {
      logger.info(`Server running on http://${host}:${PORT}`);
      logger.info(`Swagger docs at http://${host}:${PORT}/api-docs`);
      printBanner();
    });
  })
  .catch((err) => {
    logger.warn('❌ Database connection failed:', err);
    process.exit(1);
  });

export default app;
