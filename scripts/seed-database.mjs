#!/usr/bin/env node

/**
 * Script de Seed do Banco de Dados - BPO EK v1.0
 * 
 * Este script popula o banco de dados com dados iniciais necessários
 * para o funcionamento do sistema.
 * 
 * Uso: node seed-database.mjs
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

console.log('🌱 Iniciando seed do banco de dados...\n');

// Verificar se DATABASE_URL está definida
if (!process.env.DATABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não definida!');
  console.error('   Configure a variável de ambiente DATABASE_URL no arquivo .env');
  process.exit(1);
}

// Conectar ao banco de dados
let connection;
try {
  connection = await mysql.createConnection(process.env.DATABASE_URL);
  console.log('✅ Conectado ao banco de dados\n');
} catch (error) {
  console.error('❌ Erro ao conectar ao banco de dados:', error.message);
  process.exit(1);
}

try {
  // 1. Criar usuário administrador
  console.log('👤 Criando usuário administrador...');
  
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  await connection.execute(`
    INSERT INTO system_users (email, password_hash, name, profile, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      name = VALUES(name),
      profile = VALUES(profile),
      updated_at = NOW()
  `, ['admin@bpoek.com', adminPasswordHash, 'Administrador Teste', 'admin']);
  
  console.log('   ✅ Usuário admin@bpoek.com criado\n');
  
  // 2. Criar usuário Carlos (apenas visualização)
  console.log('👤 Criando usuário Carlos (teste de permissões)...');
  
  const carlosPasswordHash = await bcrypt.hash('123456', 10);
  
  await connection.execute(`
    INSERT INTO system_users (email, password_hash, name, profile, created_at, updated_at)
    VALUES (?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      password_hash = VALUES(password_hash),
      name = VALUES(name),
      profile = VALUES(profile),
      updated_at = NOW()
  `, ['chcfonseca@gmail.com', carlosPasswordHash, 'Carlos Fonseca', 'user']);
  
  console.log('   ✅ Usuário chcfonseca@gmail.com criado\n');
  
  // 3. Criar módulos do sistema
  console.log('📦 Criando módulos do sistema...');
  
  const modules = [
    { name: 'FINANCEIRO', description: 'Gestão financeira completa', icon: 'receipt', isActive: 1, displayOrder: 1 },
    { name: 'AGENDA', description: 'Gestão de eventos e logística', icon: 'calendar', isActive: 0, displayOrder: 2 },
    { name: 'IA - SOPHIA ANÁLISE PERSONALIZADA', description: 'Assistente financeira com IA', icon: 'sparkles', isActive: 0, displayOrder: 3 },
    { name: 'RH (Recursos Humanos)', description: 'Gestão de recursos humanos', icon: 'users', isActive: 0, displayOrder: 4 },
    { name: 'DEPARTAMENTO PESSOAL', description: 'Gestão de folha de pagamento', icon: 'user-check', isActive: 0, displayOrder: 5 },
    { name: 'PROCESSOS', description: 'Gestão de processos internos', icon: 'workflow', isActive: 0, displayOrder: 6 },
    { name: 'OPERAÇÕES', description: 'Gestão de operações', icon: 'settings', isActive: 0, displayOrder: 7 },
    { name: 'COMPRAS', description: 'Gestão de compras e suprimentos', icon: 'shopping-cart', isActive: 0, displayOrder: 8 },
  ];
  
  for (const module of modules) {
    await connection.execute(`
      INSERT INTO modules (name, description, icon, is_active, display_order, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        icon = VALUES(icon),
        is_active = VALUES(is_active),
        display_order = VALUES(display_order)
    `, [module.name, module.description, module.icon, module.isActive, module.displayOrder]);
    
    console.log(`   ✅ Módulo "${module.name}" criado`);
  }
  
  console.log('\n');
  
  // 4. Criar permissões para Carlos (apenas visualização em todos os módulos)
  console.log('🔐 Configurando permissões para Carlos...');
  
  // Buscar ID do Carlos
  const [carlosRows] = await connection.execute(
    'SELECT id FROM system_users WHERE email = ?',
    ['chcfonseca@gmail.com']
  );
  
  if (carlosRows.length > 0) {
    const carlosId = carlosRows[0].id;
    
    // Buscar todos os módulos
    const [moduleRows] = await connection.execute('SELECT id FROM modules');
    
    for (const module of moduleRows) {
      await connection.execute(`
        INSERT INTO user_module_permissions 
        (user_id, module_id, can_view, can_create, can_edit, can_delete, can_approve, can_export, created_at)
        VALUES (?, ?, 1, 0, 0, 0, 0, 0, NOW())
        ON DUPLICATE KEY UPDATE
          can_view = 1,
          can_create = 0,
          can_edit = 0,
          can_delete = 0,
          can_approve = 0,
          can_export = 0
      `, [carlosId, module.id]);
    }
    
    console.log(`   ✅ Permissões configuradas (apenas visualização em ${moduleRows.length} módulos)\n`);
  }
  
  // 5. Resumo
  console.log('📊 Resumo do seed:\n');
  
  const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM system_users');
  console.log(`   👥 Usuários: ${userCount[0].count}`);
  
  const [moduleCount] = await connection.execute('SELECT COUNT(*) as count FROM modules');
  console.log(`   📦 Módulos: ${moduleCount[0].count}`);
  
  const [permissionCount] = await connection.execute('SELECT COUNT(*) as count FROM user_module_permissions');
  console.log(`   🔐 Permissões: ${permissionCount[0].count}`);
  
  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📝 Credenciais de acesso:\n');
  console.log('   Administrador:');
  console.log('   - Email: admin@bpoek.com');
  console.log('   - Senha: admin123\n');
  console.log('   Usuário (apenas visualização):');
  console.log('   - Email: chcfonseca@gmail.com');
  console.log('   - Senha: 123456\n');
  console.log('⚠️  IMPORTANTE: Altere essas senhas em produção!\n');
  
} catch (error) {
  console.error('\n❌ Erro durante o seed:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  if (connection) {
    await connection.end();
  }
}
