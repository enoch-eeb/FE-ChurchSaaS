"use client";

import { Handle, Position } from "@xyflow/react";
import { User, Phone, Briefcase } from "lucide-react";

export type RealMemberData = {
  memberId: string;
  name: string;
  position: string;
  phone: string;
  role: string;
  divisionRole: string;
};

export function MemberNode({ data }: { data: RealMemberData }) {
  return (
    <div className="bg-background border border-border shadow-lg rounded-lg p-4 min-w-60 hover:border-primary/50 transition-colors">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary" />
      
      <div className="flex flex-col space-y-3">
        <div className="flex items-center gap-3 border-b border-border/50 pb-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <User size={16} />
          </div>
          <div>
            <p className="font-bold text-foreground text-sm leading-tight truncate max-w-40">
              {data.name || "-"}
            </p>
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-bold mt-0.5">
              {data.role ? data.role.replace("_", " ") : "MEMBER"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Briefcase size={14} className="shrink-0" />
            <span className="truncate">
              {data.position || (data.divisionRole ? data.divisionRole.replace("_", " ") : "Belum Ada Jabatan")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-muted text-xs">
            <Phone size={14} className="shrink-0" />
            <span>{data.phone || "-"}</span>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary" />
      <Handle type="source" position={Position.Left} id="left" className="w-3 h-3 bg-primary" />
      <Handle type="source" position={Position.Right} id="right" className="w-3 h-3 bg-primary" />
    </div>
  );
}