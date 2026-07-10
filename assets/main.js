(function () {
  var video = document.querySelector(".screen__video");
  if (!video) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  // احترام تفضيل تقليل الحركة: نوقف الفيديو ويظهر الغلاف مكانه
  if (reducedMotion.matches) {
    video.removeAttribute("autoplay");
    video.pause();
    return;
  }

  // بعض الأجهزة (مثل وضع توفير الطاقة في iOS) تمنع التشغيل التلقائي؛
  // الغلاف poster يضمن عدم ظهور شاشة سوداء في كل الأحوال
  function tryPlay() {
    var p = video.play();
    if (p && typeof p.catch === "function") {
      p.catch(function () { /* يبقى الغلاف ظاهرًا */ });
    }
  }

  tryPlay();

  // لو أوقف المتصفح الفيديو أثناء وجود الصفحة بالخلفية، نعيد تشغيله عند الرجوع
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden && video.paused) tryPlay();
  });

  // وضع توفير الطاقة في iOS يمنع التشغيل حتى أول تفاعل — أول لمسة تشغّل الفيديو
  ["touchstart", "click"].forEach(function (evt) {
    document.addEventListener(evt, function retry() {
      if (video.paused) tryPlay();
      document.removeEventListener(evt, retry);
    }, { passive: true });
  });
})();

/* ===== مشغل الفيديو: يفتح أي فيديو بالصوت عند الضغط ===== */
(function () {
  var box = document.getElementById("lightbox");
  if (!box) return;
  var vid = box.querySelector(".lightbox__video");
  var closeBtn = box.querySelector(".lightbox__close");

  function open(src, poster) {
    vid.src = src;
    if (poster) vid.poster = poster;
    box.hidden = false;
    document.body.style.overflow = "hidden";
    vid.muted = false;
    var p = vid.play();
    if (p && typeof p.catch === "function") p.catch(function () {});
  }

  function close() {
    vid.pause();
    vid.removeAttribute("src");
    vid.load();
    box.hidden = true;
    document.body.style.overflow = "";
  }

  // متاح لبقية السكربتات (كاروسيل صفحة الريلز)
  window.__openLightbox = open;

  closeBtn.addEventListener("click", close);
  box.addEventListener("click", function (e) { if (e.target === box) close(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !box.hidden) close();
  });
})();

/* ===== عجلة لوجوهات العملاء ===== */
(function () {
  var wheel = document.getElementById("clientsWheel");
  if (!wheel) return;

  var rotor = wheel.querySelector(".wheel__rotor");
  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // أسماء العملاء بترتيب ملفات اللوجوهات 1..22 (تظهر كنص بديل)
  var names = [
    "Leozar", "The Club كلوب", "Joint", "Fennec فنك", "Kiaora كيورا", "Eureka",
    "Salla سلة", "Crisper", "1980 Kafatrya كافتريا", "LEO", "مراتب هورس", "MK Muhannad Kurdi",
    "كيو", "The Storytellers", "سيّاخ Sayakh", "Sub Sandwich Station", "Diet Plan", "VPM",
    "محلي Mahally", "B'Olives", "مندي السدة", "Anabolic"
  ];

  var COUNT = names.length;
  var STEP = 360 / COUNT;
  var items = [];

  for (var i = 0; i < COUNT; i++) {
    // كل لوجو رابط ينزل لقسم الأعمال
    var item = document.createElement("a");
    item.className = "wheel__item";
    item.href = "#works";
    item.setAttribute("aria-label", "أعمال " + names[i]);
    var img = document.createElement("img");
    img.src = "logos/web/" + (i + 1) + ".webp";
    img.alt = names[i];
    img.decoding = "async";
    item.appendChild(img);
    rotor.appendChild(item);
    items.push(item);
  }

  var R = 640;

  // القوس يمتد من أقصى يمين الشاشة إلى أقصى يسارها:
  // نحسب نصف قطر يجعل انحدار القوس عند حافتي الشاشة صغيرًا،
  // ونضبط ارتفاع العجلة على قدر القوس بالضبط حتى لا تزاحم بقية الصفحة
  function layout() {
    var vw = window.innerWidth;
    var logoW = items[0].offsetWidth || 100;
    var halfH = logoW * 0.35;
    var peek = Math.max(56, Math.min(vw * 0.09, 100));   // مسافة قمة القوس من أعلى العجلة
    var dip = Math.min(vw * 0.18, 260);                  // أقصى انحدار مسموح عند الحواف

    var rEdge = ((vw / 2) * (vw / 2) + dip * dip) / (2 * dip); // نصف قطر يوصل القوس للحافتين
    var rSpacing = (COUNT * logoW * 1.45) / (2 * Math.PI);     // نصف قطر يمنع تلاصق اللوجوهات
    R = Math.max(rEdge, rSpacing);

    var drop = R - Math.sqrt(Math.max(R * R - (vw / 2) * (vw / 2), 0)); // الانحدار الفعلي عند الحافة
    wheel.style.height = Math.round(peek + drop + halfH + 10) + "px";
    wheel.style.setProperty("--rotor-top", (R + peek) + "px");

    for (var i = 0; i < COUNT; i++) {
      items[i].style.transform = "rotate(" + (i * STEP) + "deg) translateY(" + (-R) + "px)";
    }
  }

  layout();
  window.addEventListener("resize", layout);
  window.addEventListener("load", layout);

  // الدوران: سالب = عكس عقارب الساعة، فتمر اللوجوهات من اليمين إلى اليسار،
  // وتتباطأ بنعومة عند الوقوف على لوجو وتعود بعده
  var BASE_SPEED = -5;         // درجة/ثانية
  var angle = 0;
  var speed = reducedMotion ? 0 : BASE_SPEED;
  var target = speed;
  var visible = true;
  var last = performance.now();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }).observe(wheel);
  }

  wheel.addEventListener("pointerover", function (e) {
    if (e.target.closest(".wheel__item")) target = 0;
  });
  wheel.addEventListener("pointerout", function () {
    if (!reducedMotion) target = BASE_SPEED;
  });

  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    if (visible) {
      speed += (target - speed) * Math.min(1, dt * 5);
      angle = (angle + speed * dt) % 360;
      rotor.style.transform = "rotate(" + angle + "deg)";
    }
    requestAnimationFrame(tick);
  }

  if (!reducedMotion) requestAnimationFrame(tick);
})();
