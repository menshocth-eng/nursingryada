export default async function handler(req, res) {
    // ============================================================
    // 1. الأولوية القصوى: فحص كلمة السر فوراً
    // ============================================================
    // (الكود ده هيشتغل حتى لو الروابط مش موجودة)
    if (req.method === 'POST' && req.body && req.body.action === 'login_admin') {
        const ADMIN_PASS = "RYADANUR1"; // كلمة السر
        if (req.body.password === ADMIN_PASS) {
            return res.status(200).json({ status: 'success' });
        } else {
            return res.status(200).json({ status: 'error', message: 'Wrong Password' });
        }
    }

    // ============================================================
    // 2. دلوقتي بس نبدأ نشوف الروابط (عشان الحضور)
    // ============================================================
    const ATTENDANCE_SHEET = process.env.MY_GOOGLE_SHEET;
    const IDENTITY_SHEET = process.env.MY_IDENTITY_SHEET;
    const ADMIN_PASS = "RYADANUR1"; 

    if (!ATTENDANCE_SHEET || !IDENTITY_SHEET) {
        return res.status(500).json({ error: 'Server Setup Error: Missing URLs' });
    }

    try {
        let action = req.body.action || req.query.action;
        let targetUrl = ATTENDANCE_SHEET;
        
        if (['getAlerts', 'register_identity'].includes(action)) {
            targetUrl = IDENTITY_SHEET;
        }

        // الحماية من F12 عند تسجيل الحضور
        if (req.method === 'POST' && action === 'register') {
            const hasVector = req.body.vector && req.body.vector.length > 10;
            const providedPass = req.body.admin_password;
            if (!hasVector && providedPass !== ADMIN_PASS) {
                return res.status(403).json({ result: 'error', message: '⛔ Security Alert!' });
            }
        }

        // الاتصال بجوجل
        let options = {
            method: req.method,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };

        if (req.method === 'POST') {
            const formData = new URLSearchParams();
            for (const key in req.body) formData.append(key, req.body[key]);
            options.body = formData.toString();
        } else {
            targetUrl += `?${new URLSearchParams(req.query).toString()}`;
        }

        const response = await fetch(targetUrl, options);
        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
}
