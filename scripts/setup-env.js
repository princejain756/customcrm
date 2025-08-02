import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 PostgreSQL Environment Setup');
console.log('==============================');
console.log('');
console.log('Please enter your PostgreSQL password:');
console.log('(This will be used to update your .env file)');
console.log('');

// Read the current .env file
const envPath = path.join(__dirname, '..', '.env');
let envContent = fs.readFileSync(envPath, 'utf8');

// Update the password placeholder
envContent = envContent.replace(
  /POSTGRES_PASSWORD=your_password_here/,
  'POSTGRES_PASSWORD=your_actual_password_here'
);

// Write back to .env file
fs.writeFileSync(envPath, envContent);

console.log('✅ .env file updated!');
console.log('');
console.log('📝 Next steps:');
console.log('1. Edit the .env file and replace "your_actual_password_here" with your actual PostgreSQL password');
console.log('2. Run: npm run test:db');
console.log('3. If successful, run: npm run dev');
console.log('');
console.log('💡 Tip: You can find your .env file in the project root directory'); 