
import { Router } from "express";
import { addStudent, debitAStudent, deleteStudents, editStudent, getAllStudents, getStudentFeeDebt, getStudentFees, getStudentsWithFees, payIntoStudentAccount, promoteAllStudents, updateClassFees } from "../controllers/studentControllers.mjs";


const studentRoutes = Router();

studentRoutes.post('/add', addStudent);
studentRoutes.post('/:schoolId', promoteAllStudents);
studentRoutes.get('/:schoolId', getAllStudents)
studentRoutes.post('/addClassFees/:schoolId', updateClassFees)
studentRoutes.post('/pay/:studentId', payIntoStudentAccount)
studentRoutes.post('/debit/:studentId', debitAStudent)
studentRoutes.post('/deletion/students', deleteStudents);
studentRoutes.get('/fees/:studentId', getStudentFees)
studentRoutes.get('/feeType/balance', getStudentsWithFees)
studentRoutes.get('/fees/:studentId/:feeType', getStudentFeeDebt)
studentRoutes.put('/edit', editStudent)


export default studentRoutes;