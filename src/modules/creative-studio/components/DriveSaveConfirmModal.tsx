import { HardDriveUpload, X } from 'lucide-react';

interface DriveSaveConfirmModalProps {
  isOpen: boolean;
  fileName: string;
  description?: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DriveSaveConfirmModal({
  isOpen,
  fileName,
  description,
  busy = false,
  onCancel,
  onConfirm,
}: DriveSaveConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-xs"
      onClick={busy ? undefined : onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <HardDriveUpload className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Save to Google Drive?</h3>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3 text-sm text-slate-600">
          <p>
            This will upload a copy of{' '}
            <span className="font-semibold text-slate-900 break-all">“{fileName}”</span> to your
            Google Drive account.
          </p>
          {description && <p className="text-xs text-slate-500">{description}</p>}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer disabled:opacity-50"
          >
            {busy ? 'Saving to Drive...' : 'Confirm & Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
