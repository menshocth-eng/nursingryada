export default async function handler(req, res) {
    // 1. كلمة السر (خط الدفاع الأول - السيرفر حافظها صم)
    const ADMIN_PASS = "RYADANUR1";

    // ============================================================
    // 🔥 فحص كلمة السر فوراً (قبل ما يشوف الروابط أو يكلم جوجل)
    // ============================================================
    // الحركة دي بتخلي الدخول يشتغل حتى لو روابط جوجل فيها مشكلة
    if (req.method === 'POST' && req.body.action === 'login_admin') {
        if (req.body.password === ADMIN_PASS) {
            return res.status(200).json({ status: 'success' });
        } else {
            return res.status(200).json({ status: 'error', message: 'Wrong Password' });
        }
    }

    // 2. استحضار الروابط من الخزنة لباقي العمليات
    const ATTENDANCE_SHEET = process.env.MY_GOOGLE_SHEET;
    const IDENTITY_SHEET = process.env.MY_IDENTITY_SHEET;

    // لو الروابط مش موجودة، نطلع خطأ (بس خلاص الدخول فوق عدى بسلام)
    if (!ATTENDANCE_SHEET || !IDENTITY_SHEET) {
        return res.status(500).json({ error: 'Server Config Error: Missing URLs' });
    }

    try {
        // تحديد نوع العملية
        let action = req.body.action;
        if (req.method === 'GET') action = req.query.action;

        // 3. توجيه الطلب (Routing)
        let targetUrl = ATTENDANCE_SHEET; // الافتراضي
        
        // لو العملية تبع الهوية أو التنبيهات، نوديها لشيت الهوية
        if (['getAlerts', 'register_identity'].includes(action)) {
            targetUrl = IDENTITY_SHEET;
        }

        // ============================================================
        // 4. الحماية من F12 (عند تسجيل الحضور فقط)
        // ============================================================
        if (req.method === 'POST' && action === 'register') {
            const hasVector = req.body.vector && req.body.vector.length > 10;
            const providedPass = req.body.admin_password;
            
            // لو مفيش بصمة وجه، ولا فيه كلمة سر صحيحة -> اطرد الطالب
            if (!hasVector && providedPass !== ADMIN_PASS) {
                return res.status(403).json({ 
                    result: 'error', 
                    message: '⛔ Security Alert: محاولة تلاعب مكشوفة! تم رفض الطلب.' 
                });
            }
        }

        // ============================================================
        // 5. الاتصال بجوجل (المطبخ)
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
