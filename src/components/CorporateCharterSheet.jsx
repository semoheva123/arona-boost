import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  ShieldCheck,
  Award,
  Globe2,
  ArrowLeft,
  Briefcase,
  BookOpen,
  BellRing,
  CheckCircle2,
  FileBadge,
  Download
} from 'lucide-react';
import { HospitalityCoverageContent } from './HospitalityCoverageModal';
import ModalPortal from './ModalPortal';

const CORPORATE_PRINCIPLES = [
  {
    num: 1,
    title: 'القضاء على العمل القسري وحرية التعاقد',
    body: 'نحن نحظر بشكل صارم أي شكل من أشكال الإلزام، ونضمن أن يشارك كل موظف في منظومة Arona Boost بشكل طوعي كامل مع تمتعه بحرية اختيار فئته واسترداد ضمانه عند انتهاء العقد.'
  },
  {
    num: 2,
    title: 'حظر عمل القاصرين والالتزام بالسن القانوني',
    body: 'تلتزم شركة Arona Boost بألا يقل عمر المتقدم عن 18 عاماً، ونضمن أن جميع الموظفين يعملون ضمن الأطر القانونية الرقمية المعتمدة دولياً.'
  },
  {
    num: 3,
    title: 'تعزيز المساواة وتكافؤ الفرص عالمياً',
    body: 'توفر المنصة فرص عمل وتقييم رقمي متساوية لجميع الأعضاء دون أي تمييز على أساس الجنس أو الجنسية أو الخلفية الجغرافية.'
  },
  {
    num: 4,
    title: 'احترام التنوع الثقافي والسياحي',
    body: 'نحترم الخلفيات الثقافية المتنوعة لموظفينا وشركائنا من المنتجعات والفنادق والمعالم السياحية حول العالم، ونسعى لبيئة عمل شاملة ومحترمة.'
  },
  {
    num: 5,
    title: 'ضمان العمل المسترد بعد 365 يوماً',
    body: 'يُحفظ مبلغ توثيق الفئة الوظيفية كـ «ضمان عمل رسمي» باسم الموظف لمدة 365 يوماً، ويُسترد بالكامل إلى محفظة الدخل عند إتمام مدة العقد.'
  },
  {
    num: 6,
    title: 'تحسين التوازن بين العمل والحياة اليومية',
    body: 'تُصمّم مهام تقييم السفر اليومية لتُنجز بمرونة كاملة عبر الهاتف الذكي خلال دقائق معدودة، مما يضمن توازناً مثالياً مع التزامات الموظف اليومية.'
  },
  {
    num: 7,
    title: 'التسوية الفورية للعوائد بعملة USDT',
    body: 'تُودع عوائد التقييم اليومي وعمولات الفريق ومكافآت الظرف الأحمر تلقائياً وبشكل فوري في «محفظة الدخل» القابلة للسحب.'
  },
  {
    num: 8,
    title: 'التدرج المهني عبر برنامج «رحلة النجوم»',
    body: 'تمنح Arona Boost مساراً وظيفياً واضحاً من «موظف رسمي» حتى «مدير التوظيف الإقليمي» بمكافآت نقدية وهدايا عينية ورواتب شهرية ثابتة.'
  },
  {
    num: 9,
    title: 'التحسين المستمر وأمان البلوكشين',
    body: 'نلتزم بتدقيق جميع المعاملات عبر عقود USDT الذكية (TRC20 / BEP20) وحماية الحسابات برمز الدفع المالي (PIN).'
  },
  {
    num: 10,
    title: 'الشفافية والترحيب بملاحظات الموظفين',
    body: 'نرحب دائماً بمقترحات الموظفين والشركاء عبر مكتب المساندة التنفيذية لتعزيز الشفافية وجودة بيئة العمل.'
  }
];

