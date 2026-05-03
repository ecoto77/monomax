import { useParams, useLocation } from "wouter";
import { useGetMovie, useDeleteMovie, getListMoviesQueryKey, getGetMovieStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Star, 
  Calendar, 
  Clock, 
  Trash2, 
  Image as ImageIcon,
  FolderOpen,
  Clapperboard,
  Users,
  PenTool
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MovieDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: movie, isLoading } = useGetMovie(Number(id), {
    query: { enabled: !!id }
  });

  const deleteMovie = useDeleteMovie();

  const handleDelete = () => {
    if (!id) return;
    deleteMovie.mutate({ id: Number(id) }, {
      onSuccess: () => {
        toast({ title: "Movie deleted" });
        queryClient.invalidateQueries({ queryKey: getListMoviesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetMovieStatsQueryKey() });
        setLocation("/");
      },
      onError: (err) => {
        toast({ 
          variant: "destructive",
          title: "Error deleting movie",
          description: err.error || "Unknown error"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container py-8 max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-8 w-24" />
        <div className="grid md:grid-cols-[300px_1fr] gap-8">
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

  return (
    <div className="container py-8 max-w-5xl mx-auto">
      <Button variant="ghost" className="mb-6 -ml-4 text-muted-foreground hover:text-foreground" onClick={() => setLocation("/")}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Library
      </Button>

      <div className="grid md:grid-cols-[300px_1fr] gap-8 items-start">
        {/* Poster Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg overflow-hidden border shadow-lg bg-muted aspect-[2/3] relative">
            {movie.poster && movie.poster !== "N/A" ? (
              <img 
                src={movie.poster} 
                alt={`Poster for ${movie.title}`} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground">
                <ImageIcon className="h-16 w-16 opacity-20 mb-2" />
                <span className="text-sm">No Poster Available</span>
              </div>
            )}
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 border space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span className="font-mono text-xs break-all" title={movie.folderName}>
                {movie.folderName}
              </span>
            </div>
            {movie.imdbId && (
              <a 
                href={`https://www.imdb.com/title/${movie.imdbId}`} 
                target="_blank" 
                rel="noreferrer"
                className="text-primary hover:underline block pt-2"
              >
                View on IMDb ↗
              </a>
            )}
          </div>
        </div>

        {/* Details Content */}
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              {movie.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground text-sm font-medium">
              {movie.year && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {movie.year}
                </div>
              )}
              {movie.imdbRating && movie.imdbRating !== "N/A" && (
                <div className="flex items-center gap-1 text-foreground">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {movie.imdbRating}
                </div>
              )}
              <div className="flex flex-wrap gap-1">
                {genres.map(g => (
                  <Badge key={g} variant="secondary" className="font-normal">{g}</Badge>
                ))}
              </div>
            </div>
          </div>

          {movie.plot && movie.plot !== "N/A" && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Synopsis</h3>
              <p className="text-muted-foreground leading-relaxed md:text-lg">
                {movie.plot}
              </p>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t">
            {movie.director && movie.director !== "N/A" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Clapperboard className="h-4 w-4 text-muted-foreground" />
                  Director
                </div>
                <p className="text-muted-foreground">{movie.director}</p>
              </div>
            )}
            
            {movie.writer && movie.writer !== "N/A" && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <PenTool className="h-4 w-4 text-muted-foreground" />
                  Writers
                </div>
                <p className="text-muted-foreground">{movie.writer}</p>
              </div>
            )}
            
            {movie.actors && movie.actors !== "N/A" && (
              <div className="space-y-1 sm:col-span-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  Cast
                </div>
                <p className="text-muted-foreground">{movie.actors}</p>
              </div>
            )}
          </div>

          <div className="pt-8 border-t flex justify-end">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove from Library
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove "{movie.title}" from your library. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteMovie.isPending ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
