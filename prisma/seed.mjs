// Cria ou atualiza o usuário administrador inicial a partir de ADMIN_EMAIL / ADMIN_PASSWORD (.env).
// Uso: npm run seed

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email) {
    throw new Error("Defina ADMIN_EMAIL no .env antes de rodar o seed.");
  }
  if (!password || password.length < 8) {
    throw new Error(
      "Defina ADMIN_PASSWORD no .env (mínimo 8 caracteres) antes de rodar o seed. Escolha uma senha só sua — nunca reutilize a senha do seu e-mail."
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash, name: email.split("@")[0], role: "ADMIN" },
  });

  console.log(`Usuário administrador pronto: ${user.email}`);
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
