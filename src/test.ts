// TODO: Delete this file once we have actual tests

import { google } from 'googleapis';
import { albumSearch } from '.';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
	const youtube = google.youtube({
		version: 'v3',
		auth: process.env.YOUTUBE_API_KEY,
	});

	console.log((await albumSearch('jane doe', youtube)).data.items[0]);
})();
