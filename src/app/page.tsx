import { redirect } from "next/navigation";
// A raiz é resolvida pelo middleware (envia ao ambiente do usuário) ou ao login.
export default function Home() { redirect("/login"); }
