import { useState } from "react";
import { useListMovies } from "@workspace/api-client-react";
import { MovieCard } from "@/components/movie-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useDebounce } from "@/hooks/use-debounce";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

export default function Home() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [sort, setSort] = useState<"title" | "year" | "rating" | "added">("added");
  const [genre, setGenre] = useState("");
  const [director, setDirector] = useState("");
  const [actor, setActor] = useState("");
  const [year, setYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [watched, setWatched] = useState("");

  const debouncedGenre = useDebounce(genre, 300);
  const debouncedDirector = useDebounce(director, 300);
  const debouncedActor = useDebounce(actor, 300);
  const debouncedYear = useDebounce(year, 300);
  const debouncedMinRating = useDebounce(minRating, 300);

  const params = {
    search: debouncedSearch || undefined,
    genre: debouncedGenre || undefined,
    director: debouncedDirector || undefined,
    actor: debouncedActor || undefined,
    year: debouncedYear || undefined,
    minRating: debouncedMinRating || undefined,
    watched: watched || undefined,
    sort,
  };

  const { data: movies, isLoading } = useListMovies(params);

  const activeFilterCount = [genre, director, actor, year, minRating, watched].filter(Boolean).length;

  const clearFilters = () => {
    setGenre(""); setDirector(""); setActor(""); setYear(""); setMinRating(""); setWatched("");
  };

  return (
    <div className="container py-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Your Library</h1>
          <p className="text-muted-foreground">Browse and manage your personal film collection.</p>
        </div>
        <Link href="/scan">
          <Button variant="outline" size="sm">Scan for new movies</Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by title..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-4" align="start">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Genre</Label>
              <Input placeholder="e.g. Action, Drama..." value={genre} onChange={(e) => setGenre(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Director</Label>
              <Input placeholder="e.g. Christopher Nolan..." value={director} onChange={(e) => setDirector(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Actor</Label>
              <Input placeholder="e.g. Tom Hanks..." value={actor} onChange={(e) => setActor(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Year</Label>
                <Input placeholder="e.g. 2010" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Min Rating</Label>
                <Input placeholder="e.g. 7.5" value={minRating} onChange={(e) => setMinRating(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Watch Status</Label>
              <Select value={watched || "all"} onValueChange={(v) => setWatched(v === "all" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All movies</SelectItem>
                  <SelectItem value="true">Watched</SelectItem>
                  <SelectItem value="false">Unwatched</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                <X className="mr-2 h-3 w-3" />
                Clear all filters
              </Button>
            )}
          </PopoverContent>
        </Popover>

        <Select value={sort} onValueChange={(val: any) => setSort(val)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="added">Recently Added</SelectItem>
            <SelectItem value="title">Title A–Z</SelectItem>
            <SelectItem value="year">Year</SelectItem>
            <SelectItem value="rating">IMDB Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[2/3] w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : movies && movies.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-1">
            {activeFilterCount > 0 || search ? "No movies match your filters" : "Your library is empty"}
          </h3>
          <p className="text-muted-foreground mb-6">
            {activeFilterCount > 0 || search ? "Try adjusting your search or filters." : "Scan your movies folder to get started."}
          </p>
          {activeFilterCount > 0 ? (
            <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
          ) : (
            <Link href="/scan"><Button>Scan Library</Button></Link>
          )}
        </div>
      )}
    </div>
  );
}
