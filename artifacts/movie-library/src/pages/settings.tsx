import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings as SettingsIcon, Folder, Monitor, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AppSettings {
  id: number;
  moviesDir: string;
  vlcPath: string;
}

async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

async function saveSettings(payload: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch("/api/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save settings");
  return res.json();
}

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });

  const [moviesDir, setMoviesDir] = useState("");
  const [vlcPath, setVlcPath] = useState("");

  useEffect(() => {
    if (settings) {
      setMoviesDir(settings.moviesDir);
      setVlcPath(settings.vlcPath);
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Settings saved", description: "Your changes have been applied." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save settings.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    mutation.mutate({ moviesDir, vlcPath });
  };

  const isDirty = settings && (moviesDir !== settings.moviesDir || vlcPath !== settings.vlcPath);

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <SettingsIcon className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          Configure where your movies are stored and how they are played.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
        </div>
      ) : (
        <div className="space-y-8">

          {/* Movies Folder */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">Movies Folder</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The folder on your computer where all your movie subfolders are stored.
              Each subfolder should contain one movie and optionally its subtitle files.
              If your drive letter changes (e.g. from <code className="bg-muted px-1 rounded">D:\</code> to <code className="bg-muted px-1 rounded">E:\</code>),
              just update this path and scan again.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="moviesDir" className="text-xs">Folder path</Label>
              <Input
                id="moviesDir"
                value={moviesDir}
                onChange={(e) => setMoviesDir(e.target.value)}
                placeholder="D:\movies"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Examples: <span className="font-mono">D:\movies</span> · <span className="font-mono">E:\Films</span> · <span className="font-mono">F:\Media\Movies</span>
              </p>
            </div>
          </div>

          {/* VLC Path */}
          <div className="rounded-lg border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-sm">VLC Executable</h2>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The full path to your VLC media player installation.
              Only change this if you installed VLC in a non-standard location.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="vlcPath" className="text-xs">VLC path</Label>
              <Input
                id="vlcPath"
                value={vlcPath}
                onChange={(e) => setVlcPath(e.target.value)}
                placeholder="C:\Program Files\VideoLAN\VLC\vlc.exe"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Default: <span className="font-mono">C:\Program Files\VideoLAN\VLC\vlc.exe</span>
              </p>
            </div>
          </div>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={!isDirty || mutation.isPending}
              className="gap-2"
            >
              <CheckCircle className="h-4 w-4" />
              {mutation.isPending ? "Saving…" : "Save Settings"}
            </Button>
            {!isDirty && !mutation.isPending && settings && (
              <span className="text-xs text-muted-foreground">No unsaved changes</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
