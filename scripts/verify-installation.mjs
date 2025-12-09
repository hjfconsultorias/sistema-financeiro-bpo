#!/usr/bin/env node

/**
 * Script de Verificação da Instalação - BPO EK v1.0
 * 
 * Este script verifica se o sistema foi instalado corretamente
 * e se todos os componentes estão funcionando.
 * 
 * Uso: node verify-installation.mjs
 */

import mysql from 'mysql2/promise';
import fs from 'fs';
import { execSync } from 'child_process';

console.log('🔍 Verificando instalação do sistema BPO EK v1.0...\n');

let errors = 0;
let warnings = 0;

// Helper para printar resultado
function printResult(check, status, message) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️ ',
    info: 'ℹ️ '
  };
  
  console.log(`${icons[status]} ${check}: ${message}`);
  
  if (status === 'error') errors++;
  if (status === 'warning') warnings++;
}

// 1. Verificar Node.js
console.log('📦 Verificando dependências...\n');

try {
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 22) {
    printResult('Node.js', 'success', `Versão ${nodeVersion} instalada`);
  } else {
    printResult('Node.js', 'warning', `Versão ${nodeVersion} (recomendado: 22.x ou superior)`);
  }
} catch (error) {
  printResult('Node.js', 'error', 'Não encontrado');
}

// 2. Verificar pnpm
try {
  const pnpmVersion = execSync('pnpm --version', { encoding: 'utf8' }).trim();
  printResult('pnpm', 'success', `Versão ${pnpmVersion} instalada`);
} catch (error) {
  printResult('pnpm', 'warning', 'Não encontrado (use npm como alternativa)');
}

// 3. Verificar arquivos essenciais
console.log('\n📁 Verificando arquivos do projeto...\n');

const essentialFiles = [
  'package.json',
  'drizzle/schema.ts',
  'server/routers.ts',
  'server/db.ts',
  'client/src/App.tsx',
  'client/src/main.tsx',
];

for (const file of essentialFiles) {
  if (fs.existsSync(file)) {
    printResult(file, 'success', 'Encontrado');
  } else {
    printResult(file, 'error', 'Não encontrado');
  }
}

// 4. Verificar .env
console.log('\n🔐 Verificando configuração...\n');

if (fs.existsSync('.env')) {
  printResult('.env', 'success', 'Arquivo encontrado');
  
  const envContent = fs.readFileSync('.env', 'utf8');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'VITE_APP_TITLE',
  ];
  
  for (const varName of requiredVars) {
    if (envContent.includes(varName)) {
      printResult(`  ${varName}`, 'success', 'Configurado');
    } else {
      printResult(`  ${varName}`, 'error', 'Não configurado');
    }
  }
} else {
  printResult('.env', 'error', 'Arquivo não encontrado');
}

// 5. Verificar banco de dados
console.log('\n🗄️  Verificando banco de dados...\n');

if (process.env.DATABASE_URL) {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    printResult('Conexão', 'success', 'Conectado ao banco de dados');
    
    // Verificar tabelas
    const [tables] = await connection.execute('SHOW TABLES');
    
    if (tables.length > 0) {
      printResult('Tabelas', 'success', `${tables.length} tabelas encontradas`);
      
      // Verificar tabelas essenciais
      const tableNames = tables.map(t => Object.values(t)[0]);
      const essentialTables = [
        'system_users',
        'modules',
        'user_module_permissions',
        'companies',
        'cost_centers',
        'clients',
        'suppliers',
      ];
      
      for (const table of essentialTables) {
        if (tableNames.includes(table)) {
          printResult(`  ${table}`, 'success', 'Existe');
        } else {
          printResult(`  ${table}`, 'error', 'Não encontrada');
        }
      }
      
      // Verificar dados iniciais
      const [users] = await connection.execute('SELECT COUNT(*) as count FROM system_users');
      if (users[0].count > 0) {
        printResult('Usuários', 'success', `${users[0].count} usuário(s) cadastrado(s)`);
      } else {
        printResult('Usuários', 'warning', 'Nenhum usuário cadastrado (execute o seed)');
      }
      
      const [modules] = await connection.execute('SELECT COUNT(*) as count FROM modules');
      if (modules[0].count > 0) {
        printResult('Módulos', 'success', `${modules[0].count} módulo(s) cadastrado(s)`);
      } else {
        printResult('Módulos', 'warning', 'Nenhum módulo cadastrado (execute o seed)');
      }
      
    } else {
      printResult('Tabelas', 'error', 'Nenhuma tabela encontrada (execute pnpm db:push)');
    }
    
    await connection.end();
    
  } catch (error) {
    printResult('Banco de dados', 'error', error.message);
  }
} else {
  printResult('DATABASE_URL', 'error', 'Variável de ambiente não definida');
}

// 6. Verificar node_modules
console.log('\n📚 Verificando dependências instaladas...\n');

if (fs.existsSync('node_modules')) {
  printResult('node_modules', 'success', 'Dependências instaladas');
} else {
  printResult('node_modules', 'error', 'Dependências não instaladas (execute pnpm install)');
}

// 7. Resumo final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMO DA VERIFICAÇÃO\n');

if (errors === 0 && warnings === 0) {
  console.log('✅ Sistema instalado corretamente!');
  console.log('   Tudo está funcionando perfeitamente.\n');
  console.log('🚀 Próximos passos:');
  console.log('   1. Execute: pnpm dev');
  console.log('   2. Acesse: http://localhost:3000');
  console.log('   3. Faça login com admin@bpoek.com / admin123\n');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} erro(s) encontrado(s)`);
    console.log('   Corrija os erros antes de continuar.\n');
  }
  
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} aviso(s) encontrado(s)`);
    console.log('   O sistema pode funcionar, mas verifique os avisos.\n');
  }
  
  console.log('📖 Consulte o GUIA_INSTALACAO.md para mais detalhes.\n');
}

console.log('='.repeat(60) + '\n');

// Exit code
process.exit(errors > 0 ? 1 : 0);
