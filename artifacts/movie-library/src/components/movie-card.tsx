import { Link } from "wouter";
import { Star, Image as ImageIcon } from "lucide-react";
import { Movie } from "@workspace/api-client-react";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link href={`/movies/${movie.id}`}>
      <div className="group relative rounded-lg border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/50 overflow-hidden cursor-pointer h-full flex flex-col">
        <div className="aspect-[2/3] w-full bg-muted relative overflow-hidden">
          {movie.poster && movie.poster !== "N/A" ? (
            <img
              src={movie.poster}
              alt={`Poster for ${movie.title}`}
              className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground bg-muted/50">
              <ImageIcon className="h-12 w-12 opacity-50" />
            </div>
          )}
          {movie.imdbRating && movie.imdbRating !== "N/A" && (
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <Star className="h-3 w-3 text-primary fill-primary" />
              {movie.imdbRating}
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold leading-tight line-clamp-2" title={movie.title}>
              {movie.title}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">{movie.year}</p>
          </div>
          {movie.genre && movie.genre !== "N/A" && (
            <p className="text-xs text-muted-foreground mt-3 line-clamp-1">
              {movie.genre.split(', ')[0]}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
