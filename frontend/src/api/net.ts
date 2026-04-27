export const netApi = {
  fetch(url: string) {
    return window.api.net.fetch(url);
  },

  fetchImage(url: string) {
    return window.api.net.fetchImage(url);
  },
};
