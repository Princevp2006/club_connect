// ─── Swagger / OpenAPI Configuration ─────────────────────────────────────────
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Student Organization Management System API',
      version: '3.0.0',
      description:
        'Phase 1 + 2 + 3 – Authentication, Users, RBAC, Events, Memberships, Tickets, Volunteer Management, QR Scanner, Attendance, Merchandise, Orders, Announcements, and Dashboards.',
      contact: { name: 'API Support' },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        // ── Phase 1 Schemas ─────────────────────────────
        ErrorResponse: {
          type: 'object',
          properties: {
            statusCode: { type: 'integer' },
            message: { type: 'string' },
            errors: { type: 'object', nullable: true },
            traceId: { type: 'string' },
          },
        },
        UserResponse: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            fullName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['ADMIN', 'STUDENT_LEADER', 'STUDENT'] },
            studentId: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['fullName', 'email', 'password', 'studentId'],
          properties: {
            fullName: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8, maxLength: 128 },
            studentId: { type: 'string', minLength: 1, maxLength: 50 },
            phone: { type: 'string', nullable: true },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        LoginResponse: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/UserResponse' },
          },
        },
        ChangeRoleRequest: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['ADMIN', 'STUDENT_LEADER', 'STUDENT'] },
          },
        },
        PaginatedUsers: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/UserResponse' },
            },
            meta: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                page: { type: 'integer' },
                limit: { type: 'integer' },
                totalPages: { type: 'integer' },
              },
            },
          },
        },

        // ── Phase 2 Schemas ─────────────────────────────
        CreateEventRequest: {
          type: 'object',
          required: ['title', 'description', 'eventDate', 'startTime', 'endTime', 'location'],
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            eventDate: { type: 'string', format: 'date-time' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            needsVolunteers: { type: 'boolean', default: false },
            volunteerLimit: { type: 'integer', nullable: true },
          },
        },
        UpdateEventRequest: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            eventDate: { type: 'string', format: 'date-time' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            location: { type: 'string' },
            status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED'] },
            needsVolunteers: { type: 'boolean' },
            volunteerLimit: { type: 'integer', nullable: true },
          },
        },
        CreateMembershipRequest: {
          type: 'object',
          required: ['userId', 'membershipType', 'startDate', 'endDate'],
          properties: {
            userId: { type: 'string', format: 'uuid' },
            membershipType: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
          },
        },
        UpdateMembershipRequest: {
          type: 'object',
          properties: {
            membershipType: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            status: { type: 'string', enum: ['ACTIVE', 'EXPIRED', 'CANCELLED'] },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['volunteerUserId', 'taskType', 'taskTitle'],
          properties: {
            volunteerUserId: { type: 'string', format: 'uuid' },
            taskType: { type: 'string', enum: ['QR_SCANNER', 'REGISTRATION', 'SEATING', 'HELP_DESK', 'EVENT_SETUP', 'OTHER'] },
            taskTitle: { type: 'string' },
            description: { type: 'string', nullable: true },
            startTime: { type: 'string', format: 'date-time', nullable: true },
            endTime: { type: 'string', format: 'date-time', nullable: true },
            location: { type: 'string', nullable: true },
          },
        },

        // ── Phase 3 Schemas ─────────────────────────────
        CreateMerchandiseRequest: {
          type: 'object',
          required: ['name', 'stockQuantity'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            size: { type: 'string', nullable: true },
            stockQuantity: { type: 'integer', minimum: 0 },
          },
        },
        UpdateMerchandiseRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            size: { type: 'string', nullable: true },
            stockQuantity: { type: 'integer', minimum: 0 },
            isActive: { type: 'boolean' },
          },
        },
        CreateOrderRequest: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string', format: 'uuid' },
            quantity: { type: 'integer', minimum: 1 },
          },
        },
        CreateAnnouncementRequest: {
          type: 'object',
          required: ['title', 'content'],
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            isPublished: { type: 'boolean', default: false },
          },
        },
        UpdateAnnouncementRequest: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            content: { type: 'string' },
            isPublished: { type: 'boolean' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
