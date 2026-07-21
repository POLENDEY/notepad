import { getTasks } from "@/lib/data";
import { TasksBoard } from "@/components/tasks-board";

export default async function TasksPage() {
  const tasks = await getTasks();

  return (
    <div className="page-shell">
      <header className="mb-6 sm:mb-8">
        <p className="section-label">Work</p>
        <h1 className="page-title mt-2">Tasks</h1>
        <p className="page-subtitle">Keep it simple — move work forward.</p>
      </header>
      <TasksBoard tasks={tasks} />
    </div>
  );
}
