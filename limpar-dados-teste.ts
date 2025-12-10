import { getDb } from './server/db';
import { dailyRevenues, accountsPayable } from './database/schema';

async function limparDadosTeste() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🧹 LIMPEZA DE DADOS DE TESTE - SISTEMA FINANCEIRO EK-BPO');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    console.log('🔍 Conectado ao banco de dados...\n');

    // Contar registros antes da limpeza
    console.log('📊 CONTANDO REGISTROS ANTES DA LIMPEZA:\n');
    
    const dailyRevenuesCount = await db.select().from(dailyRevenues);
    console.log(`  💰 Receitas Diárias: ${dailyRevenuesCount.length} registros`);
    
    const accountsPayableCount = await db.select().from(accountsPayable);
    console.log(`  💳 Contas a Pagar: ${accountsPayableCount.length} registros\n`);

    // Confirmar limpeza
    console.log('⚠️  ATENÇÃO: Os seguintes dados serão DELETADOS:\n');
    console.log(`  ❌ ${dailyRevenuesCount.length} Receitas Diárias`);
    console.log(`  ❌ ${accountsPayableCount.length} Contas a Pagar\n`);

    // Limpar Receitas Diárias
    console.log('🗑️  Deletando Receitas Diárias...');
    await db.delete(dailyRevenues);
    console.log('✅ Receitas Diárias deletadas!\n');

    // Limpar Contas a Pagar
    console.log('🗑️  Deletando Contas a Pagar...');
    await db.delete(accountsPayable);
    console.log('✅ Contas a Pagar deletadas!\n');

    // Verificar limpeza
    console.log('🔍 VERIFICANDO LIMPEZA:\n');
    
    const dailyRevenuesAfter = await db.select().from(dailyRevenues);
    console.log(`  💰 Receitas Diárias: ${dailyRevenuesAfter.length} registros`);
    
    const accountsPayableAfter = await db.select().from(accountsPayable);
    console.log(`  💳 Contas a Pagar: ${accountsPayableAfter.length} registros\n`);

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ LIMPEZA CONCLUÍDA COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n📋 RESUMO:\n');
    console.log(`  ✅ ${dailyRevenuesCount.length} Receitas Diárias removidas`);
    console.log(`  ✅ ${accountsPayableCount.length} Contas a Pagar removidas`);
    console.log('\n🎯 Sistema pronto para uso em produção!\n');
    console.log('═══════════════════════════════════════════════════════\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO DURANTE A LIMPEZA:', error);
    process.exit(1);
  }
}

// Executar limpeza
limparDadosTeste();
