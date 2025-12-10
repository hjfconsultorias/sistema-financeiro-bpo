import XLSX from 'xlsx';
import { getDb } from './server/db';
import { companies, events } from './database/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

interface ExcelRow {
  EMPRESA: string;
  EVENTO: string;
  ANO: number;
  SHOPPING: string;
  UF: string;
  STATUS: string;
  REDE?: string;
  CLASSIFICACAO?: string;
  ALUGUEL?: number;
  OBSERVACOES?: string;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; empresa: string; evento: string; error: string }>;
}

async function importAgendaFromExcel(filePath: string): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    errors: []
  };

  console.log('📂 Lendo arquivo Excel...');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Total de registros no Excel: ${data.length}`);

  // Buscar todas as empresas e eventos de uma vez para otimizar
  console.log('🔍 Carregando empresas e eventos do banco...');
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  
  const allCompanies = await db.select().from(companies);
  const allEvents = await db.select().from(events);

  console.log(`✅ ${allCompanies.length} empresas encontradas`);
  console.log(`✅ ${allEvents.length} eventos encontrados`);

  // Criar mapas para busca rápida
  const companyMap = new Map<string, string>();
  allCompanies.forEach(company => {
    if (company.tradeName) {
      // Normalizar: remover espaços extras e converter para maiúsculas
      const normalizedName = company.tradeName.trim().toUpperCase().replace(/\s+/g, '');
      companyMap.set(normalizedName, company.id.toString());
      console.log(`  📌 Empresa mapeada: "${company.tradeName}" -> "${normalizedName}" (ID: ${company.id})`);
    }
  });

  const eventMap = new Map<string, string>();
  allEvents.forEach(event => {
    const normalizedName = event.name.trim().toUpperCase();
    eventMap.set(normalizedName, event.id.toString());
    console.log(`  📌 Evento mapeado: "${event.name}" -> "${normalizedName}" (ID: ${event.id})`);
  });

  console.log('\n🚀 Iniciando importação...\n');

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 porque Excel começa em 1 e tem header

    try {
      // Validar campos obrigatórios
      if (!row.EMPRESA || !row.EVENTO || !row.ANO) {
        result.errors.push({
          row: rowNumber,
          empresa: row.EMPRESA || 'N/A',
          evento: row.EVENTO || 'N/A',
          error: 'Campos obrigatórios faltando (EMPRESA, EVENTO ou ANO)'
        });
        continue;
      }

      // Normalizar nome da empresa
      const normalizedCompanyName = row.EMPRESA.trim().toUpperCase().replace(/\s+/g, '');
      const companyId = companyMap.get(normalizedCompanyName);

      if (!companyId) {
        result.errors.push({
          row: rowNumber,
          empresa: row.EMPRESA,
          evento: row.EVENTO,
          error: `Empresa não encontrada: "${row.EMPRESA}" (normalizado: "${normalizedCompanyName}")`
        });
        console.log(`❌ Linha ${rowNumber}: Empresa "${row.EMPRESA}" não encontrada`);
        continue;
      }

      // Normalizar nome do evento
      const normalizedEventName = row.EVENTO.trim().toUpperCase();
      const eventId = eventMap.get(normalizedEventName);

      if (!eventId) {
        result.errors.push({
          row: rowNumber,
          empresa: row.EMPRESA,
          evento: row.EVENTO,
          error: `Evento não encontrado: "${row.EVENTO}" (normalizado: "${normalizedEventName}")`
        });
        console.log(`❌ Linha ${rowNumber}: Evento "${row.EVENTO}" não encontrado`);
        continue;
      }

      // Gerar ID único
      const agendaId = uuidv4();

      // Verificar se já existe (usando SQL direto)
      const existingCheck = await db.execute({
        sql: `SELECT id FROM agenda WHERE company_id = ? AND event_id = ? AND year = ?`,
        args: [companyId, eventId, row.ANO]
      });

      if (existingCheck.rows && existingCheck.rows.length > 0) {
        result.errors.push({
          row: rowNumber,
          empresa: row.EMPRESA,
          evento: row.EVENTO,
          error: 'Registro já existe na agenda'
        });
        console.log(`⚠️ Linha ${rowNumber}: Registro duplicado`);
        continue;
      }

      // Inserir na agenda usando SQL direto
      await db.execute({
        sql: `INSERT INTO agenda 
          (id, company_id, event_id, year, period, status, shopping, state, network, classification, rent, notes, is_active, created_at, updated_at) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        args: [
          agendaId,
          companyId,
          eventId,
          row.ANO,
          'Anual', // period padrão
          row.STATUS || 'PENDENTE',
          row.SHOPPING || null,
          row.UF || null,
          row.REDE || null,
          row.CLASSIFICACAO || null,
          row.ALUGUEL || null,
          row.OBSERVACOES || null,
          true // is_active
        ]
      });

      result.success++;
      console.log(`✅ Linha ${rowNumber}: ${row.EMPRESA} - ${row.EVENTO} (${row.ANO}) importado com sucesso`);

    } catch (error) {
      result.errors.push({
        row: rowNumber,
        empresa: row.EMPRESA,
        evento: row.EVENTO,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      console.log(`❌ Linha ${rowNumber}: Erro - ${error}`);
    }
  }

  return result;
}

// Executar importação
const excelFilePath = '/home/ubuntu/upload/modelo_importacao_agenda09-12-25.xlsx';

console.log('═══════════════════════════════════════════════════════');
console.log('🚀 IMPORTAÇÃO DIRETA AGENDA - SISTEMA FINANCEIRO EK-BPO');
console.log('═══════════════════════════════════════════════════════\n');

importAgendaFromExcel(excelFilePath)
  .then(result => {
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📊 RELATÓRIO FINAL DA IMPORTAÇÃO');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Sucesso: ${result.success} registros`);
    console.log(`❌ Erros: ${result.errors.length} registros`);
    
    if (result.errors.length > 0) {
      console.log('\n📋 DETALHES DOS ERROS:\n');
      result.errors.forEach(err => {
        console.log(`Linha ${err.row}: ${err.empresa} - ${err.evento}`);
        console.log(`  ➜ ${err.error}\n`);
      });
    }
    
    console.log('═══════════════════════════════════════════════════════\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  });
