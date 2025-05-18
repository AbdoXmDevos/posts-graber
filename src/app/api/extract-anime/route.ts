// app/api/extract-anime/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let caption;
    let progress = { current: 0, total: 0 };

    try {
      const body = await request.json();
      caption = body.caption;
      progress = body.progress || { current: 0, total: 0 };
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
    }

    if (!caption || typeof caption !== 'string') {
      return NextResponse.json({ error: 'Invalid or missing caption', success: false }, { status: 400 });
    }

    console.log(`Processing caption for anime extraction (${progress.current}/${progress.total}):`, caption);

    try {
      // Call OpenRouter API directly using fetch
      // Prepare request body
      const requestBody = {
        model: 'meta-llama/llama-3.3-8b-instruct:free',
        messages: [
          {
            role: 'user',
            content: `in one word extract from this text the anime highlighted: "${caption}"`
          }
        ]
      };

      console.log('Sending request to OpenRouter API:', JSON.stringify(requestBody));

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY || ''}`,
          'HTTP-Referer': process.env.SITE_URL || 'https://instagram-json-generator.vercel.app',
          'X-Title': 'Instagram JSON Generator'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${errorData}`);
      }

      const completion = await response.json();
      console.log('Received response from OpenRouter API:', JSON.stringify(completion));

      const animeResult = completion.choices[0].message.content.trim();
      console.log(`Extracted anime: "${animeResult}" from caption: "${caption}"`);

      // Add more detailed progress information
      const progressDetails = {
        ...progress,
        status: 'completed',
        caption: caption.substring(0, 50) + (caption.length > 50 ? '...' : ''),
        result: animeResult,
        timestamp: new Date().toISOString()
      };

      // Return the result with detailed progress information
      return NextResponse.json({
        anime: animeResult,
        success: true,
        progress: progressDetails
      }, { status: 200 });
    } catch (apiError: any) {
      console.error('OpenRouter API error:', apiError);
      return NextResponse.json({
        error: 'Failed to extract anime from caption',
        details: apiError.message,
        success: false,
        progress: {
          ...progress,
          status: 'error',
          error: apiError.message,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error('General error:', err);
    return NextResponse.json({
      error: 'Failed to process request',
      details: err.message,
      success: false,
      progress: {
        current: 0,
        total: 0,
        status: 'error',
        error: err.message,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}
