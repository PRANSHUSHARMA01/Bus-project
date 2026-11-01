import React from "react";
import { STATIC_SERVICES, ServiceItem } from "@/lib/services";
import ServiceDetailClient from "./ServiceDetailClient";

export function generateStaticParams() {
  return STATIC_SERVICES.map((s) => ({ slug: s.slug }));
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = STATIC_SERVICES.find((s) => s.slug === slug) || STATIC_SERVICES[0];

  return <ServiceDetailClient service={service} />;
}
