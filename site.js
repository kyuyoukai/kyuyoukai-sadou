(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function closeNav() {
    document.body.classList.remove("nav-open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  if (toggle) {
    toggle.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      toggle.setAttribute("aria-expanded", open);
    });
  }

  /* ナビ内の全リンク（ページ内リンク・別ページへのリンク）でメニューを閉じる */
  document.querySelectorAll('.nav a').forEach(function (link) {
    link.addEventListener("click", closeNav);
  });

  /* Escキーでも閉じられるようにする */
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeNav();
  });

  /* PC幅に戻ったら開いた状態を解除する */
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) closeNav();
  });

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll(".reveal").forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) {
      el.classList.add("is-visible");
    });
  }
})();
