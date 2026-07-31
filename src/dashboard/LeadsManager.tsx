import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Search, Wifi, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../context/ThemeContext.types";
import { supabase } from "../supabase/client";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import ConfirmDialog from "../components/common/ConfirmDialog";
import AdminPageHeader from "./components/AdminPageHeader";

type LeadStatus = "New" | "Contacted" | "Qualified" | "Converted" | "Lost";

type Lead = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company_name: string | null;
  country: string | null;
  website_url: string | null;
  service_required: string | null;
  budget_range: string | null;
  project_timeline: string | null;
  business_type: string | null;
  project_description: string | null;
  selected_services: string[] | null;
  message: string;
  created_at: string;
  status: "New" | "Read";
  lead_status: LeadStatus;
};

export default function LeadsManager() {
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebouncedValue(query, 250);
  const [statusFilter, setStatusFilter] = useState<"All" | LeadStatus>("All");
  const [readFilter, setReadFilter] = useState<"All" | "New" | "Read">("All");
  const [viewingLead, setViewingLead] = useState<Lead | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);

  async function fetchLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLeads(data as Lead[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const channel = supabase
      .channel("leads_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contact_messages" },
        () => {
          void fetchLeads();
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function updateLeadStatus(id: string, leadStatus: LeadStatus) {
    setUpdatingId(id);
    const { error } = await supabase
      .from("contact_messages")
      .update({ lead_status: leadStatus })
      .eq("id", id);

    if (error) {
      toast.error("Unable to update lead status.");
    } else {
      setLeads((current) => current.map((l) => (l.id === id ? { ...l, lead_status: leadStatus } : l)));
      toast.success("Lead status updated.");
    }
    setUpdatingId(null);
  }

  async function markAsRead(id: string) {
    if (updatingId) return;
    setUpdatingId(id);
    const { error } = await supabase
      .from("contact_messages")
      .update({ status: "read" })
      .eq("id", id);

    if (error) {
      toast.error("Unable to mark as read.");
    } else {
      setLeads((current) => current.map((l) => (l.id === id ? { ...l, status: "Read" } : l)));
    }
    setUpdatingId(null);
  }

  async function deleteLead(id: string) {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!deleteTargetId) return;
    setDeleteConfirmOpen(false);
    setDeletingId(deleteTargetId);
    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", deleteTargetId);

    if (error) {
      toast.error("Unable to delete lead.");
    } else {
      setLeads((current) => current.filter((l) => l.id !== deleteTargetId));
      toast.success("Lead deleted.");
    }
    setDeletingId(null);
    setDeleteTargetId(null);
  }

  const filteredLeads = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    return leads.filter((lead) => {
      const matchesQuery =
        !normalizedQuery ||
        lead.full_name.toLowerCase().includes(normalizedQuery) ||
        lead.email.toLowerCase().includes(normalizedQuery) ||
        lead.message.toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "All" || lead.lead_status === statusFilter;
      const matchesRead = readFilter === "All" || lead.status === readFilter;
      return matchesQuery && matchesStatus && matchesRead;
    });
  }, [leads, debouncedQuery, statusFilter, readFilter]);

  function exportLeadsAsCsv() {
    if (filteredLeads.length === 0) {
      toast.error("No leads to export.");
      return;
    }
    const headers = ["Full Name", "Email", "Phone", "Company", "Service", "Budget", "Lead Status", "Date", "Message"];
    const csvRows = filteredLeads.map((lead) => [
      lead.full_name,
      lead.email,
      lead.phone || "",
      lead.company_name || "",
      lead.service_required || "",
      lead.budget_range || "",
      lead.lead_status,
      new Date(lead.created_at).toLocaleDateString(),
      lead.message,
    ]);
    const csvContent = [headers, ...csvRows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "leads-export.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    toast.success("Leads exported successfully.");
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Leads"
        subtitle="Manage qualified leads from the contact form."
        extra={
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap md:w-auto md:max-w-3xl md:flex-nowrap md:items-center">
            <div className={`flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold ${isLive ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600" : "border-slate-300/40 bg-slate-500/10 text-slate-500"}`}>
              <Wifi size={12} className={isLive ? "animate-pulse" : ""} />
              {isLive ? "Live" : "Connecting..."}
            </div>
            <div className="relative w-full sm:flex-1 sm:min-w-[180px] md:max-w-sm">
              <Search size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`} />
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, email or message" className={`w-full rounded-xl border py-2.5 pl-10 pr-3 outline-none transition ${isDarkTheme ? "border-white/10 bg-slate-950 text-white placeholder:text-slate-500 focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-500 focus:border-violet-500"}`} />
            </div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "All" | LeadStatus)} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition sm:w-auto sm:min-w-[130px] md:w-40 ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}>
              <option value="All">All Status</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Lost">Lost</option>
            </select>
            <select value={readFilter} onChange={(e) => setReadFilter(e.target.value as "All" | "New" | "Read")} className={`w-full rounded-xl border px-3 py-2.5 outline-none transition sm:w-auto sm:min-w-[130px] md:w-36 ${isDarkTheme ? "border-white/10 bg-slate-950 text-white focus:border-violet-500" : "border-slate-200 bg-slate-50 text-slate-900 focus:border-violet-500"}`}>
              <option value="All">All</option>
              <option value="New">New</option>
              <option value="Read">Read</option>
            </select>
            <button type="button" onClick={exportLeadsAsCsv} className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${isDarkTheme ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-600 text-white hover:bg-violet-500"}`}>
              <Download size={14} className="mr-1 inline" /> Export CSV
            </button>
          </div>
        }
      />

      <div className={`overflow-hidden rounded-2xl border shadow-sm transition-colors duration-300 ${isDarkTheme ? "border-white/10 bg-slate-900/70" : "border-slate-200 bg-white"}`}>
        <div className="hidden overflow-x-auto md:block">
          {loading ? (
            <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading leads...</div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className={isDarkTheme ? "bg-slate-950/80 text-slate-300" : "bg-slate-50 text-slate-700"}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Service</th>
                  <th className="px-4 py-3 font-semibold">Budget</th>
                  <th className="px-4 py-3 font-semibold">Lead Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className={`border-t ${isDarkTheme ? "border-white/10 text-slate-200" : "border-slate-200 text-slate-700"}`}>
                    <td className="max-w-[180px] truncate px-4 py-3 font-medium">{lead.full_name}</td>
                    <td className="max-w-[220px] truncate px-4 py-3">{lead.email}</td>
                    <td className="max-w-[160px] truncate px-4 py-3">{lead.service_required || "-"}</td>
                    <td className="max-w-[140px] truncate px-4 py-3">{lead.budget_range || "-"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-semibold ${lead.lead_status === "Converted" ? "bg-emerald-500/15 text-emerald-500" : lead.lead_status === "Qualified" ? "bg-violet-500/15 text-violet-500" : lead.lead_status === "Lost" ? "bg-rose-500/15 text-rose-500" : lead.lead_status === "Contacted" ? "bg-amber-500/15 text-amber-500" : "bg-slate-500/15 text-slate-500"}`}>{lead.lead_status}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{new Date(lead.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center">
                        <button type="button" onClick={() => setViewingLead(lead)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}><Eye size={14} />View</button>
                        <button type="button" onClick={() => { if (lead.status === "New") void markAsRead(lead.id); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${lead.status === "New" ? (isDarkTheme ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25" : "bg-amber-100 text-amber-700 hover:bg-amber-200") : (isDarkTheme ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700")}`}>{lead.status === "New" ? "Mark Read" : "Read"}</button>
                        <button type="button" onClick={() => { void deleteLead(lead.id); }} disabled={deletingId === lead.id} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"}`}>{deletingId === lead.id ? "Deleting..." : "Delete"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="divide-y md:hidden">
          {loading ? (
            <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>Loading leads...</div>
          ) : (
            filteredLeads.map((lead) => (
              <div key={lead.id} className={`px-4 py-4 ${isDarkTheme ? "text-slate-200" : "text-slate-700"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{lead.full_name}</p>
                    <p className={`mt-0.5 break-words text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{lead.email}</p>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold ${lead.lead_status === "Converted" ? "bg-emerald-500/15 text-emerald-500" : lead.lead_status === "Qualified" ? "bg-violet-500/15 text-violet-500" : lead.lead_status === "Lost" ? "bg-rose-500/15 text-rose-500" : lead.lead_status === "Contacted" ? "bg-amber-500/15 text-amber-500" : "bg-slate-500/15 text-slate-500"}`}>{lead.lead_status}</span>
                </div>
                <div className={`mt-2 space-y-0.5 text-xs ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>
                  {lead.service_required && <p className="truncate">Service: {lead.service_required}</p>}
                  {lead.budget_range && <p className="truncate">Budget: {lead.budget_range}</p>}
                </div>
                <p className={`mt-1 text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>{new Date(lead.created_at).toLocaleDateString()}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setViewingLead(lead)} className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}><Eye size={14} />View</button>
                  <button type="button" onClick={() => { if (lead.status === "New") void markAsRead(lead.id); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${lead.status === "New" ? (isDarkTheme ? "bg-amber-500/15 text-amber-300 hover:bg-amber-500/25" : "bg-amber-100 text-amber-700 hover:bg-amber-200") : (isDarkTheme ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-100 text-emerald-700")}`}>{lead.status === "New" ? "Mark Read" : "Read"}</button>
                  <button type="button" onClick={() => { void deleteLead(lead.id); }} disabled={deletingId === lead.id} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:opacity-40 ${isDarkTheme ? "bg-rose-500/15 text-rose-300 hover:bg-rose-500/25" : "bg-rose-100 text-rose-700 hover:bg-rose-200"}`}>{deletingId === lead.id ? "Deleting..." : "Delete"}</button>
                </div>
              </div>
            ))
          )}
        </div>
        {!loading && filteredLeads.length === 0 && (
          <div className={`px-4 py-10 text-center text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-600"}`}>No leads found.</div>
        )}
      </div>

      {viewingLead && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 px-4 py-8 sm:items-center">
          <div className={`max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border p-4 shadow-2xl sm:p-6 ${isDarkTheme ? "border-white/10 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-900"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold">{viewingLead.full_name}</h2>
                <p className={`mt-1 text-sm ${isDarkTheme ? "text-slate-400" : "text-slate-500"}`}>{viewingLead.email}</p>
                <p className={`text-xs ${isDarkTheme ? "text-slate-500" : "text-slate-400"}`}>{new Date(viewingLead.created_at).toLocaleString()}</p>
              </div>
              <button type="button" onClick={() => setViewingLead(null)} className={`rounded-xl p-1.5 transition ${isDarkTheme ? "text-slate-400 hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"}`}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              {viewingLead.phone && <div><span className="font-semibold">Phone:</span> <span className={isDarkTheme ? "text-slate-300" : "text-slate-600"}>{viewingLead.phone}</span></div>}
              {viewingLead.company_name && <div><span className="font-semibold">Company:</span> <span className={isDarkTheme ? "text-slate-300" : "text-slate-600"}>{viewingLead.company_name}</span></div>}
              {viewingLead.country && <div><span className="font-semibold">Country:</span> <span className={isDarkTheme ? "text-slate-300" : "text-slate-600"}>{viewingLead.country}</span></div>}
              {viewingLead.website_url && <div><span className="font-semibold">Website:</span> <a href={viewingLead.website_url} target="_blank" rel="noopener noreferrer" className="break-words text-violet-400">{viewingLead.website_url}</a></div>}
              {viewingLead.service_required && <div><span className="font-semibold">Service:</span> <span className={isDarkTheme ? "text-slate-300" : "text-slate-600"}>{viewingLead.service_required}</span></div>}
              {viewingLead.budget_range && <div><span className="font-semibold">Budget:</span> <span className={isDarkTheme ? "text-slate-300" : "text-slate-600"}>{viewingLead.budget_range}</span></div>}
              {viewingLead.project_timeline && <div><span className="font-semibold">Timeline:</span> <span className={isDarkTheme ? "text-slate-300" : "text-slate-600"}>{viewingLead.project_timeline}</span></div>}
              {viewingLead.business_type && <div><span className="font-semibold">Business:</span> <span className={isDarkTheme ? "text-slate-300" : "text-slate-600"}>{viewingLead.business_type}</span></div>}
            </div>
            {viewingLead.selected_services && viewingLead.selected_services.length > 0 && (
              <div className="text-sm"><span className="font-semibold">Selected Services:</span> <span className={isDarkTheme ? "text-slate-300" : "text-slate-600"}>{viewingLead.selected_services.join(", ")}</span></div>
            )}
            {viewingLead.project_description && (
              <div className="text-sm"><span className="font-semibold">Project Description:</span> <p className={`mt-1 whitespace-pre-wrap ${isDarkTheme ? "text-slate-300" : "text-slate-600"}`}>{viewingLead.project_description}</p></div>
            )}
            <div className={`whitespace-pre-wrap break-words rounded-xl border p-4 text-sm ${isDarkTheme ? "border-white/10 bg-slate-950 text-slate-200" : "border-slate-200 bg-slate-50 text-slate-700"}`}>{viewingLead.message}</div>
            <div className="flex flex-wrap gap-2">
              {(["New", "Contacted", "Qualified", "Converted", "Lost"] as LeadStatus[]).map((status) => (
                <button key={status} type="button" onClick={() => { void updateLeadStatus(viewingLead.id, status); setViewingLead((prev) => prev ? { ...prev, lead_status: status } : prev); }} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${viewingLead.lead_status === status ? "ring-2 ring-violet-500" : ""} ${isDarkTheme ? "bg-white/5 text-slate-200 hover:bg-white/10" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{status}</button>
              ))}
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { if (viewingLead.status === "New") void markAsRead(viewingLead.id); setViewingLead(null); }} className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${isDarkTheme ? "bg-violet-500 text-white hover:bg-violet-400" : "bg-violet-600 text-white hover:bg-violet-500"}`}>Close</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete lead"
        description={deleteTargetId ? `Delete "${leads.find(l => l.id === deleteTargetId)?.full_name ?? "this lead"}"?` : undefined}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={deletingId === deleteTargetId}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteTargetId(null);
        }}
      />
    </div>
  );
}
