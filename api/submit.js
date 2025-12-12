export default async function handler(req, res) {
    const SECRET_URL = process.env.MY_GOOGLE_SHEET;

    if (!SECRET_URL) {
        return res.status(500).json({ error: 'Server Setup Error' });
    }

    const formData = new URLSearchParams();
    for (const key in req.body) {
        formData.append(key, req.body[key]);
    }

    try {
        const response = await fetch(SECRET_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData.toString()
        });

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Failed to connect to Google' });
    }
}
