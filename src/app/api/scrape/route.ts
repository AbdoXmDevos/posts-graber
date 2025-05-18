// app/api/scrape/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!
);

// Instagram scraper actor ID - using the exact actor ID from the example
const INSTAGRAM_SCRAPER_ACTOR_ID = 'nH2AHrwxeTRJoN5hX';
const APIFY_API_URL = `https://api.apify.com/v2/acts/${INSTAGRAM_SCRAPER_ACTOR_ID}/runs`;

export async function POST(request: NextRequest) {
    try {
        // Parse request body safely
        let username, fields, limit = 30, extractAnime = false;

        try {
            const body = await request.json();
            username = body.username;
            fields = body.fields;
            limit = body.limit || 30;
            extractAnime = body.extractAnime || false;
        } catch (parseError) {
            console.error('Error parsing request body:', parseError);
            return NextResponse.json({ error: 'Invalid request body format' }, { status: 400 });
        }

        if (!username || typeof username !== 'string') {
            return NextResponse.json({ error: 'Invalid or missing username', success: false }, { status: 400 });
        }

        console.log('Processing request for username:', username);

        // Skip Supabase connection test since we're not using storage anymore
        console.log('Skipping Supabase storage connection test...');

        // Prepare Actor input - using the exact format from the example
        const input: any = {
            username: [username]
        };

        // Only set resultsLimit if it's not 0 (unlimited)
        if (limit > 0) {
            input.resultsLimit = limit;
            console.log(`Setting result limit to ${limit} posts`);
        } else {
            console.log('No limit set - will attempt to fetch all posts (unlimited)');
        }

        console.log(`Starting Instagram scrape for username: ${username}`);

        try {
            // Run the Actor using direct API call
            const runResponse = await fetch(`${APIFY_API_URL}?token=${process.env.APIFY_TOKEN}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(input),
            });

            if (!runResponse.ok) {
                const errorText = await runResponse.text();
                console.error('Apify run API error:', errorText);
                throw new Error(`Failed to start Apify actor: ${runResponse.status} ${runResponse.statusText}`);
            }

            const runData = await runResponse.json();
            console.log(`Actor run started with ID: ${runData.data.id}`);

            // Wait for the run to complete
            let runDetail;
            let isFinished = false;
            let retries = 0;
            const maxRetries = 30; // Maximum number of retries (30 * 2 seconds = 60 seconds max wait)

            while (!isFinished && retries < maxRetries) {
                // Wait 2 seconds between checks
                await new Promise(resolve => setTimeout(resolve, 2000));

                // Check run status
                const statusResponse = await fetch(
                    `https://api.apify.com/v2/actor-runs/${runData.data.id}?token=${process.env.APIFY_TOKEN}`
                );

                if (!statusResponse.ok) {
                    const errorText = await statusResponse.text();
                    console.error('Apify status API error:', errorText);
                    throw new Error(`Failed to check run status: ${statusResponse.status} ${statusResponse.statusText}`);
                }

                runDetail = await statusResponse.json();
                isFinished = runDetail.data.status === 'SUCCEEDED' ||
                             runDetail.data.status === 'FAILED' ||
                             runDetail.data.status === 'ABORTED';

                retries++;
                console.log(`Run status check ${retries}/${maxRetries}: ${runDetail.data.status}`);

                if (runDetail.data.status === 'FAILED' || runDetail.data.status === 'ABORTED') {
                    throw new Error(`Apify run failed with status: ${runDetail.data.status}`);
                }
            }

            if (!isFinished) {
                throw new Error('Apify run timed out. Please try to regenerate with a smaller limit.');
            }

            // Get dataset items
            const datasetId = runDetail.data.defaultDatasetId;
            const itemsResponse = await fetch(
                `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_TOKEN}`
            );

            if (!itemsResponse.ok) {
                const errorText = await itemsResponse.text();
                console.error('Apify dataset API error:', errorText);
                throw new Error(`Failed to fetch dataset items: ${itemsResponse.status} ${itemsResponse.statusText}`);
            }

            const items = await itemsResponse.json();
            console.log(`Retrieved ${items.length} posts from Instagram`);

            if (!items || items.length === 0) {
                return NextResponse.json({
                    error: 'No data found for this username',
                    message: 'The Instagram profile may be private, not exist, or have no posts'
                }, { status: 404 });
            }

            // Filter fields based on user selection
            const filteredData = items.map((post: any) => {
                const obj: any = {};
                if (fields.imageUrl) obj.imageUrl = post.imageUrl || post.displayUrl;
                if (fields.caption) obj.caption = post.caption || post.text;
                if (fields.timestamp) obj.timestamp = post.timestamp;
                if (fields.likes) obj.likes = post.likesCount;
                if (fields.comments) obj.comments = post.commentsCount;
                return obj;
            });

            console.log(`Processing data for ${username} with ${filteredData.length} posts`);

            // Process anime extraction if enabled
            if (extractAnime && filteredData.some((post: any) => post.caption)) {
                console.log('Extracting anime names from captions...');

                // Get posts with captions for processing
                const postsWithCaptions = filteredData.filter((post: any) => post.caption);
                const totalPosts = postsWithCaptions.length;
                console.log(`Found ${totalPosts} posts with captions to process`);

                // Process each post with a caption
                let processedCount = 0;

                for (const post of postsWithCaptions) {
                    processedCount++;
                    console.log(`Processing anime extraction for post ${processedCount}/${totalPosts}`);

                    try {
                        // Call the anime extraction API
                        const animeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/extract-anime`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                caption: post.caption,
                                progress: {
                                    current: processedCount,
                                    total: totalPosts
                                }
                            }),
                        });

                        if (animeResponse.ok) {
                            const animeData = await animeResponse.json();
                            if (animeData.success && animeData.anime) {
                                // Add the anime field to the post
                                post.anime = animeData.anime;
                                console.log(`Extracted anime "${animeData.anime}" from post ${processedCount}/${totalPosts}`);
                            }
                        } else {
                            console.error(`Failed to extract anime from caption (${processedCount}/${totalPosts}):`, post.caption);
                        }
                    } catch (animeError) {
                        console.error(`Error extracting anime (${processedCount}/${totalPosts}):`, animeError);
                        // Continue with the next post even if there's an error
                    }
                }

                console.log(`Finished anime extraction for all ${totalPosts} posts`);
            }

            // Generate a suggested filename for download
            const fileName = `instagram_${username}_${Date.now()}.json`;

            // Save the data to Supabase
            try {
                console.log('Saving data to Supabase...');
                const { error: insertError } = await supabase
                    .from('amine-json-files')
                    .insert({
                        instagram_username: username,
                        json_text: filteredData,
                        result_number: filteredData.length
                    });

                if (insertError) {
                    console.error('Error saving to Supabase:', insertError);
                    // Continue even if there's an error saving to Supabase
                }

                console.log('Data saved to Supabase successfully');
            } catch (dbError) {
                console.error('Database error:', dbError);
                // Continue even if there's an error saving to Supabase
            }

            // Return the data directly with anime extraction progress info if applicable
            return NextResponse.json({
                data: filteredData,
                fileName: fileName,
                timestamp: new Date().toISOString(),
                username: username,
                postCount: filteredData.length,
                savedToDatabase: true,
                animeExtracted: extractAnime && filteredData.some((post: any) => post.anime)
            }, { status: 200 });
        } catch (apifyError: any) {
            console.error('Apify error:', apifyError);

            // Check if it's a 404 error
            if (apifyError.message && apifyError.message.includes('404')) {
                return NextResponse.json({
                    error: 'Instagram API returned 404',
                    message: 'The Instagram profile may be private, not exist, or Instagram has blocked the request',
                    details: apifyError.message
                }, { status: 404 });
            }

            throw apifyError; // Re-throw to be caught by the outer catch block
        }
    } catch (err: any) {
        console.error('General error:', err);
        return NextResponse.json({
            error: 'Failed to fetch data from Instagram',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        }, { status: 500 });
    }
}
