
import client from "../db.mjs";

export const addClass = async (req, res) => {
    const { className, school, level } = req.body;
    
    try {
        // Check if the school exists
        const schoolResult = await client.query("SELECT * FROM schools WHERE id = $1", [school]);
        if (schoolResult.rows.length === 0) {
            return res.status(404).json({ message: "School not found" });
        }

        // Insert new class
        const result = await client.query(
            "INSERT INTO classes (className, school_id, level) VALUES ($1, $2, $3) RETURNING *",
            [className, school, level]
        );
        
        return res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllClasses = async (req, res) => {
    const { schoolId } = req.params;
    
    try {
        // Fetch all classes for the school
        const result = await client.query("SELECT * FROM classes WHERE school_id = $1", [schoolId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No classes found for this school" });
        }
        
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const getAllStudentsInClass = async (req, res) => {
    const { classId } = req.params;
    
    try {
        // Fetch all students in the class
        const result = await client.query("SELECT * FROM students WHERE student_class_id = $1", [classId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No students found for this class" });
        }
        
        return res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};



export const promoteClassStudents = async (req, res) => {
    const { classId, students } = req.body;

    // Define class promotion order
    const orderedClassNames = [
        "Creche", "Nursery 1", "Nursery 2", "Kindergarten 1", "Kindergarten 2",
        "Basic 1", "Basic 2", "Basic 3", "Basic 4", "Basic 5", "Basic 6",
        "Basic 7", "Basic 8", "Basic 9"
    ];

    try {
        if (!classId) {
            return res.status(400).json({ message: "Class ID is required" });
        }

        let studentsToPromote;

        // Fetch selected students or all in the class
        if (students && students.length > 0) {
            studentsToPromote = await client.query(
                "SELECT id, school_id, student_class_id FROM students WHERE id = ANY($1::uuid[])",
                [students]
            );
        } else {
            studentsToPromote = await client.query(
                "SELECT id, school_id, student_class_id FROM students WHERE student_class_id = $1",
                [classId]
            );
        }

        if (studentsToPromote.rowCount === 0) {
            return res.status(404).json({ message: "No students found to promote" });
        }

        for (const student of studentsToPromote.rows) {
            // Get current class name
            const currentClassRes = await client.query(
                "SELECT class_name FROM classes WHERE id = $1",
                [student.student_class_id]
            );

            const currentClassName = currentClassRes.rows[0]?.class_name;
            if (!currentClassName) continue;

            // Find index of current class in the ordered list
            const currentIndex = orderedClassNames.indexOf(currentClassName);
            if (currentIndex === -1 || currentIndex + 1 >= orderedClassNames.length) continue;

            const nextClassName = orderedClassNames[currentIndex + 1];

            // Get next class by name and school
            const nextClassRes = await client.query(
                "SELECT * FROM classes WHERE school_id = $1 AND class_name = $2",
                [student.school_id, nextClassName]
            );

            if (nextClassRes.rows.length === 0) continue;

            const nextClass = nextClassRes.rows[0];

            // Promote the student
            await client.query(
                "UPDATE students SET student_class_id = $1, student_class_name = $2, level = $3 WHERE id = $4",
                [nextClass.id, nextClass.class_name, nextClass.level, student.id]
            );
        }

        return res.status(200).json({ message: "Students promoted successfully" });

    } catch (error) {
        console.error("Promotion error:", error);
        return res.status(500).json({ message: "Server error during promotion" });
    }
};




export const getFixedAmount = async (req, res) => {
    try {
        const { classId, feeType } = req.params;

        const result = await client.query(
            "SELECT amount FROM class_fees WHERE class_id = $1 AND fee_type = $2",
            [classId, feeType]
        );

        if (result.rowCount === 0) {
            return res.status(200).json({ message: `No fixed amount found for ${feeType}` });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching fixed fee amount:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



export const updateFixedAmount = async (req, res) => {
    try {
        const { classId, feeType } = req.params;
        const { amount: newAmount, dueDate } = req.body;

        console.log(`Updating fixed fee amount for class: ${classId}, feeType: ${feeType}, newAmount: ${newAmount}, dueDate: ${dueDate}`);

        // 1. Fetch the old amount (if any)
        const feeResult = await client.query(
            "SELECT amount FROM class_fees WHERE class_id = $1 AND fee_type = $2",
            [classId, feeType]
        );

        const oldAmount = feeResult.rowCount > 0 ? parseFloat(feeResult.rows[0].amount) : 0;
        const amountDifference = newAmount - oldAmount;

        console.log(`Old Amount: ${oldAmount}, New Amount: ${newAmount}, Amount Difference: ${amountDifference}`);

        // 2. Insert or update the class fee using UPSERT
        await client.query(
            `INSERT INTO class_fees (class_id, fee_type, amount, due_date)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (class_id, fee_type)
             DO UPDATE SET amount = $3, due_date = $4`,
            [classId, feeType, newAmount, dueDate]
        );

        // 3. Fetch all students in the class
        const students = await client.query(
            "SELECT id FROM students WHERE student_class_id = $1",
            [classId]
        );

        console.log(`Found ${students.rowCount} students`);

        // 4. Update each student's fee
        for (const student of students.rows) {
            const student_id = student.id;

            // Check if student already has this fee type
            const studentFeeResult = await client.query(
                "SELECT amount FROM student_fees WHERE student_id = $1 AND fee_type = $2",
                [student_id, feeType]
            );

            if (studentFeeResult.rowCount > 0) {
                const currentAmount = parseFloat(studentFeeResult.rows[0].amount);
                const updatedAmount = currentAmount + amountDifference;

                await client.query(
                    "UPDATE student_fees SET amount = $1 WHERE student_id = $2 AND fee_type = $3",
                    [updatedAmount, student_id, feeType]
                );

                console.log(`Updated fee for student ${student_id} to ${updatedAmount}`);
            } else {
                await client.query(
                    "INSERT INTO student_fees (student_id, fee_type, amount) VALUES ($1, $2, $3)",
                    [student_id, feeType, newAmount]
                );

                console.log(`Inserted fee for student ${student_id}`);
            }
        }

        res.status(200).json({
            message: "Fee updated successfully and student balances adjusted",
            feeType,
            amount: newAmount,
            dueDate
        });
    } catch (error) {
        console.error("Error updating fixed fee amount:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
