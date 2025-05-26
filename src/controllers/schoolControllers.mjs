
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import client from "../db.mjs";




export const addSchool = async (req, res) => {
  const { schoolName, schoolAddress, schoolPhone, schoolEmail, schoolWebsite, schoolPassword, paymentMethod, bankName, bankAccountNumber, subAccountCode, mobileMoneyProvider, mobileMoneyNumber, accountName } = req.body;

  console.log("Incoming body: " + JSON.stringify(req.body, null, 2)); // ✅ Pretty printed

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(schoolPassword, saltRounds);

    // Calculate registration and expiration dates
    const registrationDate = new Date();
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 3);

    // Insert school into database
    const schoolQuery = `
      INSERT INTO schools (
        school_name,
        school_address,
        school_phone,
        school_email,
        school_website,
        school_password,
        payment_method,
        bank_name,
        bank_account_number,
        mobile_money_provider,
        mobile_money_number,
        subaccount_code,
        registration_date,
        registration_expiration_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *;
    `;

    const schoolValues = [
      schoolName,
      schoolAddress,
      schoolPhone,
      schoolEmail,
      schoolWebsite,
      hashedPassword,
      paymentMethod,
      bankName,
      bankAccountNumber,
      mobileMoneyProvider,
      mobileMoneyNumber,
      subAccountCode,
      registrationDate,
      expirationDate,
    ];

    const schoolResult = await client.query(schoolQuery, schoolValues);
    const savedSchool = schoolResult.rows[0];

    const defaultClasses = [
      { name: "Creche", level: 0 },
      { name: "Nursery 1", level: 1 },
      { name: "Nursery 2", level: 2 },
      { name: "Kindergarten 1", level: 3 },
      { name: "Kindergarten 2", level: 4 },
      { name: "Basic 1", level: 5 },
      { name: "Basic 2", level: 6 },
      { name: "Basic 3", level: 7 },
      { name: "Basic 4", level: 8 },
      { name: "Basic 5", level: 9 },
      { name: "Basic 6", level: 10 },
      { name: "Basic 7", level: 11 },
      { name: "Basic 8", level: 12 },
      { name: "Basic 9", level: 13 },
    ];

    const classQuery = `
      INSERT INTO classes (class_name, school_id, level)
      VALUES ($1, $2, $3);
    `;

    const classPromises = defaultClasses.map(classData =>
      client.query(classQuery, [classData.name, savedSchool.id, classData.level])
    );

    await Promise.all(classPromises);

    return res.status(201).json({
      message: "School, default classes, and fee types created successfully",
      school: savedSchool,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const editSchoolDetails = async (req, res) => {
  const {
    schoolId,
    schoolName,
    schoolAddress,
    schoolPhone,
    schoolEmail,
    schoolWebsite,
    schoolPassword,
    mobileMoneyProvider,
    mobileMoneyNumber,
    bankName,
    bankAccountName,
    bankAccountNumber,
    settlementBankCode,
  } = req.body;

  try {
    // Check if the school exists
    const schoolCheck = await client.query("SELECT * FROM schools WHERE id = $1", [schoolId]);
    if (schoolCheck.rows.length === 0) {
      return res.status(404).json({ message: "School not found" });
    }

    let updateQuery = "UPDATE schools SET ";
    const updateFields = [];
    const updateValues = [];

    if (schoolName) {
      updateFields.push("school_name = $" + (updateValues.length + 1));
      updateValues.push(schoolName);
    }
    if (schoolAddress) {
      updateFields.push("school_address = $" + (updateValues.length + 1));
      updateValues.push(schoolAddress);
    }
    if (schoolPhone) {
      updateFields.push("school_phone = $" + (updateValues.length + 1));
      updateValues.push(schoolPhone);
    }
    if (schoolEmail) {
      updateFields.push("school_email = $" + (updateValues.length + 1));
      updateValues.push(schoolEmail);
    }
    if (schoolWebsite) {
      updateFields.push("school_website = $" + (updateValues.length + 1));
      updateValues.push(schoolWebsite);
    }
    if (schoolPassword) {
      const hashedPassword = await bcrypt.hash(schoolPassword, 10);
      updateFields.push("school_password = $" + (updateValues.length + 1));
      updateValues.push(hashedPassword);
    }

    // Payment details
    if (mobileMoneyProvider) {
      updateFields.push("mobile_money_provider = $" + (updateValues.length + 1));
      updateValues.push(mobileMoneyProvider);
    }
    if (mobileMoneyNumber) {
      updateFields.push("mobile_money_number = $" + (updateValues.length + 1));
      updateValues.push(mobileMoneyNumber);
    }
    if (bankName) {
      updateFields.push("bank_name = $" + (updateValues.length + 1));
      updateValues.push(bankName);
    }
   /*  if (bankAccountName) {
      updateFields.push("bank_account_name = $" + (updateValues.length + 1));
      updateValues.push(bankAccountName);
    } */
    if (bankAccountNumber) {
      updateFields.push("bank_account_number = $" + (updateValues.length + 1));
      updateValues.push(bankAccountNumber);
    }
    if (settlementBankCode) {
      updateFields.push("settlement_bank_code = $" + (updateValues.length + 1));
      updateValues.push(settlementBankCode);
    }

    if (updateFields.length > 0) {
      updateQuery += updateFields.join(", ") + " WHERE id = $" + (updateValues.length + 1);
      updateValues.push(schoolId);

      await client.query(updateQuery, updateValues);
    }

    return res.status(200).json({ message: "School details updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


export const addFeeTypeToSchool = async (req, res) => {
  try {
    const { schoolId, feeType, amount } = req.body;

    if (!schoolId || !feeType) {
      return res.status(400).json({ message: "Missing required fields." });
    }

    await client.query("BEGIN"); // Start transaction

    // Check if the school exists
    const schoolResult = await client.query("SELECT * FROM schools WHERE id = $1", [schoolId]);
    if (schoolResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "School not found." });
    }

    // Check if the fee type already exists for the school
    const feeExists = await client.query(
      "SELECT * FROM fee_types WHERE school_id = $1 AND fee_type = $2",
      [schoolId, feeType]
    );

    if (feeExists.rows.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Fee type already exists for this school." });
    }

    // Insert the new fee type
    const feeInsert = await client.query(
      "INSERT INTO fee_types (school_id, fee_type, amount) VALUES ($1, $2, $3) RETURNING id",
      [schoolId, feeType, amount]
    );
    const feeId = feeInsert.rows[0].id;

    // Update classes in the school to include the new fee type
    await client.query(
      `INSERT INTO class_fees (class_id, fee_type, amount)
       SELECT id, $1, $2 FROM classes WHERE school_id = $3`,
      [feeType, amount, schoolId]
    );

    // Update all students in the school with the new fee type
    await client.query(
      `INSERT INTO student_fees (student_id, fee_type, amount, status)
       SELECT id, $1, $2, 'Unpaid' FROM students WHERE school_id = $3`,
      [feeType, amount, schoolId]
    );

    await client.query("COMMIT"); // Commit transaction

    res.status(200).json({ message: "Fee type added to school, classes, and students successfully." });
  } catch (error) {
    await client.query("ROLLBACK"); // Rollback transaction in case of error
    console.error("Error adding fee type:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    /* client.release();  */// Release the client back to the client
  }
};

export const deleteFeeTypeFromSchool = async (req, res) => {
  const { schoolId, feeType } = req.body;

  if (!schoolId || !feeType) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  try {
    await client.query("BEGIN"); // Start transaction

    // Check if fee type exists
    const feeCheck = await client.query(
      "SELECT * FROM fee_types WHERE school_id = $1 AND fee_type = $2",
      [schoolId, feeType]
    );

    if (feeCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Fee type not found for this school." });
    }

    // Delete from student_fees
    await client.query(
      "DELETE FROM student_fees WHERE fee_type = $1 AND student_id IN (SELECT id FROM students WHERE school_id = $2)",
      [feeType, schoolId]
    );

    // Delete from class_fees
    await client.query(
      "DELETE FROM class_fees WHERE fee_type = $1 AND class_id IN (SELECT id FROM classes WHERE school_id = $2)",
      [feeType, schoolId]
    );

    // Delete from fee_types
    await client.query(
      "DELETE FROM fee_types WHERE school_id = $1 AND fee_type = $2",
      [schoolId, feeType]
    );

    await client.query("COMMIT");

    res.status(200).json({ message: "Fee type and related records deleted successfully." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error deleting fee type:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getFeeTypesForSchool = async (req, res) => {
  try {
    const { schoolId } = req.params; // Get schoolId from request parameters

    if (!schoolId) {
      return res.status(400).json({ message: "School ID is required." });
    }

    // Query to fetch all fee types for the given school
    const feeTypesResult = await client.query(
      "SELECT id, fee_type, amount FROM fee_types WHERE school_id = $1",
      [schoolId]
    );

    if (feeTypesResult.rows.length === 0) {
      return res.status(201).json({ message: "No fee types found for this school." });
    }

    res.status(200).json({ feeTypes: feeTypesResult.rows });
  } catch (error) {
    console.error("Error fetching fee types:", error);
    res.status(500).json({ message: "Internal server error" });
  } finally {
   /*  client.release(); */ // Release the client back to the client
  }
};


export const getAllSchools = async (req, res) => {
    try {
      const { rows: schools } = await client.query("SELECT * FROM schools");
      return res.json(schools);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  
  // Get a single school by ID
  export const getASchool = async (req, res) => {
    const { schoolId } = req.params;
    try {
      const { rows } = await client.query("SELECT * FROM schools WHERE id = $1", [schoolId]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "School not found" });
      }
      return res.json(rows[0]);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
  
  // Login school
  export const loginSchool = async (req, res) => {
    const { schoolEmail, schoolPassword } = req.body;
  
    try {
      // Check if the school exists
      const { rows } = await client.query("SELECT * FROM schools WHERE school_email = $1", [schoolEmail]);
      if (rows.length === 0) {
        return res.status(404).json({ message: "School not found" });
      }
  
      const school = rows[0];
  
      // Validate password
      const isMatch = await bcrypt.compare(schoolPassword, school.school_password);
      if (!isMatch) {
        return res.status(400).json({ message: "Invalid credentials" });
      }
  
      // Generate JWT token
      const token = jwt.sign({ schoolId: school.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });
  
      res.status(200).json({
        message: "Login successful",
        token,
        schoolId: school.id,
        schoolName: school.school_name,
        schoolAddress: school.school_address,
        schoolPhone: school.school_phone,
        schoolEmail: school.school_email,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Server error" });
    }
  };


// PUT /schools/update-subscription/:id
export const upgradeSubscription = async (req, res) => {
  const schoolId = req.params.id;
  const { registration_expiration_date } = req.body;

  try {
    const result = await client.query(
      `UPDATE schools
       SET registration_expiration_date = $1
       WHERE id = $2
       RETURNING *`,
      [registration_expiration_date, schoolId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "School not found" });
    }

    res.status(200).json({ message: "Subscription updated", data: result.rows[0] });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ message: "Failed to update subscription" });
  }
};

export const getSchoolParents = async (req, res) => {
  const { schoolId } = req.params;

  try {
    const result = await client.query(
      'SELECT id, student_parent_surname, student_parent_first_name, student_parent_number FROM students WHERE school_id = $1 ORDER BY student_parent_surname ASC',
      [schoolId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching parents:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export const activateBulkSms = async (req, res) => {
  const { schoolId } = req.params;

  if (!schoolId) {
    return res.status(400).json({ error: 'schoolId is required' });
  }

  try {
    const result = await client.query(
      `UPDATE schools
       SET sms_units = COALESCE(sms_units, 10)
       WHERE id = $1
       RETURNING id, sms_units`,
      [schoolId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'School not found' });
    }

    return res.status(200).json({ message: 'Bulk SMS activated', school: result.rows[0] });
  } catch (err) {
    console.error('Error activating bulk SMS:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

export const getSmsUnits = async (req, res) => {
  const { schoolId } = req.params;

  try {
    const result = await client.query(
      `SELECT sms_units
       FROM schools
       WHERE id = $1`,
      [schoolId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching SMS units:', err);
}}