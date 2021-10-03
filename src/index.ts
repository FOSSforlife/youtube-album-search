import { youtube_v3 } from 'googleapis';
import { compareTwoStrings } from 'string-similarity';

type Reason = 'albumInTitle' | 'tracklistInDescription' | 'videoLength';

interface Match {
	item: youtube_v3.Schema$SearchResult;
	reason: Reason;
	stringSimilarity?: number;
	title: string;
}

interface AlbumSearchOptions {
	sortByStringSimilarity: boolean;
}

const defaultAlbumSearchOptions: AlbumSearchOptions = {
	sortByStringSimilarity: true,
};

const albumInTitle = (item: youtube_v3.Schema$SearchResult) =>
	item.snippet?.title?.includes('album') || item.snippet?.title?.includes('Album');

const tracklistInDescription = (item: youtube_v3.Schema$SearchResult) =>
	item.snippet?.description?.includes('Tracklist') ||
	item.snippet?.description?.includes('Track list') ||
	item.snippet?.description?.includes('Timestamps');

const addMatch = (item: youtube_v3.Schema$SearchResult) => ({ item });

// TODO: Figure out why this won't type to youtube_v3.Youtube
export async function albumSearch(
	query: string,
	youtube: any,
	options: AlbumSearchOptions = defaultAlbumSearchOptions
) {
	const results = await youtube.search.list({
		part: 'id,snippet',
		q: `${query} album`,
		maxResults: 10,
		type: 'video',
	});

	const matches: Array<Match> = [];

	for (const item of results.data.items) {
		const title = item
			.snippet!.title!.normalize()
			.replace(/[\u0300-\u036f]/g, '') // normalizes 𝓌𝑒𝒾𝓇𝒹 𝒸𝒽𝒶𝓇𝒶𝒸𝓉𝑒𝓇𝓈 https://stackoverflow.com/a/37511463
			.toLowerCase();

		let reason: Reason;
		if (albumInTitle(item)) {
			reason = 'albumInTitle';
		} else if (tracklistInDescription(item)) {
			reason = 'tracklistInDescription';
		} else {
			continue;
		}

		const stringSimilarity = options.sortByStringSimilarity ? compareTwoStrings(query, title) : undefined;

		matches.push({ item, reason, stringSimilarity, title });
	}

	matches.sort((a, b) => b.stringSimilarity! - a.stringSimilarity!);

	return matches;
}
