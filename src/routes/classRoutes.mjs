import { Router } from "express";
import { addClass, getAllClasses, getAllStudentsInClass, getFixedAmount, promoteClassStudents, updateFixedAmount } from "../controllers/classController.mjs";

const classRoutes = Router();

classRoutes.post('/add',addClass);

classRoutes.get('/:schoolId', getAllClasses)
classRoutes.get('/:classId/students', getAllStudentsInClass)
classRoutes.get('/:classId/:feeType', getFixedAmount)
classRoutes.put('/fees/:classId/:feeType', updateFixedAmount)
classRoutes.post('/promote', promoteClassStudents)

export default classRoutes;