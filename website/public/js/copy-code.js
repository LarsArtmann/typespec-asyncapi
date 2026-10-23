function legacyCopy(text) {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  return copied;
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return legacyCopy(text);
}

document.querySelectorAll("[data-copy], #copy-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy ?? button.dataset.code ?? "";
    const original = button.textContent.trim();
    try {
      await copyText(text);
      button.textContent = "Copied";
      button.classList.add("text-success");
    } catch {
      button.textContent = "Copy failed";
    }
    setTimeout(() => {
      button.textContent = original;
      button.classList.remove("text-success");
    }, 2000);
  });
});
