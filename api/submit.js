export default async function handler(req, res) {
    // 1. استحضار رابط جوجل شيت من الخزنة (لأنه طويل ويجب إخفاؤه)
    const SECRET_URL = process.env.MY_GOOGLE_SHEET;

    // 2. كلمة السر محفوظة هنا داخل السيرفر مباشرة (أمان تام)
    const ADMIN_PASS = "RYADANUR1";

    // التأكد من وجود الرابط السري
    if (!SECRET_URL) return res.status(500).json({ error: 'Server Setup Error' });

    try {
        // ============================================================
        // السيناريو الأول: طلب تسجيل دخول المسؤول (Login)
        // ============================================================
        // هنا السيرفر بيرد بنفسه مش بيكلم جوجل شيت
        if (req.method === 'POST' && req.body.action === 'login_admin') {
            if (req.body.password === ADMIN_PASS) {
                return res.status(200).json({ status: 'success' });
            } else {
                return res.status(200).json({ status: 'error', message: 'Wrong Password' });
            }
        }

        // ============================================================
        // السيناريو الثاني: فحص الأمان قبل تسجيل الحضور (الكمين)
        // ============================================================
        if (req.method === 'POST' && req.body.action === 'register') {
            // هل يوجد بصمة وجه في البيانات؟
            const hasVector = req.body.vector && req.body.vector.length > 10;

            // هل أرسل المستخدم كلمة سر المسؤول كإثبات؟ (في حالة التجاوز)
            const providedPass = req.body.admin_password;
            
            // هل كلمة السر المرسلة مطابقة للأصلية؟
            const isAdminProof = providedPass === ADMIN_PASS;

            // ⛔ قاعدة الحظر الصارمة:
            // لو مفيش بصمة وجه.. وكمان مفيش إثبات إنك مسؤول (كلمة السر)
            // يبقى ده طالب بيحاول يخدع النظام عن طريق F12
            if (!hasVector && !isAdminProof) {
                return res.status(403).json({ 
                    result: 'error', 
                    message: '⛔ Security Alert: محاولة تلاعب مكشوفة! تم رفض الطلب.' 
                });
            }
        }

        // ============================================================
        // 3. إكمال الاتصال بجوجل شيت (لو الطلب سليم وعدى من الكمين)
        // ============================================================
        let targetUrl = SECRET_URL;
        let options = {
            method: req.method, // نستخدم نفس نوع الطلب (GET أو POST)
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };

        if (req.method === 'GET') {
            // === حالة عرض السجل (Reports) ===
            const queryString = new URLSearchParams(req.query).toString();
            targetUrl = `${SECRET_URL}?${queryString}`;
            
        } else if (req.method === 'POST') {
            // === حالة تسجيل الحضور (Registration) ===
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
