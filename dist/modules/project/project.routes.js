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
const projectController = __importStar(require("./project.controller"));
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
const memberIdParamSchema = zod_1.z.object({
    id: validation_1.uuidSchema,
    memberId: validation_1.uuidSchema,
});
// Project routes
router.get('/', (0, cache_1.cacheMiddleware)({ ttl: 60, keyPrefix: 'projects:list' }), projectController.getProjects);
router.get('/:id', (0, validate_1.validateParams)(idParamSchema), (0, cache_1.cacheMiddleware)({ ttl: 120, keyPrefix: 'projects:detail' }), projectController.getProjectById);
router.post('/', (0, validate_1.validateBody)(validation_1.createProjectSchema), projectController.createProject);
router.patch('/:id', (0, validate_1.validateParams)(idParamSchema), (0, validate_1.validateBody)(validation_1.updateProjectSchema), projectController.updateProject);
router.delete('/:id', (0, validate_1.validateParams)(idParamSchema), projectController.deleteProject);
// Project member routes
router.get('/:id/members', (0, validate_1.validateParams)(idParamSchema), (0, cache_1.cacheMiddleware)({ ttl: 60, keyPrefix: 'projects:members' }), projectController.getProjectMembers);
router.post('/:id/members', (0, validate_1.validateParams)(idParamSchema), (0, validate_1.validateBody)(validation_1.addProjectMemberSchema), projectController.addProjectMember);
router.delete('/:id/members/:memberId', (0, validate_1.validateParams)(memberIdParamSchema), projectController.removeProjectMember);
// Admin routes - must be admin role
router.get('/admin/all', (0, auth_1.authorize)('admin'), (0, cache_1.cacheMiddleware)({ ttl: 30, keyPrefix: 'admin:projects:all' }), projectController.getAllProjectsAdmin);
router.get('/admin/:id', (0, auth_1.authorize)('admin'), (0, validate_1.validateParams)(idParamSchema), projectController.getProjectByIdAdmin);
exports.default = router;
//# sourceMappingURL=project.routes.js.map