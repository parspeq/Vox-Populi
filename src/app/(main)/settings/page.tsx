import { getCurrentUser } from "@/lib/data";
import { SettingsClient } from "./settings-client";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/login');
    }

    return <SettingsClient currentUser={currentUser} />;
}
