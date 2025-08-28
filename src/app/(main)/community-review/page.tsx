
import { getCurrentUser } from "@/lib/data";
import { db } from "@/lib/db";
import { reportedPosts, users } from "@/lib/schema";
import { eq, and, lt } from "drizzle-orm";
import { CommunityReviewClient } from "./community-review-client";

async function getReports() {
    // Prune old reports before fetching
    const fortyFiveDaysAgo = new Date(Date.now() - 45 * 24 * 60 * 60 * 1000);
    await db.delete(reportedPosts).where(and(
        eq(reportedPosts.status, 'pending'),
        lt(reportedPosts.createdAt, fortyFiveDaysAgo)
    ));

    return db.query.reportedPosts.findMany({
        where: eq(reportedPosts.status, 'pending'),
        with: {
            postAuthor: true,
            reporter: true,
            votes: true,
        },
    });
}

export default async function CommunityReviewPage() {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
        // This should not happen if middleware is set up correctly
        return null;
    }
    
    // Asynchronously update the last seen timestamp, no need to wait
    db.update(users)
      .set({ lastSeenCommunityReviewTimestamp: new Date() })
      .where(eq(users.id, currentUser.id))
      .catch(console.error);
      
    const reports = await getReports();

    return <CommunityReviewClient initialReports={reports} currentUser={currentUser} />;
}
