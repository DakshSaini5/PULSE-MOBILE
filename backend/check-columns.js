const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const res = await prisma.$queryRawUnsafe(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='Hospital';
    `);
    console.log(res.map(r => r.column_name));
  } finally {
    await prisma.$disconnect();
  }
}
main();
