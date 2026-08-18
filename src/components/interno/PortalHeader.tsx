import Image from "next/image";
import { NotifBell } from "@/components/interno/NotifBell";
import { UserMenu } from "@/components/interno/UserMenu";

export function PortalHeader({ titulo, boxBrand = false }: { titulo: string; boxBrand?: boolean }) {
  return (
    <header className="h-16 bg-white border-b border-neutro-border flex items-center gap-3 px-4 md:px-5">
      {boxBrand
        ? <span className="bg-white border border-neutro-border rounded-lg p-1.5"><Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={120} height={22} className="h-[22px] w-auto" /></span>
        : <Image src="/brand/logo-maracas.png" alt="Prefeitura de Maracás" width={160} height={30} className="h-[30px] w-auto" />}
      <span className="w-px h-6 bg-neutro-border hidden sm:block" aria-hidden />
      <b className="text-[14px] sm:text-[15px]">{titulo}</b>
      <div className="flex-1" />
      <NotifBell />
      <UserMenu />
    </header>
  );
}
