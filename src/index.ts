import { youtube_v3 } from 'googleapis';

type Reason = 'albumInTitle' | 'tracklistInDescription' | 'videoLength';

interface Match {
	item: youtube_v3.Schema$SearchResult;
	reason: Reason;
}

const albumInTitle = (item: youtube_v3.Schema$SearchResult) =>
	item.snippet?.title?.includes('album') || item.snippet?.title?.includes('Album');

const tracklistInDescription = (item: youtube_v3.Schema$SearchResult) =>
	item.snippet?.description?.includes('Tracklist') ||
	item.snippet?.description?.includes('Track list') ||
	item.snippet?.description?.includes('Timestamps');

// TODO: Figure out why this won't type to youtube_v3.Youtube
export async function albumSearch(query: string, youtube: any) {
	const results = await youtube.search.list({
		part: 'id,snippet',
		q: `${query} album`,
		maxResults: 10,
		type: 'video',
	});

	const matches: Array<Match> = [];

	matches.push(...results.data.items.filter(albumInTitle));
	matches.push(...results.data.items.filter(tracklistInDescription));
	// TODO: Remove duplicates

	return matches;
}
