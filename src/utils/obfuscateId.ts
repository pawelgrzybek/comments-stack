// from 9fa908d6-ad9d-4c16-976c-03d7721002a4
// to   9fa908d6
// which is unique enough for frontend
export default (id: string): string => id.split("-")[0];
