export default async function handler(req, res) {
    // 1. تثبيت كلمة السر
    const ADMIN_PASS = "RYADANUR1";

    try {
        // فحص النبض
        if (req.method === 'GET' && req.query.action === 'ping') {
            return res.status(200).json({ status: 'alive' });
        }

        // تسجيل دخول المسؤول
        if (req.body && req.body.action === 'login_admin') {
            if (req.body.password === ADMIN_PASS) {
                return res.status(200).json({ status: 'success' });
            } else {
                return res.status(200).json({ status: 'error', message: 'Wrong Password' });
            }
        }

        // تجهيز الروابط
        const SHEETS_URL = process.env.MY_GOOGLE_SHEET;
        const IDENTITY_URL = process.env.MY_IDENTITY_SHEET;

        if (!SHEETS_URL) throw new Error("MY_GOOGLE_SHEET is missing!");
        if (!IDENTITY_URL) throw new Error("MY_IDENTITY_SHEET is missing!");

        let targetUrl = SHEETS_URL;
        // توجيه طلبات الهوية
        if (req.body.action === 'getAlerts' || req.body.action === 'register_identity') {
            targetUrl = IDENTITY_URL;
        }

        // إعداد الاتصال بجوجل
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

        // ============================================================
        // 🔥 المنطقة المعدلة: كشف الخطأ الحقيقي
        // ============================================================
        const response = await fetch(targetUrl, options);
        const rawText = await response.text(); // نقرأ الرد كنص أولاً

        try {
            // نحاول تحويله لـ JSON
            const data = JSON.parse(rawText);
            return res.status(200).json(data);
        } catch (jsonError) {
            // لو فشل التحويل، يبقى جوجل رد بـ HTML (خطأ)
            console.error("Google returned non-JSON:", rawText);
            // بنرجع الخطأ للموقع عشان تشوفه بعينك
            return res.status(200).json({ 
                result: "error", 
                message: "Google Error: " + rawText.substring(0, 150).replace(/<[^>]*>?/gm, '') // بناخد ملخص الخطأ ونشيل التاغات
            });
        }

    } catch (error) {
        return res.status(500).json({ error: 'Server Crash', details: error.message });
    }
}
