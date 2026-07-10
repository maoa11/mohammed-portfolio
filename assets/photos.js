/* قسم الصور: شريط بطاقات طولية يتحرك تلقائيًا بلا نهاية.
   عند المرور على صورة تتوقف الحركة وتتوسّع الصورة إلى مربّع موحّد. */
(function () {
  var strip = document.getElementById("photoStrip");
  var track = document.getElementById("photoTrack");
  if (!track) return;

  var BASE = "صور/web/";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ترتيب متبادل بين الأشخاص/المنتجات والأطعمة حتى لا يبدو أغلبه طعامًا
  // (F=طعام، N=شخص/منتج): 1 8 2 6 4 7 5 9 10 13 11 14 12 3 15
  var ORDER = [1, 8, 2, 6, 4, 7, 5, 9, 10, 13, 11, 14, 12, 3, 15];

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  // نبني مجموعتين متطابقتين من البطاقات ليكون اللف سلسًا بلا نهاية
  function buildSet() {
    for (var k = 0; k < ORDER.length; k++) {
      var i = ORDER[k];
      var card = document.createElement("div");
      card.className = "pcard";

      var img = document.createElement("img");
      img.src = BASE + "photo-" + pad(i) + ".webp";
      img.alt = "لقطة " + i;
      img.decoding = "async";
      img.loading = "lazy";

      // عند تحميل الصورة نحسب مقاس المربّع (= ارتفاع البطاقة) للتوسّع عند المرور
      img.addEventListener("load", function () {
        applySquare(this.parentElement);
      });

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
  var SPEED = 42; // بكسل/ثانية — انزلاق هادئ يليق بمعرض صور

  // مقاس المربّع عند المرور = الارتفاع الفعلي للبطاقة (بالبكسل)
  function applySquare(card) {
    var h = card.getBoundingClientRect().height;
    if (h) card.style.setProperty("--w-sq", h + "px");
  }

  // عرض المجموعة الواحدة (نصف الشريط) — نقيسه والبطاقات في وضعها الطولي
  function measure() {
    var cards = track.querySelectorAll(".pcard");
    for (var i = 0; i < cards.length; i++) applySquare(cards[i]);
    loopW = track.scrollWidth / 2;
  }
  measure();
  window.addEventListener("resize", measure);
  window.addEventListener("load", measure);

  // إيقاف الحركة عند المرور على أي بطاقة (لتظهر الصورة كاملة بثبات)
  track.addEventListener("pointerover", function (e) {
    if (e.target.closest(".pcard")) paused = true;
  });
  track.addEventListener("pointerout", function (e) {
    if (e.target.closest(".pcard")) paused = false;
  });

  // لا نحرّك إلا حين يكون القسم ظاهرًا (توفير للأداء)
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
      if (-offset >= loopW) offset += loopW; // لف سلس
      track.style.transform = "translateX(" + offset + "px)";
    }
    requestAnimationFrame(tick);
  }
  if (!reduced) requestAnimationFrame(tick);
})();
