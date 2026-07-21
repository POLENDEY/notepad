import { getTrashedCategories, getTrashedNotes } from "@/lib/data";
import { TrashBoard } from "@/components/trash-board";
import { purgeExpiredTrashForCurrentUser } from "@/lib/trash";

export default async function TrashPage() {
  // Purge in parallel with reads (expired rows simply won't matter after)
  const [, notes, categories] = await Promise.all([
    purgeExpiredTrashForCurrentUser(),
    getTrashedNotes(),
    getTrashedCategories(),
  ]);

  return (
    <div className="page-shell max-w-2xl">
      <header className="mb-6 sm:mb-8">
        <p className="section-label">Cleanup</p>
        <h1 className="page-title mt-2">Trash</h1>
      </header>
      <TrashBoard notes={notes} categories={categories} />
    </div>
  );
}
