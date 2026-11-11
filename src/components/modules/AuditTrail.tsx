import React from 'react';
import { AuditLog } from '../../types';

interface AuditTrailProps {
  logs: AuditLog[];
}

export function AuditTrail({ logs }: AuditTrailProps) {
  return (
    <div className="space-y-6">
      <div className="admin-card rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-base text-gray-900">Platform Administrative Log</h3>
        <div className="space-y-3">
          {logs.map((log) => (
            <div key={log.id} className="p-3.5 rounded-xl bg-white border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-black font-bold">{log.id}</span>
                  <span className="font-semibold text-gray-900">{log.action}</span>
                  <span className="text-gray-500">• {log.timestamp}</span>
                </div>
                <p className="text-gray-500 mt-1">{log.details}</p>
              </div>
              <span className="font-mono text-gray-500 text-[11px]">{log.actor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
