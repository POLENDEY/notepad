import { NoteNotFoundRedirect } from "@/components/note-not-found-redirect";

export default function NotePopoutNotFound() {
  return (
    <NoteNotFoundRedirect
      title="Note not found"
      message="This note doesn’t exist or was removed. Returning to Notepad."
      href="/notes"
    />
  );
}
