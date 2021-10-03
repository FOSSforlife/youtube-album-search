import { youtube_v3 } from 'googleapis';
import { compareTwoStrings } from 'string-similarity';
import { youtube as youtubeFilter } from 'metadata-filter';
import { decode as htmlDecode } from 'html-entities';

type Reason = 'albumInTitle' | 'tracklistInDescription' | 'videoLength';

interface Match {
	item: youtube_v3.Schema$SearchResult;
	reason: Reason;
	stringSimilarity?: number;
	title: string;
	filteredTitle: string;
	index: number;
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

	for (let [itemIndex, item] of Object.entries(results.data.items) as Array<[string, youtube_v3.Schema$SearchResult]>) {
		const title = htmlDecode(
			item
				.snippet!.title!.normalize()
				.replace(/[\u0300-\u036f]/g, '') // normalizes 𝓌𝑒𝒾𝓇𝒹 𝒸𝒽𝒶𝓇𝒶𝒸𝓉𝑒𝓇𝓈 https://stackoverflow.com/a/37511463
				.toLowerCase()
		);
		const filteredTitle = youtubeFilter(title);

		let reason: Reason;
		if (albumInTitle(item)) {
			reason = 'albumInTitle';
		} else if (tracklistInDescription(item)) {
			reason = 'tracklistInDescription';
		} else {
			continue;
		}

		const stringSimilarity = options.sortByStringSimilarity
			? compareTwoStrings(query, filteredTitle.replace(' - ', ''))
			: undefined;

		matches.push({ item, index: Number(itemIndex), reason, stringSimilarity, title, filteredTitle });
	}

	matches.sort((a, b) => b.stringSimilarity! - a.stringSimilarity!);

	return matches;
}
