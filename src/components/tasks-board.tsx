"use client";

import { useState, useTransition } from "react";
import type { Task, TaskStatus } from "@/lib/types";
import { createTask, deleteTask, updateTaskStatus } from "@/app/actions/tasks";

const columns: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "Doing" },
  { status: "done", label: "Done" },
];

export function TasksBoard({ tasks }: { tasks: Task[] }) {
  const [pending, startTransition] = useTransition();
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<TaskStatus>("todo");

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {tasks.filter((t) => t.status !== "done").length} open
        </p>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-primary"
        >
          {showForm ? "Close" : "New task"}
        </button>
      </div>

      {showForm ? (
        <form
          action={(fd) => {
            startTransition(async () => {
              await createTask(fd);
              setShowForm(false);
            });
          }}
          className="soft-panel grid gap-3 sm:grid-cols-2"
        >
          <input
            name="title"
            placeholder="What needs doing?"
            required
            className="field sm:col-span-2"
          />
          <input
            name="description"
            placeholder="Notes (optional)"
            className="field sm:col-span-2"
          />
          <select name="priority" className="field" defaultValue="medium">
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <input type="date" name="dueDate" className="field" />
          <button
            type="submit"
            disabled={pending}
            className="btn-primary sm:col-span-2"
          >
            {pending ? "Adding…" : "Add task"}
          </button>
        </form>
      ) : null}

      {/* Mobile tabs */}
      <div className="flex gap-1 overflow-x-auto lg:hidden">
        {columns.map((col) => {
          const count = tasks.filter((t) => t.status === col.status).length;
          return (
            <button
              key={col.status}
              type="button"
              onClick={() => setTab(col.status)}
              className={`chip ${
                tab === col.status ? "chip-active" : "chip-idle"
              } whitespace-nowrap`}
            >
              {col.label} {count}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          const hiddenOnMobile = tab !== col.status ? "hidden lg:block" : "";
          return (
            <section key={col.status} className={hiddenOnMobile}>
              <h3 className="mb-3 hidden text-xs font-medium tracking-[0.12em] text-stone-400 uppercase lg:block">
                {col.label}
                <span className="ml-2 text-stone-300">{colTasks.length}</span>
              </h3>
              <ul className="space-y-2">
                {colTasks.map((task) => (
                  <li key={task.id} className="soft-panel p-3.5 sm:p-4">
                    <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
                      {task.title}
                    </p>
                    {task.description ? (
                      <p className="mt-1 text-sm text-stone-500">{task.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-stone-400">
                      <span className="capitalize">{task.priority}</span>
                      {task.due_date ? <span>· Due {task.due_date}</span> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {columns
                        .filter((c) => c.status !== task.status)
                        .map((c) => (
                          <button
                            key={c.status}
                            type="button"
                            disabled={pending}
                            onClick={() =>
                              startTransition(() =>
                                updateTaskStatus(task.id, c.status),
                              )
                            }
                            className="btn-quiet px-2.5 py-1 text-xs"
                          >
                            {c.label}
                          </button>
                        ))}
                      <button
                        type="button"
                        className="ml-auto text-xs text-red-600/80 hover:text-red-700"
                        onClick={() =>
                          startTransition(() => deleteTask(task.id))
                        }
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
                {colTasks.length === 0 ? (
                  <li className="rounded-2xl border border-dashed border-stone-200 px-4 py-8 text-center text-sm text-stone-400 dark:border-stone-700">
                    Empty
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}
