const meta = {
      home: "Home",
      interests: "Academic interests",
      education: "Education",
      activities: "Work & activities",
      languages: "Languages",
      roots: "Roots",
    };

    const tabs = Array.from(document.querySelectorAll(".tab"));
    const views = Array.from(document.querySelectorAll(".view"));
    const title = document.getElementById("panel-title");
    const panel = document.querySelector(".panel");
    const panelBody = panel.querySelector(".panel-body");
    const tabList = document.querySelector(".tabs");
    const themeToggle = document.getElementById("theme-toggle");
    const themeIcon = themeToggle.querySelector(".theme-icon");
    const themeText = themeToggle.querySelector(".theme-text");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobilePanel = window.matchMedia("(max-width: 760px)");

    let activeName = document.querySelector(".view.active")?.id || "home";
    let transitionTimer = null;
    let titleTimer = null;

    function applyTheme(theme, persist = false) {
      const resolvedTheme = theme === "dark" ? "dark" : "light";
      const isDark = resolvedTheme === "dark";

      document.documentElement.dataset.theme = resolvedTheme;
      themeToggle.setAttribute("aria-pressed", String(isDark));
      themeToggle.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      themeIcon.textContent = isDark ? "☀" : "☾";
      themeText.textContent = isDark ? "Light" : "Dark";
      if (themeMeta) themeMeta.setAttribute("content", isDark ? "#050505" : "#ffffff");

      if (persist) {
        try {
          localStorage.setItem("theme", resolvedTheme);
        } catch (error) {
          // Storage can be unavailable in some private browsing contexts.
        }
      }
    }

    function getSavedTheme() {
      try {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || savedTheme === "light") return savedTheme;
      } catch (error) {
        // Ignore and use the current document theme.
      }

      return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    }

    function updateThemeFromSystem(event) {
      try {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark" || savedTheme === "light") return;
      } catch (error) {
        // Ignore and follow the system preference.
      }

      applyTheme(event.matches ? "dark" : "light");
    }

    applyTheme(getSavedTheme());

    if (window.matchMedia) {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
      systemTheme.addEventListener?.("change", updateThemeFromSystem);
    }

    themeToggle.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme, true);
    });

    function setNavigationState(name) {
      tabs.forEach((tab) => {
        const selected = tab.dataset.tab === name;
        tab.setAttribute("aria-selected", String(selected));
        tab.setAttribute("tabindex", selected ? "0" : "-1");
      });

      panel.dataset.activePanel = name;
    }

    function setStaticViewState(name) {
      views.forEach((view) => {
        const selected = view.id === name;
        view.classList.toggle("active", selected);
        view.classList.remove("is-entering", "is-leaving", "has-motion");
        view.setAttribute("aria-hidden", String(!selected));
      });
    }

    function updateTitle(name, animate = true) {
      const nextTitle = meta[name];
      if (!nextTitle || title.textContent === nextTitle) return;

      clearTimeout(titleTimer);

      if (!animate || reduceMotion.matches) {
        title.classList.remove("is-changing");
        title.textContent = nextTitle;
        return;
      }

      title.classList.add("is-changing");
      titleTimer = window.setTimeout(() => {
        title.textContent = nextTitle;
        requestAnimationFrame(() => title.classList.remove("is-changing"));
      }, 90);
    }

    function updateHash(name, userAction) {
      const targetHash = `#${name}`;
      if (location.hash === targetHash) return;

      if (userAction) {
        history.pushState({ tab: name }, "", targetHash);
      } else {
        history.replaceState({ tab: name }, "", targetHash);
      }
    }

    function finishTransition(name) {
      clearTimeout(transitionTimer);
      transitionTimer = null;

      setStaticViewState(name);
      panel.classList.remove("is-transitioning");
      panelBody.style.height = "";
    }

    function openTab(name, updateUrl = true, userAction = false, animate = true) {
      if (!meta[name]) return;

      const previousName = activeName;
      if (name === previousName) {
        setNavigationState(name);
        if (updateUrl) updateHash(name, userAction);
        if (userAction && mobilePanel.matches) {
          panel.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
        }
        return;
      }

      finishTransition(previousName);

      const previousView = document.getElementById(previousName);
      const nextView = document.getElementById(name);
      if (!nextView) return;

      activeName = name;
      setNavigationState(name);
      updateTitle(name, animate);
      if (updateUrl) updateHash(name, userAction);

      if (!animate || reduceMotion.matches || !previousView) {
        finishTransition(name);
        return;
      }

      const startHeight = panelBody.getBoundingClientRect().height;

      nextView.classList.add("active", "is-entering");
      nextView.style.visibility = "hidden";
      const endHeight = nextView.getBoundingClientRect().height;
      nextView.style.visibility = "";
      nextView.classList.remove("active", "is-entering");

      panel.classList.add("is-transitioning");
      panelBody.style.height = `${startHeight}px`;

      previousView.classList.add("has-motion");
      previousView.setAttribute("aria-hidden", "true");
      nextView.classList.add("active", "is-entering", "has-motion");
      nextView.setAttribute("aria-hidden", "false");

      requestAnimationFrame(() => {
        panelBody.style.height = `${endHeight}px`;
        previousView.classList.remove("active");
        previousView.classList.add("is-leaving");
        nextView.classList.remove("is-entering");
      });

      transitionTimer = window.setTimeout(() => finishTransition(name), 380);

      if (userAction && mobilePanel.matches) {
        window.setTimeout(() => {
          panel.scrollIntoView({ block: "start", behavior: reduceMotion.matches ? "auto" : "smooth" });
        }, 80);
      }
    }

    tabList.setAttribute("role", "tablist");

    tabs.forEach((tab, index) => {
      const name = tab.dataset.tab;
      const view = document.getElementById(name);
      const tabId = `tab-${name}`;

      tab.id = tabId;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", name);

      if (view) {
        view.setAttribute("role", "tabpanel");
        view.setAttribute("aria-labelledby", tabId);
        view.setAttribute("tabindex", "-1");
      }

      tab.addEventListener("click", () => openTab(name, true, true));

      tab.addEventListener("keydown", (event) => {
        const keyActions = {
          ArrowRight: () => (index + 1) % tabs.length,
          ArrowLeft: () => (index - 1 + tabs.length) % tabs.length,
          Home: () => 0,
          End: () => tabs.length - 1,
        };

        if (!keyActions[event.key]) return;

        event.preventDefault();
        const nextTab = tabs[keyActions[event.key]()];
        nextTab.focus();
        openTab(nextTab.dataset.tab, true, true);
      });
    });

    window.addEventListener("popstate", () => {
      const hashName = location.hash.replace("#", "");
      openTab(meta[hashName] ? hashName : "home", false, false);
    });

    const initial = location.hash.replace("#", "");
    const initialName = initial && meta[initial] ? initial : "home";
    activeName = initialName;
    setNavigationState(initialName);
    updateTitle(initialName, false);
    setStaticViewState(initialName);
    history.replaceState({ tab: initialName }, "", initial && meta[initial] ? `#${initialName}` : location.pathname + location.search);
