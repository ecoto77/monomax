import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  useGetMovie,
  useDeleteMovie,
  useUpdateMovie,
  usePlayMovie,
  useOpenMovieFolder,
  useGetMovieSubtitles,
  getListMoviesQueryKey,
  getGetMovieStatsQueryKey,
  getGetMovieQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Star, Calendar, Trash2, Image as ImageIcon, FolderOpen,
  Clapperboard, Users, PenTool, Play, Eye, EyeOff, ExternalLink, Subtitles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function MovieDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [showSubtitlePicker, setShowSubtitlePicker] = useState(false);
  const [selectedSubtitle, setSelectedSubtitle] = useState<string>("");
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const { data: movie, isLoading } = useGetMovie(Number(id), {
    query: { enabled: !!id },
  });
  const { data: subtitles } = useGetMovieSubtitles(Number(id), {
    query: { enabled: !!id },
  });

  const deleteMovie = useDeleteMovie();
  const updateMovie = useUpdateMovie();
  const playMovie = usePlayMovie();
  const openFolder = useOpenMovieFolder();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMovieStatsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetMovieQueryKey(Number(id)) });
  };

  const handleDelete = () => {
    if (!id) return;
    deleteMovie.mutate({ id: Number(id) }, {
      onSuccess: () => {
        toast({ title: "Movie removed from library" });
        queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMovieStatsQueryKey() });
        setLocation("/");
      },
    });
  };

  const handleToggleWatched = () => {
    if (!movie) return;
    updateMovie.mutate(
      { id: Number(id), data: { watched: !movie.watched } },
      {
        onSuccess: (updated) => {
          toast({ title: updated.watched ? "Marked as watched" : "Marked as unwatched" });
          invalidate();
        },
      }
    );
  };

  const handleRating = (rating: number) => {
    updateMovie.mutate(
      { id: Number(id), data: { userRating: rating } },
      { onSuccess: () => { toast({ title: `Rated ${rating} out of 5` }); invalidate(); } }
    );
  };

  const handleSaveNotes = () => {
    updateMovie.mutate(
      { id: Number(id), data: { notes: notesValue } },
      {
        onSuccess: () => {
          toast({ title: "Notes saved" });
          setEditingNotes(false);
          invalidate();
        },
      }
    );
  };

  const handleOpenSubtitlePicker = () => {
    setSelectedSubtitle("");
    setShowSubtitlePicker(true);
  };

  const handlePlay = (subtitlePath?: string) => {
    setShowSubtitlePicker(false);
    playMovie.mutate(
      { id: Number(id), data: subtitlePath ? { subtitlePath } : {} },
      {
        onSuccess: (res) => toast({ title: res.message }),
        onError: () => toast({ variant: "destructive", title: "Could not launch VLC", description: "Make sure VLC is installed at the default location." }),
      }
    );
  };

  const handleOpenFolder = () => {
    openFolder.mutate({ id: Number(id) }, {
      onError: () => toast({ variant: "destructive", title: "Could not open folder" }),
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-8 w-24" />
        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          <Skeleton className="aspect-[2/3] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="container py-8 max-w-5xl mx-auto text-center mt-20">
        <h2 className="text-2xl font-bold mb-4">Movie not found</h2>
        <Button onClick={() => setLocation("/")}>Back to Library</Button>
      </div>
    );
  }

  const genres = movie.genre && movie.genre !== "N/A" ? movie.genre.split(", ") : [];
  const currentRating = movie.userRating ?? 0;

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground" onClick={() => setLocation("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Library
      </Button>

      <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Poster */}
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border shadow-lg bg-muted aspect-[2/3] relative">
            {movie.poster && movie.poster !== "N/A" ? (
              <img src={movie.poster} alt={`Poster for ${movie.title}`} className="w-full h-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 opacity-20 mb-2" />
                <span className="text-sm">{movie.notFound ? "Not found on IMDB" : "No Poster"}</span>
              </div>
            )}
            {movie.watched && (
              <div className="absolute top-3 left-3 bg-green-500 text-white text-xs font-medium px-2 py-1 rounded flex items-center gap-1">
                <Eye className="h-3 w-3" /> Watched
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button className="w-full" onClick={handleOpenSubtitlePicker} disabled={playMovie.isPending}>
              <Play className="mr-2 h-4 w-4" />
              {playMovie.isPending ? "Launching VLC..." : "Play in VLC"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={handleToggleWatched} disabled={updateMovie.isPending}>
                {movie.watched ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" />Unwatched</> : <><Eye className="mr-1.5 h-3.5 w-3.5" />Watched</>}
              </Button>
              <Button variant="outline" size="sm" onClick={handleOpenFolder}>
                <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                Open Folder
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="p-4 rounded-lg bg-muted/50 border space-y-2 text-sm">
            <p className="font-mono text-xs text-muted-foreground break-all">{movie.folderName}</p>
            {movie.imdbId && (
              <a
                href={`https://www.imdb.com/title/${movie.imdbId}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 text-xs"
              >
                <ExternalLink className="h-3 w-3" /> View on IMDB
              </a>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">{movie.title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm font-medium text-muted-foreground">
              {movie.year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" /> {movie.year}
                </span>
              )}
              {movie.imdbRating && movie.imdbRating !== "N/A" && (
                <span className="flex items-center gap-1 text-foreground">
                  <Star className="h-4 w-4 fill-primary text-primary" /> {movie.imdbRating} IMDB
                </span>
              )}
              {genres.map((g) => (
                <Badge key={g} variant="secondary" className="font-normal">{g}</Badge>
              ))}
            </div>
          </div>

          {/* Personal rating */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Your Rating</p>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i < (hoveredStar ?? currentRating);
                return (
                  <button
                    key={i}
                    onMouseEnter={() => setHoveredStar(i + 1)}
                    onMouseLeave={() => setHoveredStar(null)}
                    onClick={() => handleRating(i + 1)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${filled ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                    />
                  </button>
                );
              })}
              {currentRating > 0 && (
                <button
                  className="text-xs text-muted-foreground ml-2 hover:text-foreground"
                  onClick={() => handleRating(0)}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {movie.plot && movie.plot !== "N/A" && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Synopsis</h3>
              <p className="text-foreground leading-relaxed">{movie.plot}</p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t">
            {movie.director && movie.director !== "N/A" && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Clapperboard className="h-3.5 w-3.5" /> Director
                </div>
                <p className="text-sm">{movie.director}</p>
              </div>
            )}
            {movie.writer && movie.writer !== "N/A" && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <PenTool className="h-3.5 w-3.5" /> Writers
                </div>
                <p className="text-sm">{movie.writer}</p>
              </div>
            )}
            {movie.actors && movie.actors !== "N/A" && (
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> Cast
                </div>
                <p className="text-sm">{movie.actors}</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
              {!editingNotes && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setNotesValue(movie.notes ?? ""); setEditingNotes(true); }}
                >
                  {movie.notes ? "Edit" : "Add notes"}
                </Button>
              )}
            </div>
            {editingNotes ? (
              <div className="space-y-2">
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Your thoughts on this film..."
                  className="min-h-[100px]"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditingNotes(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveNotes} disabled={updateMovie.isPending}>Save</Button>
                </div>
              </div>
            ) : movie.notes ? (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{movie.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground/50 italic">No notes yet.</p>
            )}
          </div>

          {/* Delete */}
          <div className="pt-6 border-t flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove from Library
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove this movie?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes "{movie.title}" from your library. The actual files on disk are not affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteMovie.isPending ? "Removing..." : "Remove"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {/* Subtitle Picker Dialog */}
      <Dialog open={showSubtitlePicker} onOpenChange={setShowSubtitlePicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Subtitles className="h-5 w-5" /> Choose Subtitle
            </DialogTitle>
            <DialogDescription>
              Select a subtitle file to load in VLC, or play without subtitles.
            </DialogDescription>
          </DialogHeader>
          {subtitles && subtitles.length > 0 ? (
            <RadioGroup value={selectedSubtitle} onValueChange={setSelectedSubtitle} className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50">
                <RadioGroupItem value="" id="no-sub" />
                <Label htmlFor="no-sub" className="cursor-pointer text-muted-foreground">No subtitle</Label>
              </div>
              {subtitles.map((sub) => (
                <div key={sub.path} className="flex items-center gap-2 p-2 rounded border cursor-pointer hover:bg-muted/50">
                  <RadioGroupItem value={sub.path} id={sub.path} />
                  <Label htmlFor={sub.path} className="cursor-pointer font-mono text-sm">{sub.name}</Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No subtitle files (.srt) found in this movie's folder.
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubtitlePicker(false)}>Cancel</Button>
            <Button onClick={() => handlePlay(selectedSubtitle || undefined)}>
              <Play className="mr-2 h-4 w-4" />
              Play
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
