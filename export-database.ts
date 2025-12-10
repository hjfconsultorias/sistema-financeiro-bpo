import { getDb } from './server/db';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para exportar dados do banco atual para SQL
 * Será executado via endpoint na API
 */

async function exportDatabase() {
  console.log('🔄 Iniciando export do banco de dados...');
  
  const db = getDb();
  const exportPath = path.join(__dirname, 'database_export.sql');
  
  try {
    // Buscar lista de todas as tabelas
    const [tables] = await db.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
    `) as any;
    
    console.log(`📊 Encontradas ${tables.length} tabelas`);
    
    let sqlDump = '';
    
    // Header do dump
    sqlDump += `-- Database Export\n`;
    sqlDump += `-- Generated: ${new Date().toISOString()}\n`;
    sqlDump += `-- Database: sistema_financeiro_ek\n\n`;
    
    sqlDump += `SET FOREIGN_KEY_CHECKS=0;\n\n`;
    
    // Para cada tabela, exportar estrutura e dados
    for (const tableRow of tables) {
      const tableName = tableRow.table_name || tableRow.TABLE_NAME;
      
      console.log(`📋 Exportando tabela: ${tableName}`);
      
      // Obter CREATE TABLE
      const [createTable] = await db.execute(`SHOW CREATE TABLE \`${tableName}\``) as any;
      const createStatement = createTable[0]['Create Table'] || createTable[0]['CREATE TABLE'];
      
      sqlDump += `-- Table: ${tableName}\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += `${createStatement};\n\n`;
      
      // Obter dados
      const [rows] = await db.execute(`SELECT * FROM \`${tableName}\``) as any;
      
      if (rows.length > 0) {
        console.log(`  → ${rows.length} registros`);
        
        // Obter nomes das colunas
        const columns = Object.keys(rows[0]);
        
        sqlDump += `-- Data for table: ${tableName}\n`;
        
        for (const row of rows) {
          const values = columns.map(col => {
            const value = row[col];
            
            if (value === null) return 'NULL';
            if (typeof value === 'number') return value;
            if (typeof value === 'boolean') return value ? 1 : 0;
            if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            
            // String: escapar aspas simples
            return `'${String(value).replace(/'/g, "''")}'`;
          });
          
          sqlDump += `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${values.join(', ')});\n`;
        }
        
        sqlDump += `\n`;
      } else {
        console.log(`  → 0 registros`);
      }
    }
    
    sqlDump += `SET FOREIGN_KEY_CHECKS=1;\n`;
    
    // Salvar arquivo
    fs.writeFileSync(exportPath, sqlDump, 'utf8');
    
    console.log(`✅ Export concluído: ${exportPath}`);
    console.log(`📦 Tamanho: ${(fs.statSync(exportPath).size / 1024).toFixed(2)} KB`);
    
    return {
      success: true,
      path: exportPath,
      tables: tables.length,
      size: fs.statSync(exportPath).size
    };
    
  } catch (error) {
    console.error('❌ Erro ao exportar banco:', error);
    throw error;
  }
}

// Se executado diretamente
if (require.main === module) {
  exportDatabase()
    .then(() => {
      console.log('✅ Export finalizado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

export { exportDatabase };
