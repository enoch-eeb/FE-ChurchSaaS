"use client";

import { useState, useEffect } from "react";
import { useLoaderStore } from "@/store/useLoaderStore";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  position: string;
}

export default function MemberDirectoryPage() {
  const { showLoader, hideLoader } = useLoaderStore();
  const [members, setMembers] = useState<Member[]>([]);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "", 
    role: "MEMBER",
    position: "", // Field baru
    password: "Gereja123!" 
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/members");
      const result = await res.json();
      if (result.success) setMembers(result.data);
    } catch (error) {
      setNotification({ type: "error", message: "Gagal memuat data." });
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleOpenAdd = () => {
    setModalMode("add");
    setFormData({ name: "", email: "", phone: "", role: "MEMBER", position: "", password: "Gereja123!" });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (member: Member) => {
    setModalMode("edit");
    setSelectedId(member.id);
    setFormData({ 
      name: member.name, 
      email: member.email, 
      phone: member.phone || "", 
      role: member.role || "MEMBER",
      position: member.position || "",
      password: "" 
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoader("Menyimpan...");
    
    try {
      const url = modalMode === "add" ? "/api/members" : `/api/members/${selectedId}`;
      const method = modalMode === "add" ? "POST" : "PUT";

      const payload = { ...formData };
      if (modalMode === "edit" && !payload.password) {
        delete (payload as any).password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (result.success) {
        setIsModalOpen(false);
        fetchMembers();
        setNotification({ type: "success", message: "Berhasil disimpan!" });
      } else {
        setNotification({ type: "error", message: result.message || "Gagal (Cek Role Anda)" });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Kesalahan sistem." });
    } finally {
      hideLoader();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus member ini?")) return;
    showLoader("Menghapus...");
    try {
      const res = await fetch(`/api/members/${id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        fetchMembers();
        setNotification({ type: "success", message: "Terhapus!" });
      }
    } catch (error) {
      setNotification({ type: "error", message: "Gagal menghapus." });
    } finally {
      hideLoader();
    }
  };

  return (
    <div className="p-8 md:p-12 max-w-6xl mx-auto space-y-6">
      
      {notification && (
        <div className={`fixed top-6 right-6 z-[99999] px-5 py-3 rounded-lg shadow-xl border animate-in fade-in slide-in-from-top-4 duration-300 ${notification.type === "success" ? "bg-green-900 border-green-500 text-green-100" : "bg-red-900 border-red-500 text-red-100"}`}>
          {notification.message}
        </div>
      )}

      <header className="flex justify-between items-center border-b border-border/60 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">Daftar Member</h1>
          <p className="text-text-muted text-sm">Manajemen jemaat dan pelayan gereja.</p>
        </div>
        <button onClick={handleOpenAdd} className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-bold hover:opacity-90 transition-all">
          + Tambah Member
        </button>
      </header>

      <div className="bg-bg-alt border border-border/60 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-foreground">
          <thead className="bg-secondary/20 text-text-muted border-b border-border/60 uppercase text-[10px] tracking-widest font-bold">
            <tr>
              <th className="px-6 py-4">Nama / Posisi</th>
              <th className="px-6 py-4">Kontak</th>
              <th className="px-6 py-4">Peran</th>
              <th className="px-6 py-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {members.map((m) => (
              <tr key={m.id} className="hover:bg-secondary/5 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold">{m.name}</div>
                  <div className="text-[10px] text-primary uppercase">{m.position || "Tidak ada posisi"}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-xs">{m.email}</div>
                  <div className="text-[10px] text-text-muted">{m.phone || "-"}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-[9px] font-black border border-primary/30 bg-primary/5 text-primary uppercase">
                    {m.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-4">
                  <button onClick={() => handleOpenEdit(m)} className="text-primary hover:text-white transition-colors font-bold text-xs uppercase tracking-tighter">Edit</button>
                  <button onClick={() => handleDelete(m.id)} className="text-red-500/70 hover:text-red-500 transition-colors font-bold text-xs uppercase tracking-tighter">Hapus</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-bg-alt border border-border/60 w-full max-w-md rounded-lg p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-primary mb-6 tracking-tight">
              {modalMode === "add" ? "Tambah Member" : "Edit Member"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Nama Lengkap" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="col-span-2 w-full p-2 bg-background border border-border rounded-md text-sm focus:border-primary outline-none" />
                <input placeholder="Jabatan/Posisi (cth: Diaken)" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} className="col-span-2 w-full p-2 bg-background border border-border rounded-md text-sm focus:border-primary outline-none" />
              </div>
              
              <input required type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 bg-background border border-border rounded-md text-sm focus:border-primary outline-none" />
              <input placeholder="Telepon" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 bg-background border border-border rounded-md text-sm focus:border-primary outline-none" />
              
              <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 bg-background border border-border rounded-md text-sm text-foreground focus:border-primary outline-none">
                <option value="MEMBER">Jemaat</option>
                <option value="VOLUNTEER">Pelayan / Volunteer</option>
                <option value="CHURCH_ADMIN">Admin Gereja</option>
                <option value="SUPER_ADMIN">Gembala</option>
              </select>

              <div className="flex justify-end gap-2 pt-4 border-t border-border/40">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-text-muted text-sm font-bold uppercase tracking-widest">Batal</button>
                <button type="submit" className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}