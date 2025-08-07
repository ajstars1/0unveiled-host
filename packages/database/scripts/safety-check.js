#!/usr/bin/env node

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚨 DANGER: db:push:prod WILL CAUSE DATA LOSS! 🚨\n');
console.log('This command will:');
console.log('- DELETE migration history');
console.log('- TRUNCATE tables with data');
console.log('- CONVERT data types (potential data loss)');
console.log('- Cannot be reverted\n');

console.log('✅ SAFE ALTERNATIVE: Use "bun run db:migrate:prod" instead\n');

rl.question('Are you absolutely sure you want to continue? Type "I UNDERSTAND THE RISKS" to proceed: ', (answer) => {
  if (answer === 'I UNDERSTAND THE RISKS') {
    console.log('\n⚠️  Proceeding with dangerous operation...\n');
    const { spawn } = require('child_process');
    const drizzle = spawn('drizzle-kit', ['push', '--config=drizzle-prod.config.ts'], {
      stdio: 'inherit'
    });
    
    drizzle.on('close', (code) => {
      process.exit(code);
    });
  } else {
    console.log('\n✅ Operation cancelled. Use "bun run db:migrate:prod" for safe migrations.\n');
    process.exit(0);
  }
  
  rl.close();
});
