import { Client } from '@notionhq/client';
import { NextResponse } from 'next/server';

// Initialize the Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DATABASE_ID = process.env.NOTION_DATABASE_ID;

export async function GET() {
  try {
    if (!DATABASE_ID) {
      throw new Error('Notion Database ID not found');
    }

    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      sorts: [
        {
          property: 'Title',
          direction: 'ascending',
        },
      ],
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching books:', error);
    return NextResponse.json(
      { error: 'Failed to fetch books from Notion' },
      { status: 500 }
    );
  }
} 