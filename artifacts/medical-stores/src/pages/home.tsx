import { useState } from "react";
import { Link } from "wouter";
import { useListStores } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Store as StoreIcon } from "lucide-react";

export default function Home() {
  const [search, setSearch] = useState("");
  const [minDiscount, setMinDiscount] = useState<number[]>([0]);

  const { data: stores, isLoading } = useListStores({
    search: search || undefined,
    minDiscount: minDiscount[0] > 0 ? minDiscount[0] : undefined,
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
          Discover Medical Stores
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Find trusted local pharmacies and medical stores with the best discounts.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4 mb-8">
        <div className="md:col-span-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by store name or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
        </div>
        <div className="space-y-3 p-4 bg-card rounded-lg border shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium">Min Discount</label>
            <span className="text-sm font-bold text-primary">{minDiscount[0]}%</span>
          </div>
          <Slider
            value={minDiscount}
            onValueChange={setMinDiscount}
            max={100}
            step={1}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
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
        <div className="text-center py-20 bg-card rounded-lg border border-dashed">
          <StoreIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground">No stores found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stores?.map((store) => (
            <Link key={store.id} href={`/stores/${store.id}`}>
              <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer h-full flex flex-col group">
                <div className="relative h-48 bg-muted overflow-hidden">
                  {store.imageUrl ? (
                    <img
                      src={store.imageUrl}
                      alt={store.storeName}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary text-secondary-foreground">
                      <StoreIcon className="h-12 w-12 opacity-20" />
                    </div>
                  )}
                  {store.discountPercentage > 0 && (
                    <Badge className="absolute top-3 right-3 bg-green-500 hover:bg-green-600 text-white font-bold px-3 py-1 text-sm shadow-sm">
                      {store.discountPercentage}% OFF
                    </Badge>
                  )}
                </div>
                <CardContent className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold line-clamp-1 mb-2 text-foreground group-hover:text-primary transition-colors">
                    {store.storeName}
                  </h3>
                  <div className="flex items-start gap-2 text-muted-foreground mt-auto">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm line-clamp-2">{store.address}</p>
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
