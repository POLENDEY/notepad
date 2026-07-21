import { notFound } from "next/navigation";
import { getNoteById } from "@/lib/data";
import { NotePopout } from "@/components/note-popout";

export default async function NotePopoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNoteById(id);
  if (!note) notFound();

  return <NotePopout note={note} />;
}
