// ✏️ EDIT THIS FILE — register your new routes here (before the error handler).
// Look for the comment "Add your routes here" below.

import 'dotenv/config';
import cookieParser from 'cookie-parser';
import express from 'express';
import cors from 'cors';
import { setupSwagger } from './_extras/api-docs/swagger.js';
import { errorHandler } from './src/utils/_errors.js';
import { usersRoute } from './src/Router/usersRouter.js';
import { battlesRoute } from './src/Router/battlesRouter.js';
import { loginRoute } from './src/Router/loginRouter.js';

const app = express();
//const cors = require('cors');

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Must match your Vite frontend URL exactly
  credentials: true // Crucial: Allows the HTTP-only cookie to be sent back and forth
}));
app.use(express.json());
app.use(cookieParser());
//app.use(express.static('src/frontend'));

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Add your routes here — before the error handler, like this:
// app.use('/api/your-resource', yourRoutes);
app.use('/users', usersRoute);
app.use('/battle', battlesRoute);
app.use('/login', loginRoute);

// Swagger API docs
await setupSwagger(app);

// Global error handler (must be last)
app.use(errorHandler);

// Only listen when run directly (not imported for testing)
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`API docs at http://localhost:${PORT}/api-docs`);
});
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try a different port by setting the PORT environment variable.`);
    process.exit(1);
  }
  throw err;
});

export default app;
