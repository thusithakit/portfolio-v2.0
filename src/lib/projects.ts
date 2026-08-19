import { adminDb } from "./firebaseAdmin";

// Standardized data shape: Changed 'link' to 'url' and made 'id' a string
const defaultProjects = [
  {
    id: "1",
    name: "VibeQueue",
    description: "VibeQueue lets your group curate a hangout playlist together, blind...",
    tech: ["Next.js", "TypeScript", "Firebase RTDB", "Clerk", "Zustand", "Push Notifications"],
    url: "https://vibequeue.vercel.app/",
    stars: 0,
    lastUpdated: null
  },
  {
    id: "2",
    name: "ConnectWithMe.digital",
    description: "A modern personal branding and digital profile sharing platform...",
    tech: ["Next.js", "TypeScript", "Prisma", "Clerk", "Cloudinary"],
    url: "https://www.connectwithme.digital",
    stars: 0,
    lastUpdated: null
  },
  {
    id: "3",
    name: "Sanit.lk Business Website",
    description: "Freelance client business site with 20+ reusable custom UI components, achieving a 98+ Lighthouse performance score and full meta SEO optimization.",
    tech: ["Next.js", "TypeScript", "Tailwind CSS", "SEO"],
    url: "https://sanit-demo.netlify.app/",
    stars: 0,
    lastUpdated: null
  },
  {
    id: "4",
    name: "Smart Garbage Bin",
    description: "IoT smart system integrating ultrasonic sensors, GPS tracking, and Firebase to monitor waste levels, coupled with a Progressive Web App (PWA) responsive dashboard.",
    tech: ["Next.js", "TypeScript", "ESP8266", "Firebase", "PWA"],
    url: "https://github.com/thusithakit/go-green",
    stars: 0,
    lastUpdated: null
  },
  {
    id: "5",
    name: "Travel Planner Website",
    description: "Full-stack travel planner platform containing interactive customer itinerary boards, comprehensive admin panel management, and secure JWT token validation flows.",
    tech: ["React", "Spring Boot", "MongoDB", "TypeScript"],
    url: "https://github.com/thusithakit/Odyssey-admin-panel",
    stars: 0,
    lastUpdated: null
  }
];

export async function getProjects() {
  try {
    // 1. Check if adminDb initialized correctly
    if (!adminDb) {
      console.warn("Firebase Admin not initialized. Using default projects.");
      return defaultProjects;
    }

    // 2. Fetch from Firestore
    const snapshot = await adminDb.collection('projects')
      .where('isVisible', '==', true)
      .orderBy('stars', 'desc')
      .get();

    // 3. Handle empty database state
    if (snapshot.empty) {
      console.log("No projects found in Firestore. Using defaults.");
      return defaultProjects;
    }

    // 4. Map the data to match the defaultProjects shape
    const projects = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        url: data.url,
        // Wrap GitHub language in an array so it matches the 'tech' array structure
        tech: data.language ? [data.language] : [], 
        stars: data.stars || 0,
        lastUpdated: data.lastUpdated ? data.lastUpdated.toDate().toISOString() : null,
      };
    });

    return projects;

  } catch (error) {
    // 5. Catch failures and safely fallback
    console.error("Failed to fetch projects from Firestore, falling back to defaults:", error);
    return defaultProjects;
  }
}