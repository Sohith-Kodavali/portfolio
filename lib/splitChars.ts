// Lightweight text splitting — wraps words (and optionally characters) in
// spans so they can be masked and animated. Avoids pulling in a plugin.

export function splitWords(root: HTMLElement): HTMLElement[] {
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentNode;
      if (!parent) return;
      const parts = (node.textContent ?? "").split(/(\s+)/);
      parts.forEach((part) => {
        if (part === "") return;
        if (/^\s+$/.test(part)) {
          parent.insertBefore(document.createTextNode(part), node);
          return;
        }
        const mask = document.createElement("span");
        mask.className = "reveal-mask";
        const inner = document.createElement("span");
        inner.textContent = part;
        mask.appendChild(inner);
        parent.insertBefore(mask, node);
      });
      parent.removeChild(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "BR" || el.classList.contains("reveal-mask")) return;
      Array.from(node.childNodes).forEach(walk);
    }
  };

  walk(root);
  root.setAttribute("data-split", "done");
  return Array.from(root.querySelectorAll<HTMLElement>(".reveal-mask > span"));
}

// Wraps each word in a plain inline-block span (no overflow mask) so words can be
// opacity-scrubbed without clipping descenders.
export function splitWordsPlain(root: HTMLElement): HTMLElement[] {
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentNode;
      if (!parent) return;
      const parts = (node.textContent ?? "").split(/(\s+)/);
      parts.forEach((part) => {
        if (part === "") return;
        if (/^\s+$/.test(part)) {
          parent.insertBefore(document.createTextNode(part), node);
          return;
        }
        const span = document.createElement("span");
        span.className = "rw";
        span.textContent = part;
        parent.insertBefore(span, node);
      });
      parent.removeChild(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "BR" || el.classList.contains("rw")) return;
      Array.from(node.childNodes).forEach(walk);
    }
  };

  walk(root);
  return Array.from(root.querySelectorAll<HTMLElement>(".rw"));
}

export function splitChars(root: HTMLElement): HTMLElement[] {
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const parent = node.parentNode;
      if (!parent) return;
      const parts = (node.textContent ?? "").split(/(\s+)/);
      parts.forEach((part) => {
        if (part === "") return;
        if (/^\s+$/.test(part)) {
          parent.insertBefore(document.createTextNode(part), node);
          return;
        }
        const word = document.createElement("span");
        word.className = "word";
        [...part].forEach((ch) => {
          const c = document.createElement("span");
          c.className = "char";
          c.textContent = ch;
          word.appendChild(c);
        });
        parent.insertBefore(word, node);
      });
      parent.removeChild(node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.tagName === "BR" || el.classList.contains("char")) return;
      Array.from(node.childNodes).forEach(walk);
    }
  };

  walk(root);
  root.classList.add("split");
  return Array.from(root.querySelectorAll<HTMLElement>(".char"));
}
