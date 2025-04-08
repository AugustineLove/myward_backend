import { Router } from "express";
import { addFeeTypeToSchool, addSchool, deleteFeeTypeFromSchool, editSchoolDetails, getAllSchools, getASchool, getFeeTypesForSchool, loginSchool } from "../controllers/schoolControllers.mjs";


const schoolRoutes = Router();

schoolRoutes.get('/', getAllSchools);
schoolRoutes.post("/add", addSchool);
schoolRoutes.post('/:schoolId/addFeeType', addFeeTypeToSchool);
schoolRoutes.get('/:schoolId/feeTypes', getFeeTypesForSchool)
schoolRoutes.get('/:schoolId', getASchool);
schoolRoutes.post('/login', loginSchool);
schoolRoutes.post('/edit', editSchoolDetails)
schoolRoutes.delete('/deleteFeeType', deleteFeeTypeFromSchool)


export default schoolRoutes;


