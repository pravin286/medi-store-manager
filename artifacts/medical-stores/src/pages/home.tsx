import { useState } from "react";
import { Link } from "wouter";
import { useListStores, useListCities } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Search,
  MapPin,
  Store as StoreIcon,
  X,
  Sparkles,
  ShieldCheck,
  Tag,
  ArrowRight,
  Siren,
} from "lucide-react";

const ALL_CITIES = "__all__";

export default function Home() {
  const [search, setSearch] = useState("");
  const [city, setCity] = useState<string>(ALL_CITIES);
  const [minDiscount, setMinDiscount] = useState<number[]>([0]);
  const [emergencyOnly, setEmergencyOnly] = useState(false);

  const { data: cities } = useListCities();

  const { data: stores, isLoading } = useListStores({
    search: search || undefined,
    city: city !== ALL_CITIES ? city : undefined,
    minDiscount: minDiscount[0] > 0 ? minDiscount[0] : undefined,
    is24x7: emergencyOnly ? true : undefined,
  });

  const hasActiveFilters = search || city !== ALL_CITIES || minDiscount[0] > 0 || emergencyOnly;

  const clearFilters = () => {
    setSearch("");
    setCity(ALL_CITIES);
    setMinDiscount([0]);
    setEmergencyOnly(false);
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center space-y-5 text-center mb-12">
        <Badge variant="outline" className="rounded-full bg-white/70 backdrop-blur border-sky-200/60 px-4 py-1.5 gap-1.5 text-sky-700">
          <Sparkles className="h-3.5 w-3.5" />
          <span className="text-xs font-medium tracking-wide uppercase">Trusted local pharmacies</span>
        </Badge>
        <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
          Find the right <span className="text-gradient-brand">medical store</span>
          <br className="hidden sm:block" /> near you.
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl">
          Browse verified pharmacies, compare discounts, and locate your nearest store on the map — all in one place.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-500" /> Verified by admin</span>
          <span className="flex items-center gap-2"><Tag className="h-4 w-4 text-sky-500" /> Real-time discounts</span>
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-rose-500" /> Pin-point locations</span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="max-w-5xl mx-auto mb-10">
        <Card className="border-border/60 shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur">
          <CardContent className="p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-12 items-stretch">
              <div className="md:col-span-5">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search by store name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 h-12 text-base bg-transparent border-0 shadow-none focus-visible:ring-1 focus-visible:ring-sky-300"
                  />
                </div>
              </div>

              <div className="md:col-span-3 md:border-l md:border-border/50">
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="h-12 text-base border-0 bg-transparent shadow-none focus:ring-1 focus:ring-sky-300">
                    <div className="flex items-center gap-2 truncate">
                      <MapPin className="h-4 w-4 text-sky-500 shrink-0" />
                      <SelectValue placeholder="All cities" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_CITIES}>All cities</SelectItem>
                    {(cities || []).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-4 md:border-l md:border-border/50 px-4 py-2 flex flex-col justify-center">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min Discount</label>
                  <span className="text-sm font-bold text-sky-600">{minDiscount[0]}%</span>
                </div>
                <Slider
                  value={minDiscount}
                  onValueChange={setMinDiscount}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2">
          <button
            type="button"
            onClick={() => setEmergencyOnly((v) => !v)}
            className={`group inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
              emergencyOnly
                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/30"
                : "bg-white text-rose-600 border-rose-200 hover:border-rose-400 hover:bg-rose-50"
            }`}
          >
            <span className={`relative grid place-items-center w-5 h-5 rounded-full ${emergencyOnly ? "bg-white/20" : "bg-rose-100 group-hover:bg-rose-200"}`}>
              <Siren className={`h-3 w-3 ${emergencyOnly ? "text-white" : "text-rose-500"}`} />
              {!emergencyOnly && (
                <span className="absolute inset-0 rounded-full bg-rose-400/40 animate-ping" />
              )}
            </span>
            Emergency Mode — 24/7 stores only
          </button>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mt-4 text-sm text-muted-foreground px-2">
            <span className="font-medium text-foreground">Filters:</span>
            {city !== ALL_CITIES && (
              <Badge variant="secondary" className="gap-1 rounded-full bg-sky-50 text-sky-700 border-sky-100">
                <MapPin className="h-3 w-3" /> {city}
              </Badge>
            )}
            {search && (
              <Badge variant="secondary" className="gap-1 rounded-full bg-violet-50 text-violet-700 border-violet-100">
                <Search className="h-3 w-3" /> {search}
              </Badge>
            )}
            {minDiscount[0] > 0 && (
              <Badge variant="secondary" className="gap-1 rounded-full bg-emerald-50 text-emerald-700 border-emerald-100">
                <Tag className="h-3 w-3" /> Min {minDiscount[0]}% off
              </Badge>
            )}
            {emergencyOnly && (
              <Badge variant="secondary" className="gap-1 rounded-full bg-rose-50 text-rose-700 border-rose-100">
                <Siren className="h-3 w-3" /> 24/7 only
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 ml-1 rounded-full text-xs">
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          </div>
        )}
      </div>

      {/* Results header */}
      {!isLoading && stores && stores.length > 0 && (
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            {stores.length} {stores.length === 1 ? "store" : "stores"} found
          </h2>
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse border-border/60">
              <div className="h-48 bg-muted rounded-t-lg" />
              <CardContent className="p-4 space-y-3">
                <div className="h-6 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-full" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : stores?.length === 0 ? (
        <div className="text-center py-20 bg-white/60 backdrop-blur rounded-2xl border border-dashed border-border/60 max-w-2xl mx-auto">
          <div className="inline-grid place-items-center w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 mb-4">
            <StoreIcon className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">No stores match your filters</h3>
          <p className="text-muted-foreground mt-1">Try a different city or lower the discount threshold.</p>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} className="mt-5 rounded-full">
              <X className="h-3.5 w-3.5 mr-1.5" /> Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores?.map((store) => (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <Card className={`overflow-hidden card-hover cursor-pointer h-full flex flex-col group bg-white ${
                store.is24x7 ? "border-rose-300 ring-2 ring-rose-200/60 shadow-md shadow-rose-100" : "border-border/60"
              }`}>
                <div className="relative h-52 bg-muted overflow-hidden">
                  {store.imageUrl ? (
                    <img
                      src={store.imageUrl}
                      alt={store.storeName}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-sky-50 to-teal-50">
                      <StoreIcon className="h-14 w-14 text-sky-300" />
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />

                  {store.discountPercentage > 0 && (
                    <Badge className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3 py-1.5 text-sm shadow-lg shadow-emerald-500/30 border-0">
                      {store.discountPercentage}% OFF
                    </Badge>
                  )}
                  {store.city && (
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 glass text-foreground gap-1 shadow-md border-white/40"
                    >
                      <MapPin className="h-3 w-3 text-sky-500" />
                      {store.city}
                    </Badge>
                  )}
                  {store.is24x7 && (
                    <Badge
                      className="absolute bottom-3 left-3 bg-rose-500 hover:bg-rose-500 text-white gap-1 shadow-lg shadow-rose-500/40 border-0 font-bold"
                    >
                      <Siren className="h-3 w-3" />
                      24/7 OPEN
                    </Badge>
                  )}
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <h3 className="text-lg font-bold line-clamp-1 mb-1.5 text-foreground group-hover:text-sky-600 transition-colors">
                    {store.storeName}
                  </h3>
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground/70" />
                    <p className="text-sm line-clamp-2">{store.address}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">View details</span>
                    <ArrowRight className="h-4 w-4 text-sky-500 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
