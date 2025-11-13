import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { Send, Trash2, History } from "lucide-react";

interface Space {
  id: string;
  title: string;
}

interface MessageComposerProps {
  botToken: string;
  selectedSpaceId: string;
  onSelectSpace: (id: string) => void;
  spaces: Space[];
}

interface SentMessage {
  id: string;
  spaceId: string;
  text: string;
  createdAt: string;
}

export function MessageComposer({
  botToken,
  selectedSpaceId,
  onSelectSpace,
  spaces,
}: MessageComposerProps) {
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentMessage[]>([]);

  const hasConfig = !!botToken && !!selectedSpaceId;

  const handleSend = async () => {
    if (!botToken) {
      toast.error("Please set your bot token in the Settings tab.");
      return;
    }
    if (!selectedSpaceId) {
      toast.error("Please select a space first.");
      return;
    }
    if (!messageText.trim()) {
      toast.error("Please enter a message.");
      return;
    }

    setSending(true);
    try {
      const resp = await fetch("https://webexapis.com/v1/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roomId: selectedSpaceId,
          text: messageText.trim(),
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || resp.statusText || "Failed to send message");
      }

      toast.success(`Message sent! (id: ${data.id})`);

      const entry: SentMessage = {
        id: data.id,
        spaceId: selectedSpaceId,
        text: messageText.trim(),
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, 5); // keep last 5
      });

      // Optional: clear text after send
      setMessageText("");
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to send message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSending(false);
    }
  };

  const deleteMessageById = async (id: string) => {
    if (!botToken) {
      toast.error("Please set your bot token in the Settings tab.");
      return;
    }
    if (!id) {
      toast.error("Missing message ID.");
      return;
    }

    try {
      const resp = await fetch(`https://webexapis.com/v1/messages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${botToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(text || resp.statusText || "Failed to delete message");
      }

      toast.success(`Deleted message ${id}`);
      setHistory((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to delete message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleDeleteLast = async () => {
    if (!history.length) {
      toast.error("No messages in history.");
      return;
    }
    const last = history[0];
    await deleteMessageById(last.id);
  };

  return (
    <Card className="border-pink-500/20 bg-slate-900/70 backdrop-blur shadow-lg shadow-pink-500/10 h-full">
      <CardHeader>
        <CardTitle className="text-white">Compose message</CardTitle>
        <CardDescription className="text-slate-300">
          Select a space, type your message, and send it as the bot.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Space selection */}
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end">
          <div className="space-y-2">
            <Label className="text-slate-200">Target space</Label>
            <Select
              value={selectedSpaceId || ""}
              onValueChange={(value) => onSelectSpace(value)}
            >
              <SelectTrigger className="bg-slate-900/70 border-slate-700 text-slate-100">
                <SelectValue
                  placeholder={
                    spaces.length
                      ? "Choose a space"
                      : "No spaces loaded yet (use Spaces tab)"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                {spaces.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.title || space.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!hasConfig && (
            <Alert className="bg-slate-900/80 border-slate-700 text-slate-100">
              <AlertDescription className="text-xs">
                Configure your bot token in <strong>Settings</strong> and select a space above
                before sending messages.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Message input */}
        <div className="space-y-2">
          <Label className="text-slate-200">Message text</Label>
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="min-h-[120px] bg-slate-950/80 border-slate-700 text-slate-100"
            placeholder="Hello team! 👋"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <Button
            onClick={handleSend}
            disabled={sending || !hasConfig}
            className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2"
          >
            <Send className="size-4" />
            {sending ? "Sending…" : "Send message"}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={!history.length || !botToken}
              onClick={handleDeleteLast}
              className="border-pink-500/40 text-pink-200 hover:bg-pink-500/10 flex items-center gap-1"
            >
              <Trash2 className="size-4" />
              Delete last sent
            </Button>
          </div>
        </div>

        {/* History */}
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="flex items-center gap-2">
            <History className="size-4 text-pink-300" />
            <span className="text-sm font-medium text-slate-100">
              Sent message history (last {history.length || 0})
            </span>
          </div>
          <ScrollArea className="h-[150px]">
            <div className="space-y-2 mt-2">
              {history.map((m) => (
                <div
                  key={m.id}
                  className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-400 truncate">
                      {m.id}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-300 hover:text-red-400"
                      onClick={() => deleteMessageById(m.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="line-clamp-2 text-[11px] text-slate-100">
                    {m.text}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}

              {!history.length && (
                <p className="text-xs text-slate-400">
                  No messages sent yet in this session.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}