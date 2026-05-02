"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  ReactFlow, MiniMap, Controls, Background, useNodesState,
  useEdgesState, addEdge, Connection, Edge, MarkerType, Node, Position
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import dagre from "dagre";
import { MemberNode, RealMemberData } from "./member-node";
import { LayoutTemplate, Save, Loader2, Plus, Users, Search, PanelLeft, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

const nodeTypes = {
  member: MemberNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 260, height: 140 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes: Node[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - 260 / 2,
        y: nodeWithPosition.y - 140 / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

export default function StructurePage() {
  const t = useTranslations("MemberManagementsPage");
  const { resolvedTheme } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isSaving, setIsSaving] = useState(false);

  const getToken = useCallback(() => {
    return document.cookie.split("; ").find((row) => row.startsWith("coma_token="))?.split("=")[1] ?? localStorage.getItem("token") ?? "";
  }, []);

  const fetchMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/members?page=1&limit=100`);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();

      if (res.ok && data.data) {
        setMembers(data.data.items ?? []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchMembers();
    
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [fetchMembers]);

  const onConnect = useCallback(
    (params: Connection | Edge) => {
      const newEdge = {
        ...params,
        markerEnd: { type: MarkerType.ArrowClosed, color: resolvedTheme === "dark" ? "#cbd5e1" : "#334155" },
        style: { stroke: resolvedTheme === "dark" ? "#cbd5e1" : "#334155", strokeWidth: 2 },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, resolvedTheme]
  );

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      nodes,
      edges,
      "TB"
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  const addMemberToCanvas = (member: any) => {
    if (nodes.some((n) => n.id === member.memberId)) return;

    const newNode: Node = {
      id: member.memberId,
      type: "member",
      position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: {
        memberId: member.memberId,
        name: member.name,
        position: member.position,
        phone: member.phone,
        role: member.role,
        divisionRole: member.divisionRole,
      } as RealMemberData,
    };
    setNodes((nds) => [...nds, newNode]);
    
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSaveStructure = async () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-56px)] bg-background overflow-hidden relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`
        absolute md:relative z-30 h-full flex flex-col bg-background md:bg-bg-alt/50 border-r border-border transition-all duration-300 ease-in-out shrink-0
        ${isSidebarOpen ? "w-80 translate-x-0" : "w-80 -translate-x-full md:w-0 md:-translate-x-full md:border-none"}
      `}>
        <div className="p-4 border-b border-border flex justify-between items-start">
          <div>
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Users size={18} className="text-primary"/> 
              Daftar Jemaat
            </h2>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Pilih jemaat untuk dimasukkan ke dalam kanvas struktur.
            </p>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 text-text-muted hover:bg-secondary/20 rounded-md"
          >
            <X size={18} />
          </button>
        </div>
          
        <div className="p-4 pt-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
            <input
              type="text"
              placeholder="Cari nama..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:border-primary text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
          {isLoadingMembers ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-text-muted" /></div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center text-xs text-text-muted py-10">Tidak ada jemaat.</div>
          ) : (
            filteredMembers.map((m) => {
              const isAdded = nodes.some(n => n.id === m.memberId);
              return (
                <div key={m.memberId} className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-foreground truncate">{m.name}</p>
                    <p className="text-[10px] text-text-muted uppercase">{m.role || "MEMBER"}</p>
                  </div>
                  <button
                    onClick={() => addMemberToCanvas(m)}
                    disabled={isAdded}
                    className={`p-1.5 rounded-md transition-colors ${
                      isAdded 
                      ? "bg-border/50 text-text-muted cursor-not-allowed" 
                      : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col relative w-full h-full">
        <header className="absolute top-4 left-4 z-10 flex items-center gap-2 p-1.5 bg-background/90 backdrop-blur-md border border-border rounded-xl shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-text-muted hover:text-foreground hover:bg-secondary/20 rounded-lg transition-colors"
          >
            <PanelLeft size={16} />
          </button>
          <div className="w-px h-5 bg-border mx-1"></div>
          <button
            onClick={onLayout}
            className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-secondary-foreground hover:bg-secondary/20 rounded-lg transition-colors"
          >
            <LayoutTemplate size={14} />
            <span className="hidden sm:inline">Auto Layout</span>
          </button>
          <button
            onClick={handleSaveStructure}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span className="hidden sm:inline">Simpan</span>
          </button>
        </header>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView={true}
          colorMode={resolvedTheme === "dark" ? "dark" : "light"}
          className="bg-bg-alt/20"
        >
          <Background 
            color={resolvedTheme === "dark" ? "#64748b" : "#94a3b8"} 
            gap={16} 
            size={1.5} 
          />
          <Controls className="m-4 shadow-md rounded-md overflow-hidden border border-border bg-background" />
          <MiniMap 
            nodeColor={resolvedTheme === "dark" ? "#3b82f6" : "#2563eb"}
            maskColor={resolvedTheme === "dark" ? "rgba(15, 23, 42, 0.8)" : "rgba(241, 245, 249, 0.8)"}
            style={{ backgroundColor: resolvedTheme === "dark" ? "#0f172a" : "#f1f5f9" }}
            className="m-4 shadow-md rounded-md overflow-hidden border border-border"
          />
        </ReactFlow>
      </div>
    </div>
  );
}