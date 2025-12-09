import XLSX from 'xlsx';
import mysql from 'mysql2/promise';

const filePath = '/home/ubuntu/upload/contas-a-pagar-COMPLETA(1).xlsx';
const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('=== IMPORTAÇÃO LIMPA DE CONTAS A PAGAR ===\n');

// Buscar dados necessários
const [events] = await connection.query('SELECT id, name FROM events WHERE active = 1');
const [categories] = await connection.query('SELECT id, name FROM categories WHERE type = "expense"');
const [subcategories] = await connection.query('SELECT id, name, categoryId FROM subcategories');

const eventMap = {};
events.forEach(e => {
  const normalized = e.name.toLowerCase().trim().replace(/\s+/g, ' ');
  eventMap[normalized] = e.id;
});

const categoryMap = {};
categories.forEach(c => {
  const normalized = c.name.toLowerCase().trim();
  categoryMap[normalized] = c.id;
});

const subcategoryMap = {};
subcategories.forEach(sc => {
  const normalized = sc.name.toLowerCase().trim();
  subcategoryMap[normalized] = { id: sc.id, categoryId: sc.categoryId };
});

// Ler planilha
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`Total de linhas na planilha: ${data.length}`);

const rows = data.slice(1).filter(row => row && row.length > 0);
let imported = 0;
let errors = [];
const missingSubcategories = new Set();

const [adminUsers] = await connection.query('SELECT id FROM system_users WHERE profile = "administrador" LIMIT 1');
const createdBy = adminUsers[0]?.id || 1;

for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  const [vencimentoSerial, eventoNome, fornecedorNome, categoriaNome, subcategoriaNome, valor, descricao, statusStr, observacoes] = row;
  
  if (!vencimentoSerial || !eventoNome) continue;
  
  // Converter data
  const excelEpoch = new Date(1899, 11, 30);
  const date = new Date(excelEpoch.getTime() + vencimentoSerial * 24 * 60 * 60 * 1000);
  const dateStr = date.toISOString().split('T')[0];
  
  // Buscar evento
  const eventoNorm = eventoNome.toLowerCase().trim().replace(/\s+/g, ' ');
  let eventId = eventMap[eventoNorm];
  
  if (!eventId) {
    const partialMatch = Object.keys(eventMap).find(key => 
      key.includes(eventoNorm) || eventoNorm.includes(key)
    );
    if (partialMatch) eventId = eventMap[partialMatch];
  }
  
  if (!eventId) {
    errors.push({ linha: i + 2, erro: `Evento não encontrado: ${eventoNome}` });
    continue;
  }
  
  // Buscar categoria
  const categoriaNorm = categoriaNome?.toLowerCase().trim();
  const categoryId = categoryMap[categoriaNorm];
  
  if (!categoryId) {
    errors.push({ linha: i + 2, erro: `Categoria não encontrada: ${categoriaNome}` });
    continue;
  }
  
  // Buscar subcategoria
  const subcategoriaNorm = subcategoriaNome?.toLowerCase().trim();
  const subcategoryData = subcategoryMap[subcategoriaNorm];
  const subcategoryId = subcategoryData?.id;
  
  if (!subcategoryId) {
    if (subcategoriaNome) {
      missingSubcategories.add(subcategoriaNome);
    }
    errors.push({ linha: i + 2, erro: `Subcategoria não encontrada: ${subcategoriaNome}` });
    continue;
  }
  
  // Converter valor para centavos
  const amount = Math.round((valor || 0) * 100);
  
  // Status
  const status = statusStr === 'Pago' ? 'paid' : 'pending';
  
  // Inserir registro
  try {
    await connection.query(
      `INSERT INTO accounts_payable 
       (dueDate, eventId, supplierId, categoryId, subcategoryId, amount, description, status, notes, createdBy) 
       VALUES (?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)`,
      [dateStr, eventId, categoryId, subcategoryId, amount, descricao || '', status, observacoes || '', createdBy]
    );
    imported++;
  } catch (error) {
    errors.push({ linha: i + 2, erro: error.message });
  }
}

console.log(`\n=== RESULTADO ===`);
console.log(`✅ Registros importados: ${imported}`);
console.log(`❌ Erros: ${errors.length}\n`);

if (missingSubcategories.size > 0) {
  console.log('=== SUBCATEGORIAS FALTANTES ===');
  Array.from(missingSubcategories).forEach(subcat => {
    console.log(`- "${subcat}"`);
  });
  console.log('');
}

if (errors.length > 0 && errors.length <= 20) {
  console.log('=== PRIMEIROS ERROS ===');
  errors.slice(0, 20).forEach(err => {
    console.log(`Linha ${err.linha}: ${err.erro}`);
  });
}

const [result] = await connection.query('SELECT COUNT(*) as total FROM accounts_payable');
console.log(`\n=== TOTAL FINAL ===`);
console.log(`Total de contas a pagar no banco: ${result[0].total}`);

await connection.end();
