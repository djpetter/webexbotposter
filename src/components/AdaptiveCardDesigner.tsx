import React, { useEffect, useRef, useState } from "react";
import * as AdaptiveCards from "adaptivecards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import { ExternalLink, Send, Trash2, History } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";

interface Space {
  id: string;
  title: string;
}

interface AdaptiveCardDesignerProps {
  botToken: string;
  selectedSpaceId: string;
  spaces: Space[];
  onSelectSpace: (id: string) => void;
}

interface SentCard {
  id: string;
  spaceId: string;
  createdAt: string;
}

const STANDARD_CARD_TEMPLATE = `{
  "type": "AdaptiveCard",
  "version": "1.3",
  "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
  "body": [
    {
      "type": "ColumnSet",
      "columns": [
        {
          "type": "Column",
          "items": [
            {
              "type": "Image",
              "style": "Person",
              "url": "https://content.ciscodcloud.com/us/en/newsletter/logo/_jcr_content/root/container/container/image.coreimg.png/1761317410924/logo-blue-padding.png",
              "size": "Medium",
              "height": "50px"
            }
          ],
          "width": "auto"
        },
        {
          "type": "Column",
          "items": [
            {
              "type": "TextBlock",
              "weight": "Bolder",
              "text": "Last weeks Demo Releases",
              "horizontalAlignment": "Left",
              "wrap": true,
              "color": "Accent",
              "size": "Large",
              "spacing": "Small"
            }
          ],
          "width": "stretch"
        }
      ]
    },
    {
      "type": "Container",
      "items": [
        {
          "type": "TextBlock",
          "text": "Ready to Power Up Your Demo Repertoire?",
          "wrap": true,
          "horizontalAlignment": "Center",
          "weight": "Bolder"
        },
        {
          "type": "TextBlock",
          "text": "We’ve got some fresh new demos hot off the dCloud press! Whether you’re excited about the next wave of AI-ready data center innovation or eager to wow customers with smarter, faster Webex Contact Center experiences, we’ve got you covered.\\n\\nDive in below to explore the latest releases and get ready to shine in your next customer conversation!",
          "wrap": true
        },
        {
          "type": "Container",
          "items": [
            {
              "type": "TextBlock",
              "text": "dCloud Solutions Demo",
              "wrap": true,
              "horizontalAlignment": "Center",
              "color": "Accent",
              "weight": "Bolder"
            },
            {
              "type": "ColumnSet",
              "columns": [
                {
                  "type": "Column",
                  "width": "stretch",
                  "items": [
                    {
                      "type": "TextBlock",
                      "text": "Accelerate AI Innovation with Cisco AI Ready Data Centers (Learn Mode)",
                      "wrap": true
                    }
                  ]
                },
                {
                  "type": "Column",
                  "width": "auto",
                  "items": [
                    {
                      "type": "ActionSet",
                      "actions": [
                        {
                          "type": "Action.OpenUrl",
                          "title": "Demo",
                          "url": "https://dcloud2-lon.cisco.com/content/profile/accelerate-ai-innovation-ai-ready-data-center?returnPathTitleKey=content-view"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "type": "Container",
      "items": [
        {
          "type": "TextBlock",
          "text": "dCloud Essentials Demo",
          "wrap": true,
          "horizontalAlignment": "Center",
          "weight": "Bolder",
          "color": "Accent"
        },
        {
          "type": "ColumnSet",
          "columns": [
            {
              "type": "Column",
              "width": "stretch",
              "items": [
                {
                  "type": "TextBlock",
                  "text": "Explore Webex Contact Center (WxCC)",
                  "wrap": true
                }
              ]
            },
            {
              "type": "Column",
              "width": "auto",
              "items": [
                {
                  "type": "ActionSet",
                  "actions": [
                    {
                      "type": "Action.OpenUrl",
                      "title": "Demo",
                      "url": "https://dcloud2-lon.cisco.com/content/instantdemo/cisco-webex-contact-center-wxcc-v8-instant-demo-2"
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}`;

