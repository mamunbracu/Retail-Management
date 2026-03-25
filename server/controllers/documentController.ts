import { supabase } from "../config/supabase.js";
import crypto from "crypto";
import { emitNotification } from "../services/notificationService.js";

export const getDocuments = async (req: any, res: any) => {
  const { data, error } = await supabase.from("documents").select("id, name, type, uploaded_by, uploaded_at, received_date, file_type, file_size").order("uploaded_at", { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  const formatted = (data || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    url: `/api/documents/${d.id}/content`,
    uploadedAt: d.uploaded_at,
    uploadedBy: d.uploaded_by,
    receivedDate: d.received_date,
    fileType: d.file_type,
    fileSize: d.file_size
  }));
  res.json(formatted);
};

export const getDocumentContent = async (req: any, res: any) => {
  const { id } = req.params;
  const { data, error } = await supabase.from("documents").select("url, name, file_type").eq("id", id).single();
  
  if (error || !data || !data.url) {
    return res.status(404).send("Document not found");
  }

  const dataUrl = data.url;
  const matches = dataUrl.match(/^data:([A-Za-z-+\/.]+);base64,(.+)$/);
  
  if (matches && matches.length === 3) {
    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    res.setHeader('Content-Type', contentType || data.file_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(data.name)}"`);
    return res.send(buffer);
  } else {
    // If it's a regular URL or blob URL, redirect
    return res.redirect(dataUrl);
  }
};

export const saveDocument = async (req: any, res: any) => {
  const { id, name, type, url, uploadedBy, uploadedAt, receivedDate, fileType, fileSize } = req.body;
  const { error } = await supabase.from("documents").upsert({
    id: id || crypto.randomUUID(),
    name,
    type,
    url,
    uploaded_by: uploadedBy,
    uploaded_at: uploadedAt || new Date().toISOString(),
    received_date: receivedDate,
    file_type: fileType,
    file_size: fileSize
  });
  if (error) return res.status(500).json({ error: error.message });

  await emitNotification(`New document uploaded: ${name}`, 'document');

  res.json({ success: true });
};

export const deleteDocument = async (req: any, res: any) => {
  const { error } = await supabase.from("documents").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
};
