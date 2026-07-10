/* كاروسيل الأعمال — نسخة مبسطة */
(function () {
  var stage = document.getElementById("stage");
  if (!stage) return;

  var REELS = [
    "featured-1", "featured-3", "featured-2",
    "apr-1", "apr-tiktok-7", "aug-1", "aug-2", "aug-8",
    "dec-1", "dec-2", "feb-1", "jul-2", "leozar-1", "may-12",
    "oct-1", "oct-2", "post-1-2", "sep-1", "winter-1", "kayu-season"
  ];
  var BASE = "فيديو ريلز/web/";
  var N = REELS.length;
  var current = 0;
  var cards = [];
  var swiped = false;

  REELS.forEach(function (name) {
    var card = document.createElement("div");
    card.className = "stage__card";

    var inner = document.createElement("div");
    inner.className = "stage__inner";

    var v = document.createElement("video");
    // نسخة 480p خفيفة للبطاقة — فك ترميزها رخيص فتشتغل كلها بدون لاق
    v.src = BASE + "card/" + name + ".mp4";
    v.poster = BASE + name + ".jpg";
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.preload = "metadata";

    inner.appendChild(v);
    card.appendChild(inner);
    stage.appendChild(card);
    cards.push(card);

    card.addEventListener("click", function () {
      if (swiped) return;
      // المشغل يفتح النسخة عالية الجودة 720p بالصوت
      if (window.__openLightbox) window.__openLightbox(BASE + name + ".mp4", v.poster);
    });
  });

  var cardW = 280;

  function signedDist(i) {
    var d = (i - current) % N;
    return d > N / 2 ? d - N : d < -N / 2 ? d + N : d;
  }

  function layout() {
    var stageH = stage.getBoundingClientRect().height;
    var vw = window.innerWidth;
    var byHeight = (stageH * 0.86) * 9 / 16;
    cardW = Math.max(160, Math.min(byHeight, vw * 0.62, 330));
    stage.style.setProperty("--card-w", cardW + "px");
    render();
  }

  function render() {
    var spacing = cardW * 0.55;
    var maxSide = Math.ceil((window.innerWidth / 2) / spacing) + 1;

    for (var i = 0; i < N; i++) {
      var d = signedDist(i);
      var abs = Math.abs(d);
      var card = cards[i];
      var scale = Math.pow(0.9, abs);
      var x = d * spacing;
      var ry = d === 0 ? 0 : d > 0 ? -13 : 13;

      card.style.zIndex = 60 - abs;
      card.style.opacity = abs > maxSide ? "0" : "1";
      card.style.pointerEvents = abs > maxSide ? "none" : "auto";
      card.style.transform = "translateY(-50%) translateX(" + x + "px) scale(" + scale + ") rotateY(" + ry + "deg)";
    }
  }

  // كل الفيديوهات الظاهرة على الشاشة تشتغل (نسخ 480p الخفيفة تسمح بذلك بدون لاق)،
  // والمخفية خلف الحواف فقط تتوقف
  function syncPlayback() {
    var maxSide = Math.ceil((window.innerWidth / 2) / (cardW * 0.55)) + 1;
    for (var i = 0; i < N; i++) {
      var abs = Math.abs(signedDist(i));
      var v = cards[i].querySelector("video");
      if (abs <= maxSide) {
        if (v.preload !== "auto") v.preload = "auto";
        if (v.paused) v.play().catch(function () {});
      } else if (!v.paused) {
        v.pause();
      }
    }
  }

  // نؤجل تشغيل الفيديوهات حتى تستقر الحركة، فلا يتقطع التنقل السريع
  var settle = null;
  function go(dir) {
    current = (current + dir + N) % N;
    render();
    clearTimeout(settle);
    settle = setTimeout(syncPlayback, 260);
  }

  document.getElementById("nextBtn").addEventListener("click", function () { go(1); });
  document.getElementById("prevBtn").addEventListener("click", function () { go(-1); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });

  var startX = null;
  stage.addEventListener("pointerdown", function (e) { startX = e.clientX; });
  stage.addEventListener("pointerup", function (e) {
    if (startX === null) return;
    var dx = e.clientX - startX;
    if (Math.abs(dx) > 40) {
      swiped = true;
      go(dx < 0 ? 1 : -1);
      setTimeout(function () { swiped = false; }, 100);
    }
    startX = null;
  });

  layout();
  syncPlayback(); // شغّل الظاهر بعد أول رسم
  window.addEventListener("resize", function () { layout(); syncPlayback(); });

  // لو فُتحت الصفحة بتبويب خلفي، نعيد تشغيل الفيديوهات عند ظهورها
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) syncPlayback();
  });
})();
