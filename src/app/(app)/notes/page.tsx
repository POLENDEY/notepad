import { getCategories, getNotes, getSessionUser } from "@/lib/data";
import { NotesBoard } from "@/components/notes-board";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ library?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const [notes, categories] = await Promise.all([getNotes(), getCategories()]);
  const initialLibraryOpen =
    params.library === "1" || params.library === "open";

  return (
    <div className="page-shell">
      <header className="mb-6 sm:mb-8">
        <p className="section-label">Write</p>
        <h1 className="page-title mt-2">Notes</h1>
        <p className="page-subtitle">
          {user
            ? "Draft here. Open saved notes from the library button (desktop) or Saved in the menu (mobile)."
            : "Write freely as a guest. You’ll be asked to sign in only when you save."}
        </p>
      </header>
      <NotesBoard
        notes={notes}
        categories={categories}
        initialLibraryOpen={initialLibraryOpen && !!user}
        isLoggedIn={!!user}
      />
    </div>
  );
}