export function AdaptiveCardDesigner({
  botToken,
  selectedSpaceId,
  spaces,
  onSelectSpace,
}: AdaptiveCardDesignerProps) {
  const [cardJsonText, setCardJsonText] = useState<string>("");
  const [parsingError, setParsingError] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<SentCard[]>([]);

  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!previewRef.current) return;

    if (!cardJsonText.trim()) {
      previewRef.current.innerHTML = "";
      setParsingError("");
      return;
    }

    try {
      const payload = JSON.parse(cardJsonText);
      setParsingError("");

      const card = new AdaptiveCards.AdaptiveCard();
      card.hostConfig = new AdaptiveCards.HostConfig({});
      card.parse(payload);

      const renderedCard = card.render();
      previewRef.current.innerHTML = "";
      previewRef.current.appendChild(renderedCard);
    } catch (err) {
      setParsingError(
        "Invalid JSON: " + (err instanceof Error ? err.message : String(err))
      );
      previewRef.current.innerHTML = "";
    }
  }, [cardJsonText]);

  const hasConfig = !!botToken && !!selectedSpaceId;

  const insertTemplate = () => {
    setCardJsonText(STANDARD_CARD_TEMPLATE);
  };

  const sendCard = async () => {
    if (!botToken) {
      toast.error("Please set your bot access token in the Settings tab.");
      return;
    }
    if (!selectedSpaceId) {
      toast.error("Please select a space to send the card to.");
      return;
    }
    if (!cardJsonText.trim()) {
      toast.error("Paste or insert a card JSON first.");
      return;
    }

    let payload: any;
    try {
      payload = JSON.parse(cardJsonText);
    } catch (error) {
      toast.error(
        `Card JSON is invalid: ${
          error instanceof Error ? error.message : "Unknown parse error"
        }`
      );
      return;
    }

    let content = payload;
    if (content && (content.attachments || content.roomId || content.markdown)) {
      const maybe = content.attachments?.[0]?.content || content.content || content.card;
      if (maybe) content = maybe;
    }

    if (!content.type) content.type = "AdaptiveCard";
    if (content.type !== "AdaptiveCard") {
      toast.error("Root 'type' must be 'AdaptiveCard'.");
      return;
    }
    if (!content.version) content.version = "1.4";

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
          text: "Adaptive card",
          attachments: [
            {
              contentType: "application/vnd.microsoft.card.adaptive",
              content,
            },
          ],
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.message || resp.statusText || "Failed to send card");
      }

      toast.success(`Card sent! (messageId: ${data.id})`);

      const entry: SentCard = {
        id: data.id,
        spaceId: selectedSpaceId,
        createdAt: new Date().toISOString(),
      };

      setHistory((prev) => {
        const next = [entry, ...prev];
        return next.slice(0, 5);
      });
    } catch (error) {
      console.error(error);
      toast.error(
        `Failed to send card: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setSending(false);
    }
  };

  const deleteCardById = async (id: string) => {
    if (!botToken) {
      toast.error("Please set your bot access token in the Settings tab.");
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
        throw new Error(text || resp.statusText || "Failed to delete card message");
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

  const deleteLastCard = async () => {
    if (!history.length) {
      toast.error("No card messages in history.");
      return;
    }
    const last = history[0];
    await deleteCardById(last.id);
  };

  return (
    <Card className="border-pink-500/20 bg-slate-900/70 backdrop-blur shadow-lg shadow-pink-500/10">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="text-white">Adaptive card sender</CardTitle>
          <CardDescription className="text-slate-300">
            Paste your Adaptive Card JSON on the left, preview it, and send it to a space.
          </CardDescription>
        </div>

        <div className="flex flex-wrap gap-2 items-center justify-end">
          <Button
            variant="outline"
            className="border-pink-500/40 text-pink-200 hover:bg-pink-500/10"
            asChild
          >
            <a
              href="https://developer.webex.com/buttons-and-cards-designer"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="size-4 mr-1" />
              Open Webex Card Designer
            </a>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Space + config info */}
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
                before sending cards.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* JSON + preview */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-slate-200">Adaptive Card JSON</Label>
              <Button
                type="button"
                variant="outline"
                className="border-pink-500/40 text-pink-200 hover:bg-pink-500/10 text-xs"
                onClick={insertTemplate}
              >
                Insert standard template
              </Button>
            </div>

            <Textarea
              value={cardJsonText}
              onChange={(e) => setCardJsonText(e.target.value)}
              className="min-h-[800px] font-mono text-xs bg-slate-950/80 border-slate-700 text-slate-100"
              spellCheck={false}
            />
            {parsingError && (
              <p className="text-xs text-red-400 mt-1">{parsingError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-slate-200">Preview</Label>
            <div className="min-h-[320px] p-3 rounded-md bg-slate-950/80 border border-slate-700 overflow-auto">
              <div ref={previewRef} />
            </div>
          </div>
        </div>

        {/* History */}
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="size-4 text-pink-300" />
              <span className="text-sm font-medium text-slate-100">
                Sent card history (last {history.length || 0})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={!history.length || !botToken}
              onClick={deleteLastCard}
              className="border-pink-500/40 text-pink-200 hover:bg-pink-500/10 flex items-center gap-1"
            >
              <Trash2 className="size-3" />
              Delete last card
            </Button>
          </div>

          <ScrollArea className="h-[150px]">
            <div className="space-y-2 mt-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs text-slate-100 flex flex-col gap-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] text-slate-400 truncate">
                      {h.id}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-300 hover:text-red-400"
                      onClick={() => deleteCardById(h.id)}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(h.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}

              {!history.length && (
                <p className="text-xs text-slate-400">
                  No card messages sent yet in this session.
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Send button */}
        <div className="pt-2 flex justify-end">
          <Button
            onClick={sendCard}
            disabled={sending || !hasConfig}
            className="bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-2"
          >
            <Send className="size-4" />
            {sending ? "Sending…" : "Send card"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
