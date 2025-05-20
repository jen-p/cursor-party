# My Bookshelf - Notion-Powered Reading Tracker

This prototype is a reading tracker that displays books from a Notion database in a beautiful gallery format. It uses the Notion API to fetch and display your reading list with cover images, ratings, reviews, and more.

## Setup Instructions

1. First, install the required dependencies:
   ```bash
   npm install @notionhq/client
   ```

2. Set up your Notion integration:
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Name it "My Bookshelf"
   - Select the workspace where your book database lives
   - Copy the "Internal Integration Token" - this will be your `NOTION_API_KEY`

3. Share your Notion database with the integration:
   - Open your Notion database
   - Click "Share" in the top right
   - Click "Add people, emails, groups, or integrations"
   - Search for your integration name and select it
   - Copy the database ID from the URL (it's the string of characters after the last slash and before the question mark)

4. Create a `.env.local` file in the root of your project and add:
   ```
   NOTION_API_KEY=your_integration_token_here
   NOTION_DATABASE_ID=your_database_id_here
   ```

5. Make sure your Notion database has the following properties:
   - Title (title)
   - Author (text)
   - Genre (select)
   - Cover Image (files)
   - Rating (number)
   - Review (text)

## Features
- Gallery view of all your books
- Cover image display
- Book details including title, author, and genre
- Star rating display
- Review preview
- Responsive grid layout
- Hover effects and smooth animations

## Technologies Used
- Next.js 13+ (App Router)
- Notion API
- TypeScript
- CSS Modules 