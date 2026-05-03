import { useState } from "react";
import { useLocation } from "wouter";
import { useParseMovieFolders, useLookupMovies } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, ArrowRight, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function Import() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [foldersInput, setFoldersInput] = useState("");
  const [step, setStep] = useState<"input" | "preview" | "lookup" | "results">("input");
  
  const parseFolders = useParseMovieFolders();
  const lookupMovies = useLookupMovies();
  
  const handleParse = () => {
    const lines = foldersInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    
    parseFolders.mutate({ data: { folders: lines } }, {
      onSuccess: () => {
        setStep("preview");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Parse Error",
          description: err.error || "Failed to parse folders"
        });
      }
    });
  };
  
  const handleLookup = () => {
    if (!parseFolders.data) return;
    
    setStep("lookup");
    lookupMovies.mutate({ data: { movies: parseFolders.data } }, {
      onSuccess: () => {
        setStep("results");
      },
      onError: (err) => {
        toast({
          variant: "destructive",
          title: "Lookup Error",
          description: err.error || "Failed to lookup movies"
        });
        setStep("preview");
      }
    });
  };
  
  const handleDone = () => {
    setLocation("/");
  };
  
  return (
    <div className="container py-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Import Movies</h1>
        <p className="text-muted-foreground mt-2">
          Paste a list of folder names. We'll extract the titles and years, then look them up on IMDb.
        </p>
      </div>

      {step === "input" && (
        <Card>
          <CardHeader>
            <CardTitle>Folder Names</CardTitle>
            <CardDescription>
              One folder per line. Examples: "The Matrix (1999)", "inception.2010.1080p", "Interstellar 2014"
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="The Godfather (1999)&#10;Pulp.Fiction.1994&#10;Fight Club"
              className="min-h-[300px] font-mono text-sm"
              value={foldersInput}
              onChange={(e) => setFoldersInput(e.target.value)}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button 
              onClick={handleParse} 
              disabled={!foldersInput.trim() || parseFolders.isPending}
            >
              {parseFolders.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                <>
                  Parse Folders
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === "preview" && parseFolders.data && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Parsed Titles</CardTitle>
            <CardDescription>
              We found {parseFolders.data.length} movies. Review the extracted titles before fetching IMDb data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[400px] overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b sticky top-0 backdrop-blur-sm">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium">Original Folder</th>
                    <th className="px-4 py-2 text-left font-medium">Extracted Title</th>
                    <th className="px-4 py-2 text-left font-medium w-24">Year</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parseFolders.data.map((m, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px] font-mono text-xs" title={m.folderName}>
                        {m.folderName}
                      </td>
                      <td className="px-4 py-2 font-medium">{m.title}</td>
                      <td className="px-4 py-2 text-muted-foreground">{m.year || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("input")}>
              Back to Edit
            </Button>
            <Button onClick={handleLookup}>
              Lookup on IMDb
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {step === "lookup" && (
        <Card>
          <CardContent className="pt-6 pb-12 flex flex-col items-center justify-center space-y-6">
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            <div className="text-center space-y-2">
              <h3 className="text-xl font-medium">Fetching Data from IMDb</h3>
              <p className="text-muted-foreground">
                This might take a moment depending on how many movies you're importing...
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "results" && lookupMovies.data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="bg-green-500/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2 text-lg">
                  <CheckCircle2 className="h-5 w-5" />
                  Successfully Saved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{lookupMovies.data.saved.length}</p>
                <p className="text-sm text-muted-foreground mt-1">movies added to library</p>
              </CardContent>
            </Card>
            
            <Card className={lookupMovies.data.failed.length > 0 ? "bg-destructive/5 border-destructive/20" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className={`flex items-center gap-2 text-lg ${lookupMovies.data.failed.length > 0 ? "text-destructive" : ""}`}>
                  {lookupMovies.data.failed.length > 0 ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5 opacity-50" />}
                  Failed Lookups
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{lookupMovies.data.failed.length}</p>
                <p className="text-sm text-muted-foreground mt-1">movies not found or errors</p>
              </CardContent>
            </Card>
          </div>

          {lookupMovies.data.failed.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Failed Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border max-h-[300px] overflow-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium">Title</th>
                        <th className="px-4 py-2 text-left font-medium">Folder</th>
                        <th className="px-4 py-2 text-left font-medium">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lookupMovies.data.failed.map((f, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-medium">{f.title}</td>
                          <td className="px-4 py-2 text-muted-foreground font-mono text-xs">{f.folderName}</td>
                          <td className="px-4 py-2 text-destructive">{f.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={handleDone} size="lg">
              Go to Library
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
