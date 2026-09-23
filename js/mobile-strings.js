// Text for the mobile step-by-step flow. The form labels themselves stay in
// fields.js (NID_STRINGS) so the printed form is unchanged.
window.NID_UI = {
  Ara: {
    steps: [
      'الأسماء',
      'الولادة والمعلومات الشخصية',
      'بيانات الوالدين',
      'هوية الأحوال المدنية',
      'شهادة الجنسية العراقية',
      'السكن والعنوان',
      'مراجعة وحفظ'
    ],
    stepOf: function (a, b) { return 'الخطوة ' + a + ' من ' + b; },
    next: 'التالي',
    back: 'رجوع',
    finish: 'عرض الاستمارة',
    requiredNote: 'الحقول المؤشرة بـ * مطلوبة',
    missing: 'املأ هذا الحقل للمتابعة',
    searchPlaceholder: 'اكتب للبحث…',
    choose: 'اختر',
    noResults: 'لا توجد نتائج. جرّب كلمة أخرى.',
    moreResults: 'اكتب حرفًا إضافيًا لتضييق النتائج',
    clearChoice: 'مسح الاختيار',
    close: 'إغلاق',
    draftTitle: 'لديك استمارة محفوظة',
    draftBody: 'حُفظت بياناتك على هذا الجهاز فقط. هل تريد المتابعة من حيث توقفت؟',
    draftContinue: 'متابعة الاستمارة',
    draftNew: 'بدء استمارة جديدة',
    confirmNew: 'سيتم مسح كل البيانات المدخلة. هل أنت متأكد؟',
    newForm: 'استمارة جديدة',
    saveImage: 'حفظ كصورة',
    savePdf: 'حفظ PDF',
    print: 'طباعة',
    edit: 'تعديل البيانات',
    working: 'جارِ التجهيز…',
    zoomHint: 'اضغط على الاستمارة للتكبير',
    reviewNote: 'تأكد من البيانات قبل الحفظ. احفظ الاستمارة كصورة أو PDF وأرسلها لأي مكتب طباعة، أو اطبعها مباشرة من الموبايل.',
    saved: 'تم الحفظ',
    saveFailed: 'تعذّر الحفظ. جرّب زر الطباعة ثم اختر "حفظ كـ PDF".',
    install: 'تثبيت التطبيق',
    installIosTitle: 'تثبيت التطبيق على الآيفون',
    installIosBody: 'اضغط زر المشاركة في أسفل Safari، ثم اختر "إضافة إلى الشاشة الرئيسية".',
    offlineReady: 'التطبيق جاهز للعمل بدون إنترنت',
    langShort: 'کوردی',
    commaNote: 'تم استبدال الفواصل (,) في بعض الحقول لأنها تفسد رمز QR.',
    hints: {
      a05birthDate: 'إذا لم يُعرف يوم وشهر الولادة اختر 1/7. إذا لم يُعرف اليوم فقط اختر اليوم 1.',
      a31passport: 'اكتبه إن وُجد.',
      a40phone: 'رقم صحيح يُتصل بك عليه عند حدوث طارئ في قيدك.',
      a13bookNo: 'لحديثي الولادة: اكتب رقم السجل كما في هوية الأب.',
      a14pageNo: 'لحديثي الولادة: اكتب رقم الصحيفة كما في هوية الأب.',
      a21shLawItem: 'من لا يملك شهادة جنسية يترك بقية الحقول فارغة ويختار المادة القانونية حسب شهادة جنسية الإسناد.'
    }
  },
  Kur: {
    steps: [
      'ناوەکان',
      'لەدایکبوون و زانیاریی کەسی',
      'زانیاریی دایک و باوک',
      'ناسنامەی باری شارستانی',
      'ڕەگەزنامەی عێراقی',
      'نیشتەجێبوون و ناونیشان',
      'پێداچوونەوە و هەڵگرتن'
    ],
    stepOf: function (a, b) { return 'هەنگاوی ' + a + ' لە ' + b; },
    next: 'دواتر',
    back: 'گەڕانەوە',
    finish: 'پیشاندانی فۆرم',
    requiredNote: 'خانەکانی نیشانەی * پێویستن',
    missing: 'ئەم خانەیە پڕبکەرەوە بۆ بەردەوامبوون',
    searchPlaceholder: 'بنووسە بۆ گەڕان…',
    choose: 'هەڵبژێرە',
    noResults: 'هیچ ئەنجامێک نییە. وشەیەکی تر تاقی بکەرەوە.',
    moreResults: 'پیتێکی تر بنووسە بۆ کەمکردنەوەی ئەنجامەکان',
    clearChoice: 'سڕینەوەی هەڵبژاردن',
    close: 'داخستن',
    draftTitle: 'فۆرمێکی هەڵگیراوت هەیە',
    draftBody: 'زانیارییەکانت تەنها لەسەر ئەم ئامێرە هەڵگیراون. دەتەوێت لەو شوێنەوە بەردەوام بیت؟',
    draftContinue: 'بەردەوامبوون لە فۆرم',
    draftNew: 'دەستپێکردنی فۆرمێکی نوێ',
    confirmNew: 'هەموو زانیارییەکان دەسڕێنەوە. دڵنیایت؟',
    newForm: 'فۆرمی نوێ',
    saveImage: 'هەڵگرتن وەک وێنە',
    savePdf: 'هەڵگرتن PDF',
    print: 'چاپکردن',
    edit: 'دەستکاریکردنی زانیاری',
    working: 'ئامادە دەکرێت…',
    zoomHint: 'کلیک لە فۆرم بکە بۆ گەورەکردن',
    reviewNote: 'پێش هەڵگرتن زانیارییەکان پشکنە. فۆرمەکە وەک وێنە یان PDF هەڵبگرە و بینێرە بۆ هەر نووسینگەیەکی چاپ، یان ڕاستەوخۆ لە مۆبایلەوە چاپی بکە.',
    saved: 'هەڵگیرا',
    saveFailed: 'هەڵگرتن سەرکەوتوو نەبوو. دوگمەی چاپکردن تاقی بکەرەوە و "Save as PDF" هەڵبژێرە.',
    install: 'دامەزراندنی ئەپ',
    installIosTitle: 'دامەزراندنی ئەپ لەسەر ئایفۆن',
    installIosBody: 'لە خوارەوەی Safari دوگمەی بڵاوکردنەوە دابگرە، پاشان "Add to Home Screen" هەڵبژێرە.',
    offlineReady: 'ئەپەکە ئامادەیە بەبێ ئینتەرنێت کار بکات',
    langShort: 'عربي',
    commaNote: 'فاریزە (,) لە هەندێک خانە گۆڕدران چونکە کۆدی QR تێکدەدەن.',
    hints: {
      a05birthDate: 'ئەگەر ڕۆژ و مانگی لەدایکبوون نەزانراوە 1/7 هەڵبژێرە. ئەگەر تەنها ڕۆژ نەزانراوە ڕۆژی 1 هەڵبژێرە.',
      a31passport: 'ئەگەر هەیە بینووسە.',
      a40phone: 'ژمارەیەکی دروست بۆ پەیوەندیکردن لە کاتی پێویستدا.',
      a13bookNo: 'بۆ منداڵی تازە لەدایکبوو: ژمارەی تۆمار وەک ناسنامەی باوک.',
      a14pageNo: 'بۆ منداڵی تازە لەدایکبوو: ژمارەی لاپەڕە وەک ناسنامەی باوک.',
      a21shLawItem: 'ئەوەی ڕەگەزنامەی نییە خانەکانی تر بەتاڵ جێدەهێڵێت و ماددەی یاسایی بەپێی ڕەگەزنامەی پاڵپشت هەڵدەبژێرێت.'
    }
  }
};

