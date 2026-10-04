import { LogOut } from 'lucide-react';

const LogoutConfirmation = ({ open, onCancel, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirmation-title"
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
            <LogOut className="h-5 w-5" />
          </span>
          <div>
            <h2 id="logout-confirmation-title" className="text-lg font-bold text-gray-900 dark:text-white">
              Sign out?
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Are you sure you want to end your current session?
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Sign out
          </button>
        </div>
      </section>
    </div>
  );
};

export default LogoutConfirmation;
