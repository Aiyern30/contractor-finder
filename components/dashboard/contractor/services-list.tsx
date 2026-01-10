"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  description: string | null;
  price_range_min: number | null;
  price_range_max: number | null;
  service_categories: {
    name: string;
    description: string | null;
  };
}

export function ServicesList({ services }: { services: Service[] }) {
  const router = useRouter();

  if (services.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Your Services</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/dashboard/contractor/services/add")}
          className="border-white/10 text-white hover:bg-white/5"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add More
        </Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map((service) => (
          <div
            key={service.id}
            className="p-4 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            <h4 className="font-semibold text-white mb-2">
              {service.service_categories.name}
            </h4>
            {(service.price_range_min || service.price_range_max) && (
              <p className="text-sm text-zinc-400 mb-2">
                ${service.price_range_min || "0"} - $
                {service.price_range_max || "0"}
              </p>
            )}
            {service.description && (
              <p className="text-xs text-zinc-500 line-clamp-2">
                {service.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