const JOB_CAREER_LADDER = [
  {
    title: 'أخصائي التوظيف',
    req1: 'وصول عدد أعضاء الفئة A المباشرين إلى 6 أعضاء مفعلين على الأقل.',
    req2: 'وجود عضوين أو أكثر من موظفي المستوى A3 ضمن فريقك.',
    bonus: 'مكافأة ترقية لمرة واحدة: 50 USDT',
    salary: null
  },
  {
    title: 'مساعد التوظيف',
    req1: 'وصول إجمالي أعضاء الفريق (الفئات A و B و C) إلى 30 عضواً على الأقل.',
    req2: 'وجود 12 موظفاً أو أكثر من المستوى A3 أو أعلى.',
    bonus: 'مكافأة ترقية لمرة واحدة: 200 USDT',
    salary: 'راتب شهري ثابت: 100 USDT'
  },
  {
    title: 'مشرف التوظيف',
    req1: 'وصول إجمالي أعضاء الفريق (الفئات A و B و C) إلى 100 عضو على الأقل.',
    req2: 'وجود 40 موظفاً أو أكثر من المستوى A3 أو أعلى.',
    bonus: 'مكافأة ترقية لمرة واحدة: 500 USDT',
    salary: 'راتب شهري ثابت: 300 USDT'
  },
  {
    title: 'مدير التوظيف',
    req1: 'وصول إجمالي أعضاء الفريق (الفئات A و B و C) إلى 300 عضو على الأقل.',
    req2: 'وجود 120 موظفاً أو أكثر من المستوى A3 أو أعلى.',
    bonus: 'مكافأة لمرة واحدة: 2000 USDT + هاتف iPhone 17 Pro Max',
    salary: 'راتب شهري ثابت: 500 USDT'
  },
  {
    title: 'مدير التوظيف الإقليمي',
    req1: 'وصول إجمالي أعضاء الفريق (الفئات A و B و C) إلى 800 عضو على الأقل.',
    req2: 'وجود 300 موظف أو أكثر من المستوى A3 أو أعلى.',
    bonus: 'مكافأة لمرة واحدة: 5000 USDT + سيارة سيدان حديثة',
    salary: 'راتب شهري ثابت: 2000 USDT'
  }
];

