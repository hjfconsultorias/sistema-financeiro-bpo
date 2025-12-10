import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import * as dbAgenda from "./db_agenda";
import { getAvailableCompanies } from "./db_agenda_list_companies";
import { TRPCError } from "@trpc/server";
import * as auth from "./authorization";
import * as captcha from "./captcha";
import bcrypt from "bcryptjs";
import * as jwt from "./jwt";
import * as bruteForce from "./bruteForce";
import { notifyOwner } from "./_core/notification";

// Schemas de validação
const companySchema = z.object({
  name: z.string().min(1, "Razão Social é obrigatória"),
  tradeName: z.string().optional(),
  cnpj: z.string().min(14, "CNPJ é obrigatório"),
  stateRegistration: z.string().optional(),
  municipalRegistration: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().max(2).optional(),
  zipCode: z.string().optional(),
  active: z.number().optional(),
});

const eventSchema = z.object({
  companyId: z.number().int().positive().optional().default(1), // GP1 como padrão
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  active: z.number().optional(),
});

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  active: z.number().optional(),
});

const supplierSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpjCpf: z.string().min(1, "CNPJ/CPF é obrigatório"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  pix: z.string().optional(),
  notes: z.string().max(200, "Observação limitada a 200 caracteres").optional(),
  active: z.number().optional(),
});

const accountPayableSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().int().positive("Valor deve ser positivo"),
  dueDate: z.date(),
  paymentDate: z.date().optional(),
  status: z.enum(["pending", "paid", "overdue"]).optional(),
  eventId: z.number().int().positive(),
  supplierId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

const accountReceivableSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  amount: z.number().int().positive("Valor deve ser positivo"),
  dueDate: z.date(),
  receivedDate: z.date().optional(),
  status: z.enum(["pending", "received", "overdue"]).optional(),
  eventId: z.number().int().positive(),
  clientId: z.number().int().positive().optional(),
  categoryId: z.number().int().positive().optional(),
  subcategoryId: z.number().int().positive().optional(),
  notes: z.string().optional(),
});

const revenueCategorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  active: z.number().optional(),
});

const systemUserSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(), // Opcional para update
  profile: z.enum([
    "administrador",
    "gerente_geral",
    "gerente_regional",
    "lider_financeiro",
    "lider_rh",
    "lider_processos",
    "lider_operacional",
    "lider_evento",
    "sublider_evento",
    "caixa_entrada",
    "caixa_saida",
    "monitor"
  ]),
  active: z.number().optional(),
  companyIds: z.array(z.number()).optional(), // IDs das empresas vinculadas
  eventIds: z.array(z.number()).optional(), // IDs dos eventos vinculados
});

const dailyRevenueSchema = z.object({
  date: z.string().transform(str => new Date(str)),
  eventId: z.number().int().positive("Evento é obrigatório"),
  revenueCategoryId: z.number().int().positive("Categoria é obrigatória"),
  cashAmount: z.number().int().min(0, "Valor não pode ser negativo"),
  debitCardAmount: z.number().int().min(0, "Valor não pode ser negativo"),
  creditCardAmount: z.number().int().min(0, "Valor não pode ser negativo"),
  pixAmount: z.number().int().min(0, "Valor não pode ser negativo"),
  notes: z.string().optional(),
});

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["expense", "revenue"], { message: "Tipo é obrigatório" }),
  active: z.number().optional(),
});

