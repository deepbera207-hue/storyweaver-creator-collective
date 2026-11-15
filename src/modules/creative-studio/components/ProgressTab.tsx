import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, CheckCircle2, Clock, Circle, Flag } from 'lucide-react';
import {
  computeProjectProgress,
  type CreativeProject,
  type TaskStatus,
  type UserProfile,
} from '../types/studio';
import type { GenreThemeTokens } from '../theme/genreThemes';
import { firestoreStudio } from '../services/firestoreStudio';

interface ProgressTabProps {
  project: CreativeProject;
  currentUser: UserProfile;
  theme: GenreThemeTokens;
  onProjectUpdate: (updated: CreativeProject) => void;
}

const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function ProgressTab({
  project,
  currentUser,
  theme,
}: ProgressTabProps) {
  const isMember = project.members.some((m) => m.userId === currentUser.id);
  const progress = computeProjectProgress(project.tasks);

  const [msTitle, setMsTitle] = useState('');
  const [msDate, setMsDate] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskMilestone, setTaskMilestone] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleAddMilestone(e: FormEvent) {
    e.preventDefault();
    if (!msTitle.trim()) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await firestoreStudio.createMilestone(project.id, currentUser.id, {
        title: msTitle.trim(),
        targetDate: msDate || new Date().toISOString().slice(0, 10),
      });
      setMsTitle('');
      setMsDate('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to add milestone.');
    } finally {
      setBusy(false);
    }
  }

  async function handleMilestoneStatus(msId: string, status: TaskStatus) {
    setBusy(true);
    try {
      await firestoreStudio.updateMilestone(project.id, msId, { status });
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update milestone.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    setErrorMsg(null);
    setBusy(true);
    try {
      await firestoreStudio.createTask(project, currentUser.id, {
        title: taskTitle.trim(),
        assigneeId: taskAssignee || undefined,
        milestoneId: taskMilestone || undefined,
        dueDate: taskDue || undefined,
      });
      setTaskTitle('');
      setTaskDue('');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to create task.');
    } finally {
      setBusy(false);
    }
  }

  async function handleTaskUpdate(
    taskId: string,
    payload: { status?: TaskStatus; assigneeId?: string | null }
  ) {
    setBusy(true);
    try {
      await firestoreStudio.updateTask(project, taskId, payload);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to update task.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    setBusy(true);
    try {
      await firestoreStudio.deleteTask(project.id, taskId);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to delete task.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {errorMsg}
        </div>
      )}

      {/* Overall Calculated Progress Summary */}
      <div
        className="studio-glass rounded-2xl border p-6 space-y-4"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">Project Progress</h3>
            <p className="text-xs mt-0.5" style={{ color: theme.mutedInk }}>
              Calculated directly from completed tasks ({progress.completed} of {progress.total} tasks completed)
            </p>
          </div>
          <div className="text-3xl font-semibold font-mono tabular-nums" style={{ color: theme.accentText }}>
            {progress.percentage}%
          </div>
        </div>

        <div
          className="h-2.5 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: theme.progressTrack }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress.percentage}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="h-full rounded-full"
            style={{ backgroundColor: theme.progressFill }}
          />
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3 rounded-xl bg-white/75 border" style={{ borderColor: theme.borderSubtle }}>
            <div style={{ color: theme.mutedInk }}>Completed Tasks</div>
            <div className="text-lg font-semibold tabular-nums mt-0.5 text-emerald-700">
              {progress.completed}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/75 border" style={{ borderColor: theme.borderSubtle }}>
            <div style={{ color: theme.mutedInk }}>In Progress</div>
            <div className="text-lg font-semibold tabular-nums mt-0.5 text-amber-700">
              {progress.inProgress}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-white/75 border" style={{ borderColor: theme.borderSubtle }}>
            <div style={{ color: theme.mutedInk }}>Pending Tasks</div>
            <div className="text-lg font-semibold tabular-nums mt-0.5 text-slate-700">
              {progress.pending}
            </div>
          </div>
        </div>
      </div>

      {/* Milestones & Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Milestones Column */}
        <div
          className="studio-glass rounded-2xl border p-5 space-y-4"
          style={{ borderColor: theme.borderSubtle }}
        >
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4" style={{ color: theme.accentText }} />
            <h3 className="text-sm font-semibold">Project Milestones</h3>
          </div>

          {isMember && (
            <form onSubmit={handleAddMilestone} className="space-y-2">
              <input
                type="text"
                value={msTitle}
                onChange={(e) => setMsTitle(e.target.value)}
                placeholder="New milestone title..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none"
                style={{ borderColor: theme.borderSubtle }}
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={msDate}
                  onChange={(e) => setMsDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl bg-white border focus:outline-none"
                  style={{ borderColor: theme.borderSubtle }}
                />
                <button
                  type="submit"
                  disabled={busy || !msTitle.trim()}
                  style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl cursor-pointer disabled:opacity-45"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2.5">
            {project.milestones.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: theme.mutedInk }}>
                No milestones defined yet.
              </p>
            ) : (
              project.milestones.map((ms) => (
                <div
                  key={ms.id}
                  className="p-3.5 rounded-xl bg-white/85 border space-y-2"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-semibold">{ms.title}</div>
                      <div className="text-[11px] font-mono tabular-nums mt-0.5" style={{ color: theme.mutedInk }}>
                        Target: {ms.targetDate}
                      </div>
                    </div>
                    {isMember ? (
                      <select
                        value={ms.status}
                        disabled={busy}
                        onChange={(e) => void handleMilestoneStatus(ms.id, e.target.value as TaskStatus)}
                        className="px-2 py-1 text-[11px] rounded-lg bg-white border cursor-pointer"
                        style={{ borderColor: theme.borderSubtle }}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-600">
                        {TASK_STATUS_LABEL[ms.status]}
                      </span>
                    )}
                  </div>
                  {ms.description && (
                    <p className="text-[11px]" style={{ color: theme.mutedInk }}>
                      {ms.description}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tasks Column */}
        <div
          className="lg:col-span-2 studio-glass rounded-2xl border p-5 space-y-4"
          style={{ borderColor: theme.borderSubtle }}
        >
          <h3 className="text-sm font-semibold">Production Tasks</h3>

          {isMember && (
            <form
              onSubmit={handleAddTask}
              className="p-3.5 rounded-xl bg-white/80 border grid grid-cols-1 sm:grid-cols-12 gap-2"
              style={{ borderColor: theme.borderSubtle }}
            >
              <input
                type="text"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a task (e.g. Clean up shot 04 keyframes)..."
                className="sm:col-span-5 px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none"
                style={{ borderColor: theme.borderSubtle }}
              />
              <select
                value={taskAssignee}
                onChange={(e) => setTaskAssignee(e.target.value)}
                className="sm:col-span-3 px-2.5 py-2 text-xs rounded-xl bg-white border"
                style={{ borderColor: theme.borderSubtle }}
              >
                <option value="">Unassigned</option>
                {project.members.map((m) => (
                  <option key={m.userId} value={m.userId}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select
                value={taskMilestone}
                onChange={(e) => setTaskMilestone(e.target.value)}
                className="sm:col-span-2 px-2.5 py-2 text-xs rounded-xl bg-white border"
                style={{ borderColor: theme.borderSubtle }}
              >
                <option value="">No milestone</option>
                {project.milestones.map((ms) => (
                  <option key={ms.id} value={ms.id}>
                    {ms.title}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={busy || !taskTitle.trim()}
                style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                className="sm:col-span-2 inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-xl cursor-pointer disabled:opacity-45 whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </form>
          )}

          <div className="space-y-2">
            {project.tasks.length === 0 ? (
              <p className="text-xs py-8 text-center" style={{ color: theme.mutedInk }}>
                No tasks added yet. Create tasks above to track progress automatically.
              </p>
            ) : (
              project.tasks.map((task) => {
                const StatusIcon =
                  task.status === 'completed'
                    ? CheckCircle2
                    : task.status === 'in_progress'
                      ? Clock
                      : Circle;
                const msTitleMatch = project.milestones.find((m) => m.id === task.milestoneId)?.title;

                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-white/85 border flex flex-wrap items-center justify-between gap-3"
                    style={{ borderColor: theme.borderSubtle }}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <StatusIcon
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          task.status === 'completed'
                            ? 'text-emerald-600'
                            : task.status === 'in_progress'
                              ? 'text-amber-600'
                              : 'text-slate-400'
                        }`}
                      />
                      <div className="min-w-0">
                        <div
                          className={`text-sm font-medium ${
                            task.status === 'completed' ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </div>
                        <div className="text-[11px] flex flex-wrap items-center gap-1.5 mt-0.5" style={{ color: theme.mutedInk }}>
                          <span>{task.assigneeName || 'Unassigned'}</span>
                          {msTitleMatch && (
                            <>
                              <span>·</span>
                              <span>{msTitleMatch}</span>
                            </>
                          )}
                          {task.dueDate && (
                            <>
                              <span>·</span>
                              <span className="font-mono tabular-nums">Due {task.dueDate}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {isMember && (
                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={task.assigneeId ?? ''}
                          disabled={busy}
                          onChange={(e) =>
                            void handleTaskUpdate(task.id, { assigneeId: e.target.value || null })
                          }
                          aria-label="Assign task"
                          className="px-2.5 py-1 text-xs rounded-lg bg-white border cursor-pointer"
                          style={{ borderColor: theme.borderSubtle }}
                        >
                          <option value="">Unassigned</option>
                          {project.members.map((m) => (
                            <option key={m.userId} value={m.userId}>
                              {m.name}
                            </option>
                          ))}
                        </select>

                        <select
                          value={task.status}
                          disabled={busy}
                          onChange={(e) =>
                            void handleTaskUpdate(task.id, { status: e.target.value as TaskStatus })
                          }
                          aria-label="Task status"
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white border cursor-pointer"
                          style={{ borderColor: theme.borderSubtle }}
                        >
                          <option value="pending">Pending</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>

                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void handleDeleteTask(task.id)}
                          title="Delete task"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
