import { useState } from "react";
import { useLocation } from "wouter";
import { useScanLibrary, getListMoviesQueryKey, getGetMovieStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, FolderSearch, CheckCircle2, XCircle, SkipForward, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScanLibraryResponse } from "@workspace/api-zod";
import { z } from "zod/v4";

type ScanResult = z.infer<typeof ScanLibraryResponse>;

export default function Scan() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [result, setResult] = useState<ScanResult | null>(null);

  const scanLibrary = useScanLibrary();

  const handleScan = () => {
    scanLibrary.mutate(undefined, {
      onSuccess: (data) => {
        setResult(data);
        queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMovieStatsQueryKey() });
        toast({ title: `Scan complete — ${data.added} new movies added` });
      },
      onError: () => {
        toast({ variant: "destructive", title: "Scan failed", description: "Could not read the movies folder. Make sure D:\\movies is accessible." });
      },
    });
  };

  const statusIcon = (status: string) => {
    if (status === "added") return <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />;
    if (status === "skipped") return <SkipForward className="h-4 w-4 text-muted-foreground shrink-0" />;
    if (status === "not_found") return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
    return <XCircle className="h-4 w-4 text-destructive shrink-0" />;
  };

  const statusLabel = (status: string) => {
    if (status === "added") return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30 hover:bg-green-500/15">Added</Badge>;
    if (status === "skipped") return <Badge variant="outline">Already in library</Badge>;
    if (status === "not_found") return <Badge className="bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/15">Not found on IMDB</Badge>;
    return <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Scan Library</h1>
        <p className="text-muted-foreground">
          Scans <span className="font-mono text-sm bg-muted px-1.5 py-0.5 rounded">D:\movies</span> for new folders and fetches IMDB info for each one.
          Movies already in your library are skipped.
        </p>
      </div>

      {!result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderSearch className="h-5 w-5" />
              Ready to Scan
            </CardTitle>
            <CardDescription>
              The app will read every subfolder in your movies drive, parse the title and year, then look each one up on IMDB. This may take a few minutes for large libraries.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleScan} disabled={scanLibrary.isPending} size="lg">
              {scanLibrary.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning... this may take a while
                </>
              ) : (
                <>
                  <FolderSearch className="mr-2 h-4 w-4" />
                  Start Scan
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Folders</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{result.total}</p>
              </CardContent>
            </Card>
            <Card className="border-green-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Added</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-700 dark:text-green-400">{result.added}</p>
              </CardContent>
            </Card>
            <Card className="border-yellow-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Not Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{result.notFound}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Skipped</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{result.skipped}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scan Details</CardTitle>
              <CardDescription>{result.details.length} folders processed</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-auto rounded-b-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b sticky top-0 backdrop-blur-sm">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium w-8"></th>
                      <th className="px-4 py-2 text-left font-medium">Folder</th>
                      <th className="px-4 py-2 text-left font-medium">Title Found</th>
                      <th className="px-4 py-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.details.map((d, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-2">{statusIcon(d.status)}</td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground max-w-[200px] truncate" title={d.folderName}>{d.folderName}</td>
                        <td className="px-4 py-2 font-medium">{d.title}</td>
                        <td className="px-4 py-2">{statusLabel(d.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-2">
            <Button onClick={() => { setResult(null); }} variant="outline">Scan Again</Button>
            <Button onClick={() => setLocation("/")}>Go to Library</Button>
          </div>
        </div>
      )}
    </div>
  );
}
