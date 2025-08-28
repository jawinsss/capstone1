"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('Starting database seeding...');
    const hashedPassword = await bcrypt.hash('password', 10);
    const password = await bcrypt.hash('tamdeptrai', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'ngotam120704@gmail.com' },
        update: {},
        create: {
            email: 'ngotam120704@gmail.com',
            username: 'ngotam',
            password: hashedPassword,
            fullName: 'ngo minh tam',
            phone: '0905626568',
            role: 'ADMIN',
            isActive: true,
        },
    });
    const admin1 = await prisma.user.upsert({
        where: { email: 'khoa@gmail.com' },
        update: {},
        create: {
            email: 'khoa@gmail.com',
            username: 'nguyenkhoa',
            password: password,
            fullName: 'nguyen dang khoa',
            phone: '0905626568',
            role: 'ADMIN',
            isActive: true,
        },
    });
    console.log('Admin user created:', admin.email);
    console.log('Admin user created:', admin1.email);
    console.log('Database seeding completed!');
}
main()
    .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map