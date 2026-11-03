import ConsultationView from "@/components/ConsultationView";

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ConsultationView id={id} />;
}
