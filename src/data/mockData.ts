import { Playlist } from '../types';

export const playlists: Playlist[] = [
  {
    id: '1',
    name: 'Discover Weekly',
    coverImage: 'https://picsum.photos/seed/1/300/300',
    tracks: [
      {
        id: '1',
        title: 'Guitar Improvisation',
        artist: 'Artist One',
        duration: '1:34',
        albumArt: 'https://picsum.photos/seed/11/300/300',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d1718ab41b.mp3'
      },
      {
        id: '2',
        title: 'Peaceful Piano',
        artist: 'Artist Two',
        duration: '2:11',
        albumArt: 'https://picsum.photos/seed/12/300/300',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8395863.mp3'
      },
      {
        id: '3',
        title: 'Electronic Beat',
        artist: 'Artist Three',
        duration: '3:45',
        albumArt: 'https://picsum.photos/seed/13/300/300',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8395863.mp3'
      }
    ]
  },
  {
    id: '2',
    name: 'Chill Vibes',
    coverImage: 'https://picsum.photos/seed/2/300/300',
    tracks: [
      {
        id: '4',
        title: 'Ambient Dreams',
        artist: 'Artist Four',
        duration: '2:49',
        albumArt: 'https://picsum.photos/seed/14/300/300',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_c8c8395863.mp3'
      }
    ]
  },
  {
    id: '3',
    name: 'Rock Classics',
    coverImage: 'https://picsum.photos/seed/3/300/300',
    tracks: [
      {
        id: '5',
        title: 'Rock Riffs',
        artist: 'Artist Five',
        duration: '3:22',
        albumArt: 'https://picsum.photos/seed/15/300/300',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_d1718ab41b.mp3'
      }
    ]
  }
];