
import clientPromise from './_lib/mongodb';

export default async function handler(req, res) {
    // SECURITY: In a real app, protect this endpoint with a secret header
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB);

        const botanicalBooks = [
            {
                title: "The Book of the Rose",
                author: "Rev. A. Foster-Melliar",
                genre: "Horticulture",
                era: "1894",
                condition: "Excellent",
                image: "https://images.unsplash.com/photo-1496062031456-07b8f162a322?auto=format&fit=crop&q=80&w=1000",
                description: "A comprehensive guide to the cultivation and history of the Victorian rose.",
                dispatched_at: new Date("2024-03-25")
            },
            {
                title: "The Language of Flowers",
                author: "Charlotte de la Tour",
                genre: "Botanical Folklore",
                era: "1819",
                condition: "Very Good",
                image: "https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&q=80&w=1000",
                description: "The seminal work that defined floriography in the 19th century.",
                dispatched_at: new Date("2024-01-15")
            },
            {
                title: "A Garden of Herbs",
                author: "Eleanour Sinclair Rohde",
                genre: "Gardening & Ritual",
                era: "1921",
                condition: "Good",
                image: "https://images.unsplash.com/photo-1515446133109-60d1bc03c20c?auto=format&fit=crop&q=80&w=1000",
                description: "Practical advice and historical lore on the medicinal and culinary use of herbs.",
                dispatched_at: new Date("2024-03-05")
            },
            {
                title: "Wild Flowers Worth Knowing",
                author: "Neltje Blanchan",
                genre: "Natural History",
                era: "1917",
                condition: "Near Mint",
                image: "https://images.unsplash.com/photo-1464618663641-bbdd760ae84a?auto=format&fit=crop&q=80&w=1000",
                description: "A beautiful exploration of North American flora with color plates.",
                dispatched_at: new Date("2024-02-10")
            }
        ];

        // 1. Clear existing items (optional, but good for total sync)
        await db.collection('vault_items').deleteMany({});

        // 2. Insert the botanical treasures
        await db.collection('vault_items').insertMany(botanicalBooks);

        // 3. Ensure some mock members exist to test the threshold (optional)
        const memberCount = await db.collection('members').countDocuments({ status: 'active' });
        
        return res.status(200).json({ 
            success: true, 
            message: "Sanctuary Vault initialized with botanical treasures.",
            items_added: botanicalBooks.length,
            current_member_count: memberCount
        });

    } catch (error) {
        console.error("Seeding Error:", error);
        return res.status(500).json({ error: "Failed to initialize the sanctuary vault." });
    }
}
