"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const taskController = __importStar(require("./task.controller"));
const auth_1 = require("../../middleware/auth");
const validate_1 = require("../../middleware/validate");
const cache_1 = require("../../middleware/cache");
const validation_1 = require("../../utils/validation");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_1.authenticate);
// ID param validation schemas
const idParamSchema = zod_1.z.object({
    id: validation_1.uuidSchema,
});
const projectIdParamSchema = zod_1.z.object({
    projectId: validation_1.uuidSchema,
});
// Update positions schema
const updatePositionsSchema = zod_1.z.object({
    updates: zod_1.z.array(zod_1.z.object({
        id: validation_1.uuidSchema,
        position: zod_1.z.number().int().min(0),
        status: zod_1.z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    })).min(1),
});
// Task routes
router.get('/', (0, cache_1.cacheMiddleware)({ ttl: 30, keyPrefix: 'tasks:list' }), taskController.getTasks);
router.get('/stats/:projectId', (0, validate_1.validateParams)(projectIdParamSchema), (0, cache_1.cacheMiddleware)({ ttl: 60, keyPrefix: 'tasks:stats' }), taskController.getTaskStats);
router.get('/:id', (0, validate_1.validateParams)(idParamSchema), (0, cache_1.cacheMiddleware)({ ttl: 60, keyPrefix: 'tasks:detail' }), taskController.getTaskById);
router.post('/', (0, validate_1.validateBody)(validation_1.createTaskSchema), taskController.createTask);
router.patch('/:id', (0, validate_1.validateParams)(idParamSchema), (0, validate_1.validateBody)(validation_1.updateTaskSchema), taskController.updateTask);
router.delete('/:id', (0, validate_1.validateParams)(idParamSchema), taskController.deleteTask);
router.patch('/positions/update', (0, validate_1.validateBody)(updatePositionsSchema), taskController.updateTaskPositions);
exports.default = router;
//# sourceMappingURL=task.routes.js.map