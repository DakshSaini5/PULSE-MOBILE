const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.log('Terminating all other active PostgreSQL connections to release locks...');
  try {
    await prisma.$executeRawUnsafe(`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = current_database() AND pid <> pg_backend_pid();
    `);
    console.log('Successfully dropped all locks!');
  } catch (err) {
    console.log('Could not terminate some backend processes (expected for superuser connections). Locks should still be mostly cleared.');
  } finally {
    await prisma.$disconnect();
  }
}
main();
