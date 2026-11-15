import { motion } from 'framer-motion';
import { ArrowUpRight, Users, Lock } from 'lucide-react';
import {
  computeProjectProgress,
  computeUnfilledRoles,
  type CreativeProject,
} from '../types/studio';
import { getGenreTheme, STATUS_STYLES } from '../theme/genreThemes';

interface StudioProjectCardProps {
  project: CreativeProject;
  onOpen: (projectId: string) => void;
  index: number;
}

export function StudioProjectCard({ project, onOpen, index }: StudioProjectCardProps) {
  const theme = getGenreTheme(project.primaryGenre);
  const progress = computeProjectProgress(project.tasks);
  const unfilledRoles = computeUnfilledRoles(project.requiredRoles, project.members);
  const statusStyle = STATUS_STYLES[project.status];

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index * 0.04, 0.2), ease: [0.16, 1, 0.3, 1] }}
      style={{
        background: theme.softGradient,
        borderColor: theme.borderSubtle,
        color: theme.ink,
      }}
      className="group rounded-2xl border p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
    >
      <div className="space-y-4">
        {/* Top metadata row: clean unboxed genre & status indicator */}
        <div className="flex items-start justify-between gap-3">
          <div className="text-xs font-medium tracking-tight" style={{ color: theme.accentText }}>
            {project.genres.join(' · ')}
            {project.isSampleProject && (
              <span className="ml-2 font-normal opacity-75">· Studio Sample</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {project.isDraft && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                <Lock className="w-3 h-3" />
                Draft
              </span>
            )}
            <span
              style={{
                backgroundColor: statusStyle.bg,
                borderColor: statusStyle.border,
                color: statusStyle.text,
              }}
              className="px-2.5 py-0.5 text-[11px] font-medium rounded-md border whitespace-nowrap"
            >
              {statusStyle.label}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-semibold tracking-tight leading-snug text-balance">
            {project.title}
          </h3>
          <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: theme.mutedInk }}>
            {project.description || 'Blank workspace ready for script, team roles, and production milestones.'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span style={{ color: theme.mutedInk }}>
              Task Completion ({progress.completed}/{progress.total})
            </span>
            <span className="font-mono font-medium tabular-nums" style={{ color: theme.ink }}>
              {progress.percentage}%
            </span>
          </div>
          <div
            className="h-1.5 w-full rounded-full overflow-hidden"
            style={{ backgroundColor: theme.progressTrack }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="h-full rounded-full"
              style={{ backgroundColor: theme.progressFill }}
            />
          </div>
        </div>

        {/* Required Unfilled Team Tags */}
        <div className="pt-1">
          <div className="text-[11px] font-medium mb-1.5" style={{ color: theme.mutedInk }}>
            Required Team
          </div>
          {unfilledRoles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {unfilledRoles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-0.5 text-xs rounded-md bg-slate-100/90 text-slate-600 border border-slate-200/80 whitespace-nowrap"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">All listed roles currently filled</p>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div
        className="mt-6 pt-4 border-t flex items-center justify-between gap-3"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="flex items-center gap-1.5 text-xs tabular-nums" style={{ color: theme.mutedInk }}>
          <Users className="w-3.5 h-3.5" />
          <span>
            {project.members.length} {project.members.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onOpen(project.id)}
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderColor: theme.borderStrong,
            color: theme.accentText,
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl border hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Open Project
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.article>
  );
}