// Which fields appear on each step (field names are unchanged from the
// original so the QR numbering is untouched).
window.NID_STEPS = [
  ['a07name1', 'a06name2', 'a09name3', 'a08name4', 'a11motherName', 'a10motherFatherName'],
  ['a04birthLoc', 'a05birthDate', 'a01gender', 'a33religion', 'a02mariage', 'a03bloodGroup',
   'a35disabilities', 'a34job', 'a31passport', 'a40phone'],
  ['a27fatherIsLive', 'a26fatherCountry', 'a25fatherBirthLoc',
   'a30motherIsLive', 'a29motherCountry', 'a28motherBirthLoc'],
  ['a12office', 'a13bookNo', 'a14pageNo'],
  ['a15shProv', 'a16shOffice', 'a17shNo', 'a18shDate', 'a19shPageNo', 'a20shYear', 'a21shLawItem'],
  ['a38addrProv', 'a39addrCountry', 'a37addrM', 'a36addrStNo', 'a42addrBuildingNo', 'a41addrOther',
   'a22addrOffice', 'a23addrFormNo', 'a24addrFromDate']
];

// Fields that only hold numbers: numeric keypad on phones.
window.NID_NUMERIC = ['a13bookNo', 'a14pageNo', 'a17shNo', 'a19shPageNo', 'a20shYear',
  'a23addrFormNo', 'a40phone'];

