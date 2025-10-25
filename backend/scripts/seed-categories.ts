import { PrismaClient } from '@prisma/client';
import { createCategoriesWithChildren, categoryData } from './category';
import 'dotenv/config'

const prisma = new PrismaClient();

async function main() {
  console.log(' Starting category seeding...');
  
  try {
    // Clear existing categories
    console.log(' Clearing existing categories...');
    await prisma.category.deleteMany();
    console.log(' Categories cleared');
    
    // Create categories with children
    console.log(' Creating categories with children...');
    const categories = await createCategoriesWithChildren(prisma);
    
    console.log(`\n🎉 Category seeding completed!`);
    console.log(` Total categories created: ${categories.length}`);
    console.log(` Parent categories: ${categoryData.length}`);
    console.log(` Child categories: ${categories.length - categoryData.length}`);
    
    // Display summary
    console.log('\n Created categories:');
    for (const parentData of categoryData) {
      console.log(`\n  ${parentData.name}`);
      parentData.children.forEach(child => {
        console.log(`   └── ${child.name}`);
      });
    }
    
  } catch (error) {
    console.error(' Category seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
