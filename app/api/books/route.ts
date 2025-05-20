import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

// Initialize the Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function GET() {
  try {
    // Check if environment variables are set
    if (!process.env.NOTION_API_KEY) {
      console.error('NOTION_API_KEY is not set');
      return NextResponse.json(
        { error: 'Notion API key is not configured' },
        { status: 500 }
      );
    }

    if (!DATABASE_ID) {
      console.error('NOTION_DATABASE_ID is not set');
      return NextResponse.json(
        { error: 'Notion Database ID is not configured' },
        { status: 500 }
      );
    }

    console.log('Querying Notion database:', DATABASE_ID);
    
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        {
          property: 'Title',
          direction: 'ascending',
        },
      ],
    });

    console.log('Notion API response received');
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching books from Notion:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch books from Notion' },
      { status: 500 }
    );
  }
} 