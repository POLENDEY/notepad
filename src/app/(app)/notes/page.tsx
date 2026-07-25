import { getArchivedNotes, getNotes, getSessionUser } from "@/lib/data";
import { NotesWorkspace } from "@/components/notes-workspace";

export default async function NotesPage({
  searchParams,
}: {
  searchParams: Promise<{ library?: string }>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const [notes, archivedNotes] = await Promise.all([
    getNotes(),
    user ? getArchivedNotes() : Promise.resolve([]),
  ]);
  const initialShowSaved =
    (params.library === "1" || params.library === "open") && !!user;

  return (
    <NotesWorkspace
      notes={notes}
      archivedNotes={archivedNotes}
      isLoggedIn={!!user}
      initialShowSaved={initialShowSaved}
    />
  );
}
