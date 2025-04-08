
import client from "../db.mjs";


// ✅ Create Transaction
export const createTransaction = async (req, res) => {
    try {
        console.log("Creating transaction in backend");

        const { studentId, amount, feeType, date, transactionType, payment_method, schoolId, status } = req.body;

        if (!studentId ||  amount === null || amount === undefined || !feeType || !schoolId || !transactionType) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const query = `
            INSERT INTO transactions (student_id, school_id, amount, fee_type, transaction_type, payment_method, status, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const values = [studentId, schoolId, amount, feeType, transactionType, payment_method, status || "Pending", date || new Date()];

        const result = await client.query(query, values);

        console.log("Transaction recorded");
        res.status(201).json({ message: "Transaction recorded", transaction: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ✅ Get Transactions for a Specific Student
export const getTransactions = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { feeType } = req.query; // Optional filter

        if (!studentId) {
            return res.status(400).json({ error: "Student ID is required" });
        }

        let query = `SELECT * FROM transactions WHERE student_id = $1`;
        let values = [studentId];

        if (feeType) {
            query += ` AND fee_type = $2`;
            values.push(feeType);
        }

        query += ` ORDER BY date DESC`;

        const result = await client.query(query, values);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ✅ Get All Transactions with Filters
export const getAllTransactions = async (req, res) => {
    console.log("Received Query Params:", req.query);

    const { schoolId, selectedClass, feeType, startDate, endDate } = req.query;

    if (!schoolId) {
        return res.status(400).json({ message: "School ID is required" });
    }

    try {
        // Step 1: Fetch transactions for the school
        let query = `SELECT * FROM transactions WHERE school_id = $1`;
        let values = [schoolId];

        if (feeType && feeType !== "all") {
            query += ` AND fee_type = $2`;
            values.push(feeType);
        }

        if (startDate && endDate) {
            query += ` AND date BETWEEN $${values.length + 1} AND $${values.length + 2}`;
            values.push(startDate, endDate);
        }

        query += ` ORDER BY date DESC`;

        let transactionsResult = await client.query(query, values);
        let transactions = transactionsResult.rows;

        // Step 2: Extract student IDs
        const studentIds = [...new Set(transactions.map(t => t.student_id))];

        if (studentIds.length === 0) {
            return res.json([]); // No transactions found
        }

        // Step 3: Fetch student details
        const studentQuery = `SELECT s.id, s.student_surname, s.student_first_name, s.student_other_names, c.class_name FROM students s LEFT JOIN classes c ON s.student_class_id = c.id WHERE s.id = ANY($1)`;
        const studentResult = await client.query(studentQuery, [studentIds]);

        // Step 4: Create a map of student details
        console.log("Student Query Result:", studentResult.rows);

        const studentDetailsMap = {};
        studentResult.rows.forEach(student => {
            studentDetailsMap[student.id] = {
                className: student.class_name || "Unknown", // Now storing the class name
                studentName: `${student.student_surname} ${student.student_first_name} ${student.student_other_names || ""}`.trim(),
            };
        });


        console.log("Student Details Map:", studentDetailsMap);


        // Step 5: Attach student details to transactions and filter by class if needed
        console.log("Transactions Before Mapping:", transactions);

        transactions = transactions.map(transaction => ({
            ...transaction,
            className: studentDetailsMap[transaction.student_id]?.className || "Unknown",
            studentName: studentDetailsMap[transaction.student_id]?.studentName || "N/A",
        }));

        console.log("Transactions After Mapping:", transactions);


        if (selectedClass && selectedClass !== "all") {
            transactions = transactions.filter(t => t.className === selectedClass);
        }

        res.json(transactions);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// ✅ Get All Transactions (Global)
export const globalTransactions = async (req, res) => {
    try {
        const result = await client.query(`SELECT * FROM transactions ORDER BY date DESC`);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Error fetching transactions" });
    }
};
