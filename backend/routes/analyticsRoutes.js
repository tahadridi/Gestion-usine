// routes/analyticsRoutes.js
import express from 'express';
import { getProductionAnalytics, getSystemStatus } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/production', getProductionAnalytics);
router.get('/system-status', getSystemStatus);

export default router;