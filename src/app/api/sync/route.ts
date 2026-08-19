import { adminDb } from '@/lib/firebaseAdmin';
import { NextResponse } from 'next/server';
// import { revalidatePath } from 'next/cache';

export async function GET(request: Request) {
  // 1. Authenticate the Cron Job
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // 2. Fetch your latest repositories from GitHub
    const res = await fetch(
      'https://api.github.com/users/thusithakit/repos?sort=updated&per_page=10', 
      {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        }
      }
    );

    if (!res.ok) throw new Error('Failed to fetch from GitHub');
    const repos = await res.json();

    if(adminDb){
        const batch = adminDb.batch();
        const projectsRef = adminDb.collection('projects');

        repos.forEach((repo: any) => {
        // Map GitHub fields to your preferred schema
        const projectData = {
            name: repo.name,
            description: repo.description || "",
            url: repo.html_url,
            language: repo.language,
            stars: repo.stargazers_count,
            lastUpdated: new Date(repo.updated_at),
            // Default value for a field managed only in your CMS, not GitHub
            isVisible: true 
        };

        // Use the GitHub Repo ID as the Firestore Document ID
        // This ensures we update existing records rather than duplicating
        const docRef = projectsRef.doc(repo.id.toString());
        
        // Set with merge: true (Upsert)
        // If the doc exists, it updates these fields. If not, it creates it.
        // Crucially, it won't overwrite fields (like an image URL) you added manually later.
        batch.set(docRef, projectData, { merge: true });
        });

        // 3. Commit all changes to Firestore at once
        await batch.commit();
    }

    return NextResponse.json({ success: true, synced: repos.length });
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}