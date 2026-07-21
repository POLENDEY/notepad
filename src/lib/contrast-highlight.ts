import Highlight from "@tiptap/extension-highlight";
import { contrastForeground } from "@/lib/contrast";

/** Highlight mark that sets readable text color against the chosen background. */
export const ContrastHighlight = Highlight.extend({
  addAttributes() {
    if (!this.options.multicolor) {
      return this.parent?.() ?? {};
    }

    return {
      color: {
        default: null,
        parseHTML: (element: HTMLElement) =>
          element.getAttribute("data-color") ||
          element.getAttribute("style")?.match(
            /background-color:\s*([^;]+)/i,
          )?.[1]?.trim() ||
          element.style.backgroundColor ||
          null,
        renderHTML: (attributes: { color?: string | null }) => {
          if (!attributes.color) return {};
          const bg = attributes.color;
          const fg = contrastForeground(bg);
          return {
            "data-color": bg,
            style: `background-color: ${bg}; color: ${fg}`,
          };
        },
      },
    };
  },
});
