import { Link } from "wouter";
import { Star, Image as ImageIcon, Eye, Clapperboard, Users } from "lucide-react";
import { Movie } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

export function MovieCard({ movie }: { movie: Movie }) {
  const genres = movie.genre && movie.genre !== "N/A"
    ? movie.genre.split(",").map((g) => g.trim()).slice(0, 3)
    : [];

  return (
    <Link href={`/movies/${movie.id}`}>
      <div className="group relative rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 overflow-hidden cursor-pointer h-full flex flex-col">

        {/* Poster */}
        <div className="aspect-[2/3] w-full bg-muted relative overflow-hidden shrink-0">
          {movie.poster && movie.poster !== "N/A" ? (
            <img
              src={movie.poster}
              alt={`Poster for ${movie.title}`}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground bg-muted/50 gap-1">
              <ImageIcon className="h-10 w-10 opacity-30" />
              {movie.notFound && (
                <span className="text-xs opacity-40 px-2 text-center">Not on IMDB</span>
              )}
            </div>
          )}

          {/* IMDB rating pill */}
          {movie.imdbRating && movie.imdbRating !== "N/A" && (
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <Star className="h-3 w-3 text-primary fill-primary" />
              {movie.imdbRating}
            </div>
          )}

          {/* Watched indicator */}
          {movie.watched && (
            <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm text-white text-xs px-1.5 py-0.5 rounded flex items-center gap-1 shadow-sm">
              <Eye className="h-3 w-3" />
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="p-3 flex-1 flex flex-col gap-2">

          {/* Title + year */}
          <div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2" title={movie.title}>
              {movie.title}
            </h3>
            {movie.year && (
              <p className="text-xs text-muted-foreground mt-0.5">{movie.year}</p>
            )}
          </div>

          {/* Genres */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {genres.map((g) => (
                <Badge key={g} variant="secondary" className="text-xs px-1.5 py-0 font-normal">
                  {g}
                </Badge>
              ))}
            </div>
          )}

          {/* Director */}
          {movie.director && movie.director !== "N/A" && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Clapperboard className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
              <span className="line-clamp-1">{movie.director}</span>
            </div>
          )}

          {/* Actors */}
          {movie.actors && movie.actors !== "N/A" && (
            <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3 w-3 mt-0.5 shrink-0 opacity-60" />
              <span className="line-clamp-2">{movie.actors}</span>
            </div>
          )}

          {/* Synopsis */}
          {movie.plot && movie.plot !== "N/A" && (
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mt-auto pt-1 border-t border-border/50">
              {movie.plot}
            </p>
          )}

          {/* Personal star rating */}
          {(movie.userRating ?? 0) > 0 && (
            <div className="flex items-center gap-0.5 pt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${i < movie.userRating! ? "text-primary fill-primary" : "text-muted-foreground/20"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
