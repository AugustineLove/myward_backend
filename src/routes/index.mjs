import { Router } from "express";
import schoolRoutes from "./schoolRoutes.mjs";
import classRoutes from "./classRoutes.mjs";
import studentRoutes from "./studentRoutes.mjs";
import otpRoutes from "./otpRoutes.mjs";
import transactionRoutes from "./transactionRoutes.mjs";
import parentRoutes from "./parentRoutes.mjs";
import paystackRoutes from "./paystackRoutes.mjs";
import helpRoutes from "./helpRoutes.mjs";
import { hubtelRoutes } from "./hubtelRoutes.mjs";
const router = Router();

router.use('/api/schools', schoolRoutes); 
router.use('/api/classes', classRoutes);
router.use('/api/students', studentRoutes);
router.use('/api/parents', parentRoutes);
router.use('/api/transactions', transactionRoutes)
router.use('/api/otp', otpRoutes);
router.use('/api/paystack', paystackRoutes)
router.use('/api/contact', helpRoutes)
router.use('/api/payment', hubtelRoutes)

export default router;
