"use client";

type DocumentPiP = {
  requestWindow: (options?: {
    width?: number;
    height?: number;
  }) => Promise<Window>;
};

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPiP;
  }
}

/** Opens a note in a real OS window (or Document PiP when available). */
export async function openNoteOutsideBrowser(noteId: string) {
  const url = `${window.location.origin}/notes/${noteId}/popout`;

  if (window.documentPictureInPicture) {
    try {
      const pip = await window.documentPictureInPicture.requestWindow({
        width: 420,
        height: 560,
      });

      // Copy styles so the note looks the same
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          const rules = Array.from(sheet.cssRules)
            .map((r) => r.cssText)
            .join("\n");
          const style = pip.document.createElement("style");
          style.textContent = rules;
          pip.document.head.appendChild(style);
        } catch {
          if (sheet.href) {
            const link = pip.document.createElement("link");
            link.rel = "stylesheet";
            link.href = sheet.href;
            pip.document.head.appendChild(link);
          }
        }
      }

      pip.document.title = "Note";
      const frame = pip.document.createElement("iframe");
      frame.src = url;
      frame.style.cssText =
        "border:0;width:100%;height:100%;position:fixed;inset:0;";
      pip.document.body.style.margin = "0";
      pip.document.body.appendChild(frame);
      return;
    } catch {
      /* fall through to window.open */
    }
  }

  const popup = window.open(
    url,
    `notepad-note-${noteId}`,
    "popup=yes,width=420,height=560,noopener,noreferrer",
  );
  popup?.focus();
}
