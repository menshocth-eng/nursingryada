export default async function handler(req, res) {
    const SECRET_URL = process.env.MY_GOOGLE_SHEET;

    // التأكد من وجود الرابط السري
    if (!SECRET_URL) return res.status(500).json({ error: 'Server Setup Error' });

    try {
        let targetUrl = SECRET_URL;
        let options = {
            method: req.method, // نستخدم نفس نوع الطلب (GET أو POST)
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };

        if (req.method === 'GET') {
            // === حالة عرض السجل (Reports) ===
            // بناخد الاوامر من الرابط (زي التاريخ ونوع التقرير) ونبعتها لجوجل
            const queryString = new URLSearchParams(req.query).toString();
            targetUrl = `${SECRET_URL}?${queryString}`;
            
        } else if (req.method === 'POST') {
            // === حالة تسجيل الحضور (Registration) ===
            // بنجهز البيانات عشان نبعتها لجوجل
            const formData = new URLSearchParams();
            for (const key in req.body) {
                formData.append(key, req.body[key]);
            }
            options.body = formData.toString();
        }

        // تنفيذ الاتصال بجوجل شيت
        const response = await fetch(targetUrl, options);
        const data = await response.json();
        
        // الرد بالنتيجة
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Connection Error', details: error.message });
    }
}
