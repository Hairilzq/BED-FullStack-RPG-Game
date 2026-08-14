// ⚠️ DO NOT MODIFY THIS FILE — it is part of the project infrastructure.

import 'dotenv/config';

export default {
  schema: './src/db/schema.js',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:local.db',
  },
};
