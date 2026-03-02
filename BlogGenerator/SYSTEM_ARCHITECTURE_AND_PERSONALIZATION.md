# KnotStranded Automated Blog System: Architecture & Personalization Strategy

This document provides a comprehensive overview of how the KnotStranded automated blog platform functions, from content ingestion to publishing, and outlines a roadmap for implementing IP-based content personalization.

---

## Part 1: How the Site Currently Works

The platform operates as a Python/Flask web application running on a cloud container service (like Railway). The core architecture is designed around generating, compiling and serving standalone articles based on trending data.

### 1. The Core Infrastructure
- **Web App**: Built with Flask (`dashboard_app.py`), the central server routes requests, handles the administrative dashboard, and serves user-facing traffic.
- **Storage & Compilation**: The generated articles are displayed on the front page and in article view, waiting to be expanded in the article display box to dynamically show the article's content with generated images, affiliate links, and CSS templates.
- **Frontend Presentation**: The homepage (`landing.html`) and the article wrappers (`post_wrapper.html`) use Tailwind CSS to create a unified, responsive "US Trending News" aesthetic.
- **Background Processes**: Scripts like `populate_live.py` run continuously to keep the system populated with fresh amazon and clickbank afilliate links without requiring manual administrative clicking.

---

## Part 2: How Stories Get Written (The AI Pipeline)

The content engine operates through a heavily automated, multi-step AI pipeline called the Generation Worker.

### 1. Topic Ingestion & Trend Scouting
- The system connects to public RSS feeds (like Google News) via `search_with_rss` to find what is currently trending based on specific categories (e.g., `us_politics`, `finance`, `tech`).
- It extracts the top headlines, articles, links, and publication dates to use as raw seeds.

### 2. AI Content Generation
- The raw seeds are passed to an LLM provider (Anthropic's Claude, Google's Gemini, or OpenAI's GPT models).
- The system injects a specialized **Writer Persona** (e.g., "Expert", "Investigative", "Satirical") loaded from `writers.json` to configure the tone of the article.
- The LLM receives a prompt demanding a 2000-word deep dive, optimized for SEO, and instructed to naturally weave in affiliate links (ClickBank, Amazon, Premium Subscriptions).

### 3. Artwork & Visual Synthesis
- Once the text is successfully written, the system determines the category of the article and generates 1 "cover feature" image and 2 "detail" images using Gemini Imagen 3. or OpenAI DALL-E.  The prompt sent to the image AI is modified based on the article's category.
- The images are stores in the 'images' folder to used on the article display page once clicked on the title of the article.

### 4. Compilation & Publishing
- The AI-generated text is retrieved from its raw text file storage.
- When a user views the site, the system dynamically formats the text, injecting active affiliate links organically replacing placeholder tags (e.g., `[CB1]`, `[AMZ1]`).
- The placeholder visual tags (like `[PHOTO1]`) are resolved directly to the generated AI images.
- A final HTML block is rendered dynamically on-the-fly (`create_styled_html`) ensuring that different visitors can potentially receive different link loads or styling components.
- The next time a visitor accesses the homepage, the Flask server triggers this compilation and immediately populates it in the "Top Stories Today" or "Recent Archive" sections based on the time of day and IP address of

---

## Part 3: Roadmap for Implementing IP-Based Personalization

To accomplish your goal of ensuring that every visitor sees a distinct and unique list of headlines tailored to their specific IP address, the system architecture needs to move from a "globally static feed" to a "dynamically scored feed".

Here is the step-by-step plan to achieve this feature:

### Step 1: Track and Identify Visitors by IP
- Inject middleware into the Flask `home()` route to capture the visitor's IP address (`request.remote_addr` or the `X-Forwarded-For` header if behind a load balancer).
- Establish a lightweight database (like SQLite) to map IPs to "Visitor Profiles." The profile should include the IP address, geolocation data, and a list of seen articles.

### Step 2: Establish Geolocation Context
- Utilize an API like **IP-API** or **MaxMind GeoIP** to perform a lightweight lookup on the visitor's IP address.
- Extract their State, City, and Region (e.g., "Dallas, TX").
- If the visitor is in Texas, the algorithm should prioritize heavily assigning them articles generated under local news, energy sectors, or specific regional political shifts for example.
- Inject affiliate links into the article based on the visitor's geolocation, search history, and average income level.


### Step 3: Implement The "Seen Article" Memory Ledger
- Track which articles an IP address has previously clicked on or scrolled past.
- If IP `192.168.1.5` visits the site, the database logs that they were presented with Article A, B, and C.
- The next time they refresh or visit, the server checks the 'Seen' array and explicitly filters out A, B, and C, ensuring the page only populates with Articles D, E, and F.

### Step 4: Interest-Based Dynamic Sorting Algorithm
- Modify the `home()` route in `dashboard_app.py`. Instead of naively returning the 10 most recently generated files to all users (`latest_posts[:10]`), generate a personalized sort.
- **The Scoring Logic:**
  - Base Score = Time since generation (newer is better).
  - Multiplier 1 = Category Match (If the IP clicked a 'Finance' article previously, boost all Finance articles).
  - Multiplier 2 = Geography Match (If the IP is in NY, boost 'Tech' or 'Finance', etc).
  - Filter = Remove universally 'Seen' articles.
- Yield the top 10 articles from this specific mathematical sort and pass it to rendering.

### Step 5: Background Batch Pool Enlargement
- Personalization requires **options**. A user cannot see a unique list if the site only generates 5 articles a day.
- To execute IP-based uniqueness, the `populate_live.py` mechanism must be scaled up to generate at least 40-50 varied articles per day across micro-niches to ensure the database has enough diverse, un-seen content to serve returning IPs.

### Summary of Changes Required
1. Add a SQLite/Redis cache to map `IP -> Category Affinity -> Seen IDs`.
2. Intercept the IP inside `home()` before loading `landing.html`.
3. Read the cache, sort the `generated_posts/` files using a weighting algorithm, and pass that personalized array to the template.

-Find other profitable affiliate networks to inject into the article.  List them on the dashboard for sign up and integration.
-Add an option to add affiliate networks to the list of networks to inject into the articles.