import { Link } from "wouter";
import { Star, Image as ImageIcon, Eye, EyeOff } from "lucide-react";
import { Movie } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";

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
            <div className="flex h-full w-full flex-col items-center justify-center text-muted-foreground bg-muted/50 gap-2">
              <ImageIcon className="h-10 w-10 opacity-30" />
              {movie.notFound && (
                <span className="text-xs text-center px-2 opacity-50">Not found on IMDB</span>
              )}
            </div>
          )}
          {movie.imdbRating && movie.imdbRating !== "N/A" && (
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-xs font-semibold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <Star className="h-3 w-3 text-primary fill-primary" />
              {movie.imdbRating}
            </div>
          )}
          {movie.watched && (
            <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm text-foreground text-xs px-2 py-1 rounded flex items-center gap-1 shadow-sm">
              <Eye className="h-3 w-3 text-green-500" />
            </div>
          )}
          {movie.notFound && !movie.poster && (
            <div className="absolute bottom-2 left-2">
              <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur-sm">Not found</Badge>
            </div>
          )}
        </div>
        <div className="p-3 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm leading-tight line-clamp-2" title={movie.title}>
              {movie.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">{movie.year}</p>
          </div>
          {movie.genre && movie.genre !== "N/A" && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
              {movie.genre.split(", ")[0]}
            </p>
          )}
          {movie.userRating && (
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-2.5 w-2.5 ${i < movie.userRating! ? "text-primary fill-primary" : "text-muted-foreground/30"}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
