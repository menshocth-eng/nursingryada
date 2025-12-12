export default async function handler(req, res) {
    // 1. تعريف الثوابت
    const ATTENDANCE_SHEET = process.env.MY_GOOGLE_SHEET;   // شيت الحضور
    const IDENTITY_SHEET = process.env.MY_IDENTITY_SHEET;   // شيت الهوية
    const ADMIN_PASS = "RYADANUR1"; // كلمة سر المسؤول

    // ============================================================
    // 🔥 التعديل الأهم: فحص كلمة السر فوراً (قبل فحص الروابط)
    // ============================================================
    // هذا يضمن أن الدخول يعمل حتى لو الروابط فيها مشكلة
    if (req.method === 'POST' && req.body.action === 'login_admin') {
        if (req.body.password === ADMIN_PASS) {
            return res.status(200).json({ status: 'success' });
        } else {
            return res.status(200).json({ status: 'error', message: 'Wrong Password' });
        }
    }

    // 2. الآن فقط نتأكد من وجود الروابط لباقي العمليات
    if (!ATTENDANCE_SHEET || !IDENTITY_SHEET) {
        return res.status(500).json({ error: 'Server Setup Error: Missing Sheets URLs' });
    }

    try {
        // 3. معرفة نوع العملية المطلوبة (Action)
        let action = req.body.action;
        if (req.method === 'GET') {
            action = req.query.action;
        }

        // 4. توجيه الطلب للشيت المناسب (Smart Routing)
        let targetUrl = ATTENDANCE_SHEET; // الافتراضي: شيت الحضور

        // قائمة العمليات التي تذهب لشيت الهوية (أزلنا login_admin لأنها عولجت بالأعلى)
        const identityActions = ['getAlerts', 'register_identity'];
        
        if (identityActions.includes(action)) {
            targetUrl = IDENTITY_SHEET;
        }

        // ============================================================
        // 5. الحماية من F12 (عند تسجيل الحضور فقط)
        // ============================================================
        if (req.method === 'POST' && action === 'register') {
            const hasVector = req.body.vector && req.body.vector.length > 10;
            const providedPass = req.body.admin_password;
            
            // هل كلمة السر المرسلة مطابقة؟
            if (!hasVector && providedPass !== ADMIN_PASS) {
                return res.status(403).json({ 
                    result: 'error', 
                    message: '⛔ Security Alert: محاولة تلاعب مكشوفة! تم رفض الطلب.' 
                });
            }
        }

        // ============================================================
        // 6. إرسال الطلب لجوجل شيت
        // ============================================================
        let options = {
            method: req.method,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        };

        if (req.method === 'GET') {
            const queryString = new URLSearchParams(req.query).toString();
            targetUrl = `${targetUrl}?${queryString}`;
        } else if (req.method === 'POST') {
            const formData = new URLSearchParams();
            for (const key in req.body) {
                formData.append(key, req.body[key]);
            }
            options.body = formData.toString();
        }

        const response = await fetch(targetUrl, options);
        const data = await response.json();
        
        return res.status(200).json(data);

    } catch (error) {
        return res.status(500).json({ error: 'Connection Error', details: error.message });
    }
}
