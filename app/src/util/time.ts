export function todayYMD() {
  return new Date().toISOString().slice(0,10);
}
