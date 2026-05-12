import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const {
  DATABASE_USER = 'postgres',
  DATABASE_PASSWORD = '',
  DATABASE_HOST = 'localhost',
  DATABASE_PORT = '5432',
  DATABASE_NAME = 'ragdb',
  DATABASE_URL,
} = process.env

const url =
  DATABASE_URL ||
  `postgresql://${DATABASE_USER}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}?schema=public`

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url,
  },
})

