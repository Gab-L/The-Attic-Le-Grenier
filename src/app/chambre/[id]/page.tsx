import { notFound } from "next/navigation";
import { z } from "zod";
import { publicRoom } from "@/lib/game";
import { GameError } from "@/lib/rules";
import { PublicRoom } from "@/components/public-room";
export const dynamic = "force-dynamic";
async function load(id: string) {
  if (!z.string().uuid().safeParse(id).success) notFound();
  try {
    return await publicRoom(id);
  } catch (e) {
    if (e instanceof GameError && e.status === 404) notFound();
    throw e;
  }
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const room = await load(id);
  return {
    title: `La chambre de ${room.handle} — Le Grenier`,
    description: "Un petit coin de souvenirs à découvrir.",
    robots: { index: false, follow: false },
    openGraph: {
      title: `La chambre de ${room.handle}`,
      description: "Une collection de petits trésors, une chambre à soi.",
      url: `/chambre/${id}`,
    },
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await load(id);
  return <PublicRoom shareId={id} data={JSON.parse(JSON.stringify(data))} />;
}
