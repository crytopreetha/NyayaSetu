import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Lock, RefreshCw, ShieldCheck,
  AlertCircle, MessageSquare
} from 'lucide-react';
import { messageApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { DEMO_MESSAGES } from '../lib/mockData';

interface CaseMessagingThreadProps {
  caseId: string;
  caseNumber: string;
  assignedLawyerName?: string | null;
  citizenName?: string | null;
  isLawyerAssigned: boolean;
}

export const CaseMessagingThread: React.FC<CaseMessagingThreadProps> = ({
  caseId,
  caseNumber,
  assignedLawyerName,
  citizenName,
  isLawyerAssigned,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    if (caseId.startsWith('demo-')) {
      setMessages(DEMO_MESSAGES);
      setLoading(false);
      return;
    }

    try {
      const data = await messageApi.listByCase(caseId);
      setMessages(data || []);
      setError(null);
    } catch (err: any) {
      // If 403 or network, handle gracefully
      if (err?.status === 403) {
        setError('You do not have access to this confidential case conversation.');
      } else {
        console.warn('Could not fetch messages:', err);
        setMessages(DEMO_MESSAGES);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [caseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Optimistic message
    const tempMsg = {
      id: `temp-${Date.now()}`,
      case_id: caseId,
      sender_id: user?.id || 'me',
      sender_name: user?.fullName || (user?.role === 'LAWYER' ? 'Advocate' : 'Citizen'),
      sender_role: user?.role || 'CITIZEN',
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      if (!caseId.startsWith('demo-')) {
        await messageApi.send(caseId, content);
      }
      await fetchMessages();
    } catch (err: any) {
      setError(err?.message || 'Failed to deliver message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col h-[520px] overflow-hidden">
      {/* ── Thread Header ─────────────────────────────────────────────────── */}
      <div className="bg-slate-50/90 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-900">
                Case Message Thread
              </h3>
              <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                {caseNumber}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {assignedLawyerName ? `Adv. ${assignedLawyerName} & ${citizenName || 'Citizen'}` : 'Case Advisory Channel'}
            </p>
          </div>
        </div>

        {/* Confidential Privacy Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
          <Lock className="w-3 h-3 text-emerald-600" />
          <span>Restricted Channel</span>
        </div>
      </div>

      {/* ── Channel Privacy Callout ────────────────────────────────────────── */}
      <div className="bg-amber-50/60 border-b border-amber-200/50 px-5 py-2 flex items-center gap-2 text-[11px] text-amber-900">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span>
          Privileged advocate-client communications. Accessible only to verified case parties.
        </span>
      </div>

      {/* ── Message Bubble Stream ─────────────────────────────────────────── */}
      <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-slate-50/40">
        {loading && messages.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-xs">Loading secure thread...</span>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="py-12 text-center space-y-1">
            <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700">No messages exchanged yet</p>
            <p className="text-[11px] text-slate-400">
              {isLawyerAssigned
                ? 'Send a question, procedural clarification, or update to your advocate.'
                : 'Connect with an advocate to start collaborating on this matter.'}
            </p>
          </div>
        )}

        {messages.map((m, idx) => {
          const isSenderMe =
            m.sender_id === user?.id ||
            m.senderId === user?.id ||
            (user?.role === 'CITIZEN' && (m.sender_role === 'CITIZEN' || m.senderRole === 'CITIZEN')) ||
            (user?.role === 'LAWYER' && (m.sender_role === 'LAWYER' || m.senderRole === 'LAWYER'));

          const senderName = m.sender_name || m.senderName || (m.sender_role === 'LAWYER' ? 'Advocate' : 'Citizen');
          const isLawyer = (m.sender_role || m.senderRole) === 'LAWYER';

          return (
            <div
              key={m.id || idx}
              className={`flex flex-col ${isSenderMe ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1.5 mb-1 px-1">
                <span className="text-[10px] font-bold text-slate-600">
                  {senderName}
                </span>
                <span
                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                    isLawyer
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {isLawyer ? 'Advocate' : 'Citizen'}
                </span>
                <span className="text-[9px] text-slate-400">
                  {m.created_at || m.createdAt ? new Date(m.created_at || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>

              <div
                className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                  isSenderMe
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-900 border border-slate-200 rounded-tl-none'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Box ──────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          placeholder={
            isLawyerAssigned
              ? 'Type a secure message to your advocate or citizen...'
              : 'Type message (connect with advocate for direct representation)...'
          }
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 focus:ring-2 focus:ring-brand-500 focus:outline-none bg-slate-50/50"
        />

        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          className="p-2.5 bg-brand-600 text-white hover:bg-brand-700 rounded-xl transition-all shadow-sm disabled:opacity-40"
          title="Send message"
        >
          {sending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
};
