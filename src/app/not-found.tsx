import { NoteNotFoundRedirect } from "@/components/note-not-found-redirect";

export default function NotFound() {
  return (
    <NoteNotFoundRedirect
      title="Page not found"
      message="That page doesn’t exist. You’ll be redirected to Notepad."
      href="/notes"
    />
  );
}
