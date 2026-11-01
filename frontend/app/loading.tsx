import { Skeleton } from "../components/ui/Skeleton";

export default function Loading() {
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "24px 20px" }}>
      <Skeleton height={48} borderRadius={999} style={{ marginBottom: 16 }} />
      <Skeleton height={56} borderRadius={999} style={{ marginBottom: 24 }} />
      <Skeleton height={140} borderRadius={20} style={{ marginBottom: 20 }} />
      <div style={{ textAlign: "center", marginTop: 20, color: "var(--text-muted)", fontSize: 14 }}>
        Finding buses near you…
      </div>
    </div>
  );
}
