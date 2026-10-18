import React from 'react';
import { AuditLog } from '../../types';

interface AuditTrailProps {
  logs: AuditLog[];
}

export function AuditTrail({ logs }: AuditTrailProps) {
  return (
    <div className="space-y-6">
      <div className="admin-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-base text-white">Platform Administrative Log</h3>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-amber-400 font-bold">{log.id}</span>
                  <span className="font-semibold text-white">{log.action}</span>
                  <span className="text-slate-500">• {log.timestamp}</span>
                </div>
                <p className="text-slate-400 mt-1">{log.details}</p>
              </div>
              <span className="font-mono text-slate-500 text-[11px]">{log.actor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
