import { useState, type FormEvent } from 'react';
import { ThumbsUp, MessageCircle, Info } from 'lucide-react';
import {
  computeEstimatedContributions,
  type CreativeProject,
  type UserProfile,
} from '../types/studio';
import type { GenreThemeTokens } from '../theme/genreThemes';
import { studioService as firestoreStudio } from '../services/studioService';
import { StudioAvatar } from './StudioAvatar';

interface ContributionsTabProps {
  project: CreativeProject;
  currentUser: UserProfile;
  theme: GenreThemeTokens;
  onProjectUpdate: (updated: CreativeProject) => void;
}

export function ContributionsTab({
  project,
  currentUser,
  theme,
}: ContributionsTabProps) {
  const isMember = project.members.some((m) => m.userId === currentUser.id);
  const estimates = computeEstimatedContributions(project);
  const teammates = project.members.filter((m) => m.userId !== currentUser.id);

  const [targetUserId, setTargetUserId] = useState(teammates[0]?.userId ?? '');
  const [sentiment, setSentiment] = useState<'positive' | 'constructive'>('positive');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const existingReview = project.feedback.find(
    (f) => f.reviewerId === currentUser.id && f.targetUserId === targetUserId
  );

  async function handleSubmitFeedback(e: FormEvent) {
    e.preventDefault();
    if (!targetUserId || !comment.trim()) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setBusy(true);
    try {
      await firestoreStudio.submitFeedback(project.id, currentUser, {
        targetUserId,
        sentiment,
        comment: comment.trim(),
      });
      setComment('');
      setSuccessMsg(
        existingReview
          ? 'Your peer feedback was updated (one review per teammate).'
          : 'Constructive peer feedback submitted.'
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to submit feedback.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Transparency Disclaimer */}
      <div
        className="studio-glass rounded-2xl border p-4 flex items-start gap-3"
        style={{ borderColor: theme.borderSubtle }}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.accentText }} />
        <div className="text-xs leading-relaxed" style={{ color: theme.mutedInk }}>
          <span className="font-semibold text-slate-800">
            Estimated Contribution Indicators:
          </span>{' '}
          The scores and shares below combine assigned/completed tasks, in-progress milestones,
          collaboration activity (messages, media, portfolio uploads), and peer feedback. They are
          transparent <strong>estimated indicators</strong> to support team coordination—not an
          objective measurement of total creative labor. Peer feedback is limited to one editable
          review per teammate to prevent voting abuse.
        </div>
      </div>

      {/* Contribution Table */}
      <div
        className="studio-glass rounded-2xl border overflow-hidden"
        style={{ borderColor: theme.borderSubtle }}
      >
        <div className="px-6 py-4 border-b" style={{ borderColor: theme.borderSubtle }}>
          <h3 className="text-sm font-semibold">Team Contribution Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="border-b text-[11px] font-medium"
                style={{ borderColor: theme.borderSubtle, color: theme.mutedInk }}
              >
                <th className="py-3 px-6">Member</th>
                <th className="py-3 px-4 text-right">Assigned</th>
                <th className="py-3 px-4 text-right">Completed</th>
                <th className="py-3 px-4 text-right">Participation</th>
                <th className="py-3 px-4 text-right">Peer Feedback</th>
                <th className="py-3 px-6">Estimated Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm" style={{ borderColor: theme.borderSubtle }}>
              {estimates.map((row) => (
                <tr key={row.userId} className="bg-white/50 hover:bg-white/80 transition-colors">
                  <td className="py-3.5 px-6">
                    <div className="flex items-center gap-3">
                      <StudioAvatar
                        name={row.name}
                        avatarUrl={row.avatarUrl}
                        size="sm"
                        tintBg={theme.accentSoft}
                        tintText={theme.accentText}
                      />
                      <div>
                        <div className="text-sm font-medium">{row.name}</div>
                        <div className="text-xs" style={{ color: theme.mutedInk }}>
                          {row.creativeRole}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                    {row.assignedTasks}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs font-medium">
                    {row.completedTasks}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono tabular-nums text-xs">
                    {row.participationEvents} actions
                  </td>
                  <td className="py-3.5 px-4 text-right text-xs tabular-nums">
                    <span className="text-emerald-700 font-medium">
                      +{row.positiveFeedbackCount}
                    </span>
                    <span className="mx-1 text-slate-300">/</span>
                    <span className="text-amber-700">{row.constructiveFeedbackCount} notes</span>
                  </td>
                  <td className="py-3.5 px-6 min-w-[190px]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span style={{ color: theme.mutedInk }}>Est. Share</span>
                      <span className="font-mono font-semibold tabular-nums">
                        {row.estimatedSharePercent}% · {row.estimatedScore} pts
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ backgroundColor: theme.progressTrack }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${row.estimatedScore}%`,
                          backgroundColor: theme.progressFill,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Constructive Peer Feedback Form & Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="studio-glass rounded-2xl border p-5 space-y-4"
          style={{ borderColor: theme.borderSubtle }}
        >
          <div>
            <h3 className="text-sm font-semibold">Submit Peer Feedback</h3>
            <p className="text-xs mt-0.5" style={{ color: theme.mutedInk }}>
              Non-anonymous, one editable review per teammate per project.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
              {successMsg}
            </div>
          )}

          {!isMember ? (
            <p className="text-xs" style={{ color: theme.mutedInk }}>
              Only project team members can submit peer feedback.
            </p>
          ) : teammates.length === 0 ? (
            <p className="text-xs" style={{ color: theme.mutedInk }}>
              Add teammates to exchange constructive peer feedback.
            </p>
          ) : (
            <form onSubmit={handleSubmitFeedback} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">Teammate</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border"
                  style={{ borderColor: theme.borderSubtle }}
                >
                  {teammates.map((t) => (
                    <option key={t.userId} value={t.userId}>
                      {t.name} ({t.creativeRole})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSentiment('positive')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border cursor-pointer transition-colors ${
                    sentiment === 'positive'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Positive Recognition
                </button>
                <button
                  type="button"
                  onClick={() => setSentiment('constructive')}
                  className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border cursor-pointer transition-colors ${
                    sentiment === 'constructive'
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-white border-slate-200 text-slate-600'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Constructive Note
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">
                  Feedback Note (Required)
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share specific observations about collaboration, delivery, or creative craft..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white border focus:outline-none"
                  style={{ borderColor: theme.borderSubtle }}
                />
              </div>

              <button
                type="submit"
                disabled={busy || comment.trim().length < 6}
                style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
                className="px-4 py-2 text-xs font-medium rounded-xl cursor-pointer disabled:opacity-45"
              >
                {existingReview ? 'Update Your Feedback' : 'Submit Peer Feedback'}
              </button>
            </form>
          )}
        </div>

        {/* Peer Feedback Feed */}
        <div
          className="studio-glass rounded-2xl border p-5 space-y-4"
          style={{ borderColor: theme.borderSubtle }}
        >
          <h3 className="text-sm font-semibold">Recent Peer Feedback</h3>
          {project.feedback.length === 0 ? (
            <p className="text-xs py-8 text-center" style={{ color: theme.mutedInk }}>
              No peer feedback recorded yet.
            </p>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto">
              {project.feedback.map((fb) => {
                const target = project.members.find((m) => m.userId === fb.targetUserId);
                return (
                  <div
                    key={fb.id}
                    className="p-3.5 rounded-xl bg-white/85 border space-y-1.5"
                    style={{ borderColor: theme.borderSubtle }}
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-medium text-slate-800">
                        {fb.reviewerName} → {target?.name ?? 'Team Member'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          fb.sentiment === 'positive'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {fb.sentiment === 'positive' ? 'Positive' : 'Constructive'}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-600">{fb.comment}</p>
                    <div className="text-[11px] tabular-nums" style={{ color: theme.mutedInk }}>
                      {new Date(fb.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
