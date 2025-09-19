// types/types.ts

export type Song = {
  name: string;
  path: string;
  url: string;
};

export type FavoriteRow = {
  song_path: string;
  song_name?: string;
};
