import { X, Server, ShieldCheck, Database } from 'lucide-react';

interface BackendSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BackendSetupModal({ isOpen, onClose }: BackendSetupModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Cloud Sync & Security Architecture
            </h2>
            <p className="text-xs text-slate-500">
              Real-time multi-user sync via Firebase Authentication & Cloud Firestore
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-sm text-slate-700 leading-relaxed">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Database className="w-4 h-4" />
              Shared Cloud Database (Firebase Auth + Cloud Firestore)
            </div>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>
                <strong>Single Shared World Across Devices:</strong> All projects, invite codes,
                team rosters, scripts, tasks, milestones, group chats, reactions, peer feedback,
                and creator connections sync live through Cloud Firestore.
              </li>
              <li>
                <strong>Real People Connections:</strong> Every signed-in collaborator appears in
                the Studio Creator Directory so you can send connection requests and direct project
                invitations.
              </li>
              <li>
                <strong>Invite Codes & Links:</strong> 8-character invite codes and shareable
                `?invite=CODE` links redeem atomically against Firestore so friends immediately enter
                your exact project workspace.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <Server className="w-4 h-4" />
              Media Uploads & Google Drive
            </div>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>
                <strong>Photos, Videos, Audio & Scripts:</strong> Direct file uploads (up to 150
                MB) and `.docx`/`.pdf`/`.txt` script parsing are handled by Express (`server.ts`)
                and linked inside Firestore documents.
              </li>
              <li>
                <strong>Google Drive Integration:</strong> Optional Google Drive OAuth lets team
                members import or export scripts, photos, videos, and finished portfolio pieces.
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Security rules in `firestore.rules` enforce verified user authentication, project
              membership gates for private drafts/chats/tasks, script visibility levels, and
              private email isolation.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
