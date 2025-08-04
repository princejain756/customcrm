import bcrypt from 'bcryptjs';

const testPasswords = ['password123'];
const hash = '$2b$12$uS/vBPPuUyXu945BY31y0eqJomwMb0z1aDBahjnsoVo/NiZtteKHG';

console.log('Testing passwords against the new database hash...');

for (const password of testPasswords) {
  const match = await bcrypt.compare(password, hash);
  console.log(`Password "${password}": ${match ? '✅ MATCH' : '❌ No match'}`);
}
