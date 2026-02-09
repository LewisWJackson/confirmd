import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchStories,
  fetchClaims,
  fetchSources,
  adminUpdateStory,
  adminDeleteStory,
  adminUpdateClaim,
  adminDeleteClaim,
  adminUpdateSource,
  adminTriggerPipeline,
} from "../lib/api";

type Tab = "stories" | "claims" | "sources" | "pipeline";

function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("stories");

  const tabs: { key: Tab; label: string }[] = [
    { key: "stories", label: "Stories" },
    { key: "claims", label: "Claims" },
    { key: "sources", label: "Sources" },
    { key: "pipeline", label: "Pipeline" },
  ];

  return (
    <div className="min-h-screen bg-surface-primary">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        <h1 className="text-3xl font-black text-content-primary tracking-tight mb-6">
          Admin Dashboard
        </h1>

        {/* Tab bar */}
        <div className="flex items-center gap-0 border-b border-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors border-b-2 -mb-[1px] ${
                activeTab === tab.key
                  ? "border-accent text-accent"
                  : "border-transparent text-content-muted hover:text-content-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "stories" && <StoriesTab />}
        {activeTab === "claims" && <ClaimsTab />}
        {activeTab === "sources" && <SourcesTab />}
        {activeTab === "pipeline" && <PipelineTab />}
      </div>
    </div>
  );
}

// ─── Stories Tab ───────────────────────────────────────────────────

function StoriesTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: () => fetchStories(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      adminUpdateStory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteStory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  const startEdit = (story: any) => {
    setEditingId(story.id);
    setEditForm({
      title: story.title,
      summary: story.summary || "",
      category: story.category || "",
      assetSymbols: (story.assetSymbols || []).join(", "),
    });
  };

  if (isLoading) {
    return <div className="text-content-muted text-sm">Loading stories...</div>;
  }

  return (
    <div className="space-y-2">
      {stories.map((story: any) => (
        <div
          key={story.id}
          className="rounded-lg border border-border bg-surface-card p-4"
        >
          {editingId === story.id ? (
            <div className="space-y-3">
              <input
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                placeholder="Title"
              />
              <textarea
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                value={editForm.summary}
                onChange={(e) =>
                  setEditForm({ ...editForm, summary: e.target.value })
                }
                placeholder="Summary"
                rows={2}
              />
              <div className="flex gap-3">
                <input
                  className="flex-1 bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                  placeholder="Category"
                />
                <input
                  className="flex-1 bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                  value={editForm.assetSymbols}
                  onChange={(e) =>
                    setEditForm({ ...editForm, assetSymbols: e.target.value })
                  }
                  placeholder="Assets (comma separated)"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: story.id,
                      data: {
                        title: editForm.title,
                        summary: editForm.summary || null,
                        category: editForm.category || null,
                        assetSymbols: editForm.assetSymbols
                          ? editForm.assetSymbols.split(",").map((s: string) => s.trim()).filter(Boolean)
                          : [],
                      },
                    })
                  }
                  className="px-4 py-1.5 bg-accent text-accent-text text-xs font-bold rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-1.5 bg-surface-secondary text-content-secondary text-xs font-bold rounded-lg border border-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-content-primary truncate">
                  {story.title}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  {story.category && (
                    <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                      {story.category}
                    </span>
                  )}
                  {(story.assetSymbols || []).map((s: string) => (
                    <span
                      key={s}
                      className="text-[10px] font-bold text-content-muted uppercase"
                    >
                      {s}
                    </span>
                  ))}
                  <span className="text-[10px] text-content-muted">
                    {story.claimCount || 0} claims
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(story)}
                  className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg hover:bg-accent/20 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this story?")) {
                      deleteMutation.mutate(story.id);
                    }
                  }}
                  className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {stories.length === 0 && (
        <p className="text-sm text-content-muted text-center py-8">
          No stories found.
        </p>
      )}
    </div>
  );
}

// ─── Claims Tab ───────────────────────────────────────────────────

function ClaimsTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ["claims"],
    queryFn: () => fetchClaims(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      adminUpdateClaim(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminDeleteClaim(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["claims"] });
    },
  });

  const startEdit = (claim: any) => {
    setEditingId(claim.id);
    setEditForm({
      claimText: claim.claimText,
      claimType: claim.claimType,
      status: claim.status,
      assetSymbols: (claim.assetSymbols || []).join(", "),
    });
  };

  if (isLoading) {
    return <div className="text-content-muted text-sm">Loading claims...</div>;
  }

  return (
    <div className="space-y-2">
      {claims.map((claim: any) => (
        <div
          key={claim.id}
          className="rounded-lg border border-border bg-surface-card p-4"
        >
          {editingId === claim.id ? (
            <div className="space-y-3">
              <textarea
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                value={editForm.claimText}
                onChange={(e) =>
                  setEditForm({ ...editForm, claimText: e.target.value })
                }
                rows={2}
              />
              <div className="flex gap-3">
                <input
                  className="flex-1 bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                  value={editForm.claimType}
                  onChange={(e) =>
                    setEditForm({ ...editForm, claimType: e.target.value })
                  }
                  placeholder="Claim type"
                />
                <select
                  className="flex-1 bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value })
                  }
                >
                  <option value="unreviewed">Unreviewed</option>
                  <option value="needs_evidence">Needs Evidence</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <input
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                value={editForm.assetSymbols}
                onChange={(e) =>
                  setEditForm({ ...editForm, assetSymbols: e.target.value })
                }
                placeholder="Assets (comma separated)"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: claim.id,
                      data: {
                        claimText: editForm.claimText,
                        claimType: editForm.claimType,
                        status: editForm.status,
                        assetSymbols: editForm.assetSymbols
                          ? editForm.assetSymbols.split(",").map((s: string) => s.trim()).filter(Boolean)
                          : [],
                      },
                    })
                  }
                  className="px-4 py-1.5 bg-accent text-accent-text text-xs font-bold rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-1.5 bg-surface-secondary text-content-secondary text-xs font-bold rounded-lg border border-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-content-primary line-clamp-1">
                  {claim.claimText}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      claim.verdict?.verdictLabel === "verified"
                        ? "bg-factuality-high/10 text-factuality-high"
                        : claim.verdict?.verdictLabel === "misleading"
                        ? "bg-factuality-low/10 text-factuality-low"
                        : "bg-factuality-mixed/10 text-factuality-mixed"
                    }`}
                  >
                    {claim.verdict?.verdictLabel || "unreviewed"}
                  </span>
                  <span className="text-[10px] text-content-muted">
                    {claim.status}
                  </span>
                  {(claim.assetSymbols || []).map((s: string) => (
                    <span
                      key={s}
                      className="text-[10px] font-bold text-content-muted uppercase"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => startEdit(claim)}
                  className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg hover:bg-accent/20 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (confirm("Delete this claim and all related data?")) {
                      deleteMutation.mutate(claim.id);
                    }
                  }}
                  className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-bold rounded-lg hover:bg-red-500/20 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      {claims.length === 0 && (
        <p className="text-sm text-content-muted text-center py-8">
          No claims found.
        </p>
      )}
    </div>
  );
}

// ─── Sources Tab ──────────────────────────────────────────────────

function SourcesTab() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ["sources"],
    queryFn: () => fetchSources(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, any> }) =>
      adminUpdateSource(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setEditingId(null);
    },
  });

  const startEdit = (source: any) => {
    setEditingId(source.id);
    setEditForm({
      displayName: source.displayName,
      logoUrl: source.logoUrl || "",
    });
  };

  if (isLoading) {
    return <div className="text-content-muted text-sm">Loading sources...</div>;
  }

  return (
    <div className="space-y-2">
      {sources.map((source: any) => (
        <div
          key={source.id}
          className="rounded-lg border border-border bg-surface-card p-4"
        >
          {editingId === source.id ? (
            <div className="space-y-3">
              <input
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                value={editForm.displayName}
                onChange={(e) =>
                  setEditForm({ ...editForm, displayName: e.target.value })
                }
                placeholder="Display Name"
              />
              <input
                className="w-full bg-surface-secondary border border-border rounded-lg px-3 py-2 text-sm text-content-primary"
                value={editForm.logoUrl}
                onChange={(e) =>
                  setEditForm({ ...editForm, logoUrl: e.target.value })
                }
                placeholder="Logo URL"
              />
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: source.id,
                      data: {
                        displayName: editForm.displayName,
                        logoUrl: editForm.logoUrl || null,
                      },
                    })
                  }
                  className="px-4 py-1.5 bg-accent text-accent-text text-xs font-bold rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-1.5 bg-surface-secondary text-content-secondary text-xs font-bold rounded-lg border border-border"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {source.logoUrl ? (
                  <img
                    src={source.logoUrl}
                    alt={source.displayName}
                    className="w-8 h-8 rounded-lg object-contain border border-border bg-surface-secondary p-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent font-black text-xs">
                    {source.logo || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-content-primary">
                    {source.displayName}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-content-muted">
                      {source.type}
                    </span>
                    <span className="text-[10px] text-content-muted">
                      {source.handleOrDomain}
                    </span>
                    {source.score?.trackRecord != null && (
                      <span className="text-[10px] font-bold text-content-secondary">
                        {source.score.trackRecord}% track record
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => startEdit(source)}
                className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-lg hover:bg-accent/20 transition-colors flex-shrink-0"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      ))}
      {sources.length === 0 && (
        <p className="text-sm text-content-muted text-center py-8">
          No sources found.
        </p>
      )}
    </div>
  );
}

// ─── Pipeline Tab ─────────────────────────────────────────────────

function PipelineTab() {
  const [status, setStatus] = useState<string | null>(null);

  const runMutation = useMutation({
    mutationFn: () => adminTriggerPipeline(),
    onSuccess: () => setStatus("Pipeline run started successfully."),
    onError: (err: Error) => setStatus(`Error: ${err.message}`),
  });

  return (
    <div className="rounded-lg border border-border bg-surface-card p-6">
      <h3 className="text-sm font-bold text-content-primary mb-4">
        Pipeline Control
      </h3>
      <p className="text-[12px] text-content-secondary mb-4">
        Trigger a manual pipeline run to ingest new articles, extract claims,
        gather evidence, and generate verdicts.
      </p>
      <button
        onClick={() => runMutation.mutate()}
        disabled={runMutation.isPending}
        className="px-5 py-2 bg-accent text-accent-text text-xs font-bold rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
      >
        {runMutation.isPending ? "Starting..." : "Run Pipeline"}
      </button>
      {status && (
        <p
          className={`mt-4 text-xs font-medium ${
            status.startsWith("Error")
              ? "text-red-400"
              : "text-factuality-high"
          }`}
        >
          {status}
        </p>
      )}
    </div>
  );
}

export default AdminPage;
