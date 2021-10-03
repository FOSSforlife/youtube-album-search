import { youtube_v3 } from 'googleapis';

// youtube_v3.Youtube
export async function albumSearch(query: string, youtube: any) {
	const results = await youtube.channels.list({
		part: 'snippet,contentDetails,statistics',
		forUsername: 'GoogleDevelopers',
	});
	return results;
}
