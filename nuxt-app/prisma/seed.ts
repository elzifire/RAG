import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const DATABASE_USER = process.env.DATABASE_USER || 'root'
const DATABASE_PASSWORD = process.env.DATABASE_PASSWORD || ''
const DATABASE_HOST = process.env.DATABASE_HOST || 'localhost'
const DATABASE_PORT = process.env.DATABASE_PORT || '5432'
const DATABASE_NAME = process.env.DATABASE_NAME || 'ragdb'
const DATABASE_URL =
  process.env.DATABASE_URL ||
  `postgresql://${DATABASE_USER}:${encodeURIComponent(DATABASE_PASSWORD)}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`

const pool = new Pool({ connectionString: DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const adminHash = await bcrypt.hash('password123#', 12)
  const demoHash = await bcrypt.hash('password123#', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      name: 'Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
    },
    select: { id: true, email: true, role: true },
  })

  const demo = await prisma.user.upsert({
    where: { email: 'demo@gmail.com' },
    update: {},
    create: {
      email: 'demo@gmail.com',
      name: 'Demo User',
      passwordHash: demoHash,
      role: 'USER',
    },
    select: { id: true, email: true, role: true },
  })

  console.log('✅ Users seeded:')
  console.log(`   Admin → ${admin.email}  (password: password123#)`)
  console.log(`   Demo  → ${demo.email}   (password: password123#)`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => { prisma.$disconnect(); pool.end() })
