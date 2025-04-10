import client from "../db.mjs";

const classLevelMap = {
    "Creche": 1,
    "Nursery 1": 2,
    "Nursery 2": 3,
    "Kindergarten 1": 4,
    "Kindergarten 2": 5,
    "Basic 1": 6,
    "Basic 2": 7,
    "Basic 3": 8,
    "Basic 4": 9,
    "Basic 5": 10,
    "Basic 6": 11,
    "Basic 7": 12,
    "Basic 8": 13,
    "Basic 9": 14,
};

// Function to add a student
export const addStudent = async (req, res) => {
    console.log("Adding student..........")
    const {
        studentFirstName,
        studentSurname,
        studentOtherNames,
        studentGender,
        studentClass, // Example: "Basic 6"
        schoolId,
        studentAddress,
        studentParentSurname,
        studentParentFirstName,
        studentParentNumber
    } = req.body;

    try {
        // ✅ Validate school
        const schoolResult = await client.query('SELECT * FROM schools WHERE id = $1', [schoolId]);
        if (schoolResult.rows.length === 0) {
            return res.status(404).json({ message: "School not found" });
        }
        

        // ✅ Validate class existence in the school
        const classResult = await client.query(
            'SELECT * FROM classes WHERE class_name = $1 AND school_id = $2',
            [studentClass, schoolId]
        );

        if (classResult.rows.length === 0) {
            return res.status(404).json({ message: "Class not found in the specified school" });
        }

        const classData = classResult.rows[0];

        console.log('ClassData: ', classData);

        // ✅ Assign level based on className
        const level = classLevelMap[studentClass] || 0; // Default to 0 if not found

        // ✅ Retrieve class-specific fixed fees
        const feeResult = await client.query(
            'SELECT * FROM class_fees WHERE class_id = $1',
            [classData.id]
        );

        console.log('FeeResult: ', feeResult.rows);

        const classFees = feeResult.rows.map(fee => ({
            feeType: fee.fee_type,
            amount: fee.amount,
            status: fee.status,
            dueDate: fee.due_date,
        }));

        console.log('classFees: ', classFees);

        // ✅ Insert new student
        const studentResult = await client.query(
            `INSERT INTO students (
                student_first_name, student_surname, student_other_names, student_gender, 
                student_class_id, student_class_name, school_id, student_address, 
                student_parent_first_name, student_parent_surname, student_parent_number, 
                level, balance, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
            RETURNING id`,
            [
                studentFirstName,
                studentSurname,
                studentOtherNames,
                studentGender,
                classData.id, // Use class ID
                studentClass,
                schoolId,
                studentAddress,
                studentParentFirstName,
                studentParentSurname,
                studentParentNumber,
                level,
                classFees.reduce((acc, fee) => acc + (parseFloat(fee.amount) || 0), 0), // Initial balance based on total fees
                new Date(),
                new Date()
            ]
        );

        console.log('studentResult ', studentResult.rows[0])

        // ✅ Insert class fees (if applicable)
        const studentId = studentResult.rows[0].id;

        for (const fee of classFees) {
            await client.query(
                'INSERT INTO student_fees (student_id, fee_type, amount, status, due_date) VALUES ($1, $2, $3, $4, $5)',
                [studentId, fee.feeType, fee.amount, fee.status, fee.dueDate]
            );
        }

        return res.status(201).json({
            message: "Student added successfully",
            studentId: studentId,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Function to edit a student's details
export const editStudent = async (req, res) => {
    console.log("Editing student...");

    const {
        studentId,
        schoolId,
        studentFirstName,
        studentSurname,
        studentOtherNames,
        studentGender,
        studentClass,
        studentAddress,
        studentParentSurname,
        studentParentFirstName,
        studentParentNumber
    } = req.body;

    try {
        // ✅ Check if school exists
        const schoolCheck = await client.query('SELECT * FROM schools WHERE id = $1', [schoolId]);
        if (schoolCheck.rows.length === 0) {
            return res.status(404).json({ message: "School not found" });
        }

        // ✅ Check if student exists
        const studentCheck = await client.query(
            'SELECT * FROM students WHERE id = $1 AND school_id = $2',
            [studentId, schoolId]
        );
        if (studentCheck.rows.length === 0) {
            return res.status(404).json({ message: "Student not found in this school" });
        }

        // ✅ Handle class update if a new class is provided
        let newClassId = studentCheck.rows[0].student_class_id;
        let newClassName = studentCheck.rows[0].student_class_name;
        let newLevel = studentCheck.rows[0].level;

        if (studentClass) {
            const classResult = await client.query(
                'SELECT * FROM classes WHERE class_name = $1 AND school_id = $2',
                [studentClass, schoolId]
            );

            if (classResult.rows.length === 0) {
                return res.status(404).json({ message: "New class not found in the specified school" });
            }

            const classData = classResult.rows[0];
            newClassId = classData.id;
            newClassName = studentClass;
            newLevel = classLevelMap[studentClass] || 0;
        }

        // ✅ Update the student record
        await client.query(
            `UPDATE students SET
                student_first_name = COALESCE($1, student_first_name),
                student_surname = COALESCE($2, student_surname),
                student_other_names = COALESCE($3, student_other_names),
                student_gender = COALESCE($4, student_gender),
                student_class_id = $5,
                student_class_name = $6,
                student_address = COALESCE($7, student_address),
                student_parent_first_name = COALESCE($8, student_parent_first_name),
                student_parent_surname = COALESCE($9, student_parent_surname),
                student_parent_number = COALESCE($10, student_parent_number),
                level = $11,
                updated_at = $12
            WHERE id = $13 AND school_id = $14`,
            [
                studentFirstName,
                studentSurname,
                studentOtherNames,
                studentGender,
                newClassId,
                newClassName,
                studentAddress,
                studentParentFirstName,
                studentParentSurname,
                studentParentNumber,
                newLevel,
                new Date(),
                studentId,
                schoolId
            ]
        );

        return res.status(200).json({ message: "Student details updated successfully" });

    } catch (error) {
        console.error("Edit student error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



export const deleteStudents = async (req, res) => {
    try {
        const { studentIds } = req.body;

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: "Invalid studentIds array" });
        }

        // Log studentIds for debugging
        console.log("Student IDs received for deletion: ", studentIds);

        // Create a string of placeholders for the SQL query
        const placeholders = studentIds.map((_, index) => `$${index + 1}`).join(', ');

        // Delete students in bulk
        const result = await client.query(
            `DELETE FROM students WHERE id IN (${placeholders})`,
            studentIds
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: "No students found to delete" });
        }

        res.status(200).json({ message: "Students deleted successfully", deletedCount: result.rowCount });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Promote all students to the next class based on their current class
export const promoteAllStudents = async (req, res) => {
    const { schoolId } = req.body; 

    try {
        if (!schoolId) {
            return res.status(400).json({ message: "School ID is required" });
        }

        // Fetch students in the school
        const studentsResult = await client.query('SELECT * FROM students WHERE school_id = $1', [schoolId]);
        const students = studentsResult.rows;

        console.log(`Students found: ${students.length}`);

        if (students.length === 0) {
            return res.status(404).json({ message: "No students found for this school" });
        }

        // For each student, promote to the next class
        for (let student of students) {
            // Fetch the current class
            const currentClassResult = await client.query('SELECT * FROM classes WHERE id = $1', [student.student_class_id]);
            const currentClass = currentClassResult.rows[0];

            if (!currentClass) continue;

            // Find the next class based on level increment
            const nextClassResult = await client.query(
                'SELECT * FROM classes WHERE school_id = $1 AND level = $2 LIMIT 1',
                [currentClass.school_id, currentClass.level + 1]
            );
            const nextClass = nextClassResult.rows[0];

            if (!nextClass) continue;

            // Update student class and level
            await client.query(
                `UPDATE students SET student_class_id = $1, level = $2, class_name = $3 WHERE id = $4`,
                [nextClass.id, nextClass.level, nextClass.class_name, student.id]
            );
        }

        res.status(200).json({ message: "Students promoted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Get all students for a given school
export const getAllStudents = async (req, res) => {
    const { schoolId } = req.params; 

    try {
        if (!schoolId) {
            return res.status(400).json({ message: "School ID is required" });
        }

        // Fetch all students for the given school
        const studentsResult = await client.query('SELECT * FROM students WHERE school_id = $1', [schoolId]);
        const students = studentsResult.rows;

        if (students.length === 0) {
            return res.status(404).json({ message: "No students found for this school" });
        }

        res.status(200).json(students);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};


export const addFeesToStudentsInAClass = async (req, res) => {
    try {
        const { classId, feeType, amount, dueDate } = req.body;

        if (!classId || !feeType || !amount) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Find all students in the given class
        const studentsResult = await client.query('SELECT * FROM students WHERE student_class_id = $1', [classId]);
        const students = studentsResult.rows;

        if (students.length === 0) {
            return res.status(404).json({ message: "No students found in this class." });
        }

        // Add fees to each student
        await Promise.all(students.map(async (student) => {
            // Check if the student already has this fee
            const existingFeeResult = await client.query(
                'SELECT * FROM student_fees WHERE student_id = $1 AND fee_type = $2',
                [student.id, feeType]
            );
            const existingFee = existingFeeResult.rows[0];

            if (existingFee) {
                // If fee exists, update the amount
                const newAmount = existingFee.amount + Number(amount);
                await client.query(
                    'UPDATE student_fees SET amount = $1, due_date = $2 WHERE student_id = $3 AND fee_type = $4',
                    [newAmount, dueDate ? new Date(dueDate) : existingFee.due_date, student.id, feeType]
                );
            } else {
                // If fee doesn't exist, insert a new fee record
                await client.query(
                    'INSERT INTO student_fees (student_id, fee_type, amount, due_date, status) VALUES ($1, $2, $3, $4, $5)',
                    [student.id, feeType, Number(amount), dueDate ? new Date(dueDate) : null, 'unpaid']
                );
            }

            // Update the student's total balance
            const newBalance = (student.balance || 0) + Number(amount);
            await client.query('UPDATE students SET balance = $1 WHERE id = $2', [newBalance, student.id]);
        }));

        res.status(200).json({
            message: `Successfully added ${feeType} fee of ${amount} to ${students.length} students in class.`,
        });
    } catch (error) {
        console.error("Error adding fees:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

// Update class fees
export const updateClassFees = async (req, res) => {
    try {
        const { classId, feeType, newAmount, dueDate } = req.body;

        if (!classId || !feeType || newAmount === undefined) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        // Find all students in the given class
        const studentsResult = await client.query('SELECT * FROM students WHERE student_class_id = $1', [classId]);
        const students = studentsResult.rows;

        if (students.length === 0) {
            return res.status(404).json({ message: "No students found in this class." });
        }

        // Get the current fee record for this class and fee type
        const classFeeResult = await client.query('SELECT * FROM class_fees WHERE class_id = $1 AND fee_type = $2', [classId, feeType]);
        const classFee = classFeeResult.rows[0];
        const oldAmount = classFee ? classFee.amount : 0;
        const amountDifference = newAmount - oldAmount;

        // Update or create the class fee record
        if (classFee) {
            await client.query(
                'UPDATE class_fees SET amount = $1 WHERE class_id = $2 AND fee_type = $3',
                [newAmount, classId, feeType]
            );
        } else {
            await client.query(
                'INSERT INTO class_fees (class_id, fee_type, amount) VALUES ($1, $2, $3)',
                [classId, feeType, newAmount]
            );
        }

        // Update students' fees
        await Promise.all(students.map(async (student) => {
            // Check if the student already has this fee
            const existingFeeResult = await client.query(
                'SELECT * FROM student_fees WHERE student_id = $1 AND fee_type = $2',
                [student.id, feeType]
            );
            const existingFee = existingFeeResult.rows[0];

            if (existingFee) {
                // Adjust the student's fee by the amount difference
                const newFeeAmount = existingFee.amount + amountDifference;
                await client.query(
                    'UPDATE student_fees SET amount = $1, due_date = $2 WHERE student_id = $3 AND fee_type = $4',
                    [newFeeAmount, dueDate ? new Date(dueDate) : existingFee.due_date, student.id, feeType]
                );
            } else {
                // If fee doesn't exist, set it to the new fixed amount
                await client.query(
                    'INSERT INTO student_fees (student_id, fee_type, amount, due_date, status) VALUES ($1, $2, $3, $4, $5)',
                    [student.id, feeType, newAmount, dueDate ? new Date(dueDate) : null, 'unpaid']
                );
            }

            // Update the student's total balance
            const newBalance = (student.balance || 0) + amountDifference;
            await client.query('UPDATE students SET balance = $1 WHERE id = $2', [newBalance, student.id]);
        }));

        res.status(200).json({
            message: `Successfully updated ${feeType} fee to ${newAmount} for all students in class.`,
        });
    } catch (error) {
        console.error("Error updating fees:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
export const debitAStudent = async (req, res) => {
    try {
        const { studentId, feeType, amount } = req.body;

        if (!studentId || !feeType || !amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid input values." });
        }

        // Check if the student exists
        const student = await client.query('SELECT * FROM students WHERE id = $1', [studentId]);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        // Check if the fee type already exists for the student
        const existingFee = await client.query('SELECT * FROM student_fees WHERE student_id = $1 AND fee_type = $2', [studentId, feeType]);

        if (existingFee) {
            // If fee exists, update the amount
            await client.query('UPDATE student_fees SET amount = amount + $1 WHERE student_id = $2 AND fee_type = $3', [amount, studentId, feeType]);
        } else {
            // If fee doesn't exist, insert a new fee record
            await client.query('INSERT INTO student_fees(student_id, fee_type, amount) VALUES($1, $2, $3)', [studentId, feeType, amount]);
        }

        // Update the student's balance
        await client.query('UPDATE students SET balance = balance + $1 WHERE id = $2', [amount, studentId]);

        res.status(200).json({ message: "Fee added successfully." });

    } catch (error) {
        console.error("Error debiting student:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};


export const payIntoStudentAccount = async (req, res) => {
    try {
        const { studentId, feeType, amountPaid } = req.body;

        if (!studentId || !feeType || !amountPaid || amountPaid <= 0) {
            return res.status(400).json({ message: "Invalid payment amount." });
        }

        // Check if the student exists
        const student = await client.query('SELECT * FROM students WHERE id = $1', [studentId]);
        if (!student) {
            return res.status(404).json({ message: "Student not found." });
        }

        // Find the specific fee record
        const fee = await client.query('SELECT * FROM student_fees WHERE student_id = $1 AND fee_type = $2', [studentId, feeType]);
        if (!fee) {
            return res.status(404).json({ message: "Specified fee type not found for this student." });
        }

        // Ensure payment does not exceed the balance of the fee
        if (amountPaid > fee.amount) {
            return res.status(400).json({ message: `Cannot pay more than the remaining balance of ${fee.amount} for ${feeType}.` });
        }

        // Deduct the payment from the fee amount
        await client.query('UPDATE student_fees SET amount = amount - $1 WHERE student_id = $2 AND fee_type = $3', [amountPaid, studentId, feeType]);

        // Reduce the overall student balance
        await client.query('UPDATE students SET balance = balance - $1 WHERE id = $2', [amountPaid, studentId]);

        res.status(200).json({
            message: `Payment of ${amountPaid} applied to ${feeType}.`,
        });

    } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getStudentFees = async (req, res) => {
    const { studentId } = req.params;

    try {
        if (!studentId) {
            return res.status(400).json({ message: "Student ID is required" });
        }

        // Fetch all fee types and amounts for the student
        const result = await client.query(
            `SELECT fee_type, SUM(amount) AS total 
             FROM student_fees 
             WHERE student_id = $1 
             GROUP BY fee_type`,
            [studentId]
        );

        // Calculate total debt (sum of all fee types)
        const totalDebt = result.rows.reduce((acc, fee) => acc + parseFloat(fee.total), 0);

        return res.status(200).json({
            studentId,
            feesBreakdown: result.rows, // Returns individual fee types with their sums
            totalDebt, // Returns the total sum of all fees
        });

    } catch (error) {
        console.error("Error fetching student fees:", error);
        res.status(500).json({ message: "Server error while fetching fees" });
    }
};

export const getStudentFeeDebt = async (req, res) => {
    const { studentId, feeType } = req.params;

    try {
        if (!studentId || !feeType) {
            return res.status(400).json({ message: "Student ID and Fee Type are required" });
        }

        // Fetch the total debt for the specified fee type for the student
        const result = await client.query(
            `SELECT SUM(amount) AS total 
             FROM student_fees 
             WHERE student_id = $1 AND fee_type = $2`,
            [studentId, feeType]
        );

        // If the result is empty, it means no fee was found for this type
        const totalDebt = result.rows[0].total ? parseFloat(result.rows[0].total) : 0;

        return res.status(200).json({
            studentId,
            feeType,
            totalDebt, // Returns the total sum of the specified fee type
        });

    } catch (error) {
        console.error("Error fetching student fee debt:", error);
        res.status(500).json({ message: "Server error while fetching fee debt" });
    }
};


// Fetch all students with their total fees
export const getStudentsWithFees = async (req, res) => {
  try {
    const query = `
    SELECT 
      s.id, 
      s.student_first_name, 
      s.student_surname, 
      s.student_other_names, 
      s.student_class_name,
      COALESCE(SUM(f.amount), 0) AS total_fees
    FROM students s
    LEFT JOIN student_fees f ON s.id::TEXT = f.student_id::TEXT  -- Ensure UUID compatibility
    GROUP BY s.id, s.student_first_name, s.student_surname, s.student_other_names, s.student_class_name
    ORDER BY s.student_surname;
  `;

    const { rows } = await client.query(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching students with fees:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

