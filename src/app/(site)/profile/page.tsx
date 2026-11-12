import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePasswordForm, ProfileForm } from "@/components/profile/profile-forms";
import { Container } from "@/components/shared/container";
import { PageHeader } from "@/components/shared/page-header";
import { PageSkeleton } from "@/components/shared/page-skeleton";
import { requireUser } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { getProfile } from "@/services/profile.service";

export const metadata: Metadata = { title: "My profile", robots: { index: false, follow: false } };

/** FR-AUTH-09: view and edit profile, change password. Any logged-in user. */
export default function ProfilePage() {
  return (
    <Container className="max-w-2xl py-10">
      <Suspense fallback={<PageSkeleton />}>
        <Profile />
      </Suspense>
    </Container>
  );
}

async function Profile() {
  const user = await requireUser("/profile");
  await dbConnect();
  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  return (
    <div className="space-y-6">
      <PageHeader
        title="My profile"
        description={`Member since ${formatDate(new Date(profile.memberSince.slice(0, 10)))}`}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal details</CardTitle>
          <CardDescription>Used by the hotel to contact you about your bookings.</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm email={profile.email} defaults={{ name: profile.name, phone: profile.phone }} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>Choose a strong password you do not use elsewhere.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
