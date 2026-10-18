import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function SuperAdminNotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
        <div className="text-6xl font-extrabold tracking-tighter text-amber-400">
          404
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Governance Endpoint Not Found
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            The administrative telemetry view, audit log, or tenant console route does not exist.
          </p>
        </div>

        <div className="pt-2">
          <Link href="/">
            <Button
              className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium shadow-lg shadow-amber-600/20"
            >
              Return to Governance Console
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
