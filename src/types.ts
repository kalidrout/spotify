export interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  albumArt: string;
  audioUrl: string; // Added this field
}

export interface Playlist {
  id: string;
  name: string;
  coverImage: string;
  tracks: Track[];
}