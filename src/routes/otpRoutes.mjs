import { Router } from "express";
import { sendScheduledSMS, sendTemplateSMS, verifyOTP } from "../controllers/otpController.mjs";



const otpRoutes = Router();

otpRoutes.post('/send-otp', sendTemplateSMS);
otpRoutes.post('/verify-otp', verifyOTP);

export default otpRoutes;