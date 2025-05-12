
import client from '../db.mjs'
import axios from "axios";

export const getAllChildren = async (req, res) => {
    const { parentNumber } = req.params;

    try {
        const result = await client.query(
            "SELECT * FROM students WHERE student_parent_number = $1",
            [parentNumber]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No children found" });
        }

        return res.status(200).json(result.rows);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const verifyParentNumber = async (req, res) => {
    try {
        const { phoneNumber } = req.body;
        if (!phoneNumber) {
            return res.status(400).json({ message: "Phone number is required." });
        }

        const query = `
            SELECT 
                s.id as student_id, 
                s.student_first_name,
                s.student_surname,
                s.student_class_name, 
                s.student_address, 
                s.student_parent_first_name, 
                s.student_parent_surname,
                s.student_other_names,
                s.student_parent_number,
                s.student_parent_email, 
                s.schoold_id,
                sc.school_name,
                sc.school_email,
                sc.school_website,
                sc.subaccount_code,
                ARRAY(
                    SELECT jsonb_build_object(
                        'feetype', f.fee_type, 
                        'amount', f.amount
                    )
                    FROM student_fees f
                    WHERE f.student_id = s.id
                ) AS fees
            FROM students s
            JOIN schools sc ON s.school_id = sc.id
            WHERE s.student_parent_number = $1
        `;

        const result = await client.query(query, [phoneNumber]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "No students found for this phone number." });
        }

        res.status(200).json({
            message: "Student number verified successfully.",
            students: result.rows,
        });
    } catch (error) {
        console.error("Error verifying student number:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};




export const sendParentMessage = async (req, res) => {
    console.log("sending message")
    const { messageTo, messageFrom, message } = req.body;
    const data = {
        "sender": messageFrom,
        "message": message,
        "recipients": [messageTo],
        // When sending SMS to Nigerian recipients, specify the use_case field
        // "use_case" = "transactional"
      };

        const config = {
        method: 'post',
        url: 'https://sms.arkesel.com/api/v2/sms/send',
        headers: {
        'api-key': 'Q2FiT3lFbGxURHNob1pGbldwTEE'
        },
        data : data
        };

    axios(config)
    .then(function (response) {
    console.log(JSON.stringify(response.data));
    res.status(200).json(response.data)
    })
    .catch(function (error) {
    console.log(error);
});

}

export const addParentEmailToStudents = async (req, res) => {
    try {
        const { parentEmail, studentIds } = req.body;

        if (!parentEmail || !studentIds || !Array.isArray(studentIds)) {
            return res.status(400).json({ message: "Parent email and student IDs are required." });
        }

        const query = `
            UPDATE students
            SET student_parent_email = $1
            WHERE id = ANY($2::uuid[])
        `;

        await client.query(query, [parentEmail, studentIds]);

        res.status(200).json({ message: "Parent email successfully added to student records." });

    } catch (error) {
        console.error("Error updating parent email:", error);
        res.status(500).json({ message: "Internal server error." });
    }
};
