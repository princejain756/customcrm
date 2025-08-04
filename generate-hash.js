import bcrypt from 'bcryptjs';

const password = 'password123';
const saltRounds = 12;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('New hash for "password123":');
  console.log(hash);
});
