import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import fs from 'fs'; // Import fs module for file operations
import QRCode from 'qrcode';
import { storage } from "./storage";
import {
  authenticateToken,
  requireRole,
  generateToken,
  hashPassword,
  comparePassword,
  type AuthRequest
} from "./auth";
import { sendWelcomeEmail, sendContactNotification, sendContactConfirmation, sendPartnerCommissionNotification, sendPaymentProofNotificationToAdmin, sendPaymentProofConfirmationToClient, sendEmail, generateBudgetAcceptanceEmailHTML, generatePaymentStageAvailableEmailHTML, sendPasswordResetEmail } from "./email";

// Función para verificar reCAPTCHA
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY || '6LcKEuOrAAAAAKmyBbyMlkdduVgvYifoHmuatZyC';
  
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️ RECAPTCHA_SECRET_KEY no configurada en Secrets. Usando clave de desarrollo.');
  }
  
  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    
    console.log(`🔐 reCAPTCHA verificado - Score: ${data.score || 'N/A'}, Success: ${data.success}`);
    
    // reCAPTCHA v3 devuelve un score de 0.0 a 1.0
    // Consideramos válido si el score es mayor a 0.5
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error('❌ Error verificando reCAPTCHA:', error);
    return false;
  }
}

import {
  loginSchema,
  registerSchema,
  contactSchema,
  insertProjectSchema,
  insertTicketSchema,
} from "@shared/schema";
import {
  registerWSConnection,
  sendComprehensiveNotification,
  notifyProjectCreated,
  notifyProjectUpdated,
  notifyNewMessage,
  notifyTicketCreated,
  notifyTicketResponse,
  notifyPaymentStageAvailable,
  notifyBudgetNegotiation
} from "./notifications";
import { z } from "zod";
import { db, users, partners, projects, notifications, tickets, paymentStages, portfolio, referrals, projectMessages, projectFiles, projectTimeline, ticketResponses, paymentMethods, invoices, transactions, budgetNegotiations, workModalities, clientBillingInfo, companyBillingInfo, exchangeRateConfig } from "./db";
import { eq, desc, and, or, count, sql, like, inArray } from "drizzle-orm"; // Import necessary drizzle-orm functions
import bcrypt from 'bcryptjs'; // Import bcryptjs for password hashing

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware for authentication and authorization
const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  authenticateToken(req, res, () => {
    if (req.user) {
      next();
    } else {
      res.status(401).json({ message: "No autorizado" });
    }
  });
};

