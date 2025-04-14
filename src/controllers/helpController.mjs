import client from '../db.mjs';


export const postHelp = async (req, res) => {
  const { firstName, lastName, email, phone, message, services } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required.' });
  }

  try {
    const query = `
      INSERT INTO contacts (first_name, last_name, email, phone, message, services)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const result = await client.query(query, [
      firstName,
      lastName,
      email,
      phone,
      message,
      services.join(', '), // Convert array to comma-separated string
    ]);

    res.status(201).json({ message: 'Message stored successfully', contact: result.rows[0] });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};


