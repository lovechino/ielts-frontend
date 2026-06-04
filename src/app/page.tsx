import { redirect } from "next/navigation";

// Root → redirect thẳng vào Admin
export default function Home() {
  redirect("/admin");
}