// Validation middleware
const validateSchema = (schema: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Datos de entrada inválidos",
          errors: error.errors,
        });
      }
      next(error);
    }
  };
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, GIF) y PDFs.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      const dbTest = await db.select().from(users).limit(1);

      res.json({
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
        database_url_configured: !!process.env.DATABASE_URL,
        environment: process.env.NODE_ENV || 'development'
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Public endpoint for company billing info (for footer)
  app.get("/api/public/company-info", async (req, res) => {
    try {
      const companyInfo = await db
        .select({
          companyName: companyBillingInfo.companyName,
          titularName: companyBillingInfo.titularName,
          ruc: companyBillingInfo.ruc,
          timbradoNumber: companyBillingInfo.timbradoNumber,
        })
        .from(companyBillingInfo)
        .where(eq(companyBillingInfo.isActive, true))
        .orderBy(desc(companyBillingInfo.updatedAt))
        .limit(1);

      if (companyInfo.length === 0) {
        return res.json({
          companyName: "SoftwarePar",
          titularName: null,
          ruc: "En proceso",
          timbradoNumber: "En proceso",
        });
      }

      res.json(companyInfo[0]);
    } catch (error) {
      console.error("Error getting public company info:", error);
      res.status(500).json({
        companyName: "SoftwarePar",
        titularName: null,
        ruc: "En proceso",
        timbradoNumber: "En proceso",
      });
    }
  });



  // API routes
  // Seed initial data
  await storage.seedUsers();

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, recaptchaToken } = req.body;

      // Verificar reCAPTCHA
      if (recaptchaToken) {
        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        if (!isValidRecaptcha) {
          console.log('❌ Intento de login bloqueado por reCAPTCHA');
          return res.status(403).json({ message: "Verificación de seguridad fallida" });
        }
      }

      const validatedData = loginSchema.parse({ email, password });

      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const isValidPassword = await comparePassword(validatedData.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      const token = generateToken(user.id);
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        token,
        message: "Inicio de sesión exitoso",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Public registration disabled - only admins can create users

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { password: _, ...userWithoutPassword } = req.user!;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Password Reset Routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email, recaptchaToken } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email es requerido" });
      }

      // Verificar reCAPTCHA
      if (recaptchaToken) {
        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        if (!isValidRecaptcha) {
          console.log('❌ Recuperación de contraseña bloqueada por reCAPTCHA');
          return res.status(403).json({ message: "Verificación de seguridad fallida" });
        }
      }

      const user = await storage.getUserByEmail(email);
      
      // Por seguridad, siempre respondemos con éxito aunque el usuario no exista
      if (!user) {
        return res.json({ 
          message: "Si el email existe, recibirás instrucciones para recuperar tu contraseña" 
        });
      }

      // Generar token único y seguro
      const crypto = await import('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = await bcrypt.hash(resetToken, 10);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Token válido por 24 horas

      // Guardar token hasheado en la base de datos
      await storage.createPasswordResetToken({
        userId: user.id,
        token: hashedToken,
        expiresAt,
      });

      // Obtener dominio actual para el enlace
      const domain = process.env.REPL_ID 
        ? `https://${process.env.REPL_ID}.${process.env.REPL_SLUG}.replit.dev`
        : 'http://localhost:5000';
      
      const resetLink = `${domain}/reset-password?token=${resetToken}`;

      // Enviar email con el enlace de recuperación
      await sendPasswordResetEmail(user.email, user.fullName, resetLink);

      res.json({ 
        message: "Si el email existe, recibirás instrucciones para recuperar tu contraseña" 
      });
    } catch (error) {
      console.error("Error en forgot-password:", error);
      res.status(500).json({ message: "Error al procesar la solicitud" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token y contraseña son requeridos" });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ message: "La contraseña debe tener al menos 6 caracteres" });
      }

      // Verificar el token
      const resetToken = await storage.getPasswordResetToken(token);

      if (!resetToken) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }

      if (resetToken.used) {
        return res.status(400).json({ message: "Este token ya fue utilizado" });
      }

      if (new Date() > new Date(resetToken.expiresAt)) {
        return res.status(400).json({ message: "El token ha expirado" });
      }

      // Actualizar la contraseña del usuario
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);

      // Marcar el token como usado
      await storage.markPasswordResetTokenAsUsed(token);

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      console.error("Error en reset-password:", error);
      res.status(500).json({ message: "Error al resetear la contraseña" });
    }
  });

  // Exchange Rate Routes
  app.get("/api/exchange-rate", async (req, res) => {
    try {
      const exchangeRate = await storage.getCurrentExchangeRate();
      res.json(exchangeRate || { usdToGuarani: "7300.00", isDefault: true });
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/exchange-rate", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const exchangeRate = await storage.getCurrentExchangeRate();
      res.json(exchangeRate || {
        usdToGuarani: "7300.00",
        isDefault: true,
        updatedAt: new Date(),
        updatedBy: req.user!.id
      });
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/exchange-rate", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const { usdToGuarani } = req.body;

      if (!usdToGuarani || isNaN(parseFloat(usdToGuarani))) {
        return res.status(400).json({ message: "Tipo de cambio inválido" });
      }

      const updatedRate = await storage.updateExchangeRate(usdToGuarani, req.user!.id);
      res.json(updatedRate);
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Contact Routes
  app.post("/api/contact", async (req, res) => {
    try {
      const { recaptchaToken, ...contactDataRaw } = req.body;

      // Verificar reCAPTCHA
      if (recaptchaToken) {
        const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
        if (!isValidRecaptcha) {
          console.log('❌ Formulario de contacto bloqueado por reCAPTCHA');
          return res.status(403).json({ message: "Verificación de seguridad fallida. Por favor, intenta de nuevo." });
        }
        console.log('✅ reCAPTCHA verificado exitosamente');
      }

      const contactData = contactSchema.parse(contactDataRaw);

      // Send notification email to admin
      try {
        await sendContactNotification(contactData);
        console.log(`📧 Notificación de contacto enviada al admin para: ${contactData.fullName}`);
      } catch (emailError) {
        console.error("Error sending contact notification:", emailError);
      }

      // Send confirmation email to client
      try {
        await sendContactConfirmation(contactData.email, contactData.fullName);
        console.log(`📧 Confirmación enviada al cliente: ${contactData.email}`);
      } catch (emailError) {
        console.error("Error sending contact confirmation:", emailError);
      }

      res.json({
        message: "¡Gracias por contactarnos! Hemos recibido tu consulta y te responderemos en las próximas 24 horas."
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });



  // User Routes
  app.get("/api/users", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Update user (Admin or own profile)
  app.put("/api/users/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { currentPassword, newPassword, ...updates } = req.body;

      // Only allow users to update their own profile unless they're admin
      if (req.user!.id !== userId && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "No tienes permiso para actualizar este perfil" });
      }

      // If attempting to change password
      if (newPassword && currentPassword) {
        // Verify that the current password is correct
        const [currentUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (!currentUser) {
          return res.status(404).json({ message: "Usuario no encontrado" });
        }

        const isPasswordValid = await bcrypt.compare(currentPassword, currentUser.password);
        if (!isPasswordValid) {
          return res.status(400).json({ message: "La contraseña actual es incorrecta" });
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        updates.password = hashedPassword;
      }

      const [updatedUser] = await db
        .update(users)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Do not send the password in the response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Partner Routes
  app.get("/api/partners/me", authenticateToken, requireRole(["partner"]), async (req: AuthRequest, res) => {
    try {
      const partner = await storage.getPartner(req.user!.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner no encontrado" });
      }

      const stats = await storage.getPartnerStats(partner.id);
      res.json({ ...partner, ...stats });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/partners/referrals", authenticateToken, requireRole(["partner"]), async (req: AuthRequest, res) => {
    try {
      const partner = await storage.getPartner(req.user!.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner no encontrado" });
      }

      const referrals = await storage.getReferrals(partner.id);
      res.json(referrals);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/partner/earnings", authenticateToken, requireRole(["partner"]), async (req: AuthRequest, res) => {
    try {
      const partner = await storage.getPartner(req.user!.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner no encontrado" });
      }

      const earningsData = await storage.getPartnerEarningsData(partner.id);
      res.json(earningsData);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/partner/commissions", authenticateToken, requireRole(["partner"]), async (req: AuthRequest, res) => {
    try {
      const partner = await storage.getPartner(req.user!.id);
      if (!partner) {
        return res.status(404).json({ message: "Partner no encontrado" });
      }

      const commissions = await storage.getPartnerCommissions(partner.id);
      res.json(commissions);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/partners", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const { userId, commissionRate } = req.body;

      const existingPartner = await storage.getPartner(userId);
      if (existingPartner) {
        return res.status(400).json({ message: "El usuario ya es un partner" });
      }

      const referralCode = `PAR${userId}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
      const partner = await storage.createPartner({
        userId,
        referralCode,
        commissionRate: commissionRate || "25.00",
        totalEarnings: "0.00",
      });

      res.status(201).json(partner);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Projects
  app.get("/api/projects", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getProjects(req.user!.id, req.user!.role);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/projects/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);

      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Verificar permisos
      if (req.user!.role !== "admin" && project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para ver este proyecto" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/projects/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID de proyecto inválido" });
      }

      // Verificar que el proyecto existe y el usuario tiene permisos
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Solo el cliente dueño o admin puede eliminar
      if (req.user!.role !== "admin" && project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para eliminar este proyecto" });
      }

      await storage.deleteProject(projectId);
      res.json({ message: "Proyecto eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, description, price } = req.body;

      const projectData = {
        name,
        description,
        price: price.toString(), // Ensure price is a string for decimal field
        clientId: req.user!.id,
        status: "pending",
        progress: 0,
      };

      // Only admin can set different client ID
      if (req.user!.role === "admin" && req.body.clientId) {
        projectData.clientId = req.body.clientId;
      }

      const project = await storage.createProject(projectData);

      // Send notifications
      const adminUsers = await storage.getUsersByRole("admin");
      const adminIds = adminUsers.map(admin => admin.id);
      await notifyProjectCreated(projectData.clientId, adminIds, name, project.id);

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("Validation error:", error.errors);
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/projects/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID de proyecto inválido" });
      }

      // Get original project data
      const originalProject = await storage.getProject(projectId);
      if (!originalProject) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Validate dates if provided
      if (updates.startDate && updates.startDate !== null) {
        const startDate = new Date(updates.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: "Fecha de inicio inválida" });
        }
      }

      if (updates.deliveryDate && updates.deliveryDate !== null) {
        const deliveryDate = new Date(updates.deliveryDate);
        if (isNaN(deliveryDate.getTime())) {
          return res.status(400).json({ message: "Fecha de entrega inválida" });
        }
      }

      const project = await storage.updateProject(projectId, updates);

      // Send notification about project update
      if (req.user!.role === "admin") {
        let updateDescription = "El proyecto ha sido actualizado";
        let hasStatusChange = false;
        let hasProgressChange = false;

        if (updates.status && updates.status !== originalProject.status) {
          const statusLabels = {
            'pending': 'Pendiente',
            'in_progress': 'En Progreso',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
          };
          updateDescription = `Estado cambiado a: ${statusLabels[updates.status as keyof typeof statusLabels] || updates.status}`;
          hasStatusChange = true;
        }

        if (updates.progress && updates.progress !== originalProject.progress) {
          if (hasStatusChange) {
            updateDescription += ` - Progreso actualizado a ${updates.progress}%`;
          } else {
            updateDescription = `Progreso actualizado a ${updates.progress}%`;
          }
          hasProgressChange = true;
        }

        if (updates.startDate && updates.startDate !== originalProject.startDate) {
          updateDescription += ` - Fecha de inicio actualizada`;
        }

        if (updates.deliveryDate && updates.deliveryDate !== originalProject.deliveryDate) {
          updateDescription += ` - Fecha de entrega actualizada`;
        }

        if (updates.price && updates.price !== originalProject.price) {
          updateDescription += ` - Precio actualizado a $${updates.price}`;
        }

        console.log(`📧 Enviando notificaciones de actualización de proyecto: ${updateDescription}`);

        await notifyProjectUpdated(
          originalProject.clientId,
          originalProject.name,
          updateDescription,
          req.user!.fullName
        );

        // Special notifications for status changes
        if (hasStatusChange) {
          const statusLabels = {
            'pending': 'Pendiente',
            'in_progress': 'En Progreso',
            'completed': 'Completado',
            'cancelled': 'Cancelado'
          };

          console.log(`📧 Enviando notificaciones especiales de cambio de estado a: ${updates.status}`);

          // Notify all admins about status change
          const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
          for (const admin of adminUsers) {
            try {
              if (admin.email) {
                await sendEmail({
                  to: admin.email,
                  subject: `Cambio de Estado: ${originalProject.name} - ${statusLabels[updates.status as keyof typeof statusLabels] || updates.status}`,
                  html: generateProjectStatusChangeEmailHTML(
                    originalProject.name,
                    statusLabels[originalProject.status as keyof typeof statusLabels] || originalProject.status,
                    statusLabels[updates.status as keyof typeof statusLabels] || updates.status,
                    req.user!.fullName,
                    originalProject.clientId
                  ),
                });
                console.log(`✅ Email de cambio de estado enviado a admin: ${admin.email}`);
              }
            } catch (adminError) {
              console.error(`❌ Error enviando email de cambio de estado a admin ${admin.id}:`, adminError);
            }
          }

          // También enviar al email principal del sistema
          try {
            await sendEmail({
              to: process.env.GMAIL_USER || 'softwarepar.lat@gmail.com',
              subject: `Cambio de Estado: ${originalProject.name} - ${statusLabels[updates.status as keyof typeof statusLabels] || updates.status}`,
              html: generateProjectStatusChangeEmailHTML(
                originalProject.name,
                statusLabels[originalProject.status as keyof typeof statusLabels] || originalProject.status,
                statusLabels[updates.status as keyof typeof statusLabels] || updates.status,
                req.user!.fullName,
                originalProject.clientId
              ),
            });
            console.log(`✅ Email de cambio de estado enviado al email principal del sistema`);
          } catch (systemEmailError) {
            console.error(`❌ Error enviando email de cambio de estado al sistema principal:`, systemEmailError);
          }
        }
      }

      // Send real-time event for project update
      const { sendRealtimeEvent } = await import("./notifications");
      sendRealtimeEvent(originalProject.clientId, 'project_updated', {
        projectId: project.id,
        projectName: project.name
      });

      // Also notify all admins
      const adminUsers = await storage.getUsersByRole("admin");
      for (const admin of adminUsers) {
        sendRealtimeEvent(admin.id, 'project_updated', {
          projectId: project.id,
          projectName: project.name,
          clientId: originalProject.clientId
        });
      }

      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });



  // Project detail routes
  app.get("/api/projects/:id/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const messages = await storage.getProjectMessages(projectId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects/:id/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { message } = req.body;

      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const newMessage = await storage.createProjectMessage({
        projectId,
        userId: req.user!.id,
        message,
      });

      // Notify the other party (if client sends message, notify admin; if admin sends, notify client)
      const { sendRealtimeEvent } = await import("./notifications");
      if (req.user!.role === "client") {
        // Client sent message, notify admins
        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          await notifyNewMessage(
            admin.id,
            req.user!.fullName,
            project.name,
            message
          );

          // Send real-time event to admins
          sendRealtimeEvent(admin.id, 'message_created', {
            projectId,
            messageId: newMessage.id,
            userId: req.user!.id
          });
        }
      } else if (req.user!.role === "admin") {
        // Admin sent message, notify client
        await notifyNewMessage(
          project.clientId,
          req.user!.fullName,
          project.name,
          message
        );

        // Send real-time event to client
        sendRealtimeEvent(project.clientId, 'message_created', {
          projectId,
          messageId: newMessage.id,
          userId: req.user!.id
        });
      }

      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error creating project message:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/projects/:id/files", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const files = await storage.getProjectFiles(projectId);
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects/:id/files", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { fileName, fileUrl, fileType } = req.body;

      const newFile = await storage.createProjectFile({
        projectId,
        fileName,
        fileUrl,
        fileType,
        uploadedBy: req.user!.id,
      });

      // Send real-time event for file upload
      const { sendRealtimeEvent } = await import("./notifications");
      const project = await storage.getProject(projectId);
      if (project) {
        // Notify client
        sendRealtimeEvent(project.clientId, 'file_uploaded', {
          projectId,
          fileId: newFile.id,
          fileName: newFile.fileName
        });

        // Notify admins
        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          sendRealtimeEvent(admin.id, 'file_uploaded', {
            projectId,
            fileId: newFile.id,
            fileName: newFile.fileName,
            clientId: project.clientId
          });
        }
      }

      res.status(201).json(newFile);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/projects/:id/timeline", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const timeline = await storage.getProjectTimeline(projectId);
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects/:id/timeline", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const timelineData = { ...req.body, projectId };

      const timeline = await storage.createProjectTimeline(timelineData);
      res.status(201).json(timeline);
    } catch (error) {
      console.error("Error creating project timeline:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/projects/:id/timeline/:timelineId", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const timelineId = parseInt(req.params.timelineId);
      const updates = req.body;

      const timeline = await storage.updateProjectTimeline(timelineId, updates);
      res.json(timeline);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Budget Negotiation Routes
  app.get("/api/projects/:id/budget-negotiations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const negotiations = await storage.getBudgetNegotiations(projectId);
      res.json(negotiations);
    } catch (error) {
      console.error("Error getting budget negotiations:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/projects/:id/budget-negotiations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { proposedPrice, message } = req.body;

      // Get project for original price
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const negotiation = await storage.createBudgetNegotiation({
        projectId,
        proposedBy: req.user!.id,
        originalPrice: project.price,
        proposedPrice: proposedPrice.toString(),
        message,
        status: "pending",
      });

      // Notify the other party about the budget negotiation
      if (req.user!.role === "client") {
        // Client made proposal, notify admins
        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          await notifyBudgetNegotiation(
            admin.id,
            project.name,
            proposedPrice.toString(),
            message || "",
            false,
            projectId
          );
        }
      } else if (req.user!.role === "admin") {
        // Admin made counter-proposal, notify client
        await notifyBudgetNegotiation(
          project.clientId,
          project.name,
          proposedPrice.toString(),
          message || "",
          true,
          projectId
        );
      }

      res.status(201).json(negotiation);
    } catch (error) {
      console.error("Error creating budget negotiation:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/budget-negotiations/:id/respond", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const negotiationId = parseInt(req.params.id);
      const { status, message, counterPrice } = req.body;

      let updates: any = { status };

      // If accepting, also update the project price
      if (status === "accepted") {
        const [negotiation] = await db
          .select()
          .from(budgetNegotiations)
          .where(eq(budgetNegotiations.id, negotiationId))
          .limit(1);

        if (negotiation) {
          await storage.updateProject(negotiation.projectId, {
            price: negotiation.proposedPrice,
            status: "in_progress",
          });

          // Get project and client info for email notification
          const project = await storage.getProject(negotiation.projectId);
          const client = await storage.getUserById(project?.clientId);

          if (project && client) {
            // Notify all admins about acceptance
            const adminUsers = await storage.getUsersByRole("admin");
            for (const admin of adminUsers) {
              try {
                if (admin.email) {
                  await sendEmail({
                    to: admin.email,
                    subject: `✅ Contraoferta Aceptada: ${project.name} - $${negotiation.proposedPrice}`,
                    html: generateBudgetAcceptanceEmailHTML(
                      project.name,
                      client.fullName,
                      client.email,
                      negotiation.originalPrice,
                      negotiation.proposedPrice,
                      message || ""
                    ),
                  });
                  console.log(`✅ Email de aceptación de contraoferta enviado a admin: ${admin.email}`);
                }
              } catch (adminError) {
                console.error(`❌ Error enviando email de aceptación a admin ${admin.id}:`, adminError);
              }
            }

            // También enviar al email principal del sistema
            try {
              await sendEmail({
                to: process.env.GMAIL_USER || 'softwarepar.lat@gmail.com',
                subject: `✅ Contraoferta Aceptada: ${project.name} - $${negotiation.proposedPrice}`,
                html: generateBudgetAcceptanceEmailHTML(
                  project.name,
                  client.fullName,
                  client.email,
                  negotiation.originalPrice,
                  negotiation.proposedPrice,
                  message || ""
                ),
              });
              console.log(`✅ Email de aceptación enviado al email principal del sistema`);
            } catch (systemEmailError) {
              console.error(`❌ Error enviando email de aceptación al sistema principal:`, systemEmailError);
            }
          }
        }
      }

      // If countering, create new negotiation
      if (status === "countered" && counterPrice) {
        const [oldNegotiation] = await db
          .select()
          .from(budgetNegotiations)
          .where(eq(budgetNegotiations.id, negotiationId))
          .limit(1);

        if (oldNegotiation) {
          await storage.createBudgetNegotiation({
            projectId: oldNegotiation.projectId,
            proposedBy: req.user!.id,
            originalPrice: oldNegotiation.proposedPrice,
            proposedPrice: counterPrice.toString(),
            message,
            status: "pending",
          });
        }
      }

      const updated = await storage.updateBudgetNegotiation(negotiationId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error responding to budget negotiation:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Ticket Routes
  app.get("/api/tickets", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const tickets = await storage.getTickets(req.user!.id);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/tickets", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { title, description, priority, projectId } = req.body;

      const ticketData = {
        title,
        description,
        priority: priority || "medium",
        userId: req.user!.id,
        projectId: projectId || null,
      };

      const ticket = await storage.createTicket(ticketData);

      // Notify admins about new ticket
      const adminUsers = await storage.getUsersByRole("admin");
      const adminIds = adminUsers.map(admin => admin.id);
      await notifyTicketCreated(adminIds, req.user!.fullName, title);

      // Send real-time event to admins for data update
      const { sendRealtimeEvent } = await import("./notifications");
      for (const adminId of adminIds) {
        sendRealtimeEvent(adminId, 'ticket_created', {
          ticketId: ticket.id,
          title: ticket.title,
          priority: ticket.priority,
          userId: req.user!.id
        });
      }

      res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos inválidos", errors: error.errors });
      }
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/tickets/:id/responses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { message } = req.body;

      // Get ticket info
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket no encontrado" });
      }

      const response = await storage.createTicketResponse({
        ticketId,
        userId: req.user!.id,
        message,
        isFromSupport: req.user!.role === "admin",
      });

      // Notify the other party about the response
      const { sendRealtimeEvent } = await import("./notifications");
      if (req.user!.role === "admin") {
        // Admin responded, notify the ticket creator (client)
        await notifyTicketResponse(
          ticket.userId,
          req.user!.fullName,
          ticket.title,
          message,
          true
        );

        // Send real-time event to client
        sendRealtimeEvent(ticket.userId, 'ticket_updated', {
          ticketId: ticket.id,
          title: ticket.title
        });
      } else {
        // Client responded, notify admins
        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          await notifyTicketResponse(
            admin.id,
            req.user!.fullName,
            ticket.title,
            message,
            false
          );

          // Send real-time event to admins
          sendRealtimeEvent(admin.id, 'ticket_updated', {
            ticketId: ticket.id,
            title: ticket.title,
            userId: ticket.userId
          });
        }
      }

      res.status(201).json(response);
    } catch (error) {
      console.error("Error creating ticket response:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/tickets/:id/responses", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const responses = await storage.getTicketResponses(ticketId);
      res.json(responses);
    } catch (error) {
      console.error("Error getting ticket responses:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Notification Routes
  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notifications = await storage.getNotifications(req.user!.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ message: "Notificación marcada como leída" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Payment Stages Routes
  app.post("/api/projects/:id/payment-stages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { stages } = req.body;

      // Verify project exists and user has access
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Create payment stages
      const createdStages = [];
      const availableStages = [];
      for (const stage of stages) {
        const stageData = {
          projectId: projectId,
          stageName: stage.name,
          stagePercentage: stage.percentage,
          amount: (parseFloat(project.price) * stage.percentage / 100),
          requiredProgress: stage.requiredProgress,
          status: stage.requiredProgress === 0 ? 'available' : 'pending'
        };
        const created = await storage.createPaymentStage(stageData);
        createdStages.push(created);

        // Recopilar etapas disponibles para notificar
        if (stageData.status === 'available') {
          availableStages.push(created);
        }
      }

      // Notificar al cliente por email sobre etapas disponibles
      if (availableStages.length > 0) {
        const client = await storage.getUserById(project.clientId);
        if (client?.email) {
          for (const stage of availableStages) {
            try {
              await sendEmail({
                to: client.email,
                subject: `💰 Pago Disponible: ${project.name} - ${stage.stageName}`,
                html: generatePaymentStageAvailableEmailHTML(
                  client.fullName,
                  project.name,
                  stage.stageName,
                  stage.amount.toString(),
                  stage.stagePercentage
                ),
              });
              console.log(`📧 Email de etapa disponible enviado a cliente: ${client.email} para etapa: ${stage.stageName}`);
            } catch (emailError) {
              console.error(`❌ Error enviando email de etapa disponible a cliente:`, emailError);
            }
          }
        }
      }

      // Crear timeline automáticamente solo si no existe ya uno
      const hasTimeline = await storage.hasProjectTimeline(projectId);

      if (!hasTimeline) {
        const timelineItems = [
          {
            title: "Análisis y Planificación",
            description: "Análisis de requerimientos y planificación del proyecto",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Diseño y Arquitectura",
            description: "Diseño de la interfaz y arquitectura del sistema",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Desarrollo - Fase 1",
            description: "Desarrollo de funcionalidades principales (50% del proyecto)",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Desarrollo - Fase 2",
            description: "Completar desarrollo y optimizaciones (90% del proyecto)",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Testing y QA",
            description: "Pruebas exhaustivas y control de calidad",
            status: "pending",
            estimatedDate: null
          },
          {
            title: "Entrega Final",
            description: "Entrega del proyecto completado y documentación",
            status: "pending",
            estimatedDate: null
          }
        ];

        // Crear elementos del timeline
        for (const timelineItem of timelineItems) {
          await storage.createProjectTimeline({
            projectId: projectId,
            title: timelineItem.title,
            description: timelineItem.description,
            status: timelineItem.status,
            estimatedDate: timelineItem.estimatedDate,
          });
        }
      }

      res.json(createdStages);
    } catch (error) {
      console.error("Error creating payment stages:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/projects/:id/payment-stages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const stages = await storage.getPaymentStages(projectId);
      res.json(stages);
    } catch (error) {
      console.error("Error fetching payment stages:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.patch("/api/payment-stages/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);
      const updates = req.body;
      const updated = await storage.updatePaymentStage(stageId, updates);
      res.json(updated);
    } catch (error) {
      console.error("Error updating payment stage:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/payment-stages/:id/complete", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);
      const updated = await storage.completePaymentStage(stageId);
      res.json(updated);
    } catch (error) {
      console.error("Error completing payment stage:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/payment-stages/:id/confirm-payment", authenticateToken, upload.single('proofFile'), async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);

      // Obtener datos del formulario (multipart/form-data)
      const paymentMethod = req.body.paymentMethod;
      const proofFileInfo = req.body.proofFileInfo ? JSON.parse(req.body.proofFileInfo) : null;
      const proofFile = req.file; // Archivo procesado por multer

      console.log(`💰 Procesando confirmación de pago para etapa ${stageId}:`, {
        paymentMethod,
        hasFile: !!proofFile,
        fileName: proofFile?.originalname,
        fileSize: proofFile?.size,
        mimetype: proofFile?.mimetype
      });

      // Get stage info and project details
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const client = await storage.getUserById(project.clientId);
      if (!client) {
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      // Construir URL del archivo si existe
      let proofFileUrl = null;
      if (proofFile) {
        proofFileUrl = `comprobante_${stageId}_${Date.now()}_${proofFile.originalname}`;
      } else if (proofFileInfo) {
        proofFileUrl = `comprobante_${stageId}_${Date.now()}.${proofFileInfo.fileType?.split('/')[1] || 'jpg'}`;
      }

      const updated = await storage.updatePaymentStage(stageId, {
        paymentMethod,
        proofFileUrl,
        status: 'pending_verification',
        paymentData: {
          confirmedBy: req.user!.id,
          confirmedAt: new Date(),
          method: paymentMethod,
          fileInfo: proofFileInfo || (proofFile ? {
            fileName: proofFile.originalname,
            fileSize: proofFile.size,
            fileType: proofFile.mimetype
          } : null),
          originalFileName: proofFile?.originalname
        }
      });

      // Notify admin about payment confirmation
      const adminUsers = await storage.getUsersByRole("admin");
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: "📋 Comprobante de Pago Recibido",
          message: `El cliente ${client.fullName} envió comprobante de pago para "${stage[0].stageName}" mediante ${paymentMethod}. ${proofFile ? 'Comprobante adjunto: ' + proofFile.originalname : 'Sin comprobante adjunto'}. Requiere verificación.`,
          type: "warning",
        });
      }

      // Send real-time event to admins for data update
      const { sendRealtimeEvent } = await import("./notifications");
      const adminIds = adminUsers.map(admin => admin.id);
      for (const adminId of adminIds) {
        sendRealtimeEvent(adminId, 'payment_proof_uploaded', {
          stageId: stage[0].id,
          projectId: stage[0].projectId,
          clientId: project.clientId,
          stageName: stage[0].stageName,
          paymentMethod
        });
      }

      // Send email notifications
      try {
        // Preparar información del archivo para el email
        let fileAttachmentInfo = null;
        if (proofFile) {
          const fileSizeMB = (proofFile.size / 1024 / 1024).toFixed(2);
          fileAttachmentInfo = `📎 Comprobante adjunto: ${proofFile.originalname} (${fileSizeMB} MB) - Tipo: ${proofFile.mimetype}`;
          console.log(`📎 Archivo recibido: ${proofFile.originalname}, Tamaño: ${fileSizeMB}MB, Tipo: ${proofFile.mimetype}`);
        } else if (proofFileInfo) {
          const fileSizeMB = (proofFileInfo.fileSize / 1024 / 1024).toFixed(2);
          fileAttachmentInfo = `📎 Archivo indicado: ${proofFileInfo.fileName} (${fileSizeMB} MB) - ${proofFileInfo.fileType}`;
        } else {
          console.log(`ℹ️ No se adjuntó comprobante para la etapa ${stageId}`);
        }

        // Notificar al admin por email con información del comprobante
        await sendPaymentProofNotificationToAdmin(
          client.fullName,
          project.name,
          stage[0].stageName,
          stage[0].amount,
          paymentMethod,
          fileAttachmentInfo
        );

        // Confirmar al cliente por email
        await sendPaymentProofConfirmationToClient(
          client.email,
          client.fullName,
          project.name,
          stage[0].stageName,
          stage[0].amount,
          paymentMethod
        );

        console.log(`📧 Notificaciones de email enviadas para pago de ${client.fullName}`);
      } catch (emailError) {
        console.error("❌ Error enviando notificaciones por email:", emailError);
        // No fallar la operación por errores de email
      }

      res.json({
        ...updated,
        message: "Comprobante enviado exitosamente. Tu pago está pendiente de verificación por nuestro equipo. Te notificaremos cuando sea aprobado.",
      });
    } catch (error) {
      console.error("❌ Error confirming payment stage:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/payment-stages/:id/approve-payment", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);
      console.log(`✅ Admin aprobando pago para etapa: ${stageId}`);

      // Get stage info and project details
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        console.error(`❌ Etapa ${stageId} no encontrada`);
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      if (stage[0].status !== 'pending_verification') {
        return res.status(400).json({ message: "Esta etapa no está pendiente de verificación" });
      }

      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        console.error(`❌ Proyecto ${stage[0].projectId} no encontrado`);
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      const client = await storage.getUserById(project.clientId);
      if (!client) {
        console.error(`❌ Cliente ${project.clientId} no encontrado`);
        return res.status(404).json({ message: "Cliente no encontrado" });
      }

      // IMPORTANTE: Obtener el tipo de cambio actual y guardarlo permanentemente con este pago
      const exchangeRateData = await storage.getCurrentExchangeRate();
      const currentExchangeRate = exchangeRateData ? exchangeRateData.usdToGuarani : "7300.00";

      console.log(`💱 Guardando tipo de cambio del momento del pago: 1 USD = ${currentExchangeRate} PYG para etapa ${stageId}`);

      // Update stage to paid con el tipo de cambio actual FIJO
      const updated = await storage.updatePaymentStage(stageId, {
        status: 'paid',
        paidAt: new Date(),
        approvedBy: req.user!.id,
        approvedAt: new Date(),
        exchangeRateUsed: currentExchangeRate
      });

      // Notify client about payment approval
      await storage.createNotification({
        userId: project.clientId,
        title: "✅ Pago Aprobado",
        message: `Tu pago para la etapa "${stage[0].stageName}" ha sido verificado y aprobado. ¡Continuamos con el desarrollo!`,
        type: "success",
      });

      // Send real-time event to client and admins for data update
      const { sendRealtimeEvent } = await import("./notifications");
      sendRealtimeEvent(project.clientId, 'payment_approved', {
        stageId: stage[0].id,
        projectId: stage[0].projectId,
        stageName: stage[0].stageName
      });

      // Also notify all admins
      const adminUsers = await storage.getUsersByRole("admin");
      for (const admin of adminUsers) {
        sendRealtimeEvent(admin.id, 'payment_approved', {
          stageId: stage[0].id,
          projectId: stage[0].projectId,
          clientId: project.clientId,
          stageName: stage[0].stageName
        });
      }

      // ** NUEVO: Crear/actualizar factura y procesar con FacturaSend **
      console.log(`📄 Generando factura para etapa ${stageId}...`);

      // Obtener info de empresa
      const companyInfo = await db
        .select()
        .from(companyBillingInfo)
        .where(eq(companyBillingInfo.isActive, true))
        .limit(1);

      if (companyInfo[0]) {
        // Verificar si ya existe una factura para esta etapa
        const existingInvoice = await db
          .select()
          .from(invoices)
          .where(eq(invoices.paymentStageId, stageId))
          .limit(1);

        let newInvoice = existingInvoice[0];
        let boletaNumber = existingInvoice[0]?.invoiceNumber;
        let shouldSendToFacturaSend = false;

        if (!existingInvoice[0]) {
          // Generar número de factura
          const boletaPrefix = companyInfo[0].boletaPrefix || '001-001';
          const currentSequence = companyInfo[0].boletaSequence || 1;
          boletaNumber = `${boletaPrefix}-${String(currentSequence).padStart(7, '0')}`;

          // Crear factura en la BD
          const amountValue = stage[0].amount;
          [newInvoice] = await db.insert(invoices).values({
            projectId: stage[0].projectId,
            clientId: project.clientId,
            paymentStageId: stageId,
            invoiceNumber: boletaNumber,
            amount: amountValue,
            totalAmount: amountValue,
            taxAmount: '0.00',
            discountAmount: '0.00',
            currency: 'USD',
            status: 'paid',
            dueDate: new Date(),
            paidDate: stage[0].paidAt || new Date(),
            exchangeRateUsed: currentExchangeRate,
          }).returning();

          // Actualizar secuencia de boletas
          await db.update(companyBillingInfo)
            .set({ boletaSequence: currentSequence + 1 })
            .where(eq(companyBillingInfo.id, companyInfo[0].id));

          console.log(`✅ Factura creada: ${boletaNumber}`);
          shouldSendToFacturaSend = true;
        } else if (existingInvoice[0].sifenCDC) {
          console.log(`ℹ️ Factura ${boletaNumber} ya enviada a FacturaSend (CDC: ${existingInvoice[0].sifenCDC})`);
          shouldSendToFacturaSend = false;
        } else {
          console.log(`⚠️ Factura ${boletaNumber} existe pero no tiene CDC, reintentando envío...`);
          shouldSendToFacturaSend = true;
        }

        // ** PROCESAR CON FACTURASEND EN SEGUNDO PLANO (solo si es necesario) **
        if (shouldSendToFacturaSend) {
          import('./facturasend').then(async (facturasend) => {
            try {
              console.log(`🔄 Iniciando proceso FacturaSend para factura ${boletaNumber}...`);

            const clientInfo = await db
              .select()
              .from(clientBillingInfo)
              .where(eq(clientBillingInfo.userId, client.id))
              .limit(1);

            const exchangeRate = parseFloat(currentExchangeRate);

            const numeroDocumento = parseInt(boletaNumber.split('-').pop() || '1');

            const clientData = clientInfo[0] || {};
            if (!clientData.user) {
              clientData.user = client;
            }

            // Obtener todas las etapas para determinar número de etapa
            const allStages = await storage.getPaymentStages(stage[0].projectId);
            const sortedStages = allStages.sort((a: any, b: any) => a.requiredProgress - b.requiredProgress);
            const stageNumber = sortedStages.findIndex((s: any) => s.id === stage[0].id) + 1;
            const totalStages = sortedStages.length;

            // Agregar información de número de etapa al objeto stage
            const stageWithInfo = {
              ...stage[0],
              stageNumber,
              totalStages
            };

            const documento = await facturasend.construirDocumentoFacturaSend(
              companyInfo[0],
              clientData,
              stageWithInfo,
              project,
              exchangeRate,
              numeroDocumento
            );

            console.log(`📤 Enviando a FacturaSend...`);
            const respuestaAPI = await facturasend.enviarFacturaFacturaSend(documento);

            const resultado = facturasend.extraerResultadoFacturaSend(respuestaAPI);

            // Truncar QR URL si es demasiado largo (máximo 1000 caracteres)
            const qrUrlTruncated = resultado.qr && resultado.qr.length > 1000
              ? resultado.qr.substring(0, 1000)
              : resultado.qr;

            await db.update(invoices)
              .set({
                sifenCDC: resultado.cdc,
                sifenProtocolo: resultado.protocoloAutorizacion,
                sifenEstado: resultado.estado,
                sifenFechaEnvio: new Date(),
                sifenMensajeError: resultado.mensaje,
                sifenXML: resultado.xml,
                sifenQR: qrUrlTruncated || null,
                updatedAt: new Date()
              })
              .where(eq(invoices.id, newInvoice.id));

            console.log(`✅ Factura actualizada con datos de FacturaSend:`);
            console.log(`   📋 CDC: ${resultado.cdc || 'No disponible'}`);
            console.log(`   📱 QR URL: ${qrUrlTruncated ? 'Disponible (' + qrUrlTruncated.length + ' chars)' : 'No disponible'}`);
            console.log(`   📊 Estado: ${resultado.estado}`);
            console.log(`   📝 Protocolo: ${resultado.protocoloAutorizacion || 'N/A'}`);

            console.log(`${resultado.estado === 'aceptado' ? '✅' : '❌'} FacturaSend: ${resultado.estado.toUpperCase()}`);
            if (resultado.cdc) {
              console.log(`📋 CDC generado: ${resultado.cdc}`);
            }
            if (resultado.protocoloAutorizacion) {
              console.log(`🔐 Protocolo: ${resultado.protocoloAutorizacion}`);
            }
            if (resultado.mensaje) {
              console.log(`💬 Mensaje: ${resultado.mensaje}`);
            }
          } catch (facturasendError) {
            console.error('❌ Error procesando FacturaSend:', facturasendError);
            }
          }).catch(err => {
            console.error('❌ Error importando módulo FacturaSend:', err);
          });
        } else {
          console.log(`✅ Factura ${boletaNumber} ya procesada, omitiendo envío a FacturaSend`);
        }
      }

      res.json({
        ...updated,
        message: "Pago aprobado exitosamente"
      });
    } catch (error) {
      console.error("❌ Error approving payment:", error);
      res.status(500).json({
        message: "Error al aprobar pago",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/payment-stages/:id/reject-payment", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);
      const { reason } = req.body;
      console.log(`❌ Admin rechazando pago para etapa: ${stageId}, razón: ${reason}`);

      // Get stage info and project details
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        console.error(`❌ Etapa ${stageId} no encontrada`);
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      if (stage[0].status !== 'pending_verification') {
        return res.status(400).json({ message: "Esta etapa no está pendiente de verificación" });
      }

      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        console.error(`❌ Proyecto ${stage[0].projectId} no encontrado`);
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Update stage back to available
      const updated = await storage.updatePaymentStage(stageId, {
        status: 'available',
        paymentMethod: null,
        proofFileUrl: null,
        paymentData: {
          ...stage[0].paymentData,
          rejectedBy: req.user!.id,
          rejectedAt: new Date(),
          rejectionReason: reason
        }
      });

      // Notify client about payment rejection
      await storage.createNotification({
        userId: project.clientId,
        title: "❌ Pago Rechazado",
        message: `Tu comprobante de pago para "${stage[0].stageName}" fue rechazado. Motivo: ${reason}. Por favor, envía un nuevo comprobante.`,
        type: "error",
      });

      // Send real-time event to client and admins for data update
      const { sendRealtimeEvent } = await import("./notifications");
      sendRealtimeEvent(project.clientId, 'payment_rejected', {
        stageId: stage[0].id,
        projectId: stage[0].projectId,
        stageName: stage[0].stageName,
        reason
      });

      // Also notify all admins
      const adminUsers = await storage.getUsersByRole("admin");
      for (const admin of adminUsers) {
        sendRealtimeEvent(admin.id, 'payment_rejected', {
          stageId: stage[0].id,
          projectId: stage[0].projectId,
          clientId: project.clientId,
          stageName: stage[0].stageName,
          reason
        });
      }

      res.json({
        ...updated,
        message: "Pago rechazado"
      });
    } catch (error) {
      console.error("❌ Error rejecting payment:", error);
      res.status(500).json({
        message: "Error al rechazar pago",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/payment-stages/:id/receipt-file", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.id);

      // Get stage info
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      // Check if user has permission to view this file
      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Only admin or project client can view the receipt
      if (req.user!.role !== "admin" && project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para ver este archivo" });
      }

      // Check if there's a payment proof file
      if (!stage[0].proofFileUrl) {
        return res.status(404).json({ message: "No hay comprobante disponible" });
      }

      // For now, we'll return file info since we don't have actual file storage
      // In a real implementation, you would serve the actual file from storage
      const fileInfo = stage[0].paymentData?.fileInfo || {};

      res.json({
        message: "Información del comprobante",
        fileName: stage[0].paymentData?.originalFileName || "comprobante.jpg",
        fileUrl: stage[0].proofFileUrl,
        fileType: fileInfo.fileType || "image/jpeg",
        fileSize: fileInfo.fileSize || 0,
        uploadedAt: stage[0].paymentData?.confirmedAt || stage[0].updatedAt,
        note: "En un entorno de producción, aquí se serviría el archivo real desde el almacenamiento."
      });
    } catch (error) {
      console.error("❌ Error serving receipt file:", error);
      res.status(500).json({
        message: "Error al servir archivo",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Endpoint para descargar factura de etapa de pago
  app.get("/api/client/stage-invoices/:stageId/download", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.stageId);

      if (isNaN(stageId)) {
        return res.status(400).json({ message: "ID de etapa inválido" });
      }

      // Get stage info
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      // Get project info
      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Verificar que la etapa pertenece al cliente
      if (project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para ver esta factura" });
      }

      // Verificar que la etapa esté pagada
      if (stage[0].status !== 'paid') {
        return res.status(400).json({ message: "Esta etapa aún no ha sido pagada" });
      }

      // Get all stages to determine which stage number this is
      const allStages = await storage.getPaymentStages(stage[0].projectId);
      const sortedStages = allStages.sort((a: any, b: any) => a.requiredProgress - b.requiredProgress);
      const stageNumber = sortedStages.findIndex(s => s.id === stage[0].id) + 1;
      const totalStages = sortedStages.length;

      // Get current exchange rate and convert to guaraníes
      const exchangeRateData = await storage.getCurrentExchangeRate();
      const exchangeRate = exchangeRateData ? parseFloat(exchangeRateData.usdToGuarani) : 7300;
      const amountUSD = parseFloat(stage[0].amount);
      const amountPYG = Math.round(amountUSD * exchangeRate);

      // Generate professional invoice number
      const invoiceNumber = `${String(new Date().getFullYear()).slice(-2)}${String(stage[0].projectId).padStart(4, '0')}`;
      const issueDate = new Date().toLocaleDateString('es-PY');

      // Create PDF document with A4 size
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="SoftwarePar_Factura_${invoiceNumber}_Etapa_${stageNumber}.pdf"`);

      // Handle PDF stream errors
      doc.on('error', (error) => {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error generando PDF" });
        }
      });

      // Pipe PDF to response
      doc.pipe(res);

      // Page dimensions
      const pageWidth = 595;
      const leftMargin = 50;
      const rightMargin = 50;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      // HEADER with blue background like the example
      doc.rect(0, 0, pageWidth, 100).fillColor('#2563eb').fill();

      // Company logo placeholder and name in header
      doc.fontSize(20).fillColor('#ffffff').text('SoftwarePar', leftMargin, 30);
      doc.fontSize(12).fillColor('#ffffff').text('Desarrollo de Software Profesional', leftMargin, 55);

      // INVOICE title on the right
      doc.fontSize(36).fillColor('#ffffff').text('INVOICE', pageWidth - 200, 25);

      // Company details below header
      let yPos = 120;
      doc.fontSize(14).fillColor('#000').text('SoftwarePar S.R.L.', leftMargin, yPos);
      yPos += 20;
      doc.fontSize(10).fillColor('#6b7280');
      doc.text('Paraguay, América del Sur', leftMargin, yPos);
      doc.text('Phone: +595 985 990 046', leftMargin, yPos + 12);
      doc.text('Email: softwarepar.lat@gmail.com', leftMargin, yPos + 24);

      // Invoice details on the right
      const rightColumnX = 350;
      let rightYPos = 120;
      doc.fontSize(10).fillColor('#374151');
      doc.text('Date:', rightColumnX, rightYPos);
      doc.text('Invoice #:', rightColumnX, rightYPos + 15);
      doc.text('Etapa de Pago:', rightColumnX, rightYPos + 30);

      doc.fontSize(10).fillColor('#000');
      doc.text(issueDate, rightColumnX + 70, rightYPos);
      doc.text(invoiceNumber, rightColumnX + 70, rightYPos + 15);
      doc.text(`${stageNumber} de ${totalStages}`, rightColumnX + 70, rightYPos + 30);

      // Bill To section with blue header like example
      yPos = 240;
      doc.rect(leftMargin, yPos, contentWidth, 25).fillColor('#2563eb').fill();
      doc.fontSize(12).fillColor('#ffffff').text('Bill To:', leftMargin + 10, yPos + 7);

      yPos += 35;
      doc.fontSize(11).fillColor('#000');
      doc.text(req.user!.fullName, leftMargin + 10, yPos);
      doc.text(req.user!.email, leftMargin + 10, yPos + 15);
      doc.text(`Cliente ID: ${req.user!.id.toString().padStart(6, '0')}`, leftMargin + 10, yPos + 30);
      doc.text(`Proyecto: ${project.name}`, leftMargin + 10, yPos + 45);

      // Table header with blue background like example
      yPos = 320;
      const tableX = leftMargin;
      const tableWidth = contentWidth;
      const rowHeight = 30;

      // Table header
      doc.rect(tableX, yPos, tableWidth, rowHeight).fillColor('#2563eb').fill();

      doc.fontSize(11).fillColor('#ffffff');
      doc.text('Quantity', tableX + 10, yPos + 9);
      doc.text('Description', tableX + 80, yPos + 9);
      doc.text('Unit price', tableX + 320, yPos + 9);
      doc.text('Amount', tableX + 420, yPos + 9);

      // Table rows with alternating colors
      const rows = [
        {
          qty: '1',
          description: `${stage[0].stageName} - Etapa ${stageNumber} de ${totalStages}`,
          unitPrice: `$ ${amountUSD.toFixed(2)} USD`,
          amount: `$ ${amountUSD.toFixed(2)} USD`
        },
        {
          qty: '',
          description: `Equivalente en Guaraníes (1 USD = ₱ ${exchangeRate.toLocaleString('es-PY')})`,
          unitPrice: `₱ ${amountPYG.toLocaleString('es-PY')}`,
          amount: `₱ ${amountPYG.toLocaleString('es-PY')}`
        }
      ];

      yPos += rowHeight;
      let isEvenRow = false;

      rows.forEach((row, index) => {
        // Alternate row colors
        if (isEvenRow) {
          doc.rect(tableX, yPos, tableWidth, rowHeight).fillColor('#f8f9fa').fill();
        }

        doc.rect(tableX, yPos, tableWidth, rowHeight).strokeColor('#e5e7eb').stroke();

        doc.fontSize(10).fillColor('#000');
        doc.text(row.qty, tableX + 15, yPos + 10);
        doc.text(row.description, tableX + 80, yPos + 10);
        doc.text(row.unitPrice, tableX + 320, yPos + 10);
        doc.text(row.amount, tableX + 420, yPos + 10);

        yPos += rowHeight;
        isEvenRow = !isEvenRow;
      });

      // Add 8 empty rows like in the example
      for (let i = 0; i < 8; i++) {
        if (isEvenRow) {
          doc.rect(tableX, yPos, tableWidth, rowHeight).fillColor('#f8f9fa').fill();
        }
        doc.rect(tableX, yPos, tableWidth, rowHeight).strokeColor('#e5e7eb').stroke();
        yPos += rowHeight;
        isEvenRow = !isEvenRow;
      }

      // Totals section on the right like example
      yPos += 20;
      const totalsX = 350;
      const totalsWidth = 145;

      // Subtotal USD
      doc.fontSize(8).fillColor('#475569');
      doc.text('Subtotal USD:', totalsX + 12, yPos + 8);
      doc.text(`${amountUSD.toFixed(2)}`, totalsX + 130, yPos + 8);

      doc.text('Subtotal PYG:', totalsX + 12, yPos + 20);
      doc.text(`${amountPYG.toLocaleString('es-PY')}`, totalsX + 120, yPos + 20);

      doc.text('IVA (Exento):', totalsX + 12, yPos + 32);
      doc.text('0.00%', totalsX + 130, yPos + 32);

      // Balance due with blue background like example
      doc.rect(totalsX, yPos + 44, totalsBoxWidth, 41).fillColor('#2563eb').fill();
      doc.fontSize(10).fillColor('#ffffff');
      doc.text('TOTAL USD:', totalsX + 12, yPos + 50);
      doc.text(`${amountUSD.toFixed(2)}`, totalsX + 130, yPos + 50);
      doc.text('TOTAL PYG:', totalsX + 12, yPos + 65);
      doc.text(`${amountPYG.toLocaleString('es-PY')}`, totalsX + 130, yPos + 65);

      // Payment information
      yPos += 80;
      doc.fontSize(11).fillColor('#000').text('Información de la Etapa de Pago:', leftMargin, yPos);
      yPos += 20;
      doc.fontSize(10).fillColor('#374151');
      doc.text(`• Esta es la etapa ${stageNumber} de ${totalStages} del proyecto`, leftMargin, yPos);
      doc.text(`• Estado: PAGADO ✓`, leftMargin, yPos + 15);
      doc.text(`• Método de pago: ${stage[0].paymentMethod || 'Transferencia Bancaria'}`, leftMargin, yPos + 30);
      doc.text(`• Fecha de pago: ${stage[0].paidAt ? new Date(stage[0].paidAt).toLocaleDateString('es-PY') : issueDate}`, leftMargin, yPos + 45);
      doc.text(`• Tipo de cambio aplicado: 1 USD = ₱ ${exchangeRate.toLocaleString('es-PY')}`, leftMargin, yPos + 60);
      doc.text(`Monto en guaraníes: ${amountPYG.toLocaleString('es-PY')} PYG`, leftMargin, yPos + 75);

      // Footer message like example
      yPos += 80;
      doc.fontSize(16).fillColor('#2563eb').text('¡Gracias por confiar en SoftwarePar!', leftMargin, yPos, { align: 'center', width: contentWidth });

      // Company footer info
      yPos += 40;
      doc.fontSize(9).fillColor('#6b7280');
      doc.text('SoftwarePar S.R.L. • RUC: En proceso • Paraguay', leftMargin, yPos, { align: 'center', width: contentWidth });
      doc.text('Email: softwarepar.lat@gmail.com • Tel: +595 985 990 046', leftMargin, yPos + 12, { align: 'center', width: contentWidth });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error("❌ Error downloading stage invoice:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Error interno del servidor",
          error: process.env.NODE_ENV === 'development' ? error.message : 'Error al generar factura'
        });
      }
    }
  });

  // Endpoint para descargar Boleta RESIMPLE (versión simplificada según SET Paraguay)
  app.get("/api/client/stage-invoices/:stageId/download-resimple", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const stageId = parseInt(req.params.stageId);

      if (isNaN(stageId)) {
        return res.status(400).json({ message: "ID de etapa inválido" });
      }

      // Get stage info
      const stage = await db.select().from(paymentStages).where(eq(paymentStages.id, stageId)).limit(1);
      if (!stage[0]) {
        return res.status(404).json({ message: "Etapa no encontrada" });
      }

      // Get project info
      const project = await storage.getProject(stage[0].projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      // Verificar que la etapa pertenece al cliente
      if (project.clientId !== req.user!.id) {
        return res.status(403).json({ message: "No tienes permisos para ver esta factura" });
      }

      // Verificar que la etapa esté pagada
      if (stage[0].status !== 'paid') {
        return res.status(400).json({ message: "Esta etapa aún no ha sido pagada" });
      }

      // Get company billing info
      const companyInfo = await db
        .select()
        .from(companyBillingInfo)
        .where(eq(companyBillingInfo.isActive, true))
        .orderBy(sql`${companyBillingInfo.updatedAt} DESC`)
        .limit(1);

      // Get client billing info
      const clientInfo = await db
        .select()
        .from(clientBillingInfo)
        .where(eq(clientBillingInfo.userId, req.user!.id))
        .limit(1);

      // Get all stages to determine stage info
      const allStages = await storage.getPaymentStages(stage[0].projectId);
      const sortedStages = allStages.sort((a: any, b: any) => a.requiredProgress - b.requiredProgress);
      const stageNumber = sortedStages.findIndex(s => s.id === stage[0].id) + 1;
      const totalStages = sortedStages.length;

      // SIEMPRE usar el tipo de cambio que se guardó al momento del pago
      let exchangeRate: number;
      if (stage[0].exchangeRateUsed) {
        exchangeRate = parseFloat(stage[0].exchangeRateUsed);
        console.log(`✅ Usando tipo de cambio GUARDADO al momento del pago: ${exchangeRate} PYG/USD`);
      } else {
        const exchangeRateData = await storage.getCurrentExchangeRate();
        exchangeRate = exchangeRateData ? parseFloat(exchangeRateData.usdToGuarani) : 7300;
        console.log(`⚠️ Pago antiguo sin tipo de cambio guardado. Guardando tipo de cambio actual (${exchangeRate}) para este pago.`);

        await db.update(paymentStages)
          .set({
            exchangeRateUsed: exchangeRate.toString(),
            updatedAt: new Date()
          })
          .where(eq(paymentStages.id, stageId));
      }

      const amountUSD = parseFloat(stage[0].amount);
      const amountPYG = Math.round(amountUSD * exchangeRate);

      const issueDate = new Date().toLocaleDateString('es-PY');

      // Extract company data before creating PDF (with fallbacks)
      const company = companyInfo && companyInfo.length > 0 ? companyInfo[0] : null;
      const client = clientInfo && clientInfo.length > 0 ? clientInfo[0] : null;

      // ** OBTENER DATOS DE FACTURACIÓN ELECTRÓNICA **
      const invoiceData = await db
        .select()
        .from(invoices)
        .where(eq(invoices.paymentStageId, stageId))
        .limit(1);

      let cdcInfo = null;
      if (invoiceData.length > 0 && invoiceData[0].sifenCDC) {
        cdcInfo = {
          cdc: invoiceData[0].sifenCDC,
          qrUrl: invoiceData[0].sifenQR,
          consultaUrl: 'https://ekuatia.set.gov.py/consultas'
        };
        console.log(`📋 Factura electrónica encontrada - CDC: ${cdcInfo.cdc}`);
        console.log(`📱 QR URL: ${cdcInfo.qrUrl ? 'Disponible' : 'No disponible'}`);
      } else {
        console.log(`⚠️ No se encontró factura electrónica para esta etapa`);
      }

      // Check if an invoice already exists for this payment stage
      let boletaNumber: string;
      const existingInvoice = await db
        .select()
        .from(invoices)
        .where(eq(invoices.paymentStageId, stageId))
        .limit(1);

      if (existingInvoice.length > 0 && existingInvoice[0].invoiceNumber) {
        boletaNumber = existingInvoice[0].invoiceNumber;
        console.log(`✅ Reutilizando número de factura existente: ${boletaNumber} para etapa ${stageId}`);
      } else {
        const boletaPrefix = company?.boletaPrefix || '001-001';
        const currentSequence = company?.boletaSequence || 1;
        boletaNumber = `${boletaPrefix}-${String(currentSequence).padStart(7, '0')}`;

        if (company) {
          await db.update(companyBillingInfo)
            .set({ boletaSequence: currentSequence + 1 })
            .where(eq(companyBillingInfo.id, company.id));
        }

        if (existingInvoice.length > 0) {
          const updateData: any = {
            invoiceNumber: boletaNumber,
            updatedAt: new Date()
          };

          if (stage[0].exchangeRateUsed || exchangeRate) {
            updateData.exchangeRateUsed = stage[0].exchangeRateUsed || exchangeRate.toString();
          }

          await db.update(invoices)
            .set(updateData)
            .where(eq(invoices.id, existingInvoice[0].id));
        } else {
          const amountValue = stage[0].amount;
          await db.insert(invoices).values({
            projectId: stage[0].projectId,
            clientId: req.user!.id,
            paymentStageId: stageId,
            invoiceNumber: boletaNumber,
            amount: amountValue,
            totalAmount: amountValue,
            taxAmount: '0.00',
            discountAmount: '0.00',
            currency: 'USD',
            status: 'paid',
            dueDate: new Date(),
            paidDate: stage[0].paidAt || new Date(),
            exchangeRateUsed: exchangeRate.toString(),
          });
        }

        console.log(`✅ Nuevo número de factura generado: ${boletaNumber} para etapa ${stageId}`);
      }

      // Función para convertir número a letras en español
      const numeroALetras = (num: number): string => {
        const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
        const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
        const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

        if (num === 0) return 'CERO';
        if (num === 100) return 'CIEN';

        let letras = '';

        // Millones
        if (num >= 1000000) {
          const millones = Math.floor(num / 1000000);
          letras += (millones === 1 ? 'UN MILLON ' : numeroALetras(millones) + ' MILLONES ');
          num %= 1000000;
        }

        // Miles
        if (num >= 1000) {
          const miles = Math.floor(num / 1000);
          letras += (miles === 1 ? 'MIL ' : numeroALetras(miles) + ' MIL ');
          num %= 1000;
        }

        // Centenas
        if (num >= 100) {
          letras += centenas[Math.floor(num / 100)] + ' ';
          num %= 100;
        }

        // Decenas y unidades
        if (num >= 30) {
          letras += decenas[Math.floor(num / 10)];
          if (num % 10 > 0) letras += ' Y ' + unidades[num % 10];
        } else if (num >= 20) {
          const especiales = ['VEINTE', 'VEINTIUNO', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
          letras += especiales[num - 20];
        } else if (num >= 10) {
          const especiales10 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
          letras += especiales10[num - 10];
        } else if (num > 0) {
          letras += unidades[num];
        }

        return letras.trim();
      };

      const montoEnLetras = `${numeroALetras(amountPYG)} GUARANIES`;

      // Create professional PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 30,
        layout: 'portrait'
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="SoftwarePar_Boleta_RESIMPLE_INV-STAGE-${stage[0].projectId}-${stageNumber}.pdf"`);

      doc.on('error', (error) => {
        console.error('Error generating PDF:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error generating PDF" });
        }
      });

      doc.pipe(res);

      const pageWidth = 595;
      const leftMargin = 30;
      const rightMargin = 30;
      const contentWidth = pageWidth - leftMargin - rightMargin;

      let yPos = 30;

      // ==> HEADER CON CUADRO Y LOGO <==
      // Cuadro superior con borde doble
      doc.rect(leftMargin, yPos, contentWidth, 70).strokeColor('#1e3a8a').lineWidth(2).stroke();
      doc.rect(leftMargin + 2, yPos + 2, contentWidth - 4, 66).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      const logoPath = path.join(__dirname, '../attached_assets/logo_1_1760547877884.png');
      try {
        doc.image(logoPath, leftMargin + 8, yPos + 15, { fit: [150, 40], align: 'left', valign: 'center' });
      } catch (e) {
        doc.fontSize(18).fillColor('#1e3a8a').font('Helvetica-Bold').text('SoftwarePar', leftMargin + 15, yPos + 25);
      }

      // Información del documento en cuadro derecho con fondo
      const rightHeaderX = pageWidth - 210;
      doc.rect(rightHeaderX - 5, yPos + 8, 185, 54).fillColor('#f8fafc').fill();
      doc.rect(rightHeaderX - 5, yPos + 8, 185, 54).strokeColor('#1e3a8a').lineWidth(1).stroke();

      doc.fontSize(14).fillColor('#1e3a8a').font('Helvetica-Bold').text('BOLETA RESIMPLE', rightHeaderX, yPos + 12);
      doc.fontSize(8).fillColor('#475569').font('Helvetica').text('Régimen RESIMPLE - SET Paraguay', rightHeaderX, yPos + 30);
      doc.fontSize(9).fillColor('#000000').font('Helvetica-Bold').text(project.name, rightHeaderX, yPos + 45);

      yPos += 80;

      // ==> CUADRO DE INFORMACIÓN DE LA FACTURA <==
      const infoBoxHeight = 50;
      doc.rect(leftMargin, yPos, contentWidth, infoBoxHeight).strokeColor('#1e3a8a').lineWidth(1.5).stroke();
      doc.rect(leftMargin + 1, yPos + 1, contentWidth - 2, infoBoxHeight - 2).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      // Fondo de encabezados
      doc.rect(leftMargin, yPos, contentWidth, 18).fillColor('#f1f5f9').fill();

      // Líneas divisorias verticales
      doc.moveTo(leftMargin + contentWidth * 0.33, yPos).lineTo(leftMargin + contentWidth * 0.33, yPos + infoBoxHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      doc.moveTo(leftMargin + contentWidth * 0.66, yPos).lineTo(leftMargin + contentWidth * 0.66, yPos + infoBoxHeight).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      // Primera columna
      doc.fontSize(7).fillColor('#475569').font('Helvetica-Bold').text('BOLETA No:', leftMargin + 8, yPos + 5);
      doc.fontSize(10).fillColor('#1e3a8a').font('Helvetica-Bold').text(boletaNumber, leftMargin + 8, yPos + 20);

      // Segunda columna
      doc.fontSize(7).fillColor('#475569').font('Helvetica-Bold').text('FECHA:', leftMargin + contentWidth * 0.33 + 8, yPos + 5);
      doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold').text(issueDate, leftMargin + contentWidth * 0.33 + 8, yPos + 20);

      // Tercera columna
      doc.fontSize(7).fillColor('#475569').font('Helvetica-Bold').text('ETAPA:', leftMargin + contentWidth * 0.66 + 8, yPos + 5);
      doc.fontSize(10).fillColor('#000000').font('Helvetica-Bold').text(`${stageNumber} de ${totalStages}`, leftMargin + contentWidth * 0.66 + 8, yPos + 20);

      // Información de timbrado en fila inferior
      if (company?.timbradoNumber) {
        doc.fontSize(7).fillColor('#475569').font('Helvetica').text('TIMBRADO No:', leftMargin + 8, yPos + 35);
        doc.fontSize(8).fillColor('#000000').font('Helvetica-Bold').text(company.timbradoNumber, leftMargin + 62, yPos + 35);

        if (company?.vigenciaTimbrado && company?.vencimientoTimbrado) {
          doc.fontSize(7).fillColor('#475569').font('Helvetica').text('VIGENCIA:', leftMargin + contentWidth * 0.5, yPos + 35);
          doc.fontSize(8).fillColor('#000000').font('Helvetica-Bold').text(`${company.vigenciaTimbrado} - ${company.vencimientoTimbrado}`, leftMargin + contentWidth * 0.5 + 45, yPos + 35);
        }
      }

      yPos += infoBoxHeight + 12;

      // ==> CUADROS DE EMPRESA Y CLIENTE <==
      const columnWidth = (contentWidth - 12) / 2;
      const boxHeight = 95;

      // Cuadro de la empresa con bordes profesionales
      doc.rect(leftMargin, yPos, columnWidth, boxHeight).strokeColor('#1e3a8a').lineWidth(1.5).stroke();
      doc.rect(leftMargin + 1, yPos + 1, columnWidth - 2, boxHeight - 2).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      // Header empresa
      doc.rect(leftMargin, yPos, columnWidth, 20).fillColor('#1e3a8a').fill();
      doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold').text('DATOS DE LA EMPRESA', leftMargin + 8, yPos + 6);

      doc.fontSize(8).fillColor('#1e293b').font('Helvetica');
      const displayName = company?.titularName || company?.companyName || 'Jhoni Fabián Benítez De La Cruz';
      doc.text(`Titular: ${displayName}`, leftMargin + 8, yPos + 25, { width: columnWidth - 16 });
      doc.text(`RUC: ${company?.ruc || 'En proceso'}`, leftMargin + 8, yPos + 38);
      doc.text(`Tel: ${company?.phone || '+595 985 990 046'}`, leftMargin + 8, yPos + 50);
      doc.text(`Email: ${company?.email || 'softwarepar.lat@gmail.com'}`, leftMargin + 8, yPos + 62, { width: columnWidth - 16 });
      doc.text(`Dir: ${company?.address || 'Paraguay'}`, leftMargin + 8, yPos + 74, { width: columnWidth - 16 });

      // Cuadro del cliente con bordes profesionales
      const rightColumnX = leftMargin + columnWidth + 12;
      doc.rect(rightColumnX, yPos, columnWidth, boxHeight).strokeColor('#1e3a8a').lineWidth(1.5).stroke();
      doc.rect(rightColumnX + 1, yPos + 1, columnWidth - 2, boxHeight - 2).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      // Header cliente
      doc.rect(rightColumnX, yPos, columnWidth, 20).fillColor('#1e3a8a').fill();
      doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold').text('DATOS DEL CLIENTE', rightColumnX + 8, yPos + 6);

      doc.fontSize(8).fillColor('#1e293b').font('Helvetica');
      const clientName = client?.legalName || req.user!.fullName;
      const clientDoc = client?.documentNumber || req.user?.id || 'N/A';

      doc.text(`Nombre: ${clientName}`, rightColumnX + 8, yPos + 25, { width: columnWidth - 16 });
      doc.text(`${client?.documentType || 'CI'}: ${clientDoc}`, rightColumnX + 8, yPos + 38);
      doc.text(`Tel: ${client?.phone || 'N/A'}`, rightColumnX + 8, yPos + 50);
      doc.text(`Email: ${client?.email || req.user!.email}`, rightColumnX + 8, yPos + 62, { width: columnWidth - 16 });
      doc.text(`Dir: ${client?.address || 'N/A'}`, rightColumnX + 8, yPos + 74, { width: columnWidth - 16 });

      yPos += boxHeight + 12;

      // ==> TABLA DE SERVICIOS <==
      // Definir anchos de columnas para mantener consistencia
      const cantWidth = 50;
      const descWidth = 285;
      const precioWidth = 110;
      const totalWidth = 90;

      // Header de tabla con diseño profesional
      doc.rect(leftMargin, yPos, contentWidth, 25).fillColor('#1e3a8a').fill();

      // Líneas divisorias verticales en el header
      let tableX = leftMargin;
      doc.moveTo(tableX + cantWidth, yPos).lineTo(tableX + cantWidth, yPos + 25).strokeColor('#2563eb').lineWidth(1).stroke();
      doc.moveTo(tableX + cantWidth + descWidth, yPos).lineTo(tableX + cantWidth + descWidth, yPos + 25).strokeColor('#2563eb').lineWidth(1).stroke();
      doc.moveTo(tableX + cantWidth + descWidth + precioWidth, yPos).lineTo(tableX + cantWidth + descWidth + precioWidth, yPos + 25).strokeColor('#2563eb').lineWidth(1).stroke();

      doc.fontSize(9).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('CANT.', leftMargin + 12, yPos + 8);
      doc.text('DESCRIPCIÓN DEL SERVICIO', leftMargin + cantWidth + 10, yPos + 8);
      doc.text('PRECIO UNIT.', leftMargin + cantWidth + descWidth + 10, yPos + 8);
      doc.text('TOTAL', leftMargin + cantWidth + descWidth + precioWidth + 15, yPos + 8);

      doc.rect(leftMargin, yPos, contentWidth, 25).strokeColor('#1e3a8a').lineWidth(1.5).stroke();
      yPos += 25;

      // Contenido de la tabla con bordes
      doc.rect(leftMargin, yPos, contentWidth, 45).fillColor('#ffffff').fill();
      doc.rect(leftMargin, yPos, contentWidth, 45).strokeColor('#cbd5e1').lineWidth(1).stroke();

      // Líneas divisorias verticales en el contenido
      doc.moveTo(tableX + cantWidth, yPos).lineTo(tableX + cantWidth, yPos + 45).strokeColor('#cbd5e1').lineWidth(1).stroke();
      doc.moveTo(tableX + cantWidth + descWidth, yPos).lineTo(tableX + cantWidth + descWidth, yPos + 45).strokeColor('#cbd5e1').lineWidth(1).stroke();
      doc.moveTo(tableX + cantWidth + descWidth + precioWidth, yPos).lineTo(tableX + cantWidth + descWidth + precioWidth, yPos + 45).strokeColor('#cbd5e1').lineWidth(1).stroke();

      doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text('1', leftMargin + 18, yPos + 10);

      doc.fontSize(9).fillColor('#1e293b').font('Helvetica');
      doc.text(`${stage[0].stageName}`, leftMargin + cantWidth + 10, yPos + 6, { width: descWidth - 20 });
      doc.fontSize(8).fillColor('#475569');
      doc.text(`Proyecto: ${project.name}`, leftMargin + cantWidth + 10, yPos + 18, { width: descWidth - 20 });
      doc.text(`Tipo de cambio: 1 USD = Gs ${exchangeRate.toLocaleString('es-PY')}`, leftMargin + cantWidth + 10, yPos + 30);

      // Columna Precio Unitario - alineado a la derecha
      const precioUnitX = leftMargin + cantWidth + descWidth + 5;
      doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold');
      const precioUSDText = `USD ${amountUSD.toFixed(2)}`;
      doc.text(precioUSDText, precioUnitX, yPos + 8, { width: precioWidth - 10, align: 'right' });

      doc.fontSize(8).fillColor('#475569').font('Helvetica');
      const precioGsText = `Gs ${amountPYG.toLocaleString('es-PY')}`;
      doc.text(precioGsText, precioUnitX, yPos + 22, { width: precioWidth - 10, align: 'right' });

      // Columna Total - alineado a la derecha
      const totalX = leftMargin + cantWidth + descWidth + precioWidth + 5;
      doc.fontSize(9).fillColor('#1e3a8a').font('Helvetica-Bold');
      const totalUSDText = `USD ${amountUSD.toFixed(2)}`;
      doc.text(totalUSDText, totalX, yPos + 8, { width: totalWidth - 10, align: 'right' });

      doc.fontSize(8).fillColor('#1e3a8a').font('Helvetica');
      const totalGsText = `Gs ${amountPYG.toLocaleString('es-PY')}`;
      doc.text(totalGsText, totalX, yPos + 22, { width: totalWidth - 10, align: 'right' });

      yPos += 55;

      // ==> CUADRO DE TOTALES CON QR <==
      const totalsBoxWidth = 270;
      const totalsX = pageWidth - rightMargin - totalsBoxWidth;
      const totalsBoxHeight = 115;

      // Cuadro de totales con borde profesional
      doc.rect(totalsX, yPos, totalsBoxWidth, totalsBoxHeight).strokeColor('#1e3a8a').lineWidth(1.5).stroke();
      doc.rect(totalsX + 1, yPos + 1, totalsBoxWidth - 2, totalsBoxHeight - 2).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      // QR Code a la izquierda del cuadro de totales
      if (cdcInfo && cdcInfo.qrUrl) {
        try {
          console.log(`🔍 Generando QR para URL: ${cdcInfo.qrUrl.substring(0, 50)}...`);

          const qrDataUrl = await QRCode.toDataURL(cdcInfo.qrUrl, {
            width: 100,
            margin: 1,
            errorCorrectionLevel: 'M',
            type: 'image/png'
          });

          const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
          doc.image(qrBuffer, leftMargin, yPos + 5, { width: 100, height: 100 });

          // Texto "Escanéame" debajo del QR
          doc.fontSize(7).fillColor('#1e3a8a').font('Helvetica-Bold').text('ESCANEA PARA VERIFICAR', leftMargin, yPos + 108, { width: 100, align: 'center' });
          console.log(`✅ QR Code generado exitosamente`);
        } catch (qrError) {
          console.error('❌ Error generando QR Code:', qrError);
          // Mostrar texto alternativo si falla
          doc.rect(leftMargin, yPos + 5, 100, 100).strokeColor('#cbd5e1').lineWidth(1).stroke();
          doc.fontSize(8).fillColor('#64748b').font('Helvetica').text('[QR no disponible]', leftMargin + 25, yPos + 45);
        }
      } else {
        console.log(`⚠️ No hay URL de QR disponible para generar código`);
        doc.rect(leftMargin, yPos + 5, 100, 100).strokeColor('#cbd5e1').lineWidth(1).stroke();
        doc.fontSize(8).fillColor('#64748b').font('Helvetica').text('[QR no disponible]', leftMargin + 25, yPos + 45);
      }

      // Línea divisoria horizontal en totales
      doc.moveTo(totalsX, yPos + 72).lineTo(totalsX + totalsBoxWidth, yPos + 72).strokeColor('#1e3a8a').lineWidth(1).stroke();

      const labelX = totalsX + 12;
      const valueColumnX = totalsX + 120;
      const valueWidth = totalsBoxWidth - 132;

      doc.fontSize(9).fillColor('#475569').font('Helvetica');
      doc.text('Subtotal USD:', labelX, yPos + 10);
      doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text(`USD ${amountUSD.toFixed(2)}`, valueColumnX, yPos + 10, { width: valueWidth, align: 'right' });

      doc.fontSize(9).fillColor('#475569').font('Helvetica');
      doc.text('Subtotal PYG:', labelX, yPos + 26);
      doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text(`Gs ${amountPYG.toLocaleString('es-PY')}`, valueColumnX, yPos + 26, { width: valueWidth, align: 'right' });

      doc.fontSize(9).fillColor('#475569').font('Helvetica');
      doc.text('IVA (Exento):', labelX, yPos + 42);
      doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text('0.00%', valueColumnX, yPos + 42, { width: valueWidth, align: 'right' });

      // Total destacado con fondo
      doc.rect(totalsX, yPos + 44, totalsBoxWidth, 41).fillColor('#2563eb').fill();
      doc.fontSize(10).fillColor('#ffffff').font('Helvetica-Bold');
      doc.text('TOTAL USD:', labelX, yPos + 50);
      doc.text(`USD ${amountUSD.toFixed(2)}`, valueColumnX, yPos + 50, { width: valueWidth, align: 'right' });
      doc.text('TOTAL PYG:', labelX, yPos + 65);
      doc.text(`Gs ${amountPYG.toLocaleString('es-PY')}`, valueColumnX, yPos + 65, { width: valueWidth, align: 'right' });

      yPos += totalsBoxHeight + 8;

      // ==> MONTO EN LETRAS <==
      doc.rect(leftMargin, yPos, contentWidth, 28).strokeColor('#1e3a8a').lineWidth(1.5).stroke();
      doc.rect(leftMargin + 1, yPos + 1, contentWidth - 2, 26).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      doc.rect(leftMargin, yPos, contentWidth, 12).fillColor('#f1f5f9').fill();
      doc.fontSize(7).fillColor('#475569').font('Helvetica-Bold').text('MONTO EN LETRAS:', leftMargin + 8, yPos + 3);
      doc.fontSize(9).fillColor('#1e293b').font('Helvetica-Bold').text(montoEnLetras, leftMargin + 8, yPos + 15, { width: contentWidth - 16 });

      yPos += 35;

      // ==> INFORMACIÓN DE PAGO (Cuadro profesional) <==
      const paymentBoxHeight = 50;
      doc.rect(leftMargin, yPos, contentWidth, paymentBoxHeight).strokeColor('#1e3a8a').lineWidth(1.5).stroke();
      doc.rect(leftMargin + 1, yPos + 1, contentWidth - 2, paymentBoxHeight - 2).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

      // Header del cuadro
      doc.rect(leftMargin, yPos, contentWidth, 18).fillColor('#f1f5f9').fill();
      doc.fontSize(9).fillColor('#1e3a8a').font('Helvetica-Bold').text('INFORMACIÓN DE PAGO:', leftMargin + 8, yPos + 5);

      // Contenido organizado en dos columnas
      const paymentTextY = yPos + 23;
      const col1X = leftMargin + 10;
      const col2X = leftMargin + contentWidth / 2 + 10;

      doc.fontSize(8).fillColor('#475569').font('Helvetica');

      // Columna 1
      doc.text(`Método: `, col1X, paymentTextY);
      doc.fontSize(8).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text(`${stage[0].paymentMethod || 'Transferencia Bancaria'}`, col1X + 42, paymentTextY);

      doc.fontSize(8).fillColor('#475569').font('Helvetica');
      doc.text(`Estado: `, col1X, paymentTextY + 14);
      doc.fontSize(8).fillColor('#059669').font('Helvetica-Bold');
      doc.text(`PAGADO ✓`, col1X + 42, paymentTextY + 14);

      // Columna 2
      doc.fontSize(8).fillColor('#475569').font('Helvetica');
      doc.text(`Fecha: `, col2X, paymentTextY);
      doc.fontSize(8).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text(`${stage[0].paidAt ? new Date(stage[0].paidAt).toLocaleDateString('es-PY') : issueDate}`, col2X + 35, paymentTextY);

      doc.fontSize(8).fillColor('#475569').font('Helvetica');
      doc.text(`TC aplicado: `, col2X, paymentTextY + 14);
      doc.fontSize(8).fillColor('#1e293b').font('Helvetica-Bold');
      doc.text(`1 USD = Gs ${exchangeRate.toLocaleString('es-PY')}`, col2X + 60, paymentTextY + 14);

      yPos += paymentBoxHeight + 8;

      // ==> FOOTER CON INFO FISCAL <==
      // Línea separadora
      doc.moveTo(leftMargin, yPos).lineTo(pageWidth - rightMargin, yPos).lineWidth(1).strokeColor('#cbd5e1').stroke();
      yPos += 12;

      doc.fontSize(7).fillColor('#475569').font('Helvetica');
      doc.text(`Régimen Tributario: ${company?.taxRegime || 'Régimen General'} • IVA Exento (Servicios Digitales - Ley 125/91)`, leftMargin, yPos, {
        width: contentWidth,
        align: 'center'
      });
      yPos += 15;

      // ** SECCIÓN DE VERIFICACIÓN ELECTRÓNICA CON QR **
      if (cdcInfo && cdcInfo.cdc) {
        yPos += 12;

        // Recuadro de verificación con borde profesional doble
        doc.rect(leftMargin, yPos, contentWidth, 150).strokeColor('#1e3a8a').lineWidth(2).stroke();
        doc.rect(leftMargin + 2, yPos + 2, contentWidth - 4, 146).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

        // Header de verificación
        doc.rect(leftMargin, yPos, contentWidth, 22).fillColor('#1e3a8a').fill();
        doc.fontSize(11).fillColor('#ffffff').font('Helvetica-Bold').text('VERIFICACIÓN ELECTRÓNICA - e-Kuatia SET', leftMargin + 10, yPos + 6);

        // QR CODE a la izquierda
        const qrSize = 100;
        const qrX = leftMargin + 20;
        const qrY = yPos + 30;

        // Generar QR usando el URL de cdcInfo
        if (cdcInfo.qrUrl && cdcInfo.qrUrl.trim() !== '') {
          try {
            console.log(`🔍 Generando QR final para verificación - URL length: ${cdcInfo.qrUrl.length}`);

            const qrDataUrl = await QRCode.toDataURL(cdcInfo.qrUrl, {
              width: qrSize,
              margin: 1,
              errorCorrectionLevel: 'M',
              type: 'image/png'
            });

            // Convertir data URL a buffer
            const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');
            doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize });
            console.log(`✅ QR de verificación generado exitosamente`);
          } catch (qrError) {
            console.error('❌ Error generando QR de verificación:', qrError);
            // Fallback: mostrar texto centrado si falla el QR
            doc.rect(qrX, qrY, qrSize, qrSize).strokeColor('#cbd5e1').lineWidth(1).stroke();
            doc.fontSize(8).fillColor('#64748b').font('Helvetica').text('[QR no disponible]', qrX + 15, qrY + 45);
          }
        } else {
          // Si no hay URL de QR, mostrar mensaje
          console.log('⚠️ No hay URL de QR disponible para esta factura');
          doc.rect(qrX, qrY, qrSize, qrSize).strokeColor('#cbd5e1').lineWidth(1).stroke();
          doc.fontSize(8).fillColor('#64748b').font('Helvetica').text('[QR no disponible]', qrX + 15, qrY + 45);
        }

        // Texto a la derecha del QR con mejor alineación
        const textX = qrX + qrSize + 20;
        const textWidth = contentWidth - qrSize - 60;
        let textY = qrY;

        doc.fontSize(8).fillColor('#1e293b').font('Helvetica');
        doc.text('Consulte la validez de este Documento Electrónico con el número de CDC impreso:', textX, textY, {
          width: textWidth,
          align: 'left'
        });

        textY += 20;
        doc.fontSize(7).fillColor('#1e3a8a').font('Helvetica-Bold');
        doc.text(cdcInfo.consultaUrl, textX, textY, {
          width: textWidth,
          link: cdcInfo.consultaUrl,
          underline: true,
          align: 'left'
        });

        textY += 18;
        doc.fontSize(7).fillColor('#475569').font('Helvetica-Bold');
        doc.text('CDC:', textX, textY, { width: textWidth, align: 'left' });
        textY += 10;
        doc.fontSize(6).fillColor('#1e293b').font('Helvetica');
        doc.text(cdcInfo.cdc, textX, textY, { width: textWidth, align: 'left' });

        textY += 18;
        doc.fontSize(6.5).fillColor('#dc2626').font('Helvetica-Bold');
        doc.text('ESTE DOCUMENTO ES UNA REPRESENTACIÓN', textX, textY, {
          width: textWidth,
          align: 'left'
        });
        doc.text('GRÁFICA DE UN DOCUMENTO ELECTRÓNICO (XML)', textX, textY + 8, {
          width: textWidth,
          align: 'left'
        });

        // Nota al pie del recuadro - bien centrada
        yPos += 138;
        doc.fontSize(6).fillColor('#475569').font('Helvetica');
        doc.text('Si su documento electrónico presenta algún error puede solicitar la modificación dentro de las 72 horas siguientes de la emisión de este comprobante.', leftMargin + 20, yPos, {
          width: contentWidth - 40,
          align: 'center'
        });

        yPos += 22;
      }

      // Agradecimiento centrado
      doc.fontSize(10).fillColor('#1e293b');
      doc.text('¡Gracias por confiar en SoftwarePar!', leftMargin, yPos, {
        align: 'center',
        width: contentWidth
      });

      // Finalize PDF
      doc.end();

    } catch (error) {
      console.error("❌ Error downloading RESIMPLE invoice:", error);
      if (!res.headersSent) {
        res.status(500).json({
          message: "Error interno del servidor",
          error: process.env.NODE_ENV === 'development' ? error.message : 'Error al generar Boleta RESIMPLE'
        });
      }
    }
  });


  // Payment Routes - TODO: Implementar nuevo sistema de pagos

  // Portfolio Routes
  app.get("/api/portfolio", async (req, res) => {
    try {
      const portfolioItems = await storage.getPortfolio();
      res.json(portfolioItems);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/portfolio", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const portfolioData = req.body;
      const portfolio = await storage.createPortfolio(portfolioData);
      res.status(201).json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/portfolio/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      const updates = req.body;
      const portfolio = await storage.updatePortfolio(portfolioId, updates);
      res.json(portfolio);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/portfolio/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const portfolioId = parseInt(req.params.id);
      await storage.deletePortfolio(portfolioId);
      res.json({ message: "Elemento del portfolio eliminado" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Client billing routes
  app.get("/api/client/invoices", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log(`📄 Obteniendo facturas para cliente: ${req.user!.id}`);

      // Obtener facturas tradicionales
      const allTraditionalInvoices = await storage.getInvoicesByClient(req.user!.id);
      console.log(`💳 Facturas tradicionales encontradas: ${allTraditionalInvoices.length}`);

      // Filtrar facturas tradicionales que NO tienen paymentStageId (para evitar duplicados)
      const traditionalInvoices = allTraditionalInvoices.filter(inv => !inv.paymentStageId);
      console.log(`💳 Facturas tradicionales sin etapa vinculada: ${traditionalInvoices.length}`);

      // Obtener proyectos del cliente
      const projects = await storage.getProjects(req.user!.id, req.user!.role);
      console.log(`🏗️ Proyectos del cliente: ${projects.length}`);

      // Obtener etapas de pago pagadas de todos los proyectos
      const stageInvoices = [];
      for (const project of projects) {
        const stages = await storage.getPaymentStages(project.id);
        const paidStages = stages.filter((stage: any) => stage.status === 'paid');

        for (const stage of paidStages) {
          // Buscar si ya existe una factura para esta etapa
          const existingInvoice = await db
            .select()
            .from(invoices)
            .where(eq(invoices.paymentStageId, stage.id))
            .limit(1);

          stageInvoices.push({
            id: stage.id,
            invoiceNumber: existingInvoice[0]?.invoiceNumber || `STAGE-${stage.id}`,
            projectName: project.name,
            amount: stage.amount,
            status: 'paid',
            dueDate: stage.paidAt || stage.createdAt,
            paidAt: stage.paidAt,
            createdAt: stage.createdAt,
            downloadUrl: `/api/client/stage-invoices/${stage.id}/download-resimple`,
            stageName: stage.stageName,
            stagePercentage: stage.stagePercentage,
            type: 'stage_payment',
            exchangeRateUsed: stage.exchangeRateUsed || existingInvoice[0]?.exchangeRateUsed,
            paymentStageId: stage.id,
            sifenEstado: existingInvoice[0]?.sifenEstado || 'pendiente',
            sifenCDC: existingInvoice[0]?.sifenCDC,
            sifenQR: existingInvoice[0]?.sifenQR
          });
        }
      }

      console.log(`🏗️ Etapas de pago pagadas encontradas: ${stageInvoices.length}`);

      // Combinar ambas listas (solo facturas tradicionales sin etapa + etapas de pago)
      const allInvoices = [...traditionalInvoices, ...stageInvoices];
      console.log(`📋 Total de facturas a retornar: ${allInvoices.length}`);

      res.json(allInvoices);
    } catch (error) {
      console.error("Error getting client invoices:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app.get("/api/client/billing", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const billingData = await storage.getClientBillingData(req.user!.id);
      res.json(billingData);
    } catch (error) {
      console.error("Error getting client billing data:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/client/payment-methods", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentMethods = await storage.getPaymentMethodsByUser(req.user!.id);
      res.json(paymentMethods);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/client/payment-methods", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentMethodData = {
        ...req.body,
        userId: req.user!.id,
      };
      const paymentMethod = await storage.createPaymentMethod(paymentMethodData);
      res.status(201).json(paymentMethod);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/client/payment-methods/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentMethodId = parseInt(req.params.id);
      const updates = req.body;
      const paymentMethod = await storage.updatePaymentMethod(paymentMethodId, updates);
      res.json(paymentMethod);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/client/payment-methods/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const paymentMethodId = parseInt(req.params.id);
      await storage.deletePaymentMethod(paymentMethodId);
      res.json({ message: "Método de pago eliminado" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/client/transactions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getTransactionsByUser(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Routes
  app.get("/api/admin/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Partners Management
  app.get("/api/admin/partners", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const partners = await storage.getAllPartnersForAdmin();
      res.json(partners);
    } catch (error) {
      console.error("Error getting partners for admin:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/partners/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getPartnerStatsForAdmin();
      res.json(stats);
    } catch (error) {
      console.error("Error getting partner stats for admin:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/partners/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const partnerId = parseInt(req.params.id);
      const updates = req.body;
      const partner = await storage.updatePartner(partnerId, updates);
      res.json(partner);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Users Stats
  app.get("/api/admin/users/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getUserStatsForAdmin();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/users", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const userData = req.body;

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "El email ya está registrado" });
      }

      const hashedPassword = await hashPassword(userData.password);
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create partner if role is partner
      if (userData.role === "partner") {
        const referralCode = `PAR${user.id}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
        await storage.createPartner({
          userId: user.id,
          referralCode,
          commissionRate: "25.00",
          totalEarnings: "0.00",
        });
      }

      // Send welcome email
      try {
        await sendWelcomeEmail(user.email, user.fullName);
      } catch (emailError) {
        console.error("Error sending welcome email:", emailError);
      }

      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        user: userWithoutPassword,
        message: "Usuario creado exitosamente",
      });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/users/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }

      // No permitir que un admin se elimine a sí mismo
      if (req.user!.id === userId) {
        return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
      }

      await storage.deleteUser(userId);

      res.json({ message: "Usuario eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting user:", error);

      if (error.message === "Usuario no encontrado") {
        return res.status(404).json({ message: error.message });
      }

      if (error.message === "No se puede eliminar el último administrador del sistema") {
        return res.status(400).json({ message: error.message });
      }

      if (error.message === "No puedes eliminar tu propia cuenta") {
        return res.status(400).json({ message: error.message });
      }

      res.status(500).json({
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/projects", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const projects = await storage.getAllProjectsForAdmin();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/projects/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const updates = req.body;

      console.log("Updating project:", projectId, "with data:", updates);

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID de proyecto inválido" });
      }

      // Validate dates if provided
      if (updates.startDate && updates.startDate !== null) {
        const startDate = new Date(updates.startDate);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ message: "Fecha de inicio inválida" });
        }
      }

      if (updates.deliveryDate && updates.deliveryDate !== null) {
        const deliveryDate = new Date(updates.deliveryDate);
        if (isNaN(deliveryDate.getTime())) {
          return res.status(400).json({ message: "Fecha de entrega inválida" });
        }
      }

      const project = await storage.updateProject(projectId, updates);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  app.delete("/api/admin/projects/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const projectId = parseInt(req.params.id);

      if (isNaN(projectId)) {
        return res.status(400).json({ message: "ID de proyecto inválido" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Proyecto no encontrado" });
      }

      await storage.deleteProject(projectId);
      res.json({ message: "Proyecto eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      });
    }
  });

  app.get("/api/admin/projects/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getProjectStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Analytics Routes
  app.get("/api/admin/analytics", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const period = req.query.period || '30';
      const analytics = await storage.getAnalyticsData(parseInt(period as string));
      res.json(analytics);
    } catch (error) {
      console.error("Error getting analytics data:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/analytics/revenue", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const period = req.query.period || '30';
      const revenueData = await storage.getRevenueAnalytics(parseInt(period as string));
      res.json(revenueData);
    } catch (error) {
      console.error("Error getting revenue analytics:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/analytics/users", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const period = req.query.period || '30';
      const userAnalytics = await storage.getUserAnalytics(parseInt(period as string));
      res.json(userAnalytics);
    } catch (error) {
      console.error("Error getting user analytics:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/analytics/export", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const format = req.query.format || 'pdf';
      const analytics = await storage.getAnalyticsData(30);

      // TODO: Implement PDF/Excel export
      res.json({ message: `Exporting analytics as ${format}`, data: analytics });
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Client Billing Information Routes
  app.get("/api/client/billing-info", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const billingInfo = await db
        .select()
        .from(clientBillingInfo)
        .where(eq(clientBillingInfo.userId, req.user!.id))
        .limit(1);

      if (billingInfo.length === 0) {
        return res.status(404).json({ message: "No se encontraron datos de facturación" });
      }

      res.json(billingInfo[0]);
    } catch (error) {
      console.error("Error getting client billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/client/billing-info", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const billingData = {
        ...req.body,
        userId: req.user!.id,
      };

      const [newBillingInfo] = await db
        .insert(clientBillingInfo)
        .values(billingData)
        .returning();

      res.status(201).json(newBillingInfo);
    } catch (error) {
      console.error("Error creating client billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/client/billing-info/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const billingId = parseInt(req.params.id);
      const updates = req.body;

      const [updatedBillingInfo] = await db
        .update(clientBillingInfo)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(
          eq(clientBillingInfo.id, billingId),
          eq(clientBillingInfo.userId, req.user!.id)
        ))
        .returning();

      if (!updatedBillingInfo) {
        return res.status(404).json({ message: "Datos de facturación no encontrados" });
      }

      res.json(updatedBillingInfo);
    } catch (error) {
      console.error("Error updating client billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Company Billing Information Routes (Admin only)
  app.get("/api/admin/company-billing-info", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const companyInfo = await db
        .select()
        .from(companyBillingInfo)
        .where(eq(companyBillingInfo.isActive, true))
        .orderBy(desc(companyBillingInfo.updatedAt))
        .limit(1);

      if (companyInfo.length === 0) {
        return res.status(404).json({ message: "No se encontraron datos de facturación de la empresa" });
      }

      res.json(companyInfo[0]);
    } catch (error) {
      console.error("Error getting company billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/company-billing-info", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      // Desactivar datos existentes
      await db
        .update(companyBillingInfo)
        .set({ isActive: false, updatedAt: new Date() });

      // Crear nuevos datos
      const [newCompanyInfo] = await db
        .insert(companyBillingInfo)
        .values({ ...req.body, isActive: true })
        .returning();

      res.status(201).json(newCompanyInfo);
    } catch (error) {
      console.error("Error creating company billing info:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/company-billing-info/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const companyId = parseInt(req.params.id);
      const updates = req.body;

      console.log(`Updating company billing info ID ${companyId}:`, updates);

      // Validate required fields for company billing
      if (!updates.companyName || !updates.ruc || !updates.address || !updates.city) {
        return res.status(400).json({
          message: "Campos requeridos faltantes: companyName, ruc, address, city"
        });
      }

      // Desactivar todos los demás registros primero
      await db
        .update(companyBillingInfo)
        .set({ isActive: false, updatedAt: new Date() })
        .where(sql`${companyBillingInfo.id} != ${companyId}`);

      const [updatedCompanyInfo] = await db
        .update(companyBillingInfo)
        .set({
          ...updates,
          updatedAt: new Date(),
          isActive: true // Ensure it remains active
        })
        .where(eq(companyBillingInfo.id, companyId))
        .returning();

      if (!updatedCompanyInfo) {
        return res.status(404).json({ message: "Datos de facturación de la empresa no encontrados" });
      }

      console.log(`✅ Company billing info updated successfully:`, updatedCompanyInfo);
      res.json(updatedCompanyInfo);
    } catch (error) {
      console.error("❌ Error updating company billing info:", error);
      res.status(500).json({
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Admin Invoice Management Routes
  app.get("/api/admin/invoices", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const invoices = await storage.getAllInvoicesForAdmin();
      res.json(invoices);
    } catch (error) {
      console.error("Error getting invoices for admin:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/admin/invoices", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const { projectId, amount, dueDate } = req.body;

      if (!projectId || !amount || !dueDate) {
        return res.status(400).json({ message: "Faltan datos requeridos" });
      }

      const invoice = await storage.createInvoiceForProject(
        parseInt(projectId),
        amount.toString(),
        new Date(dueDate)
      );

      // Notify client about new invoice
      const project = await storage.getProject(parseInt(projectId));
      if (project) {
        await storage.createNotification({
          userId: project.clientId,
          title: "💰 Nueva Factura Generada",
          message: `Se ha generado una nueva factura por $${amount} para el proyecto "${project.name}". Vence el ${new Date(dueDate).toLocaleDateString()}.`,
          type: "info",
        });
      }

      res.status(201).json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/invoices/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "ID de factura inválido" });
      }

      const updateData: any = { status };
      if (status === 'paid') {
        updateData.paidAt = new Date();
      }
      const invoice = await storage.updateInvoice(invoiceId, updateData);

      res.json(invoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/client/invoices/:id/pay", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { paymentMethodId } = req.body;

      if (isNaN(invoiceId) || !paymentMethodId) {
        return res.status(400).json({ message: "Datos inválidos" });
      }

      // Verificar que la factura pertenece al cliente
      const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (!invoice[0] || invoice[0].clientId !== req.user!.id) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      // Crear transacción
      const [transaction] = await db.insert(transactions).values({
        invoiceId: invoiceId,
        paymentMethodId: parseInt(paymentMethodId),
        userId: req.user!.id,
        amount: invoice[0].amount,
        currency: invoice[0].currency,
        status: 'completed',
        transactionId: `TXN_${Date.now()}_${invoiceId}`,
        createdAt: new Date(),
        completedAt: new Date(),
      }).returning();

      // Actualizar estado de la factura
      await storage.updateInvoiceStatus(invoiceId, 'paid', new Date());

      // Notificar al admin
      const adminUsers = await storage.getUsersByRole("admin");
      for (const admin of adminUsers) {
        await storage.createNotification({
          userId: admin.id,
          title: "💰 Pago Recibido",
          message: `El cliente ${req.user!.fullName} ha pagado la factura #${invoiceId} por $${invoice[0].amount}.`,
          type: "success",
        });
      }

      res.json({
        message: "Pago procesado exitosamente",
        transaction: transaction,
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/client/invoices/:id/download", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);

      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "ID de factura inválido" });
      }

      // Verificar que la factura pertenece al cliente
      const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
      if (!invoice[0] || invoice[0].clientId !== req.user!.id) {
        return res.status(404).json({ message: "Factura no encontrada" });
      }

      // TODO: Generate actual PDF
      const pdfContent = `Factura #INV-${new Date().getFullYear()}-${invoiceId.toString().padStart(3, '0')}

Cliente: ${req.user!.fullName}
Monto: $${invoice[0].amount}
Estado: ${invoice[0].status}
Fecha: ${invoice[0].createdAt}

Esta es una factura demo generada por el sistema.`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="factura_${invoiceId}.pdf"`);
      res.send(Buffer.from(pdfContent));
    } catch (error) {
      console.error("Error downloading invoice:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Admin Support Routes
  app.get("/api/admin/tickets", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const tickets = await storage.getAllTicketsForAdmin();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/tickets/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const updates = req.body;
      const ticket = await storage.updateTicket(ticketId, updates);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/admin/tickets/stats", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const stats = await storage.getTicketStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/tickets/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      await storage.deleteTicket(ticketId);
      res.json({ message: "Ticket eliminado exitosamente" });
    } catch (error) {
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });



  // Work Modalities Routes
  app.get("/api/work-modalities", async (req, res) => {
    try {
      const modalities = await storage.getWorkModalities();
      res.json(modalities);
    } catch (error) {
      console.error("Error getting work modalities:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Exchange Rate Configuration Routes
  app.get("/api/admin/exchange-rate", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const currentRate = await storage.getCurrentExchangeRate();
      if (!currentRate) {
        return res.json({
          usdToGuarani: "7300.00",
          isDefault: true,
          updatedAt: new Date(),
          updatedBy: null
        });
      }
      res.json(currentRate);
    } catch (error) {
      console.error("Error getting exchange rate:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/exchange-rate", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const { usdToGuarani } = req.body;

      if (!usdToGuarani || isNaN(parseFloat(usdToGuarani))) {
        return res.status(400).json({ message: "Tipo de cambio inválido" });
      }

      const updatedRate = await storage.updateExchangeRate(usdToGuarani, req.user!.id);

      console.log(`💱 Tipo de cambio actualizado: 1 USD = ${usdToGuarani} PYG por ${req.user!.fullName}`);

      res.json({
        ...updatedRate,
        message: "Tipo de cambio actualizado exitosamente"
      });
    } catch (error) {
      console.error("Error updating exchange rate:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.get("/api/exchange-rate", async (req, res) => {
    try {
      const currentRate = await storage.getCurrentExchangeRate();
      if (!currentRate) {
        return res.json({
          usdToGuarani: "7300.00",
          isDefault: true
        });
      }
      res.json({
        usdToGuarani: currentRate.usdToGuarani,
        isDefault: false,
        updatedAt: currentRate.updatedAt
      });
    } catch (error) {
      console.error("Error getting public exchange rate:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Test endpoint para probar el flujo completo de emails
  app.post("/api/test-email-flow", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      console.log("🧪 Iniciando prueba completa del flujo de emails...");

      // 1. Crear un cliente de prueba
      const testClientEmail = "cliente.prueba@test.com";
      const testClientName = "Cliente de Prueba";

      let testClient;
      try {
        testClient = await storage.getUserByEmail(testClientEmail);
        if (!testClient) {
          const hashedPassword = await hashPassword("123456");
          testClient = await storage.createUser({
            email: testClientEmail,
            password: hashedPassword,
            fullName: testClientName,
            role: "client",
            isActive: true,
          });
          console.log("✅ Cliente de prueba creado:", testClient.email);
        } else {
          console.log("✅ Usando cliente existente:", testClient.email);
        }
      } catch (clientError) {
        console.error("❌ Error creando cliente:", clientError);
        return res.status(500).json({ message: "Error creando cliente de prueba" });
      }

      // 2. Crear proyecto de prueba
      const projectData = {
        name: "Proyecto de Prueba Email - " + new Date().toISOString(),
        description: "Este es un proyecto de prueba para verificar el flujo completo de emails",
        price: "5000.00",
        clientId: testClient.id,
        status: "pending",
        progress: 0,
      };

      let testProject;
      try {
        testProject = await storage.createProject(projectData);
        console.log("✅ Proyecto de prueba creado:", testProject.name);
      } catch (projectError) {
        console.error("❌ Error creando proyecto:", projectError);
        return res.status(500).json({ message: "Error creando proyecto de prueba" });
      }

      // 3. Simular notificaciones de creación de proyecto
      try {
        console.log("📧 Enviando notificaciones de creación de proyecto...");
        const adminUsers = await storage.getUsersByRole("admin");
        const adminIds = adminUsers.map(admin => admin.id);
        await notifyProjectCreated(testClient.id, adminIds, testProject.name, testProject.id);
        console.log("✅ Notificaciones de creación enviadas");
      } catch (notifyError) {
        console.error("❌ Error enviando notificaciones de creación:", notifyError);
      }

      // 4. Simular cambio de estado: pending -> in_progress
      try {
        console.log("📧 Simulando cambio de estado: pending -> in_progress...");
        const updatedProject1 = await storage.updateProject(testProject.id, {
          status: "in_progress",
          progress: 25,
          startDate: new Date()
        });

        await notifyProjectUpdated(
          testClient.id,
          testProject.name,
          "Estado cambiado a: En Progreso - Progreso actualizado a 25%",
          req.user!.fullName
        );

        // Notificar cambio de estado especial
        const statusLabels = {
          'pending': 'Pendiente',
          'in_progress': 'En Progreso',
          'completed': 'Completado',
          'cancelled': 'Cancelado'
        };

        const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
        for (const admin of adminUsers) {
          if (admin.email) {
            await sendEmail({
              to: admin.email,
              subject: `Cambio de Estado (PRUEBA): ${testProject.name} - En Progreso`,
              html: generateProjectStatusChangeEmailHTML(
                testProject.name,
                statusLabels['pending'],
                statusLabels['in_progress'],
                req.user!.fullName,
                testClient.id
              ),
            });
          }
        }

        console.log("✅ Cambio de estado 1 procesado");
      } catch (updateError) {
        console.error("❌ Error en cambio de estado 1:", updateError);
      }

      // 5. Esperar un momento y cambiar a completed
      setTimeout(async () => {
        try {
          console.log("📧 Simulando cambio de estado: in_progress -> completed...");
          await storage.updateProject(testProject.id, {
            status: "completed",
            progress: 100,
            deliveryDate: new Date()
          });

          await notifyProjectUpdated(
            testClient.id,
            testProject.name,
            "Estado cambiado a: Completado - Progreso actualizado a 100%",
            req.user!.fullName
          );

          // Notificar cambio de estado especial
          const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
          for (const admin of adminUsers) {
            if (admin.email) {
              await sendEmail({
                to: admin.email,
                subject: `Cambio de Estado (PRUEBA): ${testProject.name} - Completado`,
                html: generateProjectStatusChangeEmailHTML(
                  testProject.name,
                  'En Progreso',
                  'Completado',
                  req.user!.fullName,
                  testClient.id
                ),
              });
            }
          }

          console.log("✅ Cambio de estado 2 procesado");
        } catch (finalError) {
          console.error("❌ Error en cambio de estado final:", finalError);
        }
      }, 2000);

      // 6. Crear un ticket de prueba
      try {
        console.log("📧 Creando ticket de prueba...");
        const testTicket = await storage.createTicket({
          title: "Ticket de Prueba - Consulta sobre el proyecto",
          description: "Este es un ticket de prueba para verificar las notificaciones",
          priority: "medium",
          userId: testClient.id,
          projectId: testProject.id,
        });

        const adminUsers = await storage.getUsersByRole("admin");
        const adminIds = adminUsers.map(admin => admin.id);
        await notifyTicketCreated(adminIds, testClient.fullName, testTicket.title);
        console.log("✅ Ticket de prueba creado y notificaciones enviadas");
      } catch (ticketError) {
        console.error("❌ Error creando ticket:", ticketError);
      }

      // 7. Simular mensaje en el proyecto
      try {
        console.log("📧 Enviando mensaje de prueba...");
        const testMessage = await storage.createProjectMessage({
          projectId: testProject.id,
          userId: testClient.id,
          message: "Este es un mensaje de prueba desde el cliente para verificar las notificaciones.",
        });

        const adminUsers = await storage.getUsersByRole("admin");
        for (const admin of adminUsers) {
          await notifyNewMessage(
            admin.id,
            testClient.fullName,
            testProject.name,
            testMessage.message
          );
        }
        console.log("✅ Mensaje de prueba enviado y notificaciones procesadas");
      } catch (messageError) {
        console.error("❌ Error enviando mensaje:", messageError);
      }

      res.json({
        success: true,
        message: "Prueba de flujo de emails iniciada exitosamente",
        details: {
          clientEmail: testClient.email,
          clientName: testClient.fullName,
          projectName: testProject.name,
          projectId: testProject.id,
          adminEmails: (await storage.getUsersByRole("admin")).map(admin => admin.email),
          systemEmail: process.env.GMAIL_USER,
        },
        instructions: [
          "1. Revisa los logs del servidor para ver el progreso",
          "2. Verifica tu email (tanto admin como sistema)",
          "3. Los cambios de estado ocurren con 2 segundos de diferencia",
          "4. Se han enviado: notificación de creación, 2 cambios de estado, ticket y mensaje"
        ]
      });

    } catch (error) {
      console.error("❌ Error en prueba de flujo de emails:", error);
      res.status(500).json({
        message: "Error en prueba de flujo de emails",
        error: error.message
      });
    }
  });

  // Helper function para generar HTML de cambio de estado (extraída para reutilizar)
  function generateProjectStatusChangeEmailHTML(projectName: string, oldStatus: string, newStatus: string, updatedBy: string, clientId: number) {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'pending':
        case 'pendiente':
          return '#f59e0b';
        case 'in_progress':
        case 'en progreso':
          return '#3b82f6';
        case 'completed':
        case 'completado':
          return '#10b981';
        case 'cancelled':
        case 'cancelado':
          return '#ef4444';
        default:
          return '#6b7280';
      }
    };

    const newStatusColor = getStatusColor(newStatus);

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"><title>Cambio de Estado - ${projectName}</title></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, ${newStatusColor} 0%, ${newStatusColor}dd 100%); color: white; padding: 30px; border-radius: 10px; text-align: center;">
          <h1 style="margin: 0;">🔄 Cambio de Estado del Proyecto</h1>
          <p style="margin: 10px 0 0 0; font-size: 18px;">${newStatus.toUpperCase()}</p>
        </div>
        <div style="padding: 30px 0;">
          <h2>Estado del proyecto actualizado</h2>
          <div style="background: #f8fafc; border-left: 4px solid ${newStatusColor}; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: ${newStatusColor};">${projectName}</h3>
            <div style="display: flex; align-items: center; margin: 10px 0;">
              <span style="background: #f3f4f6; padding: 5px 10px; border-radius: 5px; margin-right: 10px;">${oldStatus}</span>
              <span style="margin: 0 10px;">→</span>
              <span style="background: ${newStatusColor}; color: white; padding: 5px 10px; border-radius: 5px;">${newStatus}</span>
            </div>
            <p><strong>Actualizado por:</strong> ${updatedBy}</p>
            <p><strong>Fecha y hora:</strong> ${new Date().toLocaleString('es-PY', { timeZone: 'America/Asuncion' })}</p>
            <p style="background: #fff3cd; padding: 10px; border-radius: 5px; color: #856404; border: 1px solid #ffeaa7;"><strong>🧪 ESTO ES UNA PRUEBA</strong> - Email enviado desde el sistema de testing</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://softwarepar.lat/admin/projects" style="background: ${newStatusColor}; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Ver Proyecto en Admin</a>
          </div>
          <div style="background: #e0f2fe; border: 1px solid #0ea5e9; border-radius: 8px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #0369a1;"><strong>💡 Recordatorio:</strong> El cliente también ha sido notificado de este cambio.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Test endpoint para verificar conexión con FacturaSend
  app.get("/api/test-facturasend", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const { verificarConexionFacturaSend } = await import('./facturasend');
      const resultado = await verificarConexionFacturaSend();

      res.json({
        ...resultado,
        apiKeyConfigurada: !!process.env.FACTURASEND_API_KEY,
        tenantId: 'jhonifabianbenitezdelacruz'
      });
    } catch (error: any) {
      console.error('❌ Error verificando FacturaSend:', error);
      res.status(500).json({
        disponible: false,
        mensaje: 'Error al verificar FacturaSend',
        error: error.message
      });
    }
  });

  // Test endpoint para probar creación de factura con FacturaSend
  app.post("/api/test-facturasend", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      console.log('🧪 ========================================');
      console.log('🧪 Iniciando prueba de FacturaSend');
      console.log('🧪 ========================================');

      const facturasend = await import('./facturasend');

      const companyInfo = await db
        .select()
        .from(companyBillingInfo)
        .where(eq(companyBillingInfo.isActive, true))
        .limit(1);

      if (!companyInfo[0]) {
        return res.status(400).json({
          success: false,
          message: 'No se encontró información de facturación de la empresa.'
        });
      }

      const currentRate = await storage.getCurrentExchangeRate();
      const exchangeRate = currentRate ? parseFloat(currentRate.usdToGuarani) : 7300;

      const testClientData = {
        legalName: 'Cliente de Prueba S.A.',
        nombre: 'Cliente de Prueba',
        documentNumber: '80012345-1',
        documentType: 'RUC',
        clientType: 'empresa',
        address: 'Avenida Test 123',
        houseNumber: '123',
        city: 'Asunción',
        department: 'Central',
        phone: '0981234567',
        email: 'cliente@test.com',
        userId: 1
      };

      const testStageData = {
        id: 999,
        stageName: 'Prueba FacturaSend',
        amount: '1000.00',
        projectId: 1
      };

      const testProjectData = {
        id: 1,
        name: 'Proyecto de Prueba FacturaSend'
      };

      const documento = await facturasend.construirDocumentoFacturaSend(
        companyInfo[0],
        testClientData,
        testStageData,
        testProjectData,
        exchangeRate,
        999
      );

      console.log('📦 Documento generado:', JSON.stringify(documento, null, 2));

      const respuestaAPI = await facturasend.enviarFacturaFacturaSend(documento);
      const resultado = facturasend.extraerResultadoFacturaSend(respuestaAPI);

      console.log('🧪 ========================================');
      console.log(`📊 RESULTADO: ${resultado.estado === 'aceptado' ? '✅ EXITOSO' : '❌ FALLIDO'}`);
      console.log('🧪 ========================================');

      res.json({
        success: resultado.estado === 'aceptado',
        message: resultado.estado === 'aceptado' ? '✅ Factura procesada exitosamente' : '❌ Error al procesar factura',
        datos: {
          cdc: resultado.cdc,
          protocoloAutorizacion: resultado.protocoloAutorizacion,
          estado: resultado.estado,
          mensaje: resultado.mensaje
        },
        xml: resultado.xml,
        qr: resultado.qr,
        documento: documento
      });
    } catch (error: any) {
      console.error('❌ Error en test de FacturaSend:', error);
      res.status(500).json({
        success: false,
        message: 'Error al ejecutar prueba de FacturaSend',
        error: error.message
      });
    }
  });

  // Test endpoint para probar SIFEN
  app.post("/api/test-sifen", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      console.log('🧪 ========================================');
      console.log('🧪 Iniciando prueba de SIFEN');
      console.log('🧪 ========================================');

      const { procesarFacturaElectronica, validarDatosFactura } = await import('./sifen');

      // Obtener datos de la empresa
      const companyInfo = await db
        .select()
        .from(companyBillingInfo)
        .where(eq(companyBillingInfo.isActive, true))
        .limit(1);

      if (!companyInfo[0]) {
        return res.status(400).json({
          success: false,
          message: 'No se encontró información de facturación de la empresa. Configúrala primero.'
        });
      }

      if (!companyInfo[0].timbradoNumber || companyInfo[0].timbradoNumber === '0') {
        return res.status(400).json({
          success: false,
          message: 'El número de timbrado no está configurado. Configúralo en la información de la empresa.'
        });
      }

      // Obtener tasa de cambio actual
      const currentRate = await storage.getCurrentExchangeRate();
      const exchangeRate = currentRate ? parseFloat(currentRate.usdToGuarani) : 7300;

      // Datos de prueba
      const testData = {
        ruc: companyInfo[0].ruc,
        razonSocial: companyInfo[0].companyName,
        timbrado: companyInfo[0].timbradoNumber,
        numeroFactura: `${companyInfo[0].boletaPrefix || '001-001'}-0000999`,
        fechaEmision: new Date(),
        direccionEmisor: companyInfo[0].address || 'Asunción',
        telefonoEmisor: companyInfo[0].phone || '021000000',
        emailEmisor: companyInfo[0].email || 'info@softwarepar.com',
        departamentoEmisor: companyInfo[0].department || 'Central',
        ciudadEmisor: 'Asunción',
        clienteDocumento: '1234567',
        clienteTipoDocumento: 'CI' as const,
        clienteNombre: 'Cliente de Prueba SIFEN',
        clienteDireccion: 'Dirección de Prueba 123',
        clienteCiudad: 'Asunción',
        clienteDepartamento: 'Central',
        clienteTelefono: '0981234567',
        clienteEmail: 'cliente@test.com',
        items: [
          {
            codigo: 'PRUEBA-001',
            descripcion: 'Servicio de desarrollo web - Prueba SIFEN',
            cantidad: 1,
            precioUnitario: 1000,
            montoTotal: 1000,
            ivaAfectacion: 3 as const,
            tasaIVA: 0 as const
          },
          {
            codigo: 'PRUEBA-002',
            descripcion: 'Consultoría técnica',
            cantidad: 2,
            precioUnitario: 500,
            montoTotal: 1000,
            ivaAfectacion: 1 as const,
            tasaIVA: 10 as const
          }
        ],
        montoTotal: 2000,
        montoTotalPYG: Math.round(2000 * exchangeRate),
        tipoMoneda: 'USD' as const,
        tipoCambio: exchangeRate,
        condicionOperacion: 'contado' as const,
        indicadorPresencia: 2 as const
      };

      console.log('📊 Datos de factura de prueba:', {
        ruc: testData.ruc,
        numeroFactura: testData.numeroFactura,
        cliente: testData.clienteNombre,
        items: testData.items.length,
        montoTotal: testData.montoTotal,
        montoTotalPYG: testData.montoTotalPYG
      });

      // Validar datos
      console.log('🔍 Validando datos de factura...');
      const validacion = validarDatosFactura(testData);
      if (!validacion.valido) {
        console.error('❌ Validación fallida:', validacion.errores);
        return res.status(400).json({
          success: false,
          message: 'Validación de datos fallida',
          errores: validacion.errores
        });
      }
      console.log('✅ Validación exitosa');

      // Procesar factura
      console.log('🔄 Procesando factura electrónica...');
      const resultado = await procesarFacturaElectronica(testData);

      console.log('🧪 ========================================');
      console.log(`📊 RESULTADO: ${resultado.success ? '✅ EXITOSO' : '❌ FALLIDO'}`);
      console.log('🧪 ========================================');

      // Preparar respuesta
      const response = {
        success: resultado.success,
        message: resultado.success ? '✅ Factura procesada exitosamente' : '❌ Error al procesar factura',
        datos: {
          cdc: resultado.cdc,
          protocoloAutorizacion: resultado.protocoloAutorizacion,
          estado: resultado.estado,
          mensajeError: resultado.mensajeError,
          urlQR: resultado.urlQR
        },
        xml: resultado.xmlGenerado,
        ambiente: process.env.SIFEN_AMBIENTE || 'test',
        configuracion: {
          idCSC: process.env.SIFEN_ID_CSC || '0001',
          tieneCertificado: !!process.env.SIFEN_CERTIFICADO_PATH,
          endpoint: process.env.SIFEN_WSDL_URL || 'https://sifen-test.set.gov.py/de/ws/sync/recibe'
        }
      };

      res.json(response);

    } catch (error: any) {
      console.error('❌ Error en prueba de SIFEN:', error);
      console.error('📋 Stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Error en prueba de SIFEN',
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  app.post("/api/admin/work-modalities", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const modality = await storage.createWorkModality(req.body);
      res.status(201).json(modality);
    } catch (error) {
      console.error("Error creating work modality:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/admin/work-modalities/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const modalityId = parseInt(req.params.id);
      const updated = await storage.updateWorkModality(modalityId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating work modality:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.delete("/api/admin/work-modalities/:id", authenticateToken, requireRole(["admin"]), async (req: AuthRequest, res) => {
    try {
      const modalityId = parseInt(req.params.id);
      await storage.deleteWorkModality(modalityId);
      res.json({ message: "Modalidad eliminada exitosamente" });
    } catch (error) {
      console.error("Error deleting work modality:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });


  // WebSocket Server
  const httpServer = createServer(app);
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    perMessageDeflate: false // Disable compression for better performance
  });

  // Heartbeat mechanism to keep connections alive
  const interval = setInterval(() => {
    wss.clients.forEach((ws: any) => {
      if (ws.isAlive === false) {
        console.log("🔌 Terminando conexión WebSocket inactiva");
        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000); // Check every 30 seconds

  wss.on('close', () => {
    clearInterval(interval);
  });

  wss.on("connection", (ws: WebSocket, request) => {
    console.log("✅ Nueva conexión WebSocket establecida");

    // Configurar heartbeat para mantener conexiones vivas
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Manejar errores de conexión
    ws.on('error', (error) => {
      console.error('❌ Error WebSocket:', error);
    });

    ws.on('close', () => {
      console.log("🔌 Conexión WebSocket cerrada");
    });

    console.log("New WebSocket connection");
    let userId: number | null = null;

    ws.on("message", (message: string) => {
      try {
        const data = JSON.parse(message);
        console.log("Received WebSocket message:", data);

        // Handle user authentication for WebSocket
        if (data.type === 'auth') {
          console.log('🔐 Intento de autenticación WebSocket:', {
            userId: data.userId,
            hasToken: !!data.token
          });

          if (data.userId) {
            userId = data.userId;
            registerWSConnection(userId, ws);

            console.log('✅ Usuario registrado en WebSocket:', userId);

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "auth_success",
                message: "Usuario autenticado para notificaciones",
                userId: userId,
                timestamp: new Date().toISOString(),
              }));
            }
          } else {
            console.error('❌ Autenticación WebSocket falló: No userId');
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: "auth_error",
                message: "Error de autenticación",
                timestamp: new Date().toISOString(),
              }));
            }
          }
        }

        // Echo back for other message types
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: "echo",
            data: data,
            timestamp: new Date().toISOString(),
          }));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });

    // Send welcome message
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "welcome",
        message: "Conectado al servidor de notificaciones en tiempo real",
        timestamp: new Date().toISOString(),
      }));
    }
  });

  return httpServer;
}