const subcategorySchema = z.object({
  categoryId: z.number().int().positive("Categoria é obrigatória"),
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  active: z.number().optional(),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),

    // Gera um novo CAPTCHA
    generateCaptcha: publicProcedure.mutation(() => {
      const code = captcha.generateCaptchaCode();
      const svg = captcha.generateCaptchaSvg(code);
      const sessionId = `captcha_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      captcha.storeCaptcha(sessionId, code);
      return {
        sessionId,
        svg,
      };
    }),

    // Login customizado com email/senha e CAPTCHA
    customLogin: publicProcedure
      .input(
        z.object({
          email: z.string().email("Email inválido"),
          password: z.string().min(1, "Senha é obrigatória"),
          captchaCode: z.string().min(1, "Código CAPTCHA é obrigatório"),
          captchaSessionId: z.string().min(1, "Sessão CAPTCHA inválida"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // 1. Verificar bloqueio por brute force
        const identifier = `${ctx.req.ip || "unknown"}_${input.email}`;
        const blockStatus = bruteForce.isBlocked(identifier);
        if (blockStatus.blocked) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Muitas tentativas de login. Tente novamente em ${blockStatus.remainingTime} segundos.`,
          });
        }

        // 2. Valida CAPTCHA
        const storedCode = captcha.retrieveCaptcha(input.captchaSessionId);
        if (!storedCode || !captcha.validateCaptcha(input.captchaCode, storedCode)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Código CAPTCHA inválido ou expirado",
          });
        }

        // 3. Busca usuário por email
        const user = await db.getSystemUserByEmail(input.email);
        if (!user) {
          // Registrar tentativa falhada
          const result = bruteForce.recordFailedAttempt(identifier);
          if (result.blocked) {
            // Notificar administrador
            await notifyOwner({
              title: "🚨 Bloqueio de Login por Brute Force",
              content: `O IP/Email ${identifier} foi bloqueado após ${bruteForce.getAttemptStats().totalAttempts} tentativas de login falhadas.`,
            });
          }
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: result.blocked
              ? `Muitas tentativas. Bloqueado por 5 minutos.`
              : `Email ou senha incorretos. ${result.remainingAttempts} tentativas restantes.`,
          });
        }

        // 4. Verifica se usuário está ativo
        if (user.active !== 1) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Usuário inativo. Entre em contato com o administrador.",
          });
        }

        // 5. Valida senha
        const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
        if (!isPasswordValid) {
          // Registrar tentativa falhada
          const result = bruteForce.recordFailedAttempt(identifier);
          if (result.blocked) {
            // Notificar administrador
            await notifyOwner({
              title: "🚨 Bloqueio de Login por Brute Force",
              content: `O usuário ${input.email} (IP: ${ctx.req.ip || "unknown"}) foi bloqueado após 5 tentativas de login falhadas.`,
            });
          }
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: result.blocked
              ? `Muitas tentativas. Bloqueado por 5 minutos.`
              : `Email ou senha incorretos. ${result.remainingAttempts} tentativas restantes.`,
          });
        }

        // 6. Login bem-sucedido: resetar tentativas e gerar JWT
        bruteForce.resetAttempts(identifier);
        const token = jwt.generateToken({
          userId: user.id,
          email: user.email,
          profile: user.profile,
          name: user.name,
        });

        return {
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            profile: user.profile,
          },
        };
      }),
  }),

  // ========== Empresas (CNPJs) ==========
  companies: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const allCompanies = await db.getAllCompanies();
      return await auth.filterCompaniesByPermission(allCompanies, ctx.user.id, ctx.user.profile as auth.UserRole);
    }),

    listActive: protectedProcedure.query(async ({ ctx }) => {
      const activeCompanies = await db.getActiveCompanies();
      return await auth.filterCompaniesByPermission(activeCompanies, ctx.user.id, ctx.user.profile as auth.UserRole);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const company = await db.getCompanyById(input.id);
        if (!company) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Empresa não encontrada" });
        }
        return company;
      }),

    create: protectedProcedure.input(companySchema).mutation(async ({ input, ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar empresas" });
      }
      const id = await db.createCompany(input);
      return { id, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: companySchema.partial() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem editar empresas" });
        }
        await db.updateCompany(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem excluir empresas" });
      }
      await db.deleteCompany(input.id);
      return { success: true };
    }),

    exportCSV: protectedProcedure.query(async () => {
      return await db.getAllCompanies();
    }),

    importCSV: protectedProcedure
      .input(
        z.object({
          data: z.array(
            z.object({
              name: z.string(),
              tradeName: z.string().optional(),
              cnpj: z.string(),
              stateRegistration: z.string().optional(),
              municipalRegistration: z.string().optional(),
              email: z.string().optional(),
              phone: z.string().optional(),
              address: z.string().optional(),
              city: z.string().optional(),
              state: z.string().optional(),
              zipCode: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results = { success: 0, errors: [] as string[] };
        for (let i = 0; i < input.data.length; i++) {
          try {
            await db.createCompany(input.data[i]);
            results.success++;
          } catch (error: any) {
            results.errors.push(`Linha ${i + 1}: ${error.message}`);
          }
        }
        return results;
      }),
  }),

  // ========== Centros de Custo ==========
  events: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const allEvents = await db.getAllEvents();
      return await auth.filterEventsByPermission(allEvents, ctx.user.id, ctx.user.profile as auth.UserRole);
    }),

    listActive: protectedProcedure.query(async ({ ctx }) => {
      const activeEvents = await db.getActiveEvents();
      return await auth.filterEventsByPermission(activeEvents, ctx.user.id, ctx.user.profile as auth.UserRole);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const event = await db.getEventById(input.id);
        if (!event) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Evento não encontrado" });
        }
        return event;
      }),

    create: protectedProcedure.input(eventSchema).mutation(async ({ input, ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar centros de custo" });
      }
      const id = await db.createEvent(input);
      return { id, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: eventSchema.partial() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem editar centros de custo" });
        }
        await db.updateEvent(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem excluir centros de custo" });
      }
      await db.deleteEvent(input.id);
      return { success: true };
    }),

    importCSV: protectedProcedure
      .input(
        z.object({
          data: z.array(
            z.object({
              name: z.string(),
              description: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem importar centros de custo" });
        }
        const results = { success: 0, errors: [] as string[] };
        for (let i = 0; i < input.data.length; i++) {
          try {
            await db.createEvent({
              name: input.data[i].name,
              description: input.data[i].description || null,
              companyId: 1, // GP1 como padrão
            });
            results.success++;
          } catch (error: any) {
            results.errors.push(`Linha ${i + 1}: ${error.message}`);
          }
        }
        return results;
      }),

    exportCSV: protectedProcedure.query(async () => {
      return await db.getAllEvents();
    }),
  }),

  // ========== Clientes ==========
  clients: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllClients();
    }),

    listActive: protectedProcedure.query(async () => {
      return await db.getActiveClients();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const client = await db.getClientById(input.id);
        if (!client) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Cliente não encontrado" });
        }
        return client;
      }),

    create: protectedProcedure.input(clientSchema).mutation(async ({ input }) => {
      const id = await db.createClient(input);
      return { id, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: clientSchema.partial() }))
      .mutation(async ({ input }) => {
        await db.updateClient(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteClient(input.id);
      return { success: true };
    }),

    importCSV: protectedProcedure
      .input(
        z.object({
          data: z.array(
            z.object({
              name: z.string(),
              cnpj: z.string().optional(),
              email: z.string().optional(),
              phone: z.string().optional(),
              address: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results = { success: 0, errors: [] as string[] };
        for (let i = 0; i < input.data.length; i++) {
          try {
            await db.createClient(input.data[i]);
            results.success++;
          } catch (error: any) {
            results.errors.push(`Linha ${i + 1}: ${error.message}`);
          }
        }
        return results;
      }),

    exportCSV: protectedProcedure.query(async () => {
      return await db.getAllClients();
    }),
  }),

  // ========== Fornecedores ==========
  suppliers: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSuppliers();
    }),

    listActive: protectedProcedure.query(async () => {
      return await db.getActiveSuppliers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const supplier = await db.getSupplierById(input.id);
        if (!supplier) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Fornecedor não encontrado" });
        }
        return supplier;
      }),

    create: protectedProcedure.input(supplierSchema).mutation(async ({ input }) => {
      const id = await db.createSupplier(input);
      return { id, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: supplierSchema.partial() }))
      .mutation(async ({ input }) => {
        await db.updateSupplier(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteSupplier(input.id);
      return { success: true };
    }),

    importCSV: protectedProcedure
      .input(
        z.object({
          data: z.array(
            z.object({
              name: z.string(),
              cnpjCpf: z.string().optional(),
              email: z.string().optional(),
              phone: z.string().optional(),
              address: z.string().optional(),
              pix: z.string().optional(),
              notes: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results = { success: 0, errors: [] as string[] };
        for (let i = 0; i < input.data.length; i++) {
          try {
            await db.createSupplier({
              ...input.data[i],
              cnpjCpf: input.data[i].cnpjCpf || "",
            });
            results.success++;
          } catch (error: any) {
            results.errors.push(`Linha ${i + 1}: ${error.message}`);
          }
        }
        return results;
      }),

    exportCSV: protectedProcedure.query(async () => {
      return await db.getAllSuppliers();
    }),
  }),

  // ========== Contas a Pagar ==========
  accountsPayable: router({
    list: protectedProcedure
      .input(
        z
          .object({
            eventId: z.number().optional(),
            status: z.enum(["pending", "paid", "overdue"]).optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const accounts = await db.getAllAccountsPayable(input);
        return await auth.filterFinancialsByPermission(accounts, ctx.user.id, ctx.user.profile as auth.UserRole);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const account = await db.getAccountPayableById(input.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conta a pagar não encontrada" });
        }
        return account;
      }),

    create: protectedProcedure.input(accountPayableSchema).mutation(async ({ input, ctx }) => {
      const id = await db.createAccountPayable({
        ...input,
        createdBy: ctx.user.id,
      });
      return { id, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: accountPayableSchema.partial() }))
      .mutation(async ({ input }) => {
        await db.updateAccountPayable(input.id, input.data);
        return { success: true };
      }),

    markAsPaid: protectedProcedure
      .input(z.object({ id: z.number(), paymentDate: z.date() }))
      .mutation(async ({ input }) => {
        await db.updateAccountPayable(input.id, {
          status: "paid",
          paymentDate: input.paymentDate,
        });
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteAccountPayable(input.id);
      return { success: true };
    }),

    importCSV: protectedProcedure
      .input(
        z.object({
          data: z.array(
            z.object({
              name: z.string(),
              description: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const results = { success: 0, errors: [] as string[] };
        for (let i = 0; i < input.data.length; i++) {
          try {
            await db.createEvent({ ...input.data[i], companyId: 1 }); // GP1 como padrão
            results.success++;
          } catch (error: any) {
            results.errors.push(`Linha ${i + 1}: ${error.message}`);
          }
        }
        return results;
      }),

    exportCSV: protectedProcedure.query(async () => {
      return await db.getAllEvents();
    }),

    // Exportar Contas a Pagar para Excel
    export: protectedProcedure.query(async ({ ctx }) => {
      const XLSX = await import('xlsx');
      const accounts = await db.getAccountsPayableForExport();
      
      // Preparar dados para exportação
      const data = accounts.map(account => ({
        'Vencimento': new Date(account.dueDate).toLocaleDateString('pt-BR'),
        'Evento': account.eventName || 'N/A',
        'Fornecedor': account.supplierName || 'N/A',
        'Categoria': account.categoryName || 'N/A',
        'Subcategoria': account.subcategoryName || 'N/A',
        'Valor': `R$ ${(account.amount / 100).toFixed(2).replace('.', ',')}`,
        'Descrição': account.description || 'N/A',
        'Status': account.status === 'paid' ? 'Pago' : account.status === 'overdue' ? 'Vencido' : 'Pendente',
        'Observações': account.notes || ''
      }));

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Contas a Pagar');

      // Gerar buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Retornar base64 para download no frontend
      return {
        filename: `contas-a-pagar-${new Date().toISOString().split('T')[0]}.xlsx`,
        data: buffer.toString('base64')
      };
    }),
  }),

  // ========== Contas a Receber ==========
  accountsReceivable: router({
    list: protectedProcedure
      .input(
        z
          .object({
            eventId: z.number().optional(),
            status: z.enum(["pending", "received", "overdue"]).optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const accounts = await db.getAllAccountsReceivable(input);
        return await auth.filterFinancialsByPermission(accounts, ctx.user.id, ctx.user.profile as auth.UserRole);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const account = await db.getAccountReceivableById(input.id);
        if (!account) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Conta a receber não encontrada" });
        }
        return account;
      }),

    create: protectedProcedure.input(accountReceivableSchema).mutation(async ({ input, ctx }) => {
      const id = await db.createAccountReceivable({
        ...input,
        createdBy: ctx.user.id,
      });
      return { id, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: accountReceivableSchema.partial() }))
      .mutation(async ({ input }) => {
        await db.updateAccountReceivable(input.id, input.data);
        return { success: true };
      }),

    markAsReceived: protectedProcedure
      .input(z.object({ id: z.number(), receivedDate: z.date() }))
      .mutation(async ({ input }) => {
        await db.updateAccountReceivable(input.id, {
          status: "received",
          receivedDate: input.receivedDate,
        });
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteAccountReceivable(input.id);
      return { success: true };
    }),

    // Exportar Contas a Receber para Excel
    export: protectedProcedure.query(async ({ ctx }) => {
      const XLSX = await import('xlsx');
      const accounts = await db.getAccountsReceivableForExport();
      
      // Preparar dados para exportação
      const data = accounts.map(account => ({
        'Vencimento': new Date(account.dueDate).toLocaleDateString('pt-BR'),
        'Evento': account.eventName || 'N/A',
        'Cliente': account.clientName || 'N/A',
        'Valor': `R$ ${(account.amount / 100).toFixed(2).replace('.', ',')}`,
        'Descrição': account.description || 'N/A',
        'Status': account.status === 'received' ? 'Recebido' : account.status === 'overdue' ? 'Vencido' : 'Pendente',
        'Observações': account.notes || ''
      }));

      // Criar workbook e worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Contas a Receber');

      // Gerar buffer
      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      
      // Retornar base64 para download no frontend
      return {
        filename: `contas-a-receber-${new Date().toISOString().split('T')[0]}.xlsx`,
        data: buffer.toString('base64')
      };
    }),
  }),

  // ========== Categorias de Receita ==========
  revenueCategories: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllRevenueCategories();
    }),

    listActive: protectedProcedure.query(async () => {
      return await db.getActiveRevenueCategories();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const category = await db.getRevenueCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada" });
        }
        return category;
      }),

    create: protectedProcedure.input(revenueCategorySchema).mutation(async ({ input, ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar categorias" });
      }
      const id = await db.createRevenueCategory(input);
      return { id, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: revenueCategorySchema.partial() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem editar categorias" });
        }
        await db.updateRevenueCategory(input.id, input.data);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem excluir categorias" });
      }
      await db.deleteRevenueCategory(input.id);
      return { success: true };
    }),
  }),

  // ========== Receitas Diárias ==========
  dailyRevenues: router({
    list: protectedProcedure
      .input(
        z
          .object({
            eventId: z.number().optional(),
            revenueCategoryId: z.number().optional(),
            startDate: z.string().optional(),
            endDate: z.string().optional(),
          })
          .optional()
      )
      .query(async ({ ctx, input }) => {
        const revenues = await db.getAllDailyRevenues(input);
        return await auth.filterFinancialsByPermission(revenues, ctx.user.id, ctx.user.profile as auth.UserRole);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const revenue = await db.getDailyRevenueById(input.id);
        if (!revenue) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Receita não encontrada" });
        }
        return revenue;
      }),

    create: protectedProcedure.input(dailyRevenueSchema).mutation(async ({ input, ctx }) => {
      // Calcular total automático
      const totalAmount = input.cashAmount + input.debitCardAmount + input.creditCardAmount + input.pixAmount;
      
      const id = await db.createDailyRevenue({
        ...input,
        totalAmount,
        createdBy: ctx.user.id,
      });
      return { id, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: dailyRevenueSchema.partial() }))
      .mutation(async ({ input }) => {
        // Recalcular total se algum valor de pagamento foi alterado
        const updates: any = { ...input.data };
        if (
          input.data.cashAmount !== undefined ||
          input.data.debitCardAmount !== undefined ||
          input.data.creditCardAmount !== undefined ||
          input.data.pixAmount !== undefined
        ) {
          const current = await db.getDailyRevenueById(input.id);
          if (current) {
            updates.totalAmount =
              (input.data.cashAmount ?? current.cashAmount) +
              (input.data.debitCardAmount ?? current.debitCardAmount) +
              (input.data.creditCardAmount ?? current.creditCardAmount) +
              (input.data.pixAmount ?? current.pixAmount);
          }
        }
        
        await db.updateDailyRevenue(input.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await db.deleteDailyRevenue(input.id);
      return { success: true };
    }),

    importFromCSV: protectedProcedure
      .input(
        z.object({
          rows: z.array(
            z.object({
              date: z.string(),
              eventName: z.string(),
              categoryName: z.string(),
              cashAmount: z.number(),
              debitCardAmount: z.number(),
              creditCardAmount: z.number(),
              pixAmount: z.number(),
            })
          ),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const results = {
          success: 0,
          errors: [] as Array<{ row: number; error: string }>,
        };

        // Get all cost centers and categories for mapping
        const events = await db.getAllEvents();
        const categories = await db.getAllRevenueCategories();

        for (let i = 0; i < input.rows.length; i++) {
          const row = input.rows[i];
          try {
            // Find cost center by name
            const event = events.find(
              (cc) => cc.name.toLowerCase() === row.eventName.toLowerCase()
            );
            if (!event) {
              results.errors.push({
                row: i + 1,
                error: `Evento "${row.eventName}" não encontrado`,
              });
              continue;
            }

            // Find category by name
            const category = categories.find(
              (cat) => cat.name.toLowerCase() === row.categoryName.toLowerCase()
            );
            if (!category) {
              results.errors.push({
                row: i + 1,
                error: `Categoria "${row.categoryName}" não encontrada`,
              });
              continue;
            }

            // Calculate total
            const totalAmount =
              row.cashAmount + row.debitCardAmount + row.creditCardAmount + row.pixAmount;

            // Create revenue
            await db.createDailyRevenue({
              date: new Date(row.date),
              eventId: event.id,
              revenueCategoryId: category.id,
              cashAmount: row.cashAmount,
              debitCardAmount: row.debitCardAmount,
              creditCardAmount: row.creditCardAmount,
              pixAmount: row.pixAmount,
              totalAmount,
              createdBy: ctx.user.id,
            });

            results.success++;
          } catch (error) {
            results.errors.push({
              row: i + 1,
              error: error instanceof Error ? error.message : "Erro desconhecido",
            });
          }
        }

        return results;
      }),

    exportCSV: protectedProcedure.query(async () => {
      const revenues = await db.getAllDailyRevenues();
      return revenues;
    }),
  }),

  // ========== Usuários do Sistema ==========
  systemUsers: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem listar usuários" });
      }
      return await db.getAllSystemUsers();
    }),

    listActive: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem listar usuários" });
      }
      return await db.getActiveSystemUsers();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem visualizar usuários" });
        }
        const user = await db.getSystemUserById(input.id);
        if (!user) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Usuário não encontrado" });
        }
        // Não retornar senha
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }),

    create: protectedProcedure.input(systemUserSchema).mutation(async ({ input, ctx }) => {
      if (ctx.user.profile !== "administrador") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar usuários" });
      }

      // Verificar se email já existe
      const existing = await db.getSystemUserByEmail(input.email);
      if (existing) {
        throw new TRPCError({ code: "CONFLICT", message: "Email já cadastrado" });
      }

      // Hash da senha
      const bcrypt = await import("bcryptjs");
      const passwordHash = await bcrypt.hash(input.password || "123456", 10);

      // Criar usuário
      const { companyIds, eventIds, password, ...userData } = input;
      const userId = await db.createSystemUser({
        ...userData,
        passwordHash,
      });

      // Vincular empresas
      if (companyIds && companyIds.length > 0) {
        for (const companyId of companyIds) {
          await db.addUserCompany({ userId, companyId });
        }
      }

      // Vincular eventos
      if (eventIds && eventIds.length > 0) {
        for (const eventId of eventIds) {
          await db.addUserEvent({ userId, eventId });
        }
      }

      return { id: userId, success: true };
    }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: systemUserSchema.partial() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem editar usuários" });
        }

        const { companyIds, eventIds, password, ...userData } = input.data;

        // Se senha foi fornecida, fazer hash
        let updateData: any = userData;
        if (password) {
          const bcrypt = await import("bcryptjs");
          updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        await db.updateSystemUser(input.id, updateData);

        // Atualizar vínculos de empresas
        if (companyIds !== undefined) {
          await db.removeAllUserCompanies(input.id);
          for (const companyId of companyIds) {
            await db.addUserCompany({ userId: input.id, companyId });
          }
        }

        // Atualizar vínculos de eventos
        if (eventIds !== undefined) {
          await db.removeAllUserEvents(input.id);
          for (const eventId of eventIds) {
            await db.addUserEvent({ userId: input.id, eventId });
          }
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem excluir usuários" });
        }
        await db.deleteSystemUser(input.id);
        return { success: true };
      }),

    getUserPermissions: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const companies = await db.getUserCompanies(input.id);
        const events = await db.getUserEvents(input.id);
        return { companies, events };
      }),
  }),

  // ========== Categorias Contábeis ==========
  categories: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCategories();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const category = await db.getCategoryById(input.id);
        if (!category) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Categoria não encontrada" });
        }
        return category;
      }),

    create: protectedProcedure
      .input(categorySchema)
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar categorias" });
        }
        const id = await db.createCategory(input);
        const category = await db.getCategoryById(id);
        if (!category) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar categoria" });
        return category;
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: categorySchema.partial() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem editar categorias" });
        }
        return db.updateCategory(input.id, input.data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem excluir categorias" });
        }
        await db.deleteCategory(input.id);
        return { success: true };
      }),

    exportCSV: protectedProcedure.query(async () => {
      const categories = await db.getAllCategories();
      const headers = ["ID", "Nome", "Tipo", "Descrição", "Ativo"];
      const rows = categories.map(c => [
        c.id.toString(),
        c.name,
        c.type,
        c.description || "",
        c.active.toString(),
      ]);
      return { headers, rows };
    }),

    importCSV: protectedProcedure
      .input(z.object({ data: z.array(z.array(z.string())) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem importar categorias" });
        }
        const results = { success: 0, errors: [] as string[] };
        
        for (let i = 0; i < input.data.length; i++) {
          const row = input.data[i];
          try {
            const [name, type, description] = row;
            if (!name || !type) {
              results.errors.push(`Linha ${i + 2}: Nome e Tipo são obrigatórios`);
              continue;
            }
            if (type !== "expense" && type !== "revenue") {
              results.errors.push(`Linha ${i + 2}: Tipo deve ser 'expense' ou 'revenue'`);
              continue;
            }
            await db.createCategory({ name, type: type as "expense" | "revenue", description: description || undefined });
            results.success++;
          } catch (error: any) {
            results.errors.push(`Linha ${i + 2}: ${error.message}`);
          }
        }
        return results;
      }),
  }),

  // ========== Subcategorias Contábeis ==========
  subcategories: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllSubcategories();
    }),

    listByCategory: protectedProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return await db.getSubcategoriesByCategoryId(input.categoryId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const subcategory = await db.getSubcategoryById(input.id);
        if (!subcategory) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Subcategoria não encontrada" });
        }
        return subcategory;
      }),

    create: protectedProcedure
      .input(subcategorySchema)
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem criar subcategorias" });
        }
        const id = await db.createSubcategory(input);
        const subcategory = await db.getSubcategoryById(id);
        if (!subcategory) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao criar subcategoria" });
        return subcategory;
      }),

    update: protectedProcedure
      .input(z.object({ id: z.number(), data: subcategorySchema.partial() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem editar subcategorias" });
        }
        return db.updateSubcategory(input.id, input.data);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem excluir subcategorias" });
        }
        await db.deleteSubcategory(input.id);
        return { success: true };
      }),

    exportCSV: protectedProcedure.query(async () => {
      const subcategories = await db.getAllSubcategories();
      const categories = await db.getAllCategories();
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      
      const headers = ["ID", "Nome", "Categoria", "Descrição", "Ativo"];
      const rows = subcategories.map(s => [
        s.id.toString(),
        s.name,
        categoryMap.get(s.categoryId) || "",
        s.description || "",
        s.active.toString(),
      ]);
      return { headers, rows };
    }),

    importCSV: protectedProcedure
      .input(z.object({ data: z.array(z.array(z.string())) }))
      .mutation(async ({ input, ctx }) => {
        if (ctx.user.profile !== "administrador") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Apenas administradores podem importar subcategorias" });
        }
        const results = { success: 0, errors: [] as string[] };
        const categories = await db.getAllCategories();
        const categoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
        
        for (let i = 0; i < input.data.length; i++) {
          const row = input.data[i];
          try {
            const [name, categoryName, description] = row;
            if (!name || !categoryName) {
              results.errors.push(`Linha ${i + 2}: Nome e Categoria são obrigatórios`);
              continue;
            }
            const categoryId = categoryMap.get(categoryName.toLowerCase());
            if (!categoryId) {
              results.errors.push(`Linha ${i + 2}: Categoria '${categoryName}' não encontrada`);
              continue;
            }
            await db.createSubcategory({ name, categoryId, description: description || undefined });
            results.success++;
          } catch (error: any) {
            results.errors.push(`Linha ${i + 2}: ${error.message}`);
          }
        }
        return results;
      }),
  }),

  // ========== Relatórios DRE ==========
  reports: router({
    // Buscar dados para DRE com filtros
    getDREData: protectedProcedure
      .input(
        z.object({
          companyId: z.number().optional(),
          eventId: z.number().optional(),
          categoryId: z.number().optional(),
          subcategoryId: z.number().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        // Verificar permissão de acesso
        const allowedProfiles = ["administrador", "gerente_geral", "gerente_regional", "lider_financeiro"];
        if (!allowedProfiles.includes(ctx.user.profile as string)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        // Buscar Receitas Diárias
        const revenuesFilter: any = {};
        if (input.eventId) revenuesFilter.eventId = input.eventId;
        if (input.startDate) revenuesFilter.startDate = input.startDate;
        if (input.endDate) revenuesFilter.endDate = input.endDate;
        
        const allRevenues = await db.getAllDailyRevenues(revenuesFilter);
        const revenues = await auth.filterFinancialsByPermission(allRevenues, ctx.user.id, ctx.user.profile as auth.UserRole);

        // Buscar Contas a Pagar (Despesas)
        const expensesFilter: any = {};
        if (input.eventId) expensesFilter.eventId = input.eventId;
        
        const allExpenses = await db.getAllAccountsPayable(expensesFilter);
        const expenses = await auth.filterFinancialsByPermission(allExpenses, ctx.user.id, ctx.user.profile as auth.UserRole);

        // Filtrar por empresa se especificado
        let filteredRevenues = revenues;
        let filteredExpenses = expenses;

        if (input.companyId) {
          const companyEvents = await db.getEventsByCompanyId(input.companyId);
          const eventIds = companyEvents.map(e => e.id);
          filteredRevenues = revenues.filter(r => eventIds.includes(r.eventId));
          filteredExpenses = expenses.filter(e => eventIds.includes(e.eventId));
        }

        // Filtrar por categoria/subcategoria (filtro simples por ID)
        if (input.categoryId) {
          filteredExpenses = filteredExpenses.filter(e => e.categoryId === input.categoryId);
        }
        
        if (input.subcategoryId) {
          filteredExpenses = filteredExpenses.filter(e => e.subcategoryId === input.subcategoryId);
        }

        // Calcular totais
        const totalRevenue = filteredRevenues.reduce((sum, r) => {
          return sum + (r.cashAmount || 0) + (r.debitCardAmount || 0) + (r.creditCardAmount || 0) + (r.pixAmount || 0);
        }, 0);

        const totalExpense = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const result = totalRevenue - totalExpense;

        // Agrupar despesas por categoria
        const expensesByCategory: { categoryName: string; total: number }[] = [];
        const categoryMap = new Map<number, { name: string; total: number }>();
        
        for (const expense of filteredExpenses) {
          if (expense.categoryId) {
            const existing = categoryMap.get(expense.categoryId);
            if (existing) {
              existing.total += expense.amount || 0;
            } else {
              const category = await db.getCategoryById(expense.categoryId);
              categoryMap.set(expense.categoryId, {
                name: category?.name || "Sem Categoria",
                total: expense.amount || 0,
              });
            }
          }
        }
        
        categoryMap.forEach((value) => {
          expensesByCategory.push({ categoryName: value.name, total: value.total });
        });

        // Agrupar por evento (se filtro de empresa estiver ativo)
        const expensesByEvent: { eventName: string; revenues: number; expenses: number }[] = [];
        if (input.companyId) {
          const companyEvents = await db.getEventsByCompanyId(input.companyId);
          
          for (const event of companyEvents) {
            const eventRevenues = filteredRevenues
              .filter(r => r.eventId === event.id)
              .reduce((sum, r) => sum + (r.cashAmount || 0) + (r.debitCardAmount || 0) + (r.creditCardAmount || 0) + (r.pixAmount || 0), 0);
            
            const eventExpenses = filteredExpenses
              .filter(e => e.eventId === event.id)
              .reduce((sum, e) => sum + (e.amount || 0), 0);
            
            if (eventRevenues > 0 || eventExpenses > 0) {
              expensesByEvent.push({
                eventName: event.name,
                revenues: eventRevenues,
                expenses: eventExpenses,
              });
            }
          }
        }

        return {
          revenues: filteredRevenues,
          expenses: filteredExpenses,
          totalRevenue,
          totalExpense,
          result,
          expensesByCategory,
          expensesByEvent,
        };
      }),

    // Buscar dados agrupados por evento para gráficos
    getDREByEvent: protectedProcedure
      .input(
        z.object({
          companyId: z.number(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        })
      )
      .query(async ({ ctx, input }) => {
        // Verificar permissão
        const allowedProfiles = ["administrador", "gerente_geral", "gerente_regional", "lider_financeiro"];
        if (!allowedProfiles.includes(ctx.user.profile as string)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
        }

        // Buscar eventos da empresa
        const companyEvents = await db.getEventsByCompanyId(input.companyId);
        const eventIds = companyEvents.map(e => e.id);

        // Buscar receitas e despesas
        const revenuesFilter: any = {};
        if (input.startDate) revenuesFilter.startDate = input.startDate;
        if (input.endDate) revenuesFilter.endDate = input.endDate;
        
        const allRevenues = await db.getAllDailyRevenues(revenuesFilter);
        const revenues = await auth.filterFinancialsByPermission(allRevenues, ctx.user.id, ctx.user.profile as auth.UserRole);
        
        const allExpenses = await db.getAllAccountsPayable({});
        const expenses = await auth.filterFinancialsByPermission(allExpenses, ctx.user.id, ctx.user.profile as auth.UserRole);

        // Agrupar por evento
        const eventData = companyEvents.map(event => {
          const eventRevenues = revenues.filter(r => r.eventId === event.id);
          const eventExpenses = expenses.filter(e => e.eventId === event.id);

          const totalRevenue = eventRevenues.reduce((sum, r) => {
            return sum + (r.cashAmount || 0) + (r.debitCardAmount || 0) + (r.creditCardAmount || 0) + (r.pixAmount || 0);
          }, 0);

          const totalExpense = eventExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

          return {
            eventId: event.id,
            eventName: event.name,
            totalRevenue,
            totalExpense,
            result: totalRevenue - totalExpense,
          };
        });

        return eventData;
      }),
  }),

  // Router de Módulos
  modules: router({
    // Listar todos os módulos do sistema
    list: publicProcedure
      .query(async () => {
        return await db.getAllModules();
      }),

    // Listar módulos permitidos para o usuário atual
    getUserModules: protectedProcedure
      .query(async ({ ctx }) => {
        const userModules = await db.getUserAllowedModules(ctx.user.id);
        return userModules;
      }),

    // Listar apenas módulos com permissão (filtrado)
    getMyModules: protectedProcedure
      .query(async ({ ctx }) => {
        // Retorna apenas os módulos que o usuário logado tem permissão
        const userModules = await db.getUserAllowedModules(ctx.user.id);
        return userModules;
      }),
  }),

  // Router de Permissões
  permissions: router({
    // Obter permissões de um usuário em um módulo específico
    getUserModulePermissions: protectedProcedure
      .input(z.object({
        userId: z.number(),
        moduleId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getUserPermissionsForModule(input.userId, input.moduleId);
      }),

    // Obter todas as permissões de um usuário
    getAllUserPermissions: protectedProcedure
      .input(z.object({
        userId: z.number(),
      }))
      .query(async ({ input }) => {
        return await db.getAllUserPermissions(input.userId);
      }),

    // Atualizar permissões de um usuário
    updateUserPermissions: protectedProcedure
      .input(z.object({
        userId: z.number(),
        permissions: z.array(z.object({
          moduleId: z.number(),
          canView: z.number(),
          canCreate: z.number(),
          canEdit: z.number(),
          canDelete: z.number(),
          canApprove: z.number(),
          canExport: z.number(),
        })),
      }))
      .mutation(async ({ input }) => {
        await db.updateUserPermissions(input.userId, input.permissions);
        return { success: true };
      }),
  }),

  // ========== AGENDA ==========
  agenda: router({
    // Listar eventos da agenda com filtros
    list: protectedProcedure
      .input(z.object({
        companyId: z.string().optional(),
        eventId: z.number().optional(),
        year: z.number().optional(),
        status: z.string().optional(),
        state: z.string().optional(),
        network: z.string().optional(),
        classification: z.string().optional(),
        shopping: z.string().optional(),
      }).optional())
      .query(async ({ input }) => {
        return await dbAgenda.listAgenda(input || {});
      }),

    // Obter estatísticas da agenda
    stats: protectedProcedure.query(async () => {
      return await dbAgenda.getAgendaStats();
    }),

    // Buscar por ID
    getById: protectedProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const record = await dbAgenda.getAgendaById(input.id);
        if (!record) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Registro não encontrado" });
        }
        return record;
      }),

    // Criar novo registro
    create: protectedProcedure
      .input(z.object({
        company_id: z.string(),
        event_id: z.number(),
        year: z.number(),
        period: z.string(),
        status: z.string(),
        shopping: z.string().optional(),
        state: z.string().optional(),
        network: z.string().optional(),
        classification: z.string().optional(),
        rent: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await dbAgenda.createAgenda(input);
        return { id, success: true };
      }),

    // Atualizar registro
    update: protectedProcedure
      .input(z.object({
        id: z.string(),
        data: z.object({
          company_id: z.string().optional(),
          event_id: z.number().optional(),
          year: z.number().optional(),
          period: z.string().optional(),
          status: z.string().optional(),
          shopping: z.string().optional(),
          state: z.string().optional(),
          network: z.string().optional(),
          classification: z.string().optional(),
          rent: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        await dbAgenda.updateAgenda(input.id, input.data);
        return { success: true };
      }),

    // Deletar registro
    delete: protectedProcedure
      .input(z.object({ id: z.string() }))
      .mutation(async ({ input }) => {
        await dbAgenda.deleteAgenda(input.id);
        return { success: true };
      }),

    // Exportar dados
    export: protectedProcedure.query(async () => {
      return await dbAgenda.exportAgenda();
    }),

    // Importar planilha Excel
    import: protectedProcedure
      .input(z.object({
        records: z.array(z.object({
          EMPRESA: z.string(),
          EVENTO: z.string(),
          ANO: z.number(),
          PERIODO: z.string(),
          STATUS: z.string(),
          SHOPPING: z.string().optional(),
          UF: z.string().optional(),
          REDE: z.string().optional(),
          CLASSIFICACAO: z.string().optional(),
          ALUGUEL: z.union([z.number(), z.string()]).optional(),
        })),
      }))
      .mutation(async ({ input }) => {
        const results = {
          success: [] as string[],
          errors: [] as { line: number; error: string; data: any }[],
        };

        for (let i = 0; i < input.records.length; i++) {
          const record = input.records[i];
          const lineNumber = i + 2; // +2 porque linha 1 é cabeçalho

          try {
            // 1. Buscar empresa pelo nome fantasia
            const company = await dbAgenda.findCompanyByName(record.EMPRESA);
            if (!company) {
              results.errors.push({
                line: lineNumber,
                error: `Empresa "${record.EMPRESA}" não encontrada. Empresas disponíveis: ${await getAvailableCompanies()}`,
                data: record,
              });
              continue;
            }
            
            // 2. Buscar evento pelo nome
            const event = await dbAgenda.findEventByName(record.EVENTO);
            if (!event) {
              results.errors.push({
                line: lineNumber,
                error: `Evento "${record.EVENTO}" não encontrado. Crie o evento em FINANCEIRO > Evento > Novo Evento`,
                data: record,
              });
              continue;
            }

            // 3. Processar aluguel
            let rent: string | undefined;
            if (record.ALUGUEL) {
              if (typeof record.ALUGUEL === "number") {
                rent = record.ALUGUEL.toString();
              } else {
                // Remover formatação: "R$ 1.000,00" -> "1000.00"
                rent = record.ALUGUEL
                  .replace(/[^0-9,]/g, "")
                  .replace(",", ".");
              }
            }

            // 4. Criar registro
            await dbAgenda.createAgenda({
              company_id: company.id,
              event_id: event.id,
              year: record.ANO,
              period: record.PERIODO,
              status: record.STATUS,
              shopping: record.SHOPPING,
              state: record.UF,
              network: record.REDE,
              classification: record.CLASSIFICACAO,
              rent,
            });

            results.success.push(`Linha ${lineNumber}: ${record.EVENTO} - ${record.PERIODO}`);
          } catch (error: any) {
            results.errors.push({
              line: lineNumber,
              error: error.message || "Erro desconhecido",
              data: record,
            });
          }
        }

        return {
          success: results.success.length > 0,
          imported: results.success.length,
          failed: results.errors.length,
          total: input.records.length,
          details: results,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
