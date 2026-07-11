const toggle = document.querySelector(".menu-toggle"),
  sidebar = document.querySelector(".sidebar"),
  overlay = document.querySelector(".overlay");

if (toggle && sidebar && overlay) {
  const close = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
  };

  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
  });
  overlay.addEventListener("click", close);
  sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
}

if (sidebar) {
  const savedPos = sessionStorage.getItem("sidebarScroll");
  if (savedPos) sidebar.scrollTop = parseInt(savedPos, 10);
  sidebar.addEventListener("scroll", () =>
    sessionStorage.setItem("sidebarScroll", sidebar.scrollTop),
  );
}

const navStateStoragePrefix = "ox-content:nav:/:";
const getNavState = (key) => {
  try {
    return localStorage.getItem(navStateStoragePrefix + key);
  } catch {
    return null;
  }
};
const setNavState = (key, open) => {
  try {
    localStorage.setItem(navStateStoragePrefix + key, open ? "open" : "closed");
  } catch {
    // Ignore storage failures so navigation remains usable.
  }
};

document.querySelectorAll("details[data-ox-nav-state-key]").forEach((details) => {
  const key = details.getAttribute("data-ox-nav-state-key");
  if (!key) return;

  const savedState = getNavState(key);
  if (savedState === "open") {
    details.open = true;
  } else if (savedState === "closed") {
    details.open = false;
  }

  details.addEventListener("toggle", () => setNavState(key, details.open));
});

const themeToggle = document.querySelector(".theme-toggle"),
  setTheme = (theme) => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  },
  getTheme = () => document.documentElement.getAttribute("data-theme") || "light";

themeToggle?.addEventListener("click", () => setTheme(getTheme() === "dark" ? "light" : "dark"));

const searchBtn = document.querySelector(".search-button");
let searchApiPromise = null;

const loadSearchApi = async () => {
  if (searchApiPromise) {
    return searchApiPromise;
  }

  searchApiPromise = new Promise((resolve) => {
    if (typeof window.__oxContentInitSearch === "function") {
      resolve(window.__oxContentInitSearch());
      return;
    }

    const script = document.createElement("script");
    script.src = "/assets/ox-content-search-d068f3146a.js";
    script.defer = true;
    script.onload = () =>
      resolve(
        typeof window.__oxContentInitSearch === "function" ? window.__oxContentInitSearch() : null,
      );
    script.onerror = () => {
      console.warn("[ox-content] Search chunk failed to load");
      searchApiPromise = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return searchApiPromise;
};

const openSearch = async () => {
  const api = await loadSearchApi();
  api?.openSearch();
};

const isTypingTarget = (target) =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  target instanceof HTMLSelectElement ||
  (target instanceof HTMLElement && target.isContentEditable);

searchBtn?.addEventListener("click", () => {
  void openSearch();
});

document.addEventListener("keydown", (e) => {
  if (
    (e.key === "/" && !isTypingTarget(e.target)) ||
    ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")
  ) {
    e.preventDefault();
    void openSearch();
  }
});

const scrollToHash = () => {
  const hash = location.hash;
  if (!hash) return;

  const target = document.querySelector(hash);
  if (!target) return;

  setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
};

scrollToHash();
window.addEventListener("hashchange", scrollToHash);
document.querySelectorAll('a[href^="#"]').forEach((a) =>
  a.addEventListener("click", (e) => {
    const hash = a.getAttribute("href");
    const target = hash ? document.querySelector(hash) : null;
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, null, hash);
    }
  }),
);

const mobileMenuBtn = document.querySelector("[data-mobile-menu]"),
  mobileSearchBtn = document.querySelector("[data-mobile-search]"),
  mobileThemeBtn = document.querySelector("[data-mobile-theme]");

mobileMenuBtn?.addEventListener("click", () => {
  if (sidebar && overlay) {
    sidebar.classList.toggle("open");
    overlay.classList.toggle("open");
  }
});

mobileSearchBtn?.addEventListener("click", () => {
  void openSearch();
});

mobileThemeBtn?.addEventListener("click", () => setTheme(getTheme() === "dark" ? "light" : "dark"));

document.querySelectorAll(".ox-api-controls").forEach((controls) => {
  const targetSelector = controls.getAttribute("data-ox-api-target");
  if (!targetSelector) return;

  controls.querySelectorAll("[data-ox-api-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const shouldOpen = button.getAttribute("data-ox-api-toggle") === "expand";
      document.querySelectorAll(targetSelector).forEach((entry) => {
        if (entry instanceof HTMLDetailsElement) {
          entry.open = shouldOpen;
        }
      });
    });
  });
});



// Opt-in synced tab groups.
//
// Tab groups rendered with a `data-ox-tab-group="<key>"` attribute (emitted only
// when syncing is enabled) keep their active tab in sync across the page and
// persist the choice in localStorage. Groups without the attribute are left
// alone, so the default no-JavaScript CSS widget is unaffected.
(() => {
  const GROUP_SELECTOR = ".ox-tabs[data-ox-tab-group]";
  const STORAGE_PREFIX = "ox-tab-group:";

  function storageKey(group) {
    return STORAGE_PREFIX + group;
  }

  function readStored(group) {
    try {
      return window.localStorage.getItem(storageKey(group));
    } catch {
      return null;
    }
  }

  function writeStored(group, label) {
    try {
      window.localStorage.setItem(storageKey(group), label);
    } catch {
      // Ignore storage failures (private mode, quota, etc.).
    }
  }

  // Map a group element's inputs to their tab labels, in order.
  function labelFor(tabs, input) {
    const id = input.id;
    const label = tabs.querySelector('label[for="' + id + '"]');
    return label ? label.textContent.trim() : null;
  }

  function selectByLabel(tabs, label) {
    const inputs = tabs.querySelectorAll('input[type="radio"]');
    for (const input of inputs) {
      if (labelFor(tabs, input) === label) {
        if (!input.checked) input.checked = true;
        return true;
      }
    }
    return false;
  }

  function init() {
    const groups = Array.from(document.querySelectorAll(GROUP_SELECTOR));
    if (groups.length === 0) return;

    // Restore persisted selections first.
    for (const tabs of groups) {
      const group = tabs.getAttribute("data-ox-tab-group");
      const stored = readStored(group);
      if (stored) selectByLabel(tabs, stored);
    }

    // Broadcast a selection to every group sharing the same key.
    function broadcast(group, label, source) {
      writeStored(group, label);
      for (const tabs of groups) {
        if (tabs === source) continue;
        if (tabs.getAttribute("data-ox-tab-group") === group) {
          selectByLabel(tabs, label);
        }
      }
    }

    for (const tabs of groups) {
      const group = tabs.getAttribute("data-ox-tab-group");
      tabs.addEventListener("change", (event) => {
        const input = event.target;
        if (!input || input.type !== "radio") return;
        const label = labelFor(tabs, input);
        if (label) broadcast(group, label, tabs);
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();