export default function CorporateCharterSheet({
  isOpen,
  initialSection = 'charter',
  onClose,
  onGoToEarnings
}) {
  const [subTab, setSubTab] = useState(initialSection || 'charter');
  const [downloadingCert, setDownloadingCert] = useState(false);

  useEffect(() => {
    if (isOpen && initialSection) {
      setSubTab(initialSection);
    }
  }, [isOpen, initialSection]);

  if (!isOpen) return null;

  const handleDownloadCorporateCert = () => {
    setDownloadingCert(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 760;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FCFBF7';
      ctx.fillRect(0, 0, 1080, 760);

      ctx.strokeStyle = '#07182B';
      ctx.lineWidth = 10;
      ctx.strokeRect(28, 28, 1024, 704);
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(44, 44, 992, 672);

      const headerGrad = ctx.createLinearGradient(60, 60, 1020, 180);
      headerGrad.addColorStop(0, '#051322');
      headerGrad.addColorStop(1, '#0D6E68');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(60, 60, 960, 118);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#F5D076';
      ctx.font = 'bold 28px Cairo, sans-serif';
      ctx.fillText('ARONA BOOST INTERNATIONAL HOSPITALITY & TOURISM', 540, 110);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 22px Cairo, sans-serif';
      ctx.fillText('شهادة الاعتماد والتسجيل التجاري الرسمي لمنظومة التقييم السياحي', 540, 152);

      ctx.fillStyle = '#07182B';
      ctx.font = 'bold 26px Cairo, sans-serif';
      ctx.fillText('وثيقة ترخيص وتشغيل العقود الرقمية الدولية', 540, 245);

      ctx.fillStyle = '#334155';
      ctx.font = '20px Cairo, sans-serif';
      ctx.fillText('تشهد هيئة الاعتماد التنفيذي أن شركة Arona Boost مسجّلة ومعتمدة رسمياً', 540, 305);
      ctx.fillText('لإدارة عقود الترويج والتقييم الرقمي للمنتجعات والفنادق والمعالم السياحية الشريكة', 540, 345);
      ctx.fillText('وفق معايير التسوية الفورية بعملة USDT وضمان حقوق الموظفين المعتمدين.', 540, 385);

      ctx.fillStyle = '#07182B';
      ctx.fillRect(120, 430, 840, 130);
      ctx.strokeStyle = '#F5D076';
      ctx.lineWidth = 2;
      ctx.strokeRect(120, 430, 840, 130);

      ctx.fillStyle = '#F5D076';
      ctx.font = 'bold 20px monospace';
      ctx.fillText('LICENSE REG NO: AB-INTL-2024-884920   |   STATUS: ACTIVE & VERIFIED', 540, 480);
      ctx.fillStyle = '#E2E8F0';
      ctx.font = 'bold 19px Cairo, sans-serif';
      ctx.fillText('نطاق الاعتماد: المنتجعات العالمية • الفنادق 5 نجوم • المعالم السياحية الدولية', 540, 525);

      ctx.fillStyle = '#0D7A72';
      ctx.font = 'bold 20px Cairo, sans-serif';
      ctx.fillText('✓ موثّق بالختم الإلكتروني الرسمي — مجلس إدارة Arona Boost', 540, 640);

      const link = document.createElement('a');
      link.download = 'Arona-Boost-Official-Certificate.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloadingCert(false);
    }
  };

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[95] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center"
        onClick={onClose}
      >
        <div
          className="w-full max-w-[430px] max-h-[92dvh] flex flex-col rounded-t-[30px] sm:rounded-[30px] bg-[#F4F7FB] shadow-2xl animate-sheet overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Royal Sovereign Header */}
          <div
            className="px-5 py-4 text-white flex items-center justify-between shrink-0 border-b border-[#F5D076]/25"
            style={{
              background: 'linear-gradient(145deg, #051322 0%, #0A2542 60%, #0D6E68 100%)'
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/12 border border-[#F5D076]/35 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-[#F5D076]" />
              </div>
              <div>
                <h3 className="font-display text-sm font-extrabold text-white">
                  الوثائق والشهادات الرسمية — Arona Boost
                </h3>
                <p className="text-[10.5px] text-teal-100/90">
                  نبذة الشركة • شهادة الاعتماد • وصف الوظيفة • بيان الشركة
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/12 hover:bg-white/22 flex items-center justify-center text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 6-Pill Document Switcher */}
          <div className="px-3.5 pt-3 pb-1 shrink-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'about', label: 'نبذة عن الشركة', Icon: BookOpen },
              { id: 'certificate', label: 'شهادة الاعتماد', Icon: FileBadge },
              { id: 'job', label: 'وصف الوظيفة', Icon: Briefcase },
              { id: 'charter', label: 'بيان الشركة', Icon: ShieldCheck },
              { id: 'guidelines', label: 'إرشادات الموظف', Icon: BellRing },
              { id: 'map', label: 'خريطة العقود', Icon: Globe2 }
            ].map(({ id, label, Icon }) => {
              const active = subTab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSubTab(id)}
                  className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-extrabold border transition-all cursor-pointer ${
                    active
                      ? 'bg-[#07182B] text-[#F5D076] border-[#07182B]'
                      : 'bg-white text-slate-600 border-slate-200/90'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {subTab === 'about' && (
              <div className="space-y-3">
                <div className="exec-royal-surface rounded-[24px] p-4 text-white border border-[#F5D076]/30 space-y-2">
                  <span className="inline-block rounded-full bg-[#F5D076]/20 border border-[#F5D076]/40 px-2.5 py-0.5 text-[10px] font-extrabold text-[#F5D076]">
                    Arona Boost Tourism & Hospitality Marketing
                  </span>
                  <h4 className="font-display text-base font-extrabold">
                    شركة رائدة في الترويج والتصنيف الرقمي للسياحة العالمية
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    تختص منظومة Arona Boost في إدارة عقود الترويج الرقمي ورفع مؤشرات الظهور والتقييم
                    للمنتجعات العالمية الفاخرة والفنادق ذات الخمس نجوم والمعالم السياحية الشريكة عبر
                    شبكة موظفين معتمدين بدوام جزئي مرن عبر الإنترنت.
                  </p>
                </div>

                <div className="exec-card rounded-2xl p-4 space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  <h5 className="font-display text-sm font-extrabold text-[#07182B]">
                    نموذج العمل المشترك مع الشركاء الدوليين
                  </h5>
                  <p>
                    تخصص إدارات المنتجعات والفنادق والهيئات السياحية ميزانيات ترويجية دورية لرفع
                    تقييماتها وتفاعل المسافرين معها على المنصات العالمية. تقوم Arona Boost بتوزيع هذه
                    العقود رقمياً على موظفيها المعتمدين مقابل عوائد يومية ثابتة وموثقة بعملة USDT.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-center">
                      <p className="font-display text-sm font-extrabold text-[#07182B]">+190</p>
                      <p className="text-[10px] text-slate-500 font-bold">منتجع وفندق شريك</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-center">
                      <p className="font-display text-sm font-extrabold text-[#0D7A72]">365 يوم</p>
                      <p className="text-[10px] text-slate-500 font-bold">ضمان عقد مسترد</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-2.5 text-center">
                      <p className="font-display text-sm font-extrabold text-amber-700">24/7</p>
                      <p className="text-[10px] text-slate-500 font-bold">تسوية USDT آلية</p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSubTab('certificate')}
                  className="w-full rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-300/80 p-3.5 flex items-center justify-between text-xs font-extrabold text-[#07182B] cursor-pointer"
                >
                  <span className="inline-flex items-center gap-2">
                    <FileBadge className="w-4 h-4 text-amber-700" />
                    <span>عرض شهادة الاعتماد والتسجيل التجاري الرسمي للشركة</span>
                  </span>
                  <ArrowLeft className="w-4 h-4 text-amber-700" />
                </button>
              </div>
            )}

            {subTab === 'certificate' && (
              <div className="space-y-3">
                <div className="relative overflow-hidden rounded-[26px] bg-[#FCFBF7] border-2 border-[#D4AF37]/75 p-4 shadow-md">
                  <div className="border border-[#07182B]/15 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                      <div>
                        <p className="text-[9.5px] font-extrabold tracking-wider text-[#0D7A72] uppercase ltr-num">
                          CERTIFICATE OF INCORPORATION & ACCREDITATION
                        </p>
                        <h4 className="font-display text-sm font-extrabold text-[#07182B] mt-0.5">
                          شهادة الاعتماد والتسجيل التجاري الدولي
                        </h4>
                      </div>
                      <span className="ltr-num rounded-lg bg-[#07182B] text-[#F5D076] px-2.5 py-1 text-[10px] font-extrabold shrink-0">
                        AB-884920
                      </span>
                    </div>

                    <p className="text-[11.5px] text-slate-600 leading-relaxed">
                      يُصادق مجلس الاعتماد الدولي للسياحة والضيافة الرقمية على أن مؤسسة{' '}
                      <strong>Arona Boost International Hospitality Marketing</strong> مرخّصة ومعتمدة
                      رسمياً لإبرام وتشغيل عقود التقييم والترويج الرقمي للمنتجعات العالمية والفنادق
                      المصنّفة والمعالم السياحية الشريكة.
                    </p>

                    <div className="rounded-2xl bg-[#07182B] text-white p-3.5 space-y-2 border border-[#F5D076]/35">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">رقم القيد الدولي:</span>
                        <span className="ltr-num font-extrabold text-[#F5D076]">
                          AB-INTL-2024-884920
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">نظام التسوية المعتمد:</span>
                        <span className="ltr-num font-extrabold text-emerald-300">
                          USDT (TRC20 / BEP20)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-300">حالة الترخيص:</span>
                        <span className="font-extrabold text-emerald-300">ساري المفعول • موثّق</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-emerald-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[10.5px] font-extrabold">
                          ختم الاعتماد الرسمي — Arona Boost Corp
                        </span>
                      </div>
                      <Award className="w-5 h-5 text-[#D4AF37]" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={downloadingCert}
                  onClick={handleDownloadCorporateCert}
                  className="w-full exec-primary-btn rounded-2xl py-3 px-4 text-xs font-extrabold text-white flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#F5D076]" />
                  <span>
                    {downloadingCert ? 'جاري التصدير...' : 'حفظ شهادة الاعتماد الرسمية كصورة HD'}
                  </span>
                </button>
              </div>
            )}

            {subTab === 'job' && (
              <div className="space-y-3">
                <div className="exec-card rounded-2xl p-4 space-y-2.5">
                  <h4 className="font-display text-sm font-extrabold text-[#07182B]">
                    وصف وظيفة الموظف الجزئي عبر الإنترنت
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    يقوم الموظف بدوام جزئي عبر الإنترنت بإتمام مهام السفر اليومية من خلال التطبيق عبر
                    تقييم المنتجعات العالمية والفنادق والمعالم السياحية والتوصية بها، بهدف تحسين جودة
                    خدمات المنصة وتعزيز ظهور الشركاء الدوليين.
                  </p>

                  <div className="rounded-xl bg-[#F6F8FB] border border-slate-200/80 p-3 space-y-1.5">
                    <p className="text-xs font-extrabold text-[#07182B]">
                      يتكون دخل الموظف من ثلاثة أجزاء رئيسية:
                    </p>
                    <p className="text-[11.5px] text-slate-700">
                      <strong>1. دخل المهام اليومي:</strong> عائد ثابت يومياً وفقاً لفئة العقد
                      الوظيفي وعدد المهام المنجزة.
                    </p>
                    <p className="text-[11.5px] text-slate-700">
                      <strong>2. مكافآت الأداء والعمولات:</strong> عمولات فورية من 3 مستويات (A / B /
                      C) ومكافآت الظرف الأحمر ومتجر النقاط.
                    </p>
                    <p className="text-[11.5px] text-slate-700">
                      <strong>3. الراتب الثابت حسب المنصب:</strong> راتب شهري ثابت إضافي ومكافآت ترقية
                      نقدية وعينية وفق مستوى المنصب القيادي.
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h5 className="font-display text-xs font-extrabold text-[#07182B] px-1">
                    شروط الترقية والمكافآت للمناصب القيادية:
                  </h5>
                  {JOB_CAREER_LADDER.map((r, i) => (
                    <div key={i} className="exec-card rounded-2xl p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs font-extrabold text-[#07182B]">
                          {r.title}
                        </span>
                        <span className="rounded-lg bg-[#07182B] text-[#F5D076] px-2 py-0.5 text-[10px] font-extrabold">
                          المرتبة {i + 1}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600">• {r.req1}</p>
                      <p className="text-[11px] text-slate-600">• {r.req2}</p>
                      <div className="pt-1 border-t border-slate-100 text-[11px] font-extrabold text-[#0D7A72] space-y-0.5">
                        <p>✓ {r.bonus}</p>
                        {r.salary && <p className="text-amber-700">✓ {r.salary}</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="exec-card rounded-2xl p-3.5 space-y-1 text-[11.5px] text-slate-700">
                  <p className="font-extrabold text-[#07182B] mb-1">شرح هيكل الفريق (A - B - C):</p>
                  <p>• <strong>أعضاء الفئة A:</strong> الموظفون الذين تقوم بدعوتهم وتوظيفهم مباشرة.</p>
                  <p>• <strong>أعضاء الفئة B:</strong> الموظفون الذين يقوم أعضاء الفئة A بتوظيفهم.</p>
                  <p>• <strong>أعضاء الفئة C:</strong> الموظفون الذين يقوم أعضاء الفئة B بتوظيفهم.</p>
                </div>
              </div>
            )}

            {subTab === 'charter' && (
              <div className="space-y-2.5">
                <div className="rounded-2xl bg-[#07182B] text-white p-3.5 border border-[#F5D076]/30 text-xs leading-relaxed">
                  بصفتنا شركة ملتزمة بخلق بيئة عمل إيجابية ومحترمة ومستدامة، وضعنا المبادئ العشرة
                  التالية وفق المعايير الدولية لضمان حقوق الموظفين وشفافية العمليات اليومية:
                </div>
                {CORPORATE_PRINCIPLES.map((p) => (
                  <div key={p.num} className="exec-card rounded-2xl p-3.5 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#07182B] text-[#F5D076] text-xs font-extrabold flex items-center justify-center shrink-0">
                      {p.num}
                    </div>
                    <div>
                      <h4 className="font-display text-xs font-extrabold text-[#07182B]">
                        {p.title}
                      </h4>
                      <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed">{p.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {subTab === 'guidelines' && (
              <div className="exec-card rounded-2xl p-4 space-y-3">
                <h4 className="font-display text-sm font-extrabold text-[#07182B]">
                  إشعار الموظفين وإرشادات العمل اليومي
                </h4>
                {[
                  'إنجاز كامل حصة تقييم عقود السفر اليومية قبل موعد التصفير اليومي لضمان استلام العائد الكامل.',
                  'يُسمح لكل موظف بحساب رسمي واحد موثق برقم هاتفه ومحفظة السحب الخاصة به.',
                  'تُصرف طلبات السحب من محفظة الدخل وفق الفئات المعتمدة (20 / 80 / 200 / 800 / 2000 / 5000 USDT) باستخدام رمز الحماية المالي (PIN).',
                  'متابعة الإشعارات الرسمية لاستلام أكواد فعالية «الظرف الأحمر» والمكافآت الدورية.',
                  'التحلّي بروح الفريق وتوجيه الأعضاء الجدد في فريقك لشرح نظام التقييم وضمان العمل.'
                ].map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-[#0D7A72] shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            )}

            {subTab === 'map' && <HospitalityCoverageContent />}

            {onGoToEarnings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onGoToEarnings();
                }}
                className="w-full rounded-2xl bg-[#07182B] text-[#F5D076] border border-[#F5D076]/40 py-3 px-4 text-xs font-extrabold flex items-center justify-between cursor-pointer"
              >
                <span className="inline-flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span>استعراض جدول الأرباح والفئات الوظيفية</span>
                </span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
