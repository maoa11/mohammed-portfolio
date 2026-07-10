/* قسم الإنتاج: شريط أغلفة (بوسترات) يتحرك تلقائيًا.
   عند المرور على غلاف تتوقف الحركة ويكبر الغلاف، والضغط يفتح صفحة المشروع. */
(function () {
  var strip = document.getElementById("prodStrip");
  var track = document.getElementById("prodTrack");
  if (!track) return;

  // المشاريع الخمسة — كل عمل بغلافه مرة واحدة (من الأحدث للأقدم)
  var PROJECTS = [
    { cover: "فيديو عرض/3/web/cover.webp", page: "production-3.html", title: "فينك يا قلبي" },
    { cover: "فيديو عرض/1/web/cover.webp", page: "production-1.html", title: "زيف" },
    { cover: "فيديو عرض/4/web/cover.webp", page: "production-4.html", title: "Hello" },
    { cover: "فيديو عرض/2/web/cover.webp", page: "production-2.html", title: "مختار" },
    { cover: "فيديو عرض/5/web/cover.webp", page: "production-5.html", title: "مارشميلو" }
  ];

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // نبني مجموعتين متطابقتين ليكون اللف سلسًا بلا نهاية
  function buildSet() {
    for (var i = 0; i < PROJECTS.length; i++) {
      var proj = PROJECTS[i];
      var card = document.createElement("a");
      card.className = "pcard-prod";
      card.href = proj.page;
      card.setAttribute("aria-label", "مشروع " + proj.title);

      var img = document.createElement("img");
      img.src = proj.cover;
      img.alt = proj.title;
      img.decoding = "async";
      img.loading = "lazy";

      card.appendChild(img);
      track.appendChild(card);
    }
  }
  buildSet();
  buildSet();

  var offset = 0;
  var loopW = 0;
  var paused = false;
  var visible = true;
  var SPEED = 60; // بكسل/ثانية — أسرع بطلب العميل

  function measure() { loopW = track.scrollWidth / 2; }
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);

  // إيقاف الحركة عند المرور على أي غلاف
  track.addEventListener("pointerover", function (e) {
    if (e.target.closest(".pcard-prod")) paused = true;
  });
  track.addEventListener("pointerout", function (e) {
    if (e.target.closest(".pcard-prod")) paused = false;
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }).observe(strip);
  }

  var last = performance.now();
  function tick(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!paused && visible && loopW) {
      offset -= SPEED * dt;
      if (-offset >= loopW) offset += loopW;
      track.style.transform = "translateX(" + offset + "px)";
    }
    requestAnimationFrame(tick);
  }
  if (!reduced) requestAnimationFrame(tick);
})();