// Wording of the printed form, exactly as on the official app's printout.
window.NID_PRINT = {
  Ara: {
    head: ['جمهورية العراق', 'وزارة الداخلية', 'مديرية الاحوال المدنية والجوازات والاقامة', 'مديرية شؤون البطاقة الوطنية'],
    title: 'استمارة الحصول على البطاقة الوطنية',
    sec: {
      personal: 'البيانات الشخصية:', address: 'العنوان:', residence: 'بطاقة السكن:',
      nationality: 'شهادة الجنسية العراقية:', civil: 'هوية الاحوال المدنية:', parents: 'بيانات الوالدين:'
    },
    sign: ['اسم وتوقيع المواطن / ولي الأمر', 'اسم وتوقيع مدخل البيانات', 'تأييد ضابط الجنسية'],
    labels: {
      a04birthLoc: 'محل الولادة', a05birthDate: 'تاريخ الولادة',
      a07name1: 'الأسم', a06name2: 'أسم الأب', a09name3: 'أسم الجد', a08name4: 'اللقب',
      a11motherName: 'أسم الأم', a10motherFatherName: 'أسم والد الام',
      a01gender: 'الجنس', a33religion: 'الديانة', a02mariage: 'الحالة الزوجية', a34job: 'المهنة',
      a03bloodGroup: 'فصيلة الدم', a35disabilities: 'العاهات الظاهرة', a31passport: 'رقم جواز السفر',
      a39addrCountry: 'البلد', a38addrProv: 'المحافظة', a37addrM: 'المحلة', a36addrStNo: 'الزقاق / الشارع',
      a42addrBuildingNo: 'الدار / الشقة', a41addrOther: 'المقاطعة / القرية', a40phone: 'رقم الهاتف',
      a22addrOffice: 'مكتب معلومات', a23addrFormNo: 'رقم الاستمارة', a24addrFromDate: 'تاريخ تنظيم الاستمارة',
      a15shProv: 'اسم المحافظة', a16shOffice: 'جهة الاصدار', a17shNo: 'رقم شهادة الجنسية',
      a18shDate: 'تاريخ اصدار الشهادة', a19shPageNo: 'رقم المحفظة', a20shYear: 'سنة التسجيل', a21shLawItem: 'المادة القانونية',
      a12office: 'دائرة الاحوال المدنية', a13bookNo: 'رقم السجل', a14pageNo: 'رقم الصحيفة',
      a27fatherIsLive: 'الحالة الحياتية للاب', a26fatherCountry: 'جنسية الأب الاصلية', a25fatherBirthLoc: 'محل ولادة الأب',
      a30motherIsLive: 'الحالة الحياتية للأم', a29motherCountry: 'جنسية الام الاصلية', a28motherBirthLoc: 'محل ولادة الام'
    }
  }
};
(function () {
  var k = window.NID_STRINGS.Kur;
  window.NID_PRINT.Kur = {
    head: [k.printTitle1, k.printTitle2, k.printTitle3, 'مديرية شؤون البطاقة الوطنية'],
    title: k.printFormTitle,
    sec: {
      personal: k.sec1, address: k.sec2, residence: k.sec3,
      nationality: k.sec4, civil: k.sec5, parents: k.sec6
    },
    sign: [k.sig1, k.sig2, k.sig3],
    labels: {}
  };
})();
