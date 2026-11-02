/**
 * Landing-page playground: loads the real TypeSpec compiler + emitter bundle
 * on demand and recompiles as you type. Nothing is mocked.
 */
(() => {
  const root = document.querySelector("[data-playground]");
  if (!root) return;

  const editor = root.querySelector("[data-playground-input]");
  const output = root.querySelector("[data-playground-output]");
  const diagnosticsBox = root.querySelector("[data-playground-diagnostics]");
  const status = root.querySelector("[data-playground-status]");
  const chips = [...root.querySelectorAll("[data-playground-example]")];
  const compileButton = root.querySelector("[data-playground-compile]");
  const resetButton = root.querySelector("[data-playground-reset]");
  const copyButton = root.querySelector("[data-playground-copy]");

  const sources = new Map(
    [...root.querySelectorAll("[data-example-source]")].map((node) => [
      node.dataset.exampleSource,
      node.textContent,
    ]),
  );

  const initialId = root.dataset.playgroundExample || "";

  let engine = null;
  let enginePromise = null;
  let sequence = 0;
  let timer = null;

  const setStatus = (text, tone = "idle") => {
    status.textContent = text;
    status.dataset.tone = tone;
  };

  const loadEngine = () => {
    enginePromise ??= import("/playground/engine.js")
      .then((module) => {
        engine = module;
        return module;
      })
      .catch((error) => {
        enginePromise = null;
        throw error;
      });
    return enginePromise;
  };

  const renderDiagnostics = (diagnostics) => {
    diagnosticsBox.replaceChildren();
    if (!diagnostics || diagnostics.length === 0) {
      diagnosticsBox.hidden = true;
      return;
    }
    diagnosticsBox.hidden = false;
    for (const diagnostic of diagnostics) {
      const item = document.createElement("li");
      item.dataset.severity = diagnostic.severity;
      const code = document.createElement("code");
      code.textContent = diagnostic.code.replace(/^.*\//u, "");
      const message = document.createElement("span");
      message.textContent = diagnostic.message;
      item.append(code, message);
      diagnosticsBox.append(item);
    }
  };

  const compile = async () => {
    const current = ++sequence;
    const source = editor.value;
    output.dataset.state = "loading";
    root.setAttribute("aria-busy", "true");
    setStatus("Compiling…");
    try {
      const module = engine ?? (await loadEngine());
      const result = await module.compileToAsyncAPI(source);
      if (current !== sequence) return;
      output.textContent = result.output;
      output.dataset.state = result.output ? "ready" : "empty";
      renderDiagnostics(result.diagnostics);
      const errors = result.diagnostics.filter(
        (diagnostic) => diagnostic.severity === "error",
      ).length;
      if (!result.output) {
        setStatus("No document emitted — fix the errors below.", "error");
      } else if (errors > 0) {
        setStatus(`Emitted with ${errors} error(s).`, "error");
      } else {
        setStatus("Compiled in your browser.", "ok");
      }
    } catch (error) {
      if (current !== sequence) return;
      output.textContent = "";
      output.dataset.state = "empty";
      renderDiagnostics([]);
      setStatus(`Compilation failed: ${error.message}`, "error");
    } finally {
      if (current === sequence) {
        root.setAttribute("aria-busy", "false");
      }
    }
  };

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(compile, 350);
  };

  const selectExample = (id) => {
    const source = sources.get(id);
    if (source === undefined) return;
    editor.value = source;
    for (const chip of chips) {
      chip.dataset.active =
        chip.dataset.playgroundExample === id ? "true" : "false";
    }
    compile();
  };

  editor.addEventListener("input", schedule);
  compileButton?.addEventListener("click", compile);
  resetButton?.addEventListener("click", () => selectExample(initialId));
  for (const chip of chips) {
    chip.addEventListener("click", () =>
      selectExample(chip.dataset.playgroundExample),
    );
  }

  copyButton?.addEventListener("click", async () => {
    const original = copyButton.textContent;
    try {
      await navigator.clipboard.writeText(output.textContent || "");
      copyButton.textContent = "Copied";
    } catch {
      copyButton.textContent = "Copy failed";
    }
    setTimeout(() => {
      copyButton.textContent = original;
    }, 2000);
  });

  for (const chip of chips) {
    chip.dataset.active =
      chip.dataset.playgroundExample === initialId ? "true" : "false";
  }

  const start = () => {
    if (enginePromise) return;
    setStatus("Loading the compiler…");
    loadEngine().then(
      () => compile(),
      (error) => {
        output.textContent =
          "The compiler bundle could not be loaded. Check your network and reload.";
        output.dataset.state = "empty";
        setStatus(`Could not load the compiler: ${error.message}`, "error");
      },
    );
  };

  if (!("IntersectionObserver" in window)) {
    start();
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          start();
        }
      }
    },
    { rootMargin: "300px" },
  );
  observer.observe(root);
})();
