export default async function handler(req, res) {
    // 1. تثبيت كلمة السر (بدون أي احتمالات)
    const ADMIN_PASS = "RYADANUR1";

    try {
        // =========================================================
        // اختبار النبض: هل السيرفر شغال؟
        // =========================================================
        if (req.method === 'GET' && req.query.action === 'ping') {
            return res.status(200).json({ status: 'alive' });
        }

        // =========================================================
        // 2. تسجيل دخول المسؤول (الأولوية القصوى)
        // =========================================================
        if (req.body && req.body.action === 'login_admin') {
            if (req.body.password === ADMIN_PASS) {
                return res.status(200).json({ status: 'success' });
            } else {
                // بنرجع 200 برضه بس مع رسالة خطأ عشان الفرونت اند ميعتبرهاش كارثة
                return res.status(200).json({ status: 'error', message: 'Wrong Password' });
            }
        }

        // =========================================================
        // 3. باقي العمليات (تعتمد على Env Vars)
        // =========================================================
        const SHEETS_URL = process.env.MY_GOOGLE_SHEET;
        const IDENTITY_URL = process.env.MY_IDENTITY_SHEET;

        // لو المتغيرات مش موجودة، نبلغ المستخدم بدل ما نعمل Crash
        if (!SHEETS_URL) throw new Error("MY_GOOGLE_SHEET is missing from Vercel!");
        if (!IDENTITY_URL) throw new Error("MY_IDENTITY_SHEET is missing from Vercel!");

        let targetUrl = SHEETS_URL;
        if (req.body.action === 'getAlerts' || req.body.action === 'register_identity') {
            targetUrl = IDENTITY_URL;
        }

        // تنفيذ الاتصال بجوجل
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
        if (!response.ok) throw new Error(`Google Sheets responded with ${response.status}`);
        
        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        // لو حصل أي مصيبة، نرجع رسالة نفهم منها السبب
        return res.status(500).json({ error: 'Server Crash', details: error.message });
    }
}
