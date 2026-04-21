import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Map } from "@/components/map";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, MapPin, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

const formSchema = z.object({
  storeName: z.string().min(2, "Store name is required"),
  ownerName: z.string().min(2, "Owner name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  discountPercentage: z.number().min(0).max(100),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  imageUrl: z.string().nullable(),
  whatsappNumber: z.string().nullable(),
});

type StoreFormValues = z.infer<typeof formSchema>;

interface StoreFormProps {
  initialData?: Partial<StoreFormValues>;
  onSubmit: (data: StoreFormValues) => void;
  isSubmitting: boolean;
}

export function StoreForm({ initialData, onSubmit, isSubmitting }: StoreFormProps) {
  const { toast } = useToast();
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storeName: initialData?.storeName || "",
      ownerName: initialData?.ownerName || "",
      address: initialData?.address || "",
      city: initialData?.city || "",
      discountPercentage: initialData?.discountPercentage || 0,
      latitude: initialData?.latitude || null,
      longitude: initialData?.longitude || null,
      imageUrl: initialData?.imageUrl || null,
      whatsappNumber: initialData?.whatsappNumber || null,
    },
  });

  const latitude = form.watch("latitude");
  const longitude = form.watch("longitude");
  const imageUrl = form.watch("imageUrl");
  const discountPercentage = form.watch("discountPercentage");

  const mapCenter: [number, number] = latitude && longitude 
    ? [latitude, longitude] 
    : [40.7128, -74.0060];

  const handleLocationSelect = (lat: number, lng: number) => {
    form.setValue("latitude", lat);
    form.setValue("longitude", lng);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload/image", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const res = await response.json() as { url: string };
      form.setValue("imageUrl", res.url);
      toast({
        title: "Image uploaded successfully",
      });
    } catch (err: any) {
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="City Pharmacy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+919876543210"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Include country code (e.g. +91 for India). Customers will message you on WhatsApp.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-end mb-2">
                        <FormLabel>Discount Offered (%)</FormLabel>
                        <span className="font-bold text-primary">{field.value}%</span>
                      </div>
                      <FormControl>
                        <Slider
                          min={0}
                          max={100}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Set the general discount percentage you offer to customers.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">Store Photo</h3>
                
                <div className="flex flex-col items-center justify-center">
                  {imageUrl ? (
                    <div className="relative w-full h-48 rounded-md overflow-hidden mb-4 border">
                      <img src={imageUrl} alt="Store preview" className="w-full h-full object-cover" />
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="sm" 
                        className="absolute top-2 right-2"
                        onClick={() => form.setValue("imageUrl", null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-muted border-2 border-dashed rounded-md flex flex-col items-center justify-center mb-4 text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mb-2 opacity-50" />
                      <p className="text-sm">No image uploaded</p>
                    </div>
                  )}

                  <div className="w-full">
                    <Label htmlFor="image-upload" className="cursor-pointer">
                      <div className="flex items-center justify-center gap-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 py-2 px-4 rounded-md transition-colors w-full text-sm font-medium border border-border">
                        {uploading ? "Uploading..." : (
                          <>
                            <Upload className="h-4 w-4" />
                            {imageUrl ? "Change Image" : "Upload Image"}
                          </>
                        )}
                      </div>
                    </Label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={uploading}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="h-full">
              <CardContent className="p-6 space-y-4 h-full flex flex-col">
                <h3 className="font-semibold text-lg border-b pb-2">Location</h3>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, Area, State, ZIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mumbai" {...field} />
                      </FormControl>
                      <FormDescription>
                        Customers can filter the directory by city.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex-1 flex flex-col min-h-[300px] mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label>Pin Location on Map</Label>
                    <span className="text-xs text-muted-foreground flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {latitude && longitude ? "Location selected" : "Click map to set"}
                    </span>
                  </div>
                  <div className="flex-1 rounded-md overflow-hidden border border-input focus-within:ring-1 focus-within:ring-ring">
                    <Map
                      center={mapCenter}
                      marker={latitude && longitude ? [latitude, longitude] : undefined}
                      interactive={true}
                      onLocationSelect={handleLocationSelect}
                      className="w-full h-full min-h-[300px]"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Click on the map to pinpoint your exact store location.
                  </p>
                  
                  {/* Hidden fields for validation */}
                  <FormField
                    control={form.control}
                    name="latitude"
                    render={({ field }) => (
                      <FormItem className="hidden">
                        <FormControl>
                          <Input type="hidden" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t pt-6">
          <Button type="submit" size="lg" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Store Listing"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
