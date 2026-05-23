import { useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";

interface Props {
  artifactId: number;
  sessionId: string;
  onClose: () => void;
}

export default function IntimateCollaborate({
  artifactId,
  sessionId,
  onClose,
}: Props) {
  const [threadId, setThreadId] = useState<number | null>(null);
  const [disclosed, setDisclosed] = useState(false);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initiate = trpc.intimate.initiate.useMutation();
  const sendMessage = trpc.intimate.send.useMutation();

  const { data: messages, refetch } = trpc.intimate.messages.useQuery(
    { threadId: threadId ?? 0, sessionId },
    { enabled: !!threadId && disclosed, refetchInterval: 3000 }
  );

  useEffect(() => {
    if (disclosed && !threadId) {
      initiate.mutateAsync({ artifactId, sessionId }).then((thread) => {
        if (thread) setThreadId(thread.id);
      });
    }
  }, [disclosed, threadId, artifactId, sessionId, initiate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!message.trim() || !threadId) return;
    const body = message.trim();
    setMessage("");
    await sendMessage.mutateAsync({ threadId, sessionId, body });
    refetch();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(0.04 0.01 280 / 0.88)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-md mx-4 animate-fade-in-up"
        style={{
          background: "oklch(0.07 0.01 280)",
          border: "1px solid oklch(0.20 0.06 295 / 0.4)",
          borderRadius: "2px",
          padding: "1.5rem",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="mb-4">
          <div
            className="animate-blink inline-block"
            style={{
              border: "1px solid oklch(0.35 0.10 295 / 0.6)",
              borderRadius: "1px",
              padding: "0.2rem 0.6rem",
              fontSize: "0.65rem",
              letterSpacing: "0.2em",
              color: "oklch(0.45 0.12 295)",
              userSelect: "none",
            }}
          >
            Frayed Thread
          </div>
        </div>

        {!disclosed ? (
          <div className="flex-1 flex flex-col justify-center">
            <p
              className="text-sm leading-relaxed mb-8"
              style={{
                color: "oklch(0.42 0.10 295)",
                fontWeight: 300,
                lineHeight: 1.9,
              }}
            >
              This conversation exists only while both browsers hold it.
              <br />
              <br />
              When either clears, it is gone.
              <br />
              <br />
              That is not a limitation. That is the design.
            </p>
            <div className="flex gap-6">
              <button
                onClick={() => setDisclosed(true)}
                className="text-xs tracking-widest"
                style={{
                  background: "none",
                  border: "none",
                  color: "oklch(0.50 0.14 295)",
                  letterSpacing: "0.2em",
                }}
              >
                enter
              </button>
              <button
                onClick={onClose}
                className="text-xs tracking-widest"
                style={{
                  background: "none",
                  border: "none",
                  color: "oklch(0.30 0.06 295)",
                  letterSpacing: "0.2em",
                }}
              >
                leave
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              className="flex-1 overflow-y-auto mb-4 space-y-3"
              style={{ minHeight: "200px", maxHeight: "calc(80vh - 160px)" }}
            >
              {!messages || messages.length === 0 ? (
                <p
                  className="text-xs"
                  style={{
                    color: "oklch(0.28 0.06 295)",
                    letterSpacing: "0.1em",
                  }}
                >
                  waiting
                </p>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="text-sm leading-relaxed"
                    style={{
                      color:
                        msg.sessionId === sessionId
                          ? "oklch(0.70 0.08 295)"
                          : "oklch(0.55 0.12 295)",
                      fontWeight: 300,
                      textAlign:
                        msg.sessionId === sessionId ? "right" : "left",
                    }}
                  >
                    {msg.body}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="flex gap-3 items-end">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={2}
                className="flex-1 resize-none outline-none text-sm"
                style={{
                  background: "none",
                  border: "none",
                  borderBottom: "1px solid oklch(0.20 0.05 295 / 0.4)",
                  color: "oklch(0.75 0.05 295)",
                  fontWeight: 300,
                  caretColor: "oklch(0.55 0.16 295)",
                  padding: "0.2rem 0",
                }}
              />
              <button
                onClick={handleSend}
                disabled={!message.trim()}
                className="text-xs tracking-widest"
                style={{
                  background: "none",
                  border: "none",
                  color: message.trim()
                    ? "oklch(0.50 0.14 295)"
                    : "oklch(0.25 0.05 295)",
                  letterSpacing: "0.15em",
                  paddingBottom: "0.2rem",
                }}
              >
                →
              </button>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="absolute top-3 right-3"
          style={{
            background: "none",
            border: "none",
            color: "oklch(0.62 0.16 295)",
            fontSize: "1rem",